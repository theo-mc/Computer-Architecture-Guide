import { R, Q } from '../../utils/dsl.js';

export const id = 'vm';
export default [
  Q({ id: 'v-split', kind: 'ai', diff: 'E', taught: 'P&H §5.7', q: '<p>32-bit virtual addresses, 8 KiB pages. How many bits are the offset and the virtual page number?</p>', ans: 'Offset 13, VPN 19.',
    steps: [[R`\log_2 8192 = 13`, 'Byte within a page.', 'Offset bits', 'P&H §5.7'], [R`32 - 13 = 19`, 'The rest.', 'VPN bits', 'P&H §5.7']] }),
  Q({ id: 'v-trans', kind: 'ai', diff: 'M', taught: 'P&H §5.7', q: '<p>4 KiB pages. Virtual address 0x3A7C. The page table maps virtual page 3 to frame 2. What is the physical address?</p>', ans: '0x2A7C.',
    steps: [[R`\text{offset} = 12\ \text{bits} = \texttt{0xA7C}`, 'The low three hex digits.', 'Split off the offset', 'P&H §5.7'], [R`VPN = \texttt{0x3}`, 'The digits above.', 'Read the VPN', 'P&H §5.7'], [R`PPN = 2 \Rightarrow PA = \texttt{0x2A7C}`, 'Frame number, then the same offset.', 'Look up and rebuild', 'P&H §5.7']], check: R`\(2 \times 4096 + 0xA7C = 8192 + 2684 = 10876 = \texttt{0x2A7C}\) ✓.` }),
  Q({ id: 'v-size', kind: 'ai', diff: 'M', taught: 'P&H §5.7', q: '<p>48-bit virtual addresses, 16 KiB pages, 8-byte page-table entries. How large would a single-level page table be?</p>', ans: '2³⁴ × 8 B = 128 GiB — why real systems use multi-level tables.',
    steps: [[R`\log_2 16\,384 = 14`, '16 KiB = 2¹⁴.', 'Offset bits', 'P&H §5.7'], [R`2^{48-14} = 2^{34}\ \text{entries}`, 'One per virtual page.', 'Entries', 'P&H §5.7'], [R`2^{34} \times 2^3 = 2^{37}\ \text{B} = 128\ \text{GiB}`, '2³⁰ B = 1 GiB.', 'Size', 'P&H §5.7']] }),
  Q({ id: 'v-why', kind: 'ai', diff: 'M', taught: 'P&H §5.7', q: '<p>Give three ways virtual-memory design differs from cache design, and the one reason behind all of them.</p>', ans: 'Large pages, fully associative placement, write-back (and OS-managed replacement) — because a page fault costs millions of cycles.',
    steps: [['Large pages (KiB, not bytes)', 'Amortise the slow disk access over more data.', 'Page size', 'P&H §5.7'], ['Fully associative placement and smart replacement', 'Every avoided fault saves millions of cycles.', 'Placement', 'P&H §5.7'], ['Always write-back', 'Writing through to disk on every store would be far too slow.', 'Writes', 'P&H §5.7']] }),
  Q({ id: 'v-tlb', kind: 'ai', diff: 'H', taught: 'P&H §5.7', q: '<p>A TLB hits 98% of the time. A TLB miss costs 20 extra cycles to read the page table (assume no page faults). How many cycles does translation add per access on average?</p>', ans: '0.4 cycles.',
    steps: [[R`0.02 \times 20 = 0.4`, 'Only misses pay; same shape as AMAT.', 'Miss rate × penalty', 'P&H §5.4']], check: R`Without a TLB every access would pay ≈ 20: the TLB cuts that 50× ✓.` }),
  Q({ id: 'v-wild', kind: 'wild', diff: 'H', src: 'Wildcard · reasoning', taught: 'P&H §5.7', q: '<p>Two programs both use virtual address 0x00400000. Why don’t they overwrite each other?</p>', ans: 'Each process has its own page table, so the same VPN maps to different physical frames.',
    steps: [['Each process has its own page table', 'The OS switches tables on a context switch.', 'Separate tables', 'P&H §5.7'], ['Same VPN → different PPNs', 'Same virtual address, different physical memory.', 'Different frames', 'P&H §5.7']] }),
];
