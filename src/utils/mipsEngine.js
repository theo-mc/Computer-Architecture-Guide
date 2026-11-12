import { Logic as L } from './logic.js';

export const TEXT = 0x00400000;
export const DATA = 0x10010000;
export const SP0 = 0x7fffeffc;
export const GP0 = 0x10008000;
const N = L.REGNAMES;

export const hex8 = (v) => '0x' + (v >>> 0).toString(16).toUpperCase().padStart(8, '0');

export const parseImm = (t) => {
  t = String(t).trim();
  if (/^-?0x[0-9a-f]+$/i.test(t)) return t[0] === '-' ? -parseInt(t.slice(1), 16) : parseInt(t, 16);
  if (/^-?\d+$/.test(t)) return parseInt(t, 10);
  if (/^'.'$/.test(t)) return t.charCodeAt(1);
  return NaN;
};

export const parseKV = (s) => {
  const o = {};
  String(s || '')
    .split(/[,\n]/)
    .forEach((p) => {
      const m = p.trim().match(/^(\$\w+)\s*=\s*(-?(?:0x[0-9a-f]+|\d+))$/i);
      if (m) o[m[1]] = parseImm(m[2]);
    });
  return o;
};

const splitArgs = (s) => {
  const out = [];
  let cur = '';
  let depth = 0;
  let q = false;
  for (const ch of String(s || '')) {
    if (ch === '"') q = !q;
    if (!q && ch === '(') depth++;
    if (!q && ch === ')') depth--;
    if (!q && ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
};

const fits16 = (v) => v >= -32768 && v <= 32767;

const REAL = {
  add: 'R3', addu: 'R3', sub: 'R3', subu: 'R3', and: 'R3', or: 'R3', xor: 'R3', nor: 'R3', slt: 'R3', sltu: 'R3', mul: 'R3',
  sll: 'SH', srl: 'SH', sra: 'SH', jr: 'JR', jalr: 'JR',
  addi: 'I3', addiu: 'I3', andi: 'I3', ori: 'I3', xori: 'I3', slti: 'I3', sltiu: 'I3', lui: 'LUI',
  lw: 'M', sw: 'M', lb: 'M', lbu: 'M', sb: 'M', beq: 'B', bne: 'B', j: 'J', jal: 'J', syscall: 'SYS'
};
const PSEUDO = { li: 1, la: 1, move: 1, blt: 1, bgt: 1, ble: 1, bge: 1, nop: 1, b: 1, beqz: 1, bnez: 1, not: 1 };

function expandCount(op, a) {
  if (op === 'li') {
    const v = parseImm(a[1]);
    return fits16(v) || (v >= 0 && v <= 65535) ? 1 : 2;
  }
  if (op === 'la') return 2;
  if (op === 'blt' || op === 'bgt' || op === 'ble' || op === 'bge') return 2;
  if ((op === 'lw' || op === 'sw' || op === 'lb' || op === 'lbu' || op === 'sb') && a[1] && !/\(/.test(a[1])) return 3;
  return 1;
}

function reg(t) {
  const r = L.regNum(t);
  if (r < 0) throw new Error(`"${t}" is not a register.`);
  return r;
}

function imm(t, what) {
  const v = parseImm(t);
  if (isNaN(v)) throw new Error(`"${t}" should be a number${what ? ' (' + what + ')' : ''}.`);
  return v;
}

function target(t, labels) {
  if (t in labels) return labels[t];
  const v = parseImm(t);
  if (!isNaN(v)) return v;
  throw new Error(`unknown label "${t}".`);
}

function expand(it, labels) {
  const op = it.op,
    a = it.a;
  const need = (k) => {
    if (a.length !== k) throw new Error(`${op} takes ${k} operand${k > 1 ? 's' : ''}.`);
  };
  const R = (o, d, s, t) => ({ op: o, rd: d, rs: s, rt: t });
  switch (op) {
    case 'li': {
      need(2);
      const d = reg(a[0]),
        v = imm(a[1]);
      if (fits16(v)) return [{ op: 'addiu', rt: d, rs: 0, imm: v, pseudo: true }];
      if (v >= 0 && v <= 65535) return [{ op: 'ori', rt: d, rs: 0, imm: v, pseudo: true }];
      return [{ op: 'lui', rt: 1, imm: (v >>> 16) & 0xffff }, { op: 'ori', rt: d, rs: 1, imm: v & 0xffff }];
    }
    case 'la': {
      need(2);
      const d = reg(a[0]),
        v = target(a[1], labels);
      return [{ op: 'lui', rt: 1, imm: (v >>> 16) & 0xffff }, { op: 'ori', rt: d, rs: 1, imm: v & 0xffff }];
    }
    case 'move':
      need(2);
      return [Object.assign(R('add', reg(a[0]), 0, reg(a[1])), { pseudo: true })];
    case 'not':
      need(2);
      return [Object.assign(R('nor', reg(a[0]), reg(a[1]), 0), { pseudo: true })];
    case 'nop':
      return [{ op: 'sll', rd: 0, rt: 0, sh: 0, pseudo: true }];
    case 'b':
      need(1);
      return [{ op: 'beq', rs: 0, rt: 0, lab: a[0], pseudo: true }];
    case 'beqz':
      need(2);
      return [{ op: 'beq', rs: reg(a[0]), rt: 0, lab: a[1], pseudo: true }];
    case 'bnez':
      need(2);
      return [{ op: 'bne', rs: reg(a[0]), rt: 0, lab: a[1], pseudo: true }];
    case 'blt':
    case 'bge':
      need(3);
      return [R('slt', 1, reg(a[0]), reg(a[1])), { op: op === 'blt' ? 'bne' : 'beq', rs: 1, rt: 0, lab: a[2] }];
    case 'bgt':
    case 'ble':
      need(3);
      return [R('slt', 1, reg(a[1]), reg(a[0])), { op: op === 'bgt' ? 'bne' : 'beq', rs: 1, rt: 0, lab: a[2] }];
  }
  const f = REAL[op];
  if (f === 'R3') {
    need(3);
    return [R(op, reg(a[0]), reg(a[1]), reg(a[2]))];
  }
  if (f === 'SH') {
    need(3);
    const sh = imm(a[2], 'shift amount');
    if (sh < 0 || sh > 31) throw new Error('shift amount must be 0–31.');
    return [{ op, rd: reg(a[0]), rt: reg(a[1]), sh }];
  }
  if (f === 'JR') {
    need(1);
    return [{ op, rs: reg(a[0]), rd: op === 'jalr' ? 31 : 0 }];
  }
  if (f === 'I3') {
    need(3);
    const v = imm(a[2]);
    const z = op === 'andi' || op === 'ori' || op === 'xori';
    if (z ? v < 0 || v > 65535 : !fits16(v)) {
      throw new Error(z ? `${op} needs 0…65535.` : 'immediate must fit in 16 bits (−32768…32767).');
    }
    return [{ op, rt: reg(a[0]), rs: reg(a[1]), imm: v }];
  }
  if (f === 'LUI') {
    need(2);
    return [{ op, rt: reg(a[0]), imm: imm(a[1]) & 0xffff }];
  }
  if (f === 'M') {
    need(2);
    const m = a[1].match(/^(-?(?:0x[0-9a-f]+|\d+)?)\s*\(\s*([^)]+)\)$/i);
    if (m) {
      const off = m[1] ? imm(m[1]) : 0;
      if (!fits16(off)) throw new Error('offset must fit in 16 bits.');
      return [{ op, rt: reg(a[0]), rs: reg(m[2]), imm: off }];
    }
    const v = target(a[1], labels);
    return [
      { op: 'lui', rt: 1, imm: (v >>> 16) & 0xffff },
      { op: 'ori', rt: 1, rs: 1, imm: v & 0xffff },
      { op, rt: reg(a[0]), rs: 1, imm: 0 }
    ];
  }
  if (f === 'B') {
    need(3);
    return [{ op, rs: reg(a[0]), rt: reg(a[1]), lab: a[2] }];
  }
  if (f === 'J') {
    need(1);
    return [{ op, lab: a[0] }];
  }
  if (f === 'SYS') return [{ op }];
  throw new Error('unsupported');
}

function encode(r, labels) {
  const RF = {
    add: 0x20, addu: 0x21, sub: 0x22, subu: 0x23, and: 0x24, or: 0x25, xor: 0x26, nor: 0x27,
    slt: 0x2a, sltu: 0x2b, sll: 0, srl: 2, sra: 3, jr: 8, jalr: 9, syscall: 0x0c
  };
  const IO = {
    addi: 8, addiu: 9, slti: 10, sltiu: 11, andi: 12, ori: 13, xori: 14, lui: 15,
    lw: 0x23, sw: 0x2b, lb: 0x20, lbu: 0x24, sb: 0x28, beq: 4, bne: 5
  };
  const pack = (fs) => {
    let w = 0;
    fs.forEach((f) => {
      w = w * Math.pow(2, f.width) + ((f.value >>> 0) % Math.pow(2, f.width));
    });
    return w >>> 0;
  };
  if (r.op === 'mul') {
    const fs = [
      { name: 'op', width: 6, value: 0x1c },
      { name: 'rs', width: 5, value: r.rs },
      { name: 'rt', width: 5, value: r.rt },
      { name: 'rd', width: 5, value: r.rd },
      { name: 'shamt', width: 5, value: 0 },
      { name: 'funct', width: 6, value: 2 }
    ];
    return { format: 'R', fields: fs, word: pack(fs) };
  }
  if (r.op in RF) {
    const fs = [
      { name: 'op', width: 6, value: 0 },
      { name: 'rs', width: 5, value: r.rs || 0 },
      { name: 'rt', width: 5, value: r.rt || 0 },
      { name: 'rd', width: 5, value: r.rd || 0 },
      { name: 'shamt', width: 5, value: r.sh || 0 },
      { name: 'funct', width: 6, value: RF[r.op] }
    ];
    return { format: 'R', fields: fs, word: pack(fs) };
  }
  if (r.op === 'j' || r.op === 'jal') {
    let t;
    try {
      t = target(r.lab, labels);
    } catch (e) {
      return { error: e.message };
    }
    r.tgt = t;
    const fs = [
      { name: 'op', width: 6, value: r.op === 'j' ? 2 : 3 },
      { name: 'address', width: 26, value: (t >>> 2) & 0x3ffffff, note: 'target ÷ 4' }
    ];
    return { format: 'J', fields: fs, word: pack(fs) };
  }
  if (r.op in IO) {
    let v = r.imm;
    if (r.op === 'beq' || r.op === 'bne') {
      let t;
      try {
        t = target(r.lab, labels);
      } catch (e) {
        return { error: e.message };
      }
      r.tgt = t;
      v = (t - (r.addr + 4)) / 4;
      r.imm = v;
      if (!fits16(v)) return { error: 'branch target too far away.' };
    }
    const fs = [
      { name: 'op', width: 6, value: IO[r.op] },
      { name: 'rs', width: 5, value: r.rs || 0 },
      { name: 'rt', width: 5, value: r.rt || 0 },
      { name: 'immediate', width: 16, value: v & 0xffff, signed: v }
    ];
    return { format: 'I', fields: fs, word: pack(fs) };
  }
  return { error: 'cannot encode ' + r.op };
}

export function assemble(src) {
  const lines = String(src).split('\n'),
    errors = [],
    labels = {},
    items = [],
    data = new Map(),
    dataLabels = [];
  let seg = 'text',
    pc = TEXT,
    dp = DATA;
  const err = (ln, m) => errors.push(`Line ${ln}: ${m}`);
  lines.forEach((raw, i) => {
    const ln = i + 1;
    let s = raw.replace(/#.*$/, '').trim();
    if (!s) return;
    let lm;
    while ((lm = s.match(/^([A-Za-z_][\w.]*)\s*:\s*(.*)$/))) {
      if (labels[lm[1]] != null) err(ln, `label "${lm[1]}" is defined twice.`);
      labels[lm[1]] = seg === 'text' ? pc : dp;
      if (seg === 'data') dataLabels.push([lm[1], dp]);
      s = lm[2].trim();
    }
    if (!s) return;
    if (s[0] === '.') {
      const m = s.match(/^\.(\w+)\s*(.*)$/),
        d = m[1].toLowerCase(),
        rest = m[2];
      if (d === 'data') { seg = 'data'; return; }
      if (d === 'text') { seg = 'text'; return; }
      if (d === 'globl' || d === 'align') return;
      if (seg !== 'data') { err(ln, `.${d} belongs in the .data section.`); return; }
      if (d === 'word') {
        if (dp % 4) {
          const old = dp;
          dp += 4 - (dp % 4);
          Object.keys(labels).forEach((k) => {
            if (labels[k] === old && dataLabels.some((x) => x[0] === k)) labels[k] = dp;
          });
          dataLabels.forEach((x) => {
            if (x[1] === old) x[1] = dp;
          });
        }
        splitArgs(rest).forEach((t) => {
          const v = parseImm(t);
          if (isNaN(v)) { err(ln, `"${t}" is not a number.`); return; }
          for (let k = 0; k < 4; k++) data.set(dp + k, (v >>> (24 - 8 * k)) & 255);
          dp += 4;
        });
        return;
      }
      if (d === 'space') {
        const n = parseImm(rest);
        if (isNaN(n)) err(ln, '.space needs a byte count.');
        else {
          for (let k = 0; k < n; k++) data.set(dp + k, 0);
          dp += n;
        }
        return;
      }
      if (d === 'asciiz' || d === 'ascii') {
        const m2 = rest.match(/^"(.*)"$/);
        if (!m2) { err(ln, 'Strings go in double quotes.'); return; }
        const str = m2[1].replace(/\\n/g, '\n');
        for (const ch of str) data.set(dp++, ch.charCodeAt(0) & 255);
        if (d === 'asciiz') data.set(dp++, 0);
        return;
      }
      if (d === 'byte') {
        splitArgs(rest).forEach((t) => {
          data.set(dp++, parseImm(t) & 255);
        });
        return;
      }
      err(ln, `the directive .${d} isn't supported here.`);
      return;
    }
    if (seg === 'data') { err(ln, 'instructions belong in the .text section.'); return; }
    const m = s.match(/^([a-zA-Z]+)\s*(.*)$/);
    if (!m) { err(ln, `can't read "${raw.trim()}".`); return; }
    const op = m[1].toLowerCase(),
      a = splitArgs(m[2]);
    if (!REAL[op] && !PSEUDO[op]) { err(ln, `"${op}" isn't an instruction this simulator knows.`); return; }
    const n = expandCount(op, a);
    items.push({ ln, src: s, op, a, addr: pc, n });
    pc += 4 * n;
  });
  const text = [];
  items.forEach((it) => {
    try {
      expand(it, labels).forEach((r, k) => {
        r.addr = it.addr + 4 * k;
        r.ln = it.ln;
        r.src = it.src;
        r.pseudo = !REAL[it.op] || it.n > 1 || r.pseudo;
        r.k = k;
        r.of = it.n;
        const enc = encode(r, labels);
        r.word = enc.word;
        r.fields = enc.fields;
        r.format = enc.format;
        if (enc.error) throw new Error(enc.error);
        text.push(r);
      });
    } catch (e) {
      err(it.ln, e.message);
    }
  });
  return { text, data, labels, dataLabels, errors, lines, items };
}

export function asmText(r) {
  const n = (x) => N[x];
  switch (r.op) {
    case 'sll':
    case 'srl':
    case 'sra':
      return r.rd === 0 && r.rt === 0 && r.sh === 0 ? 'sll $zero, $zero, 0' : `${r.op} ${n(r.rd)}, ${n(r.rt)}, ${r.sh}`;
    case 'jr':
      return `jr ${n(r.rs)}`;
    case 'jalr':
      return `jalr ${n(r.rs)}`;
    case 'syscall':
      return 'syscall';
    case 'j':
    case 'jal':
      return `${r.op} ${r.lab}`;
    case 'beq':
    case 'bne':
      return `${r.op} ${n(r.rs)}, ${n(r.rt)}, ${r.lab}`;
    case 'lui':
      return `lui ${n(r.rt)}, 0x${(r.imm >>> 0).toString(16).toUpperCase()}`;
    case 'lw':
    case 'sw':
    case 'lb':
    case 'lbu':
    case 'sb':
      return `${r.op} ${n(r.rt)}, ${r.imm}(${n(r.rs)})`;
    case 'addi':
    case 'addiu':
    case 'andi':
    case 'ori':
    case 'xori':
    case 'slti':
    case 'sltiu':
      return `${r.op} ${n(r.rt)}, ${n(r.rs)}, ${
        r.op === 'ori' || r.op === 'andi' || r.op === 'xori'
          ? r.imm > 255
            ? '0x' + r.imm.toString(16).toUpperCase()
            : r.imm
          : r.imm
      }`;
    default:
      return `${r.op} ${n(r.rd)}, ${n(r.rs)}, ${n(r.rt)}`;
  }
}

export function newMachine(prog, regInit) {
  const M = {
    prog,
    regs: new Int32Array(32),
    mem: new Map(prog.data),
    pc: TEXT,
    halted: false,
    out: '',
    calls: [],
    hist: [],
    last: null,
    lastAddr: null,
    error: null,
    steps: 0,
    byAddr: new Map()
  };
  prog.text.forEach((r) => M.byAddr.set(r.addr, r));
  M.regs[29] = SP0;
  M.regs[28] = GP0;
  M.regs[31] = 0;
  Object.keys(regInit || {}).forEach((k) => {
    const r = L.regNum(k);
    if (r > 0) M.regs[r] = regInit[k] | 0;
  });
  M.init = Int32Array.from(M.regs);
  return M;
}

const rb = (M, a) => (M.mem.has(a >>> 0) ? M.mem.get(a >>> 0) : 0);
export function rw(M, a) {
  a = a >>> 0;
  return ((rb(M, a) << 24) | (rb(M, a + 1) << 16) | (rb(M, a + 2) << 8) | rb(M, a + 3)) | 0;
}

export function stepM(M) {
  if (M.halted) return { done: true };
  const r = M.byAddr.get(M.pc >>> 0);
  if (!r) {
    M.halted = true;
    return {
      done: true,
      msg: M.pc === 0 ? 'Returned to address 0 ($ra’s starting value): the program has finished.' : 'Ran past the last instruction: the program has finished.'
    };
  }
  const rec = {
    pc: M.pc,
    regs: Int32Array.from(M.regs),
    mem: [],
    out: M.out.length,
    calls: M.calls.slice(),
    halted: M.halted,
    last: M.last,
    steps: M.steps
  };
  const R = M.regs,
    ch = { regs: [], mem: [] };
  let next = (M.pc + 4) | 0,
    rtl = '',
    note = '';
  const set = (d, v) => {
    if (d === 0) {
      note = note || 'Writes to $zero are ignored: it always reads 0.';
      return;
    }
    R[d] = v | 0;
    ch.regs.push(d);
  };
  const wb = (a, v) => {
    a = a >>> 0;
    rec.mem.push([a, M.mem.has(a) ? M.mem.get(a) : undefined]);
    M.mem.set(a, v & 255);
    ch.mem.push(a);
  };
  const v = (x) => R[x],
    nm = (x) => N[x];
  try {
    switch (r.op) {
      case 'add':
      case 'addu':
      case 'sub':
      case 'subu':
      case 'and':
      case 'or':
      case 'xor':
      case 'nor':
      case 'slt':
      case 'sltu':
      case 'mul': {
        const x = v(r.rs),
          y = v(r.rt);
        let res;
        const sym = { add: '+', addu: '+', sub: '−', subu: '−', and: '&', or: '|', xor: '^', nor: 'NOR', mul: '×' }[r.op];
        if (r.op === 'add' || r.op === 'addu') res = x + y;
        else if (r.op === 'sub' || r.op === 'subu') res = x - y;
        else if (r.op === 'and') res = x & y;
        else if (r.op === 'or') res = x | y;
        else if (r.op === 'xor') res = x ^ y;
        else if (r.op === 'nor') res = ~(x | y);
        else if (r.op === 'mul') res = Math.imul(x, y);
        else if (r.op === 'slt') res = x < y ? 1 : 0;
        else res = x >>> 0 < y >>> 0 ? 1 : 0;
        if ((r.op === 'add' || r.op === 'sub') && res !== (res | 0)) {
          throw new Error(`${r.op}: ${x} ${sym} ${y} = ${res} doesn't fit in 32 bits — real MIPS raises an overflow exception here (use addu/subu to ignore overflow).`);
        }
        set(r.rd, res);
        rtl =
          r.op === 'slt' || r.op === 'sltu'
            ? `${nm(r.rd)} ← (${nm(r.rs)} < ${nm(r.rt)}) ? 1 : 0 = (${x} < ${y}) ? 1 : 0 = ${R[r.rd]}`
            : `${nm(r.rd)} ← ${nm(r.rs)} ${sym} ${nm(r.rt)} = ${x} ${sym} ${y} = ${R[r.rd]}`;
        if (r.op === 'add' && r.rs === 0 && r.pseudo) note = 'This is the pseudo-instruction move: copy a register by adding it to $zero (L07 s4).';
        break;
      }
      case 'addi':
      case 'addiu':
      case 'andi':
      case 'ori':
      case 'xori':
      case 'slti':
      case 'sltiu': {
        const x = v(r.rs),
          k = r.imm;
        let res;
        if (r.op === 'addi' || r.op === 'addiu') res = x + k;
        else if (r.op === 'andi') res = x & k;
        else if (r.op === 'ori') res = x | k;
        else if (r.op === 'xori') res = x ^ k;
        else if (r.op === 'slti') res = x < k ? 1 : 0;
        else res = x >>> 0 < k >>> 0 ? 1 : 0;
        if (r.op === 'addi' && res !== (res | 0)) throw new Error('addi overflowed 32 bits — real MIPS raises an exception.');
        set(r.rt, res);
        const sym = { addi: '+', addiu: '+', andi: '&', ori: '|', xori: '^', slti: '<', sltiu: '<' }[r.op];
        rtl = `${nm(r.rt)} ← ${nm(r.rs)} ${sym} ${k} = ${x} ${sym} ${k} = ${R[r.rt]}`;
        note =
          r.op === 'andi' || r.op === 'ori' || r.op === 'xori'
            ? 'The 16-bit immediate is zero-extended for logical instructions.'
            : 'The 16-bit immediate is sign-extended to 32 bits.';
        if (r.pseudo && r.rs === 0) note = 'This is li (load immediate): add the constant to $zero.';
        break;
      }
      case 'sll':
      case 'srl':
      case 'sra': {
        const x = v(r.rt);
        const res = r.op === 'sll' ? x << r.sh : r.op === 'srl' ? x >>> r.sh : x >> r.sh;
        if (r.rd === 0 && r.rt === 0) {
          rtl = 'nop — sll $zero, $zero, 0 does nothing';
          break;
        }
        set(r.rd, res);
        rtl = `${nm(r.rd)} ← ${nm(r.rt)} ${r.op === 'sll' ? '<<' : '>>'} ${r.sh} = ${x} ${r.op === 'sll' ? '×' : '÷'} ${Math.pow(2, r.sh)} = ${R[r.rd]}`;
        break;
      }
      case 'lui':
        set(r.rt, r.imm << 16);
        rtl = `${nm(r.rt)} ← 0x${r.imm.toString(16).toUpperCase()} << 16 = ${hex8(R[r.rt])}`;
        note = 'lui puts the constant in the upper 16 bits; the next ori fills the lower 16 (how la and big li work).';
        break;
      case 'lw':
      case 'lb':
      case 'lbu': {
        const a = (v(r.rs) + r.imm) | 0;
        if (r.op === 'lw' && a % 4) throw new Error(`address ${hex8(a)} is not a multiple of 4 — lw needs an aligned word address.`);
        const val = r.op === 'lw' ? rw(M, a) : r.op === 'lb' ? (rb(M, a) << 24) >> 24 : rb(M, a);
        set(r.rt, val);
        rtl = `address = ${nm(r.rs)} + ${r.imm} = ${hex8(v(r.rs))} + ${r.imm} = ${hex8(a)};  ${nm(r.rt)} ← Memory[${hex8(a)}] = ${val}`;
        M.lastAddr = a;
        break;
      }
      case 'sw':
      case 'sb': {
        const a = (v(r.rs) + r.imm) | 0;
        if (r.op === 'sw' && a % 4) throw new Error(`address ${hex8(a)} is not a multiple of 4 — sw needs an aligned word address.`);
        const val = v(r.rt);
        if (r.op === 'sw') for (let k = 0; k < 4; k++) wb(a + k, val >>> (24 - 8 * k));
        else wb(a, val);
        rtl = `address = ${nm(r.rs)} + ${r.imm} = ${hex8(v(r.rs))} + ${r.imm} = ${hex8(a)};  Memory[${hex8(a)}] ← ${nm(r.rt)} = ${val}`;
        M.lastAddr = a;
        break;
      }
      case 'beq':
      case 'bne': {
        const x = v(r.rs),
          y = v(r.rt),
          eq = x === y,
          take = r.op === 'beq' ? eq : !eq;
        if (take) next = r.tgt;
        rtl = `${nm(r.rs)} = ${x}, ${nm(r.rt)} = ${y} → ${eq ? 'equal' : 'not equal'} → ${
          take ? `branch TAKEN: PC ← (PC + 4) + 4 × ${r.imm} = ${hex8(r.tgt)} (${r.lab})` : 'not taken: fall through to PC + 4'
        }`;
        break;
      }
      case 'j':
        next = r.tgt;
        rtl = `PC ← ${hex8(r.tgt)} (${r.lab})`;
        break;
      case 'jal':
        set(31, M.pc + 4);
        next = r.tgt;
        M.calls.push({ name: r.lab, ret: M.pc + 4, sp: v(29) });
        rtl = `$ra ← PC + 4 = ${hex8(M.pc + 4)};  PC ← ${hex8(r.tgt)} (${r.lab})`;
        note = 'jal saves where to come back to in $ra, then jumps.';
        break;
      case 'jr':
      case 'jalr': {
        const t = v(r.rs);
        if (r.op === 'jalr') set(31, M.pc + 4);
        next = t;
        rtl = `PC ← ${nm(r.rs)} = ${hex8(t)}`;
        if (r.rs === 31 && M.calls.length) {
          const c = M.calls.pop();
          note = `Return from ${c.name}.`;
        }
        if (t === 0) note = 'Jumping to 0 ($ra’s starting value) ends the program.';
        break;
      }
      case 'syscall': {
        const code = v(2);
        if (code === 1) {
          M.out += String(v(4));
          rtl = `print_int($a0 = ${v(4)})`;
        } else if (code === 11) {
          M.out += String.fromCharCode(v(4) & 255);
          rtl = `print_char($a0)`;
        } else if (code === 4) {
          let a = v(4) >>> 0,
            s = '',
            g = 0;
          while (rb(M, a) && g++ < 1000) s += String.fromCharCode(rb(M, a++));
          M.out += s;
          rtl = `print_string at ${hex8(v(4))}`;
        } else if (code === 10) {
          M.halted = true;
          rtl = 'exit';
        } else throw new Error(`syscall code $v0 = ${code} isn't supported (use 1 print int, 4 print string, 10 exit, 11 print char).`);
        note = 'syscall asks the operating system to do something; $v0 says what.';
        break;
      }
      default:
        throw new Error(`can't execute ${r.op}`);
    }
  } catch (e) {
    M.halted = true;
    M.error = `Line ${r.ln} (${r.src}): ${e.message}`;
    return { error: M.error };
  }
  M.hist.push(rec);
  if (M.hist.length > 5000) M.hist.shift();
  M.pc = next | 0;
  M.steps++;
  M.last = { r, rtl, note, ch };
  if (!M.byAddr.has(M.pc >>> 0)) {
    if (M.pc === 0 || !M.byAddr.size || M.pc >>> 0 > Math.max(...M.byAddr.keys())) M.halted = true;
  }
  return { r, rtl, note, ch };
}

export function back(M) {
  const rec = M.hist.pop();
  if (!rec) return false;
  M.pc = rec.pc;
  M.regs.set(rec.regs);
  for (let k = rec.mem.length - 1; k >= 0; k--) {
    const [a, old] = rec.mem[k];
    if (old === undefined) M.mem.delete(a);
    else M.mem.set(a, old);
  }
  M.out = M.out.slice(0, rec.out);
  M.calls = rec.calls;
  M.halted = false;
  M.error = null;
  M.last = rec.last;
  M.steps = rec.steps;
  return true;
}
