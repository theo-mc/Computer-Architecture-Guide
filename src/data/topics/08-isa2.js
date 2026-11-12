import { R, B } from '../../utils/dsl.js';

export default {
  id: 'isa2', num: 8, file: 'logic-branches-procedures', week: 2, lectures: ['L06'],
  title: 'MIPS II: logical operations, branches, procedures and addressing modes', short: 'Logic, branches, procedures',
  keywords: 'logical shift sll srl and or nor mask branch beq bne jump if else loop procedure stack jal jr ra sp addressing modes pc-relative',
  taught: 'L06 s12–s26 (Week 2). Practised in PS1 Q7; Canvas discussion on bne vs beq (14 Oct).',
  overview: {
    lede: 'Bit masks and shifts, how if/else and loops become beq/bne/j, how a leaf procedure saves registers on the stack, and the four MIPS addressing modes.',
    about: R`<p>This topic finishes the MIPS instructions you need: <b>logical</b> instructions (and, or, nor, shifts) for manipulating bits; <b>conditional branches</b> for if-statements and loops; <b>procedure calls</b> with the stack; and the <b>addressing modes</b> that say where each operand comes from.</p>`,
    canDo: ['Compute and, or, nor, sll and srl results on binary values and explain masks.', 'Translate if/else and simple loops into beq/bne/j.', 'Comment MIPS code line by line and give the equivalent C.', 'Trace a leaf procedure that saves a register on the stack.', 'Name the four addressing modes and compute a base-addressed or PC-relative address.'],
    buildsOn: ['isa1', 'encoding'],
  },
  notation: [
    ['and / andi', 'Bitwise AND (register / immediate)', '1 only if both bits are 1'],
    ['or / ori', 'Bitwise OR', '1 if at least one bit is 1'],
    ['nor', 'NOT (A OR B); with $zero gives NOT', ''],
    ['sll / srl', 'Shift left / right logical by shamt bits, filling with 0s', R`sll i = ×\(2^i\)`],
    ['beq rs, rt, L', 'Branch to label L if rs == rt', ''],
    ['bne rs, rt, L', 'Branch to L if rs ≠ rt', ''],
    ['j L', 'Unconditional jump to L', ''],
    ['jr $ra', 'Jump to the address in $ra (return from a procedure)', ''],
    ['$a0–$a3, $v0', 'Argument registers; result register', 'L06 s19'],
    ['$sp, $ra', 'Stack pointer; return address', ''],
    ['PC', 'Program counter: address of the current/next instruction', ''],
    ['EA', 'Effective address = where the operand actually is', ''],
  ],
  steps: [
    { title: 'Logical operations and shifts', ref: 'L06 s12–s13', blocks: [
      B.tbl({ src: 'S', ref: 'L06 s12', head: ['Operation', 'C', 'Java', 'MIPS'], rows: [['Shift left', '<<', '<<', 'sll'], ['Shift right', '>>', '>>>', 'srl'], ['Bitwise AND', '&', '&', 'and, andi'], ['Bitwise OR', '|', '|', 'or, ori'], ['Bitwise NOT', '~', '~', 'nor']], caption: 'Useful for extracting and inserting groups of bits in a word.' }),
      B.p('S', 'L06 s13', R`<p>Shifts use the R-format's <b>shamt</b> field (how many positions). <b>sll by i bits multiplies by \(2^i\)</b>; <b>srl by i bits divides by \(2^i\)</b> (unsigned only). Both fill the emptied bits with 0.</p>`),
      B.x(R`<p>Why does shifting multiply? In decimal, sliding every digit one place left (and putting a 0 on the end) multiplies by 10: 37 → 370. In binary each place is worth 2× the next, so sliding left one place multiplies by 2, two places by 4, i places by \(2^i\). Sliding right divides, and anything that falls off the end is lost (it rounds down).</p>`),
      B.fx('shift'),
    ] },
    { title: 'Masks with AND, setting bits with OR', ref: 'L06 s14–s15', blocks: [
      B.wk({ src: 'S', ref: 'L06 s14', title: 'and $t0, $t1, $t2 (mask)', given: R`\$t2 = 0000 0000 0000 0000 0000 1101 1100 0000, \$t1 = 0000 0000 0000 0000 0011 1100 0000 0000`, steps: [
        [R`Rule: \(1 \text{ AND } 1 = 1\); everything else = 0`, 'A bit is 1 only where both inputs are 1.'],
        [R`Only bits 11 and 10 are 1 in both`, 'Line the words up and compare column by column.'],
        [R`\(\$t0 = \texttt{0000 0000 0000 0000 0000 1100 0000 0000}\)`, 'All other columns become 0 — the mask "selects some bits, clears others".'],
      ], result: '0x00000C00' }),
      B.wk({ src: 'S', ref: 'L06 s15', title: 'or $t0, $t1, $t2 (include bits)', steps: [
        [R`Rule: 1 if at least one input bit is 1`, 'OR sets bits to 1 and leaves others unchanged.'],
        [R`\(\$t0 = \texttt{0000 0000 0000 0000 0011 1101 1100 0000}\)`, 'Every column with a 1 in either input.'],
      ], result: '0x00003DC0' }),
      B.analogy('Stencils', R`<p>AND with a mask is like holding a stencil over the word: only the bits under the holes (the mask's 1s) show through; everything else becomes 0. OR is like painting: wherever the second word has a 1, that bit is painted 1; the rest is left as it was.</p>`),
      B.tool('numlab', { n: 16, a: '0x0DC0', b: '0x3C00', tab: 'shift', sop: 'and' }),
      B.check(R`<p>Which single instruction keeps only the lowest 8 bits of $t1 (clearing all the others) and puts the result in $t0?</p>`, R`<p><code>andi $t0, $t1, 0xFF</code> (or 255). 0xFF is eight 1s; AND keeps those bits and clears the rest. <code>andi</code> zero-extends its immediate, so the upper bits of the mask are 0.</p>`),
    ] },
    { title: 'Conditional branches and if/else', ref: 'L06 s16–s17', blocks: [
      B.p('S', 'L06 s16', R`<ul><li><code>beq rs, rt, L1</code>: if (rs == rt) branch to the instruction labelled L1.</li><li><code>bne rs, rt, L1</code>: if (rs != rt) branch to L1.</li><li><code>j L1</code>: unconditional jump to L1.</li><li>Otherwise execution continues sequentially.</li></ul>`),
      B.wk({ src: 'S', ref: 'L06 s17; L06 [38:13]–[42:53]', title: 'if (i == j) f = g + h; else f = g − h;   (f, g, h, i, j in $s0…$s4)', steps: [
        [R`\(\texttt{bne \$s3, \$s4, Else}\)`, 'Test the OPPOSITE condition: if i ≠ j skip the "then" part. If equal, fall through.'],
        [R`\(\texttt{add \$s0, \$s1, \$s2}\)`, 'then-part: f = g + h.'],
        [R`\(\texttt{j Exit}\)`, 'Skip over the else-part; without this jump the processor would run the else code too — a logic error.'],
        [R`\(\texttt{Else: sub \$s0, \$s1, \$s2}\)`, 'else-part: f = g − h, reached only via the branch.'],
        [R`\(\texttt{Exit: …}\)`, 'Both paths continue here.'],
      ] }),
      B.p('C', 'Discussion, 14 Oct (lecturer reply)', R`<p>A student asked why the book prefers <code>bne</code> over <code>beq</code> here. The lecturer: both versions are "functionally equivalent" with the same static instruction count; when i == j the bne version executes 3 instructions and the beq version 2, and the reverse when i ≠ j. "Neither implementation is universally more efficient, the better choice depends on how frequently each condition occurs." Treat the book's choice as "a common code-generation convention rather than a universal performance guarantee" — and note the difference between static count, dynamic count and execution time.</p>`),
      B.key('The pattern for any if / else', R`<ol><li>Branch on the <b>opposite</b> condition to the else-part (or past the then-part when there's no else).</li><li>Then-part.</li><li><code>j Exit</code> to jump over the else-part.</li><li><code>Else:</code> else-part.</li><li><code>Exit:</code> carry on.</li></ol><p>Why the opposite? Because if the condition is true we want to <i>fall through</i> into the then-part, which comes next in memory.</p>`),
      B.x(R`<p>Run both cases: with the preset values i = j, so bne is not taken and add runs. Click <b>Edit code</b>, change <code>$s4=5</code> to <code>$s4=6</code>, assemble, and step again: now the branch jumps to Else.</p>`),
      B.tool('mips', { preset: 'ifelse', presets: ['ifelse', 'loop', 'ps1q7'] }),
    ] },
    { title: 'Loops: the PS1 Q7 example', ref: 'PS1 Q7; L06 s16', blocks: [
      B.p('O', 'PS1 Q7', R`<pre class="code nomath">        add   $t0, $zero, $zero   # running sum = 0
loop:   beq   $a1, $zero, finish  # stop when $a1 = 0
        add   $t0, $t0, $a0       # sum += a
        addiu $a1, $a1, -1        # b--
        j     loop
finish: addi  $t0, $t0, 100       # sum + 100
        add   $v0, $t0, $zero     # return it</pre><p>It adds a to itself b times → <b>a × b + 100</b>. Run it in the simulator above (preset “a × b + 100 by repeated addition”) and watch $a1 count down.</p>`),
      B.key('The pattern for a while loop', R`<pre class="code nomath">Loop:  (test the condition; branch to Exit if it is FALSE)
       (loop body)
       j Loop
Exit:  …</pre><p>The test sits at the top so a loop that should run zero times runs zero times. The textbook's loop example (P&H §2.7, <code>while (save[i] == k) i += 1</code>) uses exactly this shape: <code>sll</code> to make 4i, <code>add</code> for the address, <code>lw</code>, <code>bne … Exit</code>, <code>addi i</code>, <code>j Loop</code>.</p>`),
      B.wk({ src: 'O', ref: 'PS1 Q7 traced with a = 6, b = 7', title: 'Trace a × b + 100 for $a0 = 6, $a1 = 7', steps: [
        ['$t0 = 0', 'The first add clears the running total.'],
        ['7 times round the loop: $t0 = 6, 12, 18, 24, 30, 36, 42; $a1 = 6, 5, 4, 3, 2, 1, 0', 'Each pass adds a (6) and decrements b; beq exits when $a1 reaches 0.'],
        ['$t0 = 42 + 100 = 142', 'finish adds 100.'],
        ['$v0 = 142', 'Copied into the return-value register.'],
      ], result: '6 × 7 + 100 = 142. The beq runs 8 times (7 not taken, 1 taken).' }),
    ] },
    { title: 'Procedures and the stack', ref: 'L06 s18–s21', blocks: [
      B.tbl({ src: 'S', ref: 'L06 s18 (details: P&H §2.8)', head: ['Caller', 'Callee'], rows: [['Save registers', 'Save registers'], ['Set up parameters', 'Perform the required work'], ['Call the procedure', 'Place the result in the appropriate register'], ['Get the results', 'Restore registers'], ['Restore registers', 'Return to the caller']] }),
      B.wk({ src: 'S', ref: 'L06 s19–s20; L06 [44:05]–[50:38]', title: 'leaf_example(g, h, i, j): f = (g + h) − (i + j); return f', given: 'Arguments g…j in $a0…$a3; f in $s0 (so $s0 must be saved); result in $v0. A leaf procedure calls no other procedure.', steps: [
        [R`\(\texttt{addi \$sp, \$sp, -4}\)`, 'Make room for one word on the stack: the stack grows DOWN, so subtract 4.'],
        [R`\(\texttt{sw \$s0, 0(\$sp)}\)`, 'Save the caller’s $s0 — the callee is about to overwrite it.'],
        [R`\(\texttt{add \$t0, \$a0, \$a1};\ \texttt{add \$t1, \$a2, \$a3}\)`, 'g + h and i + j.'],
        [R`\(\texttt{sub \$s0, \$t0, \$t1}\)`, 'f = (g + h) − (i + j).'],
        [R`\(\texttt{add \$v0, \$s0, \$zero}\)`, 'Copy the result to $v0, the return-value register.'],
        [R`\(\texttt{lw \$s0, 0(\$sp)};\ \texttt{addi \$sp, \$sp, 4}\)`, 'Restore $s0 and release the stack space (+4).'],
        [R`\(\texttt{jr \$ra}\)`, 'Return to the address the caller left in $ra.'],
      ] }),
      B.analogy('A stack of plates', R`<p>The stack works like a pile of plates: you can only add (push) or take (pop) at the top. A procedure that needs to borrow a register puts the caller's value on a plate (push), uses the register, then takes the plate back (pop) before returning — so the caller never notices. MIPS's pile hangs upside-down: it grows towards <b>lower</b> addresses, so pushing <i>subtracts</i> from $sp.</p>`),
      B.x(R`<p>Step through it: watch the Stack panel as <code>addi $sp, $sp, -4</code> pushes a slot and <code>sw $s0</code> fills it with 999; at the end $s0 is 999 again and $sp is back where it started. Then try the <b>recursive factorial</b> preset to see several frames pile up, each holding its own $ra and n.</p>`),
      B.tool('mips', { preset: 'leaf', presets: ['leaf', 'swap', 'fact'] }),
      B.check(R`<p>A procedure needs to save $s0, $s1 and $ra. What should its first instruction be, and its last two?</p>`, R`<p>First: <code>addi $sp, $sp, -12</code> (three words × 4 bytes). Last two: <code>addi $sp, $sp, 12</code> to pop the frame, then <code>jr $ra</code> to return (after restoring the three registers with <code>lw</code>).</p>`),
      B.p('S', 'L06 s21', R`<p><b>Memory layout</b> (low → high addresses): <b>text</b> (program code); <b>static data</b> (globals, static variables, constant arrays and strings; $gp points into it so ± offsets reach it); <b>dynamic data / heap</b> (malloc in C, new in Java), growing up; and the <b>stack</b> (automatic storage), growing down from the top.</p>`),
      B.bg('Typical MIPS addresses', R`<p>From the P&H memory-allocation figure: text starts at 0x00400000, static data at 0x10000000, $gp = 0x10008000, $sp starts at 0x7FFFFFFC. The simulators on this site use these defaults.</p>`, 'P&H §2.8'),
    ] },
    { title: 'Addressing modes', ref: 'L06 s22–s25', blocks: [
      B.tbl({ src: 'S', ref: 'L06 s22–s25', head: ['Mode', 'Example', 'Operand is…'], rows: [['Register', 'add $1, $2, $3', 'in a register named by the instruction (fastest)'], ['Base / displacement', 'lw $1, 100($2)', R`in memory at \(\$2 + 100\) (slide: $2 = 400, M[500] = 42 → $1 = 42)`], ['Immediate', 'addi $1, $2, 100', 'a constant inside the instruction'], ['PC-relative', 'beq $1, $2, 100', 'a branch target computed from the PC and the offset']] }),
      B.dis({ id: 'pcrel', title: 'how is the PC-relative branch target computed?', items: [['Slide L06 s25', R`"beq $1, $2, 100 # if ($1==$2) PC = PC + 100".`], ['Lecture recording L06 [53:18]', R`"100 is not a byte address… it represents the number of instructions to jump, measured from the instruction immediately following the beq… shift the offset 100 left by two bits, resulting in a byte offset of 400… new PC = current PC + 400".`], ['Textbook P&H §2.10', R`The address is relative to the following instruction (PC + 4), and the 16-bit field counts words: target = (PC + 4) + offset × 4.`]], likely: R`Use \(\text{target} = (PC + 4) + \text{offset} \times 4\). The slide is a simplification; the recording explains the ×4 and "the instruction immediately following", which is the textbook rule. If a question copies the slide's wording, show both.` }),
      B.fx('ea'),
      B.fx('branch'),
      B.tool('addrModes', { m: 'pc' }),
    ] },
  ],
  keyPoints: [
    'AND = mask (keep where mask is 1); OR = set bits; NOR with $zero = NOT.',
    R`sll i multiplies by \(2^i\); srl i divides an unsigned number by \(2^i\).`,
    'if/else: branch on the opposite condition to the else-part; end the then-part with j Exit.',
    'Loops: a branch at the top to leave, a j at the bottom to repeat.',
    'Procedures: args in $a0–$a3, result in $v0, return with jr $ra; save $s registers on the stack (stack grows down: addi $sp, $sp, −4 first).',
    'Memory layout: text, static data ($gp), heap ↑, stack ↓.',
    'Addressing modes: register, base (reg + offset), immediate, PC-relative ((PC+4) + offset × 4).',
  ],
  traps: [
    '<b>Forgetting j Exit</b> after the then-part — execution falls into the else-part.',
    '<b>Branching on the wrong condition.</b> To run then-part when i == j, branch away with bne.',
    '<b>Stack direction.</b> Push = subtract from $sp; pop = add. Reversing them corrupts the stack.',
    '<b>srl on negative numbers</b> doesn’t divide (it fills with 0s).',
    '<b>PC-relative offset in bytes.</b> The 16-bit field counts instructions; multiply by 4 and start from PC + 4.',
  ],
  };
