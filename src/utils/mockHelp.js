import { TOPICS, FORMULAS } from '@/data/index.js';
import { esc } from './html.js';
import { needFor, stepsHTML } from './refs.js';

export const KIND = { off: 'Official', ai: 'AI-written', wild: 'Wildcard' };
export const DIFF = { E: 'Easy', M: 'Medium', H: 'Hard' };
export const PTS = { E: 1, M: 2, H: 3 };

export const HELP_KEY = 'csc3058-help-v1';

export const mmss = (s) => {
  s = Math.max(0, Math.round(s));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};

export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function bank() {
  const out = [];
  (TOPICS || []).forEach((t) => (t.questions || []).forEach((q) => out.push({ t, q })));
  return out;
}

export function pickQuestions(opts) {
  const all = bank().filter((x) => opts.topics.indexOf(x.t.id) >= 0 && opts.kinds.indexOf(x.q.kind) >= 0);
  const by = {};
  all.forEach((x) => (by[x.t.id] = by[x.t.id] || []).push(x));
  Object.values(by).forEach(shuffle);
  const order = shuffle(Object.keys(by));
  const res = [];
  while (res.length < opts.n && order.some((k) => by[k].length)) {
    order.forEach((k) => {
      if (res.length < opts.n && by[k].length) res.push(by[k].pop());
    });
  }
  return res.sort((a, b) => a.t.num - b.t.num).map((x) => ({ tid: x.t.id, qid: x.q.id }));
}

export function findQuestion(it) {
  const t = TOPICS.find((x) => x.id === it.tid);
  const q = t && t.questions.find((x) => x.id === it.qid);
  return t && q ? { t, q } : null;
}

let cachedPacks = null;
export function getHelpPacks() {
  if (!cachedPacks) {
    try {
      cachedPacks = JSON.parse(localStorage.getItem(HELP_KEY) || '{}') || {};
    } catch (e) {
      cachedPacks = {};
    }
  }
  return cachedPacks;
}

export const BASICS = [
  {
    id: 'pct',
    name: 'Percent → multiplier',
    re: /%|per ?cent/i,
    html: String.raw`A percentage change is easiest as a <b>multiplier</b>. “Down 15%” means you keep 100 − 15 = 85%, written 0.85. “Up 20%” means 100 + 20 = 120%, written 1.2. Going back the other way: a multiplier of 0.88 is 1 − 0.88 = 0.12, so 12% less.`
  },
  {
    id: 'sides',
    name: 'Same thing to both sides',
    re: /both sides|solve for|rearrang|subject of/i,
    html: String.raw`An equation is a balance: the left side equals the right side. Whatever you do to one side, do to the other and it stays true. If \(0.25 \times z = 0.5\), divide both sides by 0.25: \(z = 0.5 \div 0.25 = 2\). To undo × use ÷; to undo + use −; to undo a square use √.`
  },
  {
    id: 'sq',
    name: 'Squaring',
    re: /\^\s*\{?2\}?(?![\d.])|squar|²/i,
    html: String.raw`Squaring means multiplying a number by itself: \(0.8^2 = 0.8 \times 0.8 = 0.64\). Squaring a number below 1 makes it smaller; above 1 makes it bigger.`
  },
  {
    id: 'sqrt',
    name: 'Square root',
    re: /sqrt|square.root|√/i,
    html: String.raw`A square root undoes a square. \(\sqrt{0.64} = 0.8\) because \(0.8 \times 0.8 = 0.64\). Use the √ key on your calculator.`
  },
  {
    id: 'pow2',
    name: 'Powers of 2 and log₂',
    re: /(^|[^\d.])2\s*\^|\\log|doubl|power of (two|2)/i,
    html: String.raw`\(2^5\) means five 2s multiplied together: 2 × 2 × 2 × 2 × 2 = 32. \(\log_2\) asks the opposite: how many 2s multiply to make this number? \(\log_2 32 = 5\). Worth knowing: \(2^{10} = 1024\).`
  },
  {
    id: 'frac',
    name: 'Fractions and ratios',
    re: /\\d?frac|ratio|÷|divid/i,
    html: String.raw`A fraction \(\dfrac{a}{b}\) just means a ÷ b. “New ÷ old” tells you how many times bigger the new one is: 2 means twice as big, 0.5 means half the size.`
  },
  {
    id: 'cancel',
    name: 'Cancelling',
    re: /cancel/i,
    html: String.raw`If the same thing multiplies the top and the bottom of a fraction, it divides out to 1 and disappears: \(\dfrac{5 \times C}{2 \times C} = \dfrac{5}{2}\). That is why the symbols vanish from a “new ÷ old” ratio and only the multipliers are left.`
  },
  {
    id: 'units',
    name: 'Unit prefixes',
    re: /GHz|MHz|kHz|\bns\b|\bps\b|\\mu|μs|\bms\b|nano|giga|mega|KiB|MiB/i,
    html: String.raw`G (giga) = \(10^9\), a billion. M (mega) = \(10^6\), a million. k (kilo) = \(10^3\). n (nano) = \(10^{-9}\), a billionth. p (pico) = \(10^{-12}\). So 2 GHz = 2,000,000,000 cycles every second. For memory sizes KiB = \(2^{10}\) = 1024 bytes and MiB = \(2^{20}\).`
  },
  {
    id: 'recip',
    name: 'Rate and period are flips',
    re: /period|T_c|cycle time|1\s*\/\s*f\b|reciprocal|clock rate/i,
    html: String.raw`Clock period = 1 ÷ clock rate, and clock rate = 1 ÷ clock period. \(1 \div 4\ \text{GHz} = 0.25\ \text{ns}\). A bigger rate always means a shorter period.`
  },
  {
    id: 'wavg',
    name: 'Weighted average',
    re: /weighted|average|\\sum|Σ|\bmix\b/i,
    html: String.raw`To average with weights: multiply each value by how often it happens (as a decimal), then add the results. If 60% of instructions take 1 cycle and 40% take 3: \(0.6 \times 1 + 0.4 \times 3 = 0.6 + 1.2 = 1.8\).`
  },
  {
    id: 'sci',
    name: 'Powers of ten',
    re: /10\s*\^|\\times\s*10\b/i,
    html: String.raw`\(\times 10^9\) means move the decimal point 9 places right; \(\times 10^{-9}\) means 9 places left. When multiplying, add the little powers: \(10^9 \times 10^{-9} = 10^0 = 1\).`
  },
  {
    id: 'bin',
    name: 'Binary place values',
    re: /binary|two.s complement|\b[01]{4,}\b/i,
    html: String.raw`Binary place values double from the right: 1, 2, 4, 8, 16, 32, 64, 128. So 1011 = 8 + 0 + 2 + 1 = 11. One hex digit (0–9, then A–F for 10–15) stands for exactly 4 bits.`
  }
];

const plainOf = (s) => String((s && s[0]) || '') + ' ' + String((s && s[1]) || '') + ' ' + String((s && s[2]) || '');

export const basicsFor = (s) => {
  const x = plainOf(s);
  return BASICS.filter((b) => b.re.test(x)).slice(0, 3);
};

const isCalc = (q) => /\d\s*[×÷/*+−-]\s*\d|\\times|\\dfrac|\\frac|=\s*-?\d/.test((q.steps || []).map(plainOf).join(' '));
const STOP = new Set(
  'the and for are its this that with from what which when then than into each your one two new old use used uses have has was were how many much give find value values time times'.split(' ')
);
const wordsOf = (h) =>
  new Set(
    (
      String(h || '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\\[a-z]+/gi, ' ')
        .toLowerCase()
        .match(/[a-z][a-z0-9]{2,}/g) || []
    ).filter((w) => !STOP.has(w))
  );

function formulasFor(t, q) {
  const F = (FORMULAS || []).filter((f) => f[0] === t.id);
  if (!F.length) return [];
  const qw = wordsOf(q.q + ' ' + q.ans + ' ' + (q.steps || []).map(plainOf).join(' '));
  return F.map((f) => {
    const fw = wordsOf(f[1] + ' ' + (f[3] || []).map((x) => x[1]).join(' '));
    let n = 0;
    fw.forEach((w) => {
      if (qw.has(w)) n++;
    });
    return [n, f];
  })
    .filter((x) => x[0] >= 2)
    .sort((a, b) => b[0] - a[0])
    .slice(0, 2)
    .map((x) => x[1]);
}

function plainText(html) {
  if (typeof document === 'undefined') return String(html || '').replace(/<[^>]*>/g, ' ');
  const d = document.createElement('div');
  d.innerHTML = String(html || '');
  d.querySelectorAll('br').forEach((x) => x.replaceWith('\n'));
  d.querySelectorAll('td,th').forEach((x) => x.append(' | '));
  d.querySelectorAll('tr,p,li,div,pre,h1,h2,h3,h4,table').forEach((x) => x.append('\n'));
  return d.textContent.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function hintsFor(t, q) {
  const S_ = q.steps || [];
  const H = [];
  const calc = isCalc(q);
  const fs = calc ? formulasFor(t, q) : [];
  const need = needFor(t, q);
  let h1 = `<p>This is a <b>${esc(t.short || t.title)}</b> question.</p>`;
  if (fs.length) {
    h1 +=
      `<p>The formula sheet entr${fs.length > 1 ? 'ies' : 'y'} you need:</p>` +
      fs
        .map(
          (f) =>
            `<div class="mk-hf"><span class="mk-hf-n">${f[1]}</span><div class="mk-hf-t">\\[${f[2]}\\]</div>${
              (f[3] || []).length ? `<div class="mk-hsym">${f[3].map((s) => `${s[0]} = ${s[1]}`).join(' · ')}</div>` : ''
            }</div>`
        )
        .join('');
  } else if (need.length) {
    h1 += `<p>The idea you need is in the explanation section <b>“${need[0][1].title}”</b>${
      need[1] ? ` (and <b>“${need[1][1].title}”</b>)` : ''
    }. Think about what that section says before you start.</p>`;
  }
  if (calc) h1 += '<p>Before any maths: write down every number in the question and what it measures, with its unit.</p>';
  H.push({ label: 'Where to start', html: h1 });
  if (S_.length > 1) {
    if (S_.every((s) => s[2])) {
      H.push({ label: 'The plan', html: `<p>It can be done in ${S_.length} moves, in this order:</p><ol>${S_.map((s) => `<li>${s[2]}</li>`).join('')}</ol>` });
    } else if (S_[0][1] && !/^\s*(\(?[LR]\d|P&H|slide|“|")/i.test(plainText(S_[0][1])) && plainText(S_[0][1]).length > 24) {
      H.push({ label: 'The plan', html: `<p>It takes ${S_.length} steps. The first thing to do:</p><p>${S_[0][1]}</p>` });
    }
  }
  H.push({
    label: S_.length > 1 ? 'Step 1 done for you' : 'The working',
    html: stepsHTML(S_.slice(0, 1)) + (S_.length > 1 ? '<p class="ref">Carry on from here, or open the working for the next step.</p>' : '')
  });
  return H;
}

export const helpUsed = (u) => !!(u && (u.h || u.w));

export const helpTag = (u, q) =>
  helpUsed(u)
    ? `<span class="mk-pill mk-used">help: ${[
        u.h ? u.h + ' hint' + (u.h > 1 ? 's' : '') : '',
        u.w ? Math.min(u.w, (q.steps || []).length) + '/' + (q.steps || []).length + ' steps seen' : ''
      ]
        .filter(Boolean)
        .join(' · ')}</span>`
    : '';
