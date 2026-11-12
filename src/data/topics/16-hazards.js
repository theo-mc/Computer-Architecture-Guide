import { R, B } from '../../utils/dsl.js';

export default {
  id: 'hazards', num: 16, file: 'hazards-structural', week: 5, lectures: ['L14'],
  title: 'Pipeline hazards, stalls and structural hazards', short: 'Hazards & structural',
  keywords: 'hazard stall bubble structural data control resource contention memory separate caches dual ported register file cpi stalls',
  taught: 'L14 s1–s12 (Week 5). Reviewed R1 s23–s24. Practised in PS3 Q1a, Q3 and Practice Test Q5.',
  overview: {
    lede: 'Why real pipelines don’t hit the ideal: the three hazard types, what a stall costs (CPI = (N+S)/N), and the two cures for structural hazards — stall, or add hardware.',
    about: R`<p>A hazard stops the next instruction from executing in its designated cycle. The fix of last resort is a <b>stall</b> (bubble), which costs cycles: CPI rises above 1. Structural hazards come from two instructions needing the same hardware at once — classically one memory used by both IF and MEM — and are cured by stalling or by duplicating resources (split instruction/data caches, a dual-ported register file, a separate PC adder).</p>`,
    canDo: ['List the non-idealities of real instruction pipelines.', 'Define structural, data and control hazards in one line each.', 'Compute CPI from stall cycles, and from hazard percentages and penalties.', 'Compare processors with different clocks and CPIs.', 'Explain the structural hazard on a single memory and give the hardware fixes and their trade-off.'],
    buildsOn: ['pipe'],
  },
  notation: [
    ['Hazard', 'A situation that prevents the next instruction from executing in its designated clock cycle', 'L14 s6'],
    ['Stall / bubble', 'A lost cycle in which a stage does no useful work (like a nop)', 'L14 s7; L15 s13'],
    [R`\(N\)`, 'Number of instructions', ''],
    [R`\(S\)`, 'Number of stall cycles', ''],
    [R`\(CPI = \dfrac{N + S}{N}\)`, 'Average CPI with stalls (ideal pipeline CPI = 1)', 'L14 s7'],
    ['Penalty', 'Cycles lost each time a hazard happens', ''],
    ['Dual-ported', 'Can be accessed by two operations in the same cycle', 'L14 s11'],
  ],
  steps: [
    { title: 'Ideal pipeline vs reality', ref: 'L14 s3–s5', blocks: [
      B.p('S', 'L14 s3', R`<p>The potential speedup is proportional to the number of stages — only if all stages take the same time and nothing ever interrupts execution. Unfortunately, sometimes an instruction can't move from one stage to the next every cycle.</p>`),
      B.tbl({ src: 'S', ref: 'L14 s5', head: ['Ideal assumption', 'Reality in an instruction pipeline'], rows: [['Repetition of identical operations', 'Different instructions don’t need the same stages, but are forced through them → some stages idle for some instructions'], ['Uniformly partitionable sub-operations', 'Stages have different latencies but share one clock → fast stages wait; resources are shared (register file in ID and WB) → contention'], ['Independent operations', 'Instructions depend on each other → detect and resolve dependencies → pipeline stalls']] }),
    ] },
    { title: 'Hazards and stalls', ref: 'L14 s6–s7', blocks: [
      B.p('S', 'L14 s6', R`<p>Example: <code>Add R2, R4, R5</code> then <code>Add R8, R2, R6</code>. The second needs R2 from the first, so it is <b>stalled in the decode stage for two cycles</b>. That stalls the instruction behind it in fetch, and no new instruction can enter until things move again.</p>`),
      B.tool('pipeSim', { preset: 'l14', presets: ['l14', 'l15'] }),
      B.p('S', 'L14 s7', R`<p>Each stall cycle is one cycle in which no instruction completes. For a program with \(N\) instructions and \(S\) stall cycles:</p>\[\text{Average CPI} = \frac{N + S}{N}\]<p>S depends on how often dependences occur and on the distance between dependent instructions. Stalls are a major limit on pipelined performance.</p>`),
      B.wk({ src: 'L', ref: 'L14 [16:41]–[17:53]', title: '100 instructions, 20 stall cycles', steps: [
        [R`CPI = \dfrac{N + S}{N} = \dfrac{100 + 20}{100}`, 'N = 100, S = 20.'],
        [R`= \dfrac{120}{100} = 1.2`, R`100 + 20 = 120 cycles, and 120 ÷ 100 = 1.2.`],
      ], result: 'CPI 1.2 instead of the ideal 1.0 — 20% more cycles.' }),
    ] },
    { title: 'Three types of hazard', ref: 'L14 s8', blocks: [
      B.key('One question per hazard type', R`<ul><li><b>Structural:</b> do two instructions need the <i>same piece of hardware</i> in the same cycle?</li><li><b>Data:</b> does an instruction need a <i>value</i> that an earlier instruction hasn't produced yet?</li><li><b>Control:</b> does the processor not yet know <i>which instruction</i> to fetch next (after a branch)?</li></ul>`),
      B.tbl({ src: 'S', ref: 'L14 s8', head: ['Hazard', 'Definition (slide)', 'Memory aid (L14 [21:20])'], rows: [['Structural', 'Two or more instructions require the same hardware resource at the same time', 'hardware resource conflict'], ['Data', 'A source or destination operand of an instruction is not available when needed in the pipeline; processing is delayed until it is', 'data dependency between instructions'], ['Control', 'A delay in the availability of an instruction, or of the memory address needed to fetch it (branches, jumps)', 'uncertainty about the instruction flow']], caption: 'Control hazards are taught from L17 (after Test 1). Data hazards: Topics 17–18.' }),
    ] },
    { title: 'Structural hazards: one memory for IF and MEM', ref: 'L14 s9–s10', blocks: [
      B.analogy('One bathroom, two people', R`<p>Two flatmates both need the only bathroom at 8 am. One has to wait — not because they depend on each other, but because there is one shared resource. That is a structural hazard. The fixes are the same as at home: make someone wait (stall), or build a second bathroom (more hardware).</p>`),
      B.p('S', 'L14 s9', R`<p>Both IF and MEM access memory. In the same cycle a new instruction is fetched in IF while a load reads data in MEM. With only one memory, they collide.</p>`),
      B.p('S', 'L14 s10', R`<p><b>Solution 1:</b> detect the contention and stall one of the contending stages. In the slide example instruction i+3 waits in cycle 4 for the load to finish its memory access. The stall delays that instruction <i>and all those following it</i>.</p>`),
      B.tool('pipeSim', { preset: 'st', presets: ['st'] }),
    ] },
    { title: 'Mitigating structural hazards with more hardware', ref: 'L14 s11', blocks: [
      B.p('S', 'L14 s11', R`<p><b>Solution 2:</b> eliminate the cause of contention by adding hardware.</p><ul><li>IF vs MEM memory conflict → <b>separate instruction and data caches</b>.</li><li>Register access in ID and WB → <b>dual-ported register file</b>; <b>write early in WB, read late in ID</b> (write in the first half of the cycle, read in the second).</li><li>Why no structural hazard on the ALU between IF (PC ← PC + 4) and EX? → <b>PC + 4 uses a dedicated adder, not the ALU</b>.</li></ul>`),
      B.p('C', 'Discussion, 22 Oct (lecturer reply)', R`<p>A student asked whether extra hardware sitting idle undermines pipelining. The lecturer: "some hardware resources may remain idle when there [are] no resource conflicts, but this doesn't mean that pipelining leads to inefficient hardware utilisation. The main purpose of pipelining is to improve instruction throughput… adding more hardware resources can reduce structural hazards, but it also increases hardware costs, power consumption and design complexity… The goal isn't to eliminate every hazard at any cost, but to achieve an effective balance."</p>`),
    ] },
    { title: 'CPI from hazard rates, and comparing processors', ref: 'L15 s14; PS3 Q3; Practice Test Q5', blocks: [
      B.p('S', 'L15 s14', R`\[CPI = CPI_{ideal} + \sum_{\text{hazards}} (\text{fraction of instructions affected}) \times (\text{penalty in cycles})\]<p>"If every 5th instruction causes a 2-cycle stall… CPI can increase by (1/5) × 2 = 0.4" → CPI 1.4.</p>`),
      B.wk({ src: 'A', ref: 'same method as Practice Test Q5 (try that one in Practice below)', title: 'P1: 20% of instructions stall 3 cycles, 1 GHz. P2: 30% stall 2 cycles, 1.25 GHz. Which is faster?', steps: [
        [R`CPI_{P1} = 1 + 0.2 \times 3 = 1.6`, 'Ideal CPI 1 plus fraction × penalty: 0.2 × 3 = 0.6.'],
        [R`CPI_{P2} = 1 + 0.3 \times 2 = 1.6`, 'Same formula: 0.3 × 2 = 0.6. Equal CPIs — so the clock decides.'],
        [R`T_{c,P1} = \frac{1}{1\ \text{GHz}} = 1\ \text{ns},\quad T_{c,P2} = \frac{1}{1.25\ \text{GHz}} = 0.8\ \text{ns}`, 'Clock period = 1 ÷ rate.'],
        [R`\frac{T_{P1}}{T_{P2}} = \frac{N \times 1.6 \times 1}{N \times 1.6 \times 0.8} = \frac{1}{0.8} = 1.25`, 'Same program (N cancels); same CPI (cancels).'],
      ], result: 'P2 is 1.25 times faster. Comparing CPIs alone would have called it a draw — always include the clock.' }),
      B.dis({ id: 'pt-q5', title: '"0.83 times faster"?', items: [['Official solution, Practice Test Q5', '"Execution_timeP1 / Execution_timeP2 = 1.5/1.8 = 0.83. It will run 0.83 times faster on P1 than on P2."'], ['Slides L03 s7 and lecture L03 [12:37]', '"A is n times faster than B" means n = T_B / T_A; "the faster machine is x times faster than the slower machine" — n ≥ 1.']], likely: 'Write "P1 is 1.2 times faster than P2 (T_P1/T_P2 = 0.83, i.e. P1 takes 83% of P2’s time)". That contains the official number and states it correctly, so it is safe whichever way it is marked.' }),
      B.fx('stallcpi'),
      B.tool('stallCPI', { hazards: [['Data', 25, 2], ['Data (P2 rate)', 40, 2]], procs: [['P1', 0.5, [1, 0]], ['P2', 0.5, [0, 1]]] }),
      B.p('O', 'PS3 Q3 (uses branch prediction, taught in L17+)', R`<p>PS3 Q3 adds a third kind: 25% of instructions are branches, 60% of branches are taken, a wrong guess costs 2 cycles. "Predict not taken" guesses wrong 60% of the time: \(0.25 \times 0.6 \times 2 = 0.3\) extra CPI; "predict taken" is wrong 40%: \(0.25 \times 0.4 \times 2 = 0.2\). The idea is the same — fraction × probability of a stall × penalty — but the branch material itself is Test 2 content.</p>`),
    ] },
  ],
  keyPoints: [
    'Real pipelines: non-identical instructions, unequal/shared stages, dependent instructions.',
    'Hazard = next instruction can’t run in its designated cycle. Types: structural (resource), data (operand not ready), control (next instruction unknown).',
    R`Stall cycles raise CPI: \(CPI = (N + S)/N = 1 + \sum f \times p\).`,
    'Structural fix 1: stall (cheap hardware, lost cycles). Fix 2: more hardware — split I/D caches, dual-ported register file (write first half, read second), dedicated PC+4 adder.',
    'Adding hardware costs area, power and complexity — a balance, not "remove every hazard".',
    'Compare processors with time = IC × CPI / f, not CPI alone.',
  ],
  traps: [
    '<b>"0.83 times faster".</b> Say the faster one is 1.2× faster.',
    '<b>Comparing CPIs with different clocks.</b> Divide CPI by clock rate (or multiply by period) first (PS3 Q3d: P3 has the worst CPI but is fastest).',
    '<b>A stall delays everything behind it</b>, not just one instruction.',
    '<b>Why no ALU conflict between IF and EX?</b> PC + 4 has its own adder.',
    '<b>Percentages of branches vs of instructions.</b> In PS3 Q3 the misprediction term is 0.25 × 0.6 × 2, not 0.6 × 2.',
  ],
  };
