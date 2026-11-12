import { R, B } from '../../utils/dsl.js';

export default {
  id: 'amdahl', num: 5, file: 'amdahls-law', week: 2, lectures: ['L04'],
  title: "Amdahl's law and speedup", short: "Amdahl's law",
  keywords: 'amdahl law speedup fraction limit serial parallel common case fast time reduction percentage',
  taught: 'L04 s1–s11 (Week 2); reviewed R1 s11–s12; practised in PS1 Q1c, Q4, Q5.',
  overview: {
    lede: 'Improving one part of a program only speeds up that part. Amdahl’s law turns that into a number — and shows the hard ceiling set by the part you can’t improve.',
    about: R`<p>Speedup = old time ÷ new time. If only a fraction \(f\) of the old execution time is sped up by a factor \(s\), the rest \((1-f)\) still takes as long as before. This gives Amdahl's law, its limit \(1/(1-f)\), and the mathematical reason for "make the common case fast". The hardest part in tests is turning a percentage into the right \(s\).</p>`,
    canDo: ['Derive and apply Amdahl’s law step by step.', 'Find the maximum possible speedup and explain why the serial part limits parallel hardware.', 'Convert "x% less time" and "x% better performance" into s correctly.', 'Compare optimisation options and choose the better one.', 'Solve time-breakdown questions (which part takes how long after a change).'],
    buildsOn: ['perf', 'cpuperf'],
  },
  notation: [
    ['Speedup', 'old time ÷ new time (= new performance ÷ old performance)', '× (times), e.g. 1.25'],
    [R`\(f\)`, 'Fraction of the OLD execution time affected by the improvement', '0 to 1 (e.g. 95% → 0.95)'],
    [R`\(1-f\)`, 'Fraction of the old time NOT affected', ''],
    [R`\(s\)`, 'Speedup of the affected fraction only (how many times faster that part runs)', '× , e.g. 1.1 for 10%'],
    [R`\(x\%\)`, 'A percentage written as a decimal, e.g. 40% → 0.4', ''],
    [R`\(\lim_{s\to\infty}\)`, '"the value it approaches as s becomes infinitely large"', ''],
    [R`\(T_{old}, T_{new}\)`, 'Execution time before / after the improvement', 's'],
  ],
  steps: [
    { title: 'The idea: improvements are not uniform', ref: 'L04 s3', blocks: [
      B.p('S', 'L04 s3', R`<p>"The fundamental theorem of performance optimization", by Gene Amdahl (a designer of the IBM 360). Optimisations do not (generally) uniformly affect the whole program: the more widely applicable a technique, the more valuable; limited applicability can drastically reduce an optimisation's impact.</p>`),
      B.p('L', 'L04 [1:33]–[3:00]', R`<p>"Pay attention to this word, <b>uniformly</b>." It is the mathematical motivation for the great idea <i>make the common case fast</i>.</p>`),
      B.analogy('Your journey to campus', R`<p>Your trip takes 60 minutes: 50 minutes on the bus and 10 minutes walking. A new bus route is twice as fast: the bus part drops to 25 minutes, but you still walk for 10. New trip: 35 minutes. Speedup = 60 ÷ 35 ≈ 1.71 — not 2, because the walk didn't change. Even a teleporting bus leaves you with the 10-minute walk: at most 60 ÷ 10 = 6× faster. That is Amdahl's law in one paragraph.</p>`),
    ] },
    { title: 'Deriving the formula', ref: 'L04 s4–s5', blocks: [
      B.p('S', 'L04 s4', R`\[\text{Speedup} = \frac{\text{old time}}{\text{new time}} = \frac{\text{new rate}}{\text{old rate}}\]<p>Example: 10 s before, 5 s after → speedup 2.</p>`),
      B.wk({ src: 'S', ref: 'L04 s5; L04 [6:43]', title: 'Derivation', steps: [
        [R`\(T_{new} = (1-f)\,T_{old} + \dfrac{f}{s}\,T_{old}\)`, 'Unimproved part: unchanged. Improved part: its old share f·T_old, now s times faster, so divide by s.'],
        [R`\(\text{Speedup} = \dfrac{T_{old}}{(1-f)\,T_{old} + \dfrac{f}{s}\,T_{old}}\)`, 'Speedup = old ÷ new.'],
        [R`\(= \dfrac{1}{(1-f) + \dfrac{f}{s}}\)`, R`Every term has \(T_{old}\), so it cancels (divide top and bottom by it).`],
      ], result: R`\(\text{Speedup} = \dfrac{1}{(1-f) + f/s}\). Bigger f and bigger s both help.` }),
      B.key('Reading the formula as a picture', R`<p>Think of the old time as a bar of length 1. The part you don't touch is \(1 - f\) long and stays the same. The part you improve was \(f\) long and shrinks to \(f/s\). The new bar is \((1-f) + f/s\) long, and the speedup is just “old length ÷ new length” = \(1 \div \text{new length}\). The visualiser below draws exactly this.</p>`),
      B.fx('amdahl'),
      B.p('O', 'PS1-SOL Q1c', R`<p>Equivalent "time form" used in the official solutions (and P&H §1.10): \[T_{after} = \frac{T_{affected}}{\text{amount of improvement}} + T_{unaffected}\] Often quicker when you are given times rather than fractions.</p>`),
    ] },
    { title: 'Worked example: which upgrade should the boss buy?', ref: 'L04 s6', blocks: [
      B.wk({ src: 'S', ref: 'L04 s6; L04 [13:19]–[16:00]', title: 'Option 1: ALU used 95% of the time, made 10% faster. Option 2: memory pipeline used 5% of the time, made 10× faster.', steps: [
        [R`Option 1: \(f = 0.95,\ s = 1.1\)`, '"10% faster" for this part is read as s = 1.1 in the lecture.'],
        [R`\(\dfrac{1}{(1-0.95) + 0.95/1.1} = \dfrac{1}{0.05 + 0.8636} = \dfrac{1}{0.9136} \approx 1.094\)`, R`\(0.95 \div 1.1 = 0.86364\).`],
        [R`Option 2: \(f = 0.05,\ s = 10\): \(\dfrac{1}{0.95 + 0.005} = \dfrac{1}{0.955} \approx 1.047\)`, R`\(0.05 \div 10 = 0.005\).`],
        [R`Option 2 with \(s = \infty\): \(\dfrac{1}{0.95 + 0} \approx 1.052\)`, 'Even an infinitely fast memory pipeline gives only 5.2%.'],
      ], result: 'Option 1 wins: 9.4% vs 4.7%. A small gain on the common case beats a huge gain on a rare case.' }),
    ] },
    { title: 'The limit: the part you don’t improve', ref: 'L04 s7–s8', blocks: [
      B.p('S', 'L04 s7–s8', R`\[\lim_{s\to\infty} \frac{1}{(1-f) + f/s} = \frac{1}{1-f}\] <p>As s grows, \(f/s \to 0\). If \((1-f)\) is non-trivial, speedup is limited. Especially true for parallelism: a GPU with 1024 shader cores speeds the parallel part by 1024×, but the serial part limits it — <b>10% serial limits you to 10× speedup</b>.</p>`),
      B.p('L', 'L04 [21:48]–[25:46]; R1 Part I [31:58]', R`<p>20% serial → at most \(1/0.2 = 5\)×. 1% serial → at most \(1/0.01 = 100\)× "even if you used 1000 cores". 50% parallel → at most 2×. "Reducing serial portions remains the core challenge in parallel computing."</p>`),
      B.check(R`<p>A program spends 75% of its time in a loop you can parallelise perfectly. What is the most speedup any number of cores can give?</p>`, R`<p>Serial part \(1 - f = 0.25\), so the limit is \(1/0.25 = 4\)×. Even 1000 cores can't beat 4×.</p>`),
      B.tool('amdahl', { fm: 'pct', f1: 95, sm: 'x', s: 1.1 }),
    ] },
    { title: 'Turning percentages into s (the most-tested detail)', ref: 'L04 s9–s11; R1 s12', blocks: [
      B.p('S', 'L04 s9–s10', R`<p>s must be a multiplier ("× times"), not a percentage. If a part's execution time is <b>reduced by x%</b>:</p>\[T_{new} = (1 - x)\,T_{old} \;\Rightarrow\; s = \frac{T_{old}}{T_{new}} = \frac{1}{1-x}\]<p>e.g. 10% time reduction → \(s = 1/0.9 = 1.111\); 50% → \(s = 2\).</p>`),
      B.p('L', 'L04 [26:55]–[39:00]; R1 s12', R`<p>If <b>performance improves by x%</b>, the new performance is \((1 + x)\) times the old, so \(s = 1 + x\): +10% performance → \(s = 1.10\) (new time = \(T/1.1\), e.g. 10 s → 9.09 s); +50% performance → \(s = 1.5\) (10 s → 6.67 s). "Always determine whether the given percentage represents a reduction in time or an improvement in performance before using Amdahl's law."</p>`),
      B.tbl({ src: 'L', ref: 'L04 [32:45]–[34:30]', head: ['Statement (x = 10%)', 's', 'New time from 10 s'], rows: [['Time reduced by 10%', R`\(1/(1-0.1) = 1.111\)`, '9 s'], ['Performance improved by 10%', R`\(1 + 0.1 = 1.10\)`, R`\(10/1.1 = 9.09\) s`]] }),
      B.dis({ id: 'amdahl-pct', title: 'what does "sped up by x%" mean?', items: [
        ['Slide L04 s9', R`"If you were given that a fraction f is sped up by 50%, then: s = 1/(1−50%) = 2" — treats "sped up by x%" as a time reduction.`],
        ['Lecture recording L04 [26:55]–[28:33]', R`"if a particular component is said to have a 50% speedup … the corresponding speedup factor S is 1.5, not 0.5" — treats it as a performance increase, and says 50% time reduction ↔ s = 2.`],
        ['Official solution PS1 Q5b', R`"speedup either routine B by 20% or routine A by 30%" → uses \(s = 1/(1-0.2) = 1.25\) and \(1/(1-0.3) = 1.4286\) (time-reduction reading).`],
        ['Lecture example L04 s6', R`"improve the ALU … by 10%" → uses \(s = 1.1\) (performance reading).`],
      ], likely: R`When the wording is explicit, follow it: "execution time reduced by x%" → \(1/(1-x)\); "performance improved by x%" → \(1 + x\). When it only says "sped up by x%", the marker's own solutions (PS1 Q5) and slide s9 use \(1/(1-x)\) — use that, but <b>write your assumption in one line</b> so either reading gets credit. In PS1 Q5b both readings pick the same option.` }),
      B.fx('pct2s'),
    ] },
    { title: 'Time-breakdown questions and comparing options', ref: 'PS1 Q4–Q5; L04 s11', blocks: [
      B.wk({ src: 'A', ref: 'same method as PS1 Q4 (try that one in Practice below)', title: 'Program: 800 s; FP = 25% of the time, load/store = 40%', given: 'FP time cut by 50%, INT time up 10%. What is the new total and the % change?', steps: [
        [R`\(T_{FP} = 0.25 \times 800 = 200\ \text{s};\ \ T_{LS} = 0.40 \times 800 = 320\ \text{s}\)`, 'Percentages are of the total time.'],
        [R`\(T_{INT} = 800 - 200 - 320 = 280\ \text{s}\)`, 'INT is whatever is left.'],
        [R`\(T'_{FP} = 200 \times 0.5 = 100;\ \ T'_{INT} = 280 \times 1.1 = 308\)`, '−50% → ×0.5; +10% → ×1.1.'],
        [R`\(T_{new} = 100 + 320 + 308 = 728\ \text{s}\)`, 'Load/store unchanged.'],
        [R`\(\dfrac{800 - 728}{800} = \dfrac{72}{800} = 0.09 = 9\%\)`, 'Relative to the original time.'],
      ], result: '728 s: a 9% reduction.' }),
      B.wk({ src: 'A', ref: 'same method as PS1 Q5a (try that one in Practice below)', title: 'Routine D (60 s of a 150 s program) has its time cut by 25%', given: 'A program takes 150 s in total; routine D takes 60 s of it. A change reduces D’s execution time by 25%. Find the overall speedup and the new total time.', steps: [
        [R`s = \frac{1}{1 - 0.25} = \frac{1}{0.75} \approx 1.3333`, 'A 25% cut in time leaves 0.75 of it; speedup of that part = 1 ÷ 0.75.'],
        [R`f = \frac{60}{150} = 0.4`, 'D’s share of the ORIGINAL total time.'],
        [R`\frac{f}{s} = \frac{0.4}{1.3333} = 0.3`, 'The improved part’s new share (0.4 × 0.75).'],
        [R`\text{Speedup} = \frac{1}{(1 - 0.4) + 0.3} = \frac{1}{0.9} \approx 1.1111`, '1 − 0.4 = 0.6; add 0.3; then 1 ÷ 0.9.'],
        [R`T_{new} = \frac{150}{1.1111} = 135\ \text{s}`, 'New time = old time ÷ speedup.'],
        [R`\text{check: } 150 - 60 + 60 \times 0.75 = 90 + 45 = 135\ \text{s}`, 'Time form: the other routines (90 s) are unchanged and D drops to 45 s.'],
      ], result: 'Overall speedup ≈ 1.11; new time 135 s.' }),
      B.fx('amdahlTime'),
      B.tool('amdahlCompare'),
    ] },
  ],
  keyPoints: [
    R`\(\text{Speedup} = T_{old}/T_{new} = 1/\big((1-f) + f/s\big)\).`,
    'f = fraction of the OLD time that benefits; s = speedup of that part only.',
    R`Upper limit \(1/(1-f)\): the unimproved part becomes the bottleneck.`,
    'Make the common case fast: a small gain on 95% beats a 10× gain on 5%.',
    R`Time cut by x% → \(s = 1/(1-x)\). Performance up by x% → \(s = 1 + x\).`,
    'For parallel machines: the serial fraction caps the speedup no matter how many cores (10% serial → max 10×).',
  ],
  traps: [
    R`<b>Plugging a percentage in as s.</b> "20% faster" is never s = 0.2 (that would make it 5× slower).`,
    R`<b>Wrong conversion.</b> "Time reduced by 40%" → \(s = 1/0.6 = 1.667\), not 1.4.`,
    '<b>f from the wrong base.</b> f is a share of the original execution time — not of the instruction count and not of the new time.',
    '<b>Forgetting the unimproved part</b> when computing new time: add it back unchanged.',
    '<b>Speedup vs speedup of the part.</b> s is the part; the answer asks for the whole program.',
    '<b>Assuming more cores = proportionally faster.</b> Always check the serial fraction.',
  ],
  };
