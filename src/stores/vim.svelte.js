import { app } from './app.svelte.js';
import { router } from './router.svelte.js';

const LINE_SEL =
  '.dash, .page-head, .toc, .sec-title, .card, .step-title, .fold-line, .step-body > *, .kp > li, .traps > li, .qfilter, .q, .pager, .page > .tool-slot, .page > pre, .labrow, .fx-card';

class VimStore {
  cmdOpen = $state(false);
  cmdPrefix = $state(':');
  finderOpen = $state(false);
  helpOpen = $state(false);
  wkOpen = $state(false);
  navOpen = $state(false);
  treeMode = $state(false);
  treeIdx = $state(-1);

  pend = $state('');
  count = $state('');
  pending = $state('');

  cursor = $state(0);
  lineCount = $state(0);
  scrollPct = $state(0);

  winSec = $state('');
  winStep = $state('');

  curLines = [];
  litCursor = -1;
  scrollLock = 0;
  gutRaf = 0;
  pctRaf = 0;
  scrollRaf = 0;

  mode = $derived(
    this.cmdOpen
      ? 'command'
      : this.finderOpen
        ? 'insert'
        : this.treeMode
          ? 'tree'
          : 'normal'
  );

  syncWinbarFromCursor() {
    const el = this.curLines[this.cursor];
    let sec = '';
    let step = '';
    if (el) {
      const s = el.closest('.sec');
      if (s) sec = (s.querySelector('.st') || {}).textContent || '';
      const st = el.closest('.step');
      if (st) step = st.id.replace('st-', '') + '. ' + ((st.querySelector('.stt') || {}).textContent || '');
    }
    this.winSec = sec;
    this.winStep = step;
  }

  buildLines(mainEl) {
    const main = mainEl || document.getElementById('main');
    if (!main) return;
    main.querySelectorAll('.ln').forEach((el) => el.classList.remove('ln', 'cl'));
    this.curLines = Array.from(main.querySelectorAll(LINE_SEL)).filter(
      (el) =>
        !el.closest('[hidden], .folded > .step-body, details:not([open]) > :not(summary)') &&
        getComputedStyle(el).display !== 'none' &&
        !(el.classList.contains('card') && el.closest('.step-body')) &&
        !el.parentElement.closest('.q') &&
        !(el.closest('.card') && el.closest('.card') !== el && !el.matches('.kp > li, .traps > li, .labrow')) &&
        !(el.matches('.fx-card') && el.closest('.step-body')) &&
        !(el.matches('.card.list') && el.querySelector('.labrow'))
    );
    this.litCursor = -1;
    this.curLines.forEach((el, i) => {
      el.classList.add('ln');
      el.dataset.n = String(i + 1);
    });
    this.lineCount = this.curLines.length;
    if (this.cursor >= this.curLines.length) {
      this.cursor = Math.max(0, this.curLines.length - 1);
    }
    this.alignGutterSoon(main);
    this.numberLines();
    this.syncWinbarFromCursor();
  }

  alignGutter(mainEl) {
    const main = mainEl || document.getElementById('main');
    const pg = main && main.querySelector('.page');
    if (!pg || !this.curLines.length) return;
    const pr = pg.getBoundingClientRect();
    const x0 = pr.left + (parseFloat(getComputedStyle(pg).paddingLeft) || 0);
    const rs = this.curLines.map((el) => el.getBoundingClientRect());
    let prevTop = -1e9;
    this.curLines.forEach((el, i) => {
      const r = rs[i];
      if (!r.width) return;
      el.style.setProperty('--lnx', Math.round(x0 - r.left) + 'px');
      el.classList.toggle('ln-side', Math.abs(r.top - prevTop) < 6);
      prevTop = r.top;
    });
  }

  alignGutterSoon(mainEl) {
    if (this.gutRaf) return;
    this.gutRaf = requestAnimationFrame(() => {
      this.gutRaf = 0;
      this.alignGutter(mainEl);
    });
  }

  // Only lines near the cursor are on screen, so only those get (re)numbered.
  numberLines() {
    const rel = app.s.rel;
    const c = this.cursor;
    const lines = this.curLines;
    const lo = Math.max(0, c - 70);
    const hi = Math.min(lines.length, c + 70);
    if (this.litCursor >= 0 && this.litCursor !== c) lines[this.litCursor]?.classList.remove('cl');
    for (let i = lo; i < hi; i++) {
      const v = rel ? (i === c ? i + 1 : Math.abs(i - c)) : i + 1;
      const el = lines[i];
      if (el.dataset.rel !== String(v)) el.dataset.rel = String(v);
    }
    lines[c]?.classList.add('cl');
    this.litCursor = c;
  }

  setCursor(i, noScroll = false, center = false, mainEl = null) {
    if (!this.curLines.length) return;
    this.cursor = Math.max(0, Math.min(this.curLines.length - 1, i));
    this.numberLines();
    const el = this.curLines[this.cursor];
    const m = mainEl || document.getElementById('main');
    if (!noScroll && el && m) {
      const r = el.getBoundingClientRect();
      const mr = m.getBoundingClientRect();
      const off = mr.height * 0.18;
      const top = mr.top + 30 + off;
      const bot = mr.bottom - off;
      this.scrollLock = performance.now() + 650;
      if (center) {
        m.scrollBy({
          top: r.top - (mr.top + mr.height / 2 - Math.min(r.height, mr.height / 2) / 2),
          behavior: 'smooth'
        });
      } else if (r.top < top) {
        m.scrollBy({ top: r.top - top, behavior: 'smooth' });
      } else if (r.bottom > bot && r.height < mr.height - 2 * off) {
        m.scrollBy({ top: r.bottom - bot, behavior: 'smooth' });
      } else if (r.bottom > bot) {
        m.scrollBy({ top: r.top - top, behavior: 'smooth' });
      }
    }
    this.syncWinbarFromCursor();
    this.schedPct(m);
  }

  readingY(m, mr) {
    const h = mr.height;
    const st = m.scrollTop;
    const rem = m.scrollHeight - m.clientHeight - st;
    if (st < h / 2) return mr.top + Math.min(h / 2, 40 + st);
    if (rem < h / 2) return mr.bottom - Math.min(h / 2, 40 + rem);
    return mr.top + h / 2;
  }

  lineAt(y) {
    let best = -1;
    let bd = Infinity;
    for (let i = 0; i < this.curLines.length; i++) {
      const r = this.curLines[i].getBoundingClientRect();
      if (!r.height) continue;
      const d = y < r.top - 6 ? r.top - 6 - y : y > r.bottom + 6 ? y - r.bottom - 6 : 0;
      if (d < bd) {
        bd = d;
        best = i;
        if (!d) break;
      }
      if (r.top - 6 > y && d > bd) break;
    }
    return best;
  }

  syncCursorToView(mainEl) {
    const m = mainEl || document.getElementById('main');
    if (!m || !this.curLines.length) return;
    const k = this.lineAt(this.readingY(m, m.getBoundingClientRect()));
    if (k >= 0 && k !== this.cursor) {
      this.cursor = k;
      this.numberLines();
      this.syncWinbarFromCursor();
    }
    this.schedPct(m);
  }

  cursorTo(el) {
    const i = this.curLines.findIndex(
      (x) => x === el || el.contains(x) || (el.compareDocumentPosition(x) & 4)
    );
    this.scrollLock = Math.max(this.scrollLock, performance.now() + 250);
    if (i >= 0) {
      this.cursor = i;
      this.numberLines();
      this.syncWinbarFromCursor();
    }
    this.schedPct();
  }

  schedPct(mainEl) {
    if (this.pctRaf) return;
    this.pctRaf = requestAnimationFrame(() => {
      this.pctRaf = 0;
      const m = mainEl || document.getElementById('main');
      if (!m) return;
      this.scrollPct =
        m.scrollHeight > m.clientHeight + 4
          ? Math.round((100 * m.scrollTop) / (m.scrollHeight - m.clientHeight))
          : 0;
    });
  }

  onMainScroll(mainEl) {
    this.schedPct(mainEl);
    const now = performance.now();
    if (now < this.scrollLock) {
      this.scrollLock = Math.max(this.scrollLock, now + 140);
      return;
    }
    if (this.scrollRaf) return;
    this.scrollRaf = requestAnimationFrame(() => {
      this.scrollRaf = 0;
      this.syncCursorToView(mainEl);
    });
  }

  flashCursor() {
    const el = this.curLines[this.cursor];
    if (!el) return;
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }

  jumpSection(d, mainEl) {
    const heads = this.curLines
      .map((el, i) => [el, i])
      .filter((a) => a[0].matches('.sec-title, .step-title, .page-head'));
    if (!heads.length) return;
    const target =
      d > 0
        ? heads.find((a) => a[1] > this.cursor)
        : heads.slice().reverse().find((a) => a[1] < this.cursor);
    if (target) {
      this.setCursor(target[1], false, false, mainEl);
      const m = mainEl || document.getElementById('main');
      if (m) {
        const r = target[0].getBoundingClientRect();
        const mr = m.getBoundingClientRect();
        m.scrollBy({ top: r.top - mr.top - 40, behavior: 'smooth' });
      }
      this.flashCursor();
    }
  }

  clearPend() {
    this.pend = '';
    this.pending = '';
  }

  openWhichKey() {
    this.wkOpen = true;
    this.pending = '␣';
  }

  closeWhichKey() {
    this.wkOpen = false;
    if (this.pending === '␣') this.pending = '';
  }

  openCmd(prefix = ':') {
    this.closeWhichKey();
    this.cmdPrefix = prefix;
    this.cmdOpen = true;
  }

  openFinder() {
    this.closeWhichKey();
    this.finderOpen = true;
  }

  openHelp() {
    this.closeWhichKey();
    this.helpOpen = true;
  }

  focusCursorOnElement(el) {
    const i = this.curLines.indexOf(el);
    if (i >= 0 && i !== this.cursor) {
      this.cursor = i;
      this.numberLines();
      this.syncWinbarFromCursor();
    }
  }
}

export const vim = new VimStore();
