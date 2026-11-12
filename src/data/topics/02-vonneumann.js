import { R, B } from '../../utils/dsl.js';

export default {
  id: 'vonneumann', num: 2, file: 'von-neumann-isa-uarch', week: 1, lectures: ['L02', 'L09'],
  title: 'Von Neumann model, abstraction, ISA vs microarchitecture', short: 'Von Neumann, ISA vs µarch',
  keywords: 'von neumann control datapath abstraction layers isa microarchitecture uarch interface contract compiler operating system',
  taught: 'L02 s15–s28 (Week 1); recapped in L09 s3–s6 and R1 s5–s6. Practised in PS2 Q2 and Practice Test Q2.',
  overview: {
    lede: 'What every computer is made of, how layers of abstraction hide complexity, and the most important boundary in the module: the ISA (what the processor does) versus the microarchitecture (how it does it).',
    about: R`<p>Every computer computes, communicates and stores data. The <b>von Neumann model</b> organises this as a CPU — split into <b>control</b> and <b>datapath</b> — plus memory and I/O. Above and below the hardware sit <b>layers of abstraction</b>, each hiding the detail of the layer underneath.</p><p>One layer boundary matters more than all the others: the <b>ISA</b> (instruction set architecture) is the contract between software and hardware — <i>what</i> the processor does; the <b>microarchitecture</b> is one particular way of building it — <i>how</i> it does it. Tests ask you to sort features into one or the other (Practice Test Q2, PS2 Q2), so most of this topic builds a reliable way to decide.</p>`,
    canDo: ['Name the parts of the von Neumann model and say what control and datapath each do.', 'List the layers of abstraction from problem to electrons and say where the ISA sits.', 'Describe how high-level code becomes binary and where it is stored (R1 s6).', 'Define ISA and microarchitecture, and classify any feature as one or the other with a reason.', 'Explain why one ISA (e.g. x86) has many microarchitectures, and why software still sees a simple one-at-a-time machine.'],
    buildsOn: ['arch'],
  },
  notation: [
    ['ISA', 'Instruction Set Architecture: everything about the computer that the low-level (assembly) programmer can see and must know', 'MIPS, x86, ARM'],
    ['uARCH / µarch', 'Microarchitecture: the internal design that implements an ISA; invisible to software', 'pipelining, caches'],
    ['CPU', 'Central processing unit = control + datapath', ''],
    ['Datapath', 'The functional units (ALU …), storage (register file) and the wires and multiplexers between them. It does the work', 'L02 s18'],
    ['Control', 'Fetches and decodes instructions and sends signals telling the datapath what to do, step by step', 'L02 s18'],
    ['I/O', 'Input/output devices: keyboard, screen, network …', ''],
    ['ABI', 'Application binary interface: the ISA plus the operating-system interface a compiled program relies on', 'L02 s20'],
    ['HLL', 'High-level language (C, Java, Python)', 'L02 s21'],
    ['VM / OS / MM', 'Virtual machine / operating system / memory management (the runtime-system layer)', 'L02 s20'],
  ],
  steps: [
    { title: 'What every computer has', ref: 'L02 s17', blocks: [
      B.x(R`<p>Phones, laptops and servers look nothing alike, but strip them down and they all do the same three jobs. Knowing these three jobs makes the rest of the module easier to place: processors are about <i>computation</i>, buses and networks about <i>communication</i>, caches and DRAM about <i>storage</i>.</p>`),
      B.p('S', 'L02 s17', R`<p>Three key components for every type of computer (embedded, personal, server): <b>computation</b>, <b>communication</b>, <b>storage (memory)</b> — and of course <b>input/output</b> interfaces to the outside world.</p>`),
    ] },
    { title: 'The von Neumann model: control, datapath, memory and I/O', ref: 'L02 s18–s19, L09 s6, R1 s5', blocks: [
      B.x(R`<p>In 1945 John von Neumann described the organisation nearly every computer still uses. Its key idea: <b>the program is stored in memory, alongside the data</b>. The processor repeatedly fetches the next instruction from memory, works out what it means, and carries it out. That fetch → decode → execute loop never stops while the computer runs.</p>`),
      B.dia({ src: 'S', ref: 'L02 s18', ascii: `+--------------------- CPU ----------------------+
|   +-----------+   control signals  +-----------+ |      +----------+
|   |  CONTROL  | -----------------> | DATAPATH  | | <--> |  MEMORY  |
|   | fetch,    |                    | ALU, reg  | |      | instrs + |
|   | decode,   | <----------------- | file, ... | |      |   data   |
|   | sequence  |   status (e.g.Zero)+-----------+ |      +----------+
|   +-----------+                                  |
+--------------------------------------------------+ <--> Input / Output devices
        Instruction flow:  Fetch -> Decode -> Exec -> (Fetch ...)`, svg: `<svg viewBox="0 0 620 230" width="620"><rect x="10" y="20" width="380" height="170" rx="14" fill="var(--accent-soft)" stroke="var(--accent)"/><text x="24" y="42" font-size="13" font-weight="700" fill="var(--accent)">CPU</text><rect x="30" y="60" width="150" height="110" rx="10" fill="var(--panel-solid)" stroke="var(--border-strong)"/><text x="105" y="95" font-size="14" font-weight="650" text-anchor="middle" fill="var(--fg)">Control</text><text x="105" y="117" font-size="11" text-anchor="middle" fill="var(--muted)">fetch · decode</text><text x="105" y="133" font-size="11" text-anchor="middle" fill="var(--muted)">issue signals</text><text x="105" y="149" font-size="11" text-anchor="middle" fill="var(--muted)">sequence instrs</text><rect x="220" y="60" width="150" height="110" rx="10" fill="var(--panel-solid)" stroke="var(--border-strong)"/><text x="295" y="95" font-size="14" font-weight="650" text-anchor="middle" fill="var(--fg)">Datapath</text><text x="295" y="117" font-size="11" text-anchor="middle" fill="var(--muted)">ALU, register file</text><text x="295" y="133" font-size="11" text-anchor="middle" fill="var(--muted)">muxes, wires</text><text x="295" y="149" font-size="11" text-anchor="middle" fill="var(--muted)">does the work</text><path d="M180 100 H220" stroke="var(--c-orange)" stroke-width="2" marker-end="url(#ah)"/><text x="200" y="92" font-size="9.5" text-anchor="middle" fill="var(--c-orange)">signals</text><rect x="440" y="30" width="160" height="70" rx="10" fill="var(--panel-solid)" stroke="var(--border-strong)"/><text x="520" y="62" font-size="14" font-weight="650" text-anchor="middle" fill="var(--fg)">Memory</text><text x="520" y="82" font-size="11" text-anchor="middle" fill="var(--muted)">instructions + data</text><rect x="440" y="125" width="160" height="60" rx="10" fill="var(--panel-solid)" stroke="var(--border-strong)"/><text x="520" y="160" font-size="14" font-weight="650" text-anchor="middle" fill="var(--fg)">Input / Output</text><path d="M390 70 H440 M390 155 H440" stroke="var(--fg)" stroke-width="1.6"/><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="var(--c-orange)"/></marker></defs><text x="200" y="215" font-size="12" text-anchor="middle" fill="var(--muted)">Fetch → Decode → Execute → Fetch …</text></svg>`, caption: 'Processor organisation in the von Neumann model.' }),
      B.p('S', 'L02 s18, L09 s6', R`<p><b>Control</b> must: input instructions from memory (fetch); issue signals to control the flow of information between datapath components and what operations they perform (decode); control the sequencing of instructions.</p><p><b>Datapath</b> must have: the components — functional units and storage (e.g. the register file) — needed to execute instructions; and the interconnects, so instructions can be carried out and data loaded from and stored to memory.</p>`),
      B.p('L', 'L09 [8:46]', R`<p>The lecturer's memory aid, repeated three times: “the control unit tells the datapath what work to do, and the datapath actually does it.”</p>`),
      B.analogy('A kitchen', R`<p>The <b>recipe book</b> is memory (it holds both the recipe — the program — and the ingredient list — the data). The <b>head chef</b> is control: reads the next line of the recipe and tells the cooks what to do. The <b>cooks and their knives, pans and ovens</b> are the datapath: they actually chop and cook. The <b>serving hatch</b> is I/O.</p>`),
      B.p('S', 'L02 s19', R`<p>Inside a real CPU (the Apple A5 die photo) you also find <b>cache memory</b>: small, fast SRAM for immediate access to data, which reduces the impact of the memory wall (Topic 01).</p>`),
      B.check(R`<p>Which part decides that the next instruction is an <code>add</code> and sets the ALU to add — and which part actually adds the two numbers?</p>`, R`<p><b>Control</b> decodes the instruction and sends the “add” signal; the <b>datapath</b> (its ALU) does the addition and the register file stores the result.</p>`),
    ] },
    { title: 'Layers of abstraction: each layer hides the one below', ref: 'L02 s20–s22, R1 s6', blocks: [
      B.x(R`<p>Nobody could design a billion-transistor chip, or write a web browser, if they had to think about every electron. <b>Abstraction</b> (great idea #2) splits the problem into layers. Each layer offers a simple interface to the layer above and hides its own details. A Python programmer doesn't think about transistors; a transistor designer doesn't think about Python.</p>`),
      B.p('S', 'L02 s20', R`<p>The layers, top to bottom: <b>Problem → Algorithm → Program/Language → Runtime system (VM, OS, MM) → ISA → Microarchitecture → Logic → Circuits → Electrons</b>. The ISA is “the hardware/software interface”; the ABI is the ISA plus the system-software interface; the implementation is the detail underneath an interface.</p>`),
      B.tool('layers'),
      B.p('S', 'L02 s21–s22', R`<ul><li><b>Levels of program code:</b> high-level language (close to the problem; productivity and portability) → assembly language (a textual form of instructions) → hardware representation (binary digits: encoded instructions and data).</li><li><b>Underneath your program:</b> application software (in a HLL) → system software: the <b>compiler</b> translates HLL to machine code, and the <b>operating system</b> handles I/O, manages memory and storage, and schedules tasks and shares resources → hardware (processor, memory, I/O controllers).</li></ul>`),
      B.p('S', 'R1 s6', R`<p>The review slide asks you to describe the steps for running high-level code: <b>application software (e.g. C) → compiler → assembler → binary code</b>, and where the binary is stored: “on memory or better on instruction memory/cache”. Topic 09 follows this chain in detail.</p>`),
      B.check(R`<p>In the layer list, which layer is directly above the microarchitecture, and which is directly below it?</p>`, R`<p>Above it: the <b>ISA</b> (the interface it implements). Below it: <b>logic</b> (the gates it is built from).</p>`),
    ] },
    { title: 'ISA vs microarchitecture: what versus how', ref: 'L02 s23–s24', blocks: [
      B.p('S', 'L02 s23', R`<p><b>ISA:</b> “describes the aspects of a computer architecture visible to the low-level programmer, including the native datatypes, instructions, registers, addressing modes, memory architecture, interrupt and exception handling, and I/O organization.”</p><p><b>Microarchitecture:</b> “the set of internal processor design techniques used to implement the instruction set (including microcode, pipelining, cache systems etc.)”</p>`),
      B.p('S', 'L02 s24', R`<ul><li>The ISA is the agreed interface between software and hardware: “SW/compiler assumes, HW promises”. It is what a software writer needs to know to write and debug programs.</li><li>The microarchitecture is a specific implementation of an ISA, <b>not visible to software</b>.</li><li>Microprocessor = ISA + uarch + circuits. “Architecture” = ISA + microarchitecture.</li></ul>`),
      B.p('L', 'L02 [33:58]–[36:22]', R`<p>The lecturer's rule: <b>“ISA is about <i>what</i>, and the microarchitecture is about <i>how</i>.”</b> The ISA is a contract; hardware designers may use any trick they like as long as the final behaviour honours it.</p>`),
      B.analogy('The car (from the lecture)', R`<p>The <b>accelerator pedal</b> is the interface: press it and the car speeds up (ISA). The <b>engine</b> — petrol V8, electric, hybrid — is how that promise is kept (microarchitecture). You can change the engine completely and every driver still knows how to drive the car. You can't move the pedal to the roof without retraining every driver: that would be an ISA change.</p>`),
      B.key('The test that decides every classification question', R`<p>Ask: <b>“Would an assembly programmer have to know this to write a correct program?”</b></p><ul><li><b>Yes</b> — it changes which instructions exist, what they do, how many registers there are, how memory is addressed → <b>ISA</b>.</li><li><b>No</b> — it only changes how fast, how big, how much power, how much it costs → <b>microarchitecture</b>.</li></ul>`),
    ] },
    { title: 'Sorting features: worked classification', ref: 'L02 s25–s27 · PS2 Q2 · Practice Test Q2', blocks: [
      B.p('S', 'L02 s25', R`<ul><li><b>Add instruction vs adder:</b> the add instruction is ISA; whether it's built as a bit-serial, ripple-carry or carry-lookahead adder is microarchitecture.</li><li><b>x86</b> has many implementations: 286, 386, 486, Pentium, Pentium Pro, Pentium 4, Core …</li><li>Microarchitecture usually changes faster than the ISA: few ISAs (x86, ARM, SPARC, MIPS, Alpha) but many microarchitectures.</li></ul>`),
      B.tbl({ src: 'S', ref: 'L02 s26–s27', head: ['ISA (L02 s26)', 'Microarchitecture (L02 s27)'], rows: [
        ['Instructions: opcodes, addressing modes, data types', 'Pipelining'],
        ['Instruction types and formats', 'In-order vs out-of-order execution'],
        ['Registers, condition codes', 'Memory access scheduling policy'],
        ['Memory: address space, addressability, alignment', 'Speculative execution'],
        ['Virtual memory management', 'Superscalar processing (multiple issue)'],
        ['Call, interrupt/exception handling', 'Clock gating'],
        ['Access control, priority/privilege', 'Caching: levels, size, associativity, replacement policy'],
        ['I/O: memory-mapped vs instructions', 'Prefetching'],
        ['Task/thread management; power and thermal management; multi-threading and multiprocessor support', 'Voltage/frequency scaling; error correction'],
      ], caption: 'If an assembly programmer would notice it or need to know it, it’s ISA. If it only changes speed, cost or power, it’s microarchitecture.' }),
      B.wk({ src: 'A', ref: 'method applied to PS2 Q2 / Practice Test Q2 items', title: 'Classify four features, with a reason each', given: '(a) the number of general-purpose registers; (b) a hardware multiplier that takes 3 cycles; (c) the processor has no subtract instruction; (d) a 32 KB data cache.', steps: [
        ['(a) ISA', 'Instructions name registers ($t0 … $s7). A programmer must know how many exist to write code at all.'],
        ['(b) microarchitecture', 'The multiply instruction does the same thing however the multiplier is built; only the time changes.'],
        ['(c) ISA', 'Which instructions exist is part of the contract: the programmer must write a − b differently if there is no subtract.'],
        ['(d) microarchitecture', 'A cache only changes how fast memory accesses are; the program’s result is the same with or without it.'],
      ], result: 'ISA, µarch, ISA, µarch — and in the test, each answer needs its one-line reason.' }),
      B.tool('isaSort'),
      B.warn('The tricky ones', R`<ul><li><b>Number of registers</b> → ISA (programmers name them).</li><li><b>Number of register-file ports</b>, <b>type of multiplier</b>, <b>adder design</b> → microarchitecture (hardware units).</li><li><b>Cache size</b> → microarchitecture, even though it sounds “architectural”.</li><li><b>Size of instructions</b> (e.g. all 32 bits) → ISA; <b>number of pipeline stages</b> → microarchitecture (R1 s6's own example).</li></ul>`),
    ] },
    { title: 'Why software still sees a simple machine', ref: 'L02 s28', blocks: [
      B.p('S', 'L02 s28', R`<p>All major ISAs today (x86, ARM, MIPS, SPARC, Alpha, POWER) use the von Neumann model: instructions appear to run one after another. Underneath, almost every microarchitecture is very different: pipelined execution (Intel 80486), multiple instructions at a time (Pentium), out-of-order execution (Pentium Pro), separate instruction and data caches. Whatever happens underneath that isn't consistent with the von Neumann model is <b>not exposed to software</b> — which is exactly the difference between ISA and microarchitecture.</p>`),
      B.p('L', 'L02 [39:16]', R`<p>“The software sees the relatively simple sequential von Neumann model, while the hardware performs complex tricks to run it as fast as possible.”</p>`),
      B.x(R`<p>This is why the second half of Test 1 (pipelining and hazards) matters: a pipeline overlaps instructions, and <b>hazards</b> are exactly the situations where that overlap could break the illusion. Stalls and forwarding are the tricks that keep the illusion intact.</p>`),
    ] },
  ],
  keyPoints: [
    'Computers = computation + communication + storage, plus I/O.',
    'Von Neumann: the program is stored in memory with the data. CPU = control (fetch, decode, sequence) + datapath (functional units, registers, interconnect).',
    '“Control tells the datapath what work to do; the datapath actually does it.”',
    'Layers: problem → algorithm → program → runtime (VM, OS, MM) → ISA → microarchitecture → logic → circuits → electrons.',
    'ISA = what the processor does, visible to the programmer (instructions, registers, data types, addressing modes, memory model, interrupts, I/O).',
    'Microarchitecture = how it is implemented, invisible to software (pipelining, caches, out-of-order, multiplier design …).',
    'Decision test: would an assembly programmer need to know it? Yes → ISA; no (only speed/cost/power) → microarchitecture.',
  ],
  traps: [
    '<b>“Number of registers” is ISA, not microarchitecture</b> — programmers name them in instructions (Practice Test Q2ii).',
    '<b>Hardware units (multipliers, adders, ALU sub-units, register-file ports) are microarchitecture</b> even though they “do” instructions (PS2 Q2a, b, e; Practice Test Q2iii).',
    '<b>Missing instructions are ISA</b>: “no subtract instruction”, “no multiply-accumulate instruction” (PS2 Q2c, d).',
    '<b>Cache = microarchitecture</b>, even though caches feel “architectural” (L02 s27).',
    '<b>Swapping control and datapath roles.</b> Control decides and sequences; the datapath computes and stores.',
    '<b>Answer the “why”</b>: in classification questions add a short reason (visible to the programmer or not).',
  ],
  };
