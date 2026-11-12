import { Logic } from '../utils/logic.js';
import { C, svg, rect, text, line, path, dot, arrow, chart, hbars, mixArea, eaViz } from '../utils/svg.js';

const L = Logic;
const F = (x, dp) => L.fmt(x, dp === undefined ? 4 : dp);
const EQ = (x, dp) => L.eq(x, dp === undefined ? 4 : dp);
const P = (x, dp) => {
  const s = F(x, dp);
  return s.replace(/\\times/g, '×').replace(/\{|\}/g, '').replace(/\^/g, '^');
};
const pct = (x) => F(x * 100, 2) + '\\%';
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const log2 = (n) => Math.log2(n);

export const FX_DEFS = {};
const FX = {
  def: (id, spec) => { FX_DEFS[id] = spec; },
  svg, rect, text, line, path, dot, arrow, chart, hbars, mixArea, eaViz
};

/* ---------- power ---------- */
  FX.def('power', {
    title: 'Dynamic power: what happens when C, V or f change', ref: 'L02 s10–s11 · PS1 Q3',
    tex: String.raw`P = \tfrac12\,C\,V^{2}\,f \quad\Rightarrow\quad \frac{P_{new}}{P_{old}} = c \times v^{2} \times f_x`,
    legend: [['C', 'capacitive load (how much charge each switch moves)'], ['V', 'supply voltage, which is <b>squared</b>'], ['f', 'clock frequency'], ['c, v, f_x', 'the multipliers: “cut by 15%” means × 0.85']],
    modes: [['ratio', 'Find the new power'], ['solvef', 'Find the frequency for a target power']],
    vars: [{ k: 'dc', label: String.raw`Change in \(C\)`, unit: '%', min: -90, max: 100, step: 1, v: -40 }, { k: 'dv', label: String.raw`Change in \(V\)`, unit: '%', min: -90, max: 100, step: 1, v: -35 },
      { k: 'df', label: String.raw`Change in \(f\)`, unit: '%', min: -90, max: 200, step: 1, v: 0, modes: ['ratio'] }, { k: 'dp', label: String.raw`Target change in \(P\)`, unit: '%', min: -99, max: 100, step: 1, v: -55, modes: ['solvef'] }],
    presets: [['PS1 Q3 (C −40%, V −35%, P −55%)', { dc: -40, dv: -35, dp: -55 }, 'solvef'], ['L02 s11 (C −15%, V −15%, f −15%)', { dc: -15, dv: -15, df: -15 }, 'ratio'], ['Voltage only −10%', { dc: 0, dv: -10, df: 0 }, 'ratio']],
    calc(v, mode) {
      const c = 1 + v.dc / 100, vv = 1 + v.dv / 100;
      if (c <= 0 || vv <= 0) return { err: 'A change of −100% or more would make C or V zero or negative.' };
      const steps = [[String.raw`c = 1 ${v.dc < 0 ? '-' : '+'} ${F(Math.abs(v.dc) / 100)} = ${F(c)}`, `A ${Math.abs(v.dc)}% ${v.dc < 0 ? 'cut' : 'rise'} multiplies C by ${P(c)}.`], [String.raw`v = 1 ${v.dv < 0 ? '-' : '+'} ${F(Math.abs(v.dv) / 100)} = ${F(vv)}`, 'Same idea for the voltage.'], [String.raw`v^2 = ${F(vv)}^2 = ${F(vv * vv)}`, 'Voltage is squared in the formula, so square its multiplier: multiply it by itself.']];
      let ratio, fx;
      if (mode === 'ratio') { fx = 1 + v.df / 100; if (fx <= 0) return { err: 'f cannot drop by 100% or more.' }; ratio = c * vv * vv * fx; steps.push([String.raw`f_x = ${F(fx)}`, 'Multiplier for the frequency.'], [String.raw`\frac{P_{new}}{P_{old}} = ${F(c)} \times ${F(vv * vv)} \times ${F(fx)} ${EQ(ratio)} ${F(ratio)}`, 'Every other part of the formula (the ½) is the same before and after, so it cancels in the ratio.'], [String.raw`\text{change} = ${F(ratio)} - 1 ${EQ(ratio - 1)} ${F(ratio - 1)} = ${pct(ratio - 1)}`, 'Subtract 1 to turn a multiplier back into a percentage change.']); }
      else { const target = 1 + v.dp / 100; if (target <= 0) return { err: 'Power cannot drop by 100% or more.' }; ratio = target; fx = target / (c * vv * vv); steps.push([String.raw`${F(target)} = ${F(c)} \times ${F(vv * vv)} \times f_x`, `${Math.abs(v.dp)}% ${v.dp < 0 ? 'less' : 'more'} power means the new power is ${P(target)} × the old.`], [String.raw`f_x = \frac{${F(target)}}{${F(c)} \times ${F(vv * vv)}} = \frac{${F(target)}}{${F(c * vv * vv)}} ${EQ(fx)} ${F(fx)}`, 'Divide both sides by everything that multiplies f_x.'], [String.raw`\text{change in } f = ${F(fx)} - 1 ${EQ(fx - 1)} ${pct(fx - 1)}`, fx >= 1 ? 'Above 1, so the clock can run faster than before and still meet the power target.' : 'Below 1, so the clock must slow down.']); }
      const rows = [{ label: 'Old power', segs: [{ v: 1, c: C.mut, op: .45 }], right: '1.00 ×' }, { label: '× c (C)', segs: [{ v: c, c: C.blue }], right: P(c) + ' ×' }, { label: '× v² (V²)', segs: [{ v: c * vv * vv, c: C.orange }], right: P(c * vv * vv) + ' ×' }, { label: '× f (clock)', segs: [{ v: c * vv * vv * fx, c: C.green }], right: P(c * vv * vv * fx) + ' ×', bold: true }];
      return { sub: mode === 'ratio' ? String.raw`\frac{P_{new}}{P_{old}} = ${F(c)} \times ${F(vv)}^2 \times ${F(fx)} ${EQ(ratio)} ${F(ratio)}\ (${pct(ratio - 1)})` : String.raw`f_x = \frac{${F(ratio)}}{${F(c)} \times ${F(vv)}^2} ${EQ(fx)} ${F(fx)}\ (${pct(fx - 1)}\ \text{in } f)`, steps,
        viz: hbars(rows, { max: Math.max(1, c, c * vv * vv, c * vv * vv * fx) * 1.05, label: 'power multiplied step by step' }),
        note: `Each bar applies one more multiplier to the old power. Voltage hits hardest because it's squared: a ${Math.abs(v.dv)}% voltage change alone multiplies power by ${P(vv * vv)}.` };
    } });

  /* ---------- Moore's law ---------- */
  FX.def('moore', {
    title: "Moore's law: doubling every T_d", ref: 'L02 s6', tex: String.raw`N = N_0 \times 2^{\,t / T_d}`,
    legend: [['N_0', 'transistor count now'], ['t', 'time ahead (same unit as T_d)'], ['T_d', 'doubling period: 18–24 months'], ['t/T_d', 'how many doublings happen']],
    vars: [{ k: 'n0', label: String.raw`\(N_0\) (millions)`, min: 1, max: 100000, log: true, v: 1000 }, { k: 't', label: String.raw`\(t\) (years ahead)`, min: 0, max: 20, step: .5, v: 6 }, { k: 'td', label: String.raw`\(T_d\) (years)`, min: 1, max: 3, step: .5, v: 2 }],
    calc(v) {
      const k = v.t / v.td, mult = Math.pow(2, k), N = v.n0 * mult;
      const pts = []; for (let i = 0; i <= 80; i++) { const t = v.t * i / 80 || 0; pts.push([t, v.n0 * Math.pow(2, t / v.td)]); }
      const marks = []; for (let j = 0; j <= Math.floor(k + 1e-9) && j <= 12; j++) marks.push({ x: j * v.td, y: v.n0 * Math.pow(2, j), c: j ? C.green : C.blue, label: j && j <= 6 ? '×' + Math.pow(2, j) : '' });
      return { sub: String.raw`N = ${F(v.n0)} \times 2^{${F(v.t)}/${F(v.td)}} = ${F(v.n0)} \times 2^{${F(k)}} ${EQ(N, 2)} ${F(N, 2)}\ \text{million}`,
        steps: [[String.raw`\frac{t}{T_d} = \frac{${F(v.t)}}{${F(v.td)}} ${EQ(k)} ${F(k)}`, 'Number of doublings: how many doubling periods fit into the time.'], [String.raw`2^{${F(k)}} ${EQ(mult)} ${F(mult)}`, Number.isInteger(k) ? `2 multiplied by itself ${k} times.` : 'A fractional power of 2: use the xʸ key on a calculator.'], [String.raw`N = ${F(v.n0)} \times ${F(mult)} ${EQ(N, 2)} ${F(N, 2)}`, 'Multiply the starting count by the growth factor.']],
        viz: chart({ id: 'moore', x: [0, Math.max(v.t, .5)], y: [0, Math.max(N, v.n0) * 1.1], series: [{ pts, c: C.blue }], marks: marks.concat([{ x: v.t, y: N, c: C.orange, label: P(N, 1) + 'M', dx: -50, dy: -10 }]), xl: 'years ahead', yl: 'millions of transistors', label: 'exponential growth' }),
        note: `Each orange dot is one doubling. In ${P(v.t)} years with a ${P(v.td)}-year doubling period you get ${P(k)} doublings: ×${P(mult, 2)}.` };
    } });

  /* ---------- performance / n times faster ---------- */
  FX.def('faster', {
    title: '“A is n times faster than B”', ref: 'L03 s6–s7', tex: String.raw`\text{Perf} = \frac{1}{T} \qquad n = \frac{\text{Perf}_A}{\text{Perf}_B} = \frac{T_B}{T_A}`,
    legend: [['T_A, T_B', 'execution times (seconds)'], ['\\text{Perf}', 'performance: 1 ÷ time, so bigger is better'], ['n', 'always the slow time ÷ the fast time']],
    vars: [{ k: 'ta', label: String.raw`\(T_A\) (s)`, min: .1, max: 100, log: true, v: 10 }, { k: 'tb', label: String.raw`\(T_B\) (s)`, min: .1, max: 100, log: true, v: 15 }],
    presets: [['L03 s7 (A 10 s, B 15 s)', { ta: 10, tb: 15 }], ['Equal', { ta: 8, tb: 8 }], ['B is the faster one', { ta: 12, tb: 4 }]],
    calc(v) {
      const pa = 1 / v.ta, pb = 1 / v.tb, fastA = v.ta <= v.tb, n = fastA ? v.tb / v.ta : v.ta / v.tb, Fn = fastA ? 'A' : 'B', Sn = fastA ? 'B' : 'A';
      const rows = [{ label: 'Time A', segs: [{ v: v.ta, c: C.blue }], right: P(v.ta) + ' s' }, { label: 'Time B', segs: [{ v: v.tb, c: C.orange }], right: P(v.tb) + ' s' }];
      const rows2 = [{ label: 'Perf A', segs: [{ v: pa, c: C.blue }], right: P(pa) + ' /s' }, { label: 'Perf B', segs: [{ v: pb, c: C.orange }], right: P(pb) + ' /s' }];
      return { sub: String.raw`n = \frac{T_${Sn}}{T_${Fn}} = \frac{${F(Math.max(v.ta, v.tb))}}{${F(Math.min(v.ta, v.tb))}} ${EQ(n)} ${F(n)}`,
        steps: [[String.raw`\text{Perf}_A = \frac{1}{${F(v.ta)}} ${EQ(pa)} ${F(pa)},\quad \text{Perf}_B = \frac{1}{${F(v.tb)}} ${EQ(pb)} ${F(pb)}`, 'Performance is the reciprocal of time: less time means more performance.'], [String.raw`\text{${Fn} is faster: } T_${Fn} = ${F(Math.min(v.ta, v.tb))} < ${F(Math.max(v.ta, v.tb))}`, 'The faster machine is the one with the smaller time.'], [String.raw`n = \frac{\text{Perf}_${Fn}}{\text{Perf}_${Sn}} = \frac{T_${Sn}}{T_${Fn}} ${EQ(n)} ${F(n)}`, 'Dividing two reciprocals flips them over, so the slower TIME goes on top. n is at least 1.']],
        viz: `<div class="fx-two">${hbars(rows, { label: 'times' })}${hbars(rows2, { label: 'performance' })}</div>`,
        note: n === 1 ? 'Same time, same performance: n = 1.' : `${Fn}'s time bar is ${P(n)}× shorter, and its performance bar is ${P(n)}× longer: “${Fn} is ${P(n, 2)} times faster than ${Sn}”.` };
    } });

  /* ---------- percentage change ---------- */
  FX.def('pct', {
    title: 'Percentage change, and why a time cut ≠ the same performance gain', ref: 'L03 s9 · L03 [21:15]', tex: String.raw`\%\Delta = \frac{\text{new} - \text{old}}{\text{old}} \times 100`,
    legend: [['\\text{old}', 'the reference: always the bottom of the fraction'], ['\\text{new}', 'the value you are comparing']],
    vars: [{ k: 'old', label: 'Old time (s)', min: 1, max: 100, step: .5, v: 10 }, { k: 'nw', label: 'New time (s)', min: .5, max: 200, step: .5, v: 8 }],
    presets: [['10 s → 8 s', { old: 10, nw: 8 }], ['10 s → 5 s (half)', { old: 10, nw: 5 }], ['R1 s10 (2N vs 2.4N)', { old: 2.4, nw: 2 }]],
    calc(v) {
      const dt = (v.nw - v.old) / v.old, po = 1 / v.old, pn = 1 / v.nw, dp = (pn - po) / po;
      return { sub: String.raw`\%\Delta T = \frac{${F(v.nw)} - ${F(v.old)}}{${F(v.old)}} \times 100 ${EQ(dt * 100, 2)} ${F(dt * 100, 2)}\%\qquad \%\Delta\text{Perf} ${EQ(dp * 100, 2)} ${F(dp * 100, 2)}\%`,
        steps: [[String.raw`${F(v.nw)} - ${F(v.old)} = ${F(v.nw - v.old)}`, 'How much the time changed (negative = it went down).'], [String.raw`\frac{${F(v.nw - v.old)}}{${F(v.old)}} ${EQ(dt)} ${F(dt)} \Rightarrow ${pct(dt)}`, 'Divide by the OLD value (the reference), then × 100 for a percentage.'], [String.raw`\text{Perf}_{old} = \tfrac{1}{${F(v.old)}},\ \text{Perf}_{new} = \tfrac{1}{${F(v.nw)}}`, 'Performance is 1 ÷ time.'], [String.raw`\frac{\text{Perf}_{new}}{\text{Perf}_{old}} = \frac{${F(v.old)}}{${F(v.nw)}} ${EQ(v.old / v.nw)} ${F(v.old / v.nw)} \Rightarrow ${pct(dp)}`, 'The ratio of performances is the times flipped over; subtract 1 for the change.']],
        viz: hbars([{ label: 'Old time', segs: [{ v: v.old, c: C.blue }], right: P(v.old) + ' s' }, { label: 'New time', segs: [{ v: v.nw, c: C.orange }], right: P(v.nw) + ' s' }, { label: 'Old perf', segs: [{ v: po, c: C.blue, op: .45 }], right: P(po) }, { label: 'New perf', segs: [{ v: pn, c: C.orange, op: .45 }], right: P(pn) }], { max: Math.max(v.old, v.nw) * 1.05, label: 'time and performance', rowH: 26 }).replace(/(<svg[^>]*>)/, '$1'),
        note: Math.abs(dt) > 1e-9 ? `Time changed by ${P(dt * 100, 2)}%, but performance changed by ${P(dp * 100, 2)}%. They are not the same number because performance is 1 ÷ time.` : 'No change.' };
    } });

  /* ---------- clock period and rate ---------- */
  FX.def('clock', {
    title: 'Clock period and clock rate are reciprocals', ref: 'L03 s13 · R1 s7', tex: String.raw`T_c = \frac{1}{f} \qquad f = \frac{1}{T_c}`,
    legend: [['f', 'clock rate: cycles per second (Hz). G = 10⁹, M = 10⁶'], ['T_c', 'clock period: seconds per cycle. ns = 10⁻⁹ s, ps = 10⁻¹² s']],
    vars: [{ k: 'ghz', label: String.raw`\(f\) (GHz)`, min: .01, max: 10, log: true, v: 4 }],
    presets: [['4 GHz', { ghz: 4 }], ['2 ns period (500 MHz)', { ghz: .5 }], ['1 ns period', { ghz: 1 }], ['1.25 GHz', { ghz: 1.25 }]],
    calc(v) {
      const f = v.ghz * 1e9, tc = 1 / f, b = L.bestTime(tc), bf = L.bestFreq(f);
      const W = 440, H = 120, cycles = 4, cw = (W - 40) / cycles; let d = `M20 90`; for (let i = 0; i < cycles; i++) { const x = 20 + i * cw; d += ` L${x} 30 L${x + cw / 2} 30 L${x + cw / 2} 90 L${x + cw} 90`; }
      const g = path(d, C.blue, { w: 2 }) + arrow(20 + cw, 104, 20 + 2 * cw, 104, C.orange) + arrow(20 + 2 * cw, 104, 20 + cw, 104, C.orange) + text(20 + 1.5 * cw, 118, 'T_c = ' + P(b.v) + ' ' + b.u, { a: 'middle', c: C.orange, b: 1, size: 11.5 }) + text(20, 18, P(bf.v) + ' ' + bf.u + ' = ' + P(f) + ' cycles every second', { c: C.mut, size: 11 });
      return { sub: String.raw`T_c = \frac{1}{${F(bf.v)} \times 10^{${L.EXP[bf.u]}}\,\text{Hz}} = ${F(tc)}\,\text{s} = ${L.timeTex(tc)}`,
        steps: [[String.raw`f = ${F(bf.v)}\,\text{${bf.u}} = ${F(bf.v)} \times 10^{${L.EXP[bf.u]}}\ \text{Hz}`, `Write the prefix as a power of ten: ${bf.u} = 10^${L.EXP[bf.u]}.`], [String.raw`T_c = \frac{1}{${F(bf.v)}} \times \frac{1}{10^{${L.EXP[bf.u]}}} = ${F(1 / bf.v)} \times 10^{${-L.EXP[bf.u]}}\ \text{s}`, 'One over a product = one over each part. 1/10ⁿ = 10⁻ⁿ.'], [String.raw`= ${L.timeTex(tc)}`, `Pick the unit that gives a sensible number: ${b.u} = 10^${L.EXP[b.u]} s.`]],
        viz: svg(W, H + 4, g, 'clock waveform'), note: 'Double the rate and the period halves. The period is the time between two rising edges.' };
    } });

  /* ---------- iron law ---------- */
  FX.def('iron', {
    title: 'CPU time = instructions × cycles each × time per cycle', ref: 'L03 s14 · R1 s8', tex: String.raw`\text{CPU time} = IC \times CPI \times T_c = \frac{IC \times CPI}{f}`,
    legend: [['IC', 'instruction count: instructions actually executed'], ['CPI', 'average clock cycles per instruction'], ['T_c', 'clock period = 1 / f'], ['IC \\times CPI', 'total clock cycles']],
    modes: [['time', 'Find CPU time'], ['cpi', 'Find CPI'], ['f', 'Find clock rate']],
    vars: [{ k: 'ic', label: String.raw`\(IC\) (instructions)`, min: 1, max: 1e12, log: true, v: 1e9, modes: ['time', 'cpi', 'f'] }, { k: 'cpi', label: String.raw`\(CPI\)`, min: .25, max: 10, step: .05, v: 2, modes: ['time', 'f'] }, { k: 'ghz', label: String.raw`\(f\) (GHz)`, min: .1, max: 10, step: .05, v: 2, modes: ['time', 'cpi'] }, { k: 't', label: 'CPU time (s)', min: .001, max: 100, log: true, v: 1, modes: ['cpi', 'f'] }],
    presets: [['Example: 10⁹ instr, CPI 2, 2 GHz', { ic: 1e9, cpi: 2, ghz: 2, t: 10 }], ['PS1 Q2 style (100 instr)', { ic: 100, cpi: 1.5, ghz: 1, t: 1.5e-7 }]],
    calc(v, mode) {
      const f = v.ghz * 1e9; let ic = v.ic, cpi = v.cpi, t = v.t, ff = f, steps;
      if (mode === 'time') { t = ic * cpi / f; steps = [[String.raw`\text{cycles} = IC \times CPI = ${F(ic)} \times ${F(cpi)} = ${F(ic * cpi)}`, 'Each instruction takes CPI cycles on average, so multiply.'], [String.raw`T_c = \frac{1}{${F(v.ghz)} \times 10^9} = ${L.timeTex(1 / f)}`, 'The period is one over the rate.'], [String.raw`\text{CPU time} = ${F(ic * cpi)} \times ${L.timeTex(1 / f)} ${EQ(t)} ${L.timeTex(t)}`, 'Total cycles × time per cycle.']]; }
      if (mode === 'cpi') { cpi = t * f / ic; steps = [[String.raw`CPI = \frac{\text{CPU time} \times f}{IC}`, 'Rearrange: multiply both sides by f, then divide both sides by IC.'], [String.raw`= \frac{${F(t)} \times ${F(f)}}{${F(ic)}} ${EQ(cpi)} ${F(cpi)}`, 'Substitute; keep the powers of ten together.']]; }
      if (mode === 'f') { ff = ic * cpi / t; steps = [[String.raw`f = \frac{IC \times CPI}{\text{CPU time}}`, 'Rearrange: multiply both sides by f, then divide by the CPU time.'], [String.raw`= \frac{${F(ic)} \times ${F(cpi)}}{${F(t)}} ${EQ(ff)} ${L.freqTex(ff)}`, 'Cycles needed ÷ seconds available = cycles per second.']]; }
      // picture: a few instructions drawn as runs of cycles
      const show = Math.min(6, Math.max(1, Math.round(Math.min(ic, 6)))), cyc = clamp(cpi, .25, 10), W = 440, cw = (W - 70) / Math.max(1, Math.ceil(show * cyc)); let g = '';
      let x = 60; for (let i = 0; i < show; i++) { g += text(54, 22 + i * 22, 'I' + (i + 1), { a: 'end', c: C.blue, size: 11, b: 1 }); const w = cyc * cw; for (let k = 0; k < Math.ceil(cyc - 1e-9); k++) g += rect(x + k * cw, 10 + i * 22, Math.min(cw, w - k * cw) - 1.5, 16, C.orange, { op: i % 2 ? .55 : .85, rx: 2 }); x += w; }
      g += text(60, 10 + show * 22 + 16, `${P(cyc)} cycles × ${show} instr. · 1 block = 1 clock (${P(L.bestTime(1 / ff).v)} ${L.bestTime(1 / ff).u})`, { c: C.mut, size: 10.5 });
      return { sub: mode === 'time' ? String.raw`\text{CPU time} = ${F(ic)} \times ${F(cpi)} \times \frac{1}{${F(v.ghz)}\,\text{GHz}} ${EQ(t)} ${L.timeTex(t)}` : mode === 'cpi' ? String.raw`CPI = \frac{${F(t)} \times ${F(f)}}{${F(ic)}} ${EQ(cpi)} ${F(cpi)}` : String.raw`f = \frac{${F(ic)} \times ${F(cpi)}}{${F(t)}} ${EQ(ff)} ${L.freqTex(ff)}`, steps,
        viz: svg(W, show * 22 + 36, g, 'instructions as runs of clock cycles'), note: 'The three factors multiply: halve any one of them and the CPU time halves. IC depends on the program and compiler, CPI on the ISA and microarchitecture, Tc on the hardware technology.' };
    } });

  /* ---------- instructions per second / MIPS ---------- */
  FX.def('mips', {
    title: 'Instruction rate and the MIPS rating', ref: 'L04 s12 · P&H §1.10', tex: String.raw`\frac{IC}{\text{time}} = \frac{f}{CPI} \qquad \text{MIPS} = \frac{IC}{\text{time} \times 10^6} = \frac{f}{CPI \times 10^6}`,
    legend: [['f', 'clock rate (Hz)'], ['CPI', 'cycles per instruction'], ['10^6', 'turns “instructions per second” into “millions of instructions per second”']],
    vars: [{ k: 'ghz', label: String.raw`\(f\) (GHz)`, min: .1, max: 10, step: .05, v: 2 }, { k: 'cpi', label: String.raw`\(CPI\)`, min: .25, max: 10, step: .05, v: 1.5 }],
    calc(v) {
      const f = v.ghz * 1e9, ips = f / v.cpi, m = ips / 1e6;
      return { sub: String.raw`\text{MIPS} = \frac{${F(f)}}{${F(v.cpi)} \times 10^6} ${EQ(m)} ${F(m)}`,
        steps: [[String.raw`\frac{f}{CPI} = \frac{${F(f)}}{${F(v.cpi)}} ${EQ(ips)} ${F(ips)}\ \text{instr/s}`, 'Cycles per second ÷ cycles per instruction = instructions per second.'], [String.raw`\text{MIPS} = \frac{${F(ips)}}{10^6} ${EQ(m)} ${F(m)}`, 'Divide by a million to count in millions.']],
        viz: hbars([{ label: 'cycles/s', segs: [{ v: f, c: C.blue }], right: P(f / 1e9) + ' G' }, { label: 'instr/s', segs: [{ v: ips, c: C.green }], right: P(ips / 1e9) + ' G' }], { label: 'rates' }),
        note: 'MIPS ignores how much work each instruction does, so a program with more, simpler instructions can score higher yet finish later. Compare times, not MIPS.' };
    } });

  /* ---------- CPI from a mix ---------- */
  FX.def('cpimix', {
    title: 'Average CPI from an instruction mix', ref: 'L10 s21 · P&H §1.6', tex: String.raw`\overline{CPI} = \frac{\sum_i CPI_i \times C_i}{\sum_i C_i} = \sum_i CPI_i \times F_i`,
    legend: [['C_i', 'how many instructions of class i'], ['CPI_i', 'cycles each one of class i takes'], ['F_i', 'fraction of instructions in class i (C_i ÷ total)']],
    vars: [{ k: 'a', label: 'Class A: % of instructions', col: 'blue', min: 0, max: 100, step: 1, v: 50 }, { k: 'ca', label: String.raw`\(CPI_A\)`, col: 'blue', min: .5, max: 10, step: .5, v: 1 }, { k: 'b', label: 'Class B: %', col: 'orange', min: 0, max: 100, step: 1, v: 30 }, { k: 'cb', label: String.raw`\(CPI_B\)`, col: 'orange', min: .5, max: 10, step: .5, v: 2 }, { k: 'cc', label: String.raw`\(CPI_C\) (class C = the rest)`, col: 'magenta', min: .5, max: 10, step: .5, v: 3 }],
    presets: [['50/30/20, CPI 1/2/3', { a: 50, ca: 1, b: 30, cb: 2, cc: 3 }], ['All one class', { a: 100, b: 0 }]],
    calc(v) {
      if (v.a + v.b > 100) return { err: 'Classes A and B together can’t be more than 100% (class C gets whatever is left).' };
      const c = 100 - v.a - v.b, fa = v.a / 100, fb = v.b / 100, fc = c / 100, ta = fa * v.ca, tb = fb * v.cb, tc = fc * v.cc, avg = ta + tb + tc;
      return { sub: String.raw`\overline{CPI} = ${F(fa)} \times ${F(v.ca)} + ${F(fb)} \times ${F(v.cb)} + ${F(fc)} \times ${F(v.cc)} ${EQ(avg)} ${F(avg)}`,
        steps: [[String.raw`F_A = ${F(fa)},\ F_B = ${F(fb)},\ F_C = 1 - ${F(fa)} - ${F(fb)} = ${F(fc)}`, 'Percent ÷ 100 gives the fraction; the fractions must add to 1.'], [String.raw`${F(fa)} \times ${F(v.ca)} = ${F(ta)},\quad ${F(fb)} \times ${F(v.cb)} = ${F(tb)},\quad ${F(fc)} \times ${F(v.cc)} = ${F(tc)}`, 'Each class contributes its share of instructions × its cycles.'], [String.raw`\overline{CPI} = ${F(ta)} + ${F(tb)} + ${F(tc)} ${EQ(avg)} ${F(avg)}`, 'Add the contributions: a weighted average.']],
        viz: `<div class="fx-two">${mixArea([['A', fa, v.ca, C.blue], ['B', fb, v.cb, C.orange], ['C', fc, v.cc, C.mag]], avg)}${hbars([{ label: 'Average CPI', segs: [{ v: ta, c: C.blue, label: 'A ' + P(ta) }, { v: tb, c: C.orange, label: 'B ' + P(tb) }, { v: tc, c: C.mag, label: 'C ' + P(tc) }], right: P(avg), bold: true }], { label: 'stacked contributions', rowH: 34, max: Math.max(avg, 0.01) * 1.02 })}</div>`,
        note: 'Each block is one class: its <b>width</b> is the share of instructions, its <b>height</b> is the cycles each takes, so its <b>area</b> is its contribution. The dashed line is the average CPI: the flat bar with the same total area.' };
    } });

  /* ---------- Amdahl ---------- */
  FX.def('amdahl', {
    title: "Amdahl's law: speed up part of the time", ref: 'L04 s2–s6 · PS1 Q4–Q5', tex: String.raw`\text{Speedup} = \frac{1}{(1 - f) + \dfrac{f}{s}} \qquad \text{limit } (s \to \infty) = \frac{1}{1-f}`,
    legend: [['f', 'fraction of the ORIGINAL time that is improved'], ['1-f', 'the part that is not touched'], ['s', 'how many times faster the improved part becomes']],
    vars: [{ k: 'f', label: String.raw`\(f\) (% of time improved)`, unit: '%', min: 0, max: 100, step: 1, v: 60 }, { k: 's', label: String.raw`\(s\) (× faster)`, min: 1, max: 1000, log: true, v: 3 }],
    presets: [['L04 s6: 95% made 10% faster', { f: 95, s: 1.1 }], ['f = 80%, s = 4', { f: 80, s: 4 }], ['60% made 3× faster', { f: 60, s: 3 }], ['Huge s (limit)', { f: 90, s: 1000 }]],
    calc(v) {
      const f = v.f / 100, s = v.s, tn = (1 - f) + f / s, sp = 1 / tn, lim = f < 1 ? 1 / (1 - f) : Infinity;
      const rows = [{ label: 'Before', segs: [{ v: 1 - f, c: C.mut, op: .55, label: 'untouched' }, { v: f, c: C.blue, label: 'improved part' }], right: '1' }, { label: 'After', segs: [{ v: 1 - f, c: C.mut, op: .55, label: P(1 - f) }, { v: f / s, c: C.blue, op: .55, label: f / s > .12 ? '÷ s → ' + P(f / s) : '' }], right: P(tn), bold: true }];
      const ymax = Math.min(Math.max(lim === Infinity ? 20 : lim * 1.15, 2), 60);
      return { sub: String.raw`\text{Speedup} = \frac{1}{${F(1 - f)} + \frac{${F(f)}}{${F(s)}}} = \frac{1}{${F(tn)}} ${EQ(sp)} ${F(sp)}`,
        steps: [[String.raw`f = ${F(f)},\ 1 - f = ${F(1 - f)}`, 'Write the improved share as a fraction; the rest is 1 minus it.'], [String.raw`\frac{f}{s} = \frac{${F(f)}}{${F(s)}} ${EQ(f / s)} ${F(f / s)}`, 'The improved part now takes s times less time.'], [String.raw`T_{new} = ${F(1 - f)} + ${F(f / s)} = ${F(tn)}`, 'New time, measured as a fraction of the old time (old time = 1).'], [String.raw`\text{Speedup} = \frac{1}{${F(tn)}} ${EQ(sp)} ${F(sp)}`, 'Speedup = old time ÷ new time = 1 ÷ new time.'], [String.raw`\text{limit} = \frac{1}{1 - ${F(f)}} ${f < 1 ? EQ(lim) + ' ' + F(lim) : '= \\infty'}`, 'Even if s were infinite, the untouched part still takes 1 − f.']],
        viz: `<div class="fx-two">${hbars(rows, { max: 1, label: 'time before and after', lw: 56, rw: 40 })}${chart({ id: 'amd', x: [1, 1000], xlog: true, y: [0, ymax], series: [{ f: x => 1 / ((1 - f) + f / x), c: C.blue }], hl: f < 1 ? [{ y: lim, c: C.red, label: 'limit ' + P(lim, 2) + '×' }] : [], marks: [{ x: s, y: sp, c: C.orange, label: P(sp, 2) + '×' }], xl: 's (log scale)', yl: 'overall speedup', label: 'speedup curve', w: 300, h: 200 })}</div>`,
        note: `The grey part (${P((1 - f) * 100)}% of the time) never shrinks, so however big s gets, the speedup can't pass ${f < 1 ? P(lim, 3) : '∞'}×.` };
    } });

  FX.def('amdahlTime', {
    title: 'Amdahl in seconds: T_new = T_affected / s + T_unaffected', ref: 'PS1-SOL Q1c · P&H §1.10', tex: String.raw`T_{new} = \frac{T_{affected}}{s} + T_{unaffected}`,
    legend: [['T_{affected}', 'seconds spent on the part being improved'], ['T_{unaffected}', 'all the other seconds'], ['s', 'how many times faster the affected part gets']],
    modes: [['fwd', 'Find the new time'], ['need', 'Find the s needed for a target time']],
    vars: [{ k: 'ta', label: String.raw`\(T_{affected}\) (s)`, min: 1, max: 1000, step: 1, v: 80 }, { k: 'tu', label: String.raw`\(T_{unaffected}\) (s)`, min: 0, max: 1000, step: 1, v: 20 }, { k: 's', label: String.raw`\(s\)`, min: 1, max: 100, step: .1, v: 4, modes: ['fwd'] }, { k: 'goal', label: 'Target new time (s)', min: 1, max: 1000, step: 1, v: 25, modes: ['need'] }],
    presets: [['80 s of 100 made 4× faster', { ta: 80, tu: 20, s: 4 }, 'fwd'], ['5× overall? (target 20 s)', { ta: 80, tu: 20, goal: 20 }, 'need'], ['Target 25 s', { ta: 80, tu: 20, goal: 25 }, 'need']],
    calc(v, mode) {
      if (mode === 'fwd') { const tn = v.ta / v.s + v.tu, sp = (v.ta + v.tu) / tn; return { sub: String.raw`T_{new} = \frac{${F(v.ta)}}{${F(v.s)}} + ${F(v.tu)} ${EQ(tn)} ${F(tn)}\,\text{s}\quad(\text{speedup } ${EQ(sp)} ${F(sp)})`, steps: [[String.raw`\frac{${F(v.ta)}}{${F(v.s)}} ${EQ(v.ta / v.s)} ${F(v.ta / v.s)}`, 'The affected seconds shrink by the factor s.'], [String.raw`T_{new} = ${F(v.ta / v.s)} + ${F(v.tu)} = ${F(tn)}`, 'The unaffected seconds are added back unchanged.'], [String.raw`\text{speedup} = \frac{${F(v.ta + v.tu)}}{${F(tn)}} ${EQ(sp)} ${F(sp)}`, 'Old total ÷ new total.']], viz: hbars([{ label: 'Before', segs: [{ v: v.tu, c: C.orange }, { v: v.ta, c: C.blue }], right: P(v.ta + v.tu) + ' s' }, { label: 'After', segs: [{ v: v.tu, c: C.orange }, { v: v.ta / v.s, c: C.green }], right: P(tn) + ' s', bold: true }], { label: 'seconds' }), note: 'Orange = untouched seconds; blue shrinks to green.' }; }
      const need = v.goal - v.tu; if (need <= 0) return { err: `Impossible: the unaffected part alone takes ${P(v.tu)} s, which is already at or above the target ${P(v.goal)} s — no value of s can get there.` };
      const s = v.ta / need; return { sub: String.raw`${F(v.goal)} = \frac{${F(v.ta)}}{s} + ${F(v.tu)} \Rightarrow s = \frac{${F(v.ta)}}{${F(need)}} ${EQ(s)} ${F(s)}`, steps: [[String.raw`\frac{${F(v.ta)}}{s} = ${F(v.goal)} - ${F(v.tu)} = ${F(need)}`, 'Subtract the unaffected seconds from both sides.'], [String.raw`s = \frac{${F(v.ta)}}{${F(need)}} ${EQ(s)} ${F(s)}`, 'Swap s and the result (multiply both sides by s, divide by the result).']], viz: hbars([{ label: 'Before', segs: [{ v: v.tu, c: C.orange }, { v: v.ta, c: C.blue }], right: P(v.ta + v.tu) + ' s' }, { label: 'Target', segs: [{ v: v.tu, c: C.orange }, { v: need, c: C.green }], right: P(v.goal) + ' s', bold: true, rc: 'var(--c-magenta)' }], { max: v.ta + v.tu, label: 'target' }), note: `The affected part must be squeezed into ${P(need)} s.` };
    } });

  FX.def('pct2s', {
    title: 'Turning “x% less time” or “x% more performance” into s', ref: 'L04 s9–s10 · PS1 Q5', tex: String.raw`\text{time cut by } x:\ s = \frac{1}{1 - x} \qquad \text{performance up by } x:\ s = 1 + x`,
    legend: [['x', 'the percentage written as a fraction (20% → 0.2)'], ['s', 'the speedup factor of that part']],
    vars: [{ k: 'x', label: String.raw`\(x\) (%)`, unit: '%', min: 1, max: 95, step: 1, v: 20 }],
    calc(v) {
      const x = v.x / 100, s1 = 1 / (1 - x), s2 = 1 + x;
      return { sub: String.raw`\text{time} -${F(v.x)}\%:\ s = \frac{1}{${F(1 - x)}} ${EQ(s1)} ${F(s1)} \qquad \text{perf} +${F(v.x)}\%:\ s = ${F(s2)}`,
        steps: [[String.raw`\text{new time} = (1 - ${F(x)}) \times \text{old} = ${F(1 - x)} \times \text{old}`, 'Cutting time by x leaves 1 − x of it.'], [String.raw`s = \frac{\text{old}}{\text{new}} = \frac{1}{${F(1 - x)}} ${EQ(s1)} ${F(s1)}`, 'Speedup = old time ÷ new time.'], [String.raw`\text{perf} \times (1 + ${F(x)}) \Rightarrow s = ${F(s2)}`, 'Performance is the same thing as speed, so a +x% performance gain is directly s = 1 + x.']],
        viz: hbars([{ label: 'Time −x%', segs: [{ v: s1, c: C.blue }], right: 's = ' + P(s1) }, { label: 'Perf +x%', segs: [{ v: s2, c: C.green }], right: 's = ' + P(s2) }], { label: 'two different speedups' }),
        note: `A ${P(v.x)}% time cut is worth more than a ${P(v.x)}% performance gain (${P(s1, 3)} vs ${P(s2, 3)}). Read the question's wording carefully.` };
    } });

  /* ---------- array offset ---------- */
  FX.def('offset', {
    title: 'Array element address: base + 4 × index', ref: 'L05 s18–s19', tex: String.raw`\text{address of } A[i] = \text{base} + 4 \times i`,
    legend: [['\\text{base}', 'address of A[0], held in a register'], ['i', 'element number, counting from 0'], ['4', 'bytes per word: MIPS memory is byte-addressed']],
    vars: [{ k: 'base', label: 'Base address (decimal)', min: 0, max: 4096, step: 4, v: 1000 }, { k: 'i', label: String.raw`Index \(i\)`, min: 0, max: 15, step: 1, v: 8, int: true }],
    calc(v) {
      const off = 4 * v.i, addr = v.base + off; let g = '';
      for (let k = 0; k < 10; k++) { const idx = Math.max(0, v.i - 4) + k, y = 6 + k * 22, on = idx === v.i; g += rect(140, y, 150, 20, on ? C.orange : C.fill, { op: on ? .9 : 1 }) + text(132, y + 14, String(v.base + 4 * idx), { a: 'end', mono: 1, size: 10.5, c: on ? C.orange : C.mut, b: on }) + text(215, y + 14, `A[${idx}]`, { a: 'middle', mono: 1, size: 11, c: on ? '#fff' : C.fg, b: on }) + text(300, y + 14, '+' + 4 * idx, { mono: 1, size: 10.5, c: C.faint }); }
      return { sub: String.raw`${F(v.base)} + 4 \times ${v.i} = ${F(v.base)} + ${off} = ${addr}`, steps: [[String.raw`\text{offset} = 4 \times ${v.i} = ${off}\ \text{bytes}`, 'Every element before A[i] is one 4-byte word.'], [String.raw`\text{address} = ${F(v.base)} + ${off} = ${addr}`, 'Start at the base and step over them.'], [String.raw`\texttt{lw \$t0, ${off}(\$s3)}`, 'In MIPS the offset goes in front of the base register in brackets (base in $s3 here).']], viz: svg(360, 228, g, 'memory words'), note: 'Addresses go up in steps of 4 because each word is 4 bytes. Using i instead of 4i is the classic mistake.' };
    } });

  /* ---------- log2 bits ---------- */
  FX.def('log2', {
    title: 'How many bits to name N things?', ref: 'L05 s14', tex: String.raw`\text{bits} = \lceil \log_2 N \rceil \quad\Longleftrightarrow\quad 2^{\text{bits}} \ge N`,
    legend: [['N', 'number of different things (registers, opcodes …)'], ['\\log_2 N', 'the power you raise 2 to, to get N'], ['\\lceil\\,\\rceil', 'round UP to a whole number of bits']],
    vars: [{ k: 'n', label: String.raw`\(N\)`, min: 2, max: 4096, step: 1, v: 32, int: true }],
    calc(v) {
      const n = Math.round(v.n), b = Math.ceil(Math.log2(n) - 1e-12), cap = Math.pow(2, b); let g = '';
      for (let k = 1; k <= Math.min(b + 1, 13); k++) { const y = 6 + (k - 1) * 18, w = Math.min(1, Math.pow(2, k) / Math.pow(2, Math.min(b + 1, 13))) * 260; g += rect(110, y, Math.max(2, w), 14, k === b ? C.green : k < b ? C.blue : C.mut, { op: k === b ? .9 : .45, rx: 2 }) + text(104, y + 11, k + ' bit' + (k > 1 ? 's' : ''), { a: 'end', size: 10.5, c: C.mut }) + text(116 + Math.max(2, w), y + 11, String(Math.pow(2, k)), { size: 10.5, mono: 1, c: k === b ? C.green : C.mut, b: k === b }); }
      return { sub: String.raw`2^{${b - 1}} = ${Math.pow(2, b - 1)} < ${n} \le 2^{${b}} = ${cap} \Rightarrow ${b}\ \text{bits}`, steps: [[String.raw`2^{${b - 1}} = ${Math.pow(2, b - 1)}`, `${b - 1} bits give only ${Math.pow(2, b - 1)} different patterns${Math.pow(2, b - 1) >= n ? '' : ' — not enough'}.`], [String.raw`2^{${b}} = ${cap} \ge ${n}`, `${b} bits give ${cap} patterns: enough.`], [String.raw`\log_2 ${n} ${EQ(Math.log2(n))} ${F(Math.log2(n))} \to ${b}`, 'Round up: you can’t have part of a bit.']], viz: svg(400, Math.min(b + 1, 13) * 18 + 10, g, 'doubling ladder'), note: 'Each extra bit doubles the number of patterns. 32 registers → 5 bits, which is why rs, rt and rd are 5-bit fields.' };
    } });

  /* ---------- ranges ---------- */
  FX.def('range', {
    title: 'Range of an n-bit number', ref: 'L08 s4–s7', tex: String.raw`\text{unsigned: } 0 \ldots 2^{n}-1 \qquad \text{two's complement: } -2^{n-1} \ldots 2^{n-1}-1`,
    legend: [['n', 'number of bits'], ['2^{n}', 'number of different patterns']],
    vars: [{ k: 'n', label: String.raw`\(n\) bits`, min: 1, max: 32, step: 1, v: 16, int: true }],
    presets: [['4 bits', { n: 4 }], ['8 bits', { n: 8 }], ['16-bit immediate', { n: 16 }], ['32-bit register', { n: 32 }]],
    calc(v) {
      const n = Math.round(v.n), U = Math.pow(2, n) - 1, lo = -Math.pow(2, n - 1), hi = Math.pow(2, n - 1) - 1, W = 440;
      const X = x => 30 + (x - lo) / (U - lo) * (W - 60);
      const g = line(30, 40, W - 30, 40, C.mut) + rect(X(0), 20, X(U) - X(0), 12, C.blue, { op: .8 }) + text(X(0), 14, 'unsigned 0 … ' + U.toLocaleString('en-GB'), { c: C.blue, size: 11, b: 1 }) + rect(X(lo), 48, X(hi) - X(lo), 12, C.orange, { op: .8 }) + text(X(lo), 76, `signed ${lo.toLocaleString('en-GB')} … ${hi.toLocaleString('en-GB')}`, { c: C.orange, size: 11, b: 1 }) + line(X(0), 34, X(0), 66, C.fg, { dash: '2 2' }) + text(X(0), 92, '0', { a: 'middle', size: 10.5, c: C.mut });
      return { sub: String.raw`n = ${n}:\quad 0 \ldots ${U} \qquad ${lo} \ldots ${hi}`, steps: [[String.raw`2^{${n}} = ${Math.pow(2, n)}`, 'Number of different patterns.'], [String.raw`\text{unsigned max} = 2^{${n}} - 1 = ${U}`, 'Patterns stand for 0 up to one less than the count.'], [String.raw`2^{${n}-1} = ${-lo}`, 'Two’s complement gives half the patterns to negatives.'], [String.raw`${lo} \ldots ${-lo} - 1 = ${hi}`, 'One extra negative value: zero takes one of the “positive” patterns.']], viz: svg(W, 98, g, 'number line'), note: 'Same number of patterns in both; two’s complement slides the window left so it is centred on zero.' };
    } });

  /* ---------- shifts ---------- */
  FX.def('shift', {
    title: 'Shifts multiply and divide by powers of 2', ref: 'L06 s13', tex: String.raw`\texttt{sll } i \Rightarrow x \times 2^{i} \qquad \texttt{srl } i \Rightarrow \left\lfloor x \div 2^{i} \right\rfloor`,
    legend: [['i', 'shift amount (shamt field, 0–31)'], ['\\lfloor\\,\\rfloor', 'round down: bits shifted off the right are lost']],
    modes: [['sll', 'sll (left)'], ['srl', 'srl (right)']],
    vars: [{ k: 'x', label: 'Value (0–255)', min: 0, max: 255, step: 1, v: 9, int: true }, { k: 'i', label: String.raw`Shift \(i\)`, min: 0, max: 7, step: 1, v: 4, int: true }],
    calc(v, mode) {
      const x = Math.round(v.x) & 255, i = Math.round(v.i), r16 = mode === 'sll' ? (x << i) & 0xffff : x >>> i, bitsA = x.toString(2).padStart(16, '0'), bitsR = r16.toString(2).padStart(16, '0'); let g = '';
      const row = (bits, y, cl, lab) => { let s = text(6, y + 15, lab, { size: 11, c: C.mut }); for (let k = 0; k < 16; k++) { const on = bits[k] === '1'; s += rect(70 + k * 22, y, 20, 22, on ? cl : C.fill, { rx: 3 }) + text(80 + k * 22, y + 15, bits[k], { a: 'middle', mono: 1, size: 12, c: on ? '#fff' : C.mut, b: on }); } return s; };
      g += row(bitsA, 6, C.blue, 'x') + row(bitsR, 50, C.green, mode) + arrow(mode === 'sll' ? 300 : 120, 40, mode === 'sll' ? 120 : 300, 40, C.orange) + text(210, 38, (mode === 'sll' ? '← ' : '') + i + ' place' + (i === 1 ? '' : 's') + (mode === 'srl' ? ' →' : ''), { a: 'middle', size: 10.5, c: C.orange });
      const ex = mode === 'sll' ? x * Math.pow(2, i) : Math.floor(x / Math.pow(2, i));
      return { sub: mode === 'sll' ? String.raw`${x} \times 2^{${i}} = ${x} \times ${Math.pow(2, i)} = ${ex}` : String.raw`\left\lfloor ${x} \div ${Math.pow(2, i)} \right\rfloor = ${ex}`, steps: [[String.raw`${x} = ${x.toString(2)}_2`, 'Write the value in binary.'], [mode === 'sll' ? String.raw`\text{append } ${i} \text{ zeros: } ${r16.toString(2)}_2` : String.raw`\text{drop the last } ${i} \text{ bits: } ${(r16 || 0).toString(2)}_2`, mode === 'sll' ? 'Every bit moves up i places; zeros fill in on the right.' : 'Every bit moves down i places; zeros fill in on the left; bits falling off the right are lost.'], [String.raw`= ${ex}`, mode === 'sll' ? `Each place left doubles the value: × 2^${i}.` : `Each place right halves the value (rounding down): ÷ 2^${i}.`]], viz: svg(430, 80, g, 'bits shifting'), note: mode === 'sll' ? 'sll by i is a cheap multiply by 2ⁱ — compilers use it for array indexing (× 4 is sll 2).' : 'srl is an unsigned divide by 2ⁱ that rounds down.' };
    } });

  /* ---------- effective address / branch target ---------- */
  FX.def('ea', {
    title: 'Base (displacement) addressing', ref: 'L06 s23', tex: String.raw`\text{EA} = \text{base register} + \text{offset}`,
    legend: [['\\text{EA}', 'effective address: where in memory the load/store goes'], ['\\text{offset}', '16-bit signed constant from the instruction']],
    vars: [{ k: 'b', label: 'Base register value', min: 0, max: 10000, step: 4, v: 4000 }, { k: 'o', label: 'Offset (bytes)', min: -64, max: 64, step: 4, v: 12 }],
    calc(v) { const ea = v.b + v.o; return { sub: String.raw`\text{EA} = ${F(v.b)} ${v.o < 0 ? '-' : '+'} ${Math.abs(v.o)} = ${ea}`, steps: [[String.raw`\texttt{lw \$t0, ${v.o}(\$s0)},\ \$s0 = ${F(v.b)}`, 'The number before the brackets is the offset; the register inside is the base.'], [String.raw`${F(v.b)} ${v.o < 0 ? '-' : '+'} ${Math.abs(v.o)} = ${ea}`, 'The ALU adds them (a negative offset goes backwards).']], viz: eaViz(v.b, v.o, ea), note: v.o < 0 ? 'A negative offset reaches <b>below</b> the base: handy for things just before a pointer (e.g. the stack).' : 'The base register points somewhere in memory; the offset from the instruction picks a byte that many bytes further on.' }; } });

  FX.def('branch', {
    title: 'Branch target (PC-relative addressing)', ref: 'L06 s25 · P&H §2.10', tex: String.raw`\text{target} = (PC + 4) + 4 \times \text{offset}`,
    legend: [['PC', 'address of the branch itself'], ['PC+4', 'address of the next instruction (where the PC already points)'], ['\\text{offset}', 'number of INSTRUCTIONS to jump, signed']],
    vars: [{ k: 'pc', label: 'PC of the branch', min: 0, max: 400, step: 4, v: 80 }, { k: 'o', label: 'Offset (instructions)', min: -8, max: 8, step: 1, v: 3, int: true }],
    calc(v) {
      const t = v.pc + 4 + 4 * v.o; let g = '';
      for (let k = -9; k <= 9; k++) { const a = v.pc + 4 * k; if (a < 0) continue; const y = 6 + (k + 9) * 15, isB = k === 0, isT = a === t, isN = k === 1; g += rect(150, y, 120, 13, isB ? C.blue : isT ? C.green : C.fill, { rx: 2, op: isB || isT ? .9 : 1 }) + text(144, y + 10, String(a), { a: 'end', mono: 1, size: 9.5, c: isB ? C.blue : isT ? C.green : C.faint, b: isB || isT }) + (isB ? text(210, y + 10, 'beq …', { a: 'middle', size: 9.5, c: '#fff', b: 1 }) : isT ? text(210, y + 10, 'target', { a: 'middle', size: 9.5, c: '#fff', b: 1 }) : '') + (isN ? text(278, y + 10, '← PC+4 (counting starts here)', { size: 9.5, c: C.orange }) : ''); }
      return { sub: String.raw`(${v.pc} + 4) + 4 \times (${v.o}) = ${v.pc + 4} ${v.o < 0 ? '-' : '+'} ${Math.abs(4 * v.o)} = ${t}`, steps: [[String.raw`PC + 4 = ${v.pc + 4}`, 'By the time the branch executes, the PC has already moved on to the next instruction.'], [String.raw`4 \times ${v.o} = ${4 * v.o}`, 'The offset counts instructions; each is 4 bytes.'], [String.raw`${v.pc + 4} ${v.o < 0 ? '-' : '+'} ${Math.abs(4 * v.o)} = ${t}`, 'Add (or subtract, for a backwards loop branch).']], viz: svg(440, 19 * 15 + 10, g, 'instruction addresses'), note: 'Offset 0 means “the very next instruction” — counting starts at PC + 4, not at the branch.' };
    } });

  /* ---------- binary value, two's complement, negate ---------- */
  function bitRow(bits, weights, y, onC, lab) { let s = lab ? text(4, y + 16, lab, { size: 10.5, c: C.mut }) : ''; const n = bits.length, cw = Math.min(46, 380 / n); for (let k = 0; k < n; k++) { const on = bits[k] === '1', x = 52 + k * cw; s += rect(x, y, cw - 3, 24, on ? (k === 0 && weights && weights[0] < 0 ? C.red : onC) : C.fill, { rx: 3 }) + text(x + (cw - 3) / 2, y + 16, bits[k], { a: 'middle', mono: 1, size: 12.5, c: on ? '#fff' : C.mut, b: on }); if (weights) s += text(x + (cw - 3) / 2, y + 38, String(weights[k]), { a: 'middle', mono: 1, size: 9, c: k === 0 && weights[0] < 0 ? C.red : C.faint }); } return s; }
  FX.def('unsigned', {
    title: 'Unsigned binary: add up the place values', ref: 'L08 s5', tex: String.raw`x = \sum_{i=0}^{n-1} x_i\,2^{i}`, legend: [['x_i', 'bit i (0 or 1), counting from the right starting at 0'], ['2^{i}', 'place value of bit i']],
    vars: [{ k: 'x', label: 'Value', min: 0, max: 255, step: 1, v: 13, int: true }, { k: 'n', label: 'Bits', min: 4, max: 8, step: 1, v: 8, int: true }],
    calc(v) { const n = Math.round(v.n); v.x = clamp(Math.round(v.x), 0, Math.pow(2, n) - 1); const x = v.x; const b = x.toString(2).padStart(n, '0'), w = []; for (let k = 0; k < n; k++) w.push(Math.pow(2, n - 1 - k)); const terms = w.filter((q, k) => b[k] === '1'); return { sub: String.raw`${b}_2 = ${terms.length ? terms.join(' + ') : '0'} = ${x}`, steps: [[String.raw`\text{place values: } ${w.join(',\\ ')}`, 'Rightmost bit is worth 1; each step left doubles.'], [String.raw`\text{bits set: } ${terms.join(',\\ ') || '\\text{none}'}`, 'Keep the place values under each 1.'], [String.raw`${terms.join(' + ') || '0'} = ${x}`, 'Add them up.']], viz: svg(440, 70, bitRow(b, w, 6, C.blue), 'bits with weights'), note: '' }; } });
  FX.def('twos', {
    title: "Two's complement: the top bit is worth −2ⁿ⁻¹", ref: 'L08 s6–s7', tex: String.raw`x = -x_{n-1}\,2^{n-1} + \sum_{i=0}^{n-2} x_i\,2^{i}`, legend: [['x_{n-1}', 'the top (sign) bit'], ['-2^{n-1}', 'its NEGATIVE place value']],
    vars: [{ k: 'x', label: 'Value', min: -128, max: 127, step: 1, v: -115, int: true }, { k: 'n', label: 'Bits', min: 4, max: 8, step: 1, v: 8, int: true }],
    presets: [['PS2 Q3c: 10001101', { x: -115, n: 8 }], ['−1', { x: -1, n: 8 }], ['−8 in 4 bits', { x: -8, n: 4 }]],
    calc(v) { const n = Math.round(v.n), lo = -Math.pow(2, n - 1), hi = -lo - 1; v.x = clamp(Math.round(v.x), lo, hi); const x = v.x; const b = (x < 0 ? x + Math.pow(2, n) : x).toString(2).padStart(n, '0'), w = []; for (let k = 0; k < n; k++) w.push(k === 0 ? -Math.pow(2, n - 1) : Math.pow(2, n - 1 - k)); const terms = w.filter((q, k) => b[k] === '1'); return { sub: String.raw`${b}_2 = ${terms.length ? terms.join(' + ').replace(/\+ -/g, '- ') : '0'} = ${x}`, steps: [[String.raw`\text{place values: } ${w.join(',\\ ')}`, 'Same as unsigned, except the top bit’s value is negative.'], [String.raw`\text{bits set: } ${terms.join(',\\ ') || '\\text{none}'}`, 'Pick the place values under each 1.'], [String.raw`${terms.join(' + ').replace(/\+ -/g, '- ') || '0'} = ${x}`, b[0] === '1' ? 'The big negative weight outweighs all the positive bits together, so the result is negative.' : 'Top bit is 0, so it reads just like unsigned.']], viz: svg(440, 70, bitRow(b, w, 6, C.blue), 'bits with weights'), note: 'Red = the sign bit with its negative weight.' }; } });
  FX.def('negate', {
    title: 'Negating: invert every bit, then add 1', ref: 'L08 s7', tex: String.raw`-B = \overline{B} + 1`, legend: [['\\overline{B}', 'B with every bit flipped (0 ↔ 1)']],
    vars: [{ k: 'x', label: 'B (value)', min: -127, max: 127, step: 1, v: 13, int: true }, { k: 'n', label: 'Bits', min: 4, max: 8, step: 1, v: 8, int: true }],
    calc(v) { const n = Math.round(v.n), M = Math.pow(2, n), lo = -M / 2; v.x = clamp(Math.round(v.x), lo, M / 2 - 1); const x = v.x; const u = (x + M) % M, b = u.toString(2).padStart(n, '0'), inv = (M - 1 - u), ib = inv.toString(2).padStart(n, '0'), r = (inv + 1) % M, rb = r.toString(2).padStart(n, '0'), rv = r >= M / 2 ? r - M : r; return { sub: String.raw`B = ${b}\ (${x}) \to \overline{B} = ${ib} \to +1 = ${rb}\ (${rv})`, steps: [[String.raw`B = ${b}`, `${x} in ${n}-bit two's complement.`], [String.raw`\overline{B} = ${ib}`, 'Flip every bit.'], [String.raw`${ib} + 1 = ${rb}`, 'Add one (carry as usual).'], [String.raw`${rb} = ${rv}`, x === lo ? `Special case: ${lo} has no positive partner in ${n} bits, so it maps to itself.` : `Check: ${rv} is −(${x}).`]], viz: svg(440, 104, bitRow(b, null, 4, C.blue, 'B') + bitRow(ib, null, 38, C.mag, 'flip') + bitRow(rb, null, 72, C.green, '+1'), 'negation steps'), note: '' }; } });

  /* ---------- IEEE 754 ---------- */
  FX.def('ieee', {
    title: 'IEEE 754 single precision', ref: 'P&H §3.5 (textbook)', tex: String.raw`(-1)^{S} \times (1 + \text{Fraction}) \times 2^{\,\text{Exponent} - 127}`,
    legend: [['S', 'sign bit: 0 positive, 1 negative'], ['\\text{Exponent}', '8 bits stored with a bias of 127'], ['\\text{Fraction}', '23 bits after the binary point; the leading 1 is implied']],
    vars: [{ k: 'x', label: 'Decimal value', min: -100, max: 100, step: .125, v: -0.75 }],
    presets: [['−0.75 (P&H example)', { x: -0.75 }], ['1', { x: 1 }], ['5.5', { x: 5.5 }], ['0.1 (not exact!)', { x: 0.1 }]],
    calc(v) {
      const bits = L.floatToBits(v.x), d = L.ieeeDecode(bits), bs = (bits >>> 0).toString(2).padStart(32, '0'), s = bs[0], e = bs.slice(1, 9), fr = bs.slice(9), E = parseInt(e, 2), fv = parseInt(fr, 2) / Math.pow(2, 23);
      if (E === 0 || E === 255) return { sub: v.x === 0 ? String.raw`0 = \texttt{0x00000000}` : String.raw`\text{special value}`, steps: [], viz: '', note: v.x === 0 ? 'Zero is a special case: exponent and fraction all 0 (there is no implied 1).' : 'Exponent 0 or 255 is reserved for special values (zero, denormals, infinity, not-a-number).' };
      let g = ''; for (let k = 0; k < 32; k++) { const on = bs[k] === '1', c = k === 0 ? C.red : k < 9 ? C.green : C.blue, x = 8 + k * 13.4; g += rect(x, 8, 12, 22, on ? c : C.fill, { rx: 2 }) + text(x + 6, 23, bs[k], { a: 'middle', mono: 1, size: 10, c: on ? '#fff' : C.mut }); }
      g += text(14, 46, 'S', { a: 'middle', c: C.red, size: 10.5, b: 1 }) + text(8 + 4.5 * 13.4, 46, 'exponent ' + E, { a: 'middle', c: C.green, size: 10.5, b: 1 }) + text(8 + 20.5 * 13.4, 46, 'fraction ' + P(fv, 6), { a: 'middle', c: C.blue, size: 10.5, b: 1 });
      const val = d.value;
      return { sub: String.raw`(-1)^{${s}} \times (1 + ${F(fv, 6)}) \times 2^{${E} - 127} = ${s === '1' ? '-' : ''}${F(1 + fv, 6)} \times 2^{${E - 127}} = ${F(val, 8)}`,
        steps: [[String.raw`S = ${s}`, s === '1' ? 'Negative number.' : 'Positive number.'], [String.raw`\text{Exponent} = ${e}_2 = ${E}`, 'Read the 8 exponent bits as an unsigned number.'], [String.raw`${E} - 127 = ${E - 127}`, 'Remove the bias to get the real power of 2.'], [String.raw`\text{Fraction} = 0.${fr.replace(/0+$/, '') || '0'}_2 ${EQ(fv, 6)} ${F(fv, 6)}`, 'The fraction bits are worth ½, ¼, ⅛ … from the left.'], [String.raw`${s === '1' ? '-' : ''}(1 + ${F(fv, 6)}) \times 2^{${E - 127}} ${EQ(val, 8)} ${F(val, 8)}`, 'Put the implied 1 in front, apply the power of 2 and the sign.'], [String.raw`\text{hex: } \texttt{0x${(bits >>> 0).toString(16).toUpperCase().padStart(8, '0')}}`, 'Group the 32 bits in fours for hex.']],
        viz: svg(450, 54, g, 'float bits'), note: val !== v.x ? `${v.x} can't be stored exactly: the nearest float is ${val}.` : '' };
    } });

  /* ---------- single-cycle critical path ---------- */
  FX.def('critpath', {
    title: 'Single-cycle clock: the slowest instruction sets the clock', ref: 'L10 s14–s20 · PS2 Q5a · Practice Test Q6', tex: String.raw`T_c = \max_{\text{instr}}\Big(\sum \text{delays on its path}\Big),\qquad CPI = 1`,
    legend: [['\\text{IM, DM}', 'instruction / data memory (blue, yellow)'], ['\\text{RF}', 'register file: read in ID, write in WB (both cyan; the write is paler)'], ['\\text{ALU}', 'arithmetic logic unit (green)']],
    vars: [{ k: 'im', label: 'Instruction memory (ps)', min: 0, max: 500, step: 10, v: 200, col: 'blue' }, { k: 'rf', label: 'Register file read / write (ps)', min: 0, max: 300, step: 10, v: 50, col: 'cyan' }, { k: 'alu', label: 'ALU (ps)', min: 0, max: 500, step: 10, v: 100, col: 'green' }, { k: 'dm', label: 'Data memory (ps)', min: 0, max: 500, step: 10, v: 200, col: 'yellow' }],
    presets: [['L10 s16 (memories 200, ALU 100, RF 50)', { im: 200, rf: 50, alu: 100, dm: 200 }], ['Ex: memories 250, ALU 150, RF 60', { im: 250, rf: 60, alu: 150, dm: 250 }], ['PS2 Q6 (IM 160, DM 210, ALU 170, RF 50)', { im: 160, rf: 50, alu: 170, dm: 210 }]],
    calc(v) {
      const R = [['lw', [['IM', v.im, C.blue], ['RF', v.rf, C.cyan], ['ALU', v.alu, C.green], ['DM', v.dm, C.yellow], ['RF', v.rf, C.cyan, .55]]], ['sw', [['IM', v.im, C.blue], ['RF', v.rf, C.cyan], ['ALU', v.alu, C.green], ['DM', v.dm, C.yellow]]], ['R-type', [['IM', v.im, C.blue], ['RF', v.rf, C.cyan], ['ALU', v.alu, C.green], ['RF', v.rf, C.cyan, .55]]], ['beq', [['IM', v.im, C.blue], ['RF', v.rf, C.cyan], ['ALU', v.alu, C.green]]]];
      const tot = R.map(r => r[1].reduce((a, s) => a + s[1], 0)), mx = Math.max(...tot), who = R[tot.indexOf(mx)][0];
      return { sub: String.raw`T_c = \max(${tot.join(',\\ ')}) = ${mx}\ \text{ps}\quad(f = ${L.freqTex(1 / (mx * 1e-12))})`,
        steps: R.map((r, i) => [String.raw`\text{${r[0]}}: ${r[1].map(s => s[1]).join(' + ')} = ${tot[i]}`, `${r[0]} uses ${r[1].map(s => s[0]).join(' → ')}.`]).concat([[String.raw`T_c = ${mx}\ \text{ps}`, `Every instruction gets one cycle, and the cycle must be long enough for the slowest (${who}).`]]),
        viz: hbars(R.map((r, i) => ({ label: r[0], segs: r[1].map((s, j) => ({ v: s[1], c: s[2], op: s[3], label: s[0] + (s[0] === 'RF' ? (j ? ' wr' : ' rd') : '') })), right: tot[i] + ' ps', bold: tot[i] === mx })), { limit: mx, limitLabel: 'clock period', label: 'instruction paths' }),
        note: `Shorter instructions waste the rest of the cycle: beq finishes after ${tot[3]} ps but still waits ${mx - tot[3]} ps for the clock edge.` };
    } });

  /* ---------- multi-cycle ---------- */
  FX.def('multicycle', {
    title: 'Multi-cycle: clock = slowest STEP, time = steps × clock, average by mix', ref: 'L11 s8–s9 · L12 s16 · PS2 Q5b', tex: String.raw`T_c = \max(\text{steps}),\quad T_{instr} = n_{steps} \times T_c,\quad \overline{T} = \sum_i p_i\,T_i`,
    legend: [['n_{steps}', 'lw 5, sw 4, R-type 4, beq 3'], ['p_i', 'fraction of instructions of type i']],
    vars: [{ k: 'im', label: 'IF step (ps)', min: 50, max: 500, step: 10, v: 200, col: 'blue' }, { k: 'rf', label: 'ID / WB step (ps)', min: 50, max: 500, step: 10, v: 100, col: 'cyan' }, { k: 'alu', label: 'EX step (ps)', min: 50, max: 500, step: 10, v: 200, col: 'green' }, { k: 'dm', label: 'MEM step (ps)', min: 50, max: 500, step: 10, v: 200, col: 'yellow' },
      { k: 'pl', label: '% lw', min: 0, max: 100, step: 1, v: 30, col: 'orange' }, { k: 'ps', label: '% sw', min: 0, max: 100, step: 1, v: 30, col: 'orange' }, { k: 'pr', label: '% R-type (beq = rest)', min: 0, max: 100, step: 1, v: 20, col: 'orange' }],
    presets: [['L12 s16 (30/30/20/20)', { im: 200, rf: 100, alu: 200, dm: 200, pl: 30, ps: 30, pr: 20 }], ['Branch-heavy mix', { pl: 10, ps: 10, pr: 20 }]],
    calc(v) {
      if (v.pl + v.ps + v.pr > 100) return { err: 'The percentages add to more than 100%.' };
      const pb = 100 - v.pl - v.ps - v.pr, tc = Math.max(v.im, v.rf, v.alu, v.dm), n = { lw: 5, sw: 4, R: 4, beq: 3 }, p = { lw: v.pl / 100, sw: v.ps / 100, R: v.pr / 100, beq: pb / 100 };
      const ti = k => n[k] * tc, avg = Object.keys(n).reduce((a, k) => a + p[k] * ti(k), 0);
      const sc = Math.max(v.im + v.rf + v.alu + v.dm + v.rf, v.im + v.rf + v.alu + v.dm, v.im + v.rf + v.alu + v.rf, v.im + v.rf + v.alu);
      return { sub: String.raw`\overline{T} = ${Object.keys(n).map(k => F(p[k]) + '\\times' + ti(k)).join(' + ')} ${EQ(avg)} ${F(avg)}\ \text{ps}\quad\text{vs single-cycle } ${sc}\ \text{ps}`,
        steps: [[String.raw`T_c = \max(${v.im}, ${v.rf}, ${v.alu}, ${v.dm}) = ${tc}\ \text{ps}`, 'Each step gets one cycle, so the cycle must fit the slowest step.'], [String.raw`\text{lw } 5 \times ${tc} = ${ti('lw')},\ \text{sw } 4 \times ${tc} = ${ti('sw')},\ \text{R } 4 \times ${tc} = ${ti('R')},\ \text{beq } 3 \times ${tc} = ${ti('beq')}`, 'Time per instruction = number of steps it needs × clock.'], [String.raw`\overline{T} = ${Object.keys(n).map(k => F(p[k]) + '\\times' + ti(k)).join(' + ')}`, 'Weight each instruction’s time by how often it appears.'], [String.raw`= ${Object.keys(n).map(k => F(p[k] * ti(k))).join(' + ')} ${EQ(avg)} ${F(avg)}\ \text{ps}`, 'Multiply out and add.'], [String.raw`\text{single-cycle: } ${sc}\ \text{ps} \Rightarrow ${avg < sc ? '\\text{multi-cycle faster}' : avg > sc ? '\\text{single-cycle faster}' : '\\text{equal}'}`, 'Single-cycle runs every instruction at the lw time.']],
        viz: hbars([{ label: 'single-cycle', segs: [{ v: sc, c: C.mut, op: .55 }], right: sc + ' ps' }].concat(Object.keys(n).map(k => ({ label: k + ' (' + n[k] + ' steps)', segs: ({ lw: ['IF', 'ID', 'EX', 'MEM', 'WB'], sw: ['IF', 'ID', 'EX', 'MEM'], R: ['IF', 'ID', 'EX', 'WB'], beq: ['IF', 'ID', 'EX'] })[k].map(st => ({ v: tc, c: { IF: C.blue, ID: C.cyan, EX: C.green, MEM: C.yellow, WB: C.cyan }[st], op: st === 'WB' ? .55 : .85, label: st })), right: ti(k) + ' ps' }))).concat([{ label: 'average', segs: [{ v: avg, c: C.orange }], right: P(avg) + ' ps', bold: true }]), { label: 'multi-cycle times', rowH: 24 }),
        note: 'Each coloured block is one clock cycle, coloured like the slider for that step (WB uses the register file, so it is the paler cyan). Every step is padded to a full cycle, so multi-cycle only wins when short instructions are common and the steps are balanced. The orange average comes from the orange % sliders.' };
    } });

  /* ---------- pipeline throughput & cost ---------- */
  FX.def('pipebw', {
    title: 'Pipeline throughput with register overhead, and cost', ref: 'L12 s10–s12', tex: String.raw`\text{BW}_k = \frac{1}{T/k + S} \qquad \text{Cost}_k = G + L\,k`,
    legend: [['T', 'total logic delay without pipelining'], ['S', 'delay added by each pipeline register'], ['k', 'number of stages'], ['G, L', 'cost of the logic, cost of one register']],
    vars: [{ k: 'T', label: String.raw`\(T\) (ps)`, min: 100, max: 5000, step: 50, v: 1000 }, { k: 'S', label: String.raw`\(S\) (ps)`, min: 0, max: 200, step: 5, v: 50 }, { k: 'k', label: String.raw`\(k\) stages`, min: 1, max: 30, step: 1, v: 5, int: true }],
    calc(v) {
      const k = Math.round(v.k), bw = 1 / (v.T / k + v.S), ideal = k / v.T, lim = v.S > 0 ? 1 / v.S : Infinity, unit = 1e3;
      return { sub: String.raw`\text{BW}_{${k}} = \frac{1}{${F(v.T)}/${k} + ${F(v.S)}} = \frac{1}{${F(v.T / k + v.S)}\ \text{ps}} ${EQ(bw * unit)} ${F(bw * unit)}\ \text{instr/ns}`,
        steps: [[String.raw`\frac{T}{k} = \frac{${F(v.T)}}{${k}} = ${F(v.T / k)}\ \text{ps}`, 'Logic per stage: the work is split k ways.'], [String.raw`T_c = ${F(v.T / k)} + ${F(v.S)} = ${F(v.T / k + v.S)}\ \text{ps}`, 'Each stage also pays the register delay S.'], [String.raw`\text{BW} = \frac{1}{${F(v.T / k + v.S)}\ \text{ps}} ${EQ(bw * unit)} ${F(bw * unit)}\ \text{per ns}`, 'One instruction finishes per cycle.'], [String.raw`\text{ideal } \frac{k}{T} = ${F(ideal * unit)}\ \text{per ns};\ \text{limit } \frac1S = ${v.S ? F(lim * unit) : '\\infty'}`, 'With no register overhead the throughput would grow forever; S caps it.']],
        viz: chart({ id: 'bw', x: [1, 30], y: [0, Math.min(30 / v.T, v.S ? 1.3 / v.S : 30 / v.T) * unit * 1.05], series: [{ f: x => x / v.T * unit, c: C.mut, dash: '5 4', label: 'ideal k/T', at: .35 }, { f: x => 1 / (v.T / x + v.S) * unit, c: C.blue, label: 'with S' }], hl: v.S ? [{ y: lim * unit, c: C.orange, label: 'limit 1/S' }] : [], marks: [{ x: k, y: bw * unit, c: C.green, label: P(bw * unit, 3) }], xl: 'stages k', yl: 'instructions per ns', label: 'throughput vs stages' }),
        note: 'More stages help less and less: the register delay S becomes a bigger share of every cycle. Cost G + Lk keeps rising, so there is a best k for performance per cost.' };
    } });

  /* ---------- pipeline cycles ---------- */
  FX.def('pipecycles', {
    title: 'Cycles for N instructions in a k-stage pipeline', ref: 'L12 s18 · L13', tex: String.raw`\text{cycles} = k + (N - 1) \qquad \text{speedup} = \frac{N k}{k + N - 1} \xrightarrow{N \to \infty} k`,
    legend: [['k', 'stages (5 in MIPS)'], ['N', 'instructions, with no stalls']],
    vars: [{ k: 'k', label: String.raw`\(k\)`, min: 2, max: 8, step: 1, v: 5, int: true }, { k: 'n', label: String.raw`\(N\)`, min: 1, max: 12, step: 1, v: 4, int: true }],
    calc(v) {
      const k = Math.round(v.k), n = Math.round(v.n), cyc = k + n - 1, sp = n * k / cyc, cw = Math.min(30, 400 / cyc); let g = '';
      const cols = [C.blue, C.cyan, C.green, C.yellow, C.mag, C.orange, C.teal, C.red];
      for (let i = 0; i < n; i++) for (let s = 0; s < k; s++) g += rect(40 + (i + s) * cw, 6 + i * 18, cw - 2, 15, cols[s % 8], { rx: 2, op: .85 });
      for (let i = 0; i < n; i++) g += text(34, 17 + i * 18, 'I' + (i + 1), { a: 'end', size: 10, c: C.mut });
      for (let c = 0; c < cyc; c++) g += text(40 + c * cw + cw / 2, 18 + n * 18, String(c + 1), { a: 'middle', size: 9, c: C.faint });
      return { sub: String.raw`${k} + (${n} - 1) = ${cyc}\ \text{cycles}\qquad \text{speedup} = \frac{${n} \times ${k}}{${cyc}} ${EQ(sp)} ${F(sp)}`,
        steps: [[String.raw`\text{first instruction: } ${k}\ \text{cycles}`, 'It has to pass through every stage to fill the pipeline.'], [String.raw`\text{each of the other } ${n - 1}: +1\ \text{cycle}`, 'After that, one instruction finishes every cycle.'], [String.raw`${k} + ${n - 1} = ${cyc}`, 'Total cycles.'], [String.raw`\text{non-pipelined: } ${n} \times ${k} = ${n * k}\ \text{stage-times}`, 'Without overlap each instruction takes all k stages on its own.'], [String.raw`\frac{${n * k}}{${cyc}} ${EQ(sp)} ${F(sp)}`, `Approaches k = ${k} as N grows.`]],
        viz: svg(Math.max(200, 40 + cyc * cw + 10), n * 18 + 26, g, 'pipeline staircase'), note: `With only ${n} instruction${n > 1 ? 's' : ''}, the fill and drain time matters; try N = 12 to see the speedup approach ${k}.` };
    } });

  /* ---------- stall CPI ---------- */
  FX.def('stallcpi', {
    title: 'CPI with stalls', ref: 'L14 s7 · L15 s14 · L16 s7', tex: String.raw`CPI = \frac{N + S}{N} = 1 + \frac{S}{N} = CPI_{ideal} + \sum(\text{fraction} \times \text{penalty})`,
    legend: [['N', 'instructions'], ['S', 'total stall cycles'], ['\\text{fraction}', 'share of instructions that cause a hazard'], ['\\text{penalty}', 'stall cycles each one costs']],
    vars: [{ k: 'f1', label: 'Hazard 1: % of instructions', unit: '%', min: 0, max: 100, step: 1, v: 25, col: 'red' }, { k: 'p1', label: 'Hazard 1: penalty (cycles)', min: 0, max: 5, step: 1, v: 2, col: 'red' }, { k: 'f2', label: 'Hazard 2: %', unit: '%', min: 0, max: 100, step: 1, v: 0, col: 'orange' }, { k: 'p2', label: 'Hazard 2: penalty', min: 0, max: 5, step: 1, v: 1, col: 'orange' }, { k: 'ghz', label: 'Clock (GHz)', min: .5, max: 5, step: .05, v: .5, col: 'teal' }],
    presets: [['Practice Test Q5: P1 25% × 2', { f1: 25, p1: 2, f2: 0, ghz: .5 }], ['L15 s14: every 5th stalls 2', { f1: 20, p1: 2, f2: 0 }], ['L16 s7: 40% × 1', { f1: 40, p1: 1, f2: 0 }]],
    calc(v) {
      const a = v.f1 / 100 * v.p1, b = v.f2 / 100 * v.p2, cpi = 1 + a + b, tpi = cpi / (v.ghz * 1e9);
      return { sub: String.raw`CPI = 1 + ${F(v.f1 / 100)} \times ${v.p1} + ${F(v.f2 / 100)} \times ${v.p2} ${EQ(cpi)} ${F(cpi)}\quad (${L.timeTex(tpi)}\ \text{per instruction})`,
        steps: [[String.raw`${F(v.f1 / 100)} \times ${v.p1} = ${F(a)}`, 'Average extra cycles from hazard 1: how often × how long.'], [String.raw`${F(v.f2 / 100)} \times ${v.p2} = ${F(b)}`, 'Same for hazard 2.'], [String.raw`CPI = 1 + ${F(a)} + ${F(b)} = ${F(cpi)}`, 'The ideal pipeline finishes one instruction per cycle; stalls add on top.'], [String.raw`\frac{CPI}{f} = \frac{${F(cpi)}}{${F(v.ghz)} \times 10^9} ${EQ(tpi)} ${L.timeTex(tpi)}`, 'Time per instruction = CPI × clock period.']],
        viz: hbars([{ label: 'CPI', segs: [{ v: 1, c: C.mut, op: .55, label: 'ideal 1' }, { v: a, c: C.red, label: a > .15 ? '+' + P(a) : '' }, { v: b, c: C.orange, label: b > .15 ? '+' + P(b) : '' }], right: P(cpi), bold: true }], { max: Math.max(2, cpi * 1.05), label: 'CPI bar', rowH: 40 }),
        note: 'Only the average matters: 25% of instructions stalling 2 cycles costs the same as every instruction stalling half a cycle.' };
    } });

  /* ---------- stall distance ---------- */
  FX.def('distance', {
    title: 'Stalls from a RAW dependency, by distance', ref: 'L16 s5–s6, s11 · R1 s28', tex: String.raw`\text{no forwarding: } \max(0,\,3-d) \qquad \text{forwarding: ALU } 0,\ \text{load } \max(0,\,2-d)`,
    legend: [['d', 'distance: 1 = the very next instruction'], ['3', 'producer writes in WB (cycle 5); consumer reads in ID — the register file writes in the first half and reads in the second']],
    modes: [['nofwd', 'No forwarding'], ['fwd', 'Forwarding · ALU producer'], ['fwdld', 'Forwarding · load producer']],
    vars: [{ k: 'd', label: String.raw`Distance \(d\)`, min: 1, max: 4, step: 1, v: 1, int: true }],
    calc(v, mode) {
      const d = Math.round(v.d), ld = mode === 'fwdld'; if (ld) mode = 'fwd'; const st = mode === 'fwd' ? (ld ? Math.max(0, 2 - d) : 0) : Math.max(0, 3 - d);
      const S = ['IF', 'ID', 'EX', 'MEM', 'WB'], cols = { IF: 'var(--st-if)', ID: 'var(--st-id)', EX: 'var(--st-ex)', MEM: 'var(--st-mem)', WB: 'var(--st-wb)' }, cw = 40; let g = '';
      const row = (y, start, label, stalls) => { let s = text(70, y + 13, label, { a: 'end', size: 10.5, mono: 1 }); let c = start; S.forEach((st2, i) => { if (i === 2 && stalls) { for (let q = 0; q < stalls; q++) { s += rect(80 + c * cw, y, cw - 3, 18, C.red, { op: .25, rx: 2 }) + text(80 + c * cw + cw / 2 - 1.5, y + 13, 'stall', { a: 'middle', size: 9, c: C.red, b: 1 }); c++; } } s += rect(80 + c * cw, y, cw - 3, 18, cols[st2], { op: .85, rx: 2 }) + text(80 + c * cw + cw / 2 - 1.5, y + 13, st2, { a: 'middle', size: 9.5, c: '#fff', b: 1 }); c++; }); return s; };
      g += row(6, 0, ld ? 'lw $t0' : 'add $t0', 0);
      for (let i = 1; i < d; i++) g += row(6 + i * 24, i, 'other', 0);
      g += row(6 + d * 24, d, 'use $t0', st);
      return { sub: mode === 'fwd' ? (ld ? String.raw`\max(0,\ 2 - ${d}) = ${st}` : String.raw`\text{ALU producer} \Rightarrow 0`) : String.raw`\max(0,\ 3 - ${d}) = ${st}`,
        steps: mode === 'fwd' ? (ld ? [[String.raw`\text{load data ready: end of MEM (cycle 4)}`, 'A load only has its value after reading data memory.'], [String.raw`\text{consumer needs it: start of its EX (cycle } ${d} + 3)`, 'Forwarding delivers the value into the ALU input.'], [String.raw`\max(0,\ 2 - ${d}) = ${st}`, d === 1 ? 'Back-to-back: one bubble is unavoidable (the load-use hazard).' : 'Far enough apart: forwarding from MEM/WB covers it.']] : [[String.raw`\text{ALU result ready: end of EX}`, 'Available in EX/MEM right after the producer’s EX.'], [String.raw`\text{forwarded into the next EX} \Rightarrow 0`, 'The consumer’s EX comes one cycle later — just in time.']]) : [[String.raw`\text{producer writes in WB: cycle 5}`, 'Without forwarding the value must go through the register file.'], [String.raw`\text{consumer reads in ID: cycle } ${d} + 2`, 'An instruction d places later is d cycles behind.'], [String.raw`\text{needs } ${d} + 2 + \text{stalls} \ge 5 \Rightarrow \max(0, 3 - ${d}) = ${st}`, 'The read may happen in the same cycle as the write (write first half, read second half).']],
        viz: svg(420, 6 + (d + 1) * 24 + 4, g, 'pipeline with stalls'), note: st ? `${st} bubble${st > 1 ? 's' : ''}: the dependent instruction waits in ID.` : 'No stall needed.' };
    } });

FX.def('branchcpi', {
    title: 'CPI with branch penalties', ref: 'P&H §4.8 · PS3 Q3', tex: String.raw`CPI = 1 + b \times m \times p`,
    legend: [['b', 'fraction of instructions that are branches'], ['m', 'fraction of those that pay the penalty (mispredicted, or all of them if you always stall)'], ['p', 'penalty in cycles per wrong guess']],
    modes: [['stall', 'Always stall'], ['nt', 'Predict not taken'], ['dyn', 'Dynamic prediction']],
    vars: [{ k: 'b', label: 'Branches (% of instructions)', unit: '%', min: 0, max: 50, step: 1, v: 20, col: 'red' }, { k: 't', label: 'Taken (% of branches)', unit: '%', min: 0, max: 100, step: 1, v: 60, modes: ['nt'], col: 'red' }, { k: 'acc', label: 'Prediction accuracy', unit: '%', min: 50, max: 100, step: 1, v: 90, modes: ['dyn'], col: 'red' }, { k: 'p', label: 'Penalty (cycles)', min: 1, max: 5, step: 1, v: 1, int: true, col: 'red' }],
    presets: [['PS3 Q3 style: 25% branches, 60% taken, 2-cycle penalty', { b: 25, t: 60, p: 2 }], ['P&H: branch decided in ID, 1 cycle', { b: 17, t: 60, p: 1 }]],
    calc(v, mode) {
      const b = v.b / 100, m = mode === 'stall' ? 1 : mode === 'nt' ? v.t / 100 : 1 - v.acc / 100, extra = b * m * v.p, cpi = 1 + extra;
      const why = mode === 'stall' ? 'Every branch waits for its outcome.' : mode === 'nt' ? 'Predict not taken is wrong exactly when the branch is taken.' : 'Only mispredictions pay.';
      return { sub: String.raw`CPI = 1 + ${F(b)} \times ${F(m)} \times ${v.p} ${EQ(cpi)} ${F(cpi)}`,
        steps: [[String.raw`m = ${F(m)}`, why], [String.raw`${F(b)} \times ${F(m)} \times ${v.p} = ${F(extra)}`, 'Average extra cycles per instruction from branches.'], [String.raw`CPI = 1 + ${F(extra)} = ${F(cpi)}`, 'On top of the ideal CPI of 1.']],
        viz: FX.hbars([{ label: 'CPI', segs: [{ v: 1, c: C.mut, op: .55, label: 'ideal 1' }, { v: extra, c: C.red, label: extra > .12 ? '+' + Logic.fmt(extra, 3) : '' }], right: Logic.fmt(cpi, 3), bold: true }], { max: Math.max(1.6, cpi * 1.05), label: 'CPI bar', rowH: 40 }),
        note: mode === 'dyn' ? 'Raising accuracy from 90% to 95% halves the branch cost — that is why predictors get so much hardware.' : 'Compare the three modes with the same numbers to see what prediction buys.' };
    } });

  FX.def('amat', {
    title: 'Average memory access time', ref: 'P&H §5.4', tex: String.raw`AMAT = t_{hit} + r_{miss} \times t_{penalty}`,
    legend: [['t_{hit}', 'time for a hit (cycles or ns)'], ['r_{miss}', 'miss rate'], ['t_{penalty}', 'extra time to fetch the block on a miss']],
    modes: [['one', 'One level'], ['two', 'Two levels (L1 + L2)']],
    vars: [{ k: 'h', label: 'L1 hit time (cycles)', min: 1, max: 5, step: 1, v: 1, int: true, col: 'blue' }, { k: 'm', label: 'L1 miss rate', unit: '%', min: 0, max: 30, step: .5, v: 5, col: 'orange' }, { k: 'pen', label: 'Main-memory penalty (cycles)', min: 10, max: 400, step: 10, v: 100, col: 'orange' }, { k: 'h2', label: 'L2 hit time (cycles)', min: 2, max: 40, step: 1, v: 10, modes: ['two'], col: 'magenta' }, { k: 'm2', label: 'L2 local miss rate', unit: '%', min: 0, max: 100, step: 1, v: 20, modes: ['two'], col: 'teal' }],
    presets: [['P&H example: 1-cycle hit, 5% misses, 20-cycle penalty', { h: 1, m: 5, pen: 20 }], ['With an L2', { h: 1, m: 5, pen: 100, h2: 10, m2: 20 }]],
    calc(v, mode) {
      const m = v.m / 100;
      if (mode === 'two') { const l2 = v.h2 + v.m2 / 100 * v.pen, a = v.h + m * l2;
        return { sub: String.raw`AMAT = ${v.h} + ${F(m)} \times (${v.h2} + ${F(v.m2 / 100)} \times ${v.pen}) ${EQ(a)} ${F(a)}\ \text{cycles}`,
          steps: [[String.raw`\text{L1 miss penalty} = ${v.h2} + ${F(v.m2 / 100)} \times ${v.pen} = ${F(l2)}`, 'An L1 miss goes to L2; only L2 misses go to memory.'], [String.raw`AMAT = ${v.h} + ${F(m)} \times ${F(l2)} = ${F(a)}`, 'Same formula one level up.']],
          viz: FX.hbars([{ label: 'L1 only', segs: [{ v: v.h, c: C.blue, label: 'hit ' + v.h }, { v: m * v.pen, c: C.orange, label: m * v.pen > .8 ? 'misses +' + Logic.fmt(m * v.pen, 2) : '' }], right: Logic.fmt(v.h + m * v.pen, 3) }, { label: 'with L2', segs: [{ v: v.h, c: C.blue, label: 'hit ' + v.h }, { v: m * v.h2, c: C.mag, label: m * v.h2 > .6 ? 'L2 +' + Logic.fmt(m * v.h2, 2) : '' }, { v: m * v.m2 / 100 * v.pen, c: C.teal, label: m * v.m2 / 100 * v.pen > .8 ? 'mem +' + Logic.fmt(m * v.m2 / 100 * v.pen, 2) : '' }], right: Logic.fmt(a, 3), bold: true }], { max: Math.max(4, (v.h + m * v.pen) * 1.05), label: 'AMAT with and without L2', rowH: 34 }),
          note: `Without the L2 it would be ${F(v.h + m * v.pen)} cycles. Blue = L1 hit time; purple = L1 misses that hit in L2 (L1 miss rate × L2 hit time); teal = the ones that go on to memory.` }; }
      const a = v.h + m * v.pen;
      return { sub: String.raw`AMAT = ${v.h} + ${F(m)} \times ${v.pen} ${EQ(a)} ${F(a)}\ \text{cycles}`, steps: [[String.raw`${F(m)} \times ${v.pen} = ${F(m * v.pen)}`, 'Average extra time per access from misses.'], [String.raw`${v.h} + ${F(m * v.pen)} = ${F(a)}`, 'Every access pays the hit time.']],
        viz: FX.hbars([{ label: 'AMAT', segs: [{ v: v.h, c: C.blue, label: 'hit ' + v.h }, { v: m * v.pen, c: C.orange, label: m * v.pen > .6 ? 'misses +' + Logic.fmt(m * v.pen, 2) : '' }], right: Logic.fmt(a, 3), bold: true }], { max: Math.max(4, a * 1.05), label: 'AMAT', rowH: 40 }), note: 'Halving the miss rate helps exactly as much as halving the miss penalty.' };
    } });

  FX.def('cachecpi', {
    title: 'CPI with cache misses', ref: 'P&H §5.4', tex: String.raw`CPI = CPI_{base} + 1 \times r_I \times p + f_{ls} \times r_D \times p`,
    legend: [['r_I', 'instruction-cache miss rate (every instruction is fetched)'], ['f_{ls}', 'fraction of instructions that are loads/stores'], ['r_D', 'data-cache miss rate'], ['p', 'miss penalty (cycles)']],
    vars: [{ k: 'base', label: 'Base CPI', min: 1, max: 3, step: .1, v: 2, col: 'blue' }, { k: 'ri', label: 'I-cache miss rate', unit: '%', min: 0, max: 10, step: .5, v: 2, col: 'orange' }, { k: 'ls', label: 'Loads + stores', unit: '%', min: 0, max: 60, step: 1, v: 36, col: 'magenta' }, { k: 'rd', label: 'D-cache miss rate', unit: '%', min: 0, max: 20, step: .5, v: 4, col: 'magenta' }, { k: 'p', label: 'Miss penalty (cycles)', min: 10, max: 300, step: 10, v: 100, col: 'teal' }],
    presets: [['P&H §5.4 example: base 2, 2% I, 4% D, 36% ld/st, 100 cycles', { base: 2, ri: 2, ls: 36, rd: 4, p: 100 }]],
    calc(v) {
      const i = v.ri / 100 * v.p, d = v.ls / 100 * v.rd / 100 * v.p, cpi = v.base + i + d;
      return { sub: String.raw`CPI = ${F(v.base)} + ${F(i)} + ${F(d)} ${EQ(cpi)} ${F(cpi)}`,
        steps: [[String.raw`1 \times ${F(v.ri / 100)} \times ${v.p} = ${F(i)}`, 'Every instruction is fetched, so every one can miss in the I-cache.'], [String.raw`${F(v.ls / 100)} \times ${F(v.rd / 100)} \times ${v.p} = ${F(d)}`, 'Only loads and stores use the D-cache.'], [String.raw`${F(v.base)} + ${F(i)} + ${F(d)} = ${F(cpi)}`, 'Memory stalls add to the base CPI.'], [String.raw`\dfrac{${F(cpi)}}{${F(v.base)}} ${EQ(cpi / v.base)} ${F(cpi / v.base, 3)}`, 'How many times faster a perfect cache would be.']],
        viz: FX.hbars([{ label: 'CPI', segs: [{ v: v.base, c: C.blue, label: 'base ' + F(v.base) }, { v: i, c: C.orange, label: i > .3 ? 'I +' + Logic.fmt(i, 2) : '' }, { v: d, c: C.mag, label: d > .3 ? 'D +' + Logic.fmt(d, 2) : '' }], right: Logic.fmt(cpi, 3), bold: true }], { max: Math.max(4, cpi * 1.05), label: 'CPI', rowH: 40 }) };
    } });

  FX.def('addrsplit', {
    title: 'Splitting an address: tag | index | offset', ref: 'P&H §5.3–5.4', tex: String.raw`\text{offset} = \log_2(\text{block bytes}),\ \ \text{index} = \log_2(\text{sets}),\ \ \text{tag} = \text{address bits} - \text{index} - \text{offset}`,
    legend: [['\\text{sets}', 'blocks ÷ ways (ways = 1 for direct-mapped)'], ['\\text{blocks}', 'cache data size ÷ block size']],
    vars: [{ k: 'kb', label: 'Cache data size (KiB)', min: 1, max: 256, step: 1, v: 16, col: 'green' }, { k: 'bw', label: 'Block size (words)', min: 1, max: 16, step: 1, v: 4, int: true, col: 'orange' }, { k: 'ways', label: 'Ways (associativity)', min: 1, max: 16, step: 1, v: 1, int: true, col: 'green' }, { k: 'ab', label: 'Address bits', min: 16, max: 64, step: 1, v: 32, int: true, col: 'magenta' }],
    presets: [['P&H: 16 KiB, 4-word blocks, direct-mapped, 32-bit', { kb: 16, bw: 4, ways: 1, ab: 32 }], ['Same, 4-way', { kb: 16, bw: 4, ways: 4, ab: 32 }]],
    calc(v) {
      const pow = x => Math.pow(2, Math.round(log2(x))), kb = pow(v.kb), bw = pow(v.bw), ways = pow(v.ways), bytes = kb * 1024, bb = bw * 4, blocks = bytes / bb, sets = Math.max(1, blocks / ways);
      const off = log2(bb), idx = log2(sets), tag = v.ab - idx - off;
      const W = 420, x0 = 10, tw = (W - 20) * tag / v.ab, iw = (W - 20) * idx / v.ab, ow = (W - 20) * off / v.ab, seg = (x, w, c, t) => w > 0 ? FX.rect(x, 10, w - 2, 30, c, { op: .85, rx: 3 }) + FX.text(x + w / 2, 30, t, { a: 'middle', size: 11, c: '#fff', b: 1 }) : '';
      const g = seg(x0, tw, C.mag, 'tag ' + tag) + seg(x0 + tw, iw, C.green, idx ? 'index ' + idx : '') + seg(x0 + tw + iw, ow, C.orange, 'offset ' + off);
      return { sub: String.raw`\text{tag } ${tag}\ |\ \text{index } ${idx}\ |\ \text{offset } ${off}`,
        steps: [[String.raw`\text{block} = ${bw} \times 4 = ${bb}\ \text{bytes} \Rightarrow \text{offset} = \log_2 ${bb} = ${off}`, 'Offset bits pick the byte inside a block.'], [String.raw`\text{blocks} = ${bytes} / ${bb} = ${blocks}`, `${kb} KiB = ${bytes} bytes.`], [String.raw`\text{sets} = ${blocks} / ${ways} = ${sets} \Rightarrow \text{index} = ${idx}`, ways === 1 ? 'Direct-mapped: one block per set.' : 'Each set holds ' + ways + ' blocks.'], [String.raw`\text{tag} = ${v.ab} - ${idx} - ${off} = ${tag}`, 'Whatever is left identifies which block is in the line.']],
        viz: FX.svg(W, 50, g, 'address split'), note: kb !== v.kb || bw !== v.bw || ways !== v.ways ? 'Sizes are rounded to powers of two.' : 'More ways → fewer sets → fewer index bits and more tag bits.' };
    } });
