<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import { esc } from '$utils/html.js';
  import { uid as mkUid } from '$utils/viz.js';

  let { opts = {} } = $props();

  const uid = mkUid('sl');
  const PF = { f: -15, p: -12, n: -9, u: -6, 'µ': -6, μ: -6, m: -3, k: 3, M: 6, G: 9, T: 12 };
  const PN = {
    '-18': ['a', 'atto'], '-15': ['f', 'femto'], '-12': ['p', 'pico'], '-9': ['n', 'nano'],
    '-6': ['µ', 'micro'], '-3': ['m', 'milli'], '0': ['', ''], '3': ['k', 'kilo'],
    '6': ['M', 'mega'], '9': ['G', 'giga'], '12': ['T', 'tera'], '15': ['P', 'peta']
  };
  const SUPC = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+' };
  const UD = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  const sup = (n) => '10<sup>' + (n < 0 ? '−' : '') + Math.abs(n) + '</sup>';
  const usup = (n) => '10' + (n < 0 ? '⁻' : '') + String(Math.abs(n)).replace(/\d/g, (d) => UD[d]);
  const NUM = '([+-]?(?:\\d+\\.?\\d*|\\.\\d+))';

  const PX = ['4.3 x 10^-12', '250 ps', '4 GHz', '0.0000075', '6,500,000', '12.5e3', '0.5 GHz'];
  const PC = [
    ['1', 'div', '250 ps'],
    ['5 ns', 'mul', '2 GHz'],
    ['4 x 10^9', 'mul', '5 x 10^-3'],
    ['2 x 10^3', 'div', '8 x 10^-2'],
    ['6 x 10^-3', 'div', '3 x 10^-9']
  ];

  function parse(raw) {
    let s = String(raw)
      .trim()
      .replace(/[\u2212\u2013]/g, '-')
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]/g, (c) => SUPC[c])
      .replace(/[,_]/g, '');
    if (!s) return { err: 'Type a number, for example 4.3e-12 or 250 ps.' };
    let mant;
    let ex = 0;
    let rest;
    let m;
    if ((m = s.match(new RegExp('^' + NUM + '\\s*[x×X*·]\\s*10\\s*\\^?\\s*[({]?\\s*([+-]?\\d+)\\s*[)}]?\\s*(.*)$')))) {
      mant = m[1];
      ex = +m[2];
      rest = m[3];
    } else if ((m = s.match(/^10\s*\^\s*[({]?\s*([+-]?\d+)\s*[)}]?\s*(.*)$/))) {
      mant = '1';
      ex = +m[1];
      rest = m[2];
    } else if ((m = s.match(new RegExp('^' + NUM + '\\s*[eE]\\s*([+-]?\\d+)\\s*(.*)$')))) {
      mant = m[1];
      ex = +m[2];
      rest = m[3];
    } else if ((m = s.match(new RegExp('^' + NUM + '\\s*(.*)$')))) {
      mant = m[1];
      rest = m[2];
    } else {
      return { err: 'I could not read that as a number. Try 4.3e-12, 4.3 x 10^-12, 0.0000000000043 or 250 ps.' };
    }
    let pexp = 0;
    let pfx = '';
    let unit = '';
    rest = rest.trim();
    if (rest) {
      const u = rest.match(/^([fpnuµμmkMGT])?(Hz|s|F|W|V|A|B|J)$/);
      if (!u) {
        return {
          err:
            'I could not read “' +
            esc(rest) +
            '” after the number. Units I know: s, Hz, F, W, V, A, B, J, with an optional prefix f p n µ m k M G T (for example ps, GHz, pF).'
        };
      }
      if (u[1]) {
        pfx = u[1] === 'u' ? 'µ' : u[1];
        pexp = PF[u[1]];
      }
      unit = u[2];
    }
    const neg = mant[0] === '-';
    mant = mant.replace(/^[+-]/, '');
    const parts = mant.split('.');
    const ip = parts[0];
    const fp = parts[1] || '';
    const all = ip + fp;
    const fz = all.search(/[1-9]/);
    if (fz < 0) return { err: '0 has no scientific notation: there is no first non-zero digit to move the point to.' };
    const digits = all.slice(fz).replace(/0+$/, '');
    if (digits.length > 15) return { err: 'That has more than 15 significant digits. Round it first.' };
    const eW = ip.length - 1 - fz + ex;
    const e = eW + pexp;
    if (Math.abs(e) > 30) return { err: 'Keep the exponent between −30 and +30 so the drawings stay readable.' };
    return { neg, digits, e, eW, pexp, pfx, unit };
  }

  function coef(p, k) {
    const d = p.digits;
    const n = p.e - k + 1;
    if (n <= 0) return '0.' + '0'.repeat(-n) + d;
    if (n >= d.length) return d + '0'.repeat(n - d.length);
    return d.slice(0, n) + '.' + d.slice(n);
  }

  const sg = (p) => (p.neg ? '−' : '');
  const sciH = (p, k) => sg(p) + coef(p, k == null ? p.e : k) + ' × ' + sup(k == null ? p.e : k);
  const sciT = (p, k) => sg(p) + coef(p, k == null ? p.e : k) + ' × ' + usup(k == null ? p.e : k);
  const pnm = (k) => PN[String(k)];
  const fmt = (x) => String(Number(x.toPrecision(8)));
  const approx = (x) => (Math.abs(x - Number(x.toPrecision(8))) > 1e-12 * Math.abs(x) ? '≈' : '=');

  function viewPoint(p) {
    const d = p.digits,
      e = p.e,
      cells = [],
      CW = 32;
    const mk = (t, k, w) => ({ t, k, w: w || CW });
    const zeros = (n) => {
      if (n <= 0) return;
      if (n > 4) cells.push(mk(n + '×0', 'z', 84));
      else for (let i = 0; i < n; i++) cells.push(mk('0', 'z'));
    };
    const sig = () => d.split('').forEach((c, i) => cells.push(mk(c, i === 0 ? 'f' : 's')));
    let orig, sciAfter;
    if (e < 0) {
      cells.push(mk('0', 'z'));
      zeros(-e - 1);
      orig = 0;
      sig();
      sciAfter = cells.findIndex((c) => c.k === 'f');
    } else {
      sig();
      const tz = e + 1 - d.length;
      zeros(tz);
      orig = tz >= 0 ? cells.length - 1 : e;
      sciAfter = 0;
    }
    const x0 = 46;
    const bx = [];
    let acc = x0;
    cells.forEach((c) => {
      c.x = acc;
      acc += c.w;
      bx.push(acc);
    });
    const W = Math.max(acc + 46, 340),
      H = 150,
      yT = 62,
      yB = 100;
    let g = `<defs><marker id="${uid}a" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L8 4L0 8z" class="sl-mk"/></marker></defs>`;
    if (p.neg) g += `<text x="${x0 - 8}" y="${yT + 26}" class="sl-t" style="text-anchor:end">−</text>`;
    cells.forEach((c) => {
      g += `<rect x="${c.x}" y="${yT}" width="${c.w}" height="${yB - yT}" class="sl-c ${c.k}"/><text x="${c.x + c.w / 2}" y="${
        yT + 26
      }" class="sl-t ${c.k}">${c.t}</text>`;
    });
    const xo = bx[orig],
      xs = bx[sciAfter];
    if (e !== 0) {
      const mid = (xo + xs) / 2;
      g += `<path d="M${xo} ${yT - 4} Q${mid} ${yT - 54} ${xs} ${yT - 4}" class="sl-arc" marker-end="url(#${uid}a)"/><text x="${mid}" y="${
        yT - 36
      }" class="sl-al">moved ${Math.abs(e)} place${Math.abs(e) === 1 ? '' : 's'} ${e > 0 ? 'left' : 'right'}</text>`;
      const L = xo < xs;
      g += `<text x="${xo + (L ? -8 : 8)}" y="${yB + 22}" class="sl-lb o" style="text-anchor:${
        L ? 'end' : 'start'
      }">start</text><text x="${xs + (L ? 8 : -8)}" y="${yB + 22}" class="sl-lb n" style="text-anchor:${L ? 'start' : 'end'}">new</text>`;
      g += `<circle cx="${xo}" cy="${yB}" r="5.5" class="sl-p0"/>`;
    } else g += `<text x="${xs}" y="${yB + 22}" class="sl-lb n" style="text-anchor:middle">start = new</text>`;
    g += `<circle cx="${xs}" cy="${yB}" r="6.5" class="sl-p1"/>`;
    const eng = Math.floor(e / 3) * 3,
      pn = pnm(eng),
      u = p.unit;
    const cards = [
      ['Plain', sg(p) + coef(p, 0) + (u ? ' ' + u : ''), p.pfx || u ? 'what the question would write out in full' : 'every zero written out'],
      ['Scientific · 1 ≤ m < 10', sciH(p) + (u ? ' ' + u : ''), 'one digit before the point'],
      [
        'Engineering · exponent a multiple of 3',
        sciH(p, eng) + (u ? ' ' + u : ''),
        pn && pn[1] ? `= ${sg(p)}${coef(p, eng)} ${pn[0]}${u}${u ? '' : ' (' + pn[1] + ')'}` : 'lines up with the unit prefixes'
      ]
    ];
    const rows = [];
    for (let k = e + 4; k >= e - 4; k--) {
      const n = e - k + 1,
        engk = ((k % 3) + 3) % 3 === 0,
        pk = pnm(k);
      rows.push(
        `<div class="sl-row ${k === e ? 'on' : ''}"><span class="m">${sciH(p, k)}</span><span>${
          n === 1 ? '✓ scientific notation: 1 ≤ m &lt; 10' : n >= 2 ? 'coefficient ≥ 10, point not far enough left' : 'coefficient &lt; 1, point not far enough right'
        }${engk ? ` <span class="eng">· engineering${pk && pk[1] ? ' (' + pk[1] + ')' : ''}</span>` : ''}</span></div>`
      );
    }
    const why =
      e > 0
        ? `The point had to move <b>${e}</b> place${e === 1 ? '' : 's'} <b>left</b>, so the exponent is <b>+${e}</b>. Big numbers have positive exponents.`
        : e < 0
          ? `The point had to move <b>${-e}</b> place${e === -1 ? '' : 's'} <b>right</b>, so the exponent is <b>−${-e}</b>. Small numbers have negative exponents.`
          : 'The point is already after the first digit: zero places moved, so the exponent is <b>0</b> (10<sup>0</sup> = 1).';
    return `<div class="vz-canvas"><svg viewBox="0 0 ${W} ${H}" style="max-width:${Math.round(
      W * 1.5
    )}px" role="img" aria-label="decimal point moving to just after the first non-zero digit">${g}</svg></div>
      <div class="vz-note">${why} Every step of the move is a factor of 10, and the exponent is the count of steps with a sign: <b>left = +, right = −</b>.</div>
      <div class="sl-cards">${cards
        .map((c) => `<div class="sl-card"><div class="sl-ch">${c[0]}</div><div class="sl-cv">${c[1]}</div><div class="sl-cs">${c[2]}</div></div>`)
        .join('')}</div>
      <div class="sl-ch" style="margin-top:2px">The same number in nine costumes: only one is scientific notation</div><div class="sl-rows">${rows.join('')}</div>`;
  }

  function viewRuler(p) {
    const e = p.e,
      eng = Math.floor(e / 3) * 3,
      u = p.unit;
    const lo = Math.floor(Math.min(-15, eng - 3) / 3) * 3,
      hi = Math.ceil(Math.max(12, eng + 6) / 3) * 3;
    const W = 840,
      L = 40,
      R = W - 40,
      H = 196,
      X = (v) => L + ((v - lo) / (hi - lo)) * (R - L),
      yA = 106;
    const lv = e + Math.log10(Number(coef(p, e))),
      small = hi - lo > 40;
    let g = `<rect x="${X(eng)}" y="${yA}" width="${X(eng + 3) - X(eng)}" height="62" class="sl-band"/><line x1="${L}" x2="${R}" y1="${yA}" y2="${yA}" class="sl-ax"/>`;
    for (let v = lo; v <= hi; v++) {
      const maj = v % 3 === 0;
      g += `<line x1="${X(v)}" x2="${X(v)}" y1="${yA}" y2="${yA + (maj ? 18 : 9)}" class="sl-tk ${maj ? 'm' : ''}"/>`;
      if (maj) {
        const pn = pnm(v);
        g +=
          (pn && pn[0] ? `<text x="${X(v)}" y="${yA + 38}" class="sl-pf">${pn[0]}</text>` : '') +
          `<text x="${X(v)}" y="${yA + 55}" class="sl-ex" style="font-size:${small ? 9 : 10.5}px">${usup(v)}</text>`;
      }
    }
    const pn = pnm(eng);
    g += `<text x="${(X(eng) + X(eng + 3)) / 2}" y="${yA + 82}" class="sl-bt">${pn && pn[1] ? pn[1] + ' zone: ' : 'zone: '}${usup(
      eng
    )} ≤ x &lt; ${usup(eng + 3)}</text>`;
    const lx = X(lv),
      tx = Math.min(Math.max(lx, 110), W - 110);
    [
      [Math.log10(2e-10), '200 ps stage (L12 s16)'],
      [Math.log10(4e9), '4 GHz clock (L03)']
    ].forEach((l) => {
      const lm = X(l[0]),
        near = Math.abs(lm - lx) < 80,
        side = lx <= lm ? 1 : -1;
      g += `<path d="M${lm} ${yA - 5}l5 5l-5 5l-5 -5z" class="sl-lm"/><text x="${near ? lm + side * 9 : lm}" y="${
        yA - 12
      }" class="sl-lt" style="text-anchor:${near ? (side > 0 ? 'start' : 'end') : 'middle'}">${l[1]}</text>`;
    });
    g += `<line x1="${lx}" x2="${lx}" y1="28" y2="${yA}" class="sl-mv"/><circle cx="${lx}" cy="${yA}" r="6" class="sl-md"/><text x="${tx}" y="18" class="sl-ml">${sg(
      p
    )}${coef(p, e)} × ${usup(e)}${u ? ' ' + u : ''}</text>`;
    const ks = [eng + 6, eng + 3, eng, eng - 3, eng - 6].filter((k) => pnm(k));
    const rows = ks
      .map((k) => {
        const pk = pnm(k);
        return `<div class="sl-row ${k === eng ? 'on' : ''}"><span class="m">${sg(p)}${coef(p, k)} ${pk[0]}${u}</span><span>${
          pk[1] ? pk[1] + ' (' + pk[0] + ')' : 'no prefix'
        } · ${sg(p)}${coef(p, k)} × ${sup(k)}${u ? ' ' + u : ''}</span></div>`;
      })
      .join('');
    return `<div class="vz-canvas"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="number on a ruler of powers of ten">${g}</svg></div>
      <div class="vz-note">Each small tick is <b>×10</b>; each labelled tick is <b>×1000</b> and has its own prefix. The shaded zone is the prefix that gives a coefficient from 1 up to 1000. A number far to the left is tiny (negative exponent), far to the right is huge (positive exponent). ${
        sg(p) ? 'The ruler shows the size, ignoring the minus sign.' : ''
      }</div>
      <div class="sl-ch" style="margin-top:2px">The same value in every nearby prefix${
        u ? '' : ' (add a unit such as s or Hz to the number to see it written with prefixes)'
      }</div><div class="sl-rows">${rows}</div>
      <div class="vz-note sm">One prefix step to the right (for example p → n) means the unit got 1000 times bigger, so the number in front gets 1000 times smaller: move its point <b>3 places left</b>. Going the other way, move it 3 places right.</div>`;
  }

  function viewCalc(pa, pb, op, rawA, rawB) {
    const mul = op === 'mul',
      cA = Number(coef(pa, pa.e)),
      cB = Number(coef(pb, pb.e));
    let c = Number((mul ? cA * cB : cA / cB).toPrecision(12)),
      ec = mul ? pa.e + pb.e : pa.e - pb.e;
    const rc = c,
      re = ec;
    let sh = 0;
    while (c >= 10) {
      c = Number((c / 10).toPrecision(12));
      ec++;
      sh++;
    }
    while (c < 1) {
      c = Number((c * 10).toPrecision(12));
      ec--;
      sh--;
    }
    const neg = pa.neg !== pb.neg,
      cs = fmt(c),
      ap = approx(c);
    const rp = { neg, digits: cs.replace('.', '').replace(/0+$/, '') || '1', e: ec };
    const par = (n) => (n < 0 ? '(' + n + ')' : '' + n),
      sgn = neg ? '−' : '';
    const la = Math.log10(cA) + pa.e,
      lb = Math.log10(cB) + pb.e,
      lr = mul ? la + lb : la - lb;
    const vals = [0, la, lr],
      lo = Math.floor(Math.min(...vals)) - 1,
      hi = Math.ceil(Math.max(...vals)) + 1;
    const W = 840,
      L = 50,
      R = W - 50,
      H = 196,
      X = (v) => L + ((v - lo) / (hi - lo)) * (R - L),
      yAx = 164,
      st = Math.max(1, Math.ceil((hi - lo) / 14));
    const bar = (v0, v1, y, cls) => `<rect x="${X(Math.min(v0, v1))}" y="${y}" width="${Math.max(2, Math.abs(X(v1) - X(v0)))}" height="16" class="${cls}"/>`;
    const lbl = (v, y, t, cls) => `<text x="${Math.min(Math.max(X(v), 120), W - 120)}" y="${y}" class="sl-bl ${cls}">${t}</text>`;
    let g = `<line x1="${X(la)}" x2="${X(la)}" y1="40" y2="${yAx}" class="sl-gd"/><line x1="${X(lr)}" x2="${X(
      lr
    )}" y1="76" y2="${yAx}" class="sl-gd"/><line x1="${L}" x2="${R}" y1="${yAx}" y2="${yAx}" class="sl-ax"/>`;
    for (let v = Math.ceil(lo / st) * st; v <= hi; v += st) {
      g += `<line x1="${X(v)}" x2="${X(v)}" y1="${yAx}" y2="${yAx + 7}" class="sl-tk m"/><text x="${X(v)}" y="${yAx + 21}" class="sl-ex">${
        v === 0 ? '1' : usup(v)
      }</text>`;
    }
    g +=
      bar(0, la, 40, 'sl-bA') +
      lbl(la, 34, `A = ${sciT({ neg: false, digits: pa.digits, e: pa.e })}`, 'a') +
      bar(la, lr, 76, 'sl-bB') +
      lbl(
        (la + lr) / 2,
        70,
        mul ? (lb >= 0 ? 'B adds its length' : 'B is below 1: negative length, walk left') : lb >= 0 ? 'B takes its length away: walk left' : 'B is below 1: dividing walks right',
        'b'
      ) +
      `<circle cx="${X(lr)}" cy="${yAx}" r="6" class="sl-md"/>` +
      lbl(lr, 124, `${mul ? 'A × B' : 'A ÷ B'} = ${sgn}${cs} × ${usup(ec)}`, 'r');
    const sA = esc(rawA.trim()),
      sB = esc(rawB.trim());
    const steps = [
      `<b>Write each number as m × 10ⁿ.</b> <span class="m">${sA} = ${sciH(pa)}</span> and <span class="m">${sB} = ${sciH(pb)}</span>${
        pa.pexp || pb.pexp
          ? '. A prefix is just a power of ten: ' +
            [pa, pb]
              .filter((x) => x.pfx)
              .map((x) => `<span class="m">${x.pfx} = ${sup(x.pexp)}</span>`)
              .join(', ')
          : ''
      }.`,
      `<b>${mul ? 'Multiply' : 'Divide'} the coefficients.</b> <span class="m">${coef(pa, pa.e)} ${mul ? '×' : '÷'} ${coef(pb, pb.e)} = ${fmt(rc)}</span>`,
      `<b>${mul ? 'Add' : 'Subtract'} the exponents.</b> <span class="m">${pa.e} ${mul ? '+' : '−'} ${par(pb.e)} = ${re}</span>. That is the rule ${
        mul ? '10<sup>a</sup> × 10<sup>b</sup> = 10<sup>a + b</sup>' : '10<sup>a</sup> ÷ 10<sup>b</sup> = 10<sup>a − b</sup>'
      }.`,
      `<b>Join them:</b> <span class="m">${fmt(rc)} × ${sup(re)}</span>. ${
        sh === 0
          ? 'The coefficient is already at least 1 and below 10, so this is scientific notation.'
          : `The coefficient must be at least 1 and below 10, so move its point <b>${Math.abs(sh)} place${
              Math.abs(sh) === 1 ? '' : 's'
            } ${sh > 0 ? 'left' : 'right'}</b> and ${sh > 0 ? 'add' : 'subtract'} ${Math.abs(sh)} ${sh > 0 ? 'to' : 'from'} the exponent: <span class="m">${cs} × ${sup(ec)}</span>.`
      }`
    ];
    const eng = Math.floor(ec / 3) * 3,
      pn = pnm(eng);
    const plainTxt = Math.abs(ec) <= 30 ? sgn + coef(rp, 0) : 'too many digits to write out';
    return `<div class="big">${mul ? 'A × B' : 'A ÷ B'} ${ap} ${sgn}${cs} × ${sup(ec)}</div>
      <div class="vz-canvas"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="exponents add on a log scale">${g}</svg></div>
      <div class="vz-note">The ruler is a <b>log scale</b>, so a number is as far from 1 as its exponent says. <b>Multiplying puts the bars end to end</b> (exponents add); <b>dividing walks back</b> along B (exponents subtract).</div>
      <ol class="sl-steps">${steps.map((s) => `<li>${s}</li>`).join('')}</ol>
      <div class="sl-cards"><div class="sl-card"><div class="sl-ch">Scientific</div><div class="sl-cv">${sgn}${cs} × ${sup(
        ec
      )}</div></div><div class="sl-card"><div class="sl-ch">Plain</div><div class="sl-cv">${plainTxt}</div></div><div class="sl-card"><div class="sl-ch">Engineering</div><div class="sl-cv">${sgn}${coef(
        rp,
        eng
      )} × ${sup(eng)}</div><div class="sl-cs">${pn && pn[1] ? 'prefix: ' + pn[1] + ' (' + pn[0] + ')' : 'exponent is a multiple of 3'}</div></div></div>`;
  }

  let tab = $state(untrack(() => opts.tab || 'point'));
  let op = $state(untrack(() => opts.op || 'div'));
  let xVal = $state(untrack(() => opts.x || PX[0]));
  let aVal = $state(untrack(() => (opts.a != null ? String(opts.a) : PC[0][0])));
  let bVal = $state(untrack(() => (opts.b != null ? String(opts.b) : PC[0][2])));

  const bodyHtml = $derived.by(() => {
    if (tab === 'calc') {
      const pa = parse(aVal);
      const pb = parse(bVal);
      if (pa.err) return `<div class="err-msg">A: ${pa.err}</div>`;
      if (pb.err) return `<div class="err-msg">B: ${pb.err}</div>`;
      return viewCalc(pa, pb, op, aVal, bVal);
    }
    const p = parse(xVal);
    if (p.err) return `<div class="err-msg">${p.err}</div>`;
    return tab === 'point' ? viewPoint(p) : viewRuler(p);
  });
</script>

<ToolShell
  title="Scientific notation lab"
  sub="m × 10ⁿ: slide the decimal point, read the exponent, add exponents to multiply"
>
  <div class="vz sl">
    <div class="ps-bar">
      <div class="ps-tg">
        <span>Show</span>
        <div class="seg mini">
          {#each [['point', 'Slide the point'], ['ruler', 'Ruler and prefixes'], ['calc', 'Multiply and divide']] as t}
            <button type="button" aria-pressed={tab === t[0]} onclick={() => (tab = t[0])}>{t[1]}</button>
          {/each}
        </div>
      </div>

      <span class="sl-g" hidden={tab === 'calc'}>
        <label class="sl-in">
          <span>number</span>
          <input type="text" bind:value={xVal} spellcheck="false" autocomplete="off" />
        </label>
      </span>

      <span class="sl-g" hidden={tab !== 'calc'}>
        <label class="sl-in">
          <span>A</span>
          <input type="text" bind:value={aVal} spellcheck="false" autocomplete="off" />
        </label>
        <div class="seg mini">
          <button type="button" aria-pressed={op === 'mul'} onclick={() => (op = 'mul')}>×</button>
          <button type="button" aria-pressed={op === 'div'} onclick={() => (op = 'div')}>÷</button>
        </div>
        <label class="sl-in">
          <span>B</span>
          <input type="text" bind:value={bVal} spellcheck="false" autocomplete="off" />
        </label>
      </span>

      <span class="ref">type 4.3 x 10^-12, 4.3e-12, 0.0000000000043 or 250 ps</span>
    </div>

    <div class="sl-pre">
      <span>try:</span>
      {#if tab === 'calc'}
        {#each PC as c}
          <button
            type="button"
            class="sl-pb"
            onclick={() => {
              aVal = c[0];
              op = c[1];
              bVal = c[2];
            }}
          >
            {c[0]} {c[1] === 'mul' ? '×' : '÷'} {c[2]}
          </button>
        {/each}
      {:else}
        {#each PX as x}
          <button type="button" class="sl-pb" onclick={() => (xVal = x)}>{x}</button>
        {/each}
      {/if}
    </div>

    <div class="sl-body">{@html bodyHtml}</div>
  </div>
</ToolShell>
