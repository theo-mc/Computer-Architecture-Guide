import { R, B } from '../../utils/dsl.js';

export default {
  id: 'forward', num: 18, file: 'forwarding-reordering', week: 7, lectures: ['L16'],
  title: 'Data forwarding, load-use hazards and reordering', short: 'Forwarding & reordering',
  keywords: 'forwarding bypassing ex/mem mem/wb load-use hazard detection unit reordering compiler scheduling stall',
  taught: 'L16 s7–s14 (Week 7). Reviewed in R1 Part III (s24–s30, Mon 9 Nov). Practised in PS3 Q1b, Q4 and Practice Test Q4ii–iii.',
  overview: {
    lede: 'Stalls cost real time. Forwarding sends an ALU result straight to the next instruction, removing most data-hazard stalls — except a load followed immediately by its use. Reordering instructions removes the rest.',
    about: R`<p>An ALU result exists at the end of EX, long before WB. <b>Forwarding</b> (bypassing) feeds it from the EX/MEM or MEM/WB pipeline register back into the ALU input of a following instruction. A load's data only exists after MEM, so the very next instruction still stalls one cycle (the <b>load-use hazard</b>). The compiler can then <b>reorder</b> independent instructions into the gap. This is the heaviest part of the Practice Test (Q4, 30 points).</p>`,
    canDo: ['Compare a hazard-free and a stalling processor with different clocks (cost of stalls).', 'Explain how forwarding works and which pipeline registers supply the value.', 'Explain why forwarding can’t remove the load-use stall, and how many cycles remain.', 'Count stalls with and without forwarding for any sequence.', 'Reorder code safely to remove stalls, and justify it.'],
    buildsOn: ['datahaz'],
  },
  notation: [
    ['Forwarding / bypassing', 'Sending a result directly from a pipeline register to the ALU input of a later instruction', 'L16 s9–s10'],
    ['EX/MEM → EX', 'Forward from the instruction one ahead (its ALU result)', ''],
    ['MEM/WB → EX', 'Forward from the instruction two ahead (ALU result or loaded data)', ''],
    ['Load-use hazard', 'An instruction uses the register loaded by the lw immediately before it', 'L16 s11'],
    ['Hazard detection unit', 'Detects load-use and stalls the consumer', 'L16 s11'],
    [R`\(C_{P1}\)`, 'Clock period of the hazard-free processor P1', 'L16 s7'],
    [R`\(d\)`, 'Distance between producer and consumer', ''],
  ],
  steps: [
    { title: 'What stalls really cost', ref: 'L16 s7; R1 s25–s26', blocks: [
      B.wk({ src: 'S', ref: 'L16 s7; L16 [21:29]–[30:17]', title: 'P1: no data hazards, CPI 1. P2: clock 1.05× faster, 40% of instructions stall 1 cycle', steps: [
        [R`\text{P1: } T_c = C_{P1},\ CPI = 1`, 'Hazard-free.'],
        [R`\text{P2: } T_c = \dfrac{C_{P1}}{1.05},\ CPI = 1 + 0.4 \times 1 = 1.4`, 'A clock rate 1.05× higher means the period is divided by 1.05.'],
        [R`\dfrac{T_{P1}}{T_{P2}} = \dfrac{IC \times 1 \times C_{P1}}{IC \times 1.4 \times C_{P1}/1.05}`, 'Same program: IC cancels.'],
        [R`= \dfrac{1}{1.4/1.05} = \dfrac{1.05}{1.4} = 0.75`, R`\(C_{P1}\) cancels too.`],
      ], result: 'P1 takes 75% of P2’s time: P1 (no hazards) is 1/0.75 ≈ 1.33 times faster. A 5% faster clock can’t pay for 40% one-cycle stalls.' }),
    ] },
    { title: 'Two ways to avoid stalls', ref: 'L16 s8', blocks: [
      B.p('S', 'L16 s8', R`<ul><li><b>Compiler level</b>: insert nop instructions; reorder instructions to put independent work between dependent ones.</li><li><b>Microarchitecture level</b>: data forwarding.</li></ul><p>A nop occupies a pipeline slot without useful work, so it guarantees correctness but still costs cycles (L16 [28:05]).</p>`),
    ] },
    { title: 'Data forwarding', ref: 'L16 s9–s10', blocks: [
      B.analogy('Handing the dish straight over', R`<p>Without forwarding, the cook who finishes the sauce puts it on the shelf at the end of the line (the register file, in WB), and the next cook has to walk round and collect it from there. With forwarding, the sauce is handed straight across the counter to the next cook the moment it's ready. Nothing about the recipe changed — only the delivery route.</p>`),
      B.p('S', 'L16 s9', R`<p>The result of the producer is actually available after the EX stage (cycle 3), when the ALU completes. Instead of stalling, the hardware <b>forwards the result from the output of the EX stage to the ALU</b> for the dependent instruction — EX of the first to EX of the second.</p>`),
      B.p('S', 'L16 s10', R`<p>Use temporary results — don't wait for them to be written. Two kinds: <b>register file forwarding</b> (handles a write and read of the same register in the same cycle) and <b>ALU forwarding</b>, using <b>multiplexers and enhanced control logic</b>. In the sub/and/or/add/sw example: −20 sits in <b>EX/MEM</b> in cycle 4 (forwarded to and) and in <b>MEM/WB</b> in cycle 5 (forwarded to or). "Can we always avoid stalls?"</p>`),
      B.p('L', 'L16 [35:04]–[36:15]', R`<p>"Data forwarding doesn't mean the result is written to the register file earlier. It means the result is delivered directly to the instruction that needs it."</p>`),
      B.tool('pipeSim', { preset: 'l15', presets: ['l15', 'l16', 'ps3', 'pt'], fwd: true }),
    ] },
    { title: 'Load-use: forwarding can’t go back in time', ref: 'L16 s11–s13', blocks: [
      B.p('S', 'L16 s11', R`<p>A load can still cause a hazard: an instruction tries to read a register right after a load that writes it. The loaded value only exists at the end of MEM (cycle 4), but the dependent <code>and</code> needs it at the start of its EX (cycle 4). So we need a <b>hazard detection unit</b> to stall the instruction.</p>`),
      B.p('S', 'L16 s12', R`<p>Stalling can be shown by keeping an instruction in the same stage (and in the slide: ID held for an extra cycle) instead of drawing nops/bubbles — both describe the same delay; a bubble passes down the pipeline behind the load.</p>`),
      B.p('S', 'L16 s13', R`<p>The load can't forward until the end of cycle 4, so the dependent instruction stalls <b>one cycle</b>. <b>Forwarding reduces the stall penalty from 2 cycles to 1</b> — it reduces but does not always eliminate stalls.</p>`),
      B.tbl({ src: 'S', ref: 'L16 s6, s11, s13 (summary)', head: ['Producer → consumer distance', 'No forwarding', 'Forwarding, ALU producer', 'Forwarding, load producer'], rows: [['1 (right after)', '2', '0', '<b>1</b> (load-use)'], ['2 (one in between)', '1', '0', '0'], ['3 or more', '0', '0', '0']] }),
      B.fx('distance', { mode: 'fwdld' }),
      B.tool('distance', { p: 'ld', d: 1, f: true }),
      B.check(R`<p>With forwarding: <code>lw $t0, 0($a0)</code> → <code>add $t1, $t0, $t2</code> → <code>sub $t3, $t1, $t4</code>. How many stalls?</p>`, R`<p>lw → add on $t0 at distance 1: load-use, 1 stall. add → sub on $t1 at distance 1: ALU producer, forwarded from EX/MEM, 0 stalls. Total 1.</p>`),
      B.dis({ id: 'l16-every', title: 'can forwarding eliminate every data hazard?', items: [['Slides L16 s11, s13; R1 s27', '"Can\'t always forward"; "Forwarding for Load instruction reduces stalls but does not always eliminate stalls"; R1: "No. In case that an instruction is data dependent on a load with no intermediate instruction in between then there will be a stall".'], ['Lecture recording L16 [2:45] and [49:08] (machine transcript)', '"…why forwarding can eliminate every data hazard"; "the third point, forwarding can eliminate every data hazards". Earlier in the same summary, [47:35]: "forwarding can\'t eliminate every data hazard".']], likely: 'Forwarding can NOT eliminate every stall — the load-use case still needs 1 stall. The recording almost certainly says "can’t" (the transcript drops it); the slides, R1 and the lecture’s own [47:35] summary agree.' }),
    ] },
    { title: 'Reordering instructions', ref: 'R1 s29; PS3 Q4; Practice Test Q4iii', blocks: [
      B.p('S', 'R1 s29', R`<pre class="code nomath">Loop: lw   $t0, 0($s1)     # $t0 = array element
      addu $t0, $t0, $s2   # add scalar in $s2
      sw   $t2, 0($s1)     # store result
      addi $s1, $s1, -4    # decrement pointer
      bne  $s1, $zero, Loop</pre><p>RAW between lw and addu → 2 stalls. Forwarding reduces but can't remove them (load-use). <b>Forwarding + reordering</b>: move a non-dependent instruction between the two — <code>lw; sw; addu</code> — and no stall remains.</p>`),
      B.p('L', 'safety rule (derived from L15 s7–s10)', R`<p>A reorder is <b>safe</b> only if every dependent pair keeps its order: never move a consumer above its producer (RAW), a writer above an earlier reader of the same register (WAR), or two writers of the same register past each other (WAW). Also be careful swapping a load and a store that could touch the same memory address. The simulator's reorder panel checks the register rules for you.</p>`),
      B.wk({ src: 'A', ref: 'same method as PS3 Q4 and Practice Test Q4iii (try those in Practice below)', title: 'lw $t2, 8($a0); sub $t3, $t2, $a1; or $t4, $a2, $a3; addi $t5, $a1, 4', steps: [
        ['RAW: lw → sub on $t2, distance 1.', 'The only dependency that can stall: or and addi read $a1, $a2, $a3, which nothing here writes.'],
        ['No forwarding: 2 stalls.', 'Distance 1: max(0, 3 − 1) = 2.'],
        ['Forwarding: 1 stall remains (load-use).', 'The loaded value exists only after lw’s MEM: max(0, 2 − 1) = 1.'],
        ['Reorder: lw; or; sub; addi (move the independent or between lw and sub).', 'or writes $t4 and reads $a2, $a3 — no RAW, WAR or WAW with lw or sub, so the result is unchanged.'],
        ['With forwarding: lw → sub is now distance 2 → 0 stalls.', 'Load producer at distance 2: forwarded from MEM/WB just in time.'],
      ], result: 'Forwarding + one reorder → no stalls. Without forwarding, distance 2 would still cost 1 stall; moving both or and addi up (distance 3) would remove it.' }),
      B.tool('pipeSim', { preset: 'pt', presets: ['pt', 'ps3', 'r1'], fwd: true }),
    ] },
    { title: 'What the hardware actually checks', ref: 'P&H §4.7', blocks: [
      B.bg('Forwarding and hazard-detection conditions', R`<p>Forwarding unit (EX hazard): if EX/MEM.RegWrite and EX/MEM.RegisterRd ≠ 0 and EX/MEM.RegisterRd = ID/EX.RegisterRs → forward the EX/MEM value to ALU input A (similarly for Rt / input B). MEM hazard: the same test with MEM/WB, used only if the EX/MEM test doesn't already match (the newer value wins).</p><p>Load-use hazard detection unit (in ID): if ID/EX.MemRead and (ID/EX.RegisterRt = IF/ID.RegisterRs or ID/EX.RegisterRt = IF/ID.RegisterRt) → stall: hold PC and IF/ID, insert a bubble (zero the control signals) into ID/EX.</p>`, 'P&H §4.7'),
    ] },
    { title: 'Hazard summary', ref: 'R1 s30', blocks: [
      B.tbl({ src: 'S', ref: 'R1 s30', head: ['Hazard', 'Solution', 'Minimise performance cost'], rows: [['Structural', 'Stall', 'Replicate resources'], ['Data', 'Stall', 'Data forwarding; instruction reordering'], ['Control', 'Stall', 'Resolve the branch condition early in ID (limits the misprediction penalty); branch target buffer (reduces wrong guesses) — L17+']] }),
    ] },
  ],
  keyPoints: [
    'Stalls can outweigh a faster clock (L16 s7: P1 1.33× faster than a 5%-faster-clocked P2 with 40% one-cycle stalls).',
    'Forwarding: ALU result from EX/MEM or MEM/WB into the ALU input via muxes; it doesn’t write the register file earlier.',
    'With forwarding: ALU → next instruction: 0 stalls. Load → next instruction: 1 stall (load-use). Load → two later: 0.',
    'Without forwarding: 2 / 1 / 0 stalls for distance 1 / 2 / ≥3.',
    'Reordering independent instructions into the gap removes the remaining stalls; it must keep every RAW/WAR/WAW in order.',
    'Hazard detection unit finds load-use and stalls (holds the instruction in ID / inserts a bubble).',
  ],
  traps: [
    '<b>"Forwarding removes all stalls."</b> Not the load-use one (and the transcript wrongly suggests otherwise).',
    '<b>sw after lw.</b> In this course’s convention (Practice Test Q4ii) sw using the loaded register as its base still stalls 1 cycle with forwarding.',
    '<b>Unsafe reorders.</b> Moving an instruction above one it depends on changes the program’s meaning.',
    '<b>Counting stall pairs independently.</b> Overlapping dependencies share stall cycles; check the whole sequence.',
    R`<b>Clock "1.05 times higher" → period ÷ 1.05</b>, not × 1.05.`,
    '<b>Explain the why</b> in Q4ii-style answers: name the registers, the stage where the value appears (end of MEM) and where it is needed (start of EX).',
  ],
  };
