/* v3 layout: label structure, content-width class, and pairing of text blocks so every row is full and even,
   plus holdHeight (prevents tool cards from shrinking mid-interaction) and sessionStorage slot-height cache. */

const HALF = '.sblock:not(.tblock):not(.dblock):not(.cblock):not(.figst), .prose.expl, .callout, .check, .recipe, .disagree, details.bgblock';
const KIND = {
  key: 'Key idea',
  tip: 'Tip',
  analogy: 'Analogy',
  warnc: 'Careful',
  derive: 'Derivation',
  notenote: 'Note',
  pending: 'Heads-up'
};
const LG = 1150;

function all(sel, root) {
  return Array.from((root || document).querySelectorAll(sel));
}

export function applyCalloutLabels(root) {
  if (!root) return;
  all('.callout-h:not([data-lb])', root).forEach((h) => {
    const c = h.parentElement;
    const k = Object.keys(KIND).find((x) => c.classList.contains(x));
    const name = KIND[k];
    const t = h.textContent.replace(/\s+/g, ' ').trim();
    h.setAttribute('data-lb', '1');
    if (!name || t.toLowerCase() === name.toLowerCase() || t.toLowerCase() === 'note') {
      h.innerHTML = '<span class="lb">' + h.innerHTML + '</span>';
    } else {
      h.innerHTML = '<span class="lb">' + name + '</span><span class="lt">' + h.innerHTML + '</span>';
    }
  });
}

function contentWidth(page) {
  const cs = getComputedStyle(page);
  return page.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
}

function plan(kids, H, a, b) {
  const n = b - a;
  const best = [];
  const take = [];
  best[n] = 0;
  best[n + 1] = 0;
  for (let i = n - 1; i >= 0; i--) {
    let c1 = 0.15 + best[i + 1];
    let t = 1;
    if (i + 1 < n) {
      const h1 = H[a + i];
      const h2 = H[a + i + 1];
      const m = Math.max(h1, h2) || 1;
      const d = Math.max(0, Math.abs(h1 - h2) - 36) / m;
      if (d < 0.3 && d + best[i + 2] < c1) {
        c1 = d + best[i + 2];
        t = 2;
      }
    }
    best[i] = c1;
    take[i] = t;
  }
  let i = 0;
  while (i < n) {
    if (take[i] === 2) {
      kids[a + i].setAttribute('data-lay', 'half');
      kids[a + i + 1].setAttribute('data-lay', 'half');
      i += 2;
    } else {
      kids[a + i].setAttribute('data-lay', 'full');
      i++;
    }
  }
}

function proseOf(k) {
  return k.matches('.prose') ? k : k.querySelector(':scope > .prose');
}

// Phase 1 (writes): reset a step body and, if wide, mark candidates as half-width so they can be measured.
function prepBody(sb, wide) {
  const kids = Array.from(sb.children);
  const cand = kids.map((k) => k.matches(HALF));
  kids.forEach((k) => {
    k.removeAttribute('data-lay');
    k.style.alignSelf = '';
  });
  all('.cols2', sb).forEach((p) => p.classList.remove('cols2'));
  sb.removeAttribute('data-cols');
  if (!wide) return null;
  sb.setAttribute('data-cols', '2');
  kids.forEach((k, i) => {
    if (cand[i]) {
      k.setAttribute('data-lay', 'half');
      k.style.alignSelf = 'start';
    }
  });
  return { kids, cand };
}

// Phase 2 (reads only): natural heights.
function measureBody(st) {
  return st.kids.map((k, i) => (st.cand[i] ? k.offsetHeight : 0));
}

// Phase 3 (writes): pair blocks up.
function applyBody(st, H) {
  const { kids, cand } = st;
  kids.forEach((k) => {
    k.style.alignSelf = '';
  });
  let i = 0;
  while (i < kids.length) {
    if (!cand[i]) { i++; continue; }
    let j = i;
    while (j < kids.length && cand[j]) j++;
    plan(kids, H, i, j);
    i = j;
  }
  kids.forEach((k, idx) => {
    if (!cand[idx] || k.getAttribute('data-lay') !== 'full') return;
    const p = proseOf(k);
    if (p && p.textContent.length >= 650 && !p.querySelector('table, pre, .katex-display')) {
      p.classList.add('cols2');
    }
  });
}

export function layoutQuestionList(list, wide) {
  if (!list) return;
  const kids = all(':scope > .q', list);
  kids.forEach((k) => {
    k.removeAttribute('data-lay');
    k.style.alignSelf = '';
  });
  list.removeAttribute('data-cols');
  if (!wide || kids.length < 2 || !list.getClientRects().length) return;
  list.setAttribute('data-cols', '2');
  kids.forEach((k) => {
    k.setAttribute('data-lay', 'half');
    k.style.alignSelf = 'start';
  });
  const H = kids.map((k) => k.offsetHeight);
  kids.forEach((k) => {
    k.style.alignSelf = '';
  });
  plan(kids, H, 0, kids.length);
}

export function applyV3Layout(mainEl) {
  const main = mainEl || document.getElementById('main');
  const page = main && main.querySelector('.page');
  if (!page) return;
  applyCalloutLabels(page);
  const cw = contentWidth(page);
  const wide = cw >= LG;
  page.setAttribute('data-w', wide ? 'lg' : cw >= 700 ? 'md' : 'sm');
  const bodies = all('.step:not(.folded) > .step-body', page);
  const states = bodies.map((sb) => prepBody(sb, wide));
  if (!wide) {
    const ql = page.querySelector('#qlist');
    if (ql) layoutQuestionList(ql, false);
    return;
  }
  const live = [];
  states.forEach((st, i) => {
    if (!st) return;
    if (bodies[i].getClientRects().length) live.push(st);
    else {
      // hidden (e.g. inside a closed <details>): leave it in single-column form
      bodies[i].removeAttribute('data-cols');
      st.kids.forEach((k) => {
        k.removeAttribute('data-lay');
        k.style.alignSelf = '';
      });
    }
  });
  const heights = live.map(measureBody); // one layout for all steps
  live.forEach((st, i) => applyBody(st, heights[i]));
  const ql = page.querySelector('#qlist');
  if (ql) layoutQuestionList(ql, true);
}

/* ---------- slot height session cache ---------- */
export const SLOT_H = {};
try {
  Object.assign(SLOT_H, JSON.parse(sessionStorage.getItem('csc3058-slot-h') || '{}'));
} catch (e) {}

let slotSave = 0;
export function saveSlotH() {
  clearTimeout(slotSave);
  slotSave = setTimeout(() => {
    try {
      sessionStorage.setItem('csc3058-slot-h', JSON.stringify(SLOT_H));
    } catch (e) {}
  }, 500);
}

export const slotKey = (key) => key + ':' + (window.innerWidth > 900 ? 'w' : 'n');

/* ---------- holdHeight ---------- */
const HELD = new Set();

export function holdHeight(card) {
  if (!card || card.__held || !window.ResizeObserver) return () => {};
  card.__held = true;
  let max = 0;
  const natural = () => {
    const top = card.getBoundingClientRect().top;
    let bot = top;
    for (const c of card.children) {
      const r = c.getBoundingClientRect();
      if (r.height) bot = Math.max(bot, r.bottom + (parseFloat(getComputedStyle(c).marginBottom) || 0));
    }
    return bot - top + (parseFloat(getComputedStyle(card).borderBottomWidth) || 0);
  };
  const measure = () => {
    if (!card.isConnected) {
      ro.disconnect();
      mo.disconnect();
      HELD.delete(card);
      return;
    }
    const h = Math.ceil(natural());
    if (h > max + 0.5) {
      max = h;
      card.style.minHeight = h + 'px';
    }
  };
  const ro = new ResizeObserver(measure);
  [...card.children].forEach((c) => ro.observe(c));
  const mo = new MutationObserver(() => [...card.children].forEach((c) => ro.observe(c)));
  mo.observe(card, { childList: true });
  card.__release = () => {
    max = 0;
    card.style.minHeight = '';
    requestAnimationFrame(measure);
  };
  let userAt = 0;
  const onClick = (e) => {
    if (e.target.closest('summary')) userAt = Date.now();
    else if (e.target.closest('[data-resize]')) setTimeout(card.__release, 0);
  };
  const onKeydown = (e) => {
    if (e.target.closest && e.target.closest('summary')) userAt = Date.now();
  };
  const onToggle = (e) => {
    if (Date.now() - userAt < 600 && e.target.matches && e.target.matches('details[data-resize]')) {
      card.__release();
    }
  };
  card.addEventListener('click', onClick);
  card.addEventListener('keydown', onKeydown);
  card.addEventListener('toggle', onToggle, true);
  HELD.add(card);
  measure();

  return () => {
    ro.disconnect();
    mo.disconnect();
    card.removeEventListener('click', onClick);
    card.removeEventListener('keydown', onKeydown);
    card.removeEventListener('toggle', onToggle, true);
    HELD.delete(card);
    delete card.__held;
  };
}

export function releaseAllHeld() {
  HELD.forEach((c) => c.__release && c.__release());
}
