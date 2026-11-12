import { R, B } from '../../utils/dsl.js';

export default {
  id: 'multi', num: 14, file: 'multi-cycle', week: 4, lectures: ['L11', 'L12'],
  title: 'Multi-cycle microarchitecture', short: 'Multi-cycle machines',
  keywords: 'multi cycle clock step max cpi average time per instruction idle hardware concurrency',
  taught: 'L11 s1–s10 and L12 s3, s16 (Week 4). Reviewed R1 s18, s21. Practised in PS2 Q5.',
  overview: {
    lede: 'Split each instruction into steps, give each step its own short clock cycle, and let instructions take different numbers of cycles. Faster clock, higher CPI — and idle hardware.',
    about: R`<p>The multi-cycle machine fixes the single-cycle problem (every instruction waits for the slowest) by making the clock as long as the slowest <b>step</b>. A load takes 5 cycles, a store or ALU op 4, a branch 3. Hardware can be reused across cycles, but control becomes a finite-state machine and extra registers are needed. Whether it beats single-cycle depends on the stage balance and the instruction mix — and it still leaves most hardware idle, which motivates pipelining.</p>`,
    canDo: ['Explain how multi-cycle differs from single-cycle and why its clock is shorter.', 'State cycles per instruction class (lw 5, sw 4, ALU 4, branch 3).', 'Compute multi-cycle clock, per-class times and the weighted average time per instruction.', 'Compare single- and multi-cycle throughput for a given mix.', 'Explain the limited-concurrency problem.'],
    buildsOn: ['single'],
  },
  notation: [
    [R`\(T_c\)`, 'Clock period', 'ps or ns'],
    [R`\(T_{c,\,single}\)`, 'Single-cycle clock = slowest instruction’s total', ''],
    [R`\(T_{c,\,multi}\)`, 'Multi-cycle clock = slowest single step', ''],
    [R`\(p_i\)`, 'Fraction of instructions in class i', '30% → 0.3'],
    [R`\(\overline{T}\)`, 'Average time per instruction = Σ pᵢ × (cyclesᵢ × T_c)', ''],
    ['Throughput', 'Instructions completed per second = 1 / (average time per instruction)', ''],
    ['FSM', 'Finite-state machine (the multi-cycle control unit)', 'L11 [12:09]'],
    ['Concurrency', 'Several tasks making progress in the same period of time', 'L11 [19:30]'],
  ],
  steps: [
    { title: 'Recap: what’s wrong with single-cycle', ref: 'L11 s3–s4', blocks: [
      B.p('S', 'L11 s3–s4', R`<p>Inefficient (all instructions as slow as the slowest) and hard to optimise (common-case improvements don't shorten the clock). CPI = 1 but the clock cycle is long. "Can we do better?"</p>`),
    ] },
    { title: 'The multi-cycle idea', ref: 'L11 s6–s7', blocks: [
      B.analogy('A canteen with a one-length queue', R`<p>A single-cycle machine is a canteen where every customer, whether they want a coffee or a three-course meal, is given exactly the time the three-course meal takes. A multi-cycle machine gives out time in small equal slots: a coffee takes 2 slots, a meal 5. Short orders finish early — but every order is rounded up to whole slots, so a 1.2-slot task still costs 2.</p>`),
      B.p('S', 'L11 s6', R`<p>Step 1: process part of the instruction in one clock cycle; step 2: the next part in the next cycle; … until AS becomes AS′. "One instruction can take multiple clock cycles, but each individual cycle can be much shorter" (L11 [6:16]).</p>`),
      B.p('L', 'L11 [7:33]–[10:55]', R`<p>Single-cycle: the cycle must fit the complete datapath of the slowest instruction, so a store wastes the tail of its long cycle. Multi-cycle: a load takes five short cycles, but a store only four — "once the store instruction has completed its fourth stage, the processor can immediately start fetching the next instruction". Different instructions take different numbers of cycles.</p>`),
    ] },
    { title: 'Implementation trade-offs', ref: 'L11 s8', blocks: [
      B.p('S', 'L11 s8', R`<p><b>Clock cycle = max(i-mem, reg-read + reg-write, ALU, d-mem)</b>. Combinational logic can be reused on different cycles: <b>one memory</b> (instructions and data are accessed in different cycles) and <b>one ALU</b> without other adders. But: <b>control is more complex</b> (a finite-state machine that remembers which step it's on), and <b>new registers</b> are needed to save values used again in later cycles.</p>`),
      B.p('L', 'L11 [13:23]–[15:00]', R`<p>"Less hardware and a shorter clock cycle, but more complicated control and additional temporary registers."</p>`),
    ] },
    { title: 'Performance: two independent knobs', ref: 'L11 s9; R1 s18', blocks: [
      B.p('S', 'L11 s9', R`<p>Single-cycle: CPI = 1, clock cycle time long. Multi-cycle: CPI different for each instruction (average CPI hopefully small), clock cycle time short — "now we have two degrees of freedom to optimize independently".</p>`),
      B.tbl({ src: 'S', ref: 'R1 s18', head: ['Class', 'Steps used', 'Cycles'], rows: [['Load', 'IF ID EX MEM WB', '5'], ['Store', 'IF ID EX MEM', '4'], ['ALU (R-type)', 'IF ID EX WB', '4'], ['Branch', 'IF ID EX', '3']], caption: 'R1 s18: "How is the clock cycle determined in a multi-cycle machine? Clock cycle time is determined by the slowest step."' }),
    ] },
    { title: 'Worked comparison (L12 s16 / R1 s21)', ref: 'L12 s16', blocks: [
      B.tbl({ src: 'S', ref: 'L12 s16', cls: 'mono', head: ['Class', 'Mix', 'IF', 'ID', 'EX', 'MEM', 'WB', 'Total'], rows: [['Load word', '30%', '200', '100', '200', '200', '100', '800'], ['Store word', '30%', '200', '100', '200', '200', '—', '700'], ['R-format', '20%', '200', '100', '200', '—', '100', '600'], ['Branch', '20%', '200', '100', '200', '—', '—', '500']] }),
      B.wk({ src: 'S', ref: 'L12 s16; R1 Part II [38:59]–[43:51]', title: 'Single-cycle vs multi-cycle', steps: [
        [R`T_{c,\,single} = \max(800, 700, 600, 500) = 800\ \text{ps}`, 'Design for the worst case (the load).'],
        [R`T_{c,\,multi} = \max(200, 100, 200, 200, 100) = 200\ \text{ps}`, 'Design for the slowest individual step.'],
        [R`\text{LW} = 5 \times 200 = 1000,\ \text{SW} = 4 \times 200 = 800,\ \text{R} = 4 \times 200 = 800,\ \text{BEQ} = 3 \times 200 = 600`, 'Cycles × clock. Note the 100 ps steps still take a full 200 ps cycle.'],
        [R`\overline{T} = 0.3 \times 1000 + 0.3 \times 800 + 0.2 \times 800 + 0.2 \times 600`, 'Weight by the instruction mix.'],
        [R`= 300 + 240 + 160 + 120 = 820\ \text{ps}`, R`0.3 × 1000 = 300; 0.3 × 800 = 240; 0.2 × 800 = 160; 0.2 × 600 = 120. Add them.`],
      ], result: '820 ps > 800 ps: for this program multi-cycle is slightly SLOWER than single-cycle. "Can we do better?" → pipelining.' }),
      B.key('Method for single- vs multi-cycle questions', R`<ol><li><b>Single-cycle clock</b> = the longest instruction's total delay (sum of its steps).</li><li><b>Multi-cycle clock</b> = the longest single <i>step</i> (any instruction).</li><li><b>Multi-cycle time per instruction</b> = (number of steps it uses) × multi-cycle clock — lw 5, sw 4, R-type 4, beq 3.</li><li><b>Average</b> over the program = Σ (fraction × time). Compare with the single-cycle clock (which is also its time per instruction).</li></ol>`),
      B.fx('multicycle'),
      B.tool('cycleCompare', { preset: 'l12' }),
      B.check(R`<p>With the L12 s16 delays, which instruction class gains most from multi-cycle compared with single-cycle, and which loses?</p>`, R`<p>beq gains most: 600 ps instead of 800 ps. lw loses: 5 × 200 = 1000 ps instead of 800 ps, because its 100 ps ID and WB steps are each padded to a full 200 ps cycle.</p>`),
    ] },
    { title: 'Limited concurrency', ref: 'L11 s10–s11', blocks: [
      B.p('S', 'L11 s10', R`<p>Limitation: <b>limited concurrency</b>. Some hardware is idle during different phases: fetch logic is idle while an instruction is being decoded or executed; most of the datapath is idle during a memory access.</p>`),
      B.p('L', 'L11 [18:16]–[20:37]', R`<p>Concurrency = several tasks making progress in the same period (one CPU can switch between tasks). Parallelism = several tasks executing at the same instant (needs more cores). The multi-cycle machine works on only one instruction at a time, so idle units could be doing work for other instructions → pipelining (Topic 15).</p>`),
    ] },
  ],
  keyPoints: [
    'Multi-cycle: each step is one short cycle; the clock = the slowest single step.',
    'Cycles per class: lw 5, sw 4, R-type 4, branch 3.',
    'Reuses hardware (one memory, one ALU) but needs FSM control and extra registers.',
    R`Average time = \(\sum p_i \times \text{cycles}_i \times T_c\); throughput = 1 / average.`,
    'Can be slower than single-cycle when stages are unbalanced (820 ps vs 800 ps).',
    'Main limitation: limited concurrency — most hardware idle in each cycle.',
  ],
  traps: [
    '<b>Clock = single-cycle clock ÷ 5.</b> No — it’s the slowest step; short steps still occupy a whole cycle.',
    '<b>Adding real stage times</b> for a multi-cycle instruction (e.g. 800 for lw) instead of cycles × clock (1000).',
    '<b>Forgetting to weight</b> by the instruction mix.',
    '<b>Assuming multi-cycle always wins.</b> Check the numbers (PS2 Q5: 25.02 ns vs 14 ns — slower).',
    '<b>Mixing up concurrency and parallelism.</b>',
  ],
  };
