import { R, B } from '../../utils/dsl.js';

export default {
  id: 'pipe', num: 15, file: 'pipelining', week: 4, weekLabel: '4–5', lectures: ['L11', 'L12', 'L13'],
  title: 'Pipelining: idea, ideal pipelines, registers and diagrams', short: 'Pipelining',
  keywords: 'pipelining laundry throughput latency stages ideal pipeline register overhead cost pipeline diagram if id ex mem wb k+n-1',
  taught: 'L11 s11–s13 (Week 4), L12 s1–s19 (Week 4), L13 s1–s11 (Week 5). Reviewed R1 s19–s22. Practised in PS2 Q5c, Q6b.',
  overview: {
    lede: 'Overlap instructions like an assembly line: each one still takes as long, but one finishes every cycle. Ideal speed-ups, the cost of pipeline registers, and how to read and draw pipeline diagrams.',
    about: R`<p>Pipelining divides instruction processing into stages (IF, ID, EX, MEM, WB) with a register between each, so five different instructions can be in flight at once. Throughput rises by up to the number of stages; latency of one instruction doesn't improve. Real pipelines are limited by the slowest stage, by register overhead and cost, and — next topics — by hazards.</p>`,
    canDo: ['Explain pipelining with the laundry analogy, separating latency and throughput.', 'State the conditions for an ideal pipeline.', 'Compute pipeline throughput with and without register overhead, and the hardware cost.', 'Find the pipelined clock from stage latencies and compare with single- and multi-cycle.', 'Name the four pipeline registers and draw/read operation-view and resource-view diagrams.', 'Count the cycles N instructions take in a k-stage pipeline.'],
    buildsOn: ['multi', 'uarch'],
  },
  notation: [
    [R`\(k\)`, 'Number of pipeline stages', '5 in MIPS'],
    [R`\(T\)`, 'Total combinational logic delay of the non-pipelined design', 'ps'],
    [R`\(S\)`, 'Delay added by one pipeline register', 'ps'],
    ['BW', 'Bandwidth = throughput = results per unit time', '1/ps'],
    [R`\(G\), \(L\)`, 'Cost of the logic (gates) / of one set of pipeline registers', 'gates'],
    ['Latency', 'Time for ONE instruction from start to finish', ''],
    ['Throughput', 'How often an instruction completes', ''],
    ['IF/ID, ID/EX, EX/MEM, MEM/WB', 'Pipeline registers between stages', 'L13 s3'],
    ['Steady state', 'Pipeline full: every stage busy, one instruction completes per cycle', 'L13 s9'],
  ],
  steps: [
    { title: 'Use the idle hardware: overlap instructions', ref: 'L11 s11–s13', blocks: [
      B.p('S', 'L11 s11–s12', R`<p>Goal: more concurrency → higher throughput. When one instruction uses some resources, process others on the idle ones: fetch the next while one decodes, decode another while one executes, and so on. <b>Pipelining</b> ("assembly line processing"): divide the instruction cycle into distinct stages; ensure enough hardware to process one instruction in each stage; process a different instruction in each stage; consecutive instructions go through consecutive stages. Benefit: higher instruction throughput.</p>`),
      B.wk({ src: 'S', ref: 'L11 s13; L11 [23:58]–[25:25]', title: 'Four independent ADDs, 4 steps each (F D E W)', steps: [
        [R`\text{multi-cycle: } 4 \times 4 = 16\ \text{cycles}`, 'Each instruction runs all its steps before the next starts.'],
        [R`\text{pipelined: the first finishes after 4 cycles, then one more finishes every cycle}`, 'After the pipeline fills, one instruction completes each cycle.'],
        [R`4 + (4 - 1) = 7\ \text{cycles}`, 'k cycles for the first, plus 1 for each of the other N − 1.'],
      ], result: '16 → 7 cycles. "Is life always this beautiful?" — no: dependencies (hazards) come next.' }),
      B.p('S', 'derived from L11 s13', R`<p>General rule (no stalls): \(N\) instructions in a \(k\)-stage pipeline take \(k + (N - 1)\) cycles. (The slides show this only by example; the general form follows from the same counting.)</p>`),
    ] },
    { title: 'The laundry analogy', ref: 'L12 s5–s8', blocks: [
      B.p('S', 'L12 s5–s6', R`<p>Wash → dry → fold → put away. Steps for one load are sequentially dependent; different loads are independent; steps use different resources. Pipelined: 4 loads in parallel, <b>no additional resources</b>, <b>throughput ×4</b>, but the <b>latency per load is the same</b>.</p>`),
      B.p('S', 'L12 s7–s8', R`<p>In practice, if drying takes twice as long, <b>the slowest step decides throughput</b> (1 load/hour). Add a second dryer and throughput is restored (2 loads per hour).</p>`),
      B.tool('laundry', { dry: 60 }),
    ] },
    { title: 'Ideal pipeline, throughput and cost', ref: 'L12 s9–s12', blocks: [
      B.p('S', 'L12 s9', R`<p>An <b>ideal pipeline</b>: increases throughput with little extra cost; repeats <b>identical</b> operations; repeats <b>independent</b> operations (no dependencies); has <b>uniformly partitionable</b> sub-operations (equal latency, no shared resources). Fits car assembly lines and laundry. Instruction processing? Not quite — dependencies → hazards.</p>`),
      B.p('S', 'L12 s10–s11', R`<p>Ideal: one stage of delay T → BW ≈ 1/T; two stages of T/2 → ≈ 2/T; three of T/3 → ≈ 3/T. With register delay S:</p>\[BW_{\text{non-pipelined}} = \frac{1}{T + S} \qquad BW_{k\text{-stage}} = \frac{1}{T/k + S} \qquad BW_{max} = \frac{1}{1\ \text{gate delay} + S}\]<p>Register delay reduces throughput (switching overhead between stages).</p>`),
      B.p('S', 'L12 s12', R`\[\text{Cost}_{\text{non-pipelined}} = G + L \qquad \text{Cost}_{k\text{-stage}} = G + L\,k\]<p>Registers increase hardware cost. More stages give diminishing returns in speed and growing cost (L12 [22:28]–[25:01]).</p>`),
      B.fx('pipebw'),
      B.tool('pipeBW', { t: 800, s: 20, k: 5 }),
    ] },
    { title: 'Pipelining the MIPS instruction cycle', ref: 'L12 s14–s18', blocks: [
      B.p('S', 'L12 s17', R`<p>Stage latencies: IF 200, ID 100, EX 200, MEM 200, WB 100 ps. The pipelined clock must fit the slowest stage: <b>200 ps</b>.</p>`),
      B.wk({ src: 'S', ref: 'L12 s18; L12 [33:56]–[35:09]', title: 'Three loads: non-pipelined vs pipelined', steps: [
        [R`\text{non-pipelined: a new lw starts every } 800\ \text{ps} \Rightarrow BW = 1/800\ \text{ps}`, 'Single-cycle machine: one instruction at a time.'],
        [R`\text{pipelined: a new lw starts every } 200\ \text{ps} \Rightarrow BW = 1/200\ \text{ps}`, 'Once full, one instruction completes per 200 ps cycle.'],
        [R`\dfrac{1/200}{1/800} = \dfrac{800}{200} = 4`, '4× throughput.'],
        [R`\text{latency of one lw} = 5 \times 200 = 1000\ \text{ps} \ (\ge 800)`, 'Latency is NOT reduced — it even grows because short stages wait for the 200 ps clock.'],
      ], result: '"The key benefit of pipelining is higher throughput rather than the lower latency for an individual instruction" (L12 [35:09]).' }),
      B.p('S', 'R1 s22', R`<p>Ignoring hazards, the pipeline clock is set by the worst-case stage. In an ideal (balanced) pipeline the clock = total time / number of stages ("1000 ps / 5 = 200 ps, where total time is given by clock cycle × #stages"). Throughput in all cases = 1 / clock cycle; for multi-cycle, 1 / average time per instruction.</p>`),
      B.key('Latency vs throughput — the sentence examiners want', R`<p><b>Latency</b> is how long one instruction takes from start to finish. <b>Throughput</b> is how many instructions finish per unit time. Pipelining <b>does not shorten latency</b> (it often makes it slightly longer, because every stage is padded to the slowest one and registers add delay); it <b>raises throughput</b>, ideally to one instruction per cycle.</p>`),
      B.fx('pipecycles'),
      B.tool('cycleCompare', { preset: 'ps2' }),
    ] },
    { title: 'Pipeline registers', ref: 'L13 s3–s4', blocks: [
      B.p('S', 'L13 s3', R`<p>Pipeline registers sit between stages and hold everything the next stage needs — instruction bits, data values, control signals: <b>IF/ID</b> (fetched instruction, PC+4), <b>ID/EX</b> (register values, immediate, control), <b>EX/MEM</b> (ALU result, destination register…), <b>MEM/WB</b> (memory data or ALU result to write back). Key property: <b>no resource is used by more than one stage</b>.</p>`),
      B.p('S', 'L13 s4', R`<p><b>All instruction classes must follow the same path and timing through the pipeline stages</b> — an add still spends a cycle in MEM doing nothing, so every instruction moves one stage per cycle and the pipeline stays synchronised (L13 [11:22]–[12:36]).</p>`),
    ] },
    { title: 'Drawing pipelines', ref: 'L13 s5–s10', blocks: [
      B.p('S', 'L13 s5', R`<p>Multi-clock-cycle diagram: time left → right, instructions top → bottom. Shading = the unit is used. Register file / memory shaded on the <b>right half = read</b> in that stage; <b>left half = written</b>.</p>`),
      B.p('S', 'L13 s7', R`<p>At any time each stage processes a different instruction. The register file appears in two stages: <b>read in stage 2 (ID)</b> and <b>written in stage 5 (WB)</b>.</p>`),
      B.dia({ src: 'S', ref: 'L13 s9 (operation view)', ascii: `          t0   t1   t2   t3   t4   t5   t6   t7   t8
Inst0     IF   ID   EX   MEM  WB
Inst1          IF   ID   EX   MEM  WB
Inst2               IF   ID   EX   MEM  WB
Inst3                    IF   ID   EX   MEM  WB
Inst4                         IF   ID   EX   MEM  WB
                              ^ steady state (full pipeline)` }),
      B.p('S', 'L13 s10', R`<p><b>Resource view</b>: one row per stage (IF, ID, EX, MEM, WB), showing which instruction occupies it each cycle — I0 moves diagonally down. Both views show the same thing; the resource view makes idle stages obvious.</p>`),
      B.x(R`<p>In the simulator below press <b>Cycle ▶</b> repeatedly: the highlighted column is the current clock cycle. Read the table both ways — along a <b>row</b> you follow one instruction through IF, ID, EX, MEM, WB; down a <b>column</b> you see what every stage is doing in that cycle. Switch the view to “resources” to see which hardware each instruction uses each cycle.</p>`),
      B.tool('pipeSim', { preset: 'l13', presets: ['ideal', 'l13'], startAt: 1 }),
      B.check(R`<p>How many cycles do 6 independent instructions need in the 5-stage pipeline, and what is the CPI over those cycles?</p>`, R`<p>\(5 + (6 - 1) = 10\) cycles; CPI = 10 ÷ 6 ≈ 1.67. As the number of instructions grows the fill time matters less and CPI approaches 1.</p>`),
    ] },
  ],
  keyPoints: [
    'Pipelining overlaps instructions: throughput up, single-instruction latency unchanged (or slightly worse).',
    'Slowest stage sets the clock (and the throughput).',
    'Ideal: identical, independent, evenly divisible operations. Instructions aren’t fully independent → hazards.',
    R`\(BW_k = 1/(T/k + S)\): register overhead gives diminishing returns; cost \(G + Lk\).`,
    R`N instructions, k stages, no stalls: \(k + N - 1\) cycles.`,
    'Pipeline registers IF/ID, ID/EX, EX/MEM, MEM/WB; all instructions take all stages.',
    'Register file read in ID (right half shaded), written in WB (left half shaded).',
  ],
  traps: [
    '<b>"Pipelining makes each instruction faster."</b> It doesn’t — it completes more instructions per unit time.',
    '<b>Pipelined clock = single-cycle clock ÷ 5.</b> Only if stages are balanced; otherwise it’s the slowest stage (200 ps, not 160).',
    '<b>Speedup = k exactly.</b> Only ideally; register overhead, unbalanced stages, fill time and hazards reduce it.',
    '<b>N × k cycles</b> for N instructions — that’s non-pipelined; pipelined is k + N − 1.',
    '<b>Skipping stages in diagrams.</b> An add still goes through MEM; a sw still goes through WB.',
  ],
  };
