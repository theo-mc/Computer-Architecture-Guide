import { R } from '../utils/dsl.js';

/* Formula sheet: every formula, common mistakes, and a table of all source disagreements */
export const FORMULAS = [
  // [topic id, name, display TeX, [[symbol, meaning]], note]
  ['arch', 'Dynamic power (CMOS)', R`P = \tfrac{1}{2}\, C\, V^{2} f`, [[R`\(P\)`, 'dynamic power (W)'], [R`\(C\)`, 'capacitive load'], [R`\(V\)`, 'supply voltage — squared'], [R`\(f\)`, 'clock frequency']], 'Slide L02 s10 has no ½; the recording, PS1-SOL Q1d and P&H do. It cancels in every ratio.'],
  ['arch', 'Power ratio', R`\dfrac{P_{new}}{P_{old}} = c \times v^{2} \times f_{x}`, [[R`\(c, v, f_x\)`, 'multipliers of C, V and f (e.g. −15% → 0.85)']], 'L02 s11, PS1 Q3'],
  ['arch', "Moore's law projection", R`N = N_0 \times 2^{\,t/T_d}`, [[R`\(N_0\)`, 'transistors now'], [R`\(t\)`, 'time ahead'], [R`\(T_d\)`, 'doubling period (18–24 months)']], 'L02 s6'],
  ['perf', 'Performance', R`\text{Perf} = \dfrac{1}{\text{Execution time}}`, [[R`\(\text{Perf}\)`, 'performance (bigger = better)']], 'L03 s6'],
  ['perf', '"A is n times faster than B"', R`n = \dfrac{\text{Perf}_A}{\text{Perf}_B} = \dfrac{T_B}{T_A}`, [[R`\(T_A, T_B\)`, 'execution times; slower time on top']], 'L03 s7'],
  ['perf', 'Percentage change', R`\%\Delta = \dfrac{\text{new} - \text{old}}{\text{old}} \times 100`, [[R`\(\text{old}\)`, 'the reference value — always the denominator']], 'L03 s9. Time change ≠ performance change (L03 [21:15]).'],
  ['perf', 'Clock period and rate', R`T_c = \dfrac{1}{f}`, [[R`\(T_c\)`, 'clock period (s per cycle)'], [R`\(f\)`, 'clock rate (cycles per s, Hz)']], 'L03 s13, R1 s7'],
  ['cpuperf', 'CPU performance equation (iron law)', R`\text{CPU time} = IC \times CPI \times T_c`, [[R`\(IC\)`, 'instructions executed (dynamic count)'], [R`\(CPI\)`, 'average cycles per instruction'], [R`\(T_c\)`, 'clock period']], 'L03 s14'],
  ['cpuperf', 'Same, with clock rate', R`\text{CPU time} = \dfrac{IC \times CPI}{f} = \dfrac{\text{CPU clock cycles}}{f}`, [[R`\(f\)`, 'clock rate']], 'R1 s8, PS1 Q1b'],
  ['cpuperf', 'Instructions per second', R`\dfrac{IC}{\text{time}} = \dfrac{f}{CPI}`, [], 'R1 s8'],
  ['cpuperf', 'Average CPI from a mix', R`\overline{CPI} = \dfrac{\sum_i CPI_i \times C_i}{\sum_i C_i}`, [[R`\(C_i\)`, 'number (or fraction) of class-i instructions'], [R`\(CPI_i\)`, 'cycles each class-i instruction takes']], 'L10 s21; P&H §1.6'],
  ['cpuperf', 'MIPS rating', R`\text{MIPS} = \dfrac{IC}{\text{Execution time} \times 10^{6}} = \dfrac{f}{CPI \times 10^{6}}`, [], 'L04 s12 (see Sources disagree), P&H §1.10'],
  ['amdahl', "Amdahl's law", R`\text{Speedup} = \dfrac{1}{(1-f) + \dfrac{f}{s}}`, [[R`\(f\)`, 'fraction of the OLD time that is improved'], [R`\(s\)`, 'speedup of that fraction only']], 'L04 s5'],
  ['amdahl', 'Amdahl limit', R`\text{Speedup}_{max} = \lim_{s\to\infty} \dfrac{1}{(1-f)+f/s} = \dfrac{1}{1-f}`, [], 'L04 s7–s8'],
  ['amdahl', 'Time-form of Amdahl', R`T_{new} = \dfrac{T_{affected}}{s} + T_{unaffected}`, [], 'PS1-SOL Q1c, P&H §1.10'],
  ['amdahl', 'Converting percentages to s', R`s = \dfrac{1}{1 - x}\ \text{(time cut by } x) \qquad s = 1 + x\ \text{(performance up by } x)`, [[R`\(x\)`, 'the percentage as a decimal']], 'L04 s9–s10, L04 [26:55], R1 s12'],
  ['isa1', 'Array element offset', R`\text{offset} = 4 \times i`, [[R`\(i\)`, 'array index (word-sized elements)']], 'L05 s18–s19'],
  ['isa1', 'Bits to name a register', R`\log_2 32 = 5\ \text{bits}`, [], 'L05 s14'],
  ['encoding', 'I-format immediate range', R`-2^{15} \le \text{imm} \le 2^{15}-1 \;\;(-32768 \ldots 32767)`, [], 'L06 s8'],
  ['isa2', 'Shifts', R`\texttt{sll } i \Rightarrow \times 2^{i} \qquad \texttt{srl } i \Rightarrow \div 2^{i}\ (\text{unsigned})`, [], 'L06 s13'],
  ['isa2', 'Base (displacement) addressing', R`\text{EA} = \text{base register} + \text{offset}`, [], 'L06 s23'],
  ['isa2', 'Branch target (PC-relative)', R`\text{target} = (PC + 4) + \text{offset} \times 4`, [], 'L06 [53:18]; P&H §2.10 (slide L06 s25 simplifies to PC + offset)'],
  ['binary', 'Unsigned value and range', R`x = \sum_{i=0}^{n-1} x_i 2^{i},\quad 0 \le x \le 2^{n}-1`, [[R`\(x_i\)`, 'bit i (0 or 1)']], 'L08 s5'],
  ['binary', "Two's complement value and range", R`x = -x_{n-1}2^{n-1} + \sum_{i=0}^{n-2} x_i 2^{i},\quad -2^{n-1} \le x \le 2^{n-1}-1`, [], 'L08 s6'],
  ['binary', "Negate in two's complement", R`-B = \overline{B} + 1`, [[R`\(\overline{B}\)`, 'every bit of B inverted']], 'L08 s7, s10'],
  ['float', 'IEEE 754 single precision', R`(-1)^{S} \times (1 + \text{Fraction}) \times 2^{\,\text{Exponent} - 127}`, [[R`\(S\)`, 'sign bit'], ['Exponent', '8-bit stored exponent'], ['Fraction', '23 bits after the binary point']], 'L08 s15 (double: 11-bit exponent, 52-bit fraction, bias 1023)'],
  ['uarch', 'Clock cycle from the critical path', R`T_c \ge \text{slowest register-to-register path}`, [], 'L09 s16, s18'],
  ['single', 'Single-cycle clock', R`T_c = \max_{\text{instr}} \left(\sum \text{stage delays}\right),\quad CPI = 1`, [], 'L10 s14, s20–s21'],
  ['multi', 'Multi-cycle clock and time', R`T_c = \max(\text{any one step}),\quad T_{instr} = (\#\text{steps}) \times T_c`, [], 'L11 s8–s9, L12 s16'],
  ['multi', 'Average time per instruction', R`\overline{T} = \sum_i p_i \times T_i`, [[R`\(p_i\)`, 'fraction of class i']], 'L12 s16'],
  ['pipe', 'Ideal pipeline throughput', R`\text{BW} \approx \dfrac{k}{T}`, [[R`\(k\)`, 'stages'], [R`\(T\)`, 'total logic delay']], 'L12 s10'],
  ['pipe', 'Pipeline throughput with register overhead', R`\text{BW}_{k} = \dfrac{1}{T/k + S}`, [[R`\(S\)`, 'pipeline register delay']], 'L12 s11'],
  ['pipe', 'Pipeline hardware cost', R`\text{Cost}_{k} = G + L\,k`, [[R`\(G\)`, 'logic gates'], [R`\(L\)`, 'register cost per stage']], 'L12 s12'],
  ['pipe', 'Cycles for N instructions, k stages (no stalls)', R`k + (N - 1)`, [], 'derived from L11 s13 (4 adds, 4 stages → 7 cycles)'],
  ['hazards', 'CPI with stalls', R`CPI = \dfrac{N + S}{N} = 1 + \dfrac{S}{N}`, [[R`\(N\)`, 'instructions'], [R`\(S\)`, 'stall cycles']], 'L14 s7, L15 s14'],
  ['hazards', 'CPI from hazard rates', R`CPI = CPI_{ideal} + \sum (\text{fraction} \times \text{penalty})`, [], 'L15 s14, PS3 Q3, Practice Test Q5'],
  ['datahaz', 'Stall penalty by distance (no forwarding)', R`\text{stalls} = \max(0,\ 3 - d)`, [[R`\(d\)`, 'distance: 1 = consumer straight after producer']], 'L16 s6 convention (2, 1, 0)'],
  ['forward', 'Stall penalty with forwarding', R`\text{ALU producer: } 0 \qquad \text{load producer: } \max(0,\ 2 - d)`, [], 'L16 s11, s13'],
];
export const MISTAKES = [
  ['Writing "B is 1.5 times slower" or "A is 0.67 times faster".', 'Always: the faster machine is n times faster, n ≥ 1 (L03 [12:37]).', 'perf'],
  ['Calling a 40% cut in time a "40% performance improvement".', 'Performance rose by 1/0.6 − 1 = 66.7% (L03 [21:15]).', 'perf'],
  ['Putting a percentage straight into Amdahl as s.', 'Convert first: time cut x% → s = 1/(1 − x); performance up x% → s = 1 + x.', 'amdahl'],
  ['Using f = the fraction of instructions, or of the NEW time.', 'f is a fraction of the OLD execution time.', 'amdahl'],
  ['Forgetting to square the voltage.', 'V appears as V² in the power formula.', 'arch'],
  ['Mixing clock rate and clock period.', 'Period = 1/rate. Faster clock → shorter period.', 'perf'],
  ['Using the static code size as IC.', 'IC counts instructions executed (loops count every time round).', 'cpuperf'],
  ['Array offset = index.', 'Byte offset = 4 × index for words.', 'isa1'],
  ['Single-cycle clock from the most common instruction.', 'It is set by the slowest instruction (usually lw).', 'single'],
  ['Multi-cycle clock = single-cycle clock ÷ 5.', 'It is the slowest single step, so unbalanced stages waste time.', 'multi'],
  ['Thinking pipelining makes one instruction faster.', 'Latency stays the same (or grows); throughput improves.', 'pipe'],
  ['Listing WAR/WAW as causing stalls in the 5-stage pipeline.', 'Only RAW stalls an in-order 5-stage pipeline.', 'datahaz'],
  ['Saying sw writes its first register.', 'sw READS both registers and writes memory.', 'datahaz'],
  ['Claiming forwarding removes every stall.', 'A load followed immediately by a use still stalls 1 cycle.', 'forward'],
];

// the one formula to memorise per topic (everything else is supporting)
export const KEYF = new Set(['Dynamic power (CMOS)', '"A is n times faster than B"', 'CPU performance equation (iron law)', "Amdahl's law", 'Array element offset', 'I-format immediate range', 'Branch target (PC-relative)', "Two's complement value and range", 'IEEE 754 single precision', 'Clock cycle from the critical path', 'Single-cycle clock', 'Multi-cycle clock and time', 'Cycles for N instructions, k stages (no stalls)', 'CPI with stalls', 'Stall penalty by distance (no forwarding)', 'Stall penalty with forwarding', 'CPI with branch penalties', 'Peak issue rate', 'Address split', 'Average memory access time', 'Page-table size']);

// formula index → [visualiser id, mode]
export const FXMAP = [['power', 'ratio'], ['power', 'solvef'], ['moore'], ['faster'], ['faster'], ['pct'], ['clock'], ['iron'], ['iron', 'f'], ['mips'], ['cpimix'], ['mips'], ['amdahl'], ['amdahl'], ['amdahlTime'], ['pct2s'], ['offset'], ['log2'], ['range'], ['shift'], ['ea'], ['branch'], ['unsigned'], ['twos'], ['negate'], ['ieee'], ['critpath'], ['critpath'], ['multicycle'], ['multicycle'], ['pipebw'], ['pipebw'], ['pipebw'], ['pipecycles'], ['stallcpi'], ['stallcpi'], ['distance', 'nofwd'], ['distance', 'fwdld']];


/* Test 2 formulas (textbook until the L17–L26 slides are released) */
FORMULAS.push(
  ['control', 'CPI with branch penalties', R`CPI = 1 + b \times m \times p`, [[R`\(b\)`, 'fraction of instructions that are branches'], [R`\(m\)`, 'fraction of branches that pay (1 stall · taken fraction for predict-not-taken · 1 − accuracy)'], [R`\(p\)`, 'penalty in cycles']], 'P&H §4.8 · PS3 Q3'],
  ['ilp', 'Peak issue rate', R`IPC_{peak} = \text{issue width},\quad CPI_{best} = \dfrac{1}{\text{issue width}}`, [[R`\(IPC\)`, 'instructions per cycle = 1/CPI']], 'P&H §4.10'],
  ['cache', 'Address split', R`\text{offset} = \log_2 B,\ \ \text{index} = \log_2 \dfrac{\text{blocks}}{\text{ways}},\ \ \text{tag} = A - \text{index} - \text{offset}`, [[R`\(B\)`, 'block size in bytes'], [R`\(A\)`, 'address bits']], 'P&H §5.3–5.4'],
  ['cache', 'Direct-mapped placement', R`\text{index} = \text{block address} \bmod \text{number of lines}`, [[R`\(\text{block address}\)`, '⌊byte address ÷ block bytes⌋']], 'P&H §5.3'],
  ['cacheperf', 'Average memory access time', R`AMAT = t_{hit} + r_{miss} \times \text{miss penalty}`, [[R`\(t_{hit}\)`, 'hit time'], [R`\(r_{miss}\)`, 'miss rate']], 'P&H §5.4'],
  ['cacheperf', 'CPI with cache misses', R`CPI = CPI_{base} + r_I \times p + f_{ls} \times r_D \times p`, [[R`\(r_I, r_D\)`, 'I- and D-cache miss rates'], [R`\(f_{ls}\)`, 'load/store fraction'], [R`\(p\)`, 'miss penalty (cycles)']], 'P&H §5.4'],
  ['vm', 'Page-table size', R`\text{entries} = 2^{\,\text{VA bits} - \log_2(\text{page size})},\ \ \text{size} = \text{entries} \times \text{entry size}`, [[R`\(\text{VA bits}\)`, 'virtual address width']], 'P&H §5.7'],
);
