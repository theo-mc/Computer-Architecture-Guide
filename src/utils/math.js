import { decorate } from './hl.js';

export const autoMath = (d) =>
  typeof d === 'string' && d.indexOf('\\') >= 0 && !/\\\(|\\\[|^\s*</.test(d)
    ? '\\(\\displaystyle ' + d + '\\)'
    : d;

/* KaTeX is loaded as a separate chunk; renderMath() calls queue up and are flushed in a single batch. */
let katexRender = null;
const queue = new Set();
let raf = 0;

import('katex/contrib/auto-render').then((m) => {
  import('katex/dist/katex.min.css');
  katexRender = m.default;
  schedule();
});

const OPTS = {
  delimiters: [
    { left: '\\[', right: '\\]', display: true },
    { left: '\\(', right: '\\)', display: false }
  ],
  throwOnError: false,
  strict: 'ignore',
  trust: (c) => c.command === '\\htmlClass',
  ignoredClasses: ['ascii', 'code', 'nomath', 'cm']
};

function schedule() {
  if (!raf && katexRender && queue.size) raf = requestAnimationFrame(flush);
}

const waiters = [];
/** Run cb once pending math has rendered (so layout is measured after KaTeX, not before). */
export function afterMath(cb) {
  if (!raf && !queue.size) requestAnimationFrame(cb);
  else waiters.push(cb);
}

function flush() {
  raf = 0;
  const els = [...queue].filter((el) => el.isConnected);
  queue.clear();
  // 1. writes only: render math + decorate tokens
  for (const el of els) {
    try {
      if (el.textContent.includes('\\(') || el.textContent.includes('\\[')) katexRender(el, OPTS);
    } catch (e) {}
    try {
      decorate(el);
    } catch (e) {}
  }
  // 2. reads, then writes: fit/snug measurements
  fitInlineMath(els);
  snugScroll(els);
  waiters.splice(0).forEach((cb) => cb());
}

export function renderMath(el) {
  if (!el) return;
  queue.add(el);
  schedule();
}

export function snugScroll(arg) {
  const els = Array.isArray(arg) ? arg : arg ? [arg] : [];
  const run = () => {
    const snug = [];
    const tight = [];
    for (const el of els) {
      if (!el.querySelectorAll) continue;
      el.querySelectorAll('.katex-display, .pd-scroll, .kx-scroll').forEach((k) => {
        const d = k.scrollWidth - k.clientWidth;
        snug.push([k, d > 0 && d <= 4]);
      });
      el.querySelectorAll('.tbl-wrap, .dp-ctl').forEach((w) => {
        if (w.classList.contains('tw-tight')) return;
        const d = w.scrollWidth - w.clientWidth;
        if (d > 0 && d <= 48) tight.push(w);
      });
    }
    snug.forEach(([k, on]) => k.classList.toggle('kx-snug', on));
    tight.forEach((w) => w.classList.add('tw-tight'));
  };
  if (els.length && els.every((e) => e.isConnected)) requestAnimationFrame(run);
  else run();
}

export function fitInlineMath(arg) {
  if ((window.innerWidth || 1200) > 900) return;
  const els = Array.isArray(arg) ? arg : arg ? [arg] : [];
  const wraps = [];
  for (const el of els) {
    if (!el.querySelectorAll) continue;
    el.querySelectorAll('.katex').forEach((k) => {
      if (k.closest('.katex-display, .kx-scroll')) return;
      let blk = k.parentElement;
      while (blk && getComputedStyle(blk).display.indexOf('inline') === 0) blk = blk.parentElement;
      if (!blk) return;
      const w = k.getBoundingClientRect().width;
      const avail = blk.clientWidth;
      if (w && avail && w > avail - 4) wraps.push(k);
    });
  }
  wraps.forEach((k) => {
    const s = document.createElement('span');
    s.className = 'kx-scroll';
    k.parentNode.insertBefore(s, k);
    s.appendChild(k);
  });
}
