import { R, B } from '../../utils/dsl.js';

export default {
  id: 'vm', num: 23, file: 'virtual-memory', week: 'L', weekLabel: '8–12', lectures: ['L26'], tests: [2], pending: true,
  title: 'Virtual memory: pages, page tables, page faults and the TLB', short: 'Virtual memory',
  keywords: 'virtual memory page frame virtual page number physical page number offset page table page fault tlb translation lookaside buffer write back lru reference bit protection',
  taught: 'Planned for L26 (Canvas lecture list: virtual memory). Until those slides are released this topic follows P&H §5.7.',
  overview: {
    lede: 'Main memory acts as a cache for disk. Every program sees its own large virtual address space; hardware translates each virtual page to a physical frame, and a TLB makes that translation fast.',
    about: R`<p>Virtual memory gives each program the illusion of its own memory, protects programs from one another and lets programs larger than main memory run. It is the same idea as a cache one level down: <b>pages</b> instead of blocks, a <b>page fault</b> instead of a miss. Because a page fault costs millions of cycles (a disk access), the design choices are different: large pages, fully associative placement, write-back, and clever replacement.</p>`,
    canDo: ['Split a virtual address into virtual page number and offset, and translate it with a page table.', 'Explain what happens on a page fault and why the design choices differ from caches.', 'Compute page-table size from address width, page size and entry size.', 'Explain what the TLB is and why every access needs it.'],
    buildsOn: ['cache', 'cacheperf'],
  },
  notationNote: R`VM uses its own words for cache ideas: <b>page</b> ↔ block, <b>page fault</b> ↔ miss, <b>frame</b> (physical page) ↔ cache line. Offsets are never translated.`,
  notation: [
    ['VA / PA', 'Virtual address (what the program uses) / physical address (in DRAM)', ''],
    ['page / frame', 'Fixed-size chunk of virtual / physical memory', '4 KiB'],
    ['VPN / PPN', 'Virtual page number / physical page (frame) number', ''],
    ['offset', 'Byte within the page — copied unchanged', '12 bits for 4 KiB'],
    ['page table', 'Per-process table indexed by VPN giving the PPN and a valid bit', 'in memory'],
    ['page fault', 'The page is not in memory (valid = 0): the OS fetches it from disk', 'millions of cycles'],
    ['TLB', 'Translation lookaside buffer: a small cache of recent translations', ''],
  ],
  steps: [
    { title: 'The idea: memory as a cache for disk', ref: 'P&H §5.7', blocks: [
      B.p('T', 'P&H §5.7', R`<p>A program’s addresses are <b>virtual</b>. Memory is divided into fixed-size <b>pages</b>; each virtual page is either in a physical <b>frame</b> in DRAM or on disk. A page fault takes millions of cycles, so: pages are large (4 KiB–64 KiB) to amortise the disk access, placement is <b>fully associative</b> (any page in any frame) to minimise faults, replacement is smart (LRU approximations using a reference bit), and writes are always <b>write-back</b>.</p>`),
      B.tbl({ src: 'T', ref: 'P&H §5.7', head: ['Cache', 'Virtual memory'], rows: [['block / line', 'page / frame'], ['miss', 'page fault'], ['tag compare', 'page-table lookup'], ['often direct-mapped or set-associative', 'fully associative'], ['write-through or write-back', 'always write-back'], ['handled by hardware', 'fault handled by the OS']], caption: 'The same idea one level down the hierarchy, with different trade-offs because a fault is so expensive.' }),
    ] },
    { title: 'Translating an address', ref: 'P&H §5.7', blocks: [
      B.recipe({ title: 'Virtual → physical', for: 'translation questions', steps: [
        R`Offset bits \(= \log_2(\text{page size in bytes})\). The offset is copied unchanged.`,
        'VPN = the remaining upper bits of the virtual address.',
        'Look up the page-table entry for that VPN. Valid = 0 → page fault.',
        R`PA = PPN followed by the offset (= PPN × page size + offset).`] }),
      B.tool('vmTrans'),
      B.wk({ src: 'T', ref: 'P&H §5.7', title: 'Page-table size: 32-bit addresses, 4 KiB pages, 4-byte entries', steps: [
        [R`\text{offset} = \log_2 4096 = 12`, 'Bits within a page.'],
        [R`2^{32-12} = 2^{20}\ \text{entries}`, 'One entry per virtual page.'],
        [R`2^{20} \times 4\ \text{B} = 4\ \text{MiB}`, 'Per process — which is why real systems use multi-level tables.']], result: '4 MiB per process.' }),
    ] },
    { title: 'Making translation fast: the TLB', ref: 'P&H §5.7', blocks: [
      B.p('T', 'P&H §5.7', R`<p>Without help, every load would need <i>two</i> memory accesses: one for the page-table entry and one for the data. The <b>TLB</b> is a small, fast cache of recent translations (typically tens to hundreds of entries, often fully associative). A TLB hit gives the frame number at once; a TLB miss walks the page table; only if that entry is invalid is there a page fault.</p>`),
      B.sort({ title: 'Which event?', cats: ['TLB hit', 'TLB miss, page in memory', 'Page fault'], items: [
        ['The translation is in the TLB', 0, 'Fast path.'],
        ['Not in the TLB, but the page-table entry is valid', 1, 'Load the entry into the TLB and retry.'],
        ['Not in the TLB and the page-table entry is invalid', 2, 'The OS must bring the page in from disk.'],
        ['Costs millions of cycles', 2, 'A disk access.'],
        ['Costs a page-table read (tens of cycles)', 1, 'One extra memory access.']] }),
      B.check(R`<p>Why can the TLB be tiny when the page table has a million entries?</p>`, R`<p>Locality again: a program touches only a few pages at a time, and each translation covers a whole page (4096 bytes), so a few dozen entries cover the working set.</p>`),
    ] },
  ],
  keyPoints: [
    'Virtual memory = main memory as a cache for disk; page ↔ block, page fault ↔ miss.',
    'Offset = log₂(page size) bits, copied unchanged; VPN → PPN through the page table.',
    'Faults are so costly that pages are large, placement fully associative, writes write-back.',
    R`Page-table size = \(2^{\text{VA bits} - \text{offset bits}}\) × entry size.`,
    'The TLB caches translations so most accesses need no page-table read.',
  ],
  traps: [
    '<b>Translating the offset.</b> Only the page number changes.',
    '<b>Using the physical address width</b> to count page-table entries — it is indexed by virtual page number.',
    '<b>Confusing a TLB miss with a page fault.</b> A TLB miss usually finds a valid entry in memory.',
  ],
  };
