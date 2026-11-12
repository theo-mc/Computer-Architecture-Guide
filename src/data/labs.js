export const BASE_LABS = [
  { id: 'number-lab', icon: 'numlab', tool: 'numlab', title: 'Number lab', topics: ['binary', 'float', 'encoding'],
    desc: 'Binary, hex, unsigned and two’s complement from one bit pattern, plus the adder with carries and flags, negation, sign extension, shifts and logic, and IEEE 754.',
    intro: '<p>Everything here works on one bit pattern, <b>A</b>. Click any bit to flip it, or type a number in decimal (−115), hex (0x8D) or binary (0b10001101). Then pick a tab: every tab explains its result step by step.</p>' },
  { id: 'mips', icon: 'mips', tool: 'mips', title: 'MIPS step-through', topics: ['isa1', 'isa2', 'translate', 'encoding'],
    desc: 'Edit MIPS code and run it one instruction at a time, forwards and backwards. Watch registers, memory and the stack change, and see each instruction’s machine code.',
    opts: { preset: 'loop' } },
  { id: 'pipeline', icon: 'pipesim', tool: 'pipeSim', title: 'Pipeline simulator', topics: ['pipe', 'hazards', 'datahaz', 'forward'],
    desc: 'The 5-stage MIPS pipeline, cycle by cycle: stalls, forwarding, structural hazards and reordering, using the course’s stall rules.', opts: { preset: 'l15' } },
  { id: 'datapath', icon: 'single', tool: 'datapath', title: 'Single-cycle datapath', topics: ['single'],
    desc: 'The single-cycle datapath with jump: each instruction’s path, every control wire, what each mux selects and why, and the control and ALU-control logic.' },
  { id: 'encoder', icon: 'encoding', tool: 'encoder', title: 'Instruction encoder', topics: ['encoding'],
    desc: 'Assemble a MIPS instruction into its R, I or J fields and hex, or decode a 32-bit word back into assembly.' },
  { id: 'dependencies', icon: 'datahaz', tool: 'depFinder', title: 'Dependency finder', topics: ['datahaz', 'forward'],
    desc: 'Paste a sequence and get every RAW, WAR and WAW dependency in the official table format.' },
];

export const EXTRA_LABS = [
  {
    id: 'three-cpus',
    icon: 'multi',
    tool: 'cpuRace',
    title: 'Three CPUs, one program',
    topics: ['single', 'multi', 'pipe', 'cpuperf'],
    desc: 'Single-cycle, multi-cycle and pipelined processors run the same instructions on one time axis: where each clock edge falls, where time is wasted, and who finishes first.'
  },
  {
    id: 'hazard-drill',
    icon: 'datahaz',
    tool: 'hazDrill',
    title: 'Hazard drill',
    topics: ['datahaz', 'forward'],
    desc: 'Endless random sequences in the style of Practice Test Q4: count the RAW dependencies and the stall cycles with and without forwarding, then check yourself against the pipeline diagrams.'
  },
  {
    id: 'number-wheel',
    icon: 'binary',
    tool: 'numWheel',
    title: 'Number wheel',
    topics: ['binary'],
    desc: 'Every bit pattern on a circle. Adding is walking clockwise: unsigned arithmetic breaks when you cross the top (carry), two’s complement when you cross the bottom (overflow).'
  },
  {
    id: 'one-line',
    icon: 'translate',
    tool: 'oneLine',
    title: 'One line of C, every layer',
    topics: ['isa1', 'encoding', 'translate', 'single', 'pipe', 'cpuperf'],
    desc: 'Follow one C statement down the whole stack: the MIPS instructions it compiles to, their 32 bits, which datapath unit each field feeds, how long it takes on each kind of processor, and where IC, CPI and the clock period come from.'
  },
  {
    id: 'module-map',
    icon: 'cpuperf',
    tool: 'conceptMap',
    title: 'Lectures 1–16 on one page',
    topics: ['cpuperf'],
    desc: 'Every Lectures 1–16 topic hung off the iron law, CPU time = IC × CPI × clock period, with the one formula to remember for each. Click a box to open its notes.'
  },
  {
    id: 'clock-drill',
    icon: 'multi',
    tool: 'clockDrill',
    title: 'Clock drill',
    topics: ['single', 'multi', 'pipe'],
    desc: 'Endless random stage-latency tables in the style of L12 s16, PS2 Q5 and Practice Test Q6: find the single-cycle clock, the multi-cycle clock and average, and the pipeline speedup, then check the working.'
  },
  {
    id: 'branch-predictor',
    icon: 'control',
    tool: 'bpFSM',
    title: 'Branch predictors (Test 2)',
    topics: ['control'],
    desc: 'A 1-bit and a 2-bit predictor guess the same branch history side by side, with the 2-bit state machine animated.'
  },
  {
    id: 'sci-notation',
    icon: 'binary',
    tool: 'sciLab',
    title: 'Scientific notation lab',
    topics: ['perf', 'cpuperf'],
    desc: 'See where 4.3 × 10⁻¹² comes from by sliding the decimal point, read any number on a ruler of powers of ten and unit prefixes (p, n, µ, m, k, M, G), and watch exponents add when you multiply and subtract when you divide.'
  }
];

export const TOOL_HELP = {
  layers: { how: '<p>Click a layer to see what it hides from the layer above and what it relies on below. Work top-down: application → … → transistors.</p>' },
  isaSort: { how: '<p>Decide for each feature whether a program would notice if it changed. Visible to software → ISA; only speed/cost changes → microarchitecture.</p><p><b>Try it on:</b> PS2 Q2 and Practice Test Q2 (Practice below).</p>' },
  clockConv: { how: '<p>Type a clock rate or a period; the other is computed as its reciprocal with the unit prefix shown step by step.</p>', assume: '1 GHz = 10<sup>9</sup> Hz; 1 ns = 10<sup>−9</sup> s.' },
  cpuTime: { how: '<p>Enter instruction count, CPI and clock for each machine. The working shows <i>T = IC × CPI / f</i> and the ratio slow ÷ fast.</p><p><b>Try it on:</b> PS1 Q2 and the L03 s17–s19 examples.</p>', assume: 'Both machines run the same program; time is CPU time only.' },
  cpiMix: { how: '<p>Give each instruction class its share (count or %) and CPI. The weighted average is built row by row.</p>', assume: 'Fractions are of instructions executed, not of time.' },
  amdahl: { how: '<p>Choose how <i>f</i> and the improvement are given (percent of time, part times, “time reduced by”, “performance up by”); the tool converts to <i>s</i> before applying Amdahl.</p><p><b>Try it on:</b> PS1 Q5a and the L04 s6 boss example.</p>', assume: '<i>f</i> is a fraction of the original execution time; the rest is unchanged.' },
  amdahlCompare: { how: '<p>Type the routine times, then describe two options. It works both out and names the bigger overall speedup, with a check in seconds.</p><p><b>Try it on:</b> PS1 Q5b.</p>', assume: '“Speed up by x%” is read as a time reduction (as in the official PS1 solution) unless you pick another reading.' },
  mips: { how: '<p>Pick an example or press <b>Edit</b> to write your own. <b>Step</b> runs one instruction and shows what changed; <b>Back</b> undoes it. Click a line number to set a breakpoint.</p>', assume: 'Big-endian memory, $sp starts at 0x7FFFEFFC, data at 0x10010000, no branch delay slots.' },
  mipsSim: { how: '<p>Step through the code and watch registers and memory.</p>', assume: 'Big-endian, no delay slots.' },
  offset: { how: '<p>Move the index to see the byte offset (index × 4) and the <code>lw</code>/<code>sw</code> that reaches that element.</p><p><b>Try it on:</b> PS1 Q6 and Practice Test Q3.</p>', assume: 'Word (4-byte) array elements.' },
  numlab: { how: '<p>Click bits to flip them, or type a value. Switch width (4/8/16/32) and tabs for conversions, two’s complement, addition with carries and sign extension.</p><p><b>Try it on:</b> PS2 Q3–Q4.</p>', assume: 'Two’s complement for signed values; overflow is flagged for the chosen width.' },
  encoder: { how: '<p>Type an instruction and see its fields in decimal, binary and hex — or type hex, or click bits, to decode a pattern back into assembly. For jumps and branches, set the PC of the instruction and name labels (e.g. <code>Loop = 0x00400000</code>) to use <code>j Loop</code> or <code>beq $t0, $zero, Exit</code>; the Next PC strip shows where it lands.</p><p><b>Try it on:</b> the L06 s6, s7 and s9 encoding examples, then the loop in the labels box above.</p>', assume: 'MIPS32 green-card opcodes (R, I and J formats, plus move, li, nop, clear and not as pseudo-instructions). A number after beq/bne is an offset in instructions from PC + 4; a number after j/jal is a byte address.' },
  addrModes: { how: '<p>Pick an addressing mode to see where the operand or target comes from and how the address is formed.</p>' },
  translate: { how: '<p>Follow one program from C to a running process. Click a stage to see its input, its output and what it adds.</p>' },
  pseudo: { how: '<p>Pick a pseudo-instruction to see the real instruction(s) the assembler produces.</p>', assume: 'Expansions follow the standard MIPS assembler ($at is used as the temporary).' },
  dff: { how: '<p>Toggle D and step the clock: Q only changes on a rising edge.</p>', assume: 'Positive edge-triggered D flip-flop.' },
  stageWalk: { how: '<p>Choose an instruction and step through IF, ID, EX, MEM and WB to see which units it uses in each.</p>', assume: 'The five-step processing cycle from L09.' },
  datapath: { how: '<p>Pick an instruction (grouped by format) and step IF → ID → EX → MEM → WB. Blue wires carry data, with their values; purple wires are control signals drawn from the control unit to what they steer (bold = 1, thin = 0, dotted = X). Inside each mux a purple switch shows which input it passes. <b>Click any mux, the control unit or ALU control</b> to open its explanation, or use the tabs: <i>Multiplexers</i> (what each picks, for which instruction, and when), <i>Control unit</i> (opcode → signals, with the logic) and <i>ALU control</i> (ALUOp + funct). Phones scroll the diagram to the active stage.</p>', assume: 'The single-cycle MIPS datapath from L10, with the jump hardware of P&H Fig. 4.24. addi uses the same control logic (it is not in the P&H table). “X” means don’t care.' },
  scTiming: { how: '<p>Choose a preset or type unit delays; each instruction’s path is summed and the slowest sets the clock.</p><p><b>Try it on:</b> Practice Test Q6, PS2 Q6a and L10 s16.</p>', assume: 'One clock period for every instruction (CPI = 1); unit delays add along the path.' },
  cycleCompare: { how: '<p>Edit the latency table (a blank cell = stage not used). It compares single-cycle, multi-cycle and pipelined time per instruction.</p><p><b>Try it on:</b> PS2 Q5 and L12 s16.</p>', assume: 'Multi-cycle and pipelined clocks are set by the slowest stage; pipeline CPI → 1 for a long program.' },
  laundry: { how: '<p>Add loads and toggle pipelining to see why throughput improves while each load still takes as long.</p>' },
  pipeBW: { how: '<p>Change stage count and register overhead to see throughput and latency move — and where adding stages stops paying.</p>', assume: 'Balanced stages; a fixed register delay is added per stage.' },
  pipeSim: { how: '<p>Pick an example or type code, toggle forwarding, then step cycle by cycle. Hatched red cells are stalls; the list explains each one.</p><p><b>Try it on:</b> the PS3 Q4 and Practice Test Q4 presets.</p>', assume: 'In-order 5-stage pipeline; the register file writes in the first half of a cycle and reads in the second; ALU results forward from the end of EX, loaded values from the end of MEM; branches have no penalty here.' },
  stallCPI: { how: '<p>Set how often each hazard happens and its penalty; CPI and time per instruction update.</p><p><b>Try it on:</b> Practice Test Q5 and PS3 Q3.</p>', assume: 'Ideal CPI = 1; penalties simply add.' },
  depFinder: { how: '<p>Type or pick code; every RAW, WAR and WAW pair is listed with its register and distance.</p><p><b>Try it on:</b> PS3 Q2 and Practice Test Q4i.</p>', assume: '<code>$zero</code> is ignored; <code>sw</code> and <code>beq</code> write no register.' },
  distance: { how: '<p>Change the distance between producer and consumer, and the producer type, to see the stall count.</p>', assume: 'Course convention (L16 s6): 2 stalls at distance 1 and 1 at distance 2 without forwarding.' },
  power: { how: '<p>Change C, V and f multipliers; the power ratio shows the voltage term squared.</p><p><b>Try it on:</b> PS1 Q3.</p>' },
  moore: { how: '<p>Change the doubling period and years ahead to project the transistor count.</p>' },
  ieee: { how: '<p>Type a decimal number or click bits to see sign, exponent and fraction fields.</p>', assume: 'IEEE 754 single precision, bias 127.' },
};

// Remove unused legacy keys & apply viz enrichments
delete TOOL_HELP.ieee;
delete TOOL_HELP.mipsSim;
delete TOOL_HELP.moore;
delete TOOL_HELP.power;

Object.assign(TOOL_HELP, {
  cpuRace: {
    how: '<p>Pick a program and a delay table, then press <b>Run the race</b> or drag the slider. All three processors share one time axis, so the same horizontal distance is the same amount of time. Solid colour = a stage doing work; grey hatching = clock time with nothing to do. The three cards give the totals as <i>N × CPI × clock</i>.</p><p><b>Try it on:</b> L12 s16 / R1 s21, PS2 Q5 and Practice Test Q6 — then switch hazards to <i>stall</i> or <i>forward</i> to see what dependencies cost the pipeline.</p>',
    assume: 'Multi-cycle and pipelined clocks = the slowest single step (no pipeline-register delay). Load 5 cycles, store 4, ALU 4, branch 3. Pipeline stalls follow the course rules; branch penalties are ignored (a Test 2 topic).'
  },
  dp3: {
    how: '<p>Choose a design at the top (each card shows its clock, the number of cycles this program needs and the total time). Then press <b>clock tick</b>. Every instruction keeps one colour: a moving dashed wire means that instruction’s data is on that wire in this cycle. Watch what sits on the dotted stage boundaries — nothing (single-cycle), a few named registers (multi-cycle) or four full pipeline registers (pipelined).</p><p>In the pipelined view, try <i>sub then four users of $2</i> and <i>Load-use</i> with forwarding on and off: orange arrows are forwarded values, a red dashed header is a bubble.</p>',
    assume: 'Conceptual five-step datapath (no jump path, ALU control not drawn — the detailed single-cycle view has those). Pipeline timing comes from the same simulator as the Pipeline lab; branches are resolved in MEM and their penalty is not modelled.'
  },
  datapath: {
    how: TOOL_HELP.datapath.how + '<p>The second tab, <b>Single-cycle vs multi-cycle vs pipelined</b>, redraws the datapath as each of the three designs so you can step the clock and see what changes.</p>',
    assume: TOOL_HELP.datapath.assume
  },
  hazDrill: {
    how: '<p>Work the sequence out on paper first: list each RAW pair and its distance, then draw the pipeline. Type your four numbers and press <b>Check</b>; <b>Show the solution</b> gives the dependency table and both pipeline diagrams with a reason for every stall.</p><p><b>Like:</b> Practice Test Q4 and PS3 Q4.</p>',
    assume: 'Course rules: no forwarding → wait for the producer’s WB (write first half, read second half); forwarding → only a load followed immediately by its user stalls (1 cycle). Stalls are counted for the whole sequence, so overlapping waits are not double-counted.'
  },
  numWheel: {
    how: '<p>Click a pattern to make it A, type B, and choose add or subtract. The blue arrow is the walk when you read the bits as unsigned; the orange arrow is the same operation read as two’s complement. A red line means that reading gives the wrong answer.</p><p><b>Try:</b> 0101 + 0110 (overflow, no carry), 1111 + 0001 (carry, no overflow), 0111 + 1001 from L08.</p>',
    assume: 'Fixed width; results wrap modulo 2ⁿ.'
  },
  oneLine: {
    how: '<p>Pick a statement, then click an instruction in layer 2: layers 3 and 4 show its bits and where each field goes in the datapath. Layers 5 and 6 are for the whole statement. The links on the left jump to the topic that teaches each layer.</p>',
    assume: 'Stage delays from L12 s16 (200 · 100 · 200 · 200 · 100 ps). Instruction addresses start at 0x00400000.'
  },
  clockDrill: {
    how: '<p>Work out the four numbers from the table, type them in and press <b>Check</b>. <b>Show the solution</b> draws each class’s time on both designs to scale and gives the full working.</p><p><b>Like:</b> L12 s16 / R1 s21, PS2 Q5, Practice Test Q6.</p>',
    assume: 'Load 5 steps, store 4, R-format 4, branch 3. Multi-cycle and pipeline clocks = the slowest step; pipeline speedup is the ideal long-program value (CPI = 1, no register delay).'
  },
  bpFSM: {
    how: '<p>Type a history of T (taken) and N (not taken), or pick a pattern, then step through it. The orange state is where the 2-bit counter is before each branch; a thick arrow is the move it just made.</p>',
    assume: 'One predictor entry for one branch. The 1-bit predictor starts with the same guess as the 2-bit one.'
  },
  sciLab: {
    how: '<p>Type a number any way you like (<code>4.3 x 10^-12</code>, <code>4.3e-12</code>, <code>0.0000000000043</code>, or with a unit such as <code>250 ps</code> or <code>4 GHz</code>) or press one of the examples. <b>Slide the point</b> shows the decimal point travelling to just after the first non-zero digit, and the exponent it leaves behind. <b>Ruler and prefixes</b> puts the value on a scale where each tick is ×10 and each prefix is ×1000. <b>Multiply and divide</b> shows exponents adding or subtracting, step by step.</p><p><b>Try it on:</b> L03 s13 and R1 s7 conversions, and 1 ÷ 250 ps = 4 GHz.</p>',
    assume: 'Plain digits, e-notation, or m × 10^n (x, × or * for the times sign). Prefixes f p n µ m k M G T go in front of s, Hz, F, W, V, A, B or J. Up to 15 significant digits and exponents from −30 to +30.'
  }
});

const LAB_ORDER = ['sci-notation', 'one-line', 'module-map', 'mips', 'encoder', 'number-lab', 'number-wheel', 'datapath', 'three-cpus', 'clock-drill', 'pipeline', 'dependencies', 'hazard-drill', 'branch-predictor'];

export function buildLabs(topics) {
  const labs = [...BASE_LABS, ...EXTRA_LABS].map((l) => Object.assign({}, l));
  const dp = labs.find((l) => l.id === 'datapath');
  if (dp) {
    dp.title = 'Datapath: single-cycle, multi-cycle, pipelined';
    dp.topics = ['single', 'multi', 'pipe', 'forward'];
    dp.desc = 'Two views. The detailed single-cycle datapath with jump (every control wire, what each mux selects and why), and the same datapath redrawn as single-cycle, multi-cycle and pipelined so you can step the clock and compare.';
  }
  const rank = (id) => { const i = LAB_ORDER.indexOf(id); return i < 0 ? 99 : i; };
  labs.sort((a, b) => rank(a.id) - rank(b.id));
  const num = (id) => { const i = topics.findIndex((t) => t.id === id); return i < 0 ? 99 : i; };
  labs.forEach((l) => { if (l.topics) l.topics = l.topics.slice().sort((a, b) => num(a) - num(b)); });
  return labs;
}
