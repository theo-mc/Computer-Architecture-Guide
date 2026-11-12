<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import { Logic } from '$utils/logic.js';
  import { esc } from '$utils/html.js';
  import { snugScroll } from '$utils/math.js';
  import { decorate as decorateHL } from '$utils/hl.js';
  import { PD, pdAsm, pdText, pdLegend, pipeSVG } from '$utils/svg.js';

  let { opts = {} } = $props();

  const PIPE_PRESETS = {
    ideal: { name: 'Four independent adds (L11 s13)', code: 'add $t0, $s0, $s1\nadd $t1, $s2, $s3\nadd $t2, $s4, $s5\nadd $t3, $s6, $s7' },
    l13: { name: 'Five instructions (L13 s8)', code: 'lw  $10, 20($1)\nsub $11, $2, $3\nadd $12, $3, $4\nlw  $13, 24($1)\nadd $14, $5, $6' },
    l15: { name: 'sub then four users of $2 (L15 s4)', code: 'sub $2, $1, $3\nand $12, $2, $5\nor  $13, $6, $2\nadd $14, $2, $2\nsw  $15, 100($2)' },
    l14: { name: 'Dependent adds (L14 s6)', code: 'Add R2, R4, R5\nAdd R8, R2, R6' },
    l16: { name: 'Load-use (L16 s11)', code: 'lw  $2, 20($1)\nand $4, $2, $5\nor  $8, $2, $6\nadd $9, $4, $2\nslt $1, $6, $7' },
    ps3: { name: 'PS3 Q4', code: 'lw  $s0, -12($t1)\nadd $t0, $s1, $s0\nxor $t2, $s2, $s1\nsub $s3, $t3, $t1' },
    pt: { name: 'Practice Test Q4', code: 'lw  $t5, -16($t4)\nsw  $t1, -12($t5)\nadd $t4, $t5, $t1\nlw  $t3, -12($s1)\nsub $t2, $t3, $t1' },
    st: { name: 'Structural: one memory (L14 s9)', code: 'lw  $t1, 0($s0)\nadd $t2, $s1, $s2\nadd $t3, $s3, $s4\nadd $t4, $s5, $s6\nadd $t5, $s6, $s7', singleMem: true },
    r1: { name: 'Loop body (R1 s29)', code: 'lw   $t0, 0($s1)\naddu $t0, $t0, $s2\nsw   $t2, 0($s1)\naddi $s1, $s1, -4' }
  };

  const keys = untrack(() => opts.presets || Object.keys(PIPE_PRESETS));
  const initPre = untrack(() => opts.preset || keys[0]);
  const uid = 'ps' + Math.random().toString(36).slice(2, 7);

  let presetKey = $state(initPre);
  let code = $state(PIPE_PRESETS[initPre].code);
  let ins = $state([]);
  let orig = $state([]);
  let order = $state([]);
  let errs = $state([]);
  let fwd = $state(untrack(() => !!opts.fwd));
  let sm = $state(!!PIPE_PRESETS[initPre].singleMem);
  let view = $state('op');
  let cyc = $state(1);
  let timer = $state(0);
  let editing = $state(false);
  let width = $state(700);

  let diaEl = $state(null);
  let evEl = $state(null);
  let codeEl = $state(null);
  let savedScrollLeft = 0;

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = 0;
    }
  }

  $effect(() => () => stop());

  function parseProgram(resetOrig, startAtOne = false) {
    stop();
    const pp = Logic.parsePipeProgram(code);
    ins = pp.instrs;
    errs = pp.errors;
    if (resetOrig) {
      orig = pp.instrs.slice();
      order = pp.instrs.map((_, i) => i);
    }
    const s = Logic.simulate(pp.instrs, { fwd, singleMem: sm });
    cyc = startAtOne ? 1 : s.total;
  }

  function loadPreset(k) {
    presetKey = k;
    const pr = PIPE_PRESETS[k];
    code = pr.code;
    sm = !!pr.singleMem;
    parseProgram(true);
  }

  function rerun(toEnd = true) {
    stop();
    const s = Logic.simulate(ins, { fwd, singleMem: sm });
    cyc = toEnd ? s.total : Math.min(Math.max(1, cyc), s.total);
  }

  // Initial simulation matching original tool
  untrack(() => {
    parseProgram(true, opts.startAt === 1);
  });

  function move(i, dd) {
    const j = i + dd;
    if (j < 0 || j >= ins.length) return;
    const nextIns = ins.slice();
    const nextOrder = order.slice();
    [nextIns[i], nextIns[j]] = [nextIns[j], nextIns[i]];
    [nextOrder[i], nextOrder[j]] = [nextOrder[j], nextOrder[i]];
    ins = nextIns;
    order = nextOrder;
    code = nextIns.map((x) => x.text).join('\n');
    rerun(true);
  }

  function togglePlay() {
    if (timer) {
      stop();
      return;
    }
    if (cyc >= sim.total) cyc = 0;
    timer = setInterval(() => {
      if (cyc + 1 >= sim.total) {
        cyc = sim.total;
        stop();
      } else {
        cyc++;
      }
    }, 650);
    cyc++;
  }

  const sim = $derived(Logic.simulate(ins, { fwd, singleMem: sm }));
  const sim0 = $derived(Logic.simulate(orig, { fwd, singleMem: sm }));
  const deps = $derived(Logic.deps(ins));
  const rawSet = $derived(new Set(deps.raw.map((x) => x.j)));
  const moved = $derived(order.some((v, i) => v !== i));
  const ck = $derived(Logic.checkOrder(orig, order));
  const narrow = $derived(width < 620);

  const diaHtml = $derived.by(() => {
    const T = sim.total;
    if (view === 'op') {
      return pipeSVG(ins, sim, { cyc, asm: pdText, id: uid, minRows: 5, lw: narrow ? 136 : 170, cw: narrow ? 40 : 44 });
    }
    const rv = Logic.resourceView(sim);
    const ST = ['IF', 'ID', 'EX', 'MEM', 'WB'];
    const CW = 44, LW = 70, Wd = LW + T * CW + 10, Hd = 26 + 5 * 30 + 8;
    let g = '';
    for (let c = 1; c <= T; c++) g += `<text x="${LW + (c - 1) * CW + CW / 2}" y="17" class="pd-cn ${c === cyc ? 'now' : ''}">${c}</text>`;
    g += `<rect x="${LW + (cyc - 1) * CW}" y="2" width="${CW}" height="${Hd - 4}" rx="6" class="pd-now"/>`;
    ST.forEach((sN, k) => {
      const y = 26 + k * 30;
      g += `<text x="8" y="${y + 19}" class="pd-i" style="fill:${PD[sN]}">${sN}</text>`;
      for (let c = 1; c <= T; c++) {
        const i = rv[sN][c];
        if (i == null) continue;
        const x = LW + (c - 1) * CW + 2;
        g += `<g class="pd-s ${c > cyc ? 'fut' : ''}" style="--pc:${PD[sN]}"><rect x="${x}" y="${y + 3}" width="${CW - 4}" height="24" rx="6"/><text x="${x + (CW - 4) / 2}" y="${y + 19}">I${i + 1}</text></g>`;
      }
    });
    return `<svg viewBox="0 0 ${Wd} ${Hd}" width="${Wd}" height="${Hd}" class="pd-svg">${g}</svg>`;
  });

  $effect.pre(() => {
    void cyc;
    void view;
    void sim;
    void width;
    if (!diaEl) return;
    const sc = diaEl.querySelector('.pd-scroll') || diaEl;
    savedScrollLeft = sc.scrollLeft;
  });

  $effect(() => {
    void diaHtml;
    void cyc;
    void narrow;
    if (!diaEl) return;
    const sc = diaEl.querySelector('.pd-scroll') || diaEl;
    sc.scrollLeft = savedScrollLeft;
    snugScroll(diaEl);
    const nowX = (sc === diaEl ? 70 : 8) + (cyc - 1) * (sc === diaEl ? 44 : narrow ? 40 : 44);
    if (nowX < sc.scrollLeft + 40 || nowX > sc.scrollLeft + sc.clientWidth - 60) {
      sc.scrollLeft = Math.max(0, nowX - sc.clientWidth / 2);
    }
  });

  const sayText = (l) =>
    l === 'stall'
      ? 'stalled — waits; a bubble goes into the next stage'
      : l === 'IF*'
        ? 'held in IF (the instruction ahead is stalled)'
        : {
            IF: 'fetched from instruction memory',
            ID: 'decoded, registers read',
            EX: 'in the ALU',
            MEM: 'data memory (loads / stores)',
            WB: 'writing its result back'
          }[l];

  const atCyc = $derived(sim.rows.map((r, i) => [i, Logic.cell(r, cyc)]).filter((x) => x[1]));
  const eventsSoFar = $derived(sim.events.filter((e) => (e.cycle || sim.rows[e.i].IDs + 1) <= cyc));

  $effect(() => {
    void eventsSoFar;
    if (evEl) decorateHL(evEl);
  });

  const legHtml = pdLegend();
</script>

<ToolShell title="Pipeline simulator" sub="5-stage MIPS · step cycle by cycle · try forwarding and reordering">
  <div class="ps" bind:clientWidth={width}>
    <div class="ps-bar">
      <label class="mp-pick">
        <span>Example</span>
        <select value={presetKey} onchange={(e) => loadPreset(e.currentTarget.value)}>
          {#each keys as k}
            <option value={k}>{PIPE_PRESETS[k].name}</option>
          {/each}
        </select>
      </label>
      <div class="ps-tg">
        <span>Forwarding</span>
        <div class="seg mini">
          <button type="button" aria-pressed={!fwd} onclick={() => { fwd = false; rerun(true); }}>off</button>
          <button type="button" aria-pressed={fwd} onclick={() => { fwd = true; rerun(true); }}>on</button>
        </div>
      </div>
      <div class="ps-tg">
        <span>Memory</span>
        <div class="seg mini">
          <button type="button" aria-pressed={!sm} onclick={() => { sm = false; rerun(true); }}>split I/D</button>
          <button type="button" aria-pressed={sm} onclick={() => { sm = true; rerun(true); }}>one shared</button>
        </div>
      </div>
      <div class="ps-tg">
        <span>View</span>
        <div class="seg mini">
          <button type="button" aria-pressed={view === 'op'} onclick={() => (view = 'op')}>instructions</button>
          <button type="button" aria-pressed={view === 'res'} onclick={() => (view = 'res')}>stages</button>
        </div>
      </div>
    </div>

    <div class="ps-mid">
      <div class="mp-pane ps-prog">
        <div class="mp-ph">
          <span>Program</span>
          <span class="mp-legend">↑↓ reorder</span>
          <button
            type="button"
            class="mbtn sm"
            disabled={editing}
            onclick={() => {
              editing = true;
              queueMicrotask(() => codeEl?.focus());
            }}
          >
            ✎ Edit
          </button>
        </div>
        <div class="ps-list" hidden={editing}>
          {#if errs.length}
            <div class="err-msg">{errs.join(' · ')}</div>
          {/if}
          {#each ins as x, i}
            <div class="ps-row" class:dep={rawSet.has(i)}>
              <span class="ps-n">I{order[i] + 1}</span>
              <code class="asm">{@html pdAsm(x.text)}</code>
              <span class="ps-mv">
                <button type="button" disabled={i === 0} aria-label="move up" onclick={() => move(i, -1)}>↑</button>
                <button type="button" disabled={i === ins.length - 1} aria-label="move down" onclick={() => move(i, 1)}>↓</button>
              </span>
            </div>
          {/each}
        </div>
        <div class="ps-ed" hidden={!editing}>
          <textarea bind:this={codeEl} bind:value={code} spellcheck="false" aria-label="program"></textarea>
          <div class="mp-edbar">
            <button type="button" class="mbtn go" onclick={() => { parseProgram(true); editing = false; }}>Use this program</button>
            <button type="button" class="mbtn" onclick={() => { code = ins.map((x) => x.text).join('\n'); editing = false; }}>Cancel</button>
          </div>
        </div>
      </div>

      <div class="ps-stats">
        <div class="ps-tiles">
          <div class="ps-tile" style="--tc:var(--c-blue)">
            <span>instructions N</span><b>{ins.length}</b><i>&nbsp;</i>
          </div>
          <div class="ps-tile" style="--tc:var(--c-teal)">
            <span>total cycles</span><b>{sim.total}</b><i>ideal N + 4 = {sim.ideal}</i>
          </div>
          <div class="ps-tile" style="--tc:{sim.stalls ? 'var(--c-red)' : 'var(--c-green)'}">
            <span>stall cycles S</span>
            <b>{sim.stalls}</b>
            <i>{moved ? `was ${sim0.stalls} before reordering` : fwd ? 'with forwarding' : 'no forwarding'}</i>
          </div>
          <div class="ps-tile" style="--tc:var(--c-orange)">
            <span>CPI = (N+S)/N</span><b>{ins.length ? Logic.fmt(sim.cpi, 3) : '—'}</b><i>&nbsp;</i>
          </div>
        </div>
        <div class="ps-deps">
          <span class="dp-raw"><b>{deps.raw.length}</b> RAW</span>
          <span class="dp-war"><b>{deps.war.length}</b> WAR</span>
          <span class="dp-waw"><b>{deps.waw.length}</b> WAW</span>
          <span class="ref">only RAW can stall this in-order pipeline</span>
        </div>
        <div class="ps-chk {!moved ? '' : ck.ok ? 'ok' : 'bad'}">
          {#if !moved}
            Original order. Move instructions with ↑ ↓ to try to hide stalls.
          {:else if ck.ok}
            ✓ Safe reordering — every dependency keeps its order.{ck.memWarn.length ? ' ⚠ ' + ck.memWarn[0] : ''}
          {:else}
            ✗ Changes the result: {ck.bad.join('; ')}
          {/if}
        </div>
      </div>
    </div>

    <div class="ps-ctl">
      <button type="button" class="mbtn" title="first cycle" disabled={cyc <= 1} onclick={() => { stop(); cyc = 1; }}>⏮</button>
      <button type="button" class="mbtn" disabled={cyc <= 1} onclick={() => { stop(); cyc = Math.max(1, cyc - 1); }}>◀ cycle</button>
      <button type="button" class="mbtn go" disabled={cyc >= sim.total} onclick={() => { stop(); cyc = Math.min(sim.total, cyc + 1); }}>cycle ▶</button>
      <button type="button" class="mbtn" class:on={!!timer} onclick={togglePlay}>
        <span>{timer ? '⏸ pause' : '▶▶ play'}</span>
      </button>
      <button type="button" class="mbtn" disabled={cyc >= sim.total} onclick={() => { stop(); cyc = sim.total; }}>⏭ all</button>
      <span class="ps-cyc">cycle <b class="tk-num">{cyc}</b> of <b class="tk-num">{sim.total}</b></span>
      <span class="ps-pbar"><i style="width:{(100 * cyc) / Math.max(1, sim.total)}%"></i></span>
    </div>

    <div class="ps-dia" bind:this={diaEl}>{@html diaHtml}</div>
    {@html legHtml}

    <div class="ps-low">
      <div class="mp-pane">
        <div class="mp-ph"><span>Cycle {cyc}</span></div>
        <div class="ps-now">
          {#if atCyc.length}
            <ul class="ps-ul">
              {#each atCyc as [i, l]}
                <li>
                  <span class="pd-chip" style="--pc:{PD[l] || 'var(--c-red)'}">{l === 'IF*' ? 'IF' : l}</span>
                  <b>I{i + 1}</b>
                  <code class="asm">{@html pdAsm(ins[i].text)}</code>
                  <span class="ref">{sayText(l)}</span>
                </li>
              {/each}
            </ul>
          {:else}
            <div class="mp-empty">Pipeline empty.</div>
          {/if}
        </div>
      </div>

      <div class="mp-pane">
        <div class="mp-ph"><span>Hazards &amp; forwarding so far</span></div>
        <div class="ps-ev" bind:this={evEl}>
          {#if eventsSoFar.length}
            <ul class="ps-ul">
              {#each eventsSoFar as e}
                <li class="ev-{e.kind}">
                  <span class="ev-k">{{ fwd: 'forward', rf: 'reg file', data: 'stall', struct: 'structural' }[e.kind]}</span>
                  {e.text}
                </li>
              {/each}
            </ul>
          {:else}
            <div class="mp-empty">No hazards yet.</div>
          {/if}
        </div>
      </div>
    </div>
  </div>
</ToolShell>
