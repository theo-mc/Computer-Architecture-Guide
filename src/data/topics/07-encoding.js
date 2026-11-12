import { R, B } from '../../utils/dsl.js';

export default {
  id: 'encoding', num: 7, file: 'instruction-encoding', week: 2, lectures: ['L06'],
  title: 'Representing instructions: R, I and J formats in binary and hex', short: 'Instruction formats',
  keywords: 'machine code r-format i-format j-format opcode funct rs rt rd shamt immediate binary hex encode decode field',
  taught: 'L06 s1–s11 (Week 2). Reviewed R1 s13.',
  overview: {
    lede: 'Every MIPS instruction is a 32-bit word. Learn the three formats, encode add and addi by hand, read hex, and see why "instructions are just data".',
    about: R`<p>The assembler turns each instruction into a 32-bit binary word with a few fixed formats — regularity keeps the decoding hardware simple. R-format for register-to-register arithmetic, I-format for immediates, loads/stores and branches, J-format for jumps. You'll convert register numbers and constants to binary (repeated division by 2), pack the fields, and group bits into hex.</p><p>The whole skill is mechanical once you know three things: the <b>field layout</b> of each format, the <b>register numbers</b>, and how to turn a decimal number into a fixed number of bits. Step 2 teaches the conversion from scratch; then every encoding is just “fill in the boxes”.</p>`,
    canDo: ['Name the fields and widths of the R, I and J formats.', 'Encode an R-format and an I-format instruction into binary and hex, step by step.', 'Decode a hex word back into assembly.', 'Convert decimal ↔ binary ↔ hex.', 'State the immediate range and explain the stored-program idea.'],
    buildsOn: ['isa1'],
  },
  notation: [
    ['op', 'Opcode: 6 bits, says what kind of instruction', 'R-format: 000000'],
    ['rs, rt', 'Source register numbers (5 bits each); in I-format rt is the destination for addi/lw and the data source for sw', ''],
    ['rd', 'Destination register number (R-format only, 5 bits)', ''],
    ['shamt', 'Shift amount (5 bits); 00000 for non-shifts', ''],
    ['funct', 'Function code (6 bits): picks the R-format operation', 'add = 100000 (32), sub = 100010 (34)'],
    ['immediate', '16-bit constant or address offset', R`\(-2^{15}\) to \(2^{15}-1\)`],
    ['address', '26-bit word address (J-format)', ''],
    [R`\(x_2,\ x_{16}\)`, 'A number written in base 2 or base 16', R`\(10010_2 = 18\)`],
    ['0x…', 'Hexadecimal prefix', '0x02324020'],
  ],
  steps: [
    { title: 'Instructions are 32-bit binary words', ref: 'L06 s3–s4', blocks: [
      B.p('S', 'L06 s3–s4', R`<p>All MIPS instructions are 32 bits wide. The assembly <code>add $1, $2, $3</code> becomes <b>machine language</b> — its binary representation. There is a small number of formats encoding the opcode, register numbers, etc. — <b>regularity!</b> Register numbers: <code>$t0–$t7</code> are 8–15, <code>$t8–$t9</code> are 24–25, <code>$s0–$s7</code> are 16–23.</p>`),
      B.tbl({ src: 'T', ref: 'MIPS green card (Canvas, Week 2) / P&H Ch. 2', head: ['Name', 'Number', 'Use'], rows: [['$zero', '0', 'constant 0'], ['$at', '1', 'assembler temporary'], ['$v0–$v1', '2–3', 'results'], ['$a0–$a3', '4–7', 'arguments'], ['$t0–$t7', '8–15', 'temporaries'], ['$s0–$s7', '16–23', 'saved'], ['$t8–$t9', '24–25', 'more temporaries'], ['$k0–$k1', '26–27', 'reserved for OS kernel'], ['$gp', '28', 'global pointer'], ['$sp', '29', 'stack pointer'], ['$fp', '30', 'frame pointer'], ['$ra', '31', 'return address']], caption: 'Only $t and $s numbers are on the slides; the rest come from the green card.' }),
      B.p('L', 'L06 [5:13]–[8:50]', R`<p>Regularity appears at every level: few, uniform instruction formats, all 32 bits; only loads and stores access memory; fixed register conventions; at the microarchitecture level every instruction passes through the same pipeline stages.</p>`),
    ] },
    { title: 'Toolkit: decimal ↔ binary ↔ hex', ref: 'L06 s7 · L08 s4', blocks: [
      B.x(R`<p>Encoding needs one arithmetic skill: writing a whole number in binary using an exact number of bits. Binary works like decimal, except each place is worth twice the place to its right (1, 2, 4, 8, 16 …) instead of ten times.</p>`),
      B.key('Two ways to convert 18 to 5-bit binary', R`<p><b>Method 1 — subtract place values.</b> The 5-bit places are 16, 8, 4, 2, 1. Take the biggest that fits: 18 − 16 = 2 (write 1 under 16). 8 doesn't fit in 2 (0), 4 doesn't (0), 2 does: 2 − 2 = 0 (1), 1 isn't needed (0). Read the digits: <b>10010</b>.</p><p><b>Method 2 — repeated division by 2.</b> 18 ÷ 2 = 9 r <b>0</b>; 9 ÷ 2 = 4 r <b>1</b>; 4 ÷ 2 = 2 r <b>0</b>; 2 ÷ 2 = 1 r <b>0</b>; 1 ÷ 2 = 0 r <b>1</b>. Read the remainders from the <b>bottom up</b>: 10010.</p><p>Either way, <b>pad on the left with zeros</b> to fill the field: 8 in a 5-bit field is 01000.</p>`),
      B.p('S', 'L06 s7', R`<p><b>Hexadecimal</b> (base 16) is a compact way to write bit strings: <b>4 bits per hex digit</b>. Digits above 9 use letters: a = 10, b = 11, c = 12, d = 13, e = 14, f = 15.</p>`),
      B.tbl({ src: 'S', ref: 'L06 s7', cls: 'mono', head: ['hex', 'bin', 'hex', 'bin', 'hex', 'bin', 'hex', 'bin'], rows: [['0', '0000', '4', '0100', '8', '1000', 'c', '1100'], ['1', '0001', '5', '0101', '9', '1001', 'd', '1101'], ['2', '0010', '6', '0110', 'a', '1010', 'e', '1110'], ['3', '0011', '7', '0111', 'b', '1011', 'f', '1111']], caption: 'Example from the slide: eca8 6420 = 1110 1100 1010 1000 0110 0100 0010 0000.' }),
      B.x(R`<p>Try it in the Number lab: type <b>18</b>, look at the binary, then switch to 8-bit and 4-bit to see padding and overflow. The “Convert” tab shows the division table for whatever you type.</p>`),
      B.tool('numlab', { n: 8, a: '18', tab: 'convert' }),
      B.check(R`<p>Convert 0x8E68 to binary, and 23 to 5-bit binary.</p>`, R`<p>0x8E68: 8 = 1000, E = 1110, 6 = 0110, 8 = 1000 → 1000 1110 0110 1000. 23 = 16 + 4 + 2 + 1 → 10111.</p>`),
    ] },
    { title: 'R-format', ref: 'L06 s5–s6', blocks: [
      B.dia({ src: 'S', ref: 'L06 s5', ascii: ` 31    26 25   21 20   16 15   11 10    6 5      0
+--------+-------+-------+-------+-------+--------+
|   op   |  rs   |  rt   |  rd   | shamt | funct  |
| 6 bits |5 bits |5 bits |5 bits |5 bits | 6 bits |
+--------+-------+-------+-------+-------+--------+`, svg: `<svg viewBox="0 0 640 90" width="640"><g font-family="var(--mono)" font-size="13" text-anchor="middle">${[['op', 6, 'var(--c-orange)'], ['rs', 5, 'var(--c-blue)'], ['rt', 5, 'var(--c-blue)'], ['rd', 5, 'var(--c-green)'], ['shamt', 5, 'var(--c-magenta)'], ['funct', 6, 'var(--c-orange)']].reduce((a, f) => { const x = a.x, w = f[1] * 19; a.s += `<rect x="${x}" y="20" width="${w}" height="40" fill="var(--panel-solid)" stroke="${f[2]}" stroke-width="2"/><text x="${x + w / 2}" y="45" fill="var(--fg)">${f[0]}</text><text x="${x + w / 2}" y="78" fill="var(--muted)" font-size="11">${f[1]} bits</text>`; a.x += w; return a; }, { x: 15, s: '' }).s}</g></svg>`, caption: 'R-format fields. Total: 6 + 5 + 5 + 5 + 5 + 6 = 32 bits.' }),
      B.p('S', 'L06 s5', R`<ul><li><b>op</b>: operation code (opcode)</li><li><b>rs</b>: first source register number</li><li><b>rt</b>: second source register number</li><li><b>rd</b>: destination register number</li><li><b>shamt</b>: shift amount (00000 for now)</li><li><b>funct</b>: function code (extends the opcode)</li></ul>`),
      B.wk({ src: 'S', ref: 'L06 s6; L06 [9:54]–[17:52]', title: 'Encode add $t0, $s1, $s2', steps: [
        [R`\(\text{op} = 0 = 000000\)`, 'All R-format instructions use opcode 0; the funct field picks add.'],
        [R`\(\text{rs} = \$s1 = 17 = 10001_2\)`, R`17 = 16 + 1 = \(2^4 + 2^0\).`],
        [R`\(\text{rt} = \$s2 = 18 = 10010_2\)`, R`18 = 16 + 2 = \(2^4 + 2^1\). By repeated division: 18÷2=9 r0, 9÷2=4 r1, 4÷2=2 r0, 2÷2=1 r0, 1÷2=0 r1 → read upwards 10010.`],
        [R`\(\text{rd} = \$t0 = 8 = 01000_2\)`, 'Pad to 5 bits with zeros on the left.'],
        [R`\(\text{shamt} = 00000,\ \ \text{funct} = 32 = 100000_2\)`, 'Not a shift. Funct for add is 100000 (for sub it is 100010).'],
        [R`\(\texttt{000000 10001 10010 01000 00000 100000}\)`, 'Concatenate the fields in order.'],
        [R`\(\texttt{0000 0010 0011 0010 0100 0000 0010 0000} = \texttt{0x02324020}\)`, 'Regroup into fours and convert each group to one hex digit.'],
      ], result: R`\(\texttt{add \$t0, \$s1, \$s2} = \texttt{0x02324020}\)` }),
      B.analogy('A form with fixed boxes', R`<p>An instruction word is like a paper form with boxes of fixed width: 6 boxes for the operation, then three 5-box fields for registers, and so on. The hardware always reads the same boxes in the same places, which is why decoding can be done in one quick step. The price is that every value must be squeezed into its box — hence padding with zeros, and the limits on immediate values.</p>`),
      B.fx('log2'),
    ] },
    { title: 'I-format', ref: 'L06 s8–s9', blocks: [
      B.dia({ src: 'S', ref: 'L06 s8', ascii: ` 31    26 25   21 20   16 15                     0
+--------+-------+-------+------------------------+
|   op   |  rs   |  rt   |  constant or address   |
| 6 bits |5 bits |5 bits |        16 bits         |
+--------+-------+-------+------------------------+` }),
      B.p('S', 'L06 s8–s9', R`<ul><li>Used for <b>immediate arithmetic</b> (addi) and <b>all loads and stores</b>.</li><li><b>rt</b>: destination or source register number.</li><li>Constant: \(-2^{15}\) to \(+2^{15} - 1\) (i.e. −32768 to 32767).</li><li>Address: an offset added to the base address in rs.</li><li>Design principle: <b>good design demands good compromises</b> — different formats complicate decoding, but allow all instructions to be 32 bits; keep formats as similar as possible.</li></ul>`),
      B.p('L', 'L06 [20:20]–[22:47]', R`<p>rs is the source or base register. rt is the <b>destination</b> for arithmetic and load instructions, but the <b>data register</b> (a source) for store instructions. A constant bigger than 16 bits must first be built in a register with extra instructions.</p>`),
      B.wk({ src: 'S', ref: 'L06 s9; L06 [22:47]–[26:27]', title: 'Encode addi $1, $2, 100', steps: [
        [R`\(\text{op} = \texttt{addi} = 8 = 001000\)`, 'addi’s opcode (green card).'],
        [R`\(\text{rs} = \$2 = 00010,\ \ \text{rt} = \$1 = 00001\)`, 'rs is the source; rt is the destination for addi.'],
        [R`\(100 = 64 + 32 + 4 = 2^6 + 2^5 + 2^2 = 1100100_2\)`, 'Write 100 as a sum of powers of 2.'],
        [R`\(\text{immediate} = 0000000001100100\)`, 'Pad to 16 bits.'],
        [R`\(\texttt{001000 00010 00001 0000000001100100}\)`, 'Concatenate: op, rs, rt, immediate.'],
      ], result: R`\(\texttt{0x20410064}\)` }),
      B.fx('range'),
      B.warn('The 16-bit limit', R`<p>The immediate field holds a two's complement number from −32768 to 32767. <code>addi $t0, $t0, 40000</code> can't be encoded: 40000 > 32767. Larger constants are built with two instructions (<code>lui</code> then <code>ori</code>) — the MIPS lab shows this when you write <code>li $t0, 100000</code>.</p>`),
    ] },
    { title: 'J-format and decoding', ref: 'L06 s10', blocks: [
      B.p('S', 'L06 s10', R`<p>Three formats — R: opcode, rs, rt, rd, shamt, function; I: opcode, rs, rt, address/immediate; J: opcode, 26-bit address (for jumps). <b>Instruction decode</b>: read the instruction bits (the opcode first, which tells you how to read the rest), then activate the control signals.</p>`),
      B.tbl({ src: 'T', ref: 'MIPS green card (Canvas, Week 2)', cls: 'mono', head: ['Instr.', 'Format', 'op (dec)', 'funct (dec)'], rows: [['add', 'R', '0', '32'], ['sub', 'R', '0', '34'], ['and', 'R', '0', '36'], ['or', 'R', '0', '37'], ['nor', 'R', '0', '39'], ['slt', 'R', '0', '42'], ['sll', 'R', '0', '0'], ['srl', 'R', '0', '2'], ['jr', 'R', '0', '8'], ['addi', 'I', '8', '—'], ['lw', 'I', '35', '—'], ['sw', 'I', '43', '—'], ['beq', 'I', '4', '—'], ['bne', 'I', '5', '—'], ['j', 'J', '2', '—']], caption: 'Lecture gives add = 100000 and sub = 100010 (L06 [9:54]); you are not expected to memorise the rest — check the green card.' }),
      B.wk({ src: 'A', ref: 'method from L06 s5–s10', title: 'Decode 0x8D2A0010', steps: [
        [R`\texttt{8D2A0010} \to \texttt{1000 1101 0010 1010 0000 0000 0001 0000}`, 'Each hex digit becomes 4 bits.'],
        [R`\text{op} = 100011_2 = 32 + 2 + 1 = 35 \Rightarrow \texttt{lw (I-format)}`, 'The first 6 bits are the opcode; 35 is lw, so read the rest as I-format.'],
        [R`\text{rs} = 01001_2 = 9 = \$t1,\quad \text{rt} = 01010_2 = 10 = \$t2`, 'Next 5 + 5 bits. For lw, rs is the base and rt receives the loaded word.'],
        [R`\text{imm} = 0000000000010000_2 = 16`, 'Last 16 bits: only the 16s place is set.'],
        [R`\texttt{lw \$t2, 16(\$t1)}`, 'Assemble the parts: lw rt, imm(rs).'],
      ], result: 'lw $t2, 16($t1): load the word 16 bytes (4 words) after the address in $t1.' }),
      B.tool('encoder', { v: 'add $t0, $s1, $s2' }),
    ] },
    { title: 'Stored-program computers', ref: 'L06 s11', blocks: [
      B.p('S', 'L06 s11', R`<p>The big picture: <b>instructions are represented in binary, just like data</b>; instructions and data are stored in memory; programs can operate on programs (compilers, linkers…); <b>binary compatibility</b> lets compiled programs work on different computers — standardised ISAs.</p>`),
    ] },
  ],
  keyPoints: [
    'Every MIPS instruction is 32 bits; few formats = regularity = simple decoding.',
    'R: op(6) rs(5) rt(5) rd(5) shamt(5) funct(6). I: op(6) rs(5) rt(5) imm(16). J: op(6) address(26).',
    'R-format op = 0; funct selects the operation (add 32, sub 34).',
    'I-format rt = destination for addi/lw, data source for sw; immediate −32768…32767.',
    'Decimal → binary: repeat ÷2 and read the remainders bottom-up; pad to the field width.',
    'Hex: 4 bits per digit.',
    'Stored program: instructions are data in memory.',
  ],
  traps: [
    '<b>Field order vs assembly order.</b> In assembly add rd, rs, rt — but in binary the order is rs, rt, rd.',
    '<b>Forgetting to pad.</b> 8 must be 01000 in a 5-bit field.',
    '<b>Reading remainders top-down.</b> The last remainder is the most significant bit.',
    '<b>rt’s double role</b> in I-format (destination for lw/addi, source for sw).',
    R`<b>Immediate range.</b> \(2^{15} - 1 = 32767\), not 32768.`,
  ],
  };
