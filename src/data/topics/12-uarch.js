import { R, B } from '../../utils/dsl.js';

export default {
  id: 'uarch', num: 12, file: 'microarchitecture-basics', week: 3, lectures: ['L09'],
  title: 'Microarchitecture basics: state, logic, clocks and the five steps', short: 'µarch basics & 5 steps',
  keywords: 'microarchitecture architectural state combinational sequential flip-flop clock critical path fetch decode execute memory writeback five steps ir pc',
  taught: 'L09 s1–s31 (Week 3). Reviewed R1 s16–s17. Practised in PS2 Q1a and Q1d.',
  overview: {
    lede: 'From "what" to "how": an instruction transforms the programmer-visible state; hardware does it with combinational logic between clocked registers; the slowest path sets the clock; and every instruction follows Fetch–Decode–Execute–Memory–Writeback.',
    about: R`<p>The microarchitecture implements the ISA. Processing an instruction means turning architectural state AS into AS′. A single-cycle machine does that in one long clock cycle through combinational logic; a multi-cycle machine uses several short ones. You'll need the digital-logic basics (combinational vs sequential, the D flip-flop, critical path) and the five steps with the hardware each one uses.</p>`,
    canDo: ['Say which parts of the performance equation the ISA/compiler and the implementation control.', 'Explain AS → AS′ and the single-cycle vs multi-cycle choice.', 'Tell combinational from sequential elements and predict a D flip-flop’s output.', 'Explain what sets the clock period (critical path).', 'Describe the five steps for add, lw, sw and beq and name the units used in each.', 'Count instruction- and data-memory accesses.'],
    buildsOn: ['vonneumann', 'cpuperf'],
  },
  notation: [
    ['AS / AS′', 'Architectural (programmer-visible) state before / after an instruction: PC, registers, memory', 'L09 s8, s29'],
    ['MS1, MS2…', 'Microarchitectural (programmer-invisible) intermediate states', 'L09 s9'],
    ['IR', 'Instruction register: holds the instruction being executed = MEM[PC]', 'L09 s21'],
    ['PC', 'Program counter: address of the next instruction', ''],
    ['GPR', 'General-purpose registers R0–R(n−1)', ''],
    ['MUX', 'Multiplexer: Y = S ? I1 : I0 (select one input)', 'L09 s14'],
    ['Clk, D, Q', 'Clock input, data input, stored output of a flip-flop', 'L09 s15'],
    ['Critical path', 'Slowest register-to-register path through combinational logic', 'L09 s18'],
    ['IF, ID/RF, EX, MEM, WB', 'Instruction fetch; decode & register fetch; execute/address calc; memory; write back', 'L09 s20'],
    ['MemRead', 'Control signal asserted to read memory', 'L09 s22'],
  ],
  steps: [
    { title: 'Who controls which part of performance', ref: 'L09 s3–s6', blocks: [
      B.p('S', 'L09 s4', R`<p>From the iron law: <b>number of instructions</b> — determined by the ISA and compiler; <b>CPI</b> and <b>clock cycle time</b> — determined by the implementation (microarchitecture, hardware).</p>`),
      B.p('S', 'L09 s5–s6', R`<p>To implement the ISA we follow the von Neumann model: a <b>datapath</b> (the hardware functional units and storage, e.g. the register file) and <b>control</b> (obtain instructions from memory = fetch; issue signals controlling the datapath = decode; sequence instructions).</p>`),
    ] },
    { title: 'Processing an instruction: AS → AS′', ref: 'L09 s8–s11, s29', blocks: [
      B.p('S', 'L09 s8–s9', R`<p>Processing an instruction = transforming the architectural state AS into AS′ according to the ISA. The ISA defines an abstract finite state machine with <b>one state transition per instruction</b> and no visible intermediate states. The microarchitecture chooses how:</p><ul><li><b>Choice 1:</b> AS → AS′ in a single clock cycle.</li><li><b>Choice 2:</b> AS → AS+MS1 → AS+MS2 → AS+MS3 → AS′ in several cycles, using programmer-invisible state to speed things up.</li></ul>`),
      B.p('S', 'L09 s10–s11', R`<p><b>Single-cycle engine</b>: each instruction takes one clock cycle; only combinational logic implements execution; no intermediate updates. Sequential logic holds AS; combinational logic computes AS′; AS′ is stored at the end of the cycle.</p>`),
      B.analogy('Before-and-after photos', R`<p>The ISA only promises two photos: the registers, memory and PC <i>before</i> an instruction (AS) and <i>after</i> it (AS′). It says nothing about what happens in between. A single-cycle machine gets from one photo to the next in one clock tick; a multi-cycle or pipelined machine takes several ticks and has hidden “in-between photos” the programmer never sees.</p>`),
      B.p('S', 'L09 s29', R`<p>Programmer-visible state: <b>memory</b> (array of storage indexed by address), <b>registers</b> (given special names in the ISA; general vs special purpose), the <b>program counter</b>.</p>`),
    ] },
    { title: 'Digital logic: combinational vs sequential', ref: 'L09 s13–s15', blocks: [
      B.tbl({ src: 'S', ref: 'L09 s13–s14', head: ['Combinational (output = function of inputs)', 'Sequential / state (stores information)'], rows: [['Adder: Y = A + B', 'Register: stores data; a clock decides when it updates'], ['AND gate: Y = A & B', 'Edge-triggered flip-flop: updates when Clk goes 0 → 1'], ['Multiplexer: Y = S ? I1 : I0', 'Register file, memory'], ['ALU: Y = F(A, B)', 'PC, IR']] }),
      B.p('L', 'L09 [22:52]–[29:03]', R`<p>D flip-flop rule: "on every rising edge of the clock, the flip-flop captures the value of D at that instant and copies it to Q." Between edges Q stays put, even if D changes. Try the in-lecture exercise below: click the D wave, then predict Q.</p>`),
      B.tool('dff'),
      B.check(R`<p>D changes from 0 to 1 halfway between two rising clock edges and stays at 1. When does Q become 1?</p>`, R`<p>At the <b>next rising edge</b> after D changed. Q ignores D between edges, so it keeps its old value (0) until that edge.</p>`),
    ] },
    { title: 'Clocking and the critical path', ref: 'L09 s16, s18; R1 s16', blocks: [
      B.p('S', 'L09 s16', R`<p>Combinational logic transforms data during a clock cycle — between clock edges, taking inputs from state elements and delivering outputs to state elements. <b>The longest delay determines the clock period.</b></p>`),
      B.p('S', 'L09 s18', R`<p>What is the clock cycle time determined by? <b>The register-to-register critical path</b> of the combinational logic. What is the critical path determined by? <b>The slowest register-to-register computational path</b> among all the combinational paths.</p>`),
      B.p('L', 'L09 [32:37]', R`<p>In a single-cycle processor the <b>load</b> is typically the critical path: it fetches the instruction, reads the register file, computes the address, accesses data memory and writes back — all in one cycle. That's why the single-cycle clock is long (Topic 13 puts numbers on it).</p>`),
      B.analogy('Relay race between checkpoints', R`<p>Registers are checkpoints; the logic between two checkpoints is a stretch of road. Every runner starts when the clock fires and must reach the next checkpoint before it fires again. The clock period must therefore be at least as long as the <b>slowest stretch</b> — the critical path. Making a fast stretch even faster gains nothing; only shortening the slowest one lets you speed up the clock.</p>`),
      B.key('Combinational + sequential = a clocked machine', R`<p>On each rising edge the <b>sequential</b> elements (PC, register file, memory) capture new values. During the cycle, <b>combinational</b> logic (adders, ALU, multiplexers) works out the next values from the current ones. Then the next edge stores them. Every processor in this module, single-cycle or pipelined, works this way.</p>`),
    ] },
    { title: 'The instruction-processing cycle', ref: 'L09 s19–s21', blocks: [
      B.p('S', 'L09 s19', R`<p>Six phases: Fetch, Decode, Evaluate address, Fetch operands, Execute, Store result — not all instructions need all six.</p>`),
      B.dia({ src: 'S', ref: 'L09 s20', ascii: ` IF          ID/RF              EX              MEM               WB
+----+    +-----------+    +---------+    +-------------+    +-----------+
| PC |--->| Instr mem |--->| Regs    |--->|   ALU       |--->| Data mem  |--+
+----+    +-----------+    | (read)  |    | (op or addr)|    |           |  |
                           +---------+    +-------------+    +-----------+  |
                                ^                                           |
                                +----------- write back to register --------+` }),
      B.p('S', 'L09 s20, s25', R`<p>The textbook's <b>5 generic steps</b>: <b>IF</b> instruction fetch; <b>ID/RF</b> decode and register operand fetch; <b>EX</b> execute / evaluate memory address; <b>MEM</b> memory operand fetch; <b>WB</b> store/write back the result.</p>`),
      B.p('S', 'L09 s21', R`<p>Registers involved: <b>IR</b> holds the current instruction (MEM[PC]); <b>PC</b> holds the address of the next instruction; <b>GPRs</b> hold operands being (or soon to be) processed.</p>`),
    ] },
    { title: 'What each step does', ref: 'L09 s22–s24', blocks: [
      B.tbl({ src: 'S', ref: 'L09 s22–s24', head: ['Step', 'Actions'], rows: [
        ['IF', 'Send PC to memory and assert MemRead; read the instruction; IR ← [PC]; PC ← [PC] + 4'],
        ['ID', 'Control logic decodes IR: instruction type and operands; read source registers from the register file'],
        ['EX', R`ALU works on the operands, depending on the opcode — memory reference: ALUOutput ← A + Imm; register–register: A func B; register–immediate: A func Imm; branch: target ALUOutput ← PC + (Imm ≪ 2) and evaluate the condition`],
        ['MEM', 'Loads read data memory; stores write data memory'],
        ['WB', 'Write the result into the destination register'],
      ] }),
      B.tool('stageWalk', { i: 'lw' }),
      B.wk({ src: 'S', ref: 'L09 s27', title: 'The five steps for lw R5, X(R7)', steps: [
        ['IF: fetch the instruction; PC ← PC + 4', 'Every instruction starts the same way: read memory at the address in PC.'],
        ['ID: decode as a load; read R7', 'The base register is the only source operand a load needs.'],
        ['EX: compute X + [R7]', 'The ALU is used as an address adder: effective address = base + offset.'],
        ['MEM: read Memory[X + [R7]]', 'Loads are the only instructions that read data memory.'],
        ['WB: R5 ← the loaded word', 'The data goes into the destination register.'],
      ], result: 'A load uses all five steps — that is why it is the longest instruction in a single-cycle machine.' }),
      B.tbl({ src: 'A', ref: 'summary of L09 s22–s27 and L10', head: ['Instruction', 'IF', 'ID', 'EX', 'MEM', 'WB'], rows: [['R-type (add)', '✓', 'read 2 regs', 'ALU op', '—', 'write rd'], ['lw', '✓', 'read base', 'address', 'read', 'write rt'], ['sw', '✓', 'read base + data', 'address', 'write', '—'], ['beq', '✓', 'read 2 regs', 'compare + target', '—', '—']], caption: 'Which steps actually do work for each instruction class. This table is the key to Topics 13–15.' }),
      B.p('S', 'L09 s28', R`<p><b>Single-cycle machine:</b> all phases of the instruction-processing cycle take <b>a single machine clock cycle</b>; all state updates happen at the end of the instruction. (The five steps are a description of the work, not five clock cycles.)</p>`),
    ] },
  ],
  keyPoints: [
    'IC: ISA + compiler. CPI and clock: implementation.',
    'An instruction transforms AS → AS′; single-cycle does it in one cycle, multi-cycle via invisible intermediate states.',
    'Combinational logic computes; sequential elements (registers, flip-flops) store and update on the clock edge.',
    'D flip-flop: Q takes D at each rising edge.',
    'Clock period ≥ slowest register-to-register path (the critical path); in single-cycle MIPS that is the load.',
    'Five steps: IF (instruction memory, PC+4), ID (decode, register read), EX (ALU), MEM (data memory, lw/sw only), WB (register write).',
  ],
  traps: [
    '<b>Five steps ≠ five cycles</b> in a single-cycle machine.',
    '<b>Store has no WB; add has no MEM</b> — but in a pipeline they still pass through those stages (Topic 15).',
    '<b>Register accesses are not memory accesses</b> when counting memory accesses (PS2 Q1d).',
    '<b>Flip-flop Q follows D only at rising edges</b>, not continuously.',
    '<b>EX for a load computes the address</b>, not the data.',
  ],
  };
