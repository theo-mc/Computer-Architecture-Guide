<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import { MIPS_PRE } from '@/data/mipsPresets.js';
  import { Logic as L } from '@/utils/logic.js';
  import { esc } from '@/utils/html.js';
  import { asm as asmHL, decorate as decorateHL } from '@/utils/hl.js';
  import { TEXT, SP0, hex8, parseKV, assemble, asmText, newMachine, rw, stepM, back } from '@/utils/mipsEngine.js';

  let { opts = {} } = $props();

  const OLD_MAP = {
    arr8: 'arr',
    arr12: 'arr',
    fgh: 'fgh',
    ps1q6: 'ps1q6',
    ps1q6b: 'ps1q6',
    ifelse: 'ifelse',
    loop: 'ps1q7',
    leaf: 'leaf',
    swap: 'swap'
  };

  const normPreset = (p) => OLD_MAP[p] || p;
  const keys = untrack(() =>
    opts.presets
      ? Array.from(new Set(opts.presets.map(normPreset))).filter((p) => MIPS_PRE[p])
      : Object.keys(MIPS_PRE)
  );
  const initCur = untrack(() => {
    const p = opts.preset ? normPreset(opts.preset) : null;
    return p && MIPS_PRE[p] ? p : keys[0];
  });

  const N = L.REGNAMES;
  const RCLASS = (i) =>
    i === 0 ? 'z' : i === 1 ? 'at' : i <= 3 ? 'v' : i <= 7 ? 'a' : i <= 15 || i === 24 || i === 25 ? 't' : i <= 23 ? 's' : i <= 27 ? 'k' : 'p';
  const FCOL = { op: 'op', rs: 'rs', rt: 'rt', rd: 'rd', shamt: 'sh', funct: 'fn', immediate: 'im', address: 'addr' };

  function fieldBar(r) {
    const f = r.fields || [];
    return `<div class="mpf f-${r.format}">${f
      .map((x) => {
        const bits = (x.value >>> 0).toString(2).padStart(x.width, '0');
        const val =
          x.name === 'immediate' && x.signed != null
            ? x.signed
            : x.name === 'address'
              ? hex8(x.value * 4)
              : x.name === 'rs' || x.name === 'rt' || x.name === 'rd'
                ? N[x.value]
                : x.value;
        return `<div class="mpf-c c-${FCOL[x.name]}" style="flex:${x.width}"><span class="mpf-n">${x.name}<i>${x.width}</i></span><span class="mpf-b">${bits}</span><span class="mpf-v">${esc(val)}</span></div>`;
      })
      .join('')}</div>`;
  }

  let cur = $state(initCur);
  let code = $state(MIPS_PRE[initCur].code);
  let regsTxt = $state(MIPS_PRE[initCur].regs);
  let draftCode = $state('');
  let draftRegs = $state('');
  let prog = $state(null);
  let machine = $state(null);
  let tick = $state(0);
  let editing = $state(false);
  let hexMode = $state(false);
  let bps = $state(new Set());
  let msg = $state(null);
  let timer = $state(0);
  let speed = $state(550);

  let codeBoxEl = $state(null);
  let execEl = $state(null);
  let edTaEl = $state(null);
  let edHlEl = $state(null);

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = 0;
    }
  }

  $effect(() => () => stop());

  function build() {
    stop();
    const P = assemble(code);
    const M = newMachine(P, parseKV(regsTxt));
    prog = P;
    machine = M;
    msg = P.errors.length ? { k: 'err', t: P.errors.join('  ·  ') } : null;
    tick++;
  }

  untrack(() => build());

  const fmt = (x) => (hexMode || Math.abs(x | 0) >= 0x400000 ? hex8(x) : String(x | 0));

  function hitBp() {
    const nx = machine.byAddr.get(machine.pc >>> 0);
    return nx && bps.has(nx.ln) && nx.k === 0;
  }

  function doStep() {
    const r = stepM(machine);
    msg = r.done && r.msg ? { k: 'ok', t: r.msg } : null;
    tick++;
  }

  function doRun() {
    let n = 0;
    msg = null;
    while (!machine.halted && n < 20000) {
      const r = stepM(machine);
      n++;
      if (r.error || r.done) {
        if (r.msg) msg = { k: 'ok', t: r.msg };
        break;
      }
      if (hitBp()) {
        msg = { k: 'warn', t: `Stopped at the breakpoint on line ${machine.byAddr.get(machine.pc >>> 0).ln}.` };
        break;
      }
    }
    if (n >= 20000) msg = { k: 'warn', t: 'Stopped after 20 000 instructions — is there an infinite loop?' };
    tick++;
  }

  function doPlay() {
    if (timer) {
      stop();
      return;
    }
    if (machine.halted) return;
    timer = setInterval(() => {
      doStep();
      if (machine.halted || hitBp()) {
        if (hitBp() && !machine.halted) {
          msg = { k: 'warn', t: `Paused at the breakpoint on line ${machine.byAddr.get(machine.pc >>> 0).ln}.` };
        }
        stop();
      }
    }, speed);
  }

  function doBack() {
    back(machine);
    msg = null;
    tick++;
  }

  function doReset() {
    build();
    editing = false;
  }

  function openEditor() {
    stop();
    draftCode = code;
    draftRegs = regsTxt;
    editing = true;
    queueMicrotask(() => {
      edTaEl?.focus();
    });
  }

  function assembleDraft() {
    code = draftCode;
    regsTxt = draftRegs;
    editing = false;
    bps = new Set();
    build();
  }

  function onPresetChange(k) {
    cur = k;
    code = MIPS_PRE[k].code;
    regsTxt = MIPS_PRE[k].regs;
    editing = false;
    bps = new Set();
    build();
  }

  function toggleBp(ln) {
    const next = new Set(bps);
    if (next.has(ln)) next.delete(ln);
    else next.add(ln);
    bps = next;
  }

  function syncEdScroll() {
    if (edHlEl && edTaEl) {
      edHlEl.scrollTop = edTaEl.scrollTop;
      edHlEl.scrollLeft = edTaEl.scrollLeft;
    }
  }

  function onEdKeydown(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const t = e.currentTarget;
      const st = t.selectionStart;
      draftCode = draftCode.slice(0, st) + '    ' + draftCode.slice(t.selectionEnd);
      queueMicrotask(() => {
        t.selectionStart = t.selectionEnd = st + 4;
      });
    }
  }

  const snap = $derived.by(() => {
    void tick;
    void hexMode;
    void bps;
    const M = machine;
    const P = prog;
    const done = M.halted;
    const stInfo = M.error
      ? ['err', 'error']
      : done
        ? ['ok', 'finished']
        : timer
          ? ['run', 'playing']
          : M.steps
            ? ['mid', 'paused']
            : ['idle', 'ready'];
    const m = msg || (M.error ? { k: 'err', t: M.error } : null);

    const byLine = {};
    P.text.forEach((r) => {
      (byLine[r.ln] = byLine[r.ln] || []).push(r);
    });
    const nxt = M.byAddr.get(M.pc >>> 0);
    const curLn = nxt && !done ? nxt.ln : -1;
    const lastLn = M.last ? M.last.r.ln : -1;
    const codeLines = P.lines.map((raw, i) => {
      const ln = i + 1;
      const rs = byLine[ln] || [];
      const isCur = ln === curLn;
      const isLast = ln === lastLn && !isCur;
      return { raw, ln, rs, isCur, isLast };
    });

    const u = new Set([29]);
    P.text.forEach((r) =>
      ['rs', 'rt', 'rd'].forEach((k) => {
        if (r[k] != null && r[k] !== 0) u.add(r[k]);
      })
    );
    Object.keys(parseKV(regsTxt)).forEach((k) => u.add(L.regNum(k)));
    if (P.text.some((r) => r.op === 'jal')) u.add(31);

    const prev = M.hist[M.hist.length - 1];
    const chRegs = M.last ? M.last.ch.regs : [];
    const chMem = M.last ? M.last.ch.mem : [];

    let execHtml = '';
    if (M.last) {
      const L2 = M.last;
      const chips = L2.ch.regs
        .map((r) => `<span class="mp-chip"><span class="tk-reg">${N[r]}</span> <s>${fmt(prev ? prev.regs[r] : 0)}</s> → <b>${fmt(M.regs[r])}</b></span>`)
        .concat(
          [...new Set(L2.ch.mem.map((a) => a - (a % 4)))].map(
            (a) => `<span class="mp-chip mem">Mem[<span class="tk-hex">${hex8(a)}</span>] → <b>${fmt(rw(M, a))}</b></span>`
          )
        );
      execHtml += `<div class="mp-card last"><div class="mp-ch"><span class="mp-tag t-last">just ran</span><span class="ref">line ${L2.r.ln}${
        L2.r.pseudo ? ` · part of <code>${esc(L2.r.src)}</code>` : ''
      }</span></div>
        <div class="mp-asm">${asmHL(asmText(L2.r))}</div><div class="mp-rtl">${esc(L2.rtl)}</div>
        <div class="mp-chips">${chips.length ? chips.join('') : '<span class="ref">no register or memory changed</span>'}</div>${
        L2.note ? `<div class="mp-note">${esc(L2.note)}</div>` : ''
      }</div>`;
    } else {
      execHtml += `<div class="mp-card last empty"><div class="mp-ch"><span class="mp-tag t-last">just ran</span></div><div class="ref">Nothing yet. Press <b>Step ▶</b> to run the first instruction.</div></div>`;
    }
    if (nxt && !done) {
      execHtml += `<div class="mp-card next"><div class="mp-ch"><span class="mp-tag t-next">next</span><span class="ref"><span class="tk-hex">${hex8(
        nxt.addr
      )}</span> · ${nxt.format}-format${
        nxt.pseudo ? ` · real instruction ${nxt.k + 1} of ${nxt.of} for <code>${esc(nxt.src)}</code>` : ''
      }</span></div>
        <div class="mp-asm">${asmHL(asmText(nxt))}</div>${fieldBar(nxt)}<div class="mp-hex">machine code <b class="tk-hex">${hex8(nxt.word)}</b></div>
        ${
          nxt.op === 'beq' || nxt.op === 'bne'
            ? `<div class="mp-note">Immediate = branch distance in instructions from PC + 4: (${hex8(nxt.tgt)} − ${hex8(nxt.addr + 4)}) ÷ 4 = ${nxt.imm}.</div>`
            : nxt.op === 'j' || nxt.op === 'jal'
              ? `<div class="mp-note">The 26-bit field holds the target address ÷ 4 (the top 4 bits come from the PC).</div>`
              : ''
        }</div>`;
    } else {
      execHtml += `<div class="mp-card next empty"><div class="mp-ch"><span class="mp-tag t-next">next</span></div><div class="ref">${
        M.error
          ? 'Stopped by an error — fix it, or press Back.'
          : done
            ? 'The program has finished. Press Back to rewind or Reset to start again.'
            : 'Nothing to run.'
      }</div></div>`;
    }

    const words = new Set();
    [...M.mem.keys()].forEach((a) => {
      if (a < 0x7f000000) words.add(a - (a % 4));
    });
    const lab = {};
    P.dataLabels.forEach(([n2, a]) => {
      (lab[a - (a % 4)] = lab[a - (a % 4)] || []).push(n2);
    });
    const ws = [...words].sort((x, y) => x - y);
    const labBase = {};
    let cl = null;
    let cb = 0;
    ws.forEach((a) => {
      if (lab[a]) {
        cl = lab[a][0];
        cb = a;
      }
      labBase[a] = cl ? `${cl}[${(a - cb) / 4}]` : '';
    });
    const acc = M.last && M.lastAddr != null && /^(lw|sw|lb|lbu|sb)$/.test(M.last.r.op) ? M.lastAddr - (M.lastAddr % 4) : null;
    const memRows = ws.map((a) => ({
      addr: a,
      chg: chMem.some((m2) => m2 - (m2 % 4) === a),
      acc: acc === a,
      accLabel: acc === a ? (M.last.r.op[0] === 'l' ? '◀ read' : '◀ write') : '',
      lab: labBase[a] || '',
      val: fmt(rw(M, a))
    }));

    const sp = M.regs[29] >>> 0;
    const fp = M.regs[30] >>> 0;
    const stkRows = [];
    for (let a = SP0; a >= Math.min(sp, SP0) - 12 && stkRows.length < 48; a -= 4) stkRows.push(a);
    const depthOf = (a) => {
      let d = -1;
      M.calls.forEach((c, j) => {
        if (a < c.sp && a >= sp) d = j;
      });
      return d;
    };
    const stackRows = stkRows.map((a) => {
      const inUse = a >= sp && a < SP0;
      const c = chMem.some((m2) => m2 - (m2 % 4) === a);
      const has = M.mem.has(a);
      const val = rw(M, a);
      const ri = val >>> 0 >= TEXT && M.byAddr.get(val >>> 0);
      const d = inUse ? depthOf(a) : -1;
      return { a, inUse, top: a === SP0, chg: c, d, has, val: fmt(val), ri, sp: a === sp, fp: a === fp && fp, callName: d >= 0 && a === M.calls[d].sp - 4 ? M.calls[d].name : '' };
    });

    return {
      done,
      stInfo,
      m,
      pc: M.pc,
      steps: M.steps,
      canBack: M.hist.length > 0 && !timer,
      canStep: !done && !timer,
      canPlay: !(done && !timer),
      codeLines,
      execHtml,
      usedRegs: u,
      chRegs,
      prevRegs: prev ? prev.regs : null,
      regs: Array.from(M.regs),
      memRows,
      stackRows,
      sp,
      calls: M.calls.slice(),
      out: M.out || ''
    };
  });

  $effect(() => {
    void snap.execHtml;
    if (execEl) {
      execEl.innerHTML = snap.execHtml;
      decorateHL(execEl);
    }
  });

  $effect(() => {
    void snap.codeLines;
    void editing;
    if (!editing && codeBoxEl) {
      const c = codeBoxEl.querySelector('.mp-ln.cur') || codeBoxEl.querySelector('.mp-ln.last');
      if (c) {
        const top = c.offsetTop;
        const hgt = codeBoxEl.clientHeight;
        if (top < codeBoxEl.scrollTop + 30 || top > codeBoxEl.scrollTop + hgt - 60) {
          codeBoxEl.scrollTop = Math.max(0, top - hgt / 3);
        }
      }
    }
  });
</script>

<ToolShell
  title="MIPS step-through"
  sub="assemble · step forwards and backwards · registers, memory and stack"
  className={editing ? 'mp editing' : 'mp'}
>
  <div class="mp-bar">
    <label class="mp-pick">
      <span>Example</span>
      <select value={cur} onchange={(e) => onPresetChange(e.currentTarget.value)}>
        {#each keys as k}
          <option value={k}>{MIPS_PRE[k].name}</option>
        {/each}
      </select>
    </label>
    <div class="mp-ctl">
      <button type="button" class="mbtn" title="Back to the start (R)" onclick={doReset}><span class="ic">⏮</span>Reset</button>
      <button type="button" class="mbtn" title="Undo one instruction (←)" disabled={!snap.canBack} onclick={doBack}><span class="ic">◀</span>Back</button>
      <button type="button" class="mbtn go" title="Run one instruction (→)" disabled={!snap.canStep} onclick={doStep}>Step<span class="ic">▶</span></button>
      <button type="button" class="mbtn" class:on={!!timer} title="Step automatically" disabled={!snap.canPlay} onclick={doPlay}>
        <span class="ic">{timer ? '⏸' : '▶▶'}</span><span>{timer ? 'Pause' : 'Play'}</span>
      </button>
      <button type="button" class="mbtn" title="Run to the end or the next breakpoint" disabled={!snap.canStep} onclick={doRun}>
        Run all<span class="ic">⏭</span>
      </button>
    </div>
    <div class="mp-opts">
      <div class="seg mini" role="group" aria-label="play speed">
        <button
          type="button"
          aria-pressed={speed !== 140}
          onclick={() => {
            speed = 550;
            if (timer) { stop(); doPlay(); }
          }}
        >
          slow
        </button>
        <button
          type="button"
          aria-pressed={speed === 140}
          onclick={() => {
            speed = 140;
            if (timer) { stop(); doPlay(); }
          }}
        >
          fast
        </button>
      </div>
      <div class="seg mini" role="group" aria-label="number format">
        <button type="button" aria-pressed={!hexMode} onclick={() => (hexMode = false)}>dec</button>
        <button type="button" aria-pressed={hexMode} onclick={() => (hexMode = true)}>hex</button>
      </div>
      <button type="button" class="mbtn" title="Write your own program" disabled={editing} onclick={openEditor}>✎ Edit</button>
    </div>
  </div>

  <div class="mp-status">
    <span class="mp-st st-{snap.stInfo[0]}">{snap.stInfo[1]}</span>
    <span class="mp-kv">PC <b class="tk-hex">{hex8(snap.pc)}</b></span>
    <span class="mp-kv">steps <b class="tk-num">{snap.steps}</b></span>
    <span class="mp-kv">breakpoints <b class="tk-num">{bps.size}</b></span>
    <span class="mp-msg {snap.m ? 'm-' + snap.m.k : ''}" title={snap.m ? snap.m.t : ''}>{snap.m ? snap.m.t : ''}</span>
  </div>

  <div class="mp-main">
    <div class="mp-pane mp-codep">
      <div class="mp-ph">
        <span>Program</span>
        <span class="mp-legend"><i class="lg cur"></i>next <i class="lg last"></i>just ran <i class="lg bp"></i>breakpoint · click a line number</span>
      </div>
      <div class="mp-code" bind:this={codeBoxEl}>
        {#if editing}
          <div class="mp-ed">
            <div class="mp-edw">
              <pre class="mp-edhl" aria-hidden="true" bind:this={edHlEl}>{@html asmHL(draftCode) + '\n'}</pre>
              <textarea
                bind:this={edTaEl}
                bind:value={draftCode}
                onscroll={syncEdScroll}
                onkeydown={onEdKeydown}
                spellcheck="false"
                autocapitalize="off"
                autocomplete="off"
                aria-label="program"
              ></textarea>
            </div>
            <div class="mp-edbar">
              <label>Starting registers <input bind:value={draftRegs} placeholder="$s1=10, $s2=20" /></label>
              <button type="button" class="mbtn go" onclick={assembleDraft}>Assemble ▸</button>
              <button type="button" class="mbtn" onclick={() => (editing = false)}>Cancel</button>
            </div>
          </div>
        {:else}
          <div class="mp-list">
            {#each snap.codeLines as lnInfo}
              <div class="mp-ln" class:cur={lnInfo.isCur} class:last={lnInfo.isLast} class:ins={lnInfo.rs.length > 0}>
                <button
                  type="button"
                  class="mp-no"
                  class:bp={bps.has(lnInfo.ln)}
                  disabled={lnInfo.rs.length === 0}
                  tabindex={lnInfo.rs.length === 0 ? -1 : 0}
                  aria-label="breakpoint on line {lnInfo.ln}"
                  onclick={() => toggleBp(lnInfo.ln)}
                >
                  {lnInfo.ln}
                </button>
                <span class="mp-arrow">{lnInfo.isCur ? '▶' : ''}</span>
                <span class="mp-addr">{lnInfo.rs.length ? hex8(lnInfo.rs[0].addr).slice(6) : ''}</span>
                <span class="mp-src">
                  {@html asmHL(lnInfo.raw) || ' '}
                  {#if lnInfo.rs.length && (lnInfo.rs.length > 1 || lnInfo.rs[0].pseudo)}
                    <div class="mp-exp">
                      {#each lnInfo.rs as r}
                        <span class:on={r.addr === snap.pc && !snap.done}>
                          <i>{hex8(r.addr).slice(6)}</i>{@html asmHL(asmText(r))}
                        </span>
                      {/each}
                    </div>
                  {/if}
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div class="mp-pane mp-execp">
      <div class="mp-ph"><span>What happens</span></div>
      <div class="mp-exec" bind:this={execEl}></div>
    </div>
  </div>

  <div class="mp-lower">
    <div class="mp-pane">
      <div class="mp-ph"><span>Registers</span><span class="mp-legend"><i class="lg chg"></i>just changed · faded = unused</span></div>
      <div class="mp-regs">
        <div class="mp-rg">
          {#each N as n, i}
            {@const changed = snap.chRegs.includes(i)}
            <div
              class="mp-r r-{RCLASS(i)}"
              class:chg={changed}
              class:used={snap.usedRegs.has(i)}
              title="register {i}{changed && snap.prevRegs ? ' · was ' + fmt(snap.prevRegs[i]) : ''}"
            >
              <span class="rn">{n}</span>
              <span class="rv">{fmt(snap.regs[i])}</span>
              <span class="rw"></span>
            </div>
          {/each}
          <div class="mp-r r-pc used">
            <span class="rn">PC</span>
            <span class="rv">{hex8(snap.pc)}</span>
            <span class="rw"></span>
          </div>
        </div>
      </div>
    </div>

    <div class="mp-pane">
      <div class="mp-ph"><span>Data memory</span><span class="mp-legend">words · big-endian</span></div>
      <div class="mp-mem">
        {#if snap.memRows.length}
          <div class="mp-mt">
            {#each snap.memRows as mRow}
              <div class="mp-mr" class:chg={mRow.chg} class:acc={mRow.acc}>
                <span class="ma tk-hex">{hex8(mRow.addr)}</span>
                <span class="ml">{mRow.lab}</span>
                <span class="mv">{mRow.val}</span>
                <span class="mx">{mRow.accLabel}</span>
              </div>
            {/each}
          </div>
        {:else}
          <div class="mp-empty">No data. Add a <code>.data</code> section with <code>.word</code> values.</div>
        {/if}
      </div>
    </div>

    <div class="mp-pane">
      <div class="mp-ph"><span>Stack</span><span class="mp-legend">grows down ↓</span></div>
      <div class="mp-stack">
        <div class="mp-stk">
          {#each snap.stackRows as sRow}
            <div class="mp-s {sRow.inUse ? 'used' : sRow.top ? 'top' : 'free'} {sRow.d >= 0 ? 'fr fr' + (sRow.d % 4) : ''}" class:chg={sRow.chg}>
              <span class="mp-sa">{hex8(sRow.a).slice(2)}</span>
              <span class="mp-sv">
                {#if sRow.has}
                  {sRow.val}{#if sRow.ri}{' '}<i title="return address: line {sRow.ri.ln}">↩{sRow.ri.ln}</i>{/if}
                {:else if sRow.inUse}
                  0
                {/if}
              </span>
              <span class="mp-sp">
                {sRow.sp ? '◀ $sp' : ''}{sRow.fp ? ' ◀ $fp' : ''}{#if sRow.callName}<em>{sRow.callName}</em>{/if}
              </span>
            </div>
          {/each}
        </div>
        <div class="mp-sfoot">
          {#if snap.sp === SP0}
            empty — $sp at its start
          {:else if snap.sp < SP0}
            <b class="tk-num">{(SP0 - snap.sp) / 4}</b> word{(SP0 - snap.sp) / 4 === 1 ? '' : 's'} pushed (<b class="tk-num">{SP0 - snap.sp}</b> bytes)
          {:else}
            more pops than pushes!
          {/if}
        </div>
      </div>
    </div>
  </div>

  <div class="mp-foot">
    <div class="mp-pane">
      <div class="mp-ph"><span>Call stack</span></div>
      <div class="mp-calls">
        {#if snap.calls.length}
          <ol class="mp-cl">
            {#each snap.calls as c, j}
              <li class="fr{j % 4}">
                <b>{c.name}</b>
                <span>returns to <span class="tk-hex">{hex8(c.ret)}</span></span>
              </li>
            {/each}
          </ol>
        {:else}
          <div class="mp-empty">Not inside a procedure. <code>jal</code> pushes a call; <code>jr $ra</code> pops it.</div>
        {/if}
      </div>
    </div>

    <div class="mp-pane">
      <div class="mp-ph"><span>Console</span><span class="mp-legend">syscall output</span></div>
      <pre class="mp-out">{snap.out}</pre>
    </div>
  </div>

  <div class="mp-fab" aria-label="step controls">
    <button type="button" class="mbtn" aria-label="back one instruction" disabled={!snap.canBack} onclick={doBack}>◀</button>
    <button type="button" class="mbtn go" disabled={!snap.canStep} onclick={doStep}>Step ▶</button>
    <button type="button" class="mbtn" class:on={!!timer} disabled={!snap.canPlay} onclick={doPlay}>
      <span class="ic">{timer ? '⏸' : '▶▶'}</span><span>{timer ? 'Pause' : 'Play'}</span>
    </button>
    <span class="mp-fpc"><b class="tk-num">{snap.steps}</b> steps · <span class="tk-hex">{hex8(snap.pc).slice(6)}</span></span>
  </div>
</ToolShell>
