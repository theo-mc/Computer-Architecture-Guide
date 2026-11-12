import { R, B } from '../../utils/dsl.js';

export default {
  id: 'cpuperf', num: 4, file: 'cpu-performance-equation', week: 1, weekLabel: '1–3', lectures: ['L03', 'L04', 'L07'],
  title: 'The CPU performance equation (iron law)', short: 'CPU time = IC × CPI × Tc',
  keywords: 'iron law cpu time instruction count cpi clock cycles per instruction mips rating average cpi mix benchmark spec compiler',
  taught: 'L03 s11–s23 (Week 1); MIPS metric L04 s12 (Week 2); compiler effects L07 s11–s14 (Week 3); R1 s8–s9.',
  overview: {
    lede: 'The most important equation in the module: CPU time = instruction count × cycles per instruction × seconds per cycle — and how every design decision moves one of the three terms.',
    about: R`<p>How long does a program take? Count the instructions it runs, multiply by how many clock cycles each takes on average, and multiply by how long one cycle lasts. That is the whole equation — the <b>iron law</b>:</p>\[\text{CPU time} = IC \times CPI \times T_c\]<p>Its three factors belong to different people: the <b>instruction count</b> to the algorithm, compiler and ISA; the <b>CPI</b> to the ISA and microarchitecture; the <b>clock period</b> to the chip technology. Almost every performance question in the module (and the pipelining questions later) is this equation in disguise. You will solve it forwards and backwards, compare machines, average CPI over a mix of instructions, and see why the MIPS rating misleads.</p>`,
    canDo: ['Write the iron law and say what determines each term.', 'Compute CPU time, or solve backwards for IC, CPI or the clock.', 'Compare two machines running the same program.', 'Compute average CPI from an instruction mix.', 'Compute a MIPS rating and explain its weaknesses.'],
    buildsOn: ['perf'],
  },
  notation: [
    [R`\(IC\)`, 'Instruction count: instructions <b>executed</b> (dynamic count, not lines of code)', 'e.g. 100, 10⁹'],
    [R`\(CPI\)`, 'Average clock cycles per instruction', 'cycles/instruction, e.g. 1.2'],
    [R`\(T_c\)`, 'Clock period (cycle time): seconds per cycle', 'ns, ps'],
    [R`\(f\)`, 'Clock rate = 1/T_c', 'GHz'],
    [R`\(CPI_i,\ C_i\)`, 'CPI of instruction class i, and how many class-i instructions run', ''],
    [R`\(\sum_i\)`, '"add up over every class i"', ''],
    [R`\(N\)`, 'Unknown instruction count that cancels when both machines run the same program', 'L03 s17'],
    ['MIPS (metric)', 'Millions of instructions per second — not the MIPS ISA', 'L04 s12'],
    ['SPEC', 'System Performance Evaluation Cooperative benchmark suites', 'L03 s21'],
  ],
  steps: [
    { title: 'From programs to instructions to cycles', ref: 'L03 s12', blocks: [
      B.p('S', 'L03 s12', R`<p>Hardware doesn't see programs — it sees <b>instructions</b>. At a lower level it breaks each instruction into <b>clock cycles</b> (state machines change state every cycle). So time = how many instructions × how many cycles each × how long a cycle lasts.</p>`),
      B.analogy('Climbing stairs', R`<p>Time to climb a tower = (number of flights) × (steps per flight, on average) × (seconds per step). A shorter tower (fewer instructions), shallower flights (lower CPI) or quicker legs (faster clock) all help — and you only get the time by multiplying all three.</p>`),
      B.key('Units cancel like fractions', R`\[\frac{\text{instructions}}{\text{program}} \times \frac{\text{cycles}}{\text{instruction}} \times \frac{\text{seconds}}{\text{cycle}} = \frac{\text{seconds}}{\text{program}}\]<p>“instructions” cancels with “instructions”, “cycles” with “cycles”, leaving seconds per program. If your units don't cancel to seconds, a term is upside down.</p>`),
    ] },
    { title: 'The iron law', ref: 'L03 s14–s15', blocks: [
      B.p('S', 'L03 s14', R`\[\text{CPU time} = \frac{\text{Seconds}}{\text{Program}} = \underbrace{\frac{\text{Instructions}}{\text{Program}}}_{IC\ (\text{code size})} \times \underbrace{\frac{\text{Cycles}}{\text{Instruction}}}_{CPI} \times \underbrace{\frac{\text{Seconds}}{\text{Cycle}}}_{T_c}\]<p>Architecture → implementation → realisation; compiler designer → processor designer → chip designer.</p>`),
      B.tbl({ src: 'S', ref: 'L03 s15, s22; L09 s4', head: ['Term', 'Determined by'], rows: [['IC — instructions per program', 'Algorithm, compiler, ISA (instructions <b>executed</b>, not static code size)'], ['CPI — cycles per instruction', 'ISA and CPU organisation (microarchitecture)'], [R`\(T_c\) — time per cycle`, 'Technology, organisation, clever circuit design']] }),
      B.p('L', 'L03 [32:48]–[33:54]', R`<p>"This is a dynamic instruction count, not the static code size": a loop of 3 instructions run 100 times contributes 300. CPI is an <b>average</b> because different instructions take different numbers of cycles.</p>`),
      B.p('S', 'L03 s16', R`<p><b>Minimise the product, not one term.</b> A common error: an ISA change that cuts instruction count but forces a microarchitecture with a slower clock. The terms are inter-related.</p>`),
      B.fx('iron'),
    ] },
    { title: 'Comparing two machines on the same program', ref: 'L03 s17–s19, R1 s9', blocks: [
      B.wk({ src: 'S', ref: 'L03 s17', title: 'A: clock 1 ns, CPI 2.0 · B: clock 2 ns, CPI 1.2 — which is faster?', given: 'Same program x, so the instruction count is the same unknown N.', steps: [
        [R`\(T_A = N \times 2.0 \times 1\,\text{ns} = 2N\ \text{ns}\)`, 'IC × CPI × clock period.'],
        [R`\(T_B = N \times 1.2 \times 2\,\text{ns} = 2.4N\ \text{ns}\)`, 'Same for B.'],
        [R`\(\dfrac{T_B}{T_A} = \dfrac{2.4N}{2N} = 1.2\)`, 'N cancels — that is why you don’t need the instruction count.'],
      ], result: 'A is 1.2 times faster than B.' }),
      B.wk({ src: 'S', ref: 'L03 s18', title: 'Equal performance: what CPI must A have?', given: R`\(T_{c,A} = 1\) ns, \(T_{c,B} = 2\) ns, \(CPI_B = 1.2\).`, steps: [
        [R`\(T_A = T_B \Rightarrow N \times CPI_A \times 1 = N \times 1.2 \times 2\)`, 'Equal performance means equal execution time.'],
        [R`\(CPI_A = \dfrac{1.2 \times 2}{1} = 2.4\)`, 'Cancel N, then divide by A’s clock period (1).'],
      ], result: R`\(CPI_A = 2.4\)` }),
      B.wk({ src: 'S', ref: 'L03 s19', title: 'Equal performance: what clock period must A have?', given: R`\(CPI_A = 2.0\), \(CPI_B = 1.2\), \(T_{c,B} = 2\) ns.`, steps: [
        [R`\(N \times 2.0 \times T_{c,A} = N \times 1.2 \times 2\)`, 'Equal times; the unknown is A’s clock period.'],
        [R`\(T_{c,A} = \dfrac{1.2 \times 2}{2.0} = \dfrac{2.4}{2.0} = 1.2\ \text{ns}\)`, 'Cancel N; divide by A’s CPI.'],
      ], result: R`\(T_{c,A} = 1.2\) ns — A needs a faster clock than B to make up for its higher CPI.` }),
      B.wk({ src: 'A', ref: 'same method as PS1 Q2 (try that one in Practice below)', title: '200 instructions on P1 (2.5 GHz, CPI 1.5), P2 (400 MHz, CPI 2) and P3 (1 ns cycle)', given: R`(a) Execution time on P1 and P2; which is faster? (b) P3 is three times slower than P2: find P3's CPI.`, steps: [
        [R`T_{P1} = 200 \times 1.5 \times \frac{1}{2.5 \times 10^{9}}\ \text{s} = \frac{300}{2.5 \times 10^{9}}\ \text{s}`, 'IC × CPI × clock period, and the period is 1 ÷ rate. 200 × 1.5 = 300.'],
        [R`= 120 \times 10^{-9}\ \text{s} = 120\ \text{ns}`, '300 ÷ 2.5 = 120; 1/10⁹ = 10⁻⁹ s = 1 ns.'],
        [R`T_{P2} = 200 \times 2 \times \frac{1}{400 \times 10^{6}} = \frac{400}{400 \times 10^{6}} = 10^{-6}\ \text{s} = 1\ \mu\text{s}`, '400 MHz = 400 × 10⁶ Hz; 400/400 = 1, leaving 1/10⁶ = 10⁻⁶ s.'],
        [R`\frac{1000\ \text{ns}}{120\ \text{ns}} \approx 8.33 \Rightarrow \text{P1 is about 8.33 times faster}`, '1 µs = 1000 ns; slower time ÷ faster time.'],
        [R`T_{P3} = 3 \times T_{P2} = 3 \times 10^{-6}\ \text{s}`, '“Three times slower” = takes three times as long.'],
        [R`CPI_{P3} = \frac{T_{P3}}{IC \times T_c} = \frac{3 \times 10^{-6}}{200 \times 10^{-9}}`, 'Rearrange the iron law for CPI. 1 ns = 10⁻⁹ s.'],
        [R`= \frac{3000 \times 10^{-9}}{200 \times 10^{-9}} = 15`, 'Write 10⁻⁶ as 1000 × 10⁻⁹ so the powers of ten cancel; 3000 ÷ 200 = 15.'],
      ], result: 'P1: 120 ns, P2: 1 µs (P1 faster); CPI of P3 = 15.' }),
      B.tool('cpuTime', { ic: 100, cpi: 2, cm: 'rate', ck: 2, cku: 'GHz', t: '' }),
    ] },
    { title: 'Other forms of the same equation', ref: 'L03 s22, R1 s8', blocks: [
      B.p('S', 'R1 s8', R`<p>Use whichever form matches the data you're given:</p>\[\text{CPU time} = \frac{IC \times CPI}{\text{clock rate}} \qquad \text{CPU time} = \frac{\text{CPU clock cycles}}{\text{clock rate}}\]<p>Instructions per second:</p>\[\frac{IC}{\text{time}} = \frac{IC}{IC \times CPI / f} = \frac{f}{CPI}\]`),
      B.p('L', 'R1 Part I [17:07]–[18:10]', R`<p>"The throughput of a machine in instructions per second is directly proportional to its clock rate and inversely proportional to its CPI."</p>`),
      B.check(R`<p>A 3 GHz processor runs a program in 4.5 × 10⁹ clock cycles. How long does it take?</p>`, R`<p>\(\text{time} = \dfrac{\text{cycles}}{f} = \dfrac{4.5 \times 10^{9}}{3 \times 10^{9}} = 1.5\) s. The \(10^{9}\)s cancel; 4.5 ÷ 3 = 1.5.</p>`),
    ] },
    { title: 'Average CPI from an instruction mix', ref: 'L10 s21; P&H §1.6', blocks: [
      B.p('S', 'L10 s21', R`<p>Execution time of a whole program = sum over all instructions of (CPI × clock cycle time) = (# instructions) × (average CPI) × (clock cycle time).</p>`),
      B.p('T', 'P&H §1.6', R`\[\text{CPU clock cycles} = \sum_{i} \left(CPI_i \times C_i\right) \qquad \overline{CPI} = \frac{\sum_i CPI_i \times C_i}{IC}\]<p>\(C_i\) is how many instructions of class i ran. If you only know percentages, use them as the \(C_i\) (they add to 100).</p>`),
      B.wk({ src: 'T', ref: 'P&H §1.6 method', title: 'Mix: 40% ALU (CPI 1), 30% load (CPI 3), 20% store (CPI 2), 10% branch (CPI 2)', given: R`\(10^9\) instructions, 2 GHz clock.`, steps: [
        [R`\(\overline{CPI} = 0.4\times1 + 0.3\times3 + 0.2\times2 + 0.1\times2\)`, 'Each fraction × that class’s CPI.'],
        [R`\(= 0.4 + 0.9 + 0.4 + 0.2 = 1.9\)`, 'Multiply, then add.'],
        [R`\(\text{time} = \dfrac{10^9 \times 1.9}{2\times10^9} = 0.95\ \text{s}\)`, 'IC × CPI ÷ clock rate.'],
      ], result: R`Average CPI 1.9; CPU time 0.95 s.` }),
      B.x(R`<p>Why weight by how often each class runs? Imagine 100 instructions: 40 take 1 cycle, 30 take 3, 20 take 2, 10 take 2. Total cycles = 40 + 90 + 40 + 20 = 190, so 190 ÷ 100 = 1.9 cycles each on average. The weighted formula is exactly that calculation done with fractions.</p>`),
      B.fx('cpimix'),
      B.tool('cpiMix', { rows: [['ALU', 1, 40], ['Load', 3, 30], ['Store', 2, 20], ['Branch', 2, 10]], f: 2 }),
      B.warn('Plain average is wrong', R`<p>The plain average of the CPIs (1 + 3 + 2 + 2) ÷ 4 = 2 ignores how often each class runs. Only the weighted average (1.9 here) gives the right time.</p>`),
    ] },
    { title: 'What affects which term', ref: 'L03 s22; L07 s11–s13', blocks: [
      B.tbl({ src: 'S', ref: 'L03 s22', head: ['Component', 'Affects'], rows: [['Algorithm', 'IC, possibly CPI'], ['Programming language', 'IC, CPI'], ['Compiler', 'IC, CPI'], ['Instruction set architecture', R`IC, CPI, \(T_c\)`]] }),
      B.p('S', 'L07 s11–s13', R`<p>Compiling bubble sort with gcc at none/O1/O2/O3 on a Pentium 4 changes instruction count, clock cycles and CPI differently (CPI can even go up while time goes down). Lessons: <b>"Instruction count and CPI are not good performance indicators in isolation"</b>; "compiler optimizations are sensitive to the algorithm"; <b>"nothing can fix a dumb algorithm!"</b> (Quicksort vs bubblesort is a speedup in the thousands.)</p>`),
    ] },
    { title: 'Benchmarks', ref: 'L03 s20–s21', blocks: [
      B.p('S', 'L03 s20–s21', R`<p>Ideally you time your real workload. In practice you use <b>benchmarks</b>: programs chosen to predict real performance — cheaper, but are they representative and honest? ("benchmarketing"). <b>SPEC</b> (System Performance Evaluation Cooperative), formed in the 1980s to combat benchmarketing: SPEC89, 92, 95, 2000. SPEC2000 has 12 integer and 14 floating-point programs; a Sun Ultra-5 300 MHz reference machine scores 100; results are reported as the mean of ratios to the reference machine.</p>`),
    ] },
    { title: 'The MIPS metric (millions of instructions per second)', ref: 'L04 s12', blocks: [
      B.p('S', 'L04 s12', R`<p>MIPS = instruction count / (execution time × 10⁶). Faster computers have higher MIPS. <b>Issues:</b> it counts instructions but not what they do, so you can't compare computers with different ISAs; and MIPS varies between programs on the same computer.</p>`),
      B.dis({ id: 'mips-1e6', title: 'multiply or divide by 10⁶?', items: [['Slide L04 s12', R`"MIPS = Instruction Count / Execution Time x 10⁶" — read literally left to right, that multiplies by \(10^6\).`], ['Lecture recording L04 [40:27]', '"instruction count divided by the execution time and then scaled by the 10 to the power of 6" (doesn’t say which way).'], ['Textbook P&H §1.10', R`\(\text{MIPS} = \dfrac{\text{Instruction count}}{\text{Execution time} \times 10^6} = \dfrac{\text{Clock rate}}{CPI \times 10^6}\) — divide.`]], likely: R`Divide by \(10^6\): the name is "<i>millions</i> of instructions per second", so the instructions-per-second figure must be divided by a million. Write it with brackets: \(IC \div (T \times 10^6)\).` }),
      B.wk({ src: 'T', ref: 'P&H §1.10 formula', title: 'MIPS rating of the mix above', steps: [
        [R`\(\text{MIPS} = \dfrac{f}{CPI \times 10^6} = \dfrac{2 \times 10^9}{1.9 \times 10^6}\)`, 'Shortcut form: clock rate ÷ (CPI × a million).'],
        [R`\(= \dfrac{2}{1.9} \times 10^{3} \approx 1052.6\)`, R`\(10^9 / 10^6 = 10^3\).`],
      ], result: 'About 1053 MIPS.' }),
      B.fx('mips'),
      B.x(R`<p>Why MIPS misleads, in one example: compiler X turns a program into \(10^9\) instructions that run in 2 s (500 MIPS); compiler Y produces \(1.5 \times 10^9\) simpler instructions that run in 2.5 s (600 MIPS). Y has the higher MIPS rating but X finishes first. The slide's two issues (L04 s12) are exactly this: MIPS counts instructions, not what each one achieves. Only execution time is a fair comparison.</p>`),
    ] },
  ],
  keyPoints: [
    R`\(\text{CPU time} = IC \times CPI \times T_c = IC \times CPI / f = \text{cycles}/f\).`,
    'IC = dynamic count (instructions executed). CPI = average. Tc = 1/f.',
    'IC: algorithm, compiler, ISA. CPI: ISA, microarchitecture. Tc: technology, organisation, circuits.',
    'Minimise the product — improving one term can worsen another.',
    'Same program on two machines → IC cancels in the ratio.',
    R`Average CPI = \(\sum CPI_i \times C_i\) ÷ IC. Instructions per second = f / CPI.`,
    'MIPS = IC/(time × 10⁶); useless across different ISAs and varies by program.',
  ],
  traps: [
    '<b>Static vs dynamic count.</b> A 5-line loop run 100 times is 500 instructions.',
    R`<b>Mixing period and rate.</b> If given 2 GHz, either divide by \(2\times10^9\) or multiply by 0.5 ns — not both.`,
    '<b>Optimising one term.</b> Fewer instructions with a slower clock may be slower overall (L03 s16).',
    '<b>Weighted, not plain, average.</b> Average CPI weights each class by how often it runs.',
    '<b>MIPS comparisons across ISAs</b> are meaningless; across compilers, higher MIPS can even be slower.',
    '<b>Not cancelling N.</b> When comparing machines on the same program, call IC "N" — you don’t need its value.',
  ],
  };
