import { R, B } from '../../utils/dsl.js';

export default {
  id: 'perf', num: 3, file: 'performance-basics', week: 1, lectures: ['L03'],
  title: 'Performance: definitions, comparisons and clocks', short: 'Performance & comparisons',
  keywords: 'performance execution time response time throughput faster times percentage change clock rate period frequency ghz ns ps units',
  taught: 'L03 s1–s13 (Week 1). Reviewed in R1 s7 and s10. Practised in PS1 Q1a and Practice Test Q1ii.',
  overview: {
    lede: 'Performance = 1 / time. How to say "n times faster" correctly, the percentage-change trap, and converting between clock rate and clock period.',
    about: R`<p>“Faster” sounds obvious until you have to put a number on it. This topic builds four habits you will use in every performance question for the rest of the module:</p><ol><li>Performance is the <b>reciprocal</b> of execution time: \(\text{Perf} = 1/T\). Less time, more performance.</li><li>“A is n times faster than B” means \(n = T_B / T_A\) — the slower time goes on top.</li><li>A percentage change in <b>time</b> is a different number from the percentage change in <b>performance</b>, and the reference value always goes underneath.</li><li>The clock's <b>period</b> (seconds per cycle) is 1 ÷ its <b>rate</b> (cycles per second), and you must be fluent with GHz, MHz, ns and ps.</li></ol><p>Step 1 starts with the powers-of-ten toolkit, because every unit slip in this module comes from there.</p>`,
    canDo: ['Explain response time vs throughput and which improvements help which.', 'Compute "n times faster" from two execution times and phrase it correctly.', 'Compute a percentage change in time and in performance, with the right reference.', 'Convert clock rates and periods across GHz/MHz and ns/ps.'],
    buildsOn: ['arch'],
  },
  notation: [
    [R`\(T\), \(T_A\)`, 'Execution (response) time of a program, on machine A', 's, ms, µs, ns'],
    [R`\(\text{Perf}\)`, 'Performance = 1 / T. Bigger is better', '1/s'],
    [R`\(n\)`, '"how many times faster": always ≥ 1', 'no unit'],
    [R`\(\%\Delta\)`, 'Percentage change = (new − old)/old × 100', '%'],
    ['Throughput', 'Work done per unit time (e.g. jobs per second)', 'jobs/s'],
    [R`\(f\)`, 'Clock rate / frequency: cycles per second', 'Hz; 1 GHz = 10⁹ Hz'],
    [R`\(T_c\)`, 'Clock period / cycle time: seconds per cycle', 's; 1 ns = 10⁻⁹ s; 1 ps = 10⁻¹² s'],
    ['ms, µs, ns, ps', 'milli, micro, nano, pico seconds', '10⁻³, 10⁻⁶, 10⁻⁹, 10⁻¹² s'],
    ['kHz, MHz, GHz', 'kilo, mega, giga hertz', '10³, 10⁶, 10⁹ Hz'],
  ],
  steps: [
    { title: 'Toolkit: powers of ten and unit prefixes', ref: 'L03 s13 · R1 s7', blocks: [
      B.x(R`<p>Computer times are tiny and clock rates are huge, so every question uses prefixes like “nano” and “giga”. Each prefix is just shorthand for a power of ten. Get these right and most performance questions become simple multiplication.</p>`),
      B.tbl({ src: 'S', ref: 'L03 s13, R1 s7', head: ['Prefix', 'Means', 'Example'], rows: [['k (kilo)', R`\(10^{3}\) = 1 000`, '1 kHz = 1 000 Hz'], ['M (mega)', R`\(10^{6}\) = 1 000 000`, '500 MHz = \\(500 \\times 10^{6}\\) Hz'], ['G (giga)', R`\(10^{9}\) = 1 000 000 000`, '4 GHz = \\(4 \\times 10^{9}\\) Hz'], ['m (milli)', R`\(10^{-3}\) = 0.001`, '1 ms = 0.001 s'], ['µ (micro)', R`\(10^{-6}\)`, '1 µs = 0.000001 s'], ['n (nano)', R`\(10^{-9}\)`, '1 ns = 0.000000001 s'], ['p (pico)', R`\(10^{-12}\)`, '250 ps = \\(250 \\times 10^{-12}\\) s = 0.25 ns']], caption: 'Each step down the time column is 1000 times smaller: 1 s = 1000 ms = 1 000 000 µs = 10⁹ ns = 10¹² ps.' }),
      B.key('Three rules that do all the work', R`<ol><li><b>Multiplying</b> powers of ten: add the exponents. \(10^{9} \times 10^{-12} = 10^{9 + (-12)} = 10^{-3}\).</li><li><b>Dividing</b>: subtract them. \(\dfrac{10^{6}}{10^{9}} = 10^{6-9} = 10^{-3}\).</li><li><b>One over</b> a power of ten flips the sign: \(\dfrac{1}{10^{9}} = 10^{-9}\). So “one over giga” is “nano”.</li></ol>`),
      B.wk({ src: 'A', ref: 'unit practice', title: 'Convert 0.5 GHz to MHz, and 2.5 ns to ps', steps: [
        [R`0.5\ \text{GHz} = 0.5 \times 10^{9}\ \text{Hz}`, 'Replace the prefix G by its power of ten.'],
        [R`= 0.5 \times 10^{3} \times 10^{6}\ \text{Hz} = 500 \times 10^{6}\ \text{Hz} = 500\ \text{MHz}`, '10⁹ = 10³ × 10⁶, and 0.5 × 10³ = 500. Then 10⁶ Hz is MHz.'],
        [R`2.5\ \text{ns} = 2.5 \times 10^{-9}\ \text{s} = 2.5 \times 10^{3} \times 10^{-12}\ \text{s}`, '10⁻⁹ = 10³ × 10⁻¹² (because 3 + (−12) = −9).'],
        [R`= 2500 \times 10^{-12}\ \text{s} = 2500\ \text{ps}`, '2.5 × 1000 = 2500, and 10⁻¹² s is a picosecond.'],
      ], result: '0.5 GHz = 500 MHz; 2.5 ns = 2500 ps.' }),
      B.check(R`<p>Is 300 ps more or less than 0.5 ns?</p>`, R`<p>Less. 0.5 ns = 0.5 × 1000 ps = 500 ps, and 300 ps &lt; 500 ps.</p>`),
    ] },
    { title: '"Best performance" depends on who is asking', ref: 'L03 s3–s5', blocks: [
      B.p('S', 'L03 s3–s4', R`<p>Which aeroplane is best — fastest (Concorde), most passengers (747), longest range? It depends who is asking (L03 s3). For computers there are two views:</p><ul><li><b>Computer user</b>: minimise <b>response time / execution time</b> = time_end − time_start for a task.</li><li><b>Computer-centre manager</b>: maximise <b>throughput</b> = jobs (tasks, transactions) completed per unit time.</li></ul>`),
      B.p('S', 'L03 s5', R`<ul><li><b>Faster CPU</b> → helps response time AND throughput.</li><li><b>Add more CPUs</b> → helps throughput, and perhaps response time (less waiting in a queue for one CPU).</li></ul>`),
    ] },
    { title: 'Performance is one over time', ref: 'L03 s6', blocks: [
      B.p('S', 'L03 s6', R`<p>For computer architects the measure is <b>CPU time</b>: time spent running a program. Elapsed time = CPU time + I/O wait; this module concentrates on CPU (execution) time. Because "bigger should be better":</p>\[\text{Performance}_X = \frac{1}{\text{Execution time}_X}\]<p>Example: CPU1 takes 1 s, CPU2 takes 2 s → CPU1 has the higher performance (twice CPU2's).</p>`),
      B.x(R`<p>Why the reciprocal? We want a number where <b>bigger means better</b>, like a speed. Time is the opposite: bigger is worse. Taking 1 ÷ time turns one into the other: 1 s → performance 1; 2 s → performance 0.5. Half the performance, because it takes twice as long.</p>`),
      B.analogy('Speed and journey time', R`<p>Driving 100 km at 100 km/h takes 1 hour; at 50 km/h it takes 2 hours. Speed (performance) and time are reciprocals for the same job. Doubling the speed halves the time.</p>`),
    ] },
    { title: '"A is n times faster than B"', ref: 'L03 s7–s8', blocks: [
      B.p('S', 'L03 s7', R`\[\text{A is } n \text{ times faster than B} \iff \frac{\text{Perf}_A}{\text{Perf}_B} = n \iff \frac{T_B}{T_A} = n\]<p>Dividing performances flips into dividing times the other way round: the <b>slower time goes on top</b>.</p>`),
      B.wk({ src: 'S', ref: 'L03 s7–s8', title: 'Machine A takes 10 s, machine B takes 15 s', given: 'Which machine is faster and by how much?', steps: [
        [R`\(T_A = 10\ \text{s} < T_B = 15\ \text{s}\)`, 'Less time = more performance, so A is faster.'],
        [R`\(n = \dfrac{T_B}{T_A} = \dfrac{15}{10} = 1.5\)`, 'Slower time over faster time.'],
      ], result: 'A is 1.5 times faster than B.' }),
      B.p('L', 'L03 [12:37]', R`<p>"We don't say machine B is 1.5 times slower… the faster machine is x times faster than the slower machine." Use that phrase in the test.</p>`),
      B.key('Why the slower time goes on top', R`\[n = \frac{\text{Perf}_A}{\text{Perf}_B} = \frac{1/T_A}{1/T_B} = \frac{1}{T_A} \times \frac{T_B}{1} = \frac{T_B}{T_A}\]<p>Dividing by a fraction is the same as multiplying by it flipped over. So a ratio of performances becomes the ratio of times <i>upside down</i>. A quick sanity check: \(n\) must come out as 1 or more. If you get 0.67, you divided the wrong way.</p>`),
      B.fx('faster'),
    ] },
    { title: 'Percentage change — and the time-vs-performance trap', ref: 'L03 s9–s10, R1 s10', blocks: [
      B.p('S', 'L03 s9', R`\[\%\Delta = \frac{\text{new} - \text{reference}}{\text{reference}} \times 100\]<p>Positive = increase, negative = decrease. "What you use as reference (denominator) plays a role": \((10-6)/6\) gives a different number from \((6-10)/10\).</p>`),
      B.wk({ src: 'S', ref: 'L03 s10', title: 'A machine is redesigned: execution time goes from 10 s to 6 s — time change', steps: [
        [R`\(\%\Delta T = \dfrac{6 - 10}{10} \times 100\)`, 'Old (10 s) is the reference.'],
        [R`\(= \dfrac{-4}{10} \times 100 = -40\%\)`, 'Negative = a decrease.'],
      ], result: 'The new machine has 40% less execution time.' }),
      B.wk({ src: 'L', ref: 'L03 [22:30]–[24:58]', title: 'Same redesign — performance change', steps: [
        [R`\(\text{Perf}_{old} = \dfrac{1}{10} = 0.1,\quad \text{Perf}_{new} = \dfrac{1}{6} \approx 0.1667\)`, 'Turn times into performances first: P = 1/T.'],
        [R`\(\%\Delta \text{Perf} = \dfrac{0.1667 - 0.1}{0.1} \times 100\)`, 'Same percentage-change formula, now on performance.'],
        [R`\(= \dfrac{0.0667}{0.1} \times 100 \approx 66.7\%\)`, R`Exactly: \(10/6 - 1 = 0.6667\).`],
      ], result: 'Performance went up by about 66.7% (the lecturer says "67 or 66%").' }),
      B.dis({ id: 'perf-pct', title: '10 s → 6 s: is the answer −40% or +66.7%?', items: [['Slide L03 s10', R`Answer given: \([(6-10)/10] \times 100 = -40\%\), "the new machine has 40% less execution time", titled "relative performance change".`], ['Lecture recording L03 [21:15]', '"If we have the same answer [−40%], you are wrong … the 66% is the correct answer" — for the <i>performance</i> change.']], likely: R`Both numbers are right for different quantities. Read the question: "change in execution time" → −40%; "change/improvement in performance" → +66.7%. If it says "relative performance change" (the slide's wording) give the performance figure and also state the time figure, with one line saying which is which. The lecturer clearly treats confusing the two as the classic mistake.` }),
      B.p('S', 'R1 s10', R`<p>Review example: \(T_A = 2N\), \(T_B = 2.4N\). Comparing A's performance to B's (B is the reference): \((T_B - T_A)/T_A = 0.4N/2N = 0.2\) → A has 20% higher performance. The other way round (A is the reference): \((T_A - T_B)/T_B = -0.4N/2.4N = -0.1667\) → B's performance is about 16.7% lower. Different references, different numbers. Caution: \(T_A = T_B / 1.2\) but \(\text{Perf}_A = 1.2 \times \text{Perf}_B\).</p>`),
      B.fx('pct'),
      B.check(R`<p>A program's time goes from 8 s to 10 s. What is the percentage change in time, and in performance?</p>`, R`<p>Time: \((10 - 8)/8 \times 100 = +25\%\). Performance: old \(1/8 = 0.125\), new \(1/10 = 0.1\); \((0.1 - 0.125)/0.125 \times 100 = -20\%\). Time went up 25% but performance went down only 20%.</p>`),
    ] },
    { title: 'Clocks: period and rate', ref: 'L03 s12–s13, R1 s7', blocks: [
      B.p('S', 'L03 s12–s13', R`<p>A program is a sequence of instructions; hardware breaks each instruction into <b>clock cycles</b>. The clock ticks at a constant rate; state is updated each cycle.</p><ul><li><b>Clock period</b> \(T_c\): duration of one cycle, e.g. 250 ps = 0.25 ns = \(250 \times 10^{-12}\) s.</li><li><b>Clock rate (frequency)</b> \(f\): cycles per second, e.g. 4.0 GHz = 4000 MHz = \(4.0 \times 10^9\) Hz.</li></ul>\[T_c = \frac{1}{f} \qquad f = \frac{1}{T_c}\]`),
      B.wk({ src: 'L', ref: 'L03 [29:58]', title: '4 GHz → clock period', steps: [
        [R`\(T_c = \dfrac{1}{4 \times 10^9\ \text{Hz}}\)`, R`Write GHz as a power of ten: G = \(10^9\).`],
        [R`\(= 0.25 \times 10^{-9}\ \text{s}\)`, R`\(1/4 = 0.25\) and \(1/10^9 = 10^{-9}\).`],
        [R`\(= 0.25\ \text{ns} = 250\ \text{ps}\)`, R`\(10^{-9}\) s is a nanosecond; 0.25 ns × 1000 = 250 ps.`],
      ], result: '0.25 ns (250 ps)' }),
      B.p('S', 'R1 s7', R`<p><b>Caution:</b> "clock rate of A is faster by n than B" means \(f_A = n \times f_B\), but then \(T_{c,A} = T_{c,B} / n\). Example: \(f_B = 1\) GHz, n = 2 → \(f_A = 2\) GHz; \(T_{c,B} = 1/10^9 = 1\) ns, \(T_{c,A} = 0.5\) ns. Units: 1 ms = \(10^{-3}\) s, 1 µs = \(10^{-6}\) s, 1 ns = \(10^{-9}\) s, 1 ps = \(10^{-12}\) s.</p>`),
      B.fx('clock'),
      B.tool('clockConv', { v: 2, u: 'ns' }),
      B.dis({ id: 'perf-hz', title: 'is performance "measured in Hz"?', items: [['Slide L03 s7', '"Performance is measured in Hz and Time in seconds"; R1 s7 writes "Performance(A) (Hz) = 1/execution time(A) (sec)".'], ['Standard usage (P&H §1.6)', 'Performance is just 1/time (units 1/s); the textbook doesn’t call it Hz — Hz is the unit of clock rate.']], likely: 'Doesn’t affect any calculation. If asked for units, "1/seconds" is safe; writing "Hz" as on the slide won’t be marked wrong by this lecturer.' }),
    ] },
  ],
  keyPoints: [
    'Response time (one task) vs throughput (tasks per unit time). A faster CPU helps both; more CPUs mainly help throughput.',
    R`\(\text{Perf} = 1/T\).`,
    R`"A is n times faster than B": \(n = T_B/T_A\) (slow ÷ fast), always ≥ 1; say "the faster one is n times faster".`,
    R`% change = (new − reference)/reference × 100. The reference is the "old" or "compared-to" value.`,
    'A % change in time is NOT the same as the % change in performance (10 s → 6 s: −40% time, +66.7% performance).',
    R`\(T_c = 1/f\). A clock n times faster has a period n times shorter.`,
  ],
  traps: [
    '<b>Upside-down ratio.</b> n = T_slow / T_fast. If you get n < 1 you divided the wrong way.',
    '<b>"1.5 times slower".</b> Phrase it as the faster machine being 1.5 times faster.',
    '<b>Time % ≠ performance %.</b> The lecturer asked the class and said the −40% answer was "wrong" for a performance change.',
    '<b>Wrong reference.</b> (6−10)/10 ≠ (10−6)/6. Use the value you are comparing <i>against</i>.',
    R`<b>Unit slips.</b> GHz ↔ ns: \(1/(2\ \text{GHz}) = 0.5\ \text{ns}\), not 2 ns. Convert prefixes to powers of ten first.`,
  ],
  };
