<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import StepsList from '@/components/content/StepsList.svelte';
  import { Logic } from '@/utils/logic.js';
  import { TK } from '@/utils/toolKit.js';
  import { esc } from '@/utils/html.js';
  import { snugScroll } from '@/utils/math.js';
  import { pdText } from '@/utils/svg.js';
  import { STG, SC, LAT, PROG, CNAME, vizModel, vizF, vizH, uid as mkUid } from '@/utils/viz.js';

  const R = String.raw;
  let { opts = {} } = $props();

  const uid = mkUid('rc');
  const X0 = 156, X1 = 908, W = 920;

  let prog = $state(untrack(() => opts.prog || 'l13'));
  let latK = $state(untrack(() => opts.lat || 'l12'));
  let haz = $state(untrack(() => opts.haz || 'ideal'));
  let playing = $state(false);
  let fresh = $state(true);

  const initM = untrack(() => vizModel(PROG[opts.prog || 'l13'].code, opts.lat || 'l12', opts.haz || 'ideal'));
  const initT = untrack(() => Math.max(initM.TS, initM.TM, initM.TP));
  let t = $state(untrack(() => (opts.t != null ? Math.min(opts.t, initT) : initT)));

  let cvEl = $state(null);
  let rafId = 0;
  let lastTs = 0;

  function stopPlay() {
    playing = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    lastTs = 0;
  }

  $effect(() => () => stopPlay());

  const M = $derived(vizModel(PROG[prog].code, latK, haz));
  const totalT = $derived(Math.max(M.TS, M.TM, M.TP));
  const X = (x) => X0 + ((X1 - X0) * x) / totalT;

  function startPlay() {
    if (playing) return;
    if (t >= totalT - 1e-6) t = 0;
    playing = true;
    lastTs = 0;
    const tick = (ts) => {
      if (!playing) return;
      const dt = lastTs ? Math.min(80, ts - lastTs) : 16;
      lastTs = ts;
      const next = t + (dt * totalT) / 9000;
      if (next >= totalT) {
        t = totalT;
        stopPlay();
        return;
      }
      t = next;
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }

  function stepEdge() {
    fresh = false;
    stopPlay();
    t = Math.min(totalT, (Math.floor(t / M.tcM + 1e-6) + 1) * M.tcM);
  }

  function resetRace() {
    fresh = false;
    stopPlay();
    t = 0;
  }

  function setHaz(h) {
    stopPlay();
    haz = h;
    const nm = vizModel(PROG[prog].code, latK, h);
    const nT = Math.max(nm.TS, nm.TM, nm.TP);
    if (t > nT) t = nT;
  }

  function onProgramOrLatChange() {
    stopPlay();
    t = 0;
  }

  const staticView = $derived.by(() => {
    const { ins, N, rows, cl, unit, tcS, tcM, single, multi, sim } = M;
    const T = totalT;
    const yA = 34, hA = 28, yB = 104, hB = 28, yC = 178, rh = 18, yAx = yC + N * rh + 10, Hh = yAx + 30;
    let g = `<defs><pattern id="${uid}h" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.6" height="5" class="rc-hatch"/></pattern><pattern id="${uid}s" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="6" class="pd-hatch"/></pattern></defs>`;
    for (let c = 0; c * tcS <= M.TS + 1e-9; c++) {
      g += `<line x1="${X(c * tcS)}" x2="${X(c * tcS)}" y1="${yA - 4}" y2="${yA + hA + 4}" class="rc-edge"/>`;
    }
    const wave = (y, per, end) => {
      let d = `M${X(0)} ${y + 7}`;
      for (let c = 0; c * per < end - 1e-9; c++) {
        const a = X(c * per), m = X(c * per + per / 2), e = X((c + 1) * per);
        d += ` L${a} ${y} L${m} ${y} L${m} ${y + 7} L${e} ${y + 7}`;
      }
      return `<path d="${d}" class="rc-wave"/>`;
    };
    const segs = (x, w, y, h, s, d, per, idle) => {
      const ww = d != null ? (w * d) / per : 0;
      let r = '';
      if (idle) r += `<rect x="${x}" y="${y}" width="${w}" height="${h}" class="rc-idle" style="--pc:${SC[STG[s]]}"/>`;
      else {
        r += `<rect x="${x}" y="${y}" width="${Math.max(0, ww)}" height="${h}" class="rc-seg" style="--pc:${SC[STG[s]]}"/>`;
        if (w - ww > 0.6) r += `<rect x="${x + ww}" y="${y}" width="${w - ww}" height="${h}" fill="url(#${uid}h)" class="rc-pad"/>`;
      }
      if (w > 15) r += `<text x="${x + (idle || ww < 15 ? w / 2 : ww / 2)}" y="${y + h / 2 + 3.5}" class="rc-st ${idle ? 'idle' : ''}">${STG[s]}</text>`;
      return r;
    };

    g += `<text x="6" y="${yA + 11}" class="rc-lt">single-cycle</text><text x="6" y="${yA + 25}" class="rc-ls">clock ${vizF(tcS)} ${unit} · CPI 1</text>`;
    single.forEach((I) => {
      const x = X(I.t0), w = X(I.t1) - x;
      g += `<text x="${x + 3}" y="${yA - 6}" class="rc-il">I${I.k + 1} ${esc(ins[I.k].op)}</text>`;
      I.seg.forEach((sg) => {
        const sx = X(sg.t0), sw = X(sg.t1) - sx;
        g += `<rect x="${sx}" y="${yA}" width="${sw}" height="${hA}" class="rc-seg" style="--pc:${SC[STG[sg.s]]}"/>${
          sw > STG[sg.s].length * 5.6 + 2 ? `<text x="${sx + sw / 2}" y="${yA + hA / 2 + 3.5}" class="rc-st">${STG[sg.s]}</text>` : ''
        }`;
      });
      const sx = X(I.t0 + I.work);
      if (X(I.t1) - sx > 0.6) g += `<rect x="${sx}" y="${yA}" width="${X(I.t1) - sx}" height="${hA}" fill="url(#${uid}h)" class="rc-pad"/>`;
      g += `<rect x="${x}" y="${yA}" width="${w}" height="${hA}" class="rc-box"/>`;
    });
    g += wave(yA + hA + 6, tcS, M.TS);

    g += `<text x="6" y="${yB + 11}" class="rc-lt">multi-cycle</text><text x="6" y="${yB + 25}" class="rc-ls">clock ${vizF(tcM)} ${unit} · CPI ${vizF(M.cycM / N)}</text>`;
    multi.forEach((I) => {
      const x = X(I.c0 * tcM), w = X((I.c0 + I.n) * tcM) - x;
      g += `<text x="${x + 3}" y="${yB - 6}" class="rc-il">I${I.k + 1} ${esc(ins[I.k].op)} ×${I.n}</text>`;
      I.cells.forEach((c) => {
        g += segs(X(c.c * tcM), X((c.c + 1) * tcM) - X(c.c * tcM), yB, hB, c.s, c.d, tcM);
      });
      g += `<rect x="${x}" y="${yB}" width="${w}" height="${hB}" class="rc-box"/>`;
    });
    g += wave(yB + hB + 6, tcM, M.TM);

    g += `<text x="6" y="${yC - 12}" class="rc-lt">pipelined</text><text x="${X0}" y="${yC - 12}" class="rc-ls">clock ${vizF(tcM)} ${unit} · ${sim.total} cycles for ${N} instructions${
      sim.stalls ? ' · ' + sim.stalls + ' stall cycle' + (sim.stalls > 1 ? 's' : '') : ''
    }</text>`;
    sim.rows.forEach((r, i) => {
      const y = yC + i * rh;
      g += `<text x="6" y="${y + rh / 2 + 3.5}" class="rc-pi">I${i + 1}</text><text x="28" y="${y + rh / 2 + 3.5}" class="rc-pt">${pdText(ins[i].text)}</text>`;
      for (let c = 1; c <= sim.total; c++) {
        const l = Logic.cell(r, c);
        if (!l) continue;
        const x = X((c - 1) * tcM), w = X(c * tcM) - x;
        if (l === 'stall' || l === 'IF*') {
          g += `<rect x="${x + 0.5}" y="${y + 1.5}" width="${w - 1}" height="${rh - 3}" fill="url(#${uid}s)" class="rc-stall"/>${
            w > 26 ? `<text x="${x + w / 2}" y="${y + rh / 2 + 3.5}" class="rc-st stall">${l === 'stall' ? 'stall' : 'wait'}</text>` : ''
          }`;
        } else {
          const s = STG.indexOf(l), d = rows[cl[i]][s];
          g += segs(x + 0.5, w - 1, y + 1.5, rh - 3, s, d, tcM, d == null);
        }
      }
    });
    g += wave(yC + N * rh + 3, tcM, M.TP);

    const flag = (x, y, h, txt, cls, side) =>
      `<line x1="${x}" x2="${x}" y1="${y - (side ? 5 : 16)}" y2="${y + h + 5}" class="rc-fin ${cls}"/>` +
      (side
        ? `<text x="${x + 6}" y="${y + h / 2 + 4}" class="rc-ft ${cls}" ${x + 78 > X1 ? `text-anchor="end" dx="-12"` : ''}>${txt}</text>`
        : `<text x="${x - 4}" y="${y - 6}" class="rc-ft ${cls}" text-anchor="end">${txt}</text>`);
    const best = Math.min(M.TS, M.TM, M.TP);
    g +=
      flag(X(M.TS), yA, hA, `${vizF(M.TS)} ${unit}`, M.TS === best ? 'win' : '') +
      flag(X(M.TM), yB, hB, `${vizF(M.TM)} ${unit}`, M.TM === best ? 'win' : '') +
      flag(X(M.TP), yC, N * rh, `${vizF(M.TP)} ${unit}`, M.TP === best ? 'win' : '', 1);

    const stepT = [1, 2, 4, 5, 10, 20].map((k) => k * tcM).find((s) => T / s <= 12) || tcS;
    g += `<line x1="${X0}" x2="${X1}" y1="${yAx + 12}" y2="${yAx + 12}" class="rc-ax"/>`;
    for (let x = 0; x <= T + 1e-9; x += stepT) {
      g += `<line x1="${X(x)}" x2="${X(x)}" y1="${yAx + 9}" y2="${yAx + 15}" class="rc-ax"/><text x="${X(x)}" y="${yAx + 26}" class="rc-at">${vizF(x)}</text>`;
    }
    g += `<text x="6" y="${yAx + 26}" class="rc-ls">time (${unit}) →</text>`;

    const U = R`\,\text{${unit}}`, FF = TK.F;
    const steps = [
      [R`T_{c,\,single} = \max(${M.rows.map((r) => FF(r.reduce((a, c) => a + (c || 0), 0))).join(', ')}) = ${FF(tcS)}${U}`, 'Add each class’s steps; the single-cycle clock must fit the slowest total (L10 s14).'],
      [R`T_{single} = N \times 1 \times T_c = ${N} \times ${FF(tcS)} = ${FF(M.TS)}${U}`, 'CPI = 1: one (long) cycle per instruction.'],
      [R`T_{c,\,multi} = \max(\text{any one step}) = ${FF(tcM)}${U}`, 'Each step gets its own cycle, so the clock only has to fit the slowest step (L11 s8).'],
      [R`\text{cycles} = ${M.multi.map((x) => x.n).join(' + ')} = ${M.cycM};\quad T_{multi} = ${M.cycM} \times ${FF(tcM)} = ${FF(M.TM)}${U}`, 'Load 5, store 4, ALU 4, branch 3 cycles (R1 s18) — add them up for this program.'],
      [
        R`\text{cycles}_{pipe} = k + (N - 1)${sim.stalls ? ' + \\text{stalls}' : ''} = 5 + ${N - 1}${sim.stalls ? ' + ' + sim.stalls : ''} = ${sim.total};\quad T_{pipe} = ${sim.total} \times ${FF(tcM)} = ${FF(M.TP)}${U}`,
        'The first instruction needs all 5 cycles; after that one finishes every cycle (L12 s18)' + (sim.stalls ? ', plus one cycle per stall (L14 s7).' : '.')
      ],
      [
        R`\dfrac{T_{single}}{T_{pipe}} = \dfrac{${FF(M.TS)}}{${FF(M.TP)}} ${TK.EQ(M.TS / M.TP)} ${FF(M.TS / M.TP)} \qquad \text{long program: } \dfrac{${FF(tcS)}}{${FF(tcM)}${
          sim.stalls ? R` \times ${FF(1 + sim.stalls / N)}` : ''
        }} ${TK.EQ(tcS / (tcM * (1 + sim.stalls / N)))} ${FF(tcS / (tcM * (1 + sim.stalls / N)))}`,
        'With only ' + N + ' instructions the 4 fill-up cycles matter. As N grows, the speedup tends to (single-cycle clock) ÷ (pipeline clock × CPI).'
      ]
    ];
    return { viewBox: `0 0 ${W} ${Hh}`, yAx, g, best, steps };
  });

  const headX = $derived(X(t));

  $effect(() => {
    const x = headX;
    if (cvEl && cvEl.scrollWidth > cvEl.clientWidth + 4) {
      const px = (x / W) * cvEl.scrollWidth;
      if (px < cvEl.scrollLeft + 70 || px > cvEl.scrollLeft + cvEl.clientWidth - 70) {
        cvEl.scrollLeft = Math.max(0, px - cvEl.clientWidth * 0.6);
      }
    }
  });

  const nowRows = $derived.by(() => {
    const { N, unit, tcS, tcM, single, multi, sim, ins } = M;
    const eps = 1e-6;
    const nm = (k) => `<b>I${k + 1}</b> <code class="asm">${vizH(ins[k].op)}</code>`;

    let a;
    const dS = Math.min(N, Math.floor(t / tcS + eps));
    if (t >= M.TS - eps) a = 'finished';
    else {
      const I = single[dS], sg = I.seg.find((s) => t < s.t1 - eps);
      a = sg
        ? `${nm(dS)} — the signal is in its <span class="stg ${STG[sg.s].toLowerCase()}">${STG[sg.s]}</span> part`
        : `${nm(dS)} is done, but the clock edge has not come yet: <span class="rc-w">${vizF(I.t1 - I.t0 - I.work)} ${unit} wasted</span>`;
    }

    let m;
    const cM = Math.floor(t / tcM + eps);
    let dM = 0;
    multi.forEach((I) => { if (I.c0 + I.n <= cM) dM++; });
    if (t >= M.TM - eps) m = 'finished';
    else {
      const I = multi.find((x) => cM < x.c0 + x.n), c = I.cells[cM - I.c0];
      m = `cycle ${cM + 1}: ${nm(I.k)} in <span class="stg ${STG[c.s].toLowerCase()}">${STG[c.s]}</span> — the other four steps’ hardware is idle`;
    }

    let p;
    const cP = Math.floor(t / tcM + eps) + 1;
    let dP = 0;
    sim.rows.forEach((r) => { if (r.WB < cP) dP++; });
    if (t >= M.TP - eps) p = 'finished';
    else {
      const rv = Logic.resourceView(sim);
      const occ = STG.map((s) => (rv[s][cP] != null ? `<span class="stg ${s.toLowerCase()}">${s}</span> I${rv[s][cP] + 1}` : '')).filter(Boolean);
      p = `cycle ${cP}: ${occ.join(' &nbsp;')} — <b>${occ.length}</b> instruction${occ.length > 1 ? 's' : ''} in flight`;
    }

    return [
      { cls: 'a', name: 'single-cycle', done: dS, html: a },
      { cls: 'b', name: 'multi-cycle', done: dM, html: m },
      { cls: 'c', name: 'pipelined', done: dP, html: p }
    ];
  });

  const playLabel = $derived(
    playing ? '❚❚ Pause' : fresh ? '▶ Run the race' : t >= totalT - 1e-6 ? '↺ Run again' : t > 0 ? '▶ Continue' : '▶ Run the race'
  );

  const cardsList = $derived([
    {
      cls: 'a',
      name: 'Single-cycle',
      T: M.TS,
      tc: M.tcS,
      cyc: M.N,
      note: `Clock = the slowest instruction (${CNAME[M.worst]}: ${M.rows[M.worst].filter((x) => x != null).join(' + ')} = ${vizF(M.tcS)}). Every other instruction wastes the hatched tail.`
    },
    {
      cls: 'b',
      name: 'Multi-cycle',
      T: M.TM,
      tc: M.tcM,
      cyc: M.cycM,
      note: `Clock = the slowest single step (${vizF(M.tcM)}). Each instruction takes only the steps it uses, but a short step is still padded to a whole cycle.`
    },
    {
      cls: 'c',
      name: 'Pipelined',
      T: M.TP,
      tc: M.tcM,
      cyc: M.sim.total,
      note: `Same short clock, but a new instruction starts every cycle: ${M.N} + 4${
        M.sim.stalls ? ' + ' + M.sim.stalls + ' stall' + (M.sim.stalls > 1 ? 's' : '') : ''
      } = ${M.sim.total} cycles. For a long program CPI → ${M.sim.stalls ? vizF(1 + M.sim.stalls / M.N) : '1'}.`
    }
  ]);
</script>

<ToolShell title="Three CPUs, one program" sub="single-cycle vs multi-cycle vs pipelined on the same time axis">
  <div class="vz rc">
    <div class="ps-bar">
      <label class="mp-pick">
        <span>Program</span>
        <select bind:value={prog} onchange={onProgramOrLatChange}>
          {#each Object.keys(PROG) as k}
            <option value={k}>{PROG[k].name}</option>
          {/each}
        </select>
      </label>
      <label class="mp-pick">
        <span>Delays</span>
        <select bind:value={latK} onchange={onProgramOrLatChange}>
          {#each Object.keys(LAT) as k}
            <option value={k}>{LAT[k].name}</option>
          {/each}
        </select>
      </label>
      <div class="ps-tg">
        <span>Pipeline hazards</span>
        <div class="seg mini">
          {#each [['ideal', 'ignore'], ['stall', 'stall'], ['fwd', 'forward']] as h}
            <button type="button" aria-pressed={haz === h[0]} onclick={() => setHaz(h[0])}>{h[1]}</button>
          {/each}
        </div>
      </div>
    </div>

    <div class="rc-play">
      <button
        type="button"
        class="mbtn go"
        onclick={() => {
          fresh = false;
          if (playing) stopPlay();
          else startPlay();
        }}
      >
        {playLabel}
      </button>
      <button type="button" class="mbtn" onclick={stepEdge}>next clock edge ▸</button>
      <button type="button" class="mbtn" onclick={resetRace}>↺</button>
      <input
        type="range"
        min="0"
        max="1000"
        step="1"
        value={Math.round((1000 * t) / totalT)}
        aria-label="time"
        oninput={(e) => {
          fresh = false;
          stopPlay();
          t = (totalT * Number(e.currentTarget.value)) / 1000;
        }}
      />
      <span class="rc-t">t = <b>{vizF(Math.round(t))}</b> {M.unit}</span>
    </div>

    <div class="vz-canvas rc-canvas" bind:this={cvEl}>
      <svg viewBox={staticView.viewBox} class="rc-svg" role="img" aria-label="timeline of the three processors">
        {@html staticView.g}
        <rect class="rc-veil" x={headX} y="14" width={Math.max(0, X1 + 12 - headX)} height={staticView.yAx - 6} />
        <g class="rc-head" transform="translate({headX} 0)">
          <line x1="0" x2="0" y1="12" y2={staticView.yAx + 14} />
          <path d="M-5 6 L5 6 L0 13 Z" />
        </g>
      </svg>
    </div>

    <div class="rc-now">
      {#each nowRows as r}
        <div class="rc-nr {r.cls}">
          <span class="rc-nn">{r.name}</span>
          <span class="rc-nd"><b>{r.done}</b>/{M.N} done</span>
          <span class="rc-nx">{@html r.html}</span>
        </div>
      {/each}
    </div>

    <div class="rc-cards">
      {#each cardsList as c}
        <div class="rc-card {c.cls}" class:win={c.T === staticView.best}>
          <div class="rc-cn">
            {c.name}{#if c.T === staticView.best}<span class="rc-win">fastest</span>{/if}
          </div>
          <div class="rc-big">{vizF(c.T)}<small> {M.unit}</small></div>
          <div class="rc-f"><span>{M.N}</span> instr × <span>{vizF(c.cyc / M.N)}</span> CPI × <span>{vizF(c.tc)}</span> {M.unit}</div>
          <div class="rc-f sub">{c.cyc} cycles · {vizF(M.TS / c.T)}× single-cycle</div>
          <div class="rc-note">{c.note}</div>
        </div>
      {/each}
    </div>

    <div class="vz-leg">
      {#each STG as s}
        <span style="--pc:{SC[s]}"><i></i>{s}</span>
      {/each}
      <span class="lg-slack"><i></i>clock time with nothing to do (padding)</span>
      <span class="lg-idle"><i></i>stage the instruction passes through unused</span>
      <span class="lg-stall"><i></i>stall</span>
    </div>

    <div class="out">
      <details class="vz-work" ontoggle={(e) => e.currentTarget.open && snugScroll(e.currentTarget)}>
        <summary>Show the working for these numbers</summary>
        <StepsList steps={staticView.steps} />
      </details>
    </div>
  </div>
</ToolShell>
