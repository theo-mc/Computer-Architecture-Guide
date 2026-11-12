import { esc, pad2, stripHtml } from './html.js';
import { autoMath } from './math.js';

export const NF = {
  md: '\ue73e',
  lua: '\ue620',
  lock: '\uf023',
  dirC: '\uf07b',
  dirO: '\uf07c',
  tree: '\u{f0645}',
  file: '\uf15b',
  branch: '\ue725',
  vim: '\ue62b',
  find: '\uf002',
  moon: '\uf186',
  sun: '\uf185',
  ok: '\uf00c',
  todo: '\uf111',
  clock: '\uf017',
  flask: '\uf0c3',
  sigma: '\u{f04a0}',
  gear: '\uf013',
  play: '\uf04b',
  kb: '\uf11c',
  term: '\uf120',
  grad: '\uf19d',
  list: '\uf03a'
};

export const SRC = {
  S: 'Slides',
  L: 'Lecture recording',
  T: 'Textbook',
  B: 'Background (not examined)',
  C: 'Canvas',
  O: 'Official solutions',
  A: 'Explanation'
};

export const KIND = { off: 'Official', ai: 'AI', wild: 'Wildcard' };
export const KIND_LONG = { off: 'Official', ai: 'AI-written', wild: 'Wildcard' };
export const DIFF = { E: 'Easy', M: 'Medium', H: 'Hard' };

export const chip = (cls, label) => `<span class="chip ${cls}"><span>${esc(label)}</span></span>`;
export const srcChip = (src, ref) => chip(src, (SRC[src] || src) + (ref ? ' · ' + ref : ''));

export const checkHTML = (c) =>
  `<div class="qcheck"><span class="qcheck-k">✓ check</span><span class="qc-b">${autoMath(c)}</span></div>`;

export function stepsHTML(steps, check) {
  return (
    '<ol class="ws">' +
    steps
      .map((s) => {
        const n = s[2];
        const rf = s[3];
        return `<li${n ? ' class="named"' : ''}>${
          n
            ? `<div class="ws-n"><span class="ws-nt">${n}</span>${rf ? `<span class="ws-ref" title="where this is taught">${esc(rf)}</span>` : ''}</div>`
            : ''
        }<div class="ws-do">${autoMath(s[0])}</div>${s[1] ? `<div class="ws-why">${s[1]}</div>` : ''}</li>`;
      })
      .join('') +
    '</ol>' +
    (check ? checkHTML(check) : '')
  );
}

export function refSet(str) {
  const out = {};
  let deck = null;
  const re = /\b(L\d{1,2}|R\d)\b|\bs(\d+)(?:\s*[–-]\s*s?(\d+))?|\[(\d+):\d+\](?:\s*[–-]\s*\[(\d+):\d+\])?|§\s*(\d+)\.(\d+)(?:\s*[–-]\s*(?:\d+\.)?(\d+))?/g;
  let m;
  while ((m = re.exec(str || ''))) {
    if (m[1]) {
      deck = m[1].replace(/^L(\d)$/, 'L0$1');
      out[deck] = out[deck] || new Set();
    } else if (m[2] && deck) {
      const a = +m[2];
      const b = +(m[3] || m[2]);
      for (let k = a; k <= Math.min(b, a + 40); k++) out[deck].add(k);
    } else if (m[4] && deck) {
      const key = deck + '@';
      const a = +m[4];
      const b = +(m[5] || m[4]);
      out[key] = out[key] || new Set();
      for (let k = a; k <= Math.min(b, a + 60); k++) out[key].add(k);
    } else if (m[6]) {
      const ch = +m[6];
      const a = +m[7];
      const b = +(m[8] || m[7]);
      out.PH = out.PH || new Set();
      for (let k = a; k <= Math.min(b, a + 10); k++) out.PH.add(ch * 100 + k);
    }
  }
  return out;
}

const STOP = new Set(
  'that this with from what which when where there their then than they them have does into each your more less only also will would should could about after before same other these those using used uses give find show explain answer instruction instructions value values number'.split(
    ' '
  )
);

const words = (h) =>
  new Set(
    String(h || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\\[a-z]+/gi, ' ')
      .toLowerCase()
      .match(/[a-z][a-z0-9-]{3,}/g)
      ?.filter((w) => !STOP.has(w)) || []
  );

function stepWords(st) {
  if (!st.__w) {
    const parts = [st.title, st.title, st.title];
    (st.blocks || []).forEach((b) => {
      parts.push(
        b.html || '',
        b.title || '',
        b.q || '',
        b.a || '',
        b.caption || '',
        (b.head || []).join(' '),
        JSON.stringify(b.rows || b.steps || b.items || '')
      );
    });
    st.__w = words(parts.join(' '));
    st.__t = words(st.title);
  }
  return st;
}

export function needFor(t, q) {
  if (q.need) return q.need.map((i) => [i, t.steps[i - 1]]).filter((x) => x[1]);
  const qs = refSet(q.taught);
  const strong = [];
  const weak = [];
  const qw = words((q.q || '') + ' ' + (q.ans || ''));
  t.steps.forEach((st, i) => {
    const ss = refSet(st.ref);
    let sc = 0;
    let ref = 0;
    Object.keys(qs).forEach((d) => {
      if (!ss[d]) return;
      const a = qs[d];
      const b = ss[d];
      if (a.size && b.size) {
        for (const x of a) {
          if (b.has(x)) {
            sc = 2;
            ref += d === 'PH' || /@$/.test(d) ? 2 : 3;
            break;
          }
        }
      } else sc = Math.max(sc, 1);
    });
    if (sc) {
      stepWords(st);
      let ws = 0;
      qw.forEach((w) => {
        if (st.__w.has(w)) ws += st.__t.has(w) ? 3 : 1;
      });
      (sc === 2 ? strong : weak).push({ n: i + 1, st, ref, ws });
    }
  });
  let pick = strong.length ? strong : weak;
  if (pick.length > 3) {
    pick = pick
      .slice()
      .sort((a, b) => b.ref - a.ref || b.ws - a.ws || a.n - b.n)
      .slice(0, 3)
      .sort((a, b) => a.n - b.n);
  }
  return pick.map((x) => [x.n, x.st]);
}

export function buildSearchIndex({ topics, labs, formulas, exam }) {
  const idx = [];
  idx.push({
    kind: 'file',
    title: '00-exam-info.md',
    sub: 'dates, format, question types',
    go: 'home',
    text: 'exam info test format dates weights home',
    preview: exam
      ? '<p>Class Test 1: Wed 11 Nov 2026, 15:15, CSB/0G/028 · 40% · Lectures 1–16.</p><p>Class Test 2: Wed 9 Dec 2026 (tentative) · 60%.</p>'
      : ''
  });
  idx.push({
    kind: 'file',
    title: '99-formula-sheet.md',
    sub: 'every formula with visualisers',
    go: 'formulas',
    text: 'formula sheet',
    preview: '<p>' + formulas.length + ' formulas with symbol meanings and interactive visualisers.</p>'
  });
  topics.forEach((t) =>
    idx.push({
      kind: 'topic',
      title: pad2(t.num) + '-' + t.file + '.md',
      sub: t.title + ' · ' + t.lectures.join(', '),
      go: t.id,
      text: (t.title + ' ' + (t.short || '') + ' ' + t.file + ' ' + t.lectures.join(' ') + ' ' + (t.keywords || '')).toLowerCase(),
      preview: `<h3>${esc(t.title)}</h3><p>${t.overview.lede}</p><ul>${t.overview.canDo.slice(0, 4).map((c) => '<li>' + c + '</li>').join('')}</ul>`
    })
  );
  labs.forEach((l) =>
    idx.push({
      kind: 'lab',
      title: l.id + '.lua',
      sub: l.title,
      go: 'lab-' + l.id,
      text: (l.title + ' ' + l.desc).toLowerCase(),
      preview: `<h3>${esc(l.title)}</h3><p>${l.desc}</p>`
    })
  );
  formulas.forEach((f, i) =>
    idx.push({
      kind: 'formula',
      title: f[1],
      sub: 'topic ' + f[0],
      go: 'formulas',
      scroll: 'f-' + i,
      text: (f[1] + ' ' + f[0] + ' ' + (f[3] || []).map((x) => x[1]).join(' ')).toLowerCase(),
      preview: '\\[' + f[2] + '\\]' + (f[4] ? '<p>' + f[4] + '</p>' : '')
    })
  );
  topics.forEach((t) =>
    (t.questions || []).forEach((q, i) =>
      idx.push({
        kind: 'question',
        title: `${pad2(t.num)}:Q${i + 1} ${stripHtml(q.q).slice(0, 80)}`,
        sub: q.src || KIND[q.kind],
        go: t.id,
        scroll: 'q-' + q.id,
        text: (stripHtml(q.q) + ' ' + (q.src || '')).toLowerCase(),
        preview: q.q
      })
    )
  );
  return idx;
}

export function fuzzyMatch(text, w) {
  const i0 = text.indexOf(w);
  if (i0 >= 0) {
    return [
      100 - Math.min(i0, 60) + (i0 === 0 || /[\s\-_./:]/.test(text[i0 - 1]) ? 20 : 0),
      Array.from({ length: w.length }, (_, k) => i0 + k)
    ];
  }
  const pos = [];
  let j = 0;
  for (let i = 0; i < text.length && j < w.length; i++) {
    if (text[i] === w[j]) {
      pos.push(i);
      j++;
    }
  }
  return j === w.length ? [30 - (pos[pos.length - 1] - pos[0]) / 4, pos] : null;
}

export function searchIndexEntries(idx, query) {
  const wordsArr = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!wordsArr.length) return idx.filter((x) => x.kind !== 'question').slice(0, 60).map((x) => ({ x, hl: [] }));
  const out = [];
  idx.forEach((x) => {
    let s = 0;
    let hl = [];
    const tl = x.title.toLowerCase();
    for (const w of wordsArr) {
      const a = fuzzyMatch(tl, w);
      if (a) {
        s += a[0] + 20;
        hl = hl.concat(a[1]);
        continue;
      }
      const b = x.text.indexOf(w);
      if (b < 0) return;
      s += 8;
    }
    out.push({ x, hl, s: s + (x.kind === 'topic' || x.kind === 'file' ? 12 : x.kind === 'question' ? -8 : 0) });
  });
  return out.sort((a, b) => b.s - a.s).slice(0, 80);
}

export function highlightTitle(t, hl) {
  const set = new Set(hl);
  return Array.from(t)
    .map((c, i) => (set.has(i) ? `<b>${esc(c)}</b>` : esc(c)))
    .join('');
}
