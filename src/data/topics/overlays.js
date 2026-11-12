import { R, B, Q, PIPE, CODE, TBL, ENRICH } from '../../utils/dsl.js';

export function applyTopicOverlays(topics, qMap) {
  const enrich = (id, step, block, where) => ENRICH(topics, id, step, block, where);

  // --- zz-1-teach ---
  {
const T = id => topics.find(x => x.id === id);
  const set = (id, o) => Object.assign(T(id), o);
  const stg = s => `<span class="stg ${s.toLowerCase()}">${s}</span>`;

  /* ---------- 01 arch ---------- */
  set('arch', { nextWhy: 'the parts every computer has, and the line between what software sees and how hardware does it.' });
  enrich('arch', 5, B.recipe({ title: 'Power-ratio questions', for: 'PS1 Q3 · PS1 Q1d', steps: [
    R`Write \(P = \tfrac12 C V^2 f\) for both the old and the new design.`,
    R`Turn every change into a multiplier: “15% lower” → ×0.85, “10% higher” → ×1.10.`,
    R`Divide new by old so the \(\tfrac12\) and anything unchanged cancels: \(\dfrac{P_{new}}{P_{old}} = c \times v^2 \times f_x\).`,
    R`Square the voltage multiplier — the most common slip is forgetting the square.`,
    R`Turn the ratio back into words: 0.62 means “uses 62% of the power”, i.e. 38% less.`], back: 'The ½ is in the slides but not in the recording or P&H; it cancels in every ratio, so it never changes a ratio answer.' }), 'start');
  enrich('arch', 5, B.derive('Why voltage matters more than anything else', R`<p>Each switching transistor charges a capacitance \(C\) to voltage \(V\): the energy per transition is proportional to \(CV^2\). Do that \(f\) times per second and you get power \(\propto C V^2 f\). Voltage appears <b>squared</b>, so cutting \(V\) by 15% cuts power to \(0.85^2 = 0.72\) of before — a bigger effect than a 15% cut in clock rate (×0.85). That is why the industry lowered voltage for decades, and why the power wall arrived when voltage could not drop any further (leakage).</p>`));

  /* ---------- 02 vonneumann ---------- */
  set('vonneumann', { nextWhy: 'once ISA and microarchitecture are separated, you can measure how fast a machine is.' });
  enrich('vonneumann', 4, B.sort({ title: 'ISA or microarchitecture?', cats: ['ISA', 'Microarchitecture'], items: [
    ['The number of general-purpose registers a programmer can use', 0, 'Visible to software: the compiler must know how many registers exist.'],
    ['Whether the processor is pipelined', 1, 'Invisible to software: the same program runs, just faster or slower.'],
    ['The binary encoding of <code>add</code>', 0, 'Part of the contract: the assembler must produce exactly these bits.'],
    ['The size of the cache', 1, 'Changes speed, never the result of a program.'],
    ['The addressing modes a load instruction supports', 0, 'Programmers write code that uses them, so they are part of the ISA.'],
    ['How many cycles a multiply takes', 1, 'Timing is an implementation choice.'],
    ['Whether memory is byte-addressed', 0, 'Software computes addresses in bytes, so it must be specified.'],
    ['Whether the adder is ripple-carry or carry-lookahead', 1, 'A circuit-level choice inside the processor.']] }), 'start');
  enrich('vonneumann', 5, B.recipe({ title: 'Classifying a feature as ISA or microarchitecture', for: 'PS2 Q2 · Practice Test Q2', steps: [
    'Ask: would a <b>program</b> (or the compiler writing it) have to change if this feature changed?',
    'If yes — it is visible to software: <b>ISA</b> (instructions, registers, addressing modes, data types, memory model).',
    'If no — the same binary still runs and gives the same answer, only faster, cheaper or cooler: <b>microarchitecture</b>.',
    'Write one sentence of justification using the words “visible to the programmer” or “implementation”. The marks are for the reason.'] }), 'start');

  /* ---------- 03 perf ---------- */
  set('perf', { nextWhy: 'it splits “time” into instructions × cycles × seconds, so you can see where speed comes from.' });
  enrich('perf', 4, B.recipe({ title: '“How many times faster?”', for: 'L03 s7–s8 · Practice Test Q1ii', steps: [
    'Get the execution time of both machines on the same program (seconds).',
    R`Put the <b>slower</b> time on top: \(n = \dfrac{T_{slow}}{T_{fast}}\). Then \(n \ge 1\).`,
    'Answer in words with the faster machine named first: “A is n times faster than B”.',
    R`If performances are given instead of times, flip: \(n = \dfrac{\text{Perf}_{fast}}{\text{Perf}_{slow}}\).`] }), 'start');
  enrich('perf', 5, B.derive('Why “x% faster” and “x% less time” are not the same', R`<p>Performance is \(1/T\). If time falls by 20% then \(T_{new} = 0.8\,T\), so performance becomes \(1/0.8 = 1.25\) times as high: <b>25% faster</b>, not 20%. Going the other way, 20% more performance means \(T_{new} = T/1.2 = 0.833\,T\): only 16.7% less time. A percentage change in one is never the same percentage change in its reciprocal.</p>`));
  enrich('perf', 6, B.read([[R`\(f = 1/T\)`, 'clock rate is one over clock period'], [R`\(2\ \text{GHz} \Rightarrow T = 0.5\ \text{ns}\)`, 'two billion ticks a second, so each tick lasts half a nanosecond']]));

  /* ---------- 04 cpuperf ---------- */
  set('cpuperf', { nextWhy: 'it shows how much speeding up just one part of the program can ever help.' });
  enrich('cpuperf', 3, B.recipe({ title: 'Comparing two machines with the iron law', for: 'PS1 Q2 · L03 s17–s19', steps: [
    R`Write \(T = IC \times CPI \times T_{clk}\) (or \(IC \times CPI / f\)) for each machine.`,
    'Cross out anything the question says is the same on both (usually IC, because it is the same program and ISA).',
    'Convert units once: clock rates to Hz (or periods to seconds) before you multiply.',
    R`Form the ratio slow ÷ fast and say which machine wins by how much.`,
    'If the question asks what CPI/clock rate is <i>needed</i>, set the two times equal and solve for the unknown.'] }), 'start');
  enrich('cpuperf', 5, B.recipe({ title: 'Average CPI from an instruction mix', for: 'L10 s21 · P&H §1.6', steps: [
    'List each class with its CPI and either its count or its fraction of instructions.',
    R`Turn counts into fractions: \(F_i = IC_i / IC\). The fractions must add to 1.`,
    R`\(CPI_{avg} = \sum F_i \times CPI_i\). Or total cycles \(= \sum IC_i \times CPI_i\), then divide by IC.`,
    'Check: the answer must lie between the smallest and largest class CPI.'] }), 'start');
  enrich('cpuperf', 2, B.read([[R`\(T = IC \times CPI \times T_{clk}\)`, 'time equals instructions, times cycles per instruction, times seconds per cycle'], [R`\(\dfrac{\text{seconds}}{\text{program}} = \dfrac{\text{instructions}}{\text{program}} \times \dfrac{\text{cycles}}{\text{instruction}} \times \dfrac{\text{seconds}}{\text{cycle}}\)`, 'the units cancel like fractions: instructions and cycles cancel, seconds per program is left']]));
  enrich('cpuperf', 8, B.derive('Why MIPS can mislead', R`<p>\(\text{MIPS} = \dfrac{IC}{T \times 10^6} = \dfrac{f}{CPI \times 10^6}\). Instruction count has disappeared from the formula. A machine (or compiler) that needs <b>more</b>, simpler instructions to do the same job gets a higher MIPS rating while taking longer. Only execution time compares fairly.</p>`));

  /* ---------- 05 amdahl ---------- */
  set('amdahl', { nextWhy: 'the speedups so far are about time; next you see the instructions that time is spent on.' });
  enrich('amdahl', 6, B.recipe({ title: 'Amdahl from a table of routines', for: 'PS1 Q5a–b', steps: [
    'Add the routine times to get the original total.',
    R`\(f\) = the improved routine's time ÷ the total (a fraction of <b>time</b>, never of instructions).`,
    R`Turn the wording into \(s\): “time reduced by x%” → \(s = 1/(1-x)\); “x times faster” → \(s = x\); “performance up x%” → \(s = 1 + x\).`,
    R`Speedup \(= 1 / ((1-f) + f/s)\); new time = old ÷ speedup.`,
    'Check in seconds: shrink only that routine and re-add. Both routes must agree.'], back: 'Comparing two options? Do the whole method for each, then name the winner and give both speedups.' }), 'start');
  enrich('amdahl', 4, B.recipe({ title: '“How much faster must it get?” (working backwards)', for: 'target-speedup questions', steps: [
    R`Write the target: \(\dfrac{1}{(1-f) + f/s} = S_{target}\).`,
    R`Flip both sides: \((1-f) + f/s = 1/S_{target}\).`,
    R`Subtract \(1-f\). If the result is zero or negative, the target is impossible: it is at or above the limit \(1/(1-f)\).`,
    R`Otherwise \(s = f / (1/S_{target} - (1-f))\).`] }));

  /* ---------- 06 isa1 ---------- */
  set('isa1', { notationNote: R`Register names: the slides use <code>$s0–$s7</code> for variables and <code>$t0–$t9</code> for temporaries; these are names for register numbers <code>$16–$23</code> and <code>$8–$15</code>, <code>$t8–$t9</code> are <code>$24–$25</code>. Some older examples write <code>$1</code>, <code>r1</code> or <code>R1</code> — all mean a register by number.`,
    nextWhy: 'every instruction you have written becomes a 32-bit pattern; next you build those bits.' });
  enrich('isa1', 3, B.read([['add $s0, $s1, $s2', '$s0 gets $s1 plus $s2'], ['sub $t0, $t1, $t2', 'subtract: $t0 gets $t1 minus $t2'], ['addi $t0, $t0, 4', '$t0 gets $t0 plus the constant 4']]));
  enrich('isa1', 6, B.read([['lw $t0, 8($s3)', 'load the word at address $s3 plus 8 into $t0'], ['sw $t0, 48($s3)', 'store $t0 into memory at $s3 plus 48']]), 'start');
  enrich('isa1', 6, B.recipe({ title: 'C array access → MIPS', for: 'PS1 Q6 · Practice Test Q3 · L05 s19', steps: [
    'Write down which register holds each variable and the <b>base address</b> of each array.',
    R`Byte offset = index × 4 for word arrays: <code>A[8]</code> → offset 32.`,
    'Load each array element you read into a <code>$t</code> register with <code>lw offset(base)</code>.',
    'Do the arithmetic on registers, innermost brackets first, one operation per instruction.',
    'Store a result back with <code>sw</code> to its byte offset; a plain variable just ends in its own register.',
    'If the index is in a register (A[i]), compute the address: <code>sll $t1, $s1, 2</code> then <code>add $t1, $t1, $s3</code>, then <code>lw $t0, 0($t1)</code>.'] }), 'start');
  enrich('isa1', 2, B.sort({ title: 'RISC or CISC trait?', cats: ['RISC', 'CISC'], items: [
    ['Fixed 32-bit instruction length', 0, 'MIPS: every instruction is one word.'],
    ['An instruction that adds two numbers straight from memory', 1, 'RISC only touches memory with load/store.'],
    ['Only loads and stores access memory', 0, 'The load/store architecture is a defining RISC trait.'],
    ['Many complex addressing modes', 1, 'x86-style: richer modes, harder decoding.'],
    ['Simple instructions, most finishing in one cycle', 0, 'Simplicity makes pipelining easy.'],
    ['Variable-length instructions (1 to 15 bytes)', 1, 'x86 is the classic example.']] }));

  /* ---------- 07 encoding ---------- */
  set('encoding', { nextWhy: 'with formats known, the next topic adds logic, branches and procedure calls — and how branches encode their targets.' });
  enrich('encoding', 3, B.recipe({ title: 'Assembly → hex', for: 'L06 s6 · L06 s9', steps: [
    'Pick the format from the instruction: R (three registers), I (immediate, load/store, branch) or J (j, jal).',
    'Fill each field in decimal. Register names → numbers ($t0–$t7 = 8–15, $s0–$s7 = 16–23). Watch the order: R-format is <b>rd, rs, rt</b> in assembly but <b>rs, rt, rd</b> in the bits.',
    'Convert every field to binary at its exact width (6, 5, 5, 5, 5, 6 or 6, 5, 5, 16), padding with leading zeros.',
    'Write the 32 bits in a row, then regroup into 4-bit chunks from the right, ignoring field boundaries.',
    'Turn each chunk into one hex digit.'], back: '<b>Decoding is the same method backwards:</b> hex → 32 bits; the first 6 bits (op) tell you the format; cut the rest at that format’s field widths; for R-format, funct names the operation.' }), 'start');
  enrich('encoding', 3, B.tbl({ src: 'S', ref: 'L06 s6', head: ['', 'op', 'rs', 'rt', 'rd', 'shamt', 'funct'], rows: [
    ['meaning', 'R-type', '$s1', '$s2', '$t0', '—', 'add'], ['decimal', '0', '17', '18', '8', '0', '32'],
    ['binary', '<code>000000</code>', '<code>10001</code>', '<code>10010</code>', '<code>01000</code>', '<code>00000</code>', '<code>100000</code>'],
    ['regrouped', '<code>0000</code>', '<code>0010</code> <code>0011</code>', '<code>0010</code>', '<code>0100</code> <code>0000</code>', '<code>0010</code>', '<code>0000</code>'],
    ['hex', '0', '2 3', '2', '4 0', '2', '0']], caption: R`<code>add $t0, $s1, $s2</code> from meaning to hex in one table. The regrouped row cuts the same 32 bits into nibbles (0000 0010 0011 0010 0100 0000 0010 0000), which no longer line up with the fields: <b>0x02324020</b>.` }));
  enrich('encoding', 3, B.read([['add $t0, $s1, $s2', 'R-format: op 0, rs = $s1, rt = $s2, rd = $t0, funct 32']]));

  /* ---------- 08 isa2 ---------- */
  set('isa2', { nextWhy: 'these instructions still have to be turned into machine code and loaded — that is the tool chain.' });
  enrich('isa2', 3, B.read([['beq $t0, $t1, L1', 'if $t0 equals $t1, go to L1'], ['bne $s3, $s4, Else', 'if $s3 is not equal to $s4, go to Else'], ['slt $t0, $s1, $s2', '$t0 gets 1 if $s1 is less than $s2, otherwise 0'], ['jal Func', 'save the return address in $ra and jump to Func'], ['jr $ra', 'jump back to the address held in $ra']]), 'start');
  enrich('isa2', 4, B.recipe({ title: 'C loop → MIPS', for: 'PS1 Q7', steps: [
    'Put a label on the first instruction of the loop body (or the test).',
    'Compute whatever the condition needs (array address, loaded value) at the top of each iteration.',
    'Branch <b>out</b> of the loop with the <b>opposite</b> test: <code>while (a == k)</code> → <code>bne … Exit</code>.',
    'Write the body, then update the counter (<code>addi $s3, $s3, 1</code>).',
    'Finish with <code>j Loop</code>, and put the <code>Exit:</code> label after it.'] }), 'start');
  enrich('isa2', 6, B.derive('Why branch offsets count from PC + 4', R`<p>By the time a branch is decided the PC has already moved on to the next instruction (PC + 4). Measuring from there means the offset is the number of instructions to skip <i>from the next one</i>: \(\text{imm} = (\text{target} - (\text{PC} + 4)) / 4\). Dividing by 4 works because every instruction is 4 bytes and word-aligned, so the bottom two address bits are always 00 and need not be stored — that quadruples the reach of a 16-bit field.</p>`));

  /* ---------- 09 translate ---------- */
  set('translate', { nextWhy: 'the data those programs work on is binary numbers — signed, unsigned and overflowing.' });
  enrich('translate', 1, B.sort({ title: 'Which tool does this job?', cats: ['Compiler', 'Assembler', 'Linker', 'Loader'], items: [
    ['Turns C into assembly language', 0, 'High-level → assembly.'],
    ['Replaces pseudo-instructions such as <code>move</code> with real ones', 1, 'Pseudo-instructions only exist at the assembly level.'],
    ['Joins separately compiled object files and library routines', 2, 'It resolves references between files.'],
    ['Copies the executable into memory and jumps to its start', 3, 'Part of the operating system.'],
    ['Builds a symbol table of labels and their addresses', 1, 'Needed to fill in branch and jump fields.'],
    ['Fixes up absolute addresses once the final layout is known', 2, 'Relocation happens at link time.']] }));
  enrich('translate', 2, B.read([['move $t0, $t1', 'pseudo-instruction: copy $t1 into $t0 — really add $t0, $zero, $t1'], ['li $t0, 5', 'pseudo-instruction: load the constant 5 — really addi or ori from $zero']]));

  /* ---------- 10 binary ---------- */
  set('binary', { notationNote: R`“Bit 0” is always the <b>rightmost</b> (least significant) bit; bit 31 is the sign bit of a 32-bit word. Hex values are written <code>0x…</code> in the slides and with a subscript 16 in the textbook — the same thing.`, nextWhy: 'integers are covered; floating point handles fractions and very large or small values.' });
  enrich('binary', 3, B.recipe({ title: 'Negating a two’s complement number', for: 'PS2 Q3 · L08 s6–s7', steps: [
    'Write the number in binary at the full width (e.g. 8 or 32 bits).',
    'Invert every bit (0↔1).',
    'Add 1.',
    R`Check: the original plus its negation must be 0 at that width (the carry out is thrown away).`], back: 'Shortcut: copy bits from the right up to and including the first 1, then invert everything to its left.' }), 'start');
  enrich('binary', 3, B.derive('Why “invert and add 1” negates', R`<p>Inverting an \(n\)-bit number \(x\) gives \((2^n - 1) - x\), because each bit becomes 1 minus itself and \(2^n - 1\) is all ones. Adding 1 gives \(2^n - x\). In \(n\)-bit arithmetic \(2^n\) wraps round to 0, so \(2^n - x\) behaves exactly like \(-x\). That is also why the top bit has weight \(-2^{n-1}\).</p>`));
  enrich('binary', 5, B.recipe({ title: 'Spotting overflow', for: 'PS2 Q4 · L08 s11–s12', steps: [
    'Unsigned: overflow if there is a carry out of the top bit.',
    'Signed add: overflow only when both operands have the <b>same</b> sign and the result has the <b>other</b> sign.',
    'Signed subtract <i>a − b</i>: treat as <i>a + (−b)</i> and apply the add rule.',
    'Adding a positive and a negative number can never overflow.'] }));
  enrich('binary', 5, B.sort({ title: 'Overflow or not? (8-bit signed)', cats: ['Overflow', 'No overflow'], items: [
    ['100 + 50', 0, '150 > 127, and two positives gave a negative pattern.'],
    ['100 + (−50)', 1, 'Different signs can never overflow.'],
    ['−100 + (−50)', 0, '−150 < −128.'],
    ['−128 + 127', 1, 'Result −1 is in range.'],
    ['64 + 64', 0, '128 does not fit: the largest is 127.'],
    ['−64 + (−64)', 1, '−128 is exactly the most negative value and fits.']] }));

  /* ---------- 11 float ---------- */
  set('float', { notationNote: R`The slides write the value as \((-1)^S \times (1 + \text{Fraction}) \times 2^{\text{Exponent} - \text{Bias}}\); P&H calls the stored fraction the <i>significand</i> or <i>mantissa</i> in places. Bias is 127 for single precision, 1023 for double.`, nextWhy: 'that finishes the ISA view; now you open the box and see how hardware runs an instruction.' });
  enrich('float', 4, B.recipe({ title: 'Bit pattern → decimal', for: 'P&H §3.5', steps: [
    'Split the 32 bits: 1 sign bit, 8 exponent bits, 23 fraction bits (hex → binary first if needed).',
    'Sign: 0 → positive, 1 → negative.',
    R`Exponent: read the 8 bits as unsigned, subtract 127.`,
    R`Significand: put “1.” in front of the fraction bits and read it in binary (\(1.01_2 = 1.25\)).`,
    R`Value \(= \pm\, \text{significand} \times 2^{\text{exponent}-127}\).`], back: 'Exponent all 0s or all 1s are special (zero/denormals, infinity/NaN) — check that first.' }), 'start');
  enrich('float', 5, B.recipe({ title: 'Decimal → bit pattern', for: 'P&H §3.5 (−0.75 example)', steps: [
    R`Write the number in binary (integer part by repeated ÷2, fraction by repeated ×2): \(0.75 = 0.11_2\).`,
    R`Normalise to \(1.xxx \times 2^e\): \(0.11_2 = 1.1_2 \times 2^{-1}\).`,
    R`Stored exponent \(= e + 127\) in 8 bits: \(-1 + 127 = 126 = 0111\,1110\).`,
    'Fraction = the bits after the point, padded with zeros to 23 bits.',
    'Sign bit, then exponent, then fraction; regroup into hex if asked.'] }), 'start');

  /* ---------- 12 uarch ---------- */
  set('uarch', { nextWhy: 'the simplest way to do all five steps is in one long clock cycle — the single-cycle datapath.' });
  enrich('uarch', 3, B.sort({ title: 'Combinational or sequential?', cats: ['Combinational', 'Sequential'], items: [
    ['ALU', 0, 'Output depends only on the current inputs.'],
    ['Register file', 1, 'It stores state between cycles.'],
    ['Multiplexer', 0, 'Pure selection logic.'],
    ['Program counter', 1, 'A register: it holds a value until the next clock edge.'],
    ['Sign-extension unit', 0, 'Just wiring and copies of the top bit.'],
    ['Data memory', 1, 'It remembers what was stored.']] }));
  enrich('uarch', 4, B.derive('Why the slowest path sets the clock', R`<p>A clock edge captures whatever values reach the state elements. Every path from one state element to the next must finish within one period, or a register captures a half-computed value. So the period must be at least the delay of the <b>longest</b> (critical) path, plus any register overhead: \(T_{clk} \ge \max(\text{path delays})\). Shortening any other path does nothing for the clock.</p>`));

  /* ---------- 13 single ---------- */
  set('single', { nextWhy: 'its long cycle wastes time on fast instructions; multi-cycle splits the work into short steps.' });
  enrich('single', 5, B.recipe({ title: 'Clock period of a single-cycle datapath', for: 'Practice Test Q6 · PS2 Q6a · L10 s16', steps: [
    'List the units each instruction class passes through (e.g. lw: I-Mem → Reg read → ALU → D-Mem → Reg write).',
    'Add the delays along that path for every class.',
    'The clock period is the <b>largest</b> total: every instruction gets that long, because there is one cycle per instruction.',
    'If asked for CPU time: IC × 1 × period (CPI = 1 by definition).'], back: 'Units used in parallel (e.g. the PC adder alongside the ALU) only count if they are on the longest path.' }), 'start');
  enrich('single', 3, B.sort({ title: 'Which control signal is 1 for a load (lw)?', cats: ['1', '0', 'don’t care'], items: [
    ['RegWrite', 0, 'lw writes the loaded value into rt.'], ['MemRead', 0, 'It reads data memory.'], ['MemWrite', 1, 'Only sw writes memory.'],
    ['MemtoReg', 0, 'The value written back comes from memory, not the ALU.'], ['ALUSrc', 0, 'The ALU adds the sign-extended offset.'], ['RegDst', 1, 'lw writes rt, so RegDst = 0.'], ['Branch', 1, 'Not a branch.']] }));

  /* ---------- 14 multi ---------- */
  set('multi', { nextWhy: 'multi-cycle still leaves most hardware idle; pipelining overlaps instructions to use it.' });
  enrich('multi', 5, B.recipe({ title: 'Single-cycle vs multi-cycle from a latency table', for: 'PS2 Q5 · L12 s16', steps: [
    'Single-cycle period = the slowest instruction’s total latency; CPI = 1.',
    'Multi-cycle period = the slowest <b>stage</b> (plus register overhead if given).',
    'Multi-cycle CPI = average number of stages used, weighted by the instruction mix.',
    'Time per instruction: single = period; multi = CPI × short period. Compare the two.'] }), 'start');

  /* ---------- 15 pipe ---------- */
  set('pipe', { notationNote: R`Stage colours are the same in every diagram on this site: ${stg('IF')} ${stg('ID')} ${stg('EX')} ${stg('MEM')} ${stg('WB')}, and a stall is hatched red.`, nextWhy: 'real pipelines don’t stay ideal — hazards force stalls.' });
  enrich('pipe', 4, B.recipe({ title: 'Cycles for N instructions in a k-stage pipeline', for: 'PS2 Q5c · PS2 Q6b · L12 s18', steps: [
    R`The first instruction needs all \(k\) cycles to come out.`,
    R`Every later instruction finishes one cycle after the one before: \(+ (N-1)\).`,
    R`Total \(= k + N - 1\) cycles; time = that × the pipelined clock period.`,
    R`Speedup over non-pipelined = (N × non-pipelined time per instruction) ÷ pipelined time; it approaches k for large N with balanced stages.`] }), 'start');
  enrich('pipe', 6, B.states({ src: 'S', ref: 'L13 s5–s10', title: 'Reading a pipeline diagram', states: [
    ['Five instructions', PIPE(['lw | IF ID EX MEM WB', 'sw | . IF ID EX MEM WB', 'add | . . IF ID EX MEM WB', 'sub | . . . IF ID EX MEM WB', 'and | . . . . IF ID EX MEM WB']), 'Read a row to follow one instruction; read a column to see what every stage is doing in that cycle.'],
    ['Cycle 5: all stages busy', PIPE(['lw | IF ID EX MEM ^WB', 'sw | . IF ID EX ^MEM WB', 'add | . . IF ID ^EX MEM WB', 'sub | . . . IF ^ID EX MEM WB', 'and | . . . . ^IF ID EX MEM WB']), 'In cycle 5 the pipeline is full: five instructions are in flight, one per stage.'],
    ['Fill and drain', PIPE(['lw | ^IF ^ID ^EX ^MEM WB', 'sw | . IF ID EX MEM WB', 'add | . . IF ID EX MEM WB', 'sub | . . . IF ID EX MEM WB', 'and | . . . . IF ID EX ^MEM ^WB']), 'The first k − 1 = 4 cycles fill the pipe and the last 4 drain it: 5 + 5 − 1 = 9 cycles in total.']],
    caption: 'One diagram, three ways to read it. Rows are instructions in program order; columns are clock cycles.' }));

  /* ---------- 16 hazards ---------- */
  set('hazards', { notationNote: R`In the CPI formula \(N\) is the number of instructions and \(S\) the total stall cycles. Slides write registers as <code>r1</code>/<code>R1</code>, P&H as <code>$1</code>/<code>$t1</code> — the same thing.`, nextWhy: 'the most common hazard is an instruction needing a value that isn’t written yet.' });
  enrich('hazards', 4, B.states({ src: 'S', ref: 'L14 s9–s11', title: 'Structural hazard: one memory for instructions and data', states: [
    ['One memory: conflict', PIPE(['lw | IF ID EX !MEM WB', 'i+1 | . IF ID EX MEM WB', 'i+2 | . . IF ID EX MEM WB', 'i+3 | . . . !IF ID EX MEM WB']), 'Cycle 4: the load reads data in MEM while i+3 wants to fetch in IF — both need the single memory.'],
    ['Solution 1: stall', PIPE(['lw | IF ID EX MEM WB', 'i+1 | . IF ID EX MEM WB', 'i+2 | . . IF ID EX MEM WB', 'i+3 | . . . * IF ID EX MEM WB']), 'i+3 waits one cycle. No new hardware, but every later instruction is one cycle late.'],
    ['Solution 2: split I/D memory', PIPE(['lw | IF ID EX MEM WB', 'i+1 | . IF ID EX MEM WB', 'i+2 | . . IF ID EX MEM WB', 'i+3 | . . . IF ID EX MEM WB']), 'Separate instruction and data memories (caches) remove the clash: no stall, at the cost of more hardware.']],
    caption: 'The same four instructions with the conflict, the stall fix and the hardware fix.' }), 'start');
  enrich('hazards', 6, B.recipe({ title: 'CPI with several kinds of hazard', for: 'PS3 Q3 · Practice Test Q5', steps: [
    'For each hazard type: fraction of instructions affected × stall cycles each.',
    'For branches, count only the ones the policy gets wrong (e.g. the taken ones if the pipeline predicts not-taken).',
    R`Add them to the ideal CPI: \(CPI = 1 + \sum (\text{fraction} \times \text{penalty})\).`,
    R`To compare processors use time per instruction = CPI × clock period, not CPI alone.`] }), 'start');
  enrich('hazards', 6, B.derive('Why stalls add straight onto the CPI', R`<p>An ideal pipeline finishes one instruction per cycle, so \(N\) instructions take about \(N\) cycles. Each stall cycle is a cycle in which nothing finishes, so \(N\) instructions with \(S\) stalls take \(N + S\) cycles: \(CPI = \dfrac{N+S}{N} = 1 + \dfrac{S}{N}\). If a fraction \(p\) of instructions each cause \(c\) stall cycles, \(S/N = p \times c\).</p>`));

  /* ---------- 17 datahaz ---------- */
  set('datahaz', { notationNote: R`<i>i</i> is the earlier instruction and <i>j</i> the later one; definitions are always “j does X to what i does Y”. <b>Producer</b> = writes the register, <b>consumer</b> = reads it. <code>sw</code> has <b>no destination</b>: both its registers are sources.`, nextWhy: 'stalls are expensive; forwarding and reordering remove most of them.' });
  enrich('datahaz', 4, B.recipe({ title: 'Find every dependency', for: 'PS3 Q2 · Practice Test Q4i · L15 s11', steps: [
    'For each instruction write the register it writes (none for <code>sw</code>, <code>beq</code>) and the registers it reads.',
    'RAW: a later instruction reads a register an earlier one wrote, with no write to it in between.',
    'WAR: a later instruction writes a register an earlier one read.',
    'WAW: a later instruction writes a register an earlier one also wrote.',
    'Ignore <code>$zero</code>; two reads of the same register are not a dependency.',
    'Give each as “I2 → I4 on $t1 (RAW)”. Only RAW causes stalls in this pipeline.'] }), 'start');
  enrich('datahaz', 6, B.derive('Why the stall rule is 2, then 1, then 0', R`<p>Without forwarding the consumer must read the value from the register file in its ${stg('ID')} stage. The producer writes it in ${stg('WB')}, which is <b>cycle 5</b> of the producer. A consumer \(d\) instructions later is \(d\) cycles behind, so its ID would be in cycle \(2 + d\). The register file writes in the first half of a cycle and reads in the second, so ID may share cycle 5 with WB but cannot come earlier: it must wait \(5 - (2 + d) = 3 - d\) cycles when that is positive. \(d = 1 \Rightarrow 2\) stalls, \(d = 2 \Rightarrow 1\), \(d \ge 3 \Rightarrow 0\).</p>`), 1);
  enrich('datahaz', 3, B.sort({ title: 'Name the dependency (I1 first, then I2)', cats: ['RAW', 'WAR', 'WAW', 'none'], items: [
    ['I1 <code>add $t1, $t2, $t3</code> → I2 <code>sub $t4, $t1, $t5</code>', 0, 'I2 reads $t1, which I1 writes.'],
    ['I1 <code>sub $t4, $t1, $t3</code> → I2 <code>add $t1, $t2, $t3</code>', 1, 'I2 writes $t1, which I1 reads.'],
    ['I1 <code>add $t1, $t2, $t3</code> → I2 <code>lw $t1, 0($t5)</code>', 2, 'Both write $t1.'],
    ['I1 <code>add $t1, $t2, $t3</code> → I2 <code>sub $t4, $t2, $t3</code>', 3, 'Both only read $t2 and $t3: read-after-read is not a dependency.'],
    ['I1 <code>lw $t1, 0($t0)</code> → I2 <code>sw $t1, 4($t0)</code>', 0, 'sw reads $t1 (its data source) — RAW.'],
    ['I1 <code>add $zero, $t1, $t2</code> → I2 <code>sub $t3, $zero, $t4</code>', 3, '$zero never carries a value.']] }));

  /* ---------- 18 forward ---------- */
  set('forward', { nextWhy: 'Test 1 ends here. Test 2 continues with branches (control hazards).' });
  enrich('forward', 4, B.derive('Why a load still costs one stall with forwarding', R`<p>A load only has its value at the <b>end of ${stg('MEM')}</b> (cycle 4). The very next instruction needs it at the <b>start of its ${stg('EX')}</b> — also cycle 4. A value can't be used in the same cycle it is produced, so one bubble is unavoidable; then forwarding from MEM/WB delivers it. In general the load-use stalls are \(\max(0, 2-d)\). An ALU result is ready at the end of EX (cycle 3), in time for the next instruction's EX in cycle 4, so ALU → ALU needs 0.</p>`), 'start');
  enrich('forward', 5, B.recipe({ title: 'Reorder to remove a load-use stall', for: 'PS3 Q4 · Practice Test Q4iii · R1 s29', steps: [
    'Mark every load whose result is used by the very next instruction.',
    'Find an independent instruction later in the code (it neither reads nor writes the load’s register, nor any register in between).',
    'Move it into the gap after the load — only if it keeps every RAW, WAR and WAW order intact.',
    'Recount the stalls with the forwarding rules; say how many cycles you saved.'] }), 'start');
  enrich('forward', 3, B.states({ src: 'S', ref: 'L16 s9–s13', title: 'The same code, three ways', states: [
    ['No forwarding', PIPE(['lw $t1 | IF ID EX MEM WB', 'add $t2,$t1 | . IF * * ID EX MEM WB', 'sub $t4,$t2 | . . . . IF * * ID EX MEM WB']), 'Each consumer waits in ID until its producer’s WB: 2 + 2 = 4 stalls.'],
    ['Forwarding', PIPE(['lw $t1 | IF ID EX MEM WB', 'add $t2,$t1 | . IF ID * EX MEM WB', 'sub $t4,$t2 | . . IF * ID EX MEM WB']), 'Load → add still needs 1 stall. add → sub forwards ALU → ALU with none: the bubble in sub’s row is just add’s stall passing down the pipe.'],
    ['Reordered', PIPE(['lw $t1 | IF ID EX MEM WB', 'other | . IF ID EX MEM WB', 'add $t2,$t1 | . . IF ID EX MEM WB', 'sub $t4,$t2 | . . . IF ID EX MEM WB']), 'An independent instruction moved into the gap: no stalls at all.']],
    caption: 'Stalls for lw → add → sub with no forwarding, with forwarding, and after reordering (an independent instruction fills the load delay).' }));

  }

  // --- zz-4-format ---
  {
const t = topics.find(x => x.id === 'datahaz'), b = t.steps[0].blocks.find(x => x.t === 'p' && /Slide example/.test(x.html));
  if (b) b.html = `<p>Slide example: <code>sub</code> computes −20 for $2, which holds 10 until cycle 5. Four later instructions all read $2:</p><pre class="code nomath">sub $2, $1, $3      # writes $2 in WB, cycle 5
and $12, $2, $5     # reads $2 in ID, cycle 3: gets the old 10
or  $13, $6, $2     # reads in cycle 4: also old
add $14, $2, $2     # cycle 5: write 1st half, read 2nd → -20
sw  $15, 100($2)    # reads in cycle 6: fine</pre><p>"The result is a program that executes quickly but produces a completely incorrect output."</p>`;

  }

  // --- zz-5-labels ---
  {
const box = B.key('How a jump or branch reaches its label', R`<p>Labels exist only in assembly. The assembler turns each one into a number in two passes (P&H §2.12):</p>
<ol><li><b>Pass 1:</b> walk the program giving each instruction the next address, 4 bytes apart (the text segment starts at <code>0x00400000</code>), and record every label’s address in a <b>symbol table</b>.</li>
<li><b>Pass 2:</b> encode each instruction. Where a label is used, look up its address and turn it into the field value in the table below.</li></ol>
<p>A <b>branch</b> stores a <i>distance</i> from PC + 4; a <b>jump</b> stores most of an <i>address</i>. Branch offsets don’t change if the code moves, so the linker only has to patch the j/jal addresses when it resolves labels (L07 s6). If a branch target is more than 2¹⁵ instructions away, the assembler flips the test and branches over a <code>j</code> instead (P&H §2.10).</p>`);
  const tbl = B.tbl({ src: 'T', ref: 'P&H §2.10', head: ['Instruction', 'Field', 'Assembler writes', 'CPU computes the target', 'Reach'], rows: [
    ['<code>beq</code>, <code>bne</code> (and <code>blez</code>, <code>bgtz</code>)', '16-bit immediate', '(label − (PC + 4)) ÷ 4, signed', 'PC + 4 + offset × 4 — <b>PC-relative</b>', '±2¹⁵ instructions'],
    ['<code>j</code>, <code>jal</code>', '26-bit address', 'label ÷ 4, keeping bits 27–2', 'top 4 bits of PC + 4 ∥ address ∥ 00 — <b>pseudo-direct</b>', 'the same 256 MiB block'],
    ['<code>jr</code>, <code>jalr</code>', 'rs (a register)', 'nothing: the address is in a register at run time', 'the full 32-bit value in rs', 'anywhere']],
    caption: 'Three ways a MIPS instruction names where to go next. Word alignment is why both stored numbers are ÷ 4: the bottom two bits of every instruction address are 00.' });
  const wk = B.wk({ src: 'A', ref: 'method from P&H §2.10', title: 'Encode the branch and the jump in a three-instruction loop', given: R`<pre class="code nomath">0x00400000  Loop: beq  $t0, $zero, Exit   # leave when $t0 = 0
0x00400004        addi $t0, $t0, -1
0x00400008        j    Loop
0x0040000C  Exit: …</pre>`, steps: [
    [R`\text{Loop} = \texttt{0x00400000},\ \ \text{Exit} = \texttt{0x0040000C}`, 'Pass 1: count 4 bytes per instruction from the start of the text segment.'],
    [R`\texttt{beq}: (\texttt{0x0040000C} - \texttt{0x00400004}) \div 4 = 2`, 'The beq is at 0x00400000, so PC + 4 = 0x00400004. The offset counts instructions, not bytes.'],
    [R`\text{op } 4,\ \text{rs } 8,\ \text{rt } 0,\ \text{imm } 2 \Rightarrow \texttt{0x11000002}`, 'Fill the I-format fields: rs = $t0 = 8, rt = $zero = 0.'],
    [R`\texttt{j}: \texttt{0x00400000} \div 4 = \texttt{0x100000}`, 'Drop the bottom 00 (and the top 4 bits, which the CPU takes from PC + 4).'],
    [R`\text{op } 2,\ \text{address } \texttt{0x100000} \Rightarrow \texttt{0x08100000}`, 'J-format: 6-bit opcode, then the 26-bit field.'],
    [R`\texttt{0x00400004} + 2 \times 4 = \texttt{0x0040000C}\ \checkmark;\quad 0000 \,\|\, \texttt{0x100000} \,\|\, 00 = \texttt{0x00400000}\ \checkmark`, 'Check by doing what the CPU does: the beq lands on Exit, the j on Loop.']],
    result: 'beq → 0x11000002, j → 0x08100000. Try both presets in the encoder below — it shows the same calculation for any label.' });
  const t = topics.find(x => x.id === 'encoding'), st = t.steps.find(s => /J-format/.test(s.title));
  const at = st.blocks.findIndex(x => x.t === 'tool' && x.name === 'encoder');
  st.blocks.splice(at < 0 ? st.blocks.length : at, 0, box, tbl, wk);
  /* the branches topic points to the same box rather than repeating it */
  const i2 = topics.find(x => x.id === 'isa2'), am = i2.steps.find(s => /Addressing modes/.test(s.title));
  if (am) am.blocks.push(B.tip(R`<b>Labels → numbers.</b> How the assembler turns <code>beq … Exit</code> and <code>j Loop</code> into offsets and addresses, with a worked loop and a live encoder: <a href="#encoding" data-goto="encoding">Instruction formats → J-format and decoding</a>.`));

  }

  // --- zz-9-order ---
  {
const K = { off: 0, ai: 1, wild: 2 }, D = { E: 0, M: 1, H: 2 };
  topics.forEach(t => { const q = t.questions; if (!q) return;
    const idx = new Map(q.map((x, i) => [x, i]));
    q.sort((a, b) => (K[a.kind] - K[b.kind]) || (a.kind === 'off' ? 0 : (D[a.diff] - D[b.diff])) || (idx.get(a) - idx.get(b))); });

  }

  // --- zz-worked-context ---
  {
    const P = h => '<p>' + h + '</p>';
  function W(key, o) {
    const [id, s, bi] = key.split('|'); const t = topics.find(x => x.id === id);
    if (!t) throw new Error('worked-context: no topic ' + id);
    const b = t.steps[s - 1].blocks[bi];
    if (!b || b.t !== 'worked') throw new Error('worked-context: ' + key + ' is not a worked example');
    if (o.fix) { o.fix.forEach(f => { const st = b.steps[f[0]]; if (f[1] != null) st[0] = f[1]; if (f[2] != null) st[1] = f[2]; }); delete o.fix; }
    Object.assign(b, o);
  }

  /* ================= Topic 1 · trends, walls and great ideas ================= */
  W('arch|3|4', { title: 'Moore’s law: how many transistors after 6 years?',
    ctx: R`Moore’s law (L02 s6) says the number of transistors on a chip doubles about every 18–24 months. Growth that doubles at a fixed interval is exponential, so you count how many doublings fit into the time and multiply by 2 for each one.`,
    given: R`A chip has 1 billion transistors today. Assume the transistor count doubles every 24 months. How many transistors will a chip have in 6 years?` });
  W('arch|5|6', { title: 'Power when capacitance, voltage and frequency all change',
    ctx: R`Lecture 2 (s10–s11) gives the dynamic power of a CMOS circuit as \(P = \tfrac12 \times C \times V^2 \times f\) (C = capacitive load, V = supply voltage, f = clock frequency). Exam questions describe each change as a percentage; the method is to turn each into a multiplier and work out new ÷ old, so everything that did not change cancels.`,
    given: R`A new CPU has 85% of the capacitive load of the old CPU, and both its supply voltage and its clock frequency are reduced by 15%. What is \(P_{new}/P_{old}\)? (So \(C_{new} = 0.85\,C_{old}\), \(V_{new} = 0.85\,V_{old}\), \(f_{new} = 0.85\,f_{old}\).)` });
  W('arch|5|7', { title: 'Find the clock needed for a power target (Practice Set 1 Q3 style)',
    ctx: R`The same power equation \(P = \tfrac12 C V^2 f\), now used backwards: the power target and two of the three changes are given and you solve for the frequency multiplier. This is the same shape as Practice Set 1 Q3 (which is in the Practice section below).`,
    given: R`An old CPU runs at 3 GHz. A new technology reduces the capacitive load by 20% and the supply voltage by 25%. You want the new CPU to consume 40% less power than the old one. What clock frequency can the new CPU run at?` });

  /* ================= Topic 2 · von Neumann, ISA vs microarchitecture ================= */
  W('vonneumann|5|3', { title: 'ISA or microarchitecture? Four features, with a reason each',
    ctx: R`The <b>ISA</b> is the contract between software and hardware: the instructions, registers, addressing modes and binary encoding that a programmer or compiler can see. The <b>microarchitecture</b> is how one particular processor implements that contract (pipeline, caches, how the ALU or multiplier is built). Practice Set 2 Q2 and Practice Test Q2 ask you to classify features this way, and a justification earns the marks.`,
    given: R`Classify each feature as a property of the ISA or of the microarchitecture, and give a one-line reason: (a) the number of general-purpose registers; (b) a hardware multiplier that takes 3 cycles; (c) the processor has no subtract instruction; (d) a 32 KB data cache.` });

  /* ================= Topic 3 · performance, units ================= */
  W('perf|1|3', { title: 'Unit conversion: GHz to MHz, ns to ps',
    ctx: R`Performance questions mix prefixes freely, so convert every quantity into a base unit (Hz, seconds) or into the unit asked for before you calculate. The prefixes used in this course: giga G = 10⁹, mega M = 10⁶, kilo k = 10³, milli m = 10⁻³, micro µ = 10⁻⁶, nano n = 10⁻⁹, pico p = 10⁻¹².`,
    given: R`(a) Express 0.5 GHz in MHz. (b) Express 2.5 ns in ps.` });
  W('perf|4|2', { title: 'Which machine is faster, and by how many times?',
    ctx: R`Lecture 3 (s7–s8): performance is the inverse of execution time, \(\text{Perf} = 1/T\). “A is <i>n</i> times faster than B” means \(\text{Perf}_A/\text{Perf}_B = T_B/T_A = n\), so put the slower machine’s time on top.`,
    given: R`Machine A executes a program in 10 s; machine B executes the same program in 15 s. Which machine is faster, and by how many times?` });
  W('perf|5|1', { title: 'Relative change in execution time (10 s → 6 s)',
    ctx: R`Lecture 3 (s9–s10) defines the relative change of a quantity as \(\dfrac{\text{new} - \text{old}}{\text{old}} \times 100\%\), with the <b>old</b> value as the reference. A negative answer is a decrease. The next example takes the same machine and asks about <i>performance</i> instead of time.`,
    given: R`A machine is redesigned so that a program that took 10 s now takes 6 s. Calculate the relative change in execution time.` });
  W('perf|5|2', { title: 'Relative change in performance for the same redesign (10 s → 6 s)',
    ctx: R`Same redesign as the previous example (execution time 10 s → 6 s), but now the question asks for the change in <b>performance</b>. Performance is \(1/T\), so convert both times to performances first. The percentages differ because performance and time are inverses. The lecturer (L03 [22:30]–[24:58]) rounds the answer to “67 or 66%”.`,
    given: R`A machine’s execution time of a program was reduced from 10 s to 6 s. Calculate the relative change in performance, where \(\text{performance} = 1/\text{execution time}\).` });
  W('perf|6|1', { title: 'Clock rate to clock period (4 GHz)',
    ctx: R`Clock period (cycle time) and clock rate are reciprocals: \(T_c = 1/f\). Hertz means “per second”, so 1 GHz = 10⁹ cycles per second, and the period of one cycle is 1 ns. In L03 [29:58] the lecturer stops to make exactly this point about units.`,
    given: R`A processor’s clock rate is 4 GHz. What is its clock period (the time of one cycle)?` });

  /* ================= Topic 4 · CPU time = IC × CPI × Tc ================= */
  W('cpuperf|3|1', { title: 'A (1 ns, CPI 2.0) vs B (2 ns, CPI 1.2): which is faster?',
    ctx: R`Lecture 3 (s17) applies the CPU performance equation \(\text{CPU time} = IC \times CPI \times T_c\) (instruction count × cycles per instruction × clock period). A machine with a faster clock may still lose if its CPI is higher, so you must compare whole execution times. Because both machines run the same program on the same ISA, the instruction count is the same unknown N and cancels.`,
    given: R`Machine A has a clock cycle time of 1 ns and a CPI of 2.0. Machine B has a clock cycle time of 2 ns and a CPI of 1.2. Both run the same program (same ISA, so the same instruction count N). Which machine is faster, and by how much?` });
  W('cpuperf|3|2', { title: 'Equal performance: what CPI must A have?',
    ctx: R`Lecture 3 (s18) turns the previous example around: “equal performance” means equal execution time, so set \(IC \times CPI_A \times T_{c,A} = IC \times CPI_B \times T_{c,B}\) and solve for the unknown. The instruction count again cancels.`,
    given: R`Machine A has a clock cycle time of 1 ns. Machine B has a clock cycle time of 2 ns and a CPI of 1.2. They run the same program. What CPI must machine A have for the two machines to have equal performance?` });
  W('cpuperf|3|3', { title: 'Equal performance: what clock period must A have?',
    ctx: R`Lecture 3 (s19): the same equal-time equation, but now the unknown is A’s clock period instead of its CPI.`,
    given: R`Machine A has a CPI of 2.0; machine B has a CPI of 1.2 and a clock cycle time of 2 ns. They run the same program. What clock cycle time must machine A have for the two machines to have equal performance?` });
  W('cpuperf|3|4', { title: 'Three processors, 200 instructions (Practice Set 1 Q2 style)',
    ctx: R`The same shape as Practice Set 1 Q2 (in the Practice section below): compute execution times from \(T = IC \times CPI \times T_c\) using clock rates, then use a “times slower” statement to back out an unknown CPI. Watch the units: MHz and GHz to Hz, ns to s.`,
    given: R`Three processors execute the same program of 200 instructions. P1 has a 2.5 GHz clock rate and a CPI of 1.5. P2 has a 400 MHz clock rate and a CPI of 2. P3 has a clock cycle time of 1 ns.<br>(a) Calculate the execution time on P1 and P2 and say which is faster.<br>(b) The program runs three times slower on P3 than on P2. Find the CPI of P3.` });
  W('cpuperf|5|3', { title: 'Average CPI from an instruction mix, then CPU time',
    ctx: R`Textbook §1.6. When different instruction classes take different numbers of cycles, the average CPI is the sum over classes of (fraction of instructions × that class’s CPI), and then \(\text{CPU time} = IC \times \overline{CPI} / \text{clock rate}\).`,
    given: R`A program executes \(10^9\) instructions on a 2 GHz processor. Its instruction mix is:` + TBL(['Class', 'Fraction of instructions', 'CPI'], [['ALU', '40%', '1'], ['Load', '30%', '3'], ['Store', '20%', '2'], ['Branch', '10%', '2']]) + R`<p>Find the average CPI and the CPU time.</p>` });
  W('cpuperf|8|2', { title: 'MIPS rating of the processor in the previous example',
    ctx: R`Textbook §1.10. “MIPS” (millions of instructions per second) is a rate: \(\text{MIPS} = \dfrac{\text{IC}}{\text{time} \times 10^6} = \dfrac{\text{clock rate}}{CPI \times 10^6}\). It counts instructions, not how much work each does, which is why it can mislead (see the warning in this topic).`,
    given: R`Using the processor of the previous example (2 GHz clock, average CPI 1.9), calculate its MIPS rating.` });

  /* ================= Topic 5 · Amdahl's law ================= */
  W('amdahl|2|1', { title: 'Deriving Amdahl’s law',
    ctx: R`Lecture 4 (s5, at about [6:43]) states Amdahl’s law; this derives it so you can rebuild it in the exam. The idea: only the improved fraction of the time gets shorter, and the rest is unchanged. f is a fraction of the <b>original execution time</b> (not of instructions).`,
    given: R`A program takes \(T_{old}\) to run. A fraction f of that time (\(0 \le f \le 1\)) is spent in a part that is improved so that it runs s times faster; the remaining \(1-f\) is untouched. Derive the overall speedup.` });
  W('amdahl|3|0', { title: 'Which upgrade? ALU 10% faster vs memory pipeline 10× faster',
    ctx: R`Lecture 4 (s6) uses Amdahl’s law to make a point about the <b>common case</b>: a small improvement to something used almost all the time can beat a huge improvement to something used rarely. “10% faster” is read as s = 1.1 and “10×” as s = 10.`,
    given: R`Your boss asks you to improve performance by either (1) improving the ALU, which is used 95% of the time, by 10%; or (2) improving the memory pipeline, which is used 5% of the time, by 10×. Which do you choose? What if the memory pipeline became infinitely fast?` });
  W('amdahl|6|1', { title: 'Relative-time example (Practice Set 1 Q4 style)',
    ctx: R`The same shape as Practice Set 1 Q4 (in the Practice section below). Percentages here are shares of the <b>total execution time</b>, so first turn them into seconds, change the parts, and add the parts back up.`,
    given: R`A program made of floating-point (FP), load/store (L/S) and integer (INT) instructions takes 800 s on processor P1. The FP instructions take 25% of the total execution time and the L/S instructions take 40%. If the time spent on FP is reduced by 50% and the time for INT is increased by 10%, what is the new total time and by what percentage does it change?` });
  W('amdahl|6|2', { title: 'Amdahl with a routine (Practice Set 1 Q5a style)',
    ctx: R`The same shape as Practice Set 1 Q5a (in the Practice section below): a program is split into routines with known times, one routine’s time is cut by a percentage, and you use Amdahl’s law to find the overall speedup. “Time cut by 25%” means that part’s speedup is \(s = 1/0.75\).`,
    given: R`A program takes 150 s in total; routine D takes 60 s of it. A micro-architectural change reduces the execution time of routine D by 25%. Using Amdahl’s law, find the overall speedup and the new total execution time.` });

  /* ================= Topic 6 · MIPS I ================= */
  W('isa1|2|1', { title: 'CISC vs RISC: adding two numbers held in memory',
    ctx: R`Lecture 5 (s6) contrasts the two instruction-set styles with one task. A <b>CISC</b> instruction can operate directly on memory operands and does a lot of work. A <b>RISC</b> machine only computes on registers, so memory has to be accessed with separate load and store instructions. The slide labels its two memory locations 2:3 and 5:2.`,
    given: R`Add the number stored in memory location 2:3 to the number stored in memory location 5:2 and put the result back in location 2:3. Show how a CISC instruction set and a RISC instruction set would each do it.` });
  W('isa1|4|3', { title: 'Compile f = (g + h) − (i + j)',
    ctx: R`Lecture 5 (s12). MIPS arithmetic instructions have exactly three register operands (<code>op dest, src1, src2</code>), so a longer expression is broken into steps, using temporary registers (<code>$t0–$t9</code>) for the intermediate results. Variables live in the saved registers <code>$s0–$s7</code>.`,
    given: R`Compile this C statement into MIPS assembly: <code>f = (g + h) - (i + j);</code> The variables f, g, h, i and j are held in registers <code>$s0</code>, <code>$s1</code>, <code>$s2</code>, <code>$s3</code> and <code>$s4</code>. Use <code>$t0</code> and <code>$t1</code> as temporaries.` });
  W('isa1|5|2', { title: 'Byte order: storing 0x12345678 at address 100',
    ctx: R`Memory is byte-addressed but MIPS loads and stores 4-byte words, so you need to know which byte of a word goes at which address. MIPS is <b>big-endian</b> (most significant byte at the lowest address); other machines such as x86 are little-endian. Lecture 5 (s17) shows this.`,
    given: R`The 32-bit word 0x12345678 is stored in a byte-addressed memory starting at address 100. Show which byte is held at each of the addresses 100–103 for a big-endian machine (MIPS) and for a little-endian machine. Is the word aligned?` });
  W('isa1|6|2', { title: 'Compile g = h + A[8] (array read)',
    ctx: R`Lecture 5 (s18). Arithmetic works only on registers, so an array element must first be loaded with <code>lw</code>. A memory operand is written <code>offset(base register)</code>: the address is the base register’s contents plus the byte offset. Words are 4 bytes, so element i is at offset 4 × i.`,
    given: R`Compile <code>g = h + A[8];</code> into MIPS. The variable g is in <code>$s1</code>, h is in <code>$s2</code>, and the base address of array A (the address of A[0]) is in <code>$s3</code>. Each array element is a 4-byte word.`,
    result: 'Two instructions: one load to fetch A[8], one add. The offset is 32 bytes, not 8.' });
  W('isa1|6|3', { title: 'Compile A[12] = h + A[8] (array read, then write)',
    ctx: R`Lecture 5 (s19), the second memory-operand example: now the result is stored back into an array. The pattern for every such statement is <b>load → operate on registers → store</b>, and every index is multiplied by 4 to get a byte offset.`,
    given: R`Compile <code>A[12] = h + A[8];</code> into MIPS. The variable h is in <code>$s2</code> and the base address of array A is in <code>$s3</code>. Each element is a 4-byte word.` });
  W('isa1|6|6', { title: 'Compile B[3] = A[5] − g + B[1] (Practice Test Q3 style)',
    ctx: R`The same method as Practice Test Q3 (in the Practice section below). Two arrays means two base registers; each index is turned into a byte offset by multiplying by 4. Reusing a temporary register once its value is no longer needed keeps the count of temporaries small.`,
    given: R`Compile <code>B[3] = A[5] - g + B[1];</code> into MIPS. The variable g is in <code>$s0</code>, the base address of array A is in <code>$s1</code> and the base address of array B is in <code>$s2</code>. Each element is a 4-byte word. Use as few temporary registers as possible.` });

  /* ================= Topic 7 · instruction encoding ================= */
  W('encoding|3|3', { title: 'Encode add $t0, $s1, $s2 as a 32-bit machine word',
    ctx: R`Lecture 6 (s5–s6). Every MIPS instruction is one 32-bit word. R-format instructions split it into six fields: op (6 bits), rs (5), rt (5), rd (5), shamt (5), funct (6). For <code>add rd, rs, rt</code> the opcode is 0 and the funct field selects the operation. Register numbers come from the register table in this topic.`,
    given: R`Encode <code>add $t0, $s1, $s2</code> in binary and in hex.` + P(R`Facts you need: register numbers <code>$t0 = 8</code>, <code>$s1 = 17</code>, <code>$s2 = 18</code>; R-format layout op | rs | rt | rd | shamt | funct = 6 | 5 | 5 | 5 | 5 | 6 bits; op = 0 for R-format; funct = 32 (100000₂) for add; shamt = 0 when there is no shift.`) });
  W('encoding|4|3', { title: 'Encode addi $1, $2, 100 as a 32-bit machine word',
    ctx: R`Lecture 6 (s9). Instructions with a constant use the <b>I-format</b>: op (6 bits), rs (5), rt (5), immediate (16). Careful: for <code>addi</code>, rs is the <i>source</i> register and rt is the <i>destination</i>, the opposite order from how they appear in the assembly text. The opcode comes from the MIPS reference card (the “green card” on Canvas).`,
    given: R`Encode <code>addi $1, $2, 100</code> in binary and in hex.` + P(R`Facts you need: I-format layout op | rs | rt | immediate = 6 | 5 | 5 | 16 bits; the opcode of <code>addi</code> is 8 (001000₂); here the destination is <code>$1</code> and the source is <code>$2</code>.`) });
  W('encoding|5|2', { title: 'Decode the machine word 0x8D2A0010 back into assembly',
    ctx: R`Decoding is encoding in reverse: write the hex as 32 bits, read the first 6 bits as the opcode to learn the format, then slice the remaining fields. Opcode values you can look up on the MIPS reference card: 0 = R-format, 8 = addi, 35 = lw, 43 = sw, 4 = beq, 2 = j. Registers <code>$t0–$t7</code> are numbers 8–15.`,
    given: R`The 32-bit value <code>0x8D2A0010</code> is a MIPS instruction. Which instruction is it?` });
  W('encoding|5|5', { title: 'Encode a beq and a j in a three-instruction loop',
    ctx: R`P&H §2.10. A <b>branch</b> (I-format) stores a distance in <i>instructions</i> from PC + 4, because it only reaches nearby code. A <b>jump</b> (J-format) stores the target address divided by 4 in a 26-bit field. Both divide by 4 because every instruction address is a multiple of 4. The assembler resolves labels in two passes: first find each label’s address, then fill in the fields. Opcodes: beq = 4, j = 2; <code>$t0</code> = register 8, <code>$zero</code> = 0.`,
    given: R`The following loop is loaded starting at address 0x00400000. Encode the <code>beq</code> and the <code>j</code> as 32-bit words.` + CODE(['0x00400000 Loop: beq  $t0, $zero, Exit   # leave when $t0 = 0', '0x00400004       addi $t0, $t0, -1', '0x00400008       j    Loop', '0x0040000C Exit:  ...']) });

  /* ================= Topic 8 · MIPS II ================= */
  W('isa2|2|0', { title: 'Bitwise AND as a mask: and $t0, $t1, $t2',
    ctx: R`Lecture 6 (s14). Logical instructions work on every bit position independently. <code>and</code> gives 1 only where both inputs are 1, so ANDing with a pattern keeps the bits where that pattern has 1s and clears the rest (a “mask”).`,
    given: R`The registers hold <code>$t2 = 0000 0000 0000 0000 0000 1101 1100 0000</code> and <code>$t1 = 0000 0000 0000 0000 0011 1100 0000 0000</code>. What is <code>$t0</code> after <code>and $t0, $t1, $t2</code>?` });
  W('isa2|2|1', { title: 'Bitwise OR to include bits: or $t0, $t1, $t2',
    ctx: R`Lecture 6 (s15), a continuation of the AND example with the same two register values. <code>or</code> gives 1 where at least one input has a 1, so it sets bits to 1 without disturbing the rest.`,
    given: R`The registers hold <code>$t2 = 0000 0000 0000 0000 0000 1101 1100 0000</code> and <code>$t1 = 0000 0000 0000 0000 0011 1100 0000 0000</code> (the same values as the AND example). What is <code>$t0</code> after <code>or $t0, $t1, $t2</code>?` });
  W('isa2|3|2', { title: 'Compile if (i == j) f = g + h; else f = g − h;',
    ctx: R`Lecture 6 (s17). MIPS has no if statement; you build it from conditional branches (<code>beq rs, rt, L</code>: go to L if equal; <code>bne</code>: go to L if not equal) and an unconditional jump (<code>j L</code>). The usual trick is to branch on the <b>opposite</b> condition to skip the “then” part.`,
    given: R`Compile this C code into MIPS: <code>if (i == j) f = g + h; else f = g - h;</code> The variables f, g, h, i and j are in <code>$s0</code>, <code>$s1</code>, <code>$s2</code>, <code>$s3</code> and <code>$s4</code>.`,
    result: 'Five lines: bne, then-part, j, labelled else-part, labelled exit. The j Exit stops the then-path falling into the else code.' });
  W('isa2|4|3', { title: 'Trace Practice Set 1 Q7 with $a0 = 6 and $a1 = 7',
    ctx: R`Practice Set 1 Q7 gives a short MIPS loop and asks what it computes. Tracing it with real numbers is the quickest way to see the function: it adds <code>$a0</code> to a running total once for every unit of <code>$a1</code>, then adds 100.`,
    given: R`Trace this code for <code>$a0 = 6</code> and <code>$a1 = 7</code> and give the final <code>$v0</code>:` + CODE(['      add   $t0, $zero, $zero', 'loop: beq   $a1, $zero, finish', '      add   $t0, $t0, $a0', '      addiu $a1, $a1, -1', '      j     loop', 'finish: addi $t0, $t0, 100', '      add   $v0, $t0, $zero']) });
  W('isa2|5|1', { title: 'Compile a leaf procedure that uses a saved register',
    ctx: R`Lecture 6 (s19–s20). MIPS calling convention: arguments arrive in <code>$a0–$a3</code>, the result goes back in <code>$v0</code>, and the return address is in <code>$ra</code> (call with <code>jal</code>, return with <code>jr $ra</code>). A <b>leaf</b> procedure calls no other procedure. The callee must preserve any saved register <code>$s0–$s7</code> it uses, by saving it on the stack first and restoring it before returning; temporaries <code>$t0–$t9</code> need no saving.`,
    given: R`Compile this C procedure into MIPS. The arguments g, h, i, j are in <code>$a0</code>–<code>$a3</code>, the local variable f is kept in <code>$s0</code>, and the result is returned in <code>$v0</code>.` + CODE(['int leaf_example (int g, h, i, j)', '{ int f;', '  f = (g + h) - (i + j);', '  return f;', '}']),
    result: 'Nine instructions: 2 to save $s0, 4 for the calculation and the copy into $v0, 2 to restore $s0, and 1 to return. The save/restore pair exists only because f was kept in a saved register.' });

  /* ================= Topic 9 · translation ================= */
  W('translate|5|1', { title: 'Compile the body of the swap procedure',
    ctx: R`Lecture 7 (s9–s10): <code>swap</code> is the leaf procedure inside the C bubble-sort example (P&H §2.13). It exchanges two neighbouring array elements. Array indexing turns into “multiply the index by 4, add the base, then use lw/sw with the address”.`,
    given: R`Compile this C procedure into MIPS. The array base address v is in <code>$a0</code>, k is in <code>$a1</code>, and temp is in <code>$t0</code>.` + CODE(['void swap(int v[], int k)', '{ int temp;', '  temp = v[k];', '  v[k] = v[k+1];', '  v[k+1] = temp;', '}']) });

  /* ================= Topic 10 · binary arithmetic ================= */
  W('binary|1|1', { title: 'One bit pattern, two meanings: 11111111',
    ctx: R`Lecture 8 [5:19]–[7:50]. A pattern of bits has no meaning of its own. Interpreted as <b>unsigned</b>, every bit has a positive weight \(2^i\). Interpreted as <b>two’s complement</b>, the most significant bit has the negative weight \(-2^{n-1}\) and the others are positive.`,
    given: R`Interpret the 8-bit pattern <code>1111 1111</code> (a) as an unsigned integer and (b) as a signed two’s complement integer.` });
  W('binary|3|2', { title: 'Value of the 32-bit pattern 1111…1100 in two’s complement',
    ctx: R`Lecture 8 (s6). The same weighted-sum rule as the 8-bit case, for 32 bits: the top bit is worth \(-2^{31}\), and the rest are worth \(+2^{30}\) down to \(+2^0\). A pattern that is all 1s except for the last few bits is a small negative number.`,
    given: R`What decimal value does the 32-bit two’s complement pattern <code>1111 1111 1111 1111 1111 1111 1111 1100</code> represent?`,
    result: '−4. A quicker check: invert the bits (…0011) and add 1 → 0100 = 4, so the number is −4.' });
  W('binary|4|0', { title: 'Add 0011 and 1010 (4-bit), read as unsigned and as signed',
    ctx: R`Lecture 8 (s9). Binary addition is done column by column from the right with a carry, exactly like decimal. The point of this example is that the adder circuit is the same whether the operands are unsigned or two’s complement; only your interpretation of the bit pattern changes.`,
    given: R`Add the 4-bit patterns <code>0011</code> and <code>1010</code>. Check the answer by reading both operands (a) as unsigned numbers and (b) as two’s complement numbers.` });
  W('binary|4|1', { title: 'Subtraction as addition: 3 − 2 in 4-bit two’s complement',
    ctx: R`Lecture 8 (s10). Hardware subtracts by adding the negative: \(A - B = A + (-B)\), and the two’s complement negation of B is “invert all bits, then add 1”. That is why one adder circuit does both add and sub.`,
    given: R`Compute 3 − 2 using 4-bit two’s complement arithmetic, with a single addition.` });
  W('binary|7|0', { title: 'Add two 32-bit registers (Practice Set 2 Q4a) and spot the overflow',
    ctx: R`Practice Set 2 Q4a. Hex addition is column addition in base 16 (digits above 9 are A = 10 … F = 15, and a column total of 16 or more carries 1). <b>Signed overflow</b> (lecture 8 s11) is detected from the signs: adding two numbers of the same sign and getting a result of the opposite sign means the true answer did not fit. MIPS <code>add</code> traps on overflow; <code>addu</code> ignores it.`,
    given: R`The 32-bit registers <code>$s0</code> and <code>$s1</code> hold <code>0x82A00000</code> and <code>0xDA600000</code> respectively. What is the value of <code>$t0</code> after <code>add $t0, $s0, $s1</code>? Does signed overflow occur?` });

  /* ================= Topic 11 · floating point ================= */
  W('float|4|1', { title: 'Decode an IEEE 754 single-precision word',
    ctx: R`P&H §3.5. IEEE 754 single precision uses 32 bits: 1 sign bit S, 8 exponent bits (stored with a bias of 127), 23 fraction bits. The value is \((-1)^S \times (1 + \text{fraction}) \times 2^{\text{exponent} - 127}\); the leading 1 of the significand is implicit (“hidden”).`,
    given: R`What decimal number does the single-precision pattern <code>1 01111110 10000000000000000000000</code> (hex <code>0xBF400000</code>) represent? (Fields: sign | exponent | fraction.)` });
  W('float|5|1', { title: 'Encode 5.75 in IEEE 754 single precision',
    ctx: R`P&H §3.5, the reverse direction: write the number in binary, normalise it to \(1.xxx \times 2^e\), add the bias 127 to e for the exponent field, drop the leading 1 and keep the bits after the point as the fraction, and choose the sign bit.`,
    given: R`Write 5.75 as a 32-bit IEEE 754 single-precision number, in binary fields and in hex.` });

  /* ================= Topic 12 · microarchitecture basics ================= */
  W('uarch|6|2', { title: 'The five steps of a load: lw R5, X(R7)',
    ctx: R`Lecture 9 (s22–s27). The processor executes every instruction in up to five steps: <b>IF</b> instruction fetch, <b>ID</b> decode and register read, <b>EX</b> execute (ALU), <b>MEM</b> data-memory access, <b>WB</b> write-back to a register. Which steps do real work depends on the instruction. A load is the instruction that uses all five.`,
    given: R`Describe what happens in each of the five steps (IF, ID, EX, MEM, WB) when the processor executes the load <code>lw R5, X(R7)</code>, meaning R5 ← Memory[X + [R7]]. R7 is the base register, X is the immediate offset taken from the instruction word, and R5 is the destination register.` });

  /* ================= Topic 13 · single-cycle ================= */
  W('single|5|3', { title: 'How long does lw take? The critical path of the single-cycle machine',
    ctx: R`Lecture 10 (s16 and s19). In a single-cycle machine one clock cycle must be long enough for the <b>slowest</b> instruction to finish all of its steps, because every instruction gets the same cycle. An instruction’s time is the sum of the delays of the hardware units it uses, in order. Units that an instruction does not use contribute 0.`,
    given: R`In a single-cycle MIPS machine the instruction memory and data memory each take 200 ps, the ALU and adders take 100 ps, the register file takes 50 ps (read or write), and other logic takes 0 ps. Find the time taken by <code>lw</code>, which uses instruction memory, register read, ALU, data memory and register write.` });
  W('single|5|7', { title: 'Single-cycle clock and total time with a multiplier (Practice Test Q6 style)',
    ctx: R`The same shape as Practice Test Q6 (in the Practice section below). Work out each instruction’s time by adding the units it uses in IF, ID, EX, MEM and WB (0 for steps it skips), take the <b>maximum</b> as the clock cycle, and then \(\text{time} = \text{instructions} \times CPI \times \text{clock}\) with CPI = 1.`,
    given: R`A single-cycle processor is built from: instruction memory 100 ps; data memory 150 ps; multiplier (in the ALU) 300 ps; adder for address calculation 80 ps; adder for add/sub 120 ps; register file (read or write) 40 ps; other logic 0 ps. It runs this sequence: <code>lw, add, mult, sub, sw, lw</code>. Find the clock cycle time and the total execution time of the six instructions.` });

  /* ================= Topic 14 · multi-cycle ================= */
  W('multi|5|2', { title: 'Single-cycle vs multi-cycle clock and average time',
    ctx: R`Lecture 12 (s16), repeated in the review lecture. A <b>single-cycle</b> machine sets its one clock to the longest <i>instruction</i>. A <b>multi-cycle</b> machine sets its clock to the longest <i>step</i> and lets each instruction use only the steps (cycles) it needs. To compare them for a program, weight each instruction’s time by how often it occurs.`,
    given: R`Instruction classes, their step latencies (ps) and their frequency in the program:` + TBL(['Class', 'IF', 'ID', 'EX', 'MEM', 'WB', 'Total', 'Mix'], [['Load', '200', '100', '200', '200', '100', '800', '30%'], ['Store', '200', '100', '200', '200', 'X', '700', '30%'], ['R-format', '200', '100', '200', 'X', '100', '600', '20%'], ['Branch', '200', '100', '200', 'X', 'X', '500', '20%']]) + R`<p>(X = the step is not used.) Find the clock cycle of the single-cycle machine, the clock cycle of the multi-cycle machine (a load takes 5 cycles, a store 4, an R-format 4, a branch 3), and the average time per instruction on the multi-cycle machine. Which is faster for this program?</p>` });

  /* ================= Topic 15 · pipelining ================= */
  W('pipe|1|1', { title: 'Four independent ADDs: multi-cycle vs 4-stage pipeline',
    ctx: R`Lecture 11 (s13). Pipelining overlaps the steps of successive instructions, like an assembly line. “Independent” means no instruction uses a result produced by another, so nothing has to wait. The formula for N instructions on a k-stage pipeline is \(k + (N-1)\) cycles.`,
    given: R`Four independent ADD instructions each need four one-cycle steps: Fetch, Decode, Execute, Write (F, D, E, W). How many clock cycles do they take (a) on a multi-cycle machine that finishes each instruction before starting the next, and (b) on a 4-stage pipeline?` });
  W('pipe|4|2', { title: 'Throughput and latency: non-pipelined vs pipelined loads',
    ctx: R`Lecture 12 (s18). Pipelining improves <b>throughput</b> (instructions completed per unit time) but not the latency of a single instruction. The pipelined clock must fit the slowest stage, so every stage takes a full 200 ps even if its own work is shorter.`,
    given: R`The five stages have these latencies: IF 200 ps, ID 100 ps, EX 200 ps, MEM 200 ps, WB 100 ps. A load uses all five (800 ps in total). Compare a non-pipelined (single-cycle, 800 ps clock) machine with a pipelined machine (clock = slowest stage) running a stream of <code>lw</code> instructions: compare their throughput, and the latency of one load in each.` });

  /* ================= Topic 16 · structural hazards, CPI with stalls ================= */
  W('hazards|2|3', { title: 'CPI of a program with stall cycles',
    ctx: R`Lecture 14 [16:41]–[17:53]. An ideal pipeline completes one instruction per cycle (CPI = 1). Every stall cycle adds a cycle with no instruction completing, so \(CPI = \dfrac{N + \text{stall cycles}}{N}\) for N instructions.`,
    given: R`A program of 100 instructions runs on a pipeline whose ideal CPI is 1, but it suffers 20 stall cycles in total. What is its average CPI?` });
  W('hazards|6|2', { title: 'Which pipeline is faster? Different stall rates and clocks (Practice Test Q5 style)',
    ctx: R`The same shape as Practice Test Q5 (in the Practice section below). With stalls, \(CPI = 1 + \text{(fraction of stalling instructions)} \times \text{(stall cycles each)}\). The processors can have different clock rates, so compare execution times \(IC \times CPI \times T_c\), not CPIs.`,
    given: R`The same program runs on two pipelined processors, with an ideal CPI of 1. On P1, 20% of the instructions suffer a 3-cycle stall, and the clock is 1 GHz. On P2, 30% of the instructions suffer a 2-cycle stall, and the clock is 1.25 GHz. Which processor runs the program faster, and by how much?` });

  /* ================= Topic 17 · data hazards ================= */
  W('datahaz|4|2', {
    title: 'Building a dependency table (Practice Set 3 Q2 sequence)',
    ctx: R`Practice Set 3 Q2 and Practice Test Q4(i) ask for a table of all data dependencies in a short instruction sequence. Definitions (j is later than i): <b>RAW</b> = j reads a register that i writes; <b>WAR</b> = j writes a register that i reads; <b>WAW</b> = j and i both write the same register. Instruction format is <code>op destination, source1, source2</code>, so the first register is written and the other two are read.`,
    given: R`List all RAW, WAR and WAW dependencies (instruction pair and register) in this sequence:` + CODE(['I1: Mult R1, R2, R3', 'I2: Div  R3, R1, R5', 'I3: Add  R2, R3, R4', 'I4: Div  R4, R7, R6', 'I5: Add  R4, R8, R5']),
    steps: [
      [R`I1 writes R1, reads R2, R3 · I2 writes R3, reads R1, R5 · I3 writes R2, reads R3, R4 · I4 writes R4, reads R7, R6 · I5 writes R4, reads R8, R5`, 'First write down, for every instruction, the register it WRITES (first operand) and the registers it READS (the other two). (For MIPS: lw rt, off(rs) writes rt and reads rs; sw rt, off(rs) writes nothing and reads rt and rs; beq reads both.)'],
      [R`RAW: (I1, I2, R1) and (I2, I3, R3)`, 'For each register an instruction reads, find the most recent earlier instruction that wrote it. I2 reads R1 (I1 wrote it); I3 reads R3 (I2 wrote it). Nobody earlier writes R2, R4, R5, R6, R7, R8 before they are read, so there is no other RAW.'],
      [R`WAR: (I1, I2, R3), (I1, I3, R2), (I3, I4, R4), (I3, I5, R4)`, 'For each register an instruction writes, list the earlier instructions that read it. I2 writes R3, which I1 read. I3 writes R2, which I1 read. I4 and I5 write R4, which I3 read.'],
      [R`WAW: (I4, I5, R4)`, 'Two instructions write the same register: I4 and I5 both write R4.'],
      ['Fill the table: one row per dependency, with columns Instruction X, Instruction Y, register, type', 'Always put the earlier instruction first. In an in-order 5-stage pipeline only the RAW entries can cause stalls; WAR and WAW (name dependences) matter once instructions can be reordered or finish out of order.']],
    result: 'RAW 2, WAR 4, WAW 1: seven dependencies in total.' });
  W('datahaz|5|1', { title: 'CPI when every 5th instruction stalls for 2 cycles',
    ctx: R`Lecture 15 (s14). Data hazards that cannot be avoided make the pipeline stall; each stall cycle raises the average CPI above the ideal 1. Extra CPI = (fraction of instructions that stall) × (stall cycles each).`,
    given: R`An ideal pipeline has CPI = 1. If every 5th instruction causes a 2-cycle stall because of a data hazard, what is the CPI?` });
  W('datahaz|6|2', { title: 'Counting stalls with the course convention (no forwarding)',
    ctx: R`Lecture 16 [14:52]–[16:09], using the stall-penalty convention of this course (review slide R1 s28): with no forwarding, if the dependent instruction comes <b>d</b> instructions after its producer, the stall penalty is 3 − d cycles (so 2 if it is immediately after, 1 if one instruction sits between them, 0 if two or more). Only RAW dependences matter in this in-order pipeline.`,
    given: R`How many stall cycles does the following sequence cause in the 5-stage pipeline without forwarding?` + CODE(['Add R2, R3, #100', 'Or  R4, R5, R6', 'Sub R9, R2, #30']) });

  /* ================= Topic 18 · forwarding & reordering ================= */
  W('forward|1|0', { title: 'Hazard-free P1 vs faster-clocked P2 with stalls',
    ctx: R`Lecture 16 (s7) and the review slides (R1 s25–s26): is a faster clock worth it if it comes with data-hazard stalls? Use \(T = IC \times CPI \times T_c\) for both machines. A clock rate 1.05× higher means a clock period divided by 1.05.`,
    given: R`Processor P1 has no data hazards (CPI = 1). Processor P2 suffers data hazards: 40% of its instructions incur a 1-cycle stall, but its clock rate is 1.05 times higher than P1’s. They run the same program. Which processor is faster, and by how much?` });
  W('forward|5|3', { title: 'Remove load-use stalls by forwarding and reordering (Practice Set 3 Q4 style)',
    ctx: R`The same method as Practice Set 3 Q4 and Practice Test Q4(iii) (in the Practice section below). Forwarding sends a result straight from the pipeline register where it exists to the stage that needs it; but a load’s data only exists after MEM, so a load followed immediately by its user still stalls one cycle. The compiler (or you) can fill that slot by moving an <b>independent</b> instruction in between, without changing the result.`,
    given: R`In a single-issue, in-order 5-stage MIPS pipeline, how many data-hazard stalls does this sequence cause (a) with no forwarding and (b) with forwarding? Reorder it to remove all remaining stalls.` + CODE(['lw   $t2, 8($a0)', 'sub  $t3, $t2, $a1', 'or   $t4, $a2, $a3', 'addi $t5, $a1, 4']) });

  /* ================= Topic 19 · control hazards ================= */
  W('control|2|1', { title: 'CPI with a one-cycle branch stall',
    ctx: R`P&H §4.8. A branch’s outcome is not known when the next instruction must be fetched; the simplest policy is to stall every branch, which costs a fixed number of cycles per branch. Extra CPI = (branch frequency) × (cycles lost per branch).`,
    given: R`Branches make up 17% of the instructions in a program. Each branch stalls the pipeline for 1 cycle. The ideal CPI is 1. What is the CPI?` });
  W('control|4|1', { title: '1-bit vs 2-bit predictor on a loop branch',
    ctx: R`A <b>1-bit</b> predictor guesses whatever the branch did last time. A <b>2-bit</b> predictor has four states (strongly/weakly taken, weakly/strongly not taken) and must be wrong twice in a row to flip its guess. A loop branch is the typical case: taken every iteration except the exit.`,
    given: R`A loop branch is taken 9 times and then not taken once (a 10-iteration loop), and the whole loop is then run again, many times over. Compare how many mispredictions per run of the loop a 1-bit predictor and a 2-bit predictor make in steady state, and their accuracy.` });

  /* ================= Topic 20 · ILP ================= */
  W('ilp|2|2', { title: 'Unroll the array loop four times on a 2-issue machine',
    ctx: R`P&H §4.10. A static 2-issue machine issues one ALU/branch instruction and one load/store each cycle, and the compiler must find independent instructions to fill both slots. <b>Loop unrolling</b> copies the loop body several times so there are more independent instructions to schedule; <b>register renaming</b> (using different temporaries for each copy) removes false dependences between the copies.`,
    given: R`This loop adds the scalar in <code>$s2</code> to every word of an array (pointer in <code>$s1</code>, walking backwards). Scheduled for the 2-issue machine it takes 4 cycles per iteration for 5 instructions (IPC = 1.25, against a peak of 2):` + CODE(['Loop: lw   $t0, 0($s1)       # load array element', '      addu $t0, $t0, $s2     # add the scalar', '      sw   $t0, 0($s1)       # store the result', '      addi $s1, $s1, -4      # move the pointer', '      bne  $s1, $zero, Loop  # loop until done']) + R`<p>Unroll the loop four times, rename registers, schedule it on the 2-issue machine, and find the new IPC.</p>` });

  /* ================= Topic 21 · caches ================= */
  W('cache|2|1', { title: 'Which line does byte address 1200 use? (direct-mapped)',
    ctx: R`P&H §5.3. In a <b>direct-mapped</b> cache each memory block can live in exactly one line: <code>line = (block address) mod (number of lines)</code>, where the block address is the byte address divided by the block size (rounded down).`,
    given: R`A direct-mapped cache has 64 lines and 16-byte blocks. Which cache line holds the byte at address 1200?` });
  W('cache|3|2', { title: 'Total bits in a direct-mapped cache',
    ctx: R`P&H §5.3. A cache stores more than its data: each line also holds a <b>tag</b> (the part of the address that identifies which block is stored) and a <b>valid bit</b>. A 32-bit address splits into tag | index | block offset, with offset = log₂(block size in bytes) and index = log₂(number of lines).`,
    given: R`How many bits in total are needed for a direct-mapped cache with 16 KiB of data, 4-word blocks and 32-bit addresses? (Count data, tags and valid bits.)`,
    fix: [[1, null, R`offset = log₂(16 B) = 4 bits; index = log₂(1024 blocks) = 10 bits; tag = the remaining 32 − 10 − 4 = 18 bits.`]] });

  /* ================= Topic 22 · cache performance ================= */
  W('cacheperf|2|1', { title: 'CPI including cache-miss stalls',
    ctx: R`P&H §5.4. Memory stalls add to the base CPI: \(CPI = \text{base CPI} + \text{memory-stall cycles per instruction}\). Every instruction is fetched (so the instruction-miss rate applies to every instruction), but only loads and stores access data memory.`,
    given: R`A processor has a base CPI of 2 (perfect cache). The instruction-cache miss rate is 2% and the data-cache miss rate is 4%. The miss penalty is 100 cycles. Loads and stores are 36% of all instructions. What is the CPI including cache misses, and how much faster would the machine be with a perfect cache?` });
  W('cacheperf|4|0', { title: 'Adding a second-level (L2) cache',
    ctx: R`P&H §5.4. With two levels, an L1 miss first tries the L2 (a short penalty), and only the fraction that also misses in L2 (the <b>global</b> miss rate) pays the full trip to main memory. Convert times to cycles with \(\text{cycles} = \text{time} \times \text{clock rate}\).`,
    given: R`A 4 GHz processor has a base CPI of 1 (when all accesses hit in the L1 cache). Main memory access takes 100 ns, and 2% of instructions miss in L1. Adding an L2 cache with a 5 ns access time reduces the fraction of instructions that go all the way to main memory to 0.5% (the global miss rate). What is the CPI without the L2, with the L2, and the speedup?` });

  /* ================= Topic 23 · virtual memory ================= */
  W('vm|2|2', { title: 'Size of a single-level page table',
    ctx: R`P&H §5.7. Virtual memory splits the virtual address into a virtual page number and a page offset. A simple page table has one entry per virtual page, so its size is (number of virtual pages) × (bytes per entry).`,
    given: R`A system has 32-bit virtual addresses and 4 KiB pages; each page-table entry is 4 bytes. How big is the page table (one per process)?` });

  }

  // --- zz-10-single-control ---
  {
const t = topics.find(x => x.id === 'single'); if (!t) return;
  const ci = t.steps.findIndex(s => /^Control signals/.test(s.title)); if (ci < 0) return;
  const REF = 'L10 s9–s11; L10 [33:41]–[38:17]; P&H §4.4';
  const muxStep = { title: 'The multiplexers: what each one picks, for which instructions, and when', ref: REF, blocks: [
    B.x(R`<p>A multiplexer (Topic 12: \(Y = S\ ?\ I_1 : I_0\)) sits wherever <b>two kinds of instruction need a different source for the same input</b>. The datapath is shared by every instruction, so each place where they disagree gets a mux, and a 1-bit <b>select</b> line decides which input goes through. There are three muxes in the L10 figure (RegDst, ALUSrc, MemtoReg), a fourth for branches (PCSrc) and, in the full textbook datapath, a fifth for jumps.</p>`),
    B.tbl({ src: 'T', ref: 'P&H §4.4, Figs 4.17 and 4.24', head: ['Mux', 'Where it sits', 'Select', 'Input 0', 'Input 1'], rows: [
      ['<b>RegDst</b>', 'in front of the register file’s <i>write register</i> input', 'RegDst', 'rt — bits [20–16]', 'rd — bits [15–11]'],
      ['<b>ALUSrc</b>', 'in front of the ALU’s second input', 'ALUSrc', 'read data 2 (register rt)', 'sign-extended immediate [15–0]'],
      ['<b>MemtoReg</b>', 'in front of the register file’s <i>write data</i> input', 'MemtoReg', 'ALU result', 'data read from memory'],
      ['<b>PCSrc</b>', 'choosing the next PC', 'Branch AND Zero', 'PC + 4', 'branch target (PC + 4 + offset × 4)'],
      ['<b>Jump</b>', 'after PCSrc, right before the PC', 'Jump', 'PCSrc mux output', 'jump address (PC+4[31–28] ∥ target ∥ 00)']] }),
    B.tbl({ src: 'T', ref: 'L10 [33:41]–[38:17] (R-type, lw, sw); P&H §4.4 (beq, j); addi follows the same logic', cls: 'mono', head: ['Mux', 'R-type', 'addi', 'lw', 'sw', 'beq', 'j'], rows: [
      ['RegDst', '1 (rd)', '0 (rt)', '0 (rt)', 'X', 'X', 'X'],
      ['ALUSrc', '0 (reg)', '1 (imm)', '1 (imm)', '1 (imm)', '0 (reg)', 'X'],
      ['MemtoReg', '0 (ALU)', '0 (ALU)', '1 (mem)', 'X', 'X', 'X'],
      ['PCSrc', '0', '0', '0', '0', 'Zero', '0'],
      ['Jump', '0', '0', '0', '0', '0', '1']], caption: 'X = don’t care. “Zero” = 1 when the two registers are equal (branch taken), 0 when not.' }),
    B.x(R`<p><b>Read the pattern instead of memorising the table.</b> Ask one question per mux:</p><ul>
      <li><b>RegDst — which field names the destination?</b> R-format uses rt as a second <i>source</i>, so its destination is rd → 1. I-format (lw, addi) has no rd field, so the destination is rt → 0.</li>
      <li><b>ALUSrc — is the ALU’s second operand a constant from the instruction?</b> Yes for lw and sw (base + offset) and addi (register + constant) → 1. No for R-type (two registers) and beq (it compares two registers by subtracting) → 0.</li>
      <li><b>MemtoReg — does the value written back come from memory?</b> Only for lw → 1. R-type and addi write the ALU result → 0.</li>
      <li><b>PCSrc — is this a taken branch?</b> Control only says “this is a branch” (Branch = 1). An AND gate combines it with the ALU’s Zero flag, so PCSrc = 1 only for a beq whose registers are equal.</li>
      <li><b>Jump — is this a j?</b> Only then does the PC take the jump address.</li></ul>
      <p><b>When is a mux X?</b> When its output is thrown away. RegDst and MemtoReg only feed the register-file write, so they are X whenever RegWrite = 0 (sw, beq, j). ALUSrc is X for j because a jump never uses the ALU result.</p>`),
    B.key('When does each mux matter?', R`<p>All select lines are set by the control unit as soon as the opcode is decoded (ID), and in a single-cycle machine they then stay steady for the rest of the cycle. Each mux only has to be right by the time its output is used: <b>ALUSrc</b> while the ALU computes (EX); <b>RegDst</b> and <b>MemtoReg</b> by the clock edge that ends the cycle, when the register file writes (WB); <b>PCSrc</b> and <b>Jump</b> by that same edge, when the PC is loaded. PCSrc is the last one decided, because it waits for the ALU’s Zero flag.</p>`),
    B.warn('Four classic slips', R`<ul><li><b>sw has ALUSrc = 1</b>, even though it needs rt’s value: that value leaves the register file on read data 2 and goes straight to data memory’s <i>write data</i> input, bypassing the mux.</li><li><b>RegDst does not pick a source.</b> rs and rt are always both read; RegDst only chooses which field is the destination.</li><li><b>PCSrc is not a control-unit output</b> — the control unit gives Branch; PCSrc = Branch AND Zero.</li><li><b>MemtoReg’s inputs are drawn upside-down</b> in P&H: 1 (memory) on top, 0 (ALU) below. Go by the numbers.</li></ul>`),
    B.tool('datapath', { ins: 'sw', mux: 'alusrc', s1: 20, s2: 7 }),
    B.check(R`For <code>addi $t0, $s1, 8</code>, give RegDst, ALUSrc and MemtoReg and say why.`, R`<p><b>RegDst = 0</b> (I-format: destination is rt = $t0), <b>ALUSrc = 1</b> (second operand is the constant 8), <b>MemtoReg = 0</b> (the value written is the ALU’s sum, not memory). Also RegWrite = 1, MemRead = MemWrite = 0, ALUOp = 00 (add).</p>`),
    B.check(R`beq has a 16-bit offset in it. Why is its ALUSrc 0, not 1?`, R`<p>The ALU’s job for beq is to <b>compare the two registers</b> (subtract, then look at Zero). The offset never goes into the ALU: it is shifted left 2 and added to PC + 4 by the separate branch adder. So the ALU’s second input must be read data 2 → ALUSrc = 0.</p>`),
  ] };
  const ctlStep = { title: 'The control unit: from opcode to control signals', ref: REF, blocks: [
    B.x(R`<p>The control unit is <b>combinational logic</b> with one input — the 6-bit opcode, instruction bits [31–26] — and an output wire to every mux select and every enable in the datapath. It decodes the opcode early in the cycle and holds the signals steady until the next instruction is fetched. Nothing is stored and nothing is sequenced: that is why one cycle per instruction works.</p>`),
    B.tbl({ src: 'T', ref: 'P&H §4.4 (Fig. 4.22); opcodes from the MIPS green card', cls: 'mono', head: ['Instruction', 'Format', 'opcode [31–26]', 'decimal'], rows: [['R-type (add, sub, and, or, slt)', 'R', '000000', '0'], ['addi', 'I', '001000', '8'], ['lw', 'I', '100011', '35'], ['sw', 'I', '101011', '43'], ['beq', 'I', '000100', '4'], ['j', 'J', '000010', '2']] }),
    B.tbl({ src: 'T', ref: 'P&H §4.4; L10 [33:41]–[38:17]', head: ['Signal', 'Is 1 for', 'What it controls'], rows: [
      ['<b>RegDst</b>', 'R-format', 'RegDst mux: rd (1) or rt (0) is the register written'],
      ['<b>ALUSrc</b>', 'lw, sw, addi', 'ALUSrc mux: immediate (1) or read data 2 (0) into the ALU'],
      ['<b>MemtoReg</b>', 'lw', 'MemtoReg mux: memory data (1) or ALU result (0) is written'],
      ['<b>RegWrite</b>', 'R-format, lw, addi', 'register file write enable'],
      ['<b>MemRead</b>', 'lw', 'data memory read enable'],
      ['<b>MemWrite</b>', 'sw', 'data memory write enable'],
      ['<b>Branch</b>', 'beq', 'goes to an AND gate with Zero; the AND’s output is PCSrc'],
      ['<b>ALUOp</b> (2 bits)', 'ALUOp1 = R-format; ALUOp0 = beq', 'tells the ALU control unit: 00 add, 01 subtract, 10 use funct'],
      ['<b>Jump</b>', 'j', 'Jump mux: jump address (1) or PCSrc mux output (0)']], caption: 'Each signal is just an OR of the instruction types that need it — e.g. RegWrite = R-format + lw + addi.' }),
    B.tbl({ src: 'T', ref: 'P&H Fig. 4.22 + Jump (Fig. 4.24); addi row added with the same logic', cls: 'mono', head: ['Instr.', 'RegDst', 'ALUSrc', 'MemtoReg', 'RegWrite', 'MemRead', 'MemWrite', 'Branch', 'ALUOp', 'Jump'], rows: [
      ['R-type', '1', '0', '0', '1', '0', '0', '0', '10', '0'], ['addi', '0', '1', '0', '1', '0', '0', '0', '00', '0'], ['lw', '0', '1', '1', '1', '1', '0', '0', '00', '0'],
      ['sw', 'X', '1', 'X', '0', '0', '1', '0', '00', '0'], ['beq', 'X', '0', 'X', '0', '0', '0', '1', '01', '0'], ['j', 'X', 'X', 'X', '0', '0', '0', '0', 'XX', '1']] }),
    B.key('Two levels of decoding: ALUOp and the ALU control unit', R`<p>The main control unit only sees the opcode, and every R-type instruction has the same opcode (000000). So it does not decide the exact ALU operation; it sends a 2-bit <b>ALUOp</b> hint. A small second unit, <b>ALU control</b>, combines ALUOp with the instruction’s <b>funct</b> field [5–0] to make the 4-bit operation the ALU performs.</p>
      <div class="tbl-wrap"><table class="t mono"><thead><tr><th>Instruction</th><th>ALUOp</th><th>funct</th><th>ALU does</th><th>ALU control</th></tr></thead><tbody>
      <tr><td>lw / sw / addi</td><td>00</td><td>XXXXXX</td><td>add</td><td>0010</td></tr><tr><td>beq</td><td>01</td><td>XXXXXX</td><td>subtract</td><td>0110</td></tr>
      <tr><td>add</td><td>10</td><td>100000</td><td>add</td><td>0010</td></tr><tr><td>sub</td><td>10</td><td>100010</td><td>subtract</td><td>0110</td></tr>
      <tr><td>and</td><td>10</td><td>100100</td><td>AND</td><td>0000</td></tr><tr><td>or</td><td>10</td><td>100101</td><td>OR</td><td>0001</td></tr><tr><td>slt</td><td>10</td><td>101010</td><td>set on less than</td><td>0111</td></tr></tbody></table></div>`),
    B.x(R`<p><b>Three signals the control unit does not produce directly:</b> <b>PCSrc</b> (an AND gate makes it from Branch and Zero, because whether a branch is taken depends on data, not on the opcode); the ALU’s 4-bit <b>operation</b> (from ALU control); and the <b>Zero</b> flag (an ALU output, not a control signal at all).</p>
      <p><b>What “X” means for the hardware.</b> X lets the designer choose 0 or 1, whichever makes the logic smallest. With the equations above, an X entry simply comes out as 0 (e.g. RegDst = R-format gives 0 for sw), which is harmless because RegWrite = 0 means the result is never written. In an exam answer, write X — it shows you know the signal doesn’t matter.</p>`),
    B.check(R`For <code>sub $t0, $s1, $s2</code>, what does the control unit send as ALUOp, and who decides that the ALU must subtract?`, R`<p>ALUOp = <b>10</b> (“R-type: look at funct”). The <b>ALU control</b> unit sees funct = 100010 and outputs 0110 (subtract). The main control unit can’t tell sub from add: both have opcode 000000.</p>`),
    B.check(R`Which of these is NOT an output of the main control unit: RegWrite, PCSrc, ALUOp, MemtoReg?`, R`<p><b>PCSrc.</b> The control unit outputs Branch; PCSrc = Branch AND Zero.</p>`),
  ] };
  t.steps.splice(ci + 1, 0, muxStep, ctlStep);
  t.notation.push(['Jump', 'Mux before the PC: jump address (1) or the PCSrc mux output (0); 1 only for j', 'P&H §4.4'], ['ALU control', 'Small unit that turns ALUOp + funct into the 4-bit ALU operation', 'P&H §4.4'], ['opcode', 'Instruction bits [31–26]: the only input to the control unit', '']);
  t.keyPoints.splice(2, 0, 'Each mux is set by one question: RegDst — destination in rd (R) or rt (I)? ALUSrc — constant operand (lw, sw, addi)? MemtoReg — value from memory (lw)? PCSrc — taken beq (Branch AND Zero)? Jump — j?', 'Control unit = combinational logic on the opcode; ALUOp + funct → ALU control → 4-bit ALU operation. X wherever the mux’s output is discarded (RegWrite = 0 ⇒ RegDst, MemtoReg = X).');
  t.traps.push('<b>PCSrc listed as a control-unit output.</b> The control unit produces Branch; PCSrc = Branch AND Zero.', '<b>ALUSrc = 0 for sw</b> because “sw uses a register”. The register value goes to memory’s write data, the ALU still adds base + offset: ALUSrc = 1.');
  t.overview.canDo.splice(2, 0, 'Say what each multiplexer selects, which instructions choose which input, and when it matters.', 'Explain how the control unit turns the opcode into control signals, and how ALUOp + funct select the ALU operation.');

  /* practice: two more mux / control questions, then link every mux/control question to the new explanation */
  const QS = qMap.single;
  QS.push(Q({ id: 'ai-mux-addi', kind: 'ai', diff: 'M', taught: 'L10 [33:41]–[38:17]; P&H §4.4', q: '<p>For <code>addi $t0, $s1, 8</code> and <code>beq $s1, $s2, L</code>, give the select value of each multiplexer (RegDst, ALUSrc, MemtoReg, PCSrc) and explain each choice.</p>',
    ans: 'addi: RegDst 0, ALUSrc 1, MemtoReg 0, PCSrc 0. beq: RegDst X, ALUSrc 0, MemtoReg X, PCSrc = Zero (1 if $s1 = $s2).',
    steps: [['addi RegDst = 0', 'I-format: the destination is rt; there is no rd field.'], ['addi ALUSrc = 1', 'The second ALU operand is the constant 8 (sign-extended).'], ['addi MemtoReg = 0', 'The value written is the ALU’s sum.'], ['addi PCSrc = 0', 'Branch = 0, so Branch AND Zero = 0.'], ['beq RegDst = X, MemtoReg = X', 'RegWrite = 0: no register is written, so neither mux’s output is used.'], ['beq ALUSrc = 0', 'The ALU compares two registers (subtract); the offset goes to the branch adder, not the ALU.'], ['beq PCSrc = Branch AND Zero', '1 (take the branch target) only if the subtraction gives 0, i.e. $s1 = $s2.']], need: null }),
    Q({ id: 'ai-ctl-unit', kind: 'ai', diff: 'M', taught: 'L10 [33:41]; P&H §4.4', q: '<p>What is the input of the single-cycle control unit and what are its outputs? Why does it need a separate ALU control unit, and where does PCSrc come from?</p>',
      ans: 'Input: opcode [31–26]. Outputs: RegDst, ALUSrc, MemtoReg, RegWrite, MemRead, MemWrite, Branch, ALUOp (2 bits) (+ Jump). ALU control turns ALUOp + funct into the ALU operation, because all R-types share opcode 0. PCSrc = Branch AND Zero.',
      steps: [['Input: the 6-bit opcode, bits 31–26.', 'It is combinational logic: a truth table from opcode to signals (L10 [33:41]).'], ['Outputs: RegDst, ALUSrc, MemtoReg, RegWrite, MemRead, MemWrite, Branch, ALUOp (and Jump in the full datapath).', 'One wire to every mux select and enable.'], ['ALUOp + funct → ALU control → 4-bit ALU operation.', 'Every R-type has opcode 000000, so only funct says add vs sub vs and…'], ['PCSrc = Branch AND Zero.', 'Taken or not depends on the register values, which the opcode can’t know.']] }));
  const K = { off: 0, ai: 1, wild: 2 }, D = { E: 0, M: 1, H: 2 }, idx = new Map(QS.map((x, i) => [x, i]));
  QS.sort((a, b) => (K[a.kind] - K[b.kind]) || (a.kind === 'off' ? 0 : (D[a.diff] - D[b.diff])) || (idx.get(a) - idx.get(b)));
  t.questions = QS;
  const si = title => t.steps.findIndex(s => s.title === title) + 1, sM = si(muxStep.title), sC = si(ctlStep.title), sS = ci + 1;
  const set = (id, need, extra) => { const q = QS.find(x => x.id === id); if (q) Object.assign(q, { need }, extra || {}); };
  set('ai-ctl', [sM, sS], { ans: 'RegDst 0, ALUSrc 1, MemtoReg 1, RegWrite 1, MemRead 1, MemWrite 0. ALUSrc = 1 sends the sign-extended offset (not read data 2) into the ALU, so it computes base + offset = the address. MemtoReg = 1 makes the value written to rt come from data memory rather than from the ALU.', steps: [['RegDst = 0', 'lw is I-format: the destination register is rt, not rd.'], ['ALUSrc = 1', 'ALUSrc chooses the ALU’s second input: 1 = the sign-extended offset, so the ALU computes base + offset (the address).'], ['MemtoReg = 1', 'MemtoReg chooses what is written to the register: 1 = the word read from data memory, not the ALU result.'], ['RegWrite = 1, MemRead = 1, MemWrite = 0', 'lw reads memory and writes a register; it does not write memory.']] });
  set('ai-x', [sM, sC]);
  set('ai-mux-addi', [sM, sS]); set('ai-ctl-unit', [sC]);

  /* topics whose questions cite slides/sections no step shares: point them at the step that teaches the method */
  const T2 = id => topics.find(x => x.id === id);
  const link = (tid, qid, titles) => { const tt = T2(tid); if (!tt) return; const q = (tt.questions || []).find(x => x.id === qid); if (!q) return; const n = titles.map(rx => tt.steps.findIndex(s => rx.test(s.title)) + 1).filter(x => x > 0); if (n.length) q.need = n; };
  link('cpuperf', 'w-isa', [/iron law/i, /Comparing two machines/i]);
  link('cacheperf', 'cp-l2', [/Multilevel/i, /Memory stalls/i]);
  link('vm', 'v-tlb', [/Making translation fas/i, /Translating an address/i]);
  link('control', 'ps3q1c', [/Why branches cost/i, /predict not taken/i, /dynamic prediction/i]);
  ['r1s17', 'l10s7', 'ai-sw'].forEach(id => link('uarch', id, [/What each step does/i, /instruction-processing cycle/i]));

  }

  // --- viz enrichments ---
  {
    enrich('single', 6, B.x(R`<p><b>See the waste.</b> Below, the same four instructions run on all three designs on one time axis. In the single-cycle lane every instruction is given the load’s time; the grey hatching is clock time in which nothing happens.</p>`));
    enrich('single', 6, B.tool('cpuRace', { prog: 'mix', lat: 'l10', exam: 'Practice Test Q6 · PS2 Q5–Q6' }));
    enrich('multi', 2, B.x(R`<p><b>What multi-cycle adds to the datapath.</b> Step the clock: only one stage works in each short cycle, and the registers IR, A, B, ALUOut and MDR keep each step’s result for the next one. Switch the card at the top to compare with the single-cycle and pipelined versions of the same datapath.</p>`));
    enrich('multi', 2, B.tool('dp3', { mode: 'multi', prog: 'mix', lat: 'l12' }));
    enrich('multi', 5, B.x(R`<p><b>The same comparison on a time axis.</b> Drag the slider to 800 ps: the single-cycle machine has finished one instruction — and so has the multi-cycle one only if that instruction was short.</p>`));
    enrich('multi', 5, B.tool('cpuRace', { prog: 'mix', lat: 'l12', exam: 'L12 s16 · R1 s21 · PS2 Q5' }));
    enrich('pipe', 1, B.x(R`<p><b>Overlap, drawn to scale.</b> Same instructions, same delays, three designs. The pipelined lane uses the multi-cycle clock but starts a new instruction every cycle.</p>`));
    enrich('pipe', 1, B.tool('cpuRace', { prog: 'l13', lat: 'l12' }));
    enrich('pipe', 5, B.x(R`<p><b>Pipeline registers in the datapath.</b> Each instruction keeps its colour as it moves right, one stage per clock tick. The register to the right of a stage holds that instruction’s values, control bits and destination register number for the next stage.</p>`));
    enrich('pipe', 5, B.tool('dp3', { mode: 'pipe', prog: 'l13', lat: 'l12', cyc: 5 }));
    enrich('forward', 3, B.x(R`<p><b>Where a forwarded value physically comes from.</b> Step to cycles 4 and 5: <code>$2</code> is taken from the EX/MEM register, then from MEM/WB, instead of the (stale) register-file value. Turn forwarding off to see the same instructions wait in ID.</p>`));
    enrich('forward', 3, B.tool('dp3', { mode: 'pipe', prog: 'l15', lat: 'l12', fwd: true, cyc: 4 }));
    enrich('forward', 4, B.x(R`<p><b>The load-use bubble in the datapath.</b> In cycle 4 the load is only just reading memory, so <code>and</code> is held in ID and a bubble enters EX. One cycle later the loaded value is forwarded from MEM/WB.</p>`));
    enrich('forward', 4, B.tool('dp3', { mode: 'pipe', prog: 'l16', lat: 'l12', fwd: true, cyc: 4 }));
    enrich('binary', 5, B.x(R`<p><b>Overflow as a picture.</b> Put all sixteen 4-bit patterns on a circle. Adding B means walking B places clockwise. The answer is only wrong if the walk crosses a wrap-around line — and unsigned and two’s complement have their lines in different places.</p>`));
    enrich('binary', 5, B.tool('numWheel', { a: 5, b: 6, exam: 'PS2 Q3–Q4' }));
    enrich('forward', 5, B.x(R`<p><b>Drill it.</b> Practice Test Q4 was worth 30 of 100 marks. Generate as many fresh sequences as you like and check your dependency and stall counts.</p>`));
    enrich('forward', 5, B.tool('hazDrill', { n: 5, exam: 'Practice Test Q4 · PS3 Q4' }));
    enrich('vonneumann', 3, B.x(R`<p><b>The layers, with a real example.</b> One C statement followed from source code to machine code, to the datapath, to picoseconds. Use it as a map of how Topics 4–18 fit together.</p>`));
    enrich('vonneumann', 3, B.tool('oneLine', { ex: 'arr' }));
    enrich('cpuperf', 6, B.x(R`<p><b>Who sets which term?</b> Layer 6 below shows IC, CPI and the clock period for one real statement on three processors, and which layer of the stack decides each.</p>`));
    enrich('cpuperf', 6, B.tool('oneLine', { ex: 'swap' }));
    enrich('multi', 5, B.x(R`<p><b>Drill it.</b> New numbers every time; the method never changes.</p>`));
    enrich('multi', 5, B.tool('clockDrill', { exam: 'L12 s16 · PS2 Q5 · Practice Test Q6' }));
    enrich('control', 4, B.tool('bpFSM', {}), 2);
    enrich('perf', 1, B.x(R`<p><b>See the powers of ten.</b> Type any number (try <code>4.3 x 10^-12</code> or <code>250 ps</code>) and watch the decimal point move to make a coefficient between 1 and 10. The exponent is the number of places moved: left is positive, right is negative. The last tab shows why multiplying adds exponents and dividing subtracts them.</p>`));
    enrich('perf', 1, B.tool('sciLab', { exam: 'L03 s13 · R1 s7' }));
  }
}
