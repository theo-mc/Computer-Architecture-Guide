import { R, B } from '../../utils/dsl.js';

export default {
  id: 'cache', num: 21, file: 'memory-hierarchy-caches', week: 'L', weekLabel: '8–12', lectures: ['L23', 'L24'], tests: [2], pending: true,
  title: 'Memory hierarchy and caches: locality, mapping, tag/index/offset', short: 'Caches',
  keywords: 'memory hierarchy locality temporal spatial cache block line direct mapped set associative fully associative tag index offset valid bit hit miss lru write through write back write buffer sram dram',
  taught: 'Planned for L23–L24 (Canvas lecture list: memory technologies, direct-mapped and set-associative caches). Until those slides are released this topic follows P&H §5.1–5.4.',
  overview: {
    lede: 'Main memory is far slower than the processor. A cache keeps copies of recently used data close by. Why that works (locality), and exactly how a cache decides where a block goes and whether it is there.',
    about: R`<p>The memory wall (topic 01) means a processor would spend most of its time waiting for DRAM. Programs reuse data (<b>temporal locality</b>) and use neighbouring data (<b>spatial locality</b>), so a small fast memory holding recent blocks satisfies most accesses. Every cache question rests on one skill: splitting an address into <b>tag | index | offset</b>.</p>`,
    canDo: ['Explain temporal and spatial locality and why a hierarchy works.', 'Split an address into tag, index and offset for any size, block size and associativity.', 'Trace hits and misses in a direct-mapped or set-associative cache.', 'Compare write-through and write-back, and count the total bits in a cache.'],
    buildsOn: ['arch', 'isa1', 'binary'],
  },
  notationNote: R`Sizes: KiB = 2¹⁰ bytes, MiB = 2²⁰ bytes; questions often write “KB” for 1024 bytes too. A <b>word</b> is 4 bytes, so “4-word blocks” are 16-byte blocks — always convert to bytes before taking logs. “Block” and “line” are used almost interchangeably.`,
  notation: [
    ['block / line', 'Unit copied between memory and cache; the cache slot that holds it', '16 bytes'],
    ['hit / miss', 'The data is / is not in the cache', ''],
    ['hit rate, miss rate', 'Fraction of accesses that hit / miss (they add to 1)', ''],
    ['direct-mapped', 'Each block has exactly one place: index = block mod number of lines', ''],
    ['n-way set associative', 'Each block can go in any of n lines of one set', '2-way, 4-way'],
    ['tag', 'Upper address bits stored with the block to say which block it is', ''],
    ['valid bit', 'Says whether the line holds anything at all', ''],
    ['write-through / write-back', 'Update memory on every write / only when a dirty block is evicted', ''],
  ],
  steps: [
    { title: 'Why a hierarchy? Locality', ref: 'P&H §5.1–5.2', blocks: [
      B.p('T', 'P&H §5.1', R`<p>Fast memory (SRAM) is expensive per byte; cheap memory (DRAM, flash, disk) is slow. A hierarchy puts a small fast level next to the processor and larger, slower levels behind it. It works because of <b>locality</b>: <b>temporal</b> — an item used now is likely to be used again soon (loop variables, instructions in a loop); <b>spatial</b> — items near it are likely to be used soon (array elements, sequential instructions).</p>`),
      B.sort({ title: 'Temporal or spatial locality?', cats: ['Temporal', 'Spatial'], items: [
        ['A loop counter read and written every iteration', 0, 'The same item, again and again.'],
        ['Walking through an array element by element', 1, 'Neighbouring addresses.'],
        ['The instructions of a loop body fetched on every iteration', 0, 'The same instructions reused.'],
        ['Fetching the next instruction after the current one', 1, 'Sequential addresses.'],
        ['Bringing a whole 64-byte block in on a miss', 1, 'Bets that the neighbours will be used.']] }),
    ] },
    { title: 'Where does a block go? Direct-mapped caches', ref: 'P&H §5.3', blocks: [
      B.p('T', 'P&H §5.3', R`<p>In a <b>direct-mapped</b> cache each memory block can live in exactly one line: \(\text{index} = \text{block address} \bmod \text{number of lines}\). Several blocks share each line, so the line also stores a <b>tag</b> (the remaining upper bits) and a <b>valid</b> bit. A hit needs valid = 1 and a matching tag.</p>`),
      B.wk({ src: 'T', ref: 'P&H §5.3', title: 'Byte address 1200, 64 lines, 16-byte blocks', steps: [[R`\text{block} = \lfloor 1200 / 16 \rfloor = 75`, 'Which 16-byte block holds this byte.'], [R`\text{index} = 75 \bmod 64 = 11`, 'Which line it must use.']], result: 'Line 11.' }),
      B.tool('cacheSim', { preset: 'ph' }),
    ] },
    { title: 'Splitting an address: tag | index | offset', ref: 'P&H §5.3–5.4', blocks: [
      B.recipe({ title: 'Field widths for any cache', for: 'every cache question', steps: [
        R`Offset bits \(= \log_2(\text{block size in bytes})\). They pick the byte within the block.`,
        R`Blocks = cache data size ÷ block size. Sets = blocks ÷ ways (ways = 1 for direct-mapped, sets = 1 for fully associative).`,
        R`Index bits \(= \log_2(\text{sets})\).`,
        R`Tag bits = address bits − index − offset.`,
        R`Check: tag + index + offset = address width.`] }),
      B.fx('addrsplit'),
      B.wk({ src: 'T', ref: 'P&H §5.3', title: 'Total bits in a 16 KiB direct-mapped cache, 4-word blocks, 32-bit addresses', steps: [
        [R`16\ \text{KiB} / 16\ \text{B} = 2^{14}/2^4 = 2^{10}\ \text{blocks}`, 'Each block is 4 × 4 = 16 bytes.'],
        [R`\text{offset} = 4,\ \text{index} = 10,\ \text{tag} = 32 - 10 - 4 = 18`, 'Use the method above.'],
        [R`\text{per line} = 128 + 18 + 1 = 147\ \text{bits}`, 'Data (4 × 32), tag, valid bit.'],
        [R`2^{10} \times 147 = 147\ \text{Kibit} \approx 18.4\ \text{KiB}`, 'About 1.15 × the data it holds.']], result: '147 Kibit in total.' }),
    ] },
    { title: 'Associativity, replacement and writes', ref: 'P&H §5.4, §5.3', blocks: [
      B.p('T', 'P&H §5.4', R`<p>In an <b>n-way set-associative</b> cache a block may go in any of the n lines of its set, so two blocks that map to the same index no longer evict each other. On a miss the cache must choose a victim: usually the <b>least recently used</b> (LRU). Higher associativity lowers the miss rate but needs more comparators and more tag bits.</p>`),
      B.states({ src: 'A', title: 'Addresses 0, 8, 0, 8 in an 8-block cache', states: [
        ['Direct-mapped', '<p class="prose">0 mod 8 = 0 and 8 mod 8 = 0: both need line 0, so they keep evicting each other.</p>' + '<div class="hmseq"><span class="hm miss">0 · miss</span><span class="hm miss">8 · miss</span><span class="hm miss">0 · miss</span><span class="hm miss">8 · miss</span></div>', 'Four accesses, four misses: a <b>conflict</b> miss pattern.'],
        ['2-way', '<p class="prose">Now 4 sets; both blocks map to set 0, which has two ways.</p>' + '<div class="hmseq"><span class="hm miss">0 · miss</span><span class="hm miss">8 · miss</span><span class="hm hit">0 · hit</span><span class="hm hit">8 · hit</span></div>', 'Two compulsory misses, then hits: associativity removed the conflict.']],
        caption: 'Try the same pattern in the cache simulator with the “Conflict” and “2-way” examples.' }),
      B.p('T', 'P&H §5.3', R`<p>Writes: <b>write-through</b> updates memory on every store (simple, uses a <b>write buffer</b> so the processor need not wait); <b>write-back</b> only updates the cache and writes the block to memory when it is evicted, tracked by a <b>dirty</b> bit — less memory traffic, more complexity.</p>`),
    ] },
  ],
  keyPoints: [
    'Locality (temporal + spatial) is why a small fast cache serves most accesses.',
    'Direct-mapped: index = block mod lines; hit = valid and tag match.',
    R`Offset = log₂(block bytes), index = log₂(sets), tag = the rest.`,
    'Associativity lowers conflict misses; LRU picks the victim within a set.',
    'Write-through + write buffer vs write-back + dirty bit.',
  ],
  traps: [
    '<b>Taking logs of words instead of bytes.</b> Convert block size to bytes first (byte addresses).',
    '<b>Using lines instead of sets</b> for the index in a set-associative cache.',
    '<b>Forgetting the valid bit and tag</b> when counting total cache bits.',
    '<b>Word vs byte addresses</b> in a trace: check which the question gives.',
  ],
  };
