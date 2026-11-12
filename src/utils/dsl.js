export const R = String.raw;

export const B = {
  p: (src, ref, html) => ({ t: 'p', src, ref, html }),
  bg: (title, html, ref) => ({ t: 'bg', title, html, ref }),
  wk: (o) => Object.assign({ t: 'worked' }, o),
  tool: (name, opts) => ({ t: 'tool', name, opts: opts || {} }),
  dis: (o) => Object.assign({ t: 'dis' }, o),
  tbl: (o) => Object.assign({ t: 'tbl' }, o),
  dia: (o) => Object.assign({ t: 'dia' }, o),
  tip: (html) => ({ t: 'tip', html }),
  x: (html) => ({ t: 'x', html }),
  key: (title, html) => ({ t: 'key', title, html }),
  analogy: (title, html) => ({ t: 'analogy', title, html }),
  warn: (title, html) => ({ t: 'warn', title, html }),
  check: (q, a) => ({ t: 'check', q, a }),
  code: (o) => Object.assign({ t: 'code' }, o),
  fx: (id, opts) => ({ t: 'fx', id, opts: opts || {} }),
  recipe: (o) => Object.assign({ t: 'recipe' }, o),
  derive: (title, html) => ({ t: 'derive', title, html }),
  read: (rows) => ({ t: 'read', rows }),
  sort: (o) => Object.assign({ t: 'sort' }, o),
  states: (o) => Object.assign({ t: 'states' }, o)
};

export const PIPE = (rows, n) => {
  const R2 = rows.map((r) => {
    const [l, c] = r.split('|');
    return [l.trim(), c.trim().split(/\s+/)];
  });
  const N = n || Math.max(...R2.map((r) => r[1].length));
  const cell = (x) =>
    x === '.'
      ? '<td></td>'
      : x === '*'
        ? '<td class="pst stall">stall</td>'
        : x[0] === '!'
          ? `<td class="pst s-${x.slice(1).toLowerCase()} clash">${x.slice(1)}</td>`
          : x[0] === '^'
            ? `<td class="pst s-${x.slice(1).toLowerCase()} hl">${x.slice(1)}</td>`
            : `<td class="pst s-${x.toLowerCase()}">${x}</td>`;
  return `<div class="tbl-wrap"><table class="pipet"><thead><tr><th></th>${Array.from({ length: N }, (_, i) => `<th>${i + 1}</th>`).join('')}</tr></thead><tbody>${R2.map((r) => `<tr><th class="pl">${r[0]}</th>${r[1].map(cell).join('')}${'<td></td>'.repeat(Math.max(0, N - r[1].length))}</tr>`).join('')}</tbody></table></div>`;
};

export const CODE = (rows) => {
  const arr = Array.isArray(rows) ? rows : [rows];
  const hasPairs = arr.some(Array.isArray);
  if (!hasPairs) return '<pre class="code nomath">' + arr.join('\n') + '</pre>';
  const w = Math.max(...arr.map((r) => (Array.isArray(r) ? r[0] : r).length));
  return (
    '<pre class="code nomath">' +
    arr.map((r) => (Array.isArray(r) ? r[0].padEnd(w + 2) + '# ' + r[1] : r)).join('\n') +
    '</pre>'
  );
};

export const TBL = (head, rows, cls) =>
  '<table class="t ' +
  (cls || 'mono') +
  '"><thead><tr>' +
  head.map((h) => '<th>' + h + '</th>').join('') +
  '</tr></thead><tbody>' +
  rows.map((r) => '<tr>' + r.map((c) => '<td>' + c + '</td>').join('') + '</tr>').join('') +
  '</tbody></table>';

export const Q = (o) => o;

export function ENRICH(topics, id, step, block, where) {
  const t = topics.find((x) => x.id === id);
  if (!t) throw new Error('ENRICH: no topic ' + id);
  const b = t.steps[step - 1].blocks;
  if (where === 'start') b.unshift(block);
  else if (typeof where === 'number') b.splice(where, 0, block);
  else b.push(block);
}

export function NAME(qMap, id, qid, names, extra) {
  const q = (qMap[id] || []).find((x) => x.id === qid);
  if (!q) throw new Error('NAME: no question ' + id + '/' + qid);
  names.forEach((n, i) => {
    const s = q.steps[i];
    if (!s || !n) return;
    s[2] = n[0];
    s[3] = n[1] || '';
    if (n[2]) s[1] = n[2];
  });
  if (extra) Object.assign(q, extra);
}
