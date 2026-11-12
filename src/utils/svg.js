import { esc } from './html.js';
import { Logic } from './logic.js';
import { asm } from './hl.js';

/* ---------- FX SVG helpers ---------- */
export const C = {
  blue: 'var(--c-blue)',
  green: 'var(--c-green)',
  orange: 'var(--c-orange)',
  red: 'var(--c-red)',
  mag: 'var(--c-magenta)',
  cyan: 'var(--c-cyan)',
  teal: 'var(--c-teal)',
  yellow: 'var(--c-yellow)',
  fg: 'var(--fg)',
  mut: 'var(--muted)',
  faint: 'var(--faint)',
  border: 'var(--border-strong)',
  fill: 'var(--fill)'
};

let tsScale = 1;
export function setTextScale(s) {
  tsScale = s;
}

export const svg = (w, h, inner, label) =>
  `<svg viewBox="0 0 ${w} ${h}" class="fxsvg" role="img" aria-label="${esc(label || 'diagram')}">${inner}</svg>`;

export const rect = (x, y, w, h, c, o) =>
  `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(0, w).toFixed(1)}" height="${Math.max(0, h).toFixed(1)}" rx="${(o && o.rx) != null ? o.rx : 3}" style="fill:${c};${o && o.op ? 'fill-opacity:' + o.op + ';' : ''}${o && o.stroke ? 'stroke:' + o.stroke + ';stroke-width:' + (o.sw || 1) + ';' : ''}${o && o.dash ? 'stroke-dasharray:' + o.dash + ';' : ''}"/>`;

export const text = (x, y, s, o) =>
  `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${(o && o.a) || 'start'}" style="fill:${(o && o.c) || C.fg};font-size:${(((o && o.size) || 11) * tsScale).toFixed(1)}px;${o && o.b ? 'font-weight:700;' : ''}${o && o.mono ? 'font-family:var(--mono);' : 'font-family:var(--font);'}">${esc(s)}</text>`;

export const line = (x1, y1, x2, y2, c, o) =>
  `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" style="stroke:${c};stroke-width:${(o && o.w) || 1.2};${o && o.dash ? 'stroke-dasharray:' + o.dash + ';' : ''}"/>`;

export const path = (d, c, o) =>
  `<path d="${d}" style="fill:${(o && o.fill) || 'none'};stroke:${c};stroke-width:${(o && o.w) || 2};${o && o.dash ? 'stroke-dasharray:' + o.dash + ';' : ''}stroke-linejoin:round;stroke-linecap:round"/>`;

export const dot = (x, y, c, r) =>
  `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r || 4}" style="fill:${c};stroke:var(--group);stroke-width:2"/>`;

export const arrow = (x1, y1, x2, y2, c) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = 7;
  return (
    line(x1, y1, x2, y2, c, { w: 1.5 }) +
    `<path d="M${x2} ${y2} L${(x2 - h * Math.cos(a - 0.45)).toFixed(1)} ${(y2 - h * Math.sin(a - 0.45)).toFixed(1)} L${(x2 - h * Math.cos(a + 0.45)).toFixed(1)} ${(y2 - h * Math.sin(a + 0.45)).toFixed(1)}z" style="fill:${c}"/>`
  );
};

export function niceTicks(a, b, n) {
  const span = b - a || 1;
  const step0 = span / (n || 5);
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const r = step0 / mag;
  const step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
  const t = [];
  for (let x = Math.ceil(a / step) * step; x <= b + 1e-9; x += step) t.push(+x.toPrecision(10));
  return t;
}

export function tickLabel(x) {
  const a = Math.abs(x);
  if (a >= 1e6 || (a < 1e-2 && a > 0)) return x.toExponential(0).replace('e+', 'e');
  return String(+x.toPrecision(6));
}

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export function chart(o) {
  const w = o.w || 440;
  const h = o.h || 230;
  const ml = 44;
  const mr = 14;
  const mt = 12;
  const mb = 34;
  const W = w - ml - mr;
  const H = h - mt - mb;
  const lx = o.xlog ? Math.log10 : (x) => x;
  const x0 = lx(o.x[0]);
  const x1 = lx(o.x[1]);
  const X = (x) => ml + ((lx(x) - x0) / (x1 - x0)) * W;
  const Y = (y) => mt + H - ((y - o.y[0]) / (o.y[1] - o.y[0])) * H;
  let g = '';
  const yt = niceTicks(o.y[0], o.y[1], 5);
  yt.forEach((t) => {
    g += line(ml, Y(t), ml + W, Y(t), C.border, { w: 0.6, dash: '2 3' }) +
      text(ml - 6, Y(t) + 4, tickLabel(t), { a: 'end', c: C.mut, size: 10, mono: 1 });
  });
  const xt = o.xlog ? [] : niceTicks(o.x[0], o.x[1], 6);
  if (o.xlog) {
    for (let p = Math.floor(x0); p <= Math.ceil(x1); p++) {
      [1, 2, 5].forEach((m) => {
        const v = m * Math.pow(10, p);
        if (v >= o.x[0] - 1e-12 && v <= o.x[1] + 1e-12) xt.push(v);
      });
    }
  }
  xt.forEach((t) => {
    g += line(X(t), mt + H, X(t), mt + H + 4, C.mut, { w: 1 }) +
      text(X(t), mt + H + 15, tickLabel(t), { a: 'middle', c: C.mut, size: 10, mono: 1 });
  });
  g += line(ml, mt + H, ml + W, mt + H, C.mut, { w: 1 }) + line(ml, mt, ml, mt + H, C.mut, { w: 1 });
  if (o.xl) g += text(ml + W / 2, h - 4, o.xl, { a: 'middle', c: C.mut, size: 10.5 });
  if (o.yl) {
    g += `<text transform="translate(11 ${mt + H / 2}) rotate(-90)" text-anchor="middle" style="fill:${C.mut};font-size:10.5px;font-family:var(--font)">${esc(o.yl)}</text>`;
  }
  (o.hl || []).forEach((hh) => {
    g += line(ml, Y(hh.y), ml + W, Y(hh.y), hh.c || C.red, { w: 1.2, dash: '5 4' }) +
      (hh.label ? text(ml + W - 4, Y(hh.y) - 5, hh.label, { a: 'end', c: hh.c || C.red, size: 10.5, b: 1 }) : '');
  });
  (o.vl || []).forEach((v) => {
    g += line(X(v.x), mt, X(v.x), mt + H, v.c || C.mut, { w: 1, dash: '3 4' }) +
      (v.label ? text(X(v.x) + 4, mt + 10, v.label, { c: v.c || C.mut, size: 10 }) : '');
  });
  (o.series || []).forEach((s, si) => {
    let pts = s.pts;
    if (!pts) {
      pts = [];
      const n = 120;
      for (let i = 0; i <= n; i++) {
        const t = x0 + ((x1 - x0) * i) / n;
        const x = o.xlog ? Math.pow(10, t) : t;
        const y = s.f(x);
        if (isFinite(y)) pts.push([x, y]);
      }
    }
    const d = pts
      .map(
        (p, i) =>
          (i ? 'L' : 'M') +
          X(p[0]).toFixed(1) +
          ' ' +
          Y(clamp(p[1], o.y[0] - (o.y[1] - o.y[0]) * 0.05, o.y[1] + (o.y[1] - o.y[0]) * 0.05)).toFixed(1)
      )
      .join(' ');
    const area =
      si === 0 && !s.dash && !o.noArea && pts.length > 1
        ? `<path d="${d} L${X(pts[pts.length - 1][0]).toFixed(1)} ${(mt + H).toFixed(1)} L${X(pts[0][0]).toFixed(1)} ${(mt + H).toFixed(1)}Z" style="fill:${s.c || C.blue};fill-opacity:.09;stroke:none"/>`
        : '';
    g += `<g clip-path="url(#fxclip${o.id || ''})">${area}${path(d, s.c || C.blue, { w: s.w || 2.4, dash: s.dash })}</g>`;
    if (s.label && pts.length) {
      const p = pts[Math.floor(pts.length * (s.at || 0.7))];
      g += text(X(p[0]) + 4, Y(p[1]) - 7, s.label, { c: s.c || C.blue, size: 10.5, b: 1 });
    }
  });
  (o.marks || []).forEach((m) => {
    const mx = X(m.x);
    const my = Y(clamp(m.y, o.y[0], o.y[1]));
    if (!m.noGuide) {
      g += line(mx, my, mx, mt + H, m.c || C.orange, { w: 1, dash: '3 3' }) +
        line(ml, my, mx, my, m.c || C.orange, { w: 1, dash: '3 3' });
    }
    g +=
      `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="9" style="fill:${m.c || C.orange};fill-opacity:.18"/>` +
      dot(mx, my, m.c || C.orange, 5) +
      (m.label ? text(mx + (m.dx || 10), my + (m.dy || -10), m.label, { c: m.c || C.orange, size: 11.5, b: 1, mono: 1 }) : '');
  });
  return svg(
    w,
    h,
    `<defs><clipPath id="fxclip${o.id || ''}"><rect x="${ml}" y="${mt - 2}" width="${W}" height="${H + 4}"/></clipPath></defs>` + g,
    o.label
  );
}

export function hbars(rows, o) {
  o = o || {};
  const w = o.w || 440;
  const lw = o.lw || 92;
  const rowH = o.rowH || 34;
  const gap = 12;
  const h = rows.length * (rowH + gap) + 16;
  const max = o.max || Math.max(...rows.map((r) => r.segs.reduce((a, s) => a + s.v, 0))) || 1;
  const W = w - lw - (o.rw || 64);
  let g = '';
  rows.forEach((r, i) => {
    const y = 8 + i * (rowH + gap);
    let x = lw;
    g += text(lw - 8, y + rowH / 2 + 4, r.label, { a: 'end', size: 11.5, b: !!r.bold });
    g += rect(lw, y, W, rowH, C.fill, { op: 0.55, rx: 6 });
    r.segs.forEach((s, k) => {
      const sw = (s.v / max) * W;
      g += rect(x, y, sw, rowH, s.c, { op: s.op || 0.9, rx: 6 });
      if (k) g += line(x, y + 4, x, y + rowH - 4, 'var(--group)', { w: 2 });
      if (s.label && sw > 30) g += text(x + sw / 2, y + rowH / 2 + 4, s.label, { a: 'middle', c: '#fff', size: 10.5, b: 1, mono: 1 });
      x += sw;
    });
    if (r.right != null) g += text(x + 8, y + rowH / 2 + 4, r.right, { size: 12, b: 1, c: r.rc || C.fg, mono: 1 });
  });
  if (o.limit != null) {
    const xl = lw + (o.limit / max) * W;
    g += line(xl, 2, xl, h - 4, C.red, { dash: '4 3' }) +
      (o.limitLabel ? text(xl - 4, h - 2, o.limitLabel, { a: 'end', c: C.red, size: 10 }) : '');
  }
  return svg(w, h, g, o.label);
}

export function mixArea(rows, avg) {
  const P = (x, dp) => {
    const s = Logic.fmt(x, dp === undefined ? 4 : dp);
    return s.replace(/\\times/g, '×').replace(/\{|\}/g, '').replace(/\^/g, '^');
  };
  const w = 460;
  const h = 220;
  const ml = 40;
  const mb = 30;
  const mt = 14;
  const W = w - ml - 12;
  const H = h - mt - mb;
  const ymax = Math.max(1, ...rows.map((r) => r[2]), avg) * 1.15;
  const Y = (y) => mt + H - (y / ymax) * H;
  let g = '';
  let x = ml;
  niceTicks(0, ymax, 4).forEach((t) => {
    g += line(ml, Y(t), ml + W, Y(t), C.border, { w: 0.6, dash: '2 3' }) +
      text(ml - 6, Y(t) + 4, tickLabel(t), { a: 'end', c: C.mut, size: 10, mono: 1 });
  });
  rows.forEach((r) => {
    const bw = r[1] * W;
    if (bw > 0.5) {
      g += rect(x, Y(r[2]), bw, H - (Y(r[2]) - mt), r[3], { op: 0.8, rx: 3 });
      if (bw > 44) {
        g += text(x + bw / 2, Y(r[2]) + 16, r[0], { a: 'middle', c: '#fff', size: 12, b: 1 }) +
          text(x + bw / 2, Y(r[2]) + 30, P(r[1]) + '×' + P(r[2]), { a: 'middle', c: '#fff', size: 10, mono: 1 });
      }
      g += text(x + bw / 2, mt + H + 14, Math.round(r[1] * 100) + '%', { a: 'middle', c: r[3], size: 10, mono: 1, b: 1 });
    }
    x += bw;
  });
  g += line(ml, Y(avg), ml + W, Y(avg), C.fg, { w: 1.6, dash: '6 4' }) +
    rect(ml + 4, Y(avg) - 19, 150, 15, 'var(--group)', { op: 0.85, rx: 3 }) +
    text(ml + 8, Y(avg) - 7, 'average CPI = ' + P(avg), { size: 11, b: 1, mono: 1 });
  g += line(ml, mt + H, ml + W, mt + H, C.mut) + line(ml, mt, ml, mt + H, C.mut);
  g += text(ml + W / 2, h - 2, 'share of instructions →', { a: 'middle', c: C.mut, size: 10 }) +
    `<text transform="translate(11 ${mt + H / 2}) rotate(-90)" text-anchor="middle" style="fill:${C.mut};font-size:10px;font-family:var(--font)">cycles each</text>`;
  return svg(w, h, g, 'instruction mix: width = share, height = CPI');
}

export function eaViz(base, off, ea) {
  const w = 440;
  const rowH = 17;
  const lo = Math.min(base, ea) - 8;
  const hi = Math.max(base, ea) + 8;
  const a0 = Math.floor(lo / 4) * 4;
  const rows = [];
  for (let a = a0; a <= hi && rows.length < 24; a += 4) rows.push(a);
  const h = rows.length * rowH + 12;
  const X0 = 150;
  const BW = 120;
  let g = '';
  rows.forEach((a, i) => {
    const y = 6 + i * rowH;
    const isB = a === base - (base % 4) && base % 4 === 0 && a === base;
    const isE = a <= ea && ea < a + 4;
    g += rect(X0, y, BW, rowH - 2, isE ? C.green : isB ? C.blue : C.fill, { rx: 3, op: isE || isB ? 0.9 : 1 }) +
      text(X0 - 8, y + 12, String(a), { a: 'end', mono: 1, size: 10, c: isE ? C.green : isB ? C.blue : C.faint, b: isE || isB });
    if (isB) g += text(X0 + BW / 2, y + 12, 'base', { a: 'middle', c: '#fff', size: 10, b: 1 });
    if (isE) g += text(X0 + BW / 2, y + 12, 'EA' + (ea % 4 ? ' (+' + (ea % 4) + ')' : ''), { a: 'middle', c: '#fff', size: 10, b: 1 });
  });
  const yOf = (a) => 6 + Math.floor((a - a0) / 4) * rowH + rowH / 2 - 1;
  const yb = yOf(base);
  const ye = yOf(ea);
  if (ea !== base) {
    const xA = X0 + BW + 18;
    g += path(`M${X0 + BW + 2} ${yb} C ${xA + 20} ${yb}, ${xA + 20} ${ye}, ${X0 + BW + 6} ${ye}`, C.orange, { w: 2 }) +
      `<path d="M${X0 + BW + 2} ${ye} l7 -4 l0 8z" style="fill:${C.orange}"/>` +
      text(xA + 26, (yb + ye) / 2 + 4, (off < 0 ? '−' : '+') + Math.abs(off) + ' bytes', { c: C.orange, size: 11, b: 1, mono: 1 });
  }
  g += text(X0 - 8, 4 + rows.length * rowH + 6, 'address', { a: 'end', c: C.mut, size: 9.5 });
  return svg(w, h, g, 'memory with base and effective address');
}

/* ---------- Shared pipeline diagram SVG ---------- */
export const PD = { IF: 'var(--st-if)', ID: 'var(--st-id)', EX: 'var(--st-ex)', MEM: 'var(--st-mem)', WB: 'var(--st-wb)' };

export const pdAsm = (t) => asm(t).replace(/<span class="tk-com">[\s\S]*?<\/span>/g, '');

export function pdText(t) {
  const tmp = document.createElement('div');
  tmp.innerHTML = pdAsm(t);
  return [...tmp.childNodes]
    .map((n) => (n.nodeType === 3 ? esc(n.textContent) : `<tspan class="${n.className}">${esc(n.textContent)}</tspan>`))
    .join('');
}

export const pdLegend = () =>
  `<div class="pd-leg">${Object.keys(PD)
    .map((k) => `<span style="--pc:${PD[k]}"><i></i>${k}</span>`)
    .join('')}<span class="lg-st"><i></i>stall / bubble</span><span class="lg-fw"><i></i>forwarding</span><span class="lg-rf"><i></i>reg file: write ½, read ½</span></div>`;

export function pipeSVG(ins, sim, o) {
  o = o || {};
  const T = Math.max(sim.total, o.minCols || 0);
  const N = ins.length;
  const LW = o.lw || 170;
  const CW = o.cw || 44;
  const RH = 30;
  const HD = 26;
  const cyc = o.cyc == null ? T : o.cyc;
  const id = o.id || '';
  const GW = T * CW + 10;
  const H = HD + Math.max(N, o.minRows || 0) * RH + 8;
  const X = (c) => (c - 1) * CW;
  const Y = (i) => HD + i * RH;
  const fut = (c) => o.cyc != null && c > cyc;
  let L = `<text x="6" y="17" class="pd-cn" style="text-anchor:start">cycle →</text>`;
  let g = `<defs><pattern id="pdh${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="3" height="6" class="pd-hatch"/></pattern><marker id="pda${id}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L8 4L0 8z" class="pd-ah"/></marker><marker id="pdr${id}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L8 4L0 8z" class="pd-rh"/></marker></defs>`;
  for (let c = 1; c <= T; c++) {
    if (c % 2 === 0) g += `<rect x="${X(c)}" y="${HD - 2}" width="${CW}" height="${H - HD}" class="pd-zebra"/>`;
    g += `<text x="${X(c) + CW / 2}" y="17" class="pd-cn ${o.cyc != null && c === cyc ? 'now' : ''}">${c}</text>`;
  }
  if (o.cyc != null && cyc >= 1) g += `<rect x="${X(cyc)}" y="2" width="${CW}" height="${H - 4}" rx="6" class="pd-now"/>`;
  sim.rows.forEach((r, i) => {
    const y = Y(i);
    const hl = o.hl && o.hl.indexOf(i) >= 0;
    L += `<g class="pd-lbl ${hl ? 'hl' : ''}"><text x="6" y="${y + RH / 2 + 4}" class="pd-i">I${i + 1}</text><text x="32" y="${y + RH / 2 + 4}" class="pd-t">${o.asm ? o.asm(ins[i].text) : esc(ins[i].text)}</text></g>`;
    for (let c = 1; c <= T; c++) {
      const l = Logic.cell(r, c);
      if (!l) continue;
      const x = X(c) + 2;
      const w = CW - 4;
      const yy = y + 3;
      const h = RH - 6;
      const f = fut(c) ? ' fut' : '';
      if (l === 'stall') g += `<g class="pd-st${f}"><rect x="${x}" y="${yy}" width="${w}" height="${h}" rx="6" fill="url(#pdh${id})"/><text x="${x + w / 2}" y="${yy + h / 2 + 4}">stall</text></g>`;
      else if (l === 'IF*') g += `<g class="pd-hold${f}"><rect x="${x}" y="${yy}" width="${w}" height="${h}" rx="6"/><text x="${x + w / 2}" y="${yy + h / 2 + 4}">IF</text></g>`;
      else g += `<g class="pd-s${f}" style="--pc:${PD[l]}"><rect x="${x}" y="${yy}" width="${w}" height="${h}" rx="6"/><text x="${x + w / 2}" y="${yy + h / 2 + 4}">${l}</text></g>`;
    }
  });
  if (o.arrows !== false) {
    (sim.events || []).forEach((e) => {
      if (e.kind === 'fwd') {
        const c = e.cycle;
        const xx = Math.max(8, X(c));
        const y1 = Y(e.p) + RH - 4;
        const y2 = Y(e.i) + 4;
        const xs = xx - 7;
        const xe = xx + 5;
        g += `<path d="M${xs} ${y1} C ${xs} ${(y1 + y2) / 2}, ${xe} ${(y1 + y2) / 2 - 4}, ${xe} ${y2}" class="pd-fw ${fut(c) ? 'fut' : ''}" marker-end="url(#pda${id})"/>`;
      }
      if (e.kind === 'rf') {
        const c = e.cycle;
        const xx = X(c) + CW / 2;
        const y1 = Y(e.p) + RH - 5;
        const y2 = Y(e.i) + 5;
        g += `<path d="M${xx} ${y1} L${xx} ${y2}" class="pd-rf ${fut(c) ? 'fut' : ''}" marker-end="url(#pdr${id})"/>`;
      }
    });
  }
  return `<div class="pd-wrap" style="--lw:${LW}px"><svg viewBox="0 0 ${LW} ${H}" width="${LW}" height="${H}" class="pd-svg pd-lab" aria-hidden="true">${L}</svg><div class="pd-scroll"><svg viewBox="-8 0 ${GW + 8} ${H}" width="${GW + 8}" height="${H}" class="pd-svg" role="img" aria-label="pipeline diagram">${g}</svg></div></div>`;
}
