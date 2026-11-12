import { R, B } from '../../utils/dsl.js';

export default {
  id: 'isa1', num: 6, file: 'mips-registers-memory', week: 2, lectures: ['L05'],
  title: 'MIPS I: CISC vs RISC, registers, arithmetic and memory', short: 'MIPS: registers & memory',
  keywords: 'mips risc cisc registers lw sw load store word byte address alignment big endian offset array immediate addi',
  taught: 'L05 s1–s21 (Week 2). Reviewed R1 s13–s14. Practised in PS1 Q6 and Practice Test Q3.',
  overview: {
    lede: 'Why MIPS is a RISC load/store machine, its 32 registers, and how to turn C array statements into lw, add and sw with the right byte offsets.',
    about: R`<p>From here on the module speaks <b>MIPS</b>: a clean RISC instruction set used throughout the textbook. The ideas are few but must be exact. Arithmetic works only on the 32 <b>registers</b>; memory is reached only through <b>load</b> (<code>lw</code>) and <b>store</b> (<code>sw</code>); memory is numbered in <b>bytes</b>, so element <code>A[i]</code> of a word array sits <b>4 × i</b> bytes after the start.</p><p>Practice Test Q3 (10 points) is exactly “turn this C line into MIPS”, so this topic ends with a full method you can apply to any such line — and the MIPS step-through lab lets you run your answer and watch the registers and memory change.</p>`,
    canDo: ['List the main differences between CISC and RISC and classify x86, MIPS and ARM.', 'Write three-operand MIPS arithmetic for a C expression using $s and $t registers.', 'Compute array offsets and write lw/sw for A[i] accesses.', 'Explain byte addressing, word alignment and big-endian order.', 'Use immediates (addi) and explain why there is no subi.'],
    buildsOn: ['vonneumann'],
  },
  notation: [
    ['$s0–$s7', 'Saved registers: hold variables (registers 16–23)', 'L05 s11; L06 s4'],
    ['$t0–$t9', 'Temporary registers: intermediate values ($t0–$t7 = 8–15, $t8–$t9 = 24–25)', 'L05 s11; L06 s4'],
    ['$zero', 'Register 0, always contains 0', ''],
    ['word', '32 bits = 4 bytes', 'L05 s11'],
    ['lw rt, off(rs)', 'load word: rt ← Memory[rs + off]', 'L05 s15'],
    ['sw rt, off(rs)', 'store word: Memory[rs + off] ← rt', 'L05 s15'],
    ['addi rt, rs, k', 'add immediate: rt ← rs + constant k', 'L05 s21'],
    ['offset', 'Number of BYTES from the base address: 4 × index for words', 'L05 s18'],
    [R`\(\log_2 32 = 5\)`, 'Bits needed to name one of 32 registers', 'L05 s14'],
    ['CISC / RISC', 'Complex / Reduced Instruction Set Computer', 'L05 s6'],
  ],
  steps: [
    { title: 'The ISA as a contract, and many ISAs', ref: 'L05 s4–s5', blocks: [
      B.p('S', 'L05 s4–s5', R`<p>The ISA is the contract between software and hardware; there are different ISAs and different microarchitectures supporting them. Criteria for a good ISA: <b>implementability</b> (low power, area-efficient, high performance) and <b>programmability</b> (small code size). Examples over the decades: x86, PDP-11, VAX, IBM 360, CDC 6600, SIMD (CRAY-1), VLIW (IA-64), PowerPC, and RISC ISAs (Alpha, MIPS, SPARC, ARM). They differ in how instructions are specified, what they do and how complex they are.</p>`),
    ] },
    { title: 'CISC vs RISC', ref: 'L05 s6, R1 s13', blocks: [
      B.tbl({ src: 'S', ref: 'L05 s6', head: ['CISC (Complex Instruction Set Computer)', 'RISC (Reduced Instruction Set Computer)'], rows: [
        ['Multi-clock complex instructions', 'Single-clock, reduced instructions only'],
        ['Memory-to-memory: LOAD and STORE built into instructions', 'Register-to-register: LOAD and STORE are separate instructions'],
        ['Small code size, high cycles per second', 'Large code size, low cycles per second'],
        ['Transistors used for storing/executing complex instructions', 'More transistors spent on memory registers'],
        ['Emphasis on hardware', 'Emphasis on software'],
        ['e.g. Intel Pentium (x86)', 'e.g. ARM, DEC Alpha, PA-RISC, SPARC, MIPS'],
      ] }),
      B.wk({ src: 'S', ref: 'L05 s6; L05 [7:37]', title: 'Add two numbers in memory', steps: [
        [R`CISC: \(\texttt{ADD 2:3, 5:2}\)`, 'One powerful instruction reads both memory locations, adds, and writes the result back to memory.'],
        [R`RISC: \(\texttt{LOAD A, 2:3}\); \(\texttt{LOAD B, 5:2}\); \(\texttt{ADD A, B}\); \(\texttt{STORE 2:3, A}\)`, 'Load both values into registers, add the registers, store the result back.'],
      ], result: 'RISC needs more instructions, but each is simple, fixed-length and easy to pipeline.' }),
      B.p('L', 'L05 [6:30]–[7:37]; R1 Part I [40:53]', R`<p>CISC: large, complex instruction set; variable-length instructions; instructions can access memory directly; execution time varies; complex decoding hardware; fewer instructions per program. RISC: small uniform instruction set; fixed-length instructions; register-to-register operations with dedicated load/store; roughly equal time per instruction; easier to pipeline; simpler hardware allowing higher clock rates; but more instructions per program. <b>Intel x86 is CISC; MIPS and ARM are RISC.</b></p>`),
    ] },
    { title: 'MIPS arithmetic: three operands', ref: 'L05 s7–s10', blocks: [
      B.p('S', 'L05 s8–s9', R`<p><code>add a, b, c</code> means a gets b + c. The <b>opcode</b> says what operation; the <b>operands</b> are two sources and one destination (destination first). One C statement may need several instructions; <code>t0</code>, <code>t1</code> are temporaries.</p><pre class="code nomath">f = (g + h) - (i + j);
add t0, g, h      # temp t0 = g + h
add t1, i, j      # temp t1 = i + j
sub f, t0, t1     # f = t0 - t1</pre>`),
      B.p('S', 'L05 s10', R`<p>Why not one big instruction for <code>f = (g+h)−(i+j)</code>? A very primitive computer can compute anything a fancy one can; ISAs are chosen for <b>performance and cost</b>, not computability. Regularity improves both: hardware for an arbitrary number of operands is complex, slow and unnecessary.</p>`),
    ] },
    { title: 'Registers', ref: 'L05 s11–s14', blocks: [
      B.p('S', 'L05 s11, s14', R`<p>Arithmetic instructions use <b>register operands</b>. MIPS has a <b>32 × 32-bit register file</b> (registers 0–31; 32 bits = a <b>word</b>). Assembler names: <code>$t0…$t9</code> for temporaries, <code>$s0…$s7</code> for saved variables. Why registers? A short name fits in the instruction word: \(\log_2(32) = 5\) bits.</p>`),
      B.p('L', 'L05 [25:41]–[27:11]', R`<p>"Why five bits, not four, not six?" Because \(2^5 = 32\): five bits give exactly 32 different patterns (0 to 31), one per register. Four bits would only give 16.</p>`),
      B.p('S', 'L05 s14', R`<p>Some ALU operations: <code>add, addi, addu, addiu</code> (immediate, unsigned — u versions don't check overflow); <code>sub</code>; <code>mul, div</code> — wider result: 32b × 32b = 64b product, 32b / 32b = 32b quotient and 32b remainder; <code>and, andi, or, ori</code>; <code>sll, srl</code>.</p>`),
      B.wk({ src: 'S', ref: 'L05 s12', title: 'f = (g + h) − (i + j) with f…j in $s0…$s4', steps: [
        [R`\(\texttt{add \$t0, \$s1, \$s2}\)`, '$t0 = g + h ($s1 = g, $s2 = h).'],
        [R`\(\texttt{add \$t1, \$s3, \$s4}\)`, '$t1 = i + j ($s3 = i, $s4 = j).'],
        [R`\(\texttt{sub \$s0, \$t0, \$t1}\)`, 'f = $t0 − $t1, written into $s0.'],
      ], result: 'Three instructions; values flow register → ALU → register.' }),
      B.x(R`<p>Run it below: press <b>Step ▶</b> three times and watch $t0, $t1 and then $s0 turn yellow as each instruction writes them. <b>◀ Back</b> undoes a step, so you can replay any instruction. The “Next” card shows the machine code each instruction becomes (Topic 07).</p>`),
      B.tool('mips', { preset: 'fgh', presets: ['fgh', 'arr', 'ps1q6'] }),
    ] },
    { title: 'Memory: byte addresses, alignment, big-endian', ref: 'L05 s15–s17', blocks: [
      B.analogy('Desk and filing cabinet', R`<p>Registers are the few papers on your desk: instant to reach, but only room for 32. Memory is the filing cabinet across the room: holds millions of pages but every trip takes time. You fetch a page to the desk (<b>load</b>), work on it there, and file the answer back (<b>store</b>). MIPS never lets you write on a page while it's still in the cabinet.</p>`),
      B.p('S', 'L05 s15–s17', R`<p>32 registers aren't enough, so composite data (arrays, structures, dynamic data) lives in <b>main memory</b>. Arithmetic works only on registers: <b>load</b> values from memory into registers, operate, then <b>store</b> results back.</p><ul><li><b>Memory is byte addressed</b>: each address names one 8-bit byte.</li><li><b>Words are aligned</b>: a word's address must be a multiple of 4.</li><li><b>MIPS is big-endian</b>: the most-significant byte is at the lowest address of the word (little-endian, e.g. x86: least-significant byte at the lowest address).</li></ul>`),
      B.wk({ src: 'S', ref: 'applies L05 s17', title: 'Store 0x12345678 at address 100', steps: [
        [R`\(\texttt{0x12345678} \to\) bytes \(\texttt{12, 34, 56, 78}\)`, 'Two hex digits = one byte; 12 is the most significant byte.'],
        [R`Big-endian (MIPS): address 100 → 12, 101 → 34, 102 → 56, 103 → 78`, 'Most significant byte at the lowest address.'],
        [R`Little-endian: 100 → 78, 101 → 56, 102 → 34, 103 → 12`, 'Least significant byte at the lowest address.'],
      ], result: 'Address 100 is a multiple of 4, so the word is aligned.' }),
    ] },
    { title: 'Arrays: offsets are bytes', ref: 'L05 s18–s19, R1 s14', blocks: [
      B.wk({ src: 'S', ref: 'L05 s18', title: 'g = h + A[8]; g in $s1, h in $s2, base of A in $s3', steps: [
        [R`\(\text{offset} = 8 \times 4 = 32\)`, 'Index 8, 4 bytes per word.'],
        [R`\(\texttt{lw \$t0, 32(\$s3)}\)`, 'Load A[8]: address = $s3 + 32. 32 is the offset, $s3 the base register.'],
        [R`\(\texttt{add \$s1, \$s2, \$t0}\)`, 'g = h + A[8].'],
      ] }),
      B.wk({ src: 'S', ref: 'L05 s19', title: 'A[12] = h + A[8]; h in $s2, base of A in $s3', steps: [
        [R`\(\texttt{lw \$t0, 32(\$s3)}\)`, 'Load A[8] (offset 8 × 4 = 32).'],
        [R`\(\texttt{add \$t0, \$s2, \$t0}\)`, '$t0 = h + A[8].'],
        [R`\(\texttt{sw \$t0, 48(\$s3)}\)`, 'Index 12 → offset 12 × 4 = 48. Store into A[12].'],
      ], result: 'Pattern: load from memory → operate on registers → store back.' }),
      B.fx('offset'),
      B.key('Method for any “C line → MIPS” question', R`<ol><li><b>Map</b> every variable and array base to its register (given in the question).</li><li>For each array element on the right-hand side, <b>load</b> it: offset = 4 × index, base = the array's register. One <code>lw</code> into a temporary per element.</li><li>Do the <b>arithmetic</b> in the order of the C expression, keeping the source order for <code>sub</code>.</li><li>If the left-hand side is an array element, <b>store</b> the result with <code>sw</code> (offset = 4 × index); if it's a variable, make its register the destination of the last instruction.</li></ol>`),
      B.wk({ src: 'A', ref: 'same method as Practice Test Q3 (try that one in Practice below)', title: 'B[3] = A[5] − g + B[1]; g in $s0, base of A in $s1, base of B in $s2', steps: [
        [R`\texttt{lw \$t0, 20(\$s1)}`, 'Load A[5]: offset 5 × 4 = 20 from A’s base ($s1).'],
        [R`\texttt{lw \$t1, 4(\$s2)}`, 'Load B[1]: offset 1 × 4 = 4 from B’s base ($s2).'],
        [R`\texttt{sub \$t0, \$t0, \$s0}`, 'A[5] − g: A[5] ($t0) first, then g ($s0). $t0 can be reused: A[5] is no longer needed on its own.'],
        [R`\texttt{add \$t0, \$t0, \$t1}`, '(A[5] − g) + B[1].'],
        [R`\texttt{sw \$t0, 12(\$s2)}`, 'Store into B[3]: offset 3 × 4 = 12 from B’s base.'],
      ], result: 'Five instructions using only two temporaries.' }),
      B.tool('offset', { i: 12, r: '$s3', b: 1000 }),
      B.p('S', 'R1 s14', R`<p>Review "spot the error": <code>lw $t0, 28($s3)</code> for A[8] is wrong — the offset must be 4 × 8 = 32.</p>`),
    ] },
    { title: 'Registers vs memory, and immediates', ref: 'L05 s20–s21', blocks: [
      B.p('S', 'L05 s20', R`<p>Registers are faster to access than memory. Operating on memory data needs loads and stores — more instructions executed. So the compiler must keep variables in registers as much as possible and only "spill" less frequently used ones to memory: <b>register optimisation is important</b>.</p>`),
      B.p('S', 'L05 s21', R`<p><b>Immediate operands</b>: a constant inside the instruction, e.g. <code>addi $s3, $s3, 4</code>. There is <b>no subtract-immediate</b>: use a negative constant, <code>addi $s2, $s1, -1</code>. Design principle: <i>make the common case fast</i> — small constants are common, and an immediate avoids a load instruction.</p>`),
      B.check(R`<p>Write MIPS for <code>i = i - 1</code> with i in $s3. Why can't you use <code>subi</code>?</p>`, R`<p><code>addi $s3, $s3, -1</code>. MIPS has no subtract-immediate instruction; adding a negative constant does the same job, so the extra instruction isn't needed.</p>`),
    ] },
  ],
  keyPoints: [
    'MIPS is RISC: fixed-length simple instructions, register-to-register arithmetic, separate lw/sw. x86 is CISC.',
    'Three operands, destination first: add rd, rs, rt.',
    '32 registers × 32 bits; 5 bits name a register. $s = variables, $t = temporaries, $zero = 0.',
    'Memory is byte-addressed; words are 4 bytes and must sit at multiples of 4; MIPS is big-endian.',
    'Array element offset = 4 × index; lw rt, offset(base).',
    'Load → operate → store. Keep variables in registers.',
    'addi takes a constant; subtract a constant by adding a negative one (no subi).',
  ],
  traps: [
    '<b>Offset = index.</b> A[8] needs offset 32, not 8 (R1 s14 has exactly this error with 28).',
    '<b>Arithmetic on memory.</b> MIPS can’t add memory operands — load first.',
    '<b>Operand order.</b> Destination comes first; for sub the order of the sources matters (sub $t2, $s0, $t1 is $s0 − $t1).',
    '<b>Big- vs little-endian.</b> MIPS: most significant byte at the lowest address.',
    '<b>Using ld.</b> The official solutions write "ld"; in MIPS-32 the word load is lw (L05 s15). Use lw.',
    '<b>Too many temporaries.</b> If a question says "use as few as possible", reuse $t registers once a value is no longer needed.',
  ],
  };
