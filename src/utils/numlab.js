import { Logic as L } from './logic.js';
import { esc } from './html.js';
import { stepsHTML } from './refs.js';

export const P2 = (n) => Math.pow(2, n);
export const grp = (b, g = 4) => {
  let o = '';
  for (let i = 0; i < b.length; i++) {
    if (i && (b.length - i) % g === 0) o += ' ';
    o += b[i];
  }
  return o;
};
export const fmtN = (x) => x.toLocaleString('en-GB');
export const fmtV = (u, n) => (n <= 16 ? '0b' + L.bin(u, n) : '0x' + L.hex(u, n));

const nlSteps = (s) =>
  stepsHTML(
    s.map((q) => [/^\s*</.test(q[0]) || /\\\(/.test(q[0]) ? q[0] : '\\(\\displaystyle ' + q[0] + '\\)', q[1]])
  );

export function parseVal(str, n) {
  let v = String(str || '').trim().replace(/[\s_]/g, '');
  if (!v) return { err: 'Type a number: 13, −115, 0x8D or 0b10001101.' };
  v = v.replace(/^−/, '-');
  let m;
  if ((m = v.match(/^(-?)0x([0-9a-f]+)$/i))) {
    const x = parseInt(m[2], 16);
    if (m[1]) return { err: 'Write negative numbers in decimal (hex is a bit pattern).' };
    if (x >= P2(n)) return { err: `0x${m[2].toUpperCase()} needs more than ${n} bits.` };
    return { u: x, how: 'hex' };
  }
  if ((m = v.match(/^0b([01]+)$/i))) {
    if (m[1].length > n) return { err: `That pattern has ${m[1].length} bits; the width is ${n}.` };
    return { u: parseInt(m[1], 2), how: 'bin' };
  }
  if (/^[01]+$/.test(v) && v.length === n && v.length > 3) return { u: parseInt(v, 2), how: 'bin' };
  if (/^-?\d+$/.test(v)) {
    const x = Number(v);
    if (x < -P2(n - 1)) return { err: `${x} is below the smallest ${n}-bit two's complement value (${-P2(n - 1)}).` };
    if (x > P2(n) - 1) return { err: `${x} is above the largest ${n}-bit unsigned value (${fmtN(P2(n) - 1)}).` };
    return { u: L.mask(x, n), how: x < 0 ? 'neg' : 'dec', dec: x };
  }
  return { err: 'Not a number I can read. Use decimal (−115), hex (0x8D) or binary (0b10001101).' };
}

export function bitRow(u, n, key, o = {}, phone = false) {
  const bits = L.bitsOf(u, n);
  const hx = L.hex(u, n);
  const fld = (i) => (!o.fields ? '' : i === 31 ? 'f-s' : i >= 23 ? 'f-e' : 'f-f');
  let idx = '',
    bt = '',
    wt = '',
    nb = '';
  bits.forEach((b, i) => {
    const k = n - 1 - i;
    const msb = k === n - 1 && o.signed !== false && !o.fields;
    idx += `<span>${k}</span>`;
    bt += `<button type="button" class="nl-bit ${b ? 'on' : ''} ${msb ? 'msb' : ''} ${fld(k)} ${
      o.hl && o.hl.indexOf(k) >= 0 ? 'hl' : ''
    } ${k % 4 === 0 && k ? 'nb' : ''}" data-bit="${k}" data-k="${key}" ${
      o.ro ? 'tabindex="-1" aria-disabled="true" title="Worked out from A — flip A’s bits to change it"' : ''
    } aria-label="bit ${k} = ${b}${o.ro ? ' (result, read-only)' : ''}">${b}</button>`;
    wt += `<span class="${msb ? 'neg' : ''}">${
      o.noW || n > 16 ? '' : (msb ? '−' : '') + (n <= 8 ? P2(k) : '2<sup>' + k + '</sup>')
    }</span>`;
  });
  if (!o.noHex) for (let q = 0; q < n / 4; q++) nb += `<span style="grid-column:span 4">${hx[q]}</span>`;
  const one = (idx2, bt2, wt2, nb2, nn) =>
    `<div class="nl-board ${o.ro ? 'ro' : ''} ${o.small ? 'sm' : ''}" style="--n:${nn}">${
      o.noIdx ? '' : `<div class="nl-idx">${idx2}</div>`
    }<div class="nl-bits">${bt2}</div>${o.noW || n > 16 ? '' : `<div class="nl-wt">${wt2}</div>`}${
      o.noHex ? '' : `<div class="nl-nib">${nb2}</div>`
    }</div>`;
  const parts = n >= 32 ? (phone ? 4 : 2) : n >= 16 && phone ? 2 : 1;
  if (parts > 1) {
    const cut = (html, tag) => {
      const items = html.split(tag).filter(Boolean).map((x) => tag + x);
      const sz = items.length / parts;
      return Array.from({ length: parts }, (_, i) => items.slice(i * sz, (i + 1) * sz).join(''));
    };
    const I = cut(idx, '<span>');
    const Bt = cut(bt, '<button');
    const Wt = cut(wt, '<span');
    const Nb = cut(nb, '<span');
    return `<div class="nl-halves" data-n="${n}" data-p="${parts}">${I.map((_, i) => one(I[i], Bt[i], Wt[i], Nb[i], n / parts)).join('')}</div>`;
  }
  return one(idx, bt, wt, nb, n);
}

export function wheel(n, u, extra) {
  if (n !== 4) {
    const lo = -P2(n - 1),
      hi = P2(n) - 1,
      W = 520,
      X = (x) => 20 + ((x - lo) / (hi - lo)) * (W - 40),
      s = L.signed(u, n);
    let g = `<line x1="20" y1="40" x2="${W - 20}" y2="40" style="stroke:var(--muted)"/>`;
    g += `<rect x="${X(0)}" y="22" width="${X(hi) - X(0)}" height="8" rx="3" style="fill:var(--c-blue);fill-opacity:.35"/><rect x="${X(lo)}" y="50" width="${X(P2(n - 1) - 1) - X(lo)}" height="8" rx="3" style="fill:var(--c-orange);fill-opacity:.35"/>`;
    g += `<circle cx="${X(u)}" cy="26" r="6" style="fill:var(--c-blue)"/><circle cx="${X(s)}" cy="54" r="6" style="fill:var(--c-orange)"/>`;
    g += `<text x="${X(u)}" y="14" text-anchor="middle" style="fill:var(--c-blue);font:600 11px var(--mono)">${fmtN(u)}</text><text x="${X(s)}" y="76" text-anchor="middle" style="fill:var(--c-orange);font:600 11px var(--mono)">${fmtN(s)}</text>`;
    g += `<text x="20" y="92" style="fill:var(--muted);font:11px var(--font)">${fmtN(lo)}</text><text x="${X(0)}" y="92" text-anchor="middle" style="fill:var(--muted);font:11px var(--font)">0</text><text x="${W - 20}" y="92" text-anchor="end" style="fill:var(--muted);font:11px var(--font)">${fmtN(hi)}</text>`;
    return `<svg viewBox="0 0 ${W} 98" class="nl-line" role="img" aria-label="number line">${g}</svg><div class="nl-cap"><span class="sw-b">unsigned reading</span> <span class="sw-o">two's complement reading</span> — the same ${n} bits, two places on the line.</div>`;
  }
  const R = 108,
    cx = 160,
    cy = 158;
  let g = '';
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * 2 * Math.PI - Math.PI / 2,
      x = cx + R * Math.cos(a),
      y = cy + R * Math.sin(a),
      s = k >= 8 ? k - 16 : k,
      on = k === u,
      on2 = extra && extra.r === k;
    g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="15" style="fill:${on ? 'var(--c-blue)' : on2 ? 'var(--c-green)' : 'var(--fill)'};stroke:${k === 8 ? 'var(--c-red)' : 'none'};stroke-width:2"/>`;
    g += `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="middle" style="fill:${on || on2 ? '#fff' : 'var(--fg)'};font:600 9.5px var(--mono)">${k.toString(2).padStart(4, '0')}</text>`;
    const x2 = cx + (R + 31) * Math.cos(a),
      y2 = cy + (R + 31) * Math.sin(a),
      x3 = cx + (R - 33) * Math.cos(a),
      y3 = cy + (R - 33) * Math.sin(a);
    g += `<text x="${x2.toFixed(1)}" y="${(y2 + 4).toFixed(1)}" text-anchor="middle" style="fill:var(--c-blue);font:600 11px var(--mono)">${k}</text><text x="${x3.toFixed(1)}" y="${(y3 + 4).toFixed(1)}" text-anchor="middle" style="fill:var(--c-orange);font:600 11px var(--mono)">${s}</text>`;
  }
  g += `<line x1="${cx}" y1="${cy - R + 16}" x2="${cx}" y2="${cy - R - 40}" style="stroke:var(--c-blue);stroke-width:2;stroke-dasharray:4 3"/><text x="${cx + 6}" y="${cy - R - 30}" style="fill:var(--c-blue);font:600 10px var(--font)">unsigned wraps</text>`;
  g += `<line x1="${cx}" y1="${cy + R - 16}" x2="${cx}" y2="${cy + R + 40}" style="stroke:var(--c-red);stroke-width:2;stroke-dasharray:4 3"/><text x="${cx + 6}" y="${cy + R + 38}" style="fill:var(--c-red);font:600 10px var(--font)">signed overflows</text>`;
  if (extra && extra.from != null && extra.r != null && extra.from !== extra.r) {
    const steps = extra.op === 'sub' ? -extra.delta : extra.delta,
      a0 = (extra.from / 16) * 2 * Math.PI - Math.PI / 2,
      a1 = a0 + (steps / 16) * 2 * Math.PI,
      rr = R - 58;
    const large = Math.abs(steps) > 8 ? 1 : 0,
      sweep = steps > 0 ? 1 : 0;
    g += `<path d="M${(cx + rr * Math.cos(a0)).toFixed(1)} ${(cy + rr * Math.sin(a0)).toFixed(1)} A${rr} ${rr} 0 ${large} ${sweep} ${(cx + rr * Math.cos(a1)).toFixed(1)} ${(cy + rr * Math.sin(a1)).toFixed(1)}" style="fill:none;stroke:var(--c-green);stroke-width:3;marker-end:url(#nlarr)"/>`;
  }
  return `<svg viewBox="0 0 320 320" class="nl-dial" role="img" aria-label="4-bit number wheel"><defs><marker id="nlarr" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10z" style="fill:var(--c-green)"/></marker></defs>${g}</svg><div class="nl-cap"><span class="sw-b">outer: unsigned</span> · <span class="sw-o">inner: two's complement</span> · adding moves clockwise</div>`;
}

export function dial(n, u, extra) {
  if (n === 4) return wheel(4, u, extra);
  const cx = 150,
    cy = 150,
    R = 92,
    T = P2(n),
    s = L.signed(u, n),
    ang = (x) => (x / T) * 2 * Math.PI - Math.PI / 2;
  const P = (r, x) => [cx + r * Math.cos(ang(x)), cy + r * Math.sin(ang(x))];
  const arc = (a0, a1, r, cls) => {
    const p0 = P(r, a0),
      p1 = P(r, a1),
      large = (a1 - a0) / T > 0.5 ? 1 : 0;
    return `<path d="M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A${r} ${r} 0 ${large} 1 ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}" class="${cls}"/>`;
  };
  let g = arc(0, T / 2 - T * 0.002, R, 'dl-pos') + arc(T / 2 + T * 0.002, T - T * 0.002, R, 'dl-neg');
  const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹',
    sup = (k) =>
      String(k)
        .split('')
        .map((c) => SUP[+c])
        .join(''),
    pw = (k, neg) => (n > 8 ? (neg ? '−' : '') + '2' + sup(k) : (neg ? '−' : '') + fmtN(P2(k)));
  const tq = n - 2,
    th = n - 1;
  [
    [0, '0', '0'],
    [T / 4, pw(tq), pw(tq)],
    [T / 2, pw(th), pw(th, 1)],
    [3 * T / 4, n > 8 ? '3·2' + sup(tq) : fmtN((3 * T) / 4), pw(tq, 1)]
  ].forEach(([x, a, b2], k) => {
    const o = P(R + 10, x),
      i1 = P(R - 10, x),
      lo = P(R + 24, x),
      li = P(R - 26, x),
      anc = k === 1 ? 'start' : k === 3 ? 'end' : 'middle';
    g += `<line x1="${o[0].toFixed(1)}" y1="${o[1].toFixed(1)}" x2="${i1[0].toFixed(1)}" y2="${i1[1].toFixed(1)}" class="dl-tk"/><text x="${lo[0].toFixed(1)}" y="${(lo[1] + 4).toFixed(1)}" text-anchor="${anc}" class="dl-u">${a}</text><text x="${li[0].toFixed(1)}" y="${(li[1] + 4).toFixed(1)}" text-anchor="${k === 1 ? 'end' : k === 3 ? 'start' : 'middle'}" class="dl-s">${b2}</text>`;
  });
  g += `<line x1="${cx}" y1="${cy + R - 18}" x2="${cx}" y2="${cy + R + 18}" class="dl-ov"/>`;
  const tip = P(R + 2, u),
    base = P(18, u);
  g += `<line x1="${base[0].toFixed(1)}" y1="${base[1].toFixed(1)}" x2="${tip[0].toFixed(1)}" y2="${tip[1].toFixed(1)}" class="dl-nd"/><circle cx="${tip[0].toFixed(1)}" cy="${tip[1].toFixed(1)}" r="6" class="dl-dot ${u >= T / 2 ? 'neg' : ''}"/><circle cx="${cx}" cy="${cy}" r="4" class="dl-hub"/>`;
  g += `<text x="${cx}" y="${cy - 14}" text-anchor="middle" class="dl-cu">${fmtN(u)}</text><text x="${cx}" y="${cy + 26}" text-anchor="middle" class="dl-cs">${fmtN(s)}</text>`;
  return `<svg viewBox="0 0 300 300" class="nl-dial" role="img" aria-label="${n}-bit number circle">${g}</svg><div class="nl-cap"><span class="sw-b">outside: unsigned</span> · <span class="sw-o">inside: two's complement</span> · left half = top bit 1</div>`;
}

export function explainConvert(u, n, how, dec) {
  const bits = L.bitsOf(u, n),
    s = L.signed(u, n),
    ones = [];
  bits.forEach((b, i) => {
    if (b) ones.push(n - 1 - i);
  });
  const unsignedTerms = ones.map((i) => P2(i));
  let h = '';
  if (how === 'dec' || how === 'neg') {
    const pos = Math.abs(dec),
      d = L.decToBin(pos);
    h += `<details data-resize class="nl-x" open><summary>Decimal ${pos} → binary (repeated division by 2)</summary><div class="tbl-wrap"><table class="t mono nl-div"><thead><tr><th>Number</th><th>÷ 2 =</th><th>remainder</th></tr></thead><tbody>${d.rows
      .map((r) => `<tr><td>${r.n}</td><td>${r.q}</td><td><b>${r.r}</b></td></tr>`)
      .join('')}</tbody></table></div>`;
    h +=
      nlSteps([
        [String.raw`\text{remainders read from the bottom up: } ${d.bits}`, 'Each division by 2 peels off the lowest bit; the last remainder found is the highest bit.'],
        [String.raw`\text{pad to } ${n} \text{ bits: } ${L.bin(L.mask(pos, n), n, 4).replace(/ /g, '\\ ')}`, 'Add zeros on the left; they don’t change the value.']
      ]) + '</details>';
    if (how === 'neg') {
      const e = L.twosEncode(dec, n);
      h +=
        `<details data-resize class="nl-x" open><summary>${dec} in ${n}-bit two's complement (invert and add 1)</summary>` +
        nlSteps([
          [String.raw`+${pos} = ${L.bin(e.posBits, n, 4).replace(/ /g, '\\ ')}`, 'Start from the positive value.'],
          [String.raw`\text{invert: } ${L.bin(e.inv, n, 4).replace(/ /g, '\\ ')}`, 'Flip every bit.'],
          [String.raw`+1: ${L.bin(e.result, n, 4).replace(/ /g, '\\ ')}`, 'Add one. The result is the pattern for the negative number.']
        ]) +
        '</details>';
    }
  }
  h +=
    `<details data-resize class="nl-x" ${how === 'bin' || how === 'hex' ? 'open' : ''}><summary>Binary → unsigned decimal</summary>` +
    nlSteps([
      [String.raw`\text{1-bits at positions } ${ones.length ? ones.join(', ') : '\\text{none}'}`, 'Bit i is worth 2ⁱ; count positions from 0 on the right.'],
      [String.raw`${unsignedTerms.length ? unsignedTerms.map(fmtN).join(' + ') : '0'} = ${fmtN(u)}`, 'Add the place values of the 1s.']
    ]) +
    '</details>';
  h +=
    `<details data-resize class="nl-x" ${how === 'bin' || how === 'hex' ? 'open' : ''}><summary>Binary → two's complement decimal</summary>` +
    nlSteps(
      bits[0]
        ? [
            [String.raw`\text{top bit (bit } ${n - 1}) = 1 \Rightarrow \text{weight } -2^{${n - 1}} = -${fmtN(P2(n - 1))}`, 'In two’s complement the top bit counts NEGATIVE.'],
            [String.raw`\text{the other bits: } ${fmtN(u - P2(n - 1))}`, 'Same place values as unsigned.'],
            [String.raw`-${fmtN(P2(n - 1))} + ${fmtN(u - P2(n - 1))} = ${fmtN(s)}`, 'Add them.'],
            [String.raw`\text{check: } ${fmtN(u)} - 2^{${n}} = ${fmtN(u)} - ${fmtN(P2(n))} = ${fmtN(s)}`, 'Shortcut: a pattern with top bit 1 is its unsigned value minus 2ⁿ.']
          ]
        : [[String.raw`\text{top bit} = 0 \Rightarrow \text{same as unsigned} = ${fmtN(u)}`, 'Non-negative numbers look identical in both systems.']]
    ) +
    '</details>';
  const nib = [];
  for (let i = 0; i < n / 4; i++) nib.push(L.bin(u, n).slice(i * 4, i * 4 + 4));
  h +=
    `<details data-resize class="nl-x"><summary>Binary ↔ hex</summary>` +
    nlSteps([
      [String.raw`${nib.map((x) => '\\texttt{' + x + '}').join('\\ ')}`, 'Split into groups of 4 bits from the right (one hex digit each).'],
      [String.raw`${nib.map((x) => '\\texttt{' + parseInt(x, 2).toString(16).toUpperCase() + '}').join('\\ \\ ')} \Rightarrow \texttt{0x${L.hex(u, n)}}`, 'Each group of 4 is 0–15: 10 = A, 11 = B, 12 = C, 13 = D, 14 = E, 15 = F.']
    ]) +
    '</details>';
  return h;
}

export function addPanel(st) {
  const n = st.n,
    r = L.addSub(st.a, st.b, n, st.op),
    bb = r.bb,
    A = L.bitsOf(st.a, n),
    B = L.bitsOf(bb, n),
    Rb = L.bitsOf(r.result, n),
    car = r.carries.slice().reverse();
  const col = st.col;
  const cell = (v, idx, cls) =>
    `<td class="${cls || ''} ${col === idx ? 'colhl' : ''} ${(n - 1 - idx) % 4 === 0 && idx !== n - 1 ? 'g' : ''}">${v}</td>`;
  let t = `<div class="tbl-wrap"><table class="nl-add nodeco" data-n="${n}"><tbody>`;
  t += `<tr class="cr"><th>carry</th><td class="co">${car[0] ? '1' : ''}</td>${A.map((_, i) => {
    const idx = n - 1 - i;
    return cell(r.carries[idx] ? '1' : '', idx, 'c');
  }).join('')}</tr>`;
  t += `<tr><th>A</th><td></td>${A.map((b, i) => cell(b, n - 1 - i)).join('')}</tr>`;
  if (st.op === 'sub') t += `<tr class="orig"><th>B</th><td></td>${L.bitsOf(st.b, n).map((b, i) => cell(b, n - 1 - i, 'strike')).join('')}</tr>`;
  t += `<tr><th>${st.op === 'sub' ? '+(−B)' : '+ B'}</th><td>+</td>${B.map((b, i) => cell(b, n - 1 - i)).join('')}</tr>`;
  t += `<tr class="sum"><th>=</th><td class="co">${car[0] ? '<s>1</s>' : ''}</td>${Rb.map((b, i) => cell(b, n - 1 - i, 'res')).join('')}</tr></tbody></table></div>`;
  const sA = r.sA,
    sB = r.sB,
    sR = L.signed(r.result, n),
    flags = {
      C: r.op === 'sub' ? (r.a >= r.b ? 1 : 0) : r.carryOut,
      V: r.signedOverflow ? 1 : 0,
      N: Rb[0],
      Z: r.result === 0 ? 1 : 0
    };
  let colTxt = '';
  if (col != null) {
    const ai = L.bitsOf(st.a, n)[n - 1 - col],
      bi = B[n - 1 - col],
      ci = r.carries[col],
      tot = ai + bi + ci;
    colTxt = `Bit ${col}: ${ai} + ${bi} + carry-in ${ci} = ${tot} → write <b>${tot % 2}</b>, carry <b>${tot >= 2 ? 1 : 0}</b> into bit ${col + 1}${
      col === n - 1 ? ' (out of the word)' : ''
    }.`;
  }
  const unsignedLine =
    st.op === 'sub'
      ? `${fmtN(r.a)} − ${fmtN(r.b)} = ${fmtN(r.a - r.b)}${r.a < r.b ? ' — negative, so it can’t be an unsigned result (borrow)' : ''}`
      : `${fmtN(r.a)} + ${fmtN(r.b)} = ${fmtN(r.a + r.b)}${r.unsignedOverflow ? ` — needs ${n + 1} bits: unsigned overflow (carry out)` : ' — fits'}`;
  const signedLine = `${fmtN(sA)} ${st.op === 'sub' ? '−' : '+'} ${sB < 0 ? '(' + fmtN(sB) + ')' : fmtN(sB)} = ${fmtN(r.trueSigned)}${
    r.signedOverflow
      ? ` — outside ${fmtN(-P2(n - 1))} … ${fmtN(P2(n - 1) - 1)}: <b>signed overflow</b>, the ${n}-bit result reads as ${fmtN(sR)}`
      : ' — fits'
  }`;
  const whyV =
    st.op === 'add'
      ? L.bitsOf(st.a, n)[0] !== L.bitsOf(st.b, n)[0]
        ? 'A and B have different signs, so adding them can never overflow.'
        : r.signedOverflow
          ? 'Both operands have the same sign but the result’s sign is different — that is exactly the overflow rule.'
          : 'Both operands have the same sign and so does the result — no overflow.'
      : L.bitsOf(st.a, n)[0] === L.bitsOf(st.b, n)[0]
        ? 'A and B have the same sign, so A − B can never overflow.'
        : r.signedOverflow
          ? 'Signs differ and the result has the sign of B — overflow.'
          : 'Signs differ but the result keeps A’s sign — no overflow.';
  let h = `<div class="nl-addwrap"><div>${t}<div class="nl-colx">${colTxt || 'Press <b>column ▶</b> to walk the carries from bit 0 upwards.'}</div></div></div>`;
  h += `<div class="nl-flags">${Object.keys(flags)
    .map(
      (k) =>
        `<span class="nl-flag ${flags[k] ? 'on' : ''}" title="${{
          C: st.op === 'sub' ? 'no borrow (A ≥ B unsigned)' : 'carry out of the top bit',
          V: 'signed overflow',
          N: 'result is negative (top bit)',
          Z: 'result is zero'
        }[k]}"><b>${k}</b>${flags[k]}</span>`
    )
    .join('')}<span class="nl-flagk">C carry · V overflow · N negative · Z zero</span></div>`;
  h += `<dl class="kv nl-kv"><dt>Unsigned</dt><dd>${unsignedLine}</dd><dt>Signed</dt><dd>${signedLine}</dd><dt>Why</dt><dd>${whyV}</dd><dt>MIPS</dt><dd>${
    r.signedOverflow
      ? '<code>add</code>/<code>sub</code> would raise an overflow exception; <code>addu</code>/<code>subu</code> just keep the wrapped result.'
      : 'No exception from <code>add</code>/<code>sub</code> (no signed overflow).'
  }</dd></dl>`;
  if (st.op === 'sub') {
    h +=
      `<details data-resize class="nl-x"><summary>Why subtraction is “add the two's complement”</summary>` +
      nlSteps([
        [String.raw`B = ${L.bin(st.b, n, 4).replace(/ /g, '\\ ')}`, 'The number being subtracted.'],
        [String.raw`\overline{B} = ${L.bin(r.inverted, n, 4).replace(/ /g, '\\ ')}`, 'Invert every bit.'],
        [String.raw`\overline{B} + 1 = ${L.bin(bb, n, 4).replace(/ /g, '\\ ')} = -B`, 'Adding one gives −B, so A − B = A + (−B) and the same adder does both.']
      ]) +
      '</details>';
  }
  return h;
}

export function negPanel(st, phone = false) {
  const n = st.n,
    u = st.a,
    inv = P2(n) - 1 - u,
    r = L.mask(inv + 1, n),
    s = L.signed(u, n),
    rs = L.signed(r, n);
  return (
    `<div class="nl-stack"><div><span class="nl-lab">A</span>${bitRow(u, n, 'a', { noW: 1, noIdx: 1, small: 1 }, phone)}</div><div><span class="nl-lab">flip</span>${bitRow(
      inv,
      n,
      'ro',
      { ro: 1, noW: 1, noIdx: 1, noHex: 1, small: 1 },
      phone
    )}</div><div><span class="nl-lab">+1</span>${bitRow(r, n, 'ro', { ro: 1, noW: 1, noIdx: 1, small: 1 }, phone)}</div></div>` +
    nlSteps([
      [String.raw`A = ${L.bin(u, n, 4).replace(/ /g, '\\ ')} = ${s}`, 'Read as two’s complement.'],
      [String.raw`\overline{A} = ${L.bin(inv, n, 4).replace(/ /g, '\\ ')}`, 'Flip every bit (0 ↔ 1).'],
      [
        String.raw`\overline{A} + 1 = ${L.bin(r, n, 4).replace(/ /g, '\\ ')} = ${rs}`,
        s === -P2(n - 1)
          ? `Special case: ${s} has no positive partner in ${n} bits (the largest is ${P2(n - 1) - 1}), so negating gives the same pattern back — an overflow.`
          : `${rs} = −(${s}). Invert-and-add-1 always negates.`
      ]
    ]) +
    `<p class="nl-tip">Shortcut by hand: copy bits from the right up to and including the first 1, then flip everything to its left.</p><button type="button" class="btn sm" data-nl="useneg">Put −A into A</button>`
  );
}

export function extPanel(st, phone = false) {
  const n = st.n,
    to = st.to > n ? st.to : Math.min(32, n * 2),
    u = st.a,
    se = L.signExtend(u, n, to, true).result,
    ze = u;
  if (n === 32) return '<p class="muted">A is already 32 bits. Choose a smaller width to extend it.</p>';
  return `<div class="nl-stack"><div><span class="nl-lab">A</span>${bitRow(u, n, 'a', { noW: 1, noIdx: 1, small: 1 }, phone)}</div><div><span class="nl-lab">sign-ext</span>${bitRow(
    se,
    to,
    'ro',
    { ro: 1, noW: 1, noIdx: 1, small: 1, hl: Array.from({ length: to - n }, (_, i) => n + i) },
    phone
  )}</div><div><span class="nl-lab">zero-ext</span>${bitRow(
    ze,
    to,
    'ro',
    { ro: 1, noW: 1, noIdx: 1, small: 1, hl: Array.from({ length: to - n }, (_, i) => n + i) },
    phone
  )}</div></div>
    <dl class="kv nl-kv"><dt>Sign-extend</dt><dd>copies the top bit (${L.bitsOf(u, n)[0]}) into the ${to - n} new bits → 0x${L.hex(se, to)} = ${fmtN(
      L.signed(se, to)
    )} signed (A was ${fmtN(L.signed(u, n))}: same value)</dd><dt>Zero-extend</dt><dd>fills with 0 → 0x${L.hex(ze, to)} = ${fmtN(ze)} (A was ${fmtN(
      u
    )} unsigned: same value)</dd><dt>MIPS</dt><dd><code>addi</code>, <code>lw</code>/<code>sw</code> offsets and branch offsets <b>sign</b>-extend their 16-bit immediate; <code>andi</code>, <code>ori</code> and <code>xori</code> <b>zero</b>-extend it (L08 s13).</dd></dl>`;
}

export function shiftPanel(st, phone = false) {
  const n = st.n,
    u = st.a,
    k = Math.max(0, Math.min(n - 1, st.k | 0)),
    op = st.sop;
  let r, expl;
  const B = st.b;
  if (op === 'sll') {
    r = L.mask(u * P2(k), n);
    expl = [
      [String.raw`\text{move every bit left } ${k}`, 'Bits leaving the top are lost; zeros come in on the right.'],
      [
        String.raw`${fmtN(u)} \times 2^{${k}} = ${(BigInt(u) * 2n ** BigInt(k)).toLocaleString('en-GB')}${
          u * P2(k) >= P2(n) ? `\\ \\to \\bmod 2^{${n}} = ${fmtN(r)}` : ''
        }`,
        u * P2(k) >= P2(n) ? 'Too big for the width, so the top bits fall off.' : 'Shifting left by k multiplies by 2ᵏ.'
      ]
    ];
  } else if (op === 'srl') {
    r = Math.floor(u / P2(k));
    expl = [
      [String.raw`\text{move every bit right } ${k}`, 'Zeros come in on the left (logical shift); bits leaving the right are lost.'],
      [String.raw`\left\lfloor ${fmtN(u)} \div 2^{${k}} \right\rfloor = ${fmtN(r)}`, 'An unsigned divide by 2ᵏ, rounding down.']
    ];
  } else if (op === 'sra') {
    const s = L.signed(u, n);
    r = L.mask(Math.floor(s / P2(k)), n);
    expl = [
      [String.raw`\text{move right } ${k}, \text{ copying the sign bit in}`, 'Arithmetic shift keeps negative numbers negative.'],
      [String.raw`\left\lfloor ${fmtN(s)} \div 2^{${k}} \right\rfloor = ${fmtN(L.signed(r, n))}`, 'A signed divide by 2ᵏ that rounds towards −∞.']
    ];
  } else {
    const a = L.bitsOf(u, n),
      b = L.bitsOf(B, n),
      f = { and: (x, y) => x & y, or: (x, y) => x | y, xor: (x, y) => x ^ y, nor: (x, y) => 1 - (x | y) }[op];
    r = L.fromBits(a.map((x, i) => f(x, b[i])));
    expl = [
      [
        String.raw`\text{bit by bit: } ${
          { and: '1\\text{ only if both are }1', or: '1\\text{ if either is }1', xor: '1\\text{ if they differ}', nor: '1\\text{ only if both are }0' }[op]
        }`,
        {
          and: 'AND is used to clear bits (a mask keeps only the bits that are 1 in the mask).',
          or: 'OR is used to set bits.',
          xor: 'XOR flips bits where the other operand has 1s.',
          nor: 'NOR with $zero gives NOT (MIPS has no NOT instruction).'
        }[op]
      ]
    ];
  }
  const logic = ['and', 'or', 'xor', 'nor'].indexOf(op) >= 0;
  return (
    `<div class="nl-stack"><div><span class="nl-lab">A</span>${bitRow(u, n, 'a', { noW: 1, noIdx: 1, small: 1 }, phone)}</div>${
      logic ? `<div><span class="nl-lab">B</span>${bitRow(B, n, 'b', { noW: 1, noIdx: 1, small: 1 }, phone)}</div>` : ''
    }<div><span class="nl-lab">${op}</span>${bitRow(r, n, 'ro', { ro: 1, noW: 1, noIdx: 1, small: 1 }, phone)}</div></div>
    <dl class="kv nl-kv"><dt>Result</dt><dd>0x${L.hex(r, n)} = ${fmtN(r)} unsigned = ${fmtN(L.signed(r, n))} signed</dd></dl>` +
    nlSteps(expl) +
    `<button type="button" class="btn sm" data-nl="useres" data-v="${r}">Put the result into A</button>`
  );
}

export function encodeSteps(x) {
  const s = x < 0 ? 1 : 0,
    ax = Math.abs(x),
    ip = Math.floor(ax);
  let fp = ax - ip;
  const fb = [];
  let k = 0;
  while (fp > 0 && k < 24) {
    fp *= 2;
    fb.push(fp >= 1 ? 1 : 0);
    if (fp >= 1) fp -= 1;
    k++;
  }
  const ib = ip.toString(2),
    bin = ib + (fb.length ? '.' + fb.join('') : ''),
    e = ib !== '0' ? ib.length - 1 : -(fb.indexOf(1) + 1);
  const mant = (ib !== '0' ? ib.slice(1) + fb.join('') : fb.slice(fb.indexOf(1) + 1).join('')).padEnd(23, '0').slice(0, 23);
  return [
    [String.raw`S = ${s}`, x < 0 ? 'Negative.' : 'Positive or zero.'],
    [String.raw`${ip} = ${ib}_2`, 'Integer part by repeated division by 2.'],
    [
      String.raw`0.${String(ax - ip).split('.')[1] || '0'} \to .${fb.join('') || '0'}_2`,
      'Fraction part by repeated doubling: each time, the integer part (0 or 1) is the next bit.' +
        (k >= 24 && fp > 0 ? ' It never ends, so it is cut off (rounded) — the value is not exact.' : '')
    ],
    [String.raw`${bin}_2 = 1.${mant.replace(/0+$/, '') || '0'}_2 \times 2^{${e}}`, 'Move the binary point so there is exactly one 1 before it (normalise).'],
    [String.raw`\text{Exponent} = ${e} + 127 = ${e + 127} = ${(e + 127).toString(2).padStart(8, '0')}_2`, 'Add the bias.'],
    [String.raw`\text{Fraction} = ${mant}`, 'The bits after the point, padded to 23 bits. The leading 1 is not stored.']
  ];
}

export function ieeePanel(st) {
  if (st.n !== 32) {
    return `<p class="muted">IEEE 754 single precision uses 32 bits. <button type="button" class="btn sm" data-nl="w32">Switch to 32 bits</button></p>`;
  }
  const u = st.a,
    d = L.ieeeDecode(u),
    bs = L.bin(u, 32),
    S = bs[0],
    E = bs.slice(1, 9),
    Fr = bs.slice(9),
    e = parseInt(E, 2);
  let h = `<div class="nl-fp nodeco"><span class="s">${S}</span><span class="e">${E}</span><span class="f">${Fr}</span></div><div class="nl-fpk nodeco"><span class="s">sign 1 bit</span><span class="e">exponent 8 bits (bias 127)</span><span class="f">fraction 23 bits</span></div>`;
  if (d.kind === 'normal') {
    h += nlSteps([
      [String.raw`S = ${S} \Rightarrow (-1)^{${S}} = ${S === '1' ? '-1' : '1'}`, 'The sign bit.'],
      [String.raw`\text{Exponent} = ${E}_2 = ${e},\quad ${e} - 127 = ${e - 127}`, 'Stored with a bias of 127: subtract it.'],
      [String.raw`\text{Fraction} = 0.${Fr.replace(/0+$/, '') || '0'}_2 = ${L.fmt(d.frac, 8)}`, 'Bits after the binary point are worth ½, ¼, ⅛, …'],
      [String.raw`${S === '1' ? '-' : ''}(1 + ${L.fmt(d.frac, 8)}) \times 2^{${e - 127}} = ${L.fmt(d.value, 10)}`, 'Put back the hidden leading 1, scale by the power of 2, apply the sign.']
    ]);
  } else {
    h += `<p class="muted">Special pattern (${d.kind}): exponent ${e === 0 ? 'all 0s' : 'all 1s'}. ${
      d.kind === 'zero'
        ? S === '1'
          ? 'This is −0 (negative zero): it equals 0 but keeps its sign.'
          : 'This is +0.'
        : d.kind === 'inf'
          ? 'This is ±infinity.'
          : d.kind === 'nan'
            ? 'Not a Number.'
            : `A denormal: no hidden 1, exponent fixed at −126, so the value is ${S === '1' ? '−' : ''}0.${Fr.replace(/0+$/, '')}₂ × 2⁻¹²⁶ ≈ ${d.value.toExponential(4)}.`
    }</p>`;
  }
  if (st.fenc) h += `<details data-resize class="nl-x" open><summary>How ${esc(st.fenc.x)} was encoded</summary>${nlSteps(st.fenc.steps)}</details>`;
  return h;
}
