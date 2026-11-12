import { R, B } from '../../utils/dsl.js';

export default {
  id: 'cacheperf', num: 22, file: 'cache-performance', week: 'L', weekLabel: '8–12', lectures: ['L24', 'L25'], tests: [2], pending: true,
  title: 'Cache performance: AMAT, memory stalls in the CPI, multilevel caches', short: 'Cache performance',
  keywords: 'cache performance amat average memory access time miss penalty miss rate memory stall cycles cpi multilevel cache l1 l2 global local miss rate compulsory capacity conflict three cs block size associativity',
  taught: 'Planned for L24–L25 (Canvas lecture list: performance evaluation, reducing miss rate and miss penalty). Until those slides are released this topic follows P&H §5.4.',
  overview: {
    lede: 'How much do misses cost? Average memory access time, memory stall cycles added to the CPI, and how a second-level cache and better organisation cut both.',
    about: R`<p>A miss costs a <b>miss penalty</b> — tens to hundreds of cycles to fetch the block from the next level. Two formulas carry almost every question: <b>AMAT</b> (average time per memory access) and <b>CPI with memory stalls</b> (base CPI plus stall cycles per instruction from instruction and data misses). Then: how block size, associativity and a second-level cache change the miss rate and penalty.</p>`,
    canDo: ['Compute AMAT for one and two levels of cache.', 'Compute CPI with instruction- and data-cache misses, and the speedup from a perfect cache.', 'Explain the three Cs of misses and what reduces each.', 'Evaluate a second-level cache using local and global miss rates.'],
    buildsOn: ['cache', 'cpuperf'],
  },
  notation: [
    [R`\(t_{hit}\)`, 'Time to access the cache on a hit', 'cycles or ns'],
    [R`\(r_{miss}\)`, 'Miss rate = misses ÷ accesses', '5% → 0.05'],
    ['miss penalty', 'Extra time to bring the block from the next level', '100 cycles'],
    ['AMAT', 'Average memory access time = hit time + miss rate × miss penalty', ''],
    ['memory stall cycles', 'Cycles per instruction spent waiting for misses', ''],
    ['local / global miss rate', 'Misses ÷ accesses reaching that level / misses ÷ all accesses from the CPU', ''],
    ['three Cs', 'Compulsory (first use), capacity (cache too small), conflict (same set)', ''],
  ],
  steps: [
    { title: 'Average memory access time', ref: 'P&H §5.4', blocks: [
      B.p('T', 'P&H §5.4', R`<p>Every access pays the hit time; the misses also pay the penalty: \(AMAT = t_{hit} + r_{miss} \times \text{miss penalty}\). Example: 1-cycle hit, 5% miss rate, 20-cycle penalty → \(1 + 0.05 \times 20 = 2\) cycles; with a 1 ns clock, 2 ns.</p>`),
      B.fx('amat'),
    ] },
    { title: 'Memory stalls in the CPI', ref: 'P&H §5.4', blocks: [
      B.recipe({ title: 'CPI with cache misses', for: 'cache-CPI questions', steps: [
        R`I-cache stalls per instruction = 1 × I-miss rate × penalty (every instruction is fetched).`,
        R`D-cache stalls per instruction = load/store fraction × D-miss rate × penalty.`,
        R`CPI = base CPI + both terms.`,
        R`Speedup of a perfect cache = CPI with stalls ÷ base CPI.`] }),
      B.wk({ src: 'T', ref: 'P&H §5.4', title: 'Base CPI 2, I-miss 2%, D-miss 4%, penalty 100 cycles, 36% loads/stores', steps: [
        [R`0.02 \times 100 = 2`, 'I-cache stall cycles per instruction.'],
        [R`0.36 \times 0.04 \times 100 = 1.44`, 'D-cache stall cycles per instruction.'],
        [R`CPI = 2 + 2 + 1.44 = 5.44`, 'More than double the base CPI.'],
        [R`5.44 / 2 = 2.72`, 'A perfect cache would be 2.72× faster.']], result: 'CPI 5.44.' }),
      B.fx('cachecpi'),
      B.derive('Why a faster processor suffers more from misses', R`<p>The miss penalty is set by memory, in nanoseconds. Double the clock rate and the same penalty costs twice as many <i>cycles</i>, while the base CPI stays the same — so memory stalls become a bigger share of the time. Halving the base CPI has the same effect. That is the memory wall in numbers.</p>`),
    ] },
    { title: 'Reducing the miss rate: the three Cs', ref: 'P&H §5.4', blocks: [
      B.sort({ title: 'Which kind of miss?', cats: ['Compulsory', 'Capacity', 'Conflict'], items: [
        ['The very first access to a block', 0, 'Nothing has brought it in yet.'],
        ['A block evicted only because the whole working set does not fit', 1, 'A bigger cache would keep it.'],
        ['Two blocks keep evicting each other while other lines stay empty', 2, 'Higher associativity fixes it.'],
        ['Misses that larger blocks reduce (prefetching neighbours)', 0, 'Larger blocks bring in more on the first touch.'],
        ['Misses that would vanish in a fully associative cache of the same size', 2, 'That is the definition.']] }),
      B.p('T', 'P&H §5.4', R`<p>Larger blocks cut compulsory misses (spatial locality) but, past a point, raise the miss rate (fewer blocks fit) and always raise the miss penalty. Higher associativity cuts conflict misses but lengthens the hit time. A bigger cache cuts capacity misses but is slower and costlier.</p>`),
    ] },
    { title: 'Multilevel caches', ref: 'P&H §5.4', blocks: [
      B.wk({ src: 'T', ref: 'P&H §5.4', title: '4 GHz, base CPI 1, memory 100 ns, 2% of instructions miss in L1; add an L2 with 5 ns access and 0.5% global miss rate', steps: [
        [R`100\ \text{ns} \times 4\ \text{GHz} = 400\ \text{cycles}`, 'Penalty to main memory in cycles.'],
        [R`\text{L1 only: } CPI = 1 + 0.02 \times 400 = 9`, 'Every L1 miss goes to memory.'],
        [R`5\ \text{ns} = 20\ \text{cycles to L2}`, 'An L1 miss that hits in L2.'],
        [R`CPI = 1 + 0.02 \times 20 + 0.005 \times 400 = 3.4`, 'All L1 misses pay 20; the 0.5% that also miss L2 pay 400 more.'],
        [R`9 / 3.4 \approx 2.6`, 'Speedup from the L2.']], result: 'The L2 makes the processor about 2.6× faster.' }),
      B.check(R`<p>An L2 has a local miss rate of 25% and the L1 misses on 2% of instructions. What is the L2’s global miss rate?</p>`, R`<p>\(0.02 \times 0.25 = 0.005\) = 0.5% of instructions go all the way to memory.</p>`),
    ] },
  ],
  keyPoints: [
    'AMAT = hit time + miss rate × miss penalty (apply it level by level).',
    'CPI = base + I-miss rate × penalty + ld/st fraction × D-miss rate × penalty.',
    'Penalties are fixed in ns, so faster clocks and lower base CPI make misses relatively worse.',
    'Three Cs: compulsory (bigger blocks), capacity (bigger cache), conflict (more associativity).',
    'An L2 cuts the L1 miss penalty; use the global miss rate for misses that reach memory.',
  ],
  traps: [
    '<b>Applying the D-cache rate to every instruction.</b> Only loads and stores access the D-cache.',
    '<b>Forgetting to convert the penalty</b> from ns to cycles at the given clock.',
    '<b>Mixing local and global miss rates.</b> Global = product of the local rates.',
    '<b>Assuming bigger blocks always help.</b> They raise the penalty and eventually the miss rate.',
  ],
  };
