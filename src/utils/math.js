import renderMathInElement from 'katex/contrib/auto-render';
import { decorate } from './hl.js';

export const autoMath = (d) =>
  typeof d === 'string' && d.indexOf('\\') >= 0 && !/\\\(|\\\[|^\s*</.test(d)
    ? '\\(\\displaystyle ' + d + '\\)'
    : d;

export function snugScroll(el) {
  if (!el || !el.querySelectorAll) return;
  const run = () => {
    el.querySelectorAll('.katex-display, .pd-scroll, .kx-scroll').forEach((k) => {
      const d = k.scrollWidth - k.clientWidth;
      k.classList.toggle('kx-snug', d > 0 && d <= 4);
    });
    el.querySelectorAll('.tbl-wrap, .dp-ctl').forEach((w) => {
      if (w.classList.contains('tw-tight')) return;
      const d = w.scrollWidth - w.clientWidth;
      if (d > 0 && d <= 48) w.classList.add('tw-tight');
    });
  };
  if (el.isConnected) requestAnimationFrame(run);
  else run();
}

export function fitInlineMath(el) {
  if (!el || !el.querySelectorAll || (window.innerWidth || 1200) > 900) return;
  el.querySelectorAll('.katex').forEach((k) => {
    if (k.closest('.katex-display, .kx-scroll')) return;
    let blk = k.parentElement;
    while (blk && getComputedStyle(blk).display.indexOf('inline') === 0) blk = blk.parentElement;
    if (!blk) return;
    const w = k.getBoundingClientRect().width;
    const avail = blk.clientWidth;
    if (w && avail && w > avail - 4) {
      const s = document.createElement('span');
      s.className = 'kx-scroll';
      k.parentNode.insertBefore(s, k);
      s.appendChild(k);
    }
  });
}

export function renderMath(el) {
  if (!el) return;
  try {
    renderMathInElement(el, {
      delimiters: [
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false,
      strict: 'ignore',
      trust: (c) => c.command === '\\htmlClass',
      ignoredClasses: ['ascii', 'code', 'nomath', 'cm']
    });
  } catch (e) {
    // ignore malformed math gracefully
  }
  try {
    decorate(el);
  } catch (e) {
    // decoration is cosmetic
  }
  fitInlineMath(el);
  snugScroll(el);
}
