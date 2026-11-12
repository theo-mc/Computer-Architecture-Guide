import { esc } from './html.js';

const REG = /\$(?:zero|at|v[01]|a[0-3]|t[0-9]|s[0-8]|k[01]|gp|sp|fp|ra|[12]?[0-9]|3[01])\b/;
const OPS = new Set(
  (
    'add addu addi addiu sub subu and andi or ori nor xor xori sll srl sra sllv srlv srav slt sltu slti sltiu lui lw lh lhu lb lbu sw sh sb ll sc ' +
    'beq bne bgtz blez bltz bgez j jal jr jalr mult multu div divu mfhi mflo mthi mtlo syscall nop move li la blt bgt ble bge b neg not ' +
    'lwc1 swc1 add.s sub.s mul.s div.s add.d sub.d mul.d div.d mul'
  ).split(' ')
);

function tokLine(line) {
  let code = line;
  let cm = '';
  const h = line.search(/#/);
  if (h >= 0) {
    code = line.slice(0, h);
    cm = line.slice(h);
  }
  let out = '';
  let rest = code;
  const lab = rest.match(/^(\s*)([A-Za-z_][\w.]*)(:)/);
  if (lab) {
    out += esc(lab[1]) + `<span class="tk-lab">${esc(lab[2])}</span><span class="tk-p">:</span>`;
    rest = rest.slice(lab[0].length);
  }
  let first = true;
  const re = /(\s+)|(\.[a-z]+)\b|(\$[a-z0-9]+|\bR\d{1,2}\b)|(-?0x[0-9a-f]+|-?0b[01]+|-?\d+)(?![\w$])|("[^"]*")|([A-Za-z_][\w.]*)|([(),:;+\-*/=[\]])|(.)/gi;
  let m;
  while ((m = re.exec(rest))) {
    if (m[1]) { out += m[1]; continue; }
    if (m[2]) { out += `<span class="tk-dir">${esc(m[2])}</span>`; first = false; continue; }
    if (m[3]) { out += `<span class="tk-reg">${esc(m[3])}</span>`; first = false; continue; }
    if (m[4]) {
      out += `<span class="${/0x/i.test(m[4]) ? 'tk-hex' : /0b/i.test(m[4]) ? 'tk-bin' : 'tk-num'}">${esc(m[4])}</span>`;
      first = false;
      continue;
    }
    if (m[5]) { out += `<span class="tk-str">${esc(m[5])}</span>`; first = false; continue; }
    if (m[6]) {
      const w = m[6];
      out +=
        first && (OPS.has(w.toLowerCase()) || /^[a-z]{1,6}(\.[sd])?$/i.test(w))
          ? `<span class="tk-op">${esc(w)}</span>`
          : `<span class="tk-id">${esc(w)}</span>`;
      first = false;
      continue;
    }
    if (m[7]) { out += `<span class="tk-p">${esc(m[7])}</span>`; continue; }
    out += esc(m[8]);
  }
  return out + (cm ? `<span class="tk-com">${esc(cm)}</span>` : '');
}

export const asm = (src) => String(src).split('\n').map(tokLine).join('\n');

export const looksAsm = (t) => {
  const w = t.trim().split(/[\s,]+/)[0].toLowerCase();
  return REG.test(t) || (OPS.has(w) && /\s/.test(t.trim())) || /^\.(data|text|word|asciiz?|globl)\b/.test(t.trim());
};

const looksOp = (t) => OPS.has(t.trim().toLowerCase().replace(/;$/, ''));

const UNIT =
  '(?:%|×|x(?=\\s)|ns|ps|µs|us|ms|s|GHz|MHz|kHz|Hz|W|mW|V|bits?|bytes?|B|KB|KiB|MB|MiB|GB|GiB|cycles?|CC|instructions?|stages?|stalls?|clock cycles?)';
const TOK = new RegExp(
  [
    '(' + REG.source + ')',
    '(\\b0x[0-9A-Fa-f][0-9A-Fa-f_]*\\b)',
    '(\\b0b[01_]+\\b|\\b[01]{4}(?:[ _][01]{4})+\\b|\\b[01]{8,}\\b)',
    '((?<![\\w.$\\u2212/-])[\\u2212-]?(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?(?:\\s?' + UNIT + '(?![\\w]))?(?![\\w$]))'
  ].join('|'),
  'g'
);
const SKIP =
  'script, style, a, code, pre, .tool-h, .fx-h, .mp-ph, kbd, svg, button, input, textarea, select, option, .katex, .katex-display, .tk, .chip, .ref, .nodeco, .bits, .bit, .nl-bits, .fd-r, .hmark, .fm, a.tr, .q-taught, .eyebrow, .caption-src, .sl-x, h1, .page-title';

function wrapNum(s) {
  const m = s.match(new RegExp('^([\\u2212-]?(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?)(\\s?)(' + UNIT + ')?$'));
  if (!m || !m[3]) return `<span class="tk tk-num">${esc(s)}</span>`;
  return `<span class="tk tk-num">${esc(m[1])}${m[2] ? ' ' : ''}<span class="tk-unit">${esc(m[3])}</span></span>`;
}

function decorateText(node) {
  const t = node.nodeValue;
  if (!t || !/[\d$]/.test(t)) return;
  TOK.lastIndex = 0;
  let m;
  let last = 0;
  let html = '';
  let hit = false;
  while ((m = TOK.exec(t))) {
    hit = true;
    html += esc(t.slice(last, m.index));
    if (m[1]) html += `<span class="tk tk-reg">${esc(m[1])}</span>`;
    else if (m[2]) html += `<span class="tk tk-hex">${esc(m[2])}</span>`;
    else if (m[3]) html += `<span class="tk tk-bin">${esc(m[3])}</span>`;
    else html += wrapNum(m[4]);
    last = m.index + m[0].length;
  }
  if (!hit) return;
  html += esc(t.slice(last));
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  node.parentNode.replaceChild(tpl.content, node);
}

export function decorate(el) {
  if (!el || !el.querySelectorAll) return;
  el.querySelectorAll('pre.code:not(.tk-done)').forEach((pre) => {
    pre.classList.add('tk-done');
    if (pre.children.length || pre.closest('.tool, .nodeco')) return;
    pre.innerHTML = asm(pre.textContent.replace(/^\n+|\s+$/g, ''));
    if (!pre.parentElement.classList.contains('codewin')) {
      const w = document.createElement('div');
      w.className = 'codewin';
      w.innerHTML = '<div class="codewin-h"><span class="cw-lang">mips</span><span class="cw-file">assembly</span></div>';
      pre.parentNode.insertBefore(w, pre);
      w.appendChild(pre);
    }
  });
  el.querySelectorAll('code:not(.tk-done)').forEach((c) => {
    c.classList.add('tk-done');
    if (c.closest('pre, .katex, .nodeco') || c.children.length) return;
    const t = c.textContent;
    if (looksAsm(t)) {
      c.innerHTML = asm(t);
      c.classList.add('asm');
    } else if (looksOp(t)) {
      c.innerHTML = `<span class="tk-op">${esc(t)}</span>`;
      c.classList.add('asm');
    }
  });
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (!n.parentElement || n.parentElement.closest(SKIP)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  });
  const nodes = [];
  let n;
  while ((n = walker.nextNode())) nodes.push(n);
  nodes.forEach(decorateText);
}

export const HL = {
  asm,
  decorate,
  esc,
  looksAsm,
  num: (v, cls) => `<span class="tk tk-num ${cls || ''}">${esc(v)}</span>`,
  reg: (r) => `<span class="tk tk-reg">${esc(r)}</span>`,
  hex: (v) => `<span class="tk tk-hex">${esc(v)}</span>`,
  bin: (v) => `<span class="tk tk-bin">${esc(v)}</span>`,
  op: (v) => `<span class="tk-op">${esc(v)}</span>`
};
