import { R, B } from '../../utils/dsl.js';

export default {
  id: 'single', num: 13, file: 'single-cycle-datapath', week: 4, lectures: ['L10'],
  title: 'Single-cycle MIPS: datapath, control signals and timing', short: 'Single-cycle datapath',
  keywords: 'single cycle datapath control signals regdst alusrc memtoreg regwrite memread memwrite branch critical path clock period 600 ps',
  taught: 'L10 s1–s22 (Week 4). Reviewed R1 s18. Practised in PS2 Q6 and Practice Test Q6.',
  overview: {
    lede: 'The whole MIPS processor in one picture: how R-type, load and store instructions flow through it, which control signals steer them, and why the slowest instruction sets everyone’s clock.',
    about: R`<p>The single-cycle datapath connects PC, instruction memory, register file, sign extender, ALU and data memory with multiplexers set by control signals (RegDst, ALUSrc, MemtoReg, RegWrite, MemRead, MemWrite, Branch, ALUOp). Every instruction finishes in one cycle (CPI = 1), so the clock must fit the slowest instruction — the load. You'll fill in timing tables from component delays, exactly as in Practice Test Q6.</p>`,
    canDo: ['Trace R-type, lw and sw through the datapath and name the units used.', 'Give the control-signal values for R-type, lw, sw (and beq).', 'Compute each instruction’s latency from component delays and the clock period.', 'Compute a program’s execution time on a single-cycle machine.', 'Explain the two main problems of single-cycle designs.'],
    buildsOn: ['uarch'],
  },
  notation: [
    ['RegDst', 'Mux: destination register = rd (1, R-type) or rt (0, load)', ''],
    ['ALUSrc', 'Mux: ALU’s 2nd input = register read data 2 (0) or sign-extended immediate (1)', ''],
    ['MemtoReg', 'Mux: value written to the register = ALU result (0) or memory data (1)', ''],
    ['RegWrite', 'Enables writing the register file', ''],
    ['MemRead / MemWrite', 'Enable reading / writing data memory', ''],
    ['Branch, PCSrc', 'Select the branch target as the next PC (when the ALU’s Zero output is 1)', ''],
    ['ALUOp', '2-bit code telling ALU control what kind of operation (with funct)', 'P&H §4.4'],
    ['X', '"don’t care" — the value doesn’t matter for this instruction', ''],
    ['ps', 'picosecond = 10⁻¹² s', '600 ps = 0.6 ns'],
  ],
  steps: [
    { title: 'The datapath, stage by stage', ref: 'L10 s3; L10 [2:38]–[12:19]', blocks: [
      B.x(R`<p>The datapath diagram looks frightening, but it is just the five steps from Topic 12 laid out left to right in hardware: <b>PC and instruction memory</b> (fetch) → <b>register file</b> (decode/read) → <b>ALU</b> (execute) → <b>data memory</b> (memory) → back to the <b>register file</b> (write-back). Everything else is either a small adder (PC + 4, branch target) or a <b>multiplexer</b> choosing between two inputs. Click through the instructions below and watch which parts light up.</p>`),
      B.p('L', 'L10 [2:38]–[12:19]', R`<ul><li><b>IF:</b> PC → instruction memory → 32-bit instruction. In parallel a simple adder computes PC + 4, which feeds a mux to become the next PC.</li><li><b>ID:</b> bits 31–26 (opcode) → control unit; bits 25–21 (rs) and 20–16 (rt) → register file read ports; bits 15–11 (rd) for R-type destinations; bits 15–0 (immediate) → sign-extend to 32 bits.</li><li><b>EX:</b> the <b>ALUSrc</b> mux picks the ALU's second input: read data 2 (R-type) or the sign-extended immediate (lw/sw). The ALU outputs a result and a <b>Zero</b> flag (for branches).</li><li><b>MEM:</b> the ALU result is the data-memory address; lw asserts MemRead, sw asserts MemWrite (writing read data 2).</li><li><b>WB:</b> <b>MemtoReg</b> picks ALU result (0) or memory data (1); <b>RegDst</b> picks rd (1) or rt (0) as destination; <b>RegWrite</b> enables the write.</li></ul>`),
      B.tool('datapath', { ins: 'lw' }),
    ] },
    { title: 'R-type, load and store paths', ref: 'L10 s4–s8', blocks: [
      B.p('S', 'L10 s5', R`<p>R-type: if MEM[PC] == ADD rd rs rt then GPR[rd] ← GPR[rs] + GPR[rt]; PC ← PC + 4. Uses instruction memory, register file (read 2, write 1) and ALU; no data memory.</p>`),
      B.tbl({ src: 'S', ref: 'L10 s6–s7', head: ['', 'lw R5, X(R7)', 'sw R6, X(R8)'], rows: [['Meaning', 'R5 ← M[[R7] + X]', 'M[X + [R8]] ← [R6]'], ['Sources', 'R7', 'R6, R8'], ['Destination', 'R5', 'none'], ['EX', 'X + [R7]', 'X + [R8]'], ['MEM', 'read memory', 'write [R6] to memory'], ['WB', 'write the data into R5', 'no action']], caption: 'Lecture L10 [27:32]: "for load, memory provides data that is written to a register; for store, data comes from a register and is written to memory."' }),
    ] },
    { title: 'Control signals', ref: 'L10 s9–s11; L10 [33:41]–[38:17]', blocks: [
      B.analogy('Railway points', R`<p>Each multiplexer is a set of railway points: one control signal decides which track the data takes. ALUSrc decides whether the ALU's second input comes from a register (R-type) or from the sign-extended immediate (lw/sw). MemtoReg decides whether the value written back comes from the ALU or from data memory. The control unit sets all the points at once from the opcode.</p>`),
      B.p('L', 'L10 [33:41]', R`<p>The datapath "doesn't know what to do" — the <b>control unit</b> takes the opcode and generates the control signals. It is a big piece of combinational logic: a truth table from opcode to signal values.</p>`),
      B.tbl({ src: 'L', ref: 'L10 [35:10]–[38:17] (R-type, lw, sw); beq row P&H §4.4', cls: 'mono', head: ['Instr.', 'RegDst', 'ALUSrc', 'MemtoReg', 'RegWrite', 'MemRead', 'MemWrite', 'Branch', 'ALU op'], rows: [['R-type', '1', '0', '0', '1', '0', '0', '0', 'from funct'], ['lw', '0', '1', '1', '1', '1', '0', '0', 'add'], ['sw', 'X', '1', 'X', '0', '0', '1', '0', 'add'], ['beq', 'X', '0', 'X', '0', '0', '0', '1', 'subtract']], caption: 'For sw, MemtoReg and RegDst are "don’t care" because the instruction doesn’t write a register (L10 [38:17]).' }),
    ] },
    { title: 'Is single-cycle a good design?', ref: 'L10 s13–s15', blocks: [
      B.p('S', 'L10 s14', R`<ul><li>Every instruction takes 1 cycle: <b>CPI is strictly 1</b>.</li><li>How long each instruction takes is set by how long the slowest instruction takes, even though many don't need that long.</li><li>The clock cycle time — the critical path — is the processing time of the slowest instruction.</li></ul>`),
      B.p('S', 'L10 s15', R`<p>All phases happen in one cycle. Do they take the same time for all instructions? No — different instructions use different units.</p>`),
    ] },
    { title: 'Timing: finding the critical path', ref: 'L10 s16–s19', blocks: [
      B.p('S', 'L10 s16', R`<p>Assume: <b>memory units (read or write) 200 ps</b>; <b>ALU and adders 100 ps</b>; <b>register file (read or write) 50 ps</b>; other combinational logic 0 ps.</p>`),
      B.tbl({ src: 'L', ref: 'L10 s16 table filled in from L10 [44:30]–[45:39]', cls: 'mono', head: ['Instr.', 'IF (mem)', 'ID (RF read)', 'EX (ALU)', 'MEM (mem)', 'WB (RF write)', 'Total'], rows: [['R-type', '200', '50', '100', '—', '50', '<b>400</b>'], ['I-type (addi)', '200', '50', '100', '—', '50', '<b>400</b>'], ['lw', '200', '50', '100', '200', '50', '<b>600</b>'], ['sw', '200', '50', '100', '200', '—', '<b>550</b>'], ['beq', '200', '50', '100', '—', '—', '<b>350</b>'], ['j', '200', '—', '—', '—', '—', '<b>200</b>']] }),
      B.wk({ src: 'S', ref: 'L10 s19; L10 [50:00]–[52:30]', title: 'Cumulative delay along the lw path', steps: [
        [R`\(\text{instruction ready at } 200\ \text{ps}\)`, 'Instruction memory read.'],
        [R`\(200 + 50 = 250\ \text{ps}\)`, 'Register file read (base register).'],
        [R`\(250 + 100 = 350\ \text{ps}\)`, 'ALU computes the address.'],
        [R`\(350 + 200 = 550\ \text{ps}\)`, 'Data memory read.'],
        [R`\(550 + 50 = 600\ \text{ps}\)`, 'Register file write.'],
      ], result: 'lw takes 600 ps — the longest, so the clock period is 600 ps for every instruction.' }),
      B.dis({ id: 'l10-300', title: 'minimum clock cycle 300 ps or 600 ps?', items: [['Slides L10 s19–s20', '"the clock cycle was limited to 600ps due to the slow LW".'], ['Lecture recording L10 [45:39]', '"therefore the minimum clock cycle time is 300 picoseconds" — then immediately "…still have to wait for the 600 picosecond clock cycle".']], likely: '600 ps. The recording slipped once (probably "six hundred" mis-transcribed or misspoken); the slides, the cumulative-delay walk-through and the rest of the recording all say 600 ps.' }),
      B.key('The method for every single-cycle timing question', R`<ol><li>For each instruction class, list the units it <b>actually uses</b>, in order (the table at the end of Topic 12).</li><li>Add up their delays: that is the instruction's latency.</li><li>The clock period = the <b>largest</b> of those latencies (CPI = 1, so every instruction gets that whole period).</li><li>Program time = number of instructions × 1 × clock period.</li></ol>`),
      B.fx('critpath'),
      B.wk({ src: 'A', ref: 'same shape as Practice Test Q6 (try that one in Practice below)', title: 'Single-cycle machine with a multiplier: find the clock and the time for 6 instructions', given: 'Instruction memory 100 ps; data memory 150 ps; multiplier 300 ps; address adder 80 ps; add/sub adder 120 ps; register file 40 ps. Program: lw, add, mult, sub, sw, lw.', steps: [
        ['lw: IF 100 + ID 40 + EX 80 + MEM 150 + WB 40 = 410 ps', 'Uses the address adder and data memory, then writes a register.'],
        ['add / sub: 100 + 40 + 120 + 0 + 40 = 300 ps', 'Uses the add/sub adder; no memory step.'],
        ['mult: 100 + 40 + 300 + 0 + 40 = 480 ps', 'The multiplier dominates.'],
        ['sw: 100 + 40 + 80 + 150 + 0 = 370 ps', 'No write-back: a store writes memory, not a register.'],
        ['Clock cycle = max(410, 300, 480, 300, 370) = 480 ps', 'Every instruction must fit in one cycle, so the slowest (mult) sets it — not lw this time.'],
        [R`\text{Time} = 6 \times 1 \times 480\ \text{ps} = 2880\ \text{ps}`, 'Instructions × CPI × clock cycle; CPI is 1 in a single-cycle machine.'],
      ], result: '480 ps clock; 2880 ps for the program. The critical instruction depends on the delays you are given.' }),
      B.tool('scTiming', { preset: 'l10' }),
    ] },
    { title: 'Why single-cycle is a poor design', ref: 'L10 s20–s21', blocks: [
      B.p('S', 'L10 s20', R`<ul><li><b>Inefficient</b>: all instructions run as slowly as the slowest (600 ps in the example even if others could finish earlier).</li><li><b>Hard to optimise</b>: making the common case fast doesn't help. Even if add is the most frequent instruction, speeding it up doesn't change the clock — the slow lw still sets it. You must always optimise the worst case.</li></ul>`),
      B.p('S', 'L10 s21', R`<p>Performance: time per instruction = CPI × clock cycle time; whole program = # instructions × average CPI × clock cycle time. Single-cycle: <b>CPI = 1</b> but <b>clock cycle time = long</b> (worst-case instruction). The fix — break instructions into steps — is the multi-cycle machine (Topic 14).</p>`),
    ] },
  ],
  keyPoints: [
    'Path: PC → instruction memory → register file (+ sign-extend) → ALU → data memory → back to register file; PC + 4 by a separate adder.',
    'Muxes: RegDst (rd vs rt), ALUSrc (register vs immediate), MemtoReg (ALU vs memory), PCSrc (PC+4 vs branch target).',
    'R-type: RegDst 1, ALUSrc 0, MemtoReg 0, RegWrite 1. lw: 0, 1, 1, 1, MemRead 1. sw: X, 1, X, 0, MemWrite 1.',
    'Instruction latency = sum of the units it uses in sequence; clock = slowest instruction (lw: 600 ps in L10 s16).',
    'CPI = 1, but a long clock; can’t optimise the common case.',
  ],
  traps: [
    '<b>Clock from the average or the most common instruction</b> — it’s the slowest one.',
    '<b>Store has no write-back; R-type has no memory step</b> — put 0 there.',
    '<b>Using the wrong ALU delay</b> when an exam gives different ALU units (address adder vs add/sub vs multiplier, Practice Test Q6).',
    '<b>"Don’t care" ≠ 0.</b> Write X for RegDst/MemtoReg on sw and beq.',
    '<b>Total program time</b> = N × clock (CPI = 1), not the sum of each instruction’s own latency.',
  ],
  };
