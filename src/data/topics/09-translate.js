import { R, B } from '../../utils/dsl.js';

export default {
  id: 'translate', num: 9, file: 'compile-assemble-link-load', week: 3, lectures: ['L07'],
  title: 'From C to running code: compiler, assembler, linker, loader — and choosing an ISA', short: 'Compile, link, load',
  keywords: 'compiler assembler linker loader object file pseudo-instruction move blt at register java jit bytecode swap x86 arm risc micro-ops',
  taught: 'L07 s1–s19 (Week 3). Reviewed R1 s6. Practised in PS2 Q1b.',
  overview: {
    lede: 'The chain that turns a C file into a running process, what pseudo-instructions are, how Java differs, a worked C → MIPS procedure, and how ISAs like MIPS, ARM and x86 compare.',
    about: R`<p>A program goes compiler → assembler → linker → loader before the CPU runs it. Each stage has a job you may be asked to describe. Then a full worked example (swap from bubble sort) shows the load → operate → store pattern again, and the lecture closes with how to choose an ISA and why modern x86 chips are RISC machines inside.</p>`,
    canDo: ['Describe each step from C source to execution, and what each tool produces.', 'Expand pseudo-instructions such as move and blt.', 'List the parts of an object file and what the linker and loader do.', 'Explain interpretation vs JIT compilation in the JVM.', 'Trace the swap procedure on registers and memory.', 'Compare MIPS, ARM and x86 and explain x86 µops.'],
    buildsOn: ['isa2', 'cpuperf'],
  },
  notation: [
    ['Object module', 'Machine code + information for linking; not yet runnable', 'L07 s5'],
    ['Executable (image)', 'The complete program produced by the linker', 'L07 s6'],
    ['Pseudo-instruction', 'Assembly instruction that isn’t real hardware; the assembler expands it', 'L07 s4'],
    ['$at', 'Register 1, reserved as the assembler temporary', 'L07 s4'],
    ['slt rd, rs, rt', 'Set on less than: rd = 1 if rs < rt, else 0', 'L07 s4'],
    ['JVM / JIT', 'Java Virtual Machine / just-in-time compiler', 'L07 s8'],
    ['bytecode', 'Portable instruction set for the JVM', 'L07 s8'],
    ['µops', 'Micro-operations: simple RISC-like internal operations', 'L07 s17'],
    ['$sp, $fp, $gp', 'Stack, frame and global pointers set up by the loader', 'L07 s7'],
  ],
  steps: [
    { title: 'The translation hierarchy', ref: 'L07 s3; R1 s6', blocks: [
      B.dia({ src: 'S', ref: 'L07 s3', ascii: `  C program
      |  compiler
      v
  Assembly language program
      |  assembler
      v
  Object: machine language module   +   Object: library routines (machine language)
      \\_______________ linker _______________/
                        v
              Executable: machine language program
                        |  loader
                        v
                     Memory  -->  CPU runs it` }),
      B.p('L', 'L07 [1:25]–[2:42]', R`<p>"You might think compiling a program is simply a single step, but … there are stages involved." Many compilers produce object modules directly (L07 s3). The "image" is not a picture: it is the complete program the linker produces.</p>`),
      B.analogy('Writing and publishing a book', R`<p>The <b>compiler</b> is the translator turning your English draft (C) into the printer's shorthand (assembly). The <b>assembler</b> typesets that shorthand into actual printed pages (machine code), one chapter (object module) at a time. The <b>linker</b> binds your chapters together with chapters borrowed from other books (library routines), fixing every “see page …” cross-reference. The <b>loader</b> puts the finished book on the reader's desk (memory) and opens it at page one.</p>`),
      B.tool('translate'),
      B.check(R`<p>Which tool fixes up a call from your program to <code>printf</code>, whose code lives in a library?</p>`, R`<p>The <b>linker</b>: it merges your object module with the library's and resolves the external reference to <code>printf</code>'s address (L07 s6 step 2–3).</p>`),
    ] },
    { title: 'Pseudo-instructions', ref: 'L07 s4', blocks: [
      B.p('S', 'L07 s4', R`<p>Most assembler instructions map one-to-one to machine instructions. <b>Pseudo-instructions</b> are "figments of the assembler's imagination":</p><pre class="code nomath">move $t0, $t1      →  add $t0, $zero, $t1
blt  $t0, $t1, L   →  slt $at, $t0, $t1
                      bne $at, $zero, L</pre><p><code>$at</code> (register 1) is the assembler temporary. <code>slt</code> sets <code>$at</code> to 1 if $t0 &lt; $t1, so "branch if $at ≠ 0" = "branch if less than".</p>`),
      B.x(R`<p>Why have pseudo-instructions at all? They make assembly easier to write and read without adding hardware. The real instruction set stays small and regular (good for pipelining), and the assembler quietly expands the convenient forms. The price: register <code>$at</code> is reserved for the assembler, so programs must not use it.</p>`),
      B.tool('pseudo'),
      B.x(R`<p>The MIPS lab expands pseudo-instructions for real: in the <b>sum</b> preset, <code>bge</code> becomes <code>slt $at</code> + <code>beq</code>, <code>la</code> becomes <code>lui</code> + <code>ori</code>, and <code>li</code> becomes <code>addiu</code>. The grey tags under each line show the real instructions, and the “Next” card says which pseudo-instruction they came from.</p>`),
      B.tool('mips', { preset: 'sum', presets: ['sum'] }),
    ] },
    { title: 'Object files, linking and loading', ref: 'L07 s5–s7', blocks: [
      B.tbl({ src: 'S', ref: 'L07 s5', head: ['Object file part', 'Contains'], rows: [['Header', 'Contents, size and position of the object module'], ['Text segment', 'Translated instructions (machine code)'], ['Static data segment', 'Data allocated for the life of the program'], ['Relocation info', 'Contents that depend on the absolute location of the loaded program (the linker’s to-do list)'], ['Symbol table', 'Global definitions and external references'], ['Debug info', 'How modules were compiled, so a debugger can map machine instructions to source lines']] }),
      B.p('S', 'L07 s6', R`<p><b>Linker</b> → executable image: (1) <b>merge segments</b> — place code and data modules symbolically in memory; (2) <b>resolve labels</b> — determine the addresses of data and instruction labels; (3) <b>patch</b> location-dependent and external references.</p>`),
      B.p('S', 'L07 s7', R`<p><b>Loader</b> (the OS): (1) read the header for segment sizes; (2) create a virtual address space; (3) copy text and initialised data into memory (or set page-table entries so they can be faulted in); (4) set up arguments on the stack; (5) initialise registers including $sp, $fp, $gp; (6) jump to the start-up routine, which copies arguments to $a0… and calls main, then does an exit syscall when main returns.</p>`),
    ] },
    { title: 'Java: interpret, then JIT-compile hot code', ref: 'L07 s8', blocks: [
      B.p('S', 'L07 s8', R`<p>Java compiles to <b>bytecode</b>, a simple portable instruction set for the <b>JVM</b>. The JVM <b>interprets</b> bytecodes, and a <b>JIT compiler</b> compiles the bytecodes of "hot" methods into native code for the host machine.</p>`),
      B.p('L', 'L07 [18:46]–[19:58]', R`<p>Hybrid: interpret cold code (runs rarely — quick to start), JIT-compile hot code (runs often — cached native code, close to C speed). Interpretation is simple but slow; JIT avoids paying that cost repeatedly.</p>`),
    ] },
    { title: 'Worked C → MIPS: swap', ref: 'L07 s9–s10', blocks: [
      B.p('S', 'L07 s9', R`<pre class="code nomath">void swap(int v[], int k) {
  int temp;
  temp = v[k];  v[k] = v[k+1];  v[k+1] = temp;
}        // v in $a0, k in $a1, temp in $t0  (a leaf procedure)</pre>`),
      B.wk({ src: 'S', ref: 'L07 s10; L07 [21:20]–[26:00]', title: 'swap body', steps: [
        [R`\(\texttt{sll \$t1, \$a1, 2}\)`, R`$t1 = k × 4: shifting left by 2 multiplies by \(2^2 = 4\) — the byte offset of v[k].`],
        [R`\(\texttt{add \$t1, \$a0, \$t1}\)`, '$t1 = v + k × 4 = address of v[k].'],
        [R`\(\texttt{lw \$t0, 0(\$t1)}\)`, 'temp = v[k].'],
        [R`\(\texttt{lw \$t2, 4(\$t1)}\)`, '$t2 = v[k+1], the next word, 4 bytes on.'],
        [R`\(\texttt{sw \$t2, 0(\$t1)}\)`, 'v[k] = v[k+1].'],
        [R`\(\texttt{sw \$t0, 4(\$t1)}\)`, 'v[k+1] = temp.'],
      ], result: 'Both values are loaded before either is stored; storing too early would destroy a value still needed (L07 [26:00]).' }),
      B.x(R`<p>Step through it: the data panel shows v[0…4] = 10, 20, 30, 40, 50. After the two loads, the two stores swap v[2] and v[3] (k = 2). Press ◀ Back to replay the order and convince yourself why both loads come first.</p>`),
      B.tool('mips', { preset: 'swap', presets: ['swap'] }),
    ] },
    { title: 'Effect of compiler, language and algorithm', ref: 'L07 s11–s13', blocks: [
      B.p('S', 'L07 s11–s13', R`<p>Bubble sort compiled with gcc for a Pentium 4 at none/O1/O2/O3: relative performance, instruction count, clock cycles and CPI all change — and CPI can rise while overall time still falls. C vs Java interpreted vs Java JIT: interpretation is slowest, JIT close to optimised C. Quicksort vs bubblesort: a speedup in the thousands. <b>Lessons</b>: instruction count and CPI are not good performance indicators in isolation; compiler optimisations are sensitive to the algorithm; <b>nothing can fix a dumb algorithm</b>. (See Topic 4 for the performance equation.)</p>`),
    ] },
    { title: 'Choosing an ISA; ARM, MIPS and x86', ref: 'L07 s14–s18', blocks: [
      B.p('S', 'L07 s14', R`<p>Minimise what? <b>Instructions/program × cycles/instruction × seconds/cycle</b>. In 1985–1995 technology, simple ISAs like MIPS were great; as technology changes, design options change. If memory is limited, dense instructions matter; for high speed, ease of pipelining matters.</p>`),
      B.tbl({ src: 'S', ref: 'L07 s15', head: ['', 'ARM', 'MIPS'], rows: [['Date announced', '1985', '1985'], ['Instruction size', '32 bits', '32 bits'], ['Address space', '32-bit flat', '32-bit flat'], ['Data alignment', 'Aligned', 'Aligned'], ['Registers', '15 × 32-bit', '31 × 32-bit'], ['Input/output', 'Memory mapped', 'Memory mapped']], caption: 'ARM is the most popular embedded core and has a similar basic instruction set to MIPS; per the lecture, ARM has more data addressing modes, MIPS more general-purpose registers (L07 [37:59]).' }),
      B.p('S', 'L07 s16–s17', R`<p>x86 history: 8086 (1978, 16-bit) → 8087 FPU → 80286 (24-bit addresses, protection) → 80386 (32-bit registers, flat addressing, paging) → 80486 (pipelining) → Pentium (superscalar) → Pentium Pro (out-of-order) → P-III (SSE). <b>Current approach</b> (Intel and AMD): decode logic translates x86 instructions into <b>RISC µops</b>; execution units run the µops; backward compatible; very complex decoder, but simpler control logic and datapaths in the execution unit. "We use MIPS to keep it simple and clean. Learn x86 on the job!"</p>`),
      B.p('L', 'L07 [40:31]', R`<p>"Modern Intel x86 processors are actually RISC machines wearing a CISC mask."</p>`),
      B.p('S', 'L07 s18', R`<p><b>Conclusions</b>: simple and regular (constant-length instructions, fields in the same place); small and fast (few operands, in registers); compromises are inevitable but pipelining should not be hindered; make the common case fast.</p>`),
    ] },
  ],
  keyPoints: [
    'C → compiler → assembly → assembler → object file → linker (+ libraries) → executable → loader → memory → CPU.',
    'Pseudo-instructions (move, blt) are expanded by the assembler using real instructions and $at.',
    'Object file: header, text, static data, relocation info, symbol table, debug info.',
    'Linker: merge segments, resolve labels, patch references. Loader: header, address space, copy, args on stack, init registers, jump to start-up.',
    'Java: bytecode interpreted by the JVM; hot methods JIT-compiled to native code.',
    'swap: sll k×4, add base, lw both, sw both — load before you overwrite.',
    'MIPS & ARM are RISC (1985, 32-bit); x86 is CISC outside, RISC µops inside.',
  ],
  traps: [
    '<b>Linker vs loader.</b> The linker resolves labels and patches addresses; the loader puts the executable into memory and starts it.',
    '<b>"move is a MIPS instruction."</b> It’s a pseudo-instruction (add with $zero).',
    '<b>Storing before loading both values in swap</b> loses one value.',
    '<b>sll by 2 = ×4</b>, not ×2.',
    '<b>JIT compiles everything at start-up</b> — no, only hot methods; the rest is interpreted.',
  ],
  };
