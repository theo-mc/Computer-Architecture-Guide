import { R, B, PIPE } from '../../utils/dsl.js';

export default {
  id: 'ilp', num: 20, file: 'instruction-level-parallelism', week: 'L', weekLabel: '8–12', lectures: ['L20', 'L21'], tests: [2], pending: true,
  title: 'Instruction-level parallelism: multiple issue, scheduling and Tomasulo-style execution', short: 'ILP & multiple issue',
  keywords: 'ilp instruction level parallelism multiple issue static dynamic vliw superscalar issue packet ipc loop unrolling register renaming reservation station common data bus tomasulo out of order reorder buffer commit speculation',
  taught: 'Planned for L20–L21 (Canvas lecture list: static scheduling; superscalars and Tomasulo). Until those slides are released this topic follows P&H §4.10.',
  overview: {
    lede: 'Pipelining overlaps instructions; multiple issue starts several in the same cycle, so CPI can drop below 1. Either the compiler packs the instructions (static) or the hardware finds them at run time (dynamic, out of order).',
    about: R`<p>A pipeline finishes at most one instruction per cycle. To go further the processor must <b>issue</b> several per cycle. Static multiple issue (VLIW) leaves the compiler to group independent instructions into issue packets; it uses loop unrolling and register renaming to find enough. Dynamic multiple issue (superscalar) has hardware look ahead, execute instructions out of order as their operands arrive, and commit them in order. Tomasulo’s algorithm — reservation stations plus a common data bus — is the classic way to do this.</p>`,
    canDo: ['Explain the difference between pipelining and multiple issue, and between static and dynamic issue.', 'Compute peak IPC/CPI and instruction rate for an n-issue processor.', 'Unroll and schedule a simple loop for 2-issue and count cycles and IPC.', 'Explain how register renaming removes WAR and WAW dependences, and what reservation stations and the common data bus do.'],
    buildsOn: ['pipe', 'datahaz', 'forward'],
  },
  notation: [
    ['issue width', 'Instructions that can start in the same cycle', '2-issue, 4-issue'],
    ['IPC', 'Instructions per cycle = 1 / CPI', 'peak 4 for 4-issue'],
    ['issue packet', 'The group of instructions issued together (one “very long” instruction in VLIW)', ''],
    ['loop unrolling', 'Copy the loop body several times to expose independent instructions', ''],
    ['register renaming', 'Give each new value its own register so WAR/WAW (name) dependences vanish', ''],
    ['reservation station', 'Buffer in front of a functional unit holding an instruction and its operands (or who will produce them)', ''],
    ['CDB', 'Common data bus: broadcasts each result to every waiting reservation station and the register file', ''],
    ['commit', 'Writing results back in program order (reorder buffer), so exceptions stay precise', ''],
  ],
  steps: [
    { title: 'Two routes to more parallelism', ref: 'P&H §4.10', blocks: [
      B.p('T', 'P&H §4.10', R`<p>Deeper pipelines overlap more instructions; <b>multiple issue</b> replicates the pipeline so several instructions start each cycle. A 4-issue processor at 4 GHz could in principle complete 16 billion instructions per second: peak CPI 0.25, IPC 4. Dependences and branches mean real programs get much less.</p>`),
      B.sort({ title: 'Static or dynamic multiple issue?', cats: ['Static (compiler)', 'Dynamic (hardware)'], items: [
        ['The compiler groups instructions into issue packets', 0, 'Decided before the program runs.'],
        ['Instructions execute out of order as their operands arrive', 1, 'Decided at run time.'],
        ['VLIW', 0, 'One very long instruction word holds a packet.'],
        ['Superscalar with reservation stations', 1, 'Hardware schedules.'],
        ['Loop unrolling to fill empty slots', 0, 'A compiler technique.'],
        ['A reorder buffer commits results in program order', 1, 'Hardware bookkeeping for out-of-order execution.']] }),
    ] },
    { title: 'Static issue: scheduling and loop unrolling', ref: 'P&H §4.10', blocks: [
      B.p('T', 'P&H §4.10', R`<p>A simple static 2-issue MIPS issues one ALU/branch instruction and one load/store per cycle. The compiler must fill both slots with independent instructions, and leave a slot empty (a nop) when it can’t. The classic loop adds a value to every element of an array: <code>lw</code>, <code>addu</code>, <code>sw</code>, <code>addi</code>, <code>bne</code>.</p>`),
      B.code({ src: 'T', ref: 'P&H §4.10', code: 'Loop: lw   $t0, 0($s1)      # load array element\n      addu $t0, $t0, $s2    # add scalar in $s2\n      sw   $t0, 0($s1)      # store result\n      addi $s1, $s1, -4     # decrement pointer\n      bne  $s1, $zero, Loop # branch if not done', caption: 'The loop scheduled for 2-issue takes 4 cycles per iteration for 5 instructions: IPC 1.25 against a peak of 2.' }),
      B.wk({ src: 'T', ref: 'P&H §4.10', title: 'Unroll four times', steps: [
        ['Copy the body 4 times; keep one addi (−16) and one bne.', 'Fewer overhead instructions per element.'],
        ['Rename: use $t0, $t1, $t2, $t3 for the four values.', 'Removes the WAR/WAW (name) dependences between the copies.'],
        ['Schedule: 14 instructions fit in 8 cycles.', 'Loads and ALU operations pair up.'],
        [R`IPC = 14 / 8 = 1.75`, 'Closer to the peak of 2, at the cost of more registers and code size.']], result: 'Unrolling plus renaming raised IPC from 1.25 to 1.75.' }),
      B.recipe({ title: 'Count cycles and IPC for a scheduled loop', for: 'static-issue questions', steps: [
        'Write the issue slots as a table: one row per cycle, one column per slot type.',
        'Place each instruction as early as its operands allow (respect load-use: a loaded value is usable one cycle later).',
        'Count the rows that have at least one instruction: that is the cycles per iteration.',
        R`IPC = instructions per iteration ÷ cycles per iteration; CPI = 1 / IPC.`] }),
    ] },
    { title: 'Register renaming', ref: 'P&H §4.10', blocks: [
      B.derive('Why renaming removes WAR and WAW but never RAW', R`<p>WAR and WAW exist only because two instructions happen to reuse the same register <i>name</i>; no value flows between them. Give the later write a fresh register and the clash disappears. RAW is different: the consumer really needs the producer’s value, so no renaming can remove it — only waiting (or forwarding).</p>`),
      B.check(R`<p>Which dependence can renaming remove here? <code>add $t0, $t1, $t2</code>; <code>sub $t1, $t3, $t4</code>.</p>`, R`<p>WAR on <code>$t1</code>: the sub writes what the add reads. Rename the sub’s destination (e.g. to <code>$t5</code>) and the two can run in any order.</p>`),
    ] },
    { title: 'Dynamic issue: Tomasulo-style out-of-order execution', ref: 'P&H §4.10', blocks: [
      B.p('T', 'P&H §4.10', R`<p>A dynamically scheduled pipeline has three parts: an in-order <b>issue</b> unit that fetches and decodes; <b>reservation stations</b> in front of each functional unit that hold instructions until their operands are available; and an in-order <b>commit</b> unit (reorder buffer) that writes results back in program order. Results are broadcast to every waiting station, so an instruction starts the moment its last operand arrives — possibly before older instructions.</p>`),
      B.x(R`<p>This organisation is known as <b>Tomasulo’s algorithm</b> (the name the Canvas lecture list uses for L21). The reservation stations also rename registers: an instruction waiting for a value records <i>which station will produce it</i> rather than the register name, which removes WAR and WAW hazards automatically.</p>`),
      B.states({ src: 'A', title: 'In order vs out of order', states: [
        ['In order', PIPE(['lw $t0 | IF ID EX MEM WB', 'add $t1,$t0 | . IF ID * EX MEM WB', 'sub $t2,$t3,$t4 | . . IF * ID EX MEM WB']), 'The independent sub waits behind the stalled add.'],
        ['Out of order', PIPE(['lw $t0 | IF ID EX MEM WB', 'add $t1,$t0 | . IF ID * EX MEM WB', 'sub $t2,$t3,$t4 | . . IF ID EX MEM WB']), 'The sub’s operands are ready, so it executes while the add waits. Commit still happens in program order.']],
        caption: 'Dynamic scheduling lets independent work pass a stalled instruction.' }),
    ] },
  ],
  keyPoints: [
    'Multiple issue starts several instructions per cycle, so CPI can be below 1 (IPC above 1).',
    'Static issue (VLIW): the compiler builds issue packets, using unrolling and renaming. Dynamic issue (superscalar): hardware schedules at run time.',
    'Loop unrolling cuts overhead and exposes independent instructions; renaming removes WAR/WAW.',
    'Reservation stations hold instructions until operands arrive; the CDB broadcasts results; commit is in order.',
    'RAW dependences limit every scheme; they can only be waited for.',
  ],
  traps: [
    '<b>Peak vs achieved.</b> Peak IPC = issue width; real IPC is lower because of dependences and empty slots.',
    '<b>Saying renaming removes RAW.</b> It removes only name dependences.',
    '<b>Out-of-order commit.</b> Execution may be out of order; results are committed in order.',
  ],
  };
