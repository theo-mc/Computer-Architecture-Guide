/* CSC3058 revision site — pure logic (no DOM). */
const L = {};

  /* ---------- number formatting ---------- */
  L.round = (x, dp) => { const p = Math.pow(10, dp); return Math.round(x * p + (x >= 0 ? 1e-9 : -1e-9)) / p; };
  // Plain decimal string, at most dp decimals, trailing zeros stripped
  L.fmt = function (x, dp) {
    if (dp === undefined) dp = 4;
    if (!isFinite(x)) return x > 0 ? '\\infty' : (x < 0 ? '-\\infty' : '\\text{undefined}');
    if (x === 0) return '0';
    const ax = Math.abs(x);
    if (ax < Math.pow(10, -dp) || ax >= 1e9) {
      let e = Math.floor(Math.log10(ax));
      let m = L.round(x / Math.pow(10, e), 4);
      if (Math.abs(m) >= 10) { m = L.round(m / 10, 4); e += 1; }
      return m + ' \\times 10^{' + e + '}';
    }
    let s = L.round(x, dp).toFixed(dp);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return s;
  };
  // '=' if the shown value is exact, otherwise '\approx'
  L.eq = function (x, dp) {
    if (dp === undefined) dp = 4;
    if (!isFinite(x)) return '=';
    return Math.abs(L.round(x, dp) - x) < 1e-12 * Math.max(1, Math.abs(x)) ? '=' : '\\approx';
  };
  L.pct = (x, dp) => L.fmt(x * 100, dp === undefined ? 2 : dp) + '\\%';

  /* ---------- units ---------- */
  L.TIME = { s: 1, ms: 1e-3, 'µs': 1e-6, ns: 1e-9, ps: 1e-12 };
  L.FREQ = { Hz: 1, kHz: 1e3, MHz: 1e6, GHz: 1e9 };
  L.TIME_TEX = { s: '\\text{s}', ms: '\\text{ms}', 'µs': '\\mu\\text{s}', ns: '\\text{ns}', ps: '\\text{ps}' };
  L.FREQ_TEX = { Hz: '\\text{Hz}', kHz: '\\text{kHz}', MHz: '\\text{MHz}', GHz: '\\text{GHz}' };
  L.EXP = { s: 0, ms: -3, 'µs': -6, ns: -9, ps: -12, Hz: 0, kHz: 3, MHz: 6, GHz: 9 };
  L.bestTime = function (sec) {
    const a = Math.abs(sec);
    const order = ['s', 'ms', 'µs', 'ns', 'ps'];
    for (const u of order) if (a >= L.TIME[u] * 0.9999999) return { v: sec / L.TIME[u], u };
    return { v: sec / 1e-12, u: 'ps' };
  };
  L.bestFreq = function (hz) {
    const a = Math.abs(hz);
    const order = ['GHz', 'MHz', 'kHz', 'Hz'];
    for (const u of order) if (a >= L.FREQ[u] * 0.9999999) return { v: hz / L.FREQ[u], u };
    return { v: hz, u: 'Hz' };
  };
  L.timeTex = function (sec, dp) { const b = L.bestTime(sec); return L.fmt(b.v, dp) + '\\,' + L.TIME_TEX[b.u]; };
  L.freqTex = function (hz, dp) { const b = L.bestFreq(hz); return L.fmt(b.v, dp) + '\\,' + L.FREQ_TEX[b.u]; };

  /* ---------- binary / two's complement ---------- */
  const P2 = n => Math.pow(2, n);
  L.mask = (v, n) => { const m = P2(n); return ((v % m) + m) % m; };
  L.bitsOf = (u, n) => { const a = []; for (let i = n - 1; i >= 0; i--) a.push(Math.floor(u / P2(i)) % 2); return a; };
  L.fromBits = bits => bits.reduce((acc, b) => acc * 2 + b, 0);
  L.signed = (u, n) => (u >= P2(n - 1) ? u - P2(n) : u);
  L.hex = (u, n) => { const d = Math.ceil(n / 4); let s = u.toString(16).toUpperCase(); while (s.length < d) s = '0' + s; return s; };
  L.bin = (u, n, group) => { const b = L.bitsOf(u, n).join(''); if (!group) return b; let out = ''; for (let i = 0; i < b.length; i++) { if (i && (b.length - i) % group === 0) out += ' '; out += b[i]; } return out; };
  L.rangeUnsigned = n => [0, P2(n) - 1];
  L.rangeSigned = n => [-P2(n - 1), P2(n - 1) - 1];

  // repeated division by 2
  L.decToBin = function (d) {
    const rows = []; let q = d;
    if (d === 0) return { rows: [{ n: 0, q: 0, r: 0 }], bits: '0' };
    while (q > 0) { const r = q % 2; const nq = Math.floor(q / 2); rows.push({ n: q, q: nq, r }); q = nq; }
    return { rows, bits: rows.map(x => x.r).reverse().join('') };
  };
  // two's complement encode of decimal d in n bits
  L.twosEncode = function (d, n) {
    const [lo, hi] = L.rangeSigned(n);
    if (d < lo || d > hi || !Number.isInteger(d)) return { error: `${d} does not fit in ${n}-bit two's complement (range ${lo} to ${hi}).` };
    const pos = Math.abs(d);
    const posBits = L.mask(pos, n);
    if (d >= 0) return { neg: false, posBits, result: posBits };
    const inv = L.mask(P2(n) - 1 - posBits, n);
    const result = L.mask(inv + 1, n);
    return { neg: true, posBits, inv, result };
  };
  // add or subtract two n-bit patterns (unsigned patterns in)
  L.addSub = function (a, b, n, op) {
    a = L.mask(a, n); b = L.mask(b, n);
    let bb = b, inverted = null;
    if (op === 'sub') { inverted = L.mask(P2(n) - 1 - b, n); bb = L.mask(inverted + 1, n); }
    const A = L.bitsOf(a, n).reverse(), B = L.bitsOf(bb, n).reverse();
    const carries = [0]; const sum = [];
    for (let i = 0; i < n; i++) { const t = A[i] + B[i] + carries[i]; sum.push(t % 2); carries.push(t >= 2 ? 1 : 0); }
    const result = L.fromBits(sum.slice().reverse());
    const carryOut = carries[n];
    const sa = A[n - 1], sb = B[n - 1], sr = sum[n - 1];
    const lo = -P2(n - 1), hi = P2(n - 1) - 1;
    // exact arithmetic for checking
    const sA = L.signed(a, n), sB = L.signed(b, n);
    const trueSigned = op === 'sub' ? sA - sB : sA + sB;
    const trueUnsigned = op === 'sub' ? a - b : a + b;
    const signedOverflow = trueSigned < lo || trueSigned > hi;
    return { a, b, bb, inverted, n, op, carries, result, carryOut, signedOverflow, sA, sB, trueSigned, trueUnsigned,
      unsignedOverflow: op === 'sub' ? (a < b) : (trueUnsigned >= P2(n)) };
  };
  L.signExtend = function (u, n, m, isSigned) {
    const msb = Math.floor(u / P2(n - 1)) % 2;
    const fill = isSigned ? msb : 0;
    let r = u; if (fill) r = u + (P2(m) - P2(n));
    return { result: r, fill, msb };
  };

  /* ---------- IEEE 754 single ---------- */
  const f32 = new DataView(new ArrayBuffer(4));
  L.bitsToFloat = u => { f32.setUint32(0, u >>> 0); return f32.getFloat32(0); };
  L.floatToBits = x => { f32.setFloat32(0, x); return f32.getUint32(0); };
  L.ieeeDecode = function (u) {
    u = u >>> 0;
    const s = u >>> 31, e = (u >>> 23) & 0xff, f = u & 0x7fffff;
    const frac = f / P2(23);
    let kind = 'normal', value;
    if (e === 255) { kind = f === 0 ? 'inf' : 'nan'; value = f === 0 ? (s ? -Infinity : Infinity) : NaN; }
    else if (e === 0) { kind = f === 0 ? 'zero' : 'denormal'; value = (s ? -1 : 1) * frac * P2(-126); }
    else value = (s ? -1 : 1) * (1 + frac) * P2(e - 127);
    return { s, e, f, frac, kind, value, check: L.bitsToFloat(u) };
  };

  /* ---------- MIPS registers & encoding ---------- */
  L.REGNAMES = ['$zero', '$at', '$v0', '$v1', '$a0', '$a1', '$a2', '$a3', '$t0', '$t1', '$t2', '$t3', '$t4', '$t5', '$t6', '$t7',
    '$s0', '$s1', '$s2', '$s3', '$s4', '$s5', '$s6', '$s7', '$t8', '$t9', '$k0', '$k1', '$gp', '$sp', '$fp', '$ra'];
  L.regNum = function (tok) {
    if (tok == null) return -1;
    let t = String(tok).trim().toLowerCase();
    if (t === '$zero' || t === 'zero') return 0;
    const i = L.REGNAMES.indexOf(t); if (i >= 0) return i;
    let m = t.match(/^\$(\d+)$/) || t.match(/^r(\d+)$/);
    if (m) { const n = +m[1]; return n >= 0 && n < 32 ? n : -1; }
    return -1;
  };
  /* Green-card opcodes and function codes (MIPS32). */
  L.R_FUNCT = { sll: 0x00, srl: 0x02, sra: 0x03, sllv: 0x04, srlv: 0x06, srav: 0x07, jr: 0x08, jalr: 0x09, syscall: 0x0c, break: 0x0d, mfhi: 0x10, mflo: 0x12,
    mult: 0x18, multu: 0x19, div: 0x1a, divu: 0x1b, add: 0x20, addu: 0x21, sub: 0x22, subu: 0x23, and: 0x24, or: 0x25, xor: 0x26, nor: 0x27, slt: 0x2a, sltu: 0x2b };
  L.I_OP = { beq: 0x04, bne: 0x05, blez: 0x06, bgtz: 0x07, addi: 0x08, addiu: 0x09, slti: 0x0a, sltiu: 0x0b, andi: 0x0c, ori: 0x0d, xori: 0x0e, lui: 0x0f,
    lb: 0x20, lh: 0x21, lw: 0x23, lbu: 0x24, lhu: 0x25, sb: 0x28, sh: 0x29, sw: 0x2b, ll: 0x30, sc: 0x38 };
  L.J_OP = { j: 0x02, jal: 0x03 };
  const ZEXT = { andi: 1, ori: 1, xori: 1 };
  const MEM = { lb: 1, lh: 1, lw: 1, lbu: 1, lhu: 1, sb: 1, sh: 1, sw: 1, ll: 1, sc: 1 };
  const BR2 = { beq: 1, bne: 1 }, BR1 = { blez: 1, bgtz: 1 };
  /* which register fields each R-format instruction actually uses (the rest are 0) */
  const R_USES = { sll: 'rd rt shamt', srl: 'rd rt shamt', sra: 'rd rt shamt', sllv: 'rd rt rs', srlv: 'rd rt rs', srav: 'rd rt rs', jr: 'rs', jalr: 'rd rs', syscall: '', break: '',
    mfhi: 'rd', mflo: 'rd', mult: 'rs rt', multu: 'rs rt', div: 'rs rt', divu: 'rs rt' };
  L.R_USES = op => (R_USES[op] != null ? R_USES[op] : 'rd rs rt').split(' ').filter(Boolean);
  /* pseudo-instructions the assembler turns into one real instruction (L07 s4) */
  const PSEUDO = {
    move: a => (a.length === 2 ? `add ${a[0]}, $zero, ${a[1]}` : null),
    clear: a => (a.length === 1 ? `add ${a[0]}, $zero, $zero` : null),
    li: a => { if (a.length !== 2) return null; const v = parseImm(a[1]); if (isNaN(v)) return null; if (v >= -32768 && v <= 32767) return `addi ${a[0]}, $zero, ${v}`; if (v >= 0 && v <= 65535) return `ori ${a[0]}, $zero, ${v}`; return { error: `li ${a[1]} needs two instructions (lui for the top 16 bits, then ori for the bottom 16) — this tool encodes one word at a time.` }; },
    nop: a => (a.length === 0 ? 'sll $zero, $zero, 0' : null),
    not: a => (a.length === 2 ? `nor ${a[0]}, ${a[1]}, $zero` : null),
  };
  const PSEUDO2 = { blt: 'slt $at, rs, rt ; bne $at, $zero, L', bgt: 'slt $at, rt, rs ; bne $at, $zero, L', ble: 'slt $at, rt, rs ; beq $at, $zero, L', bge: 'slt $at, rs, rt ; beq $at, $zero, L', la: 'lui $at, upper ; ori rd, $at, lower' };
  L.ALL_OPS = () => Object.keys(L.R_FUNCT).concat(Object.keys(L.I_OP), Object.keys(L.J_OP));
  L.PSEUDO_OPS = () => Object.keys(PSEUDO);

  function splitArgs(s) { return s.split(',').map(x => x.trim()).filter(x => x.length); }
  function parseImm(t) {
    t = String(t).trim().replace(/^#/, '').replace(/^−/, '-');
    if (/^-?0x[0-9a-f]+$/i.test(t)) { const neg = t[0] === '-'; const v = parseInt(t.replace('-', ''), 16); return neg ? -v : v; }
    if (/^-?\d+$/.test(t)) return parseInt(t, 10);
    return NaN;
  }
  L.parseImm = parseImm;
  const hex8 = v => '0x' + (v >>> 0).toString(16).toUpperCase().padStart(8, '0');
  L.hex8 = hex8;
  /* "Loop = 0x00400000, Exit = 0x0040000C" → { Loop: 4194304, Exit: 4194316 } */
  L.parseLabels = function (txt) {
    const out = {}, bad = [];
    String(txt || '').split(/[,;\n]+/).map(x => x.trim()).filter(Boolean).forEach(x => {
      const m = x.match(/^([A-Za-z_]\w*)\s*[:=]?\s*(\S+)$/); const v = m ? parseImm(m[2]) : NaN;
      if (!m || isNaN(v) || v < 0 || v % 4) bad.push(x); else out[m[1]] = v >>> 0; });
    return { labels: out, bad };
  };
  const labelAt = (labels, a) => Object.keys(labels || {}).find(k => labels[k] === (a >>> 0));

  // Assemble one instruction. ctx = { pc, labels } (both optional; pc defaults to 0x00400000).
  // Returns {error} or {format, op, fields:[{name,width,value}], word, ref?, pseudo?}
  L.assemble = function (line, ctx) {
    ctx = ctx || {}; const pc = ctx.pc != null ? ctx.pc >>> 0 : 0x00400000, labels = ctx.labels || {};
    let src = String(line).replace(/#.*$/, '').trim();
    if (!src) return { error: 'Type an instruction, e.g. add $t0, $s1, $s2' };
    src = src.replace(/^[A-Za-z_]\w*\s*:\s*/, ''); /* allow "Loop: add …" */
    let m = src.match(/^([a-zA-Z]+)\s*(.*)$/);
    if (!m) return { error: 'Could not read the opcode.' };
    let op = m[1].toLowerCase(), args = splitArgs(m[2]), pseudo = null;
    if (PSEUDO2[op]) return { error: `${op} is a pseudo-instruction that the assembler expands into two real instructions (${PSEUDO2[op]}). Encode those one at a time.` };
    if (PSEUDO[op]) { const r = PSEUDO[op](args); if (!r) return { error: `${op}: wrong number of operands.` }; if (r.error) return r; pseudo = { from: src, to: r }; m = r.match(/^([a-z]+)\s*(.*)$/); op = m[1]; args = splitArgs(m[2]); }
    const reg = (t, what) => { const r = L.regNum(t); if (r < 0) throw new Error(`"${t}" is not a register (${what}).`); return r; };
    const need = (n, form) => { if (args.length !== n) throw new Error(`${op} needs ${n === 0 ? 'no operands' : n + ' operand' + (n > 1 ? 's' : '')}: ${form}`); };
    try {
      if (op in L.R_FUNCT) {
        let rs = 0, rt = 0, rd = 0, sh = 0;
        if (op === 'sll' || op === 'srl' || op === 'sra') {
          need(3, `${op} rd, rt, shamt`); rd = reg(args[0], 'rd'); rt = reg(args[1], 'rt'); sh = parseImm(args[2]);
          if (!(sh >= 0 && sh <= 31)) throw new Error('shamt must be 0–31 (it has only 5 bits).');
        } else if (op === 'sllv' || op === 'srlv' || op === 'srav') { need(3, `${op} rd, rt, rs`); rd = reg(args[0], 'rd'); rt = reg(args[1], 'rt'); rs = reg(args[2], 'rs'); }
        else if (op === 'jr') { need(1, 'jr rs'); rs = reg(args[0], 'rs'); }
        else if (op === 'jalr') { if (args.length === 1) { rd = 31; rs = reg(args[0], 'rs'); } else { need(2, 'jalr rd, rs'); rd = reg(args[0], 'rd'); rs = reg(args[1], 'rs'); } }
        else if (op === 'syscall' || op === 'break') need(0, op);
        else if (op === 'mfhi' || op === 'mflo') { need(1, `${op} rd`); rd = reg(args[0], 'rd'); }
        else if (/^(mult|multu|div|divu)$/.test(op)) { need(2, `${op} rs, rt`); rs = reg(args[0], 'rs'); rt = reg(args[1], 'rt'); }
        else { need(3, `${op} rd, rs, rt`); rd = reg(args[0], 'rd'); rs = reg(args[1], 'rs'); rt = reg(args[2], 'rt'); }
        const fields = [{ name: 'op', width: 6, value: 0 }, { name: 'rs', width: 5, value: rs }, { name: 'rt', width: 5, value: rt },
          { name: 'rd', width: 5, value: rd }, { name: 'shamt', width: 5, value: sh }, { name: 'funct', width: 6, value: L.R_FUNCT[op] }];
        return finish('R', op, fields);
      }
      if (op in L.I_OP) {
        let rs = 0, rt = 0, imm = 0, ref = null;
        const branchOff = t => { /* a number = offset in instructions (course convention); a label = resolved from PC + 4 */
          const v = parseImm(t); if (!isNaN(v)) return v;
          if (!/^[A-Za-z_]\w*$/.test(t)) throw new Error('Give the branch target as a label (e.g. Exit) or an offset in instructions (e.g. 2 or -3).');
          if (!(t in labels)) throw new Error(`Label "${t}" isn't defined — add it in the Labels box, e.g. ${t} = 0x0040000C.`);
          const tg = labels[t], d = tg - (pc + 4);
          ref = { kind: 'branch', label: t, target: tg, pc, off: d / 4 };
          if (d % 4) throw new Error('Branch targets must be word-aligned.');
          return d / 4; };
        if (op in MEM) {
          need(2, `${op} rt, offset(rs)`); rt = reg(args[0], 'rt');
          const mm = args[1].match(/^(-?(?:0x)?[0-9a-fA-F]*)\s*\(\s*([^)]+)\)$/);
          if (!mm) throw new Error('Memory operand must look like 32($s3).');
          imm = mm[1] === '' || mm[1] === '-' ? 0 : parseImm(mm[1]); rs = reg(mm[2], 'base rs');
        } else if (op === 'lui') { need(2, 'lui rt, imm'); rt = reg(args[0], 'rt'); imm = parseImm(args[1]); }
        else if (op in BR2) { need(3, `${op} rs, rt, label`); rs = reg(args[0], 'rs'); rt = reg(args[1], 'rt'); imm = branchOff(args[2]); }
        else if (op in BR1) { need(2, `${op} rs, label`); rs = reg(args[0], 'rs'); imm = branchOff(args[1]); }
        else { need(3, `${op} rt, rs, imm`); rt = reg(args[0], 'rt'); rs = reg(args[1], 'rs'); imm = parseImm(args[2]); }
        if (isNaN(imm)) throw new Error('The immediate/offset must be a whole number.');
        const zext = ZEXT[op] || op === 'lui';
        if (zext) { if (imm < 0 || imm > 65535) throw new Error(`${op} takes an unsigned 16-bit immediate: 0 to 65535.`); }
        else if (imm < -32768 || imm > 32767) throw new Error(ref ? `${ref.label} is ${imm} instructions away — a 16-bit offset reaches only −32768…32767. The assembler would branch the other way over a j instead.` : '16-bit signed immediate must be between -32768 and 32767 (−2^15 to 2^15−1).');
        const fields = [{ name: 'op', width: 6, value: L.I_OP[op] }, { name: 'rs', width: 5, value: rs }, { name: 'rt', width: 5, value: rt },
          { name: 'immediate', width: 16, value: L.mask(imm, 16), signedValue: imm }];
        return finish('I', op, fields, ref);
      }
      if (op in L.J_OP) {
        need(1, `${op} label  (or a byte address such as 0x00400020)`);
        let addr = parseImm(args[0]), ref = null;
        if (isNaN(addr)) {
          if (!/^[A-Za-z_]\w*$/.test(args[0])) throw new Error('Give the jump target as a label (e.g. Loop) or a byte address (e.g. 0x00400020).');
          if (!(args[0] in labels)) throw new Error(`Label "${args[0]}" isn't defined — add it in the Labels box, e.g. ${args[0]} = 0x00400000.`);
          addr = labels[args[0]]; ref = { kind: 'jump', label: args[0], target: addr, pc };
        } else ref = { kind: 'jump', label: null, target: addr >>> 0, pc };
        if (addr < 0 || addr > 0xFFFFFFFF) throw new Error('A jump target is a 32-bit byte address.');
        if (addr % 4) throw new Error('Jump targets must be word-aligned (a multiple of 4).');
        const top = ((pc + 4) >>> 28) & 15;
        if ((addr >>> 28) !== top) throw new Error(`Out of reach: a J-format jump keeps the top 4 bits of PC + 4 (here ${top.toString(16).toUpperCase()}), so it can only reach ${hex8(top * 0x10000000)}–${hex8(top * 0x10000000 + 0x0FFFFFFC)}. Use jr with the full address in a register.`);
        const fields = [{ name: 'op', width: 6, value: L.J_OP[op] }, { name: 'address', width: 26, value: L.mask(Math.floor(addr / 4), 26), byteAddr: addr }];
        return finish('J', op, fields, ref);
      }
      return { error: `"${op}" isn't in this encoder. It knows: ${L.ALL_OPS().join(', ')}; pseudo-instructions ${L.PSEUDO_OPS().join(', ')}.` };
    } catch (e) { return { error: e.message }; }
    function finish(format, op, fields, ref) {
      let word = 0; for (const f of fields) word = word * P2(f.width) + f.value;
      return { format, op, fields, word, text: src, ref: ref || null, pseudo };
    }
  };
  // ctx = { pc, labels } lets jumps and branches show their full target (and its label).
  L.disassemble = function (word, ctx) {
    word = word >>> 0; ctx = ctx || {}; const pc = ctx.pc != null ? ctx.pc >>> 0 : 0x00400000, labels = ctx.labels || {};
    const op = word >>> 26, rs = (word >>> 21) & 31, rt = (word >>> 16) & 31, rd = (word >>> 11) & 31, sh = (word >>> 6) & 31, fn = word & 63, imm = word & 0xffff, addr = word & 0x3ffffff;
    const N = L.REGNAMES;
    if (op === 0) {
      const name = Object.keys(L.R_FUNCT).find(k => L.R_FUNCT[k] === fn);
      if (!name) return { error: `opcode 0 (R-format) but funct ${fn} (0x${fn.toString(16)}) isn't one this tool knows.` };
      let asm;
      if (name === 'sll' || name === 'srl' || name === 'sra') asm = `${name} ${N[rd]}, ${N[rt]}, ${sh}`;
      else if (name === 'sllv' || name === 'srlv' || name === 'srav') asm = `${name} ${N[rd]}, ${N[rt]}, ${N[rs]}`;
      else if (name === 'jr') asm = `jr ${N[rs]}`;
      else if (name === 'jalr') asm = rd === 31 ? `jalr ${N[rs]}` : `jalr ${N[rd]}, ${N[rs]}`;
      else if (name === 'syscall' || name === 'break') asm = name;
      else if (name === 'mfhi' || name === 'mflo') asm = `${name} ${N[rd]}`;
      else if (/^(mult|multu|div|divu)$/.test(name)) asm = `${name} ${N[rs]}, ${N[rt]}`;
      else asm = `${name} ${N[rd]}, ${N[rs]}, ${N[rt]}`;
      const uses = L.R_USES(name), unused = ['rs', 'rt', 'rd', 'shamt'].filter(f => uses.indexOf(f) < 0);
      const odd = unused.filter(f => ({ rs, rt, rd, shamt: sh })[f] !== 0);
      return { format: 'R', op: name, asm: word === 0 ? 'nop' : asm, nop: word === 0, unused, odd, fields: [{ name: 'op', width: 6, value: 0 }, { name: 'rs', width: 5, value: rs }, { name: 'rt', width: 5, value: rt }, { name: 'rd', width: 5, value: rd }, { name: 'shamt', width: 5, value: sh }, { name: 'funct', width: 6, value: fn }] };
    }
    const jn = Object.keys(L.J_OP).find(k => L.J_OP[k] === op);
    if (jn) { const target = ((((pc + 4) >>> 28) & 15) * 0x10000000 + addr * 4) >>> 0, lab = labelAt(labels, target);
      return { format: 'J', op: jn, asm: `${jn} ${lab || hex8(target)}`, target, label: lab || null, fields: [{ name: 'op', width: 6, value: op }, { name: 'address', width: 26, value: addr, byteAddr: addr * 4 }] }; }
    const iname = Object.keys(L.I_OP).find(k => L.I_OP[k] === op);
    if (!iname) return { error: `opcode ${op} (0x${op.toString(16)}) isn't one this tool knows.` };
    const simm = ZEXT[iname] || iname === 'lui' ? imm : L.signed(imm, 16);
    let asm, target = null, lab = null, unused = [], odd = [];
    if (iname in MEM) asm = `${iname} ${N[rt]}, ${simm}(${N[rs]})`;
    else if (iname === 'lui') { asm = `lui ${N[rt]}, ${simm}`; unused = ['rs']; }
    else if (iname in BR2 || iname in BR1) {
      target = (pc + 4 + simm * 4) >>> 0; lab = labelAt(labels, target);
      asm = iname in BR2 ? `${iname} ${N[rs]}, ${N[rt]}, ${simm}` : `${iname} ${N[rs]}, ${simm}`; if (iname in BR1) unused = ['rt']; }
    else asm = `${iname} ${N[rt]}, ${N[rs]}, ${simm}`;
    odd = unused.filter(f => ({ rs, rt })[f] !== 0);
    return { format: 'I', op: iname, asm, target, label: lab, unused, odd, fields: [{ name: 'op', width: 6, value: op }, { name: 'rs', width: 5, value: rs }, { name: 'rt', width: 5, value: rt }, { name: 'immediate', width: 16, value: imm, signedValue: simm }] };
  };

  /* ---------- MIPS executor (registers + memory) ---------- */
  L.TEXT_BASE = 0x00400000;
  L.parseProgram = function (text) {
    const instrs = [], labels = {}, errors = [];
    String(text).split('\n').forEach((raw, ln) => {
      let s = raw.replace(/#.*$/, '').trim();
      if (!s) return;
      let lm;
      while ((lm = s.match(/^([A-Za-z_][\w]*)\s*:\s*(.*)$/))) { labels[lm[1]] = instrs.length; s = lm[2].trim(); }
      if (!s) return;
      const m = s.match(/^([a-zA-Z]+)\s*(.*)$/);
      if (!m) { errors.push(`Line ${ln + 1}: can't read "${raw.trim()}"`); return; }
      instrs.push({ op: m[1].toLowerCase(), args: splitArgs(m[2]), text: s, line: ln + 1 });
    });
    return { instrs, labels, errors };
  };
  L.newMachine = function (prog, init) {
    const M = { prog, regs: new Int32Array(32), mem: new Map(), pc: 0, steps: 0, halted: false, log: [], changed: { regs: [], mem: [] } };
    M.regs[29] = 0x7fffeffc; M.regs[28] = 0x10008000; M.regs[31] = -4; // $sp, $gp (P&H defaults), $ra sentinel
    if (init && init.regs) for (const k in init.regs) { const r = L.regNum(k); if (r > 0) M.regs[r] = init.regs[k] | 0; }
    if (init && init.mem) for (const a in init.mem) M.mem.set(+a, init.mem[a] | 0);
    return M;
  };
  L.step = function (M) {
    if (M.halted) return { done: true, msg: 'Program finished.' };
    const ins = M.prog.instrs[M.pc];
    M.changed = { regs: [], mem: [] };
    if (!ins) { M.halted = true; return { done: true, msg: 'Reached the end of the program.' }; }
    const R = M.regs, a = ins.args, N = L.REGNAMES;
    const rg = t => { const r = L.regNum(t); if (r < 0) throw new Error(`Line ${ins.line}: "${t}" is not a register.`); return r; };
    const set = (r, v) => { if (r === 0) return; R[r] = v | 0; M.changed.regs.push(r); };
    const imm = t => { const v = parseImm(t); if (isNaN(v)) throw new Error(`Line ${ins.line}: "${t}" is not a number.`); return v; };
    const label = t => { if (t in M.prog.labels) return M.prog.labels[t]; const v = parseImm(t); if (!isNaN(v)) return M.pc + 1 + v; throw new Error(`Line ${ins.line}: unknown label "${t}".`); };
    const memop = t => { const mm = t.match(/^(-?\d*)\s*\(\s*([^)]+)\)$/); if (!mm) throw new Error(`Line ${ins.line}: memory operand must look like 8($s2).`); return { off: mm[1] === '' ? 0 : +mm[1], base: rg(mm[2]) }; };
    let next = M.pc + 1, msg = '';
    const v = r => R[r];
    try {
      switch (ins.op) {
        case 'add': case 'addu': case 'sub': case 'subu': case 'and': case 'or': case 'xor': case 'nor': case 'slt': case 'mul': {
          const d = rg(a[0]), s = rg(a[1]), t = rg(a[2]); const x = v(s), y = v(t); let r;
          const sym = { add: '+', addu: '+', sub: '-', subu: '-', and: 'AND', or: 'OR', xor: 'XOR', nor: 'NOR', slt: '<', mul: '×' }[ins.op];
          if (ins.op === 'add' || ins.op === 'addu') r = x + y; else if (ins.op === 'sub' || ins.op === 'subu') r = x - y;
          else if (ins.op === 'and') r = x & y; else if (ins.op === 'or') r = x | y; else if (ins.op === 'xor') r = x ^ y; else if (ins.op === 'nor') r = ~(x | y);
          else if (ins.op === 'mul') r = Math.imul(x, y); else r = x < y ? 1 : 0;
          set(d, r);
          msg = ins.op === 'slt' ? `${N[d]} = (${N[s]} < ${N[t]}) ? 1 : 0 = (${x} < ${y}) ? 1 : 0 = ${R[d]}` : `${N[d]} = ${N[s]} ${sym} ${N[t]} = ${x} ${sym} ${y} = ${R[d]}`;
          if ((ins.op === 'add' || ins.op === 'sub') && r !== (r | 0)) msg += ' — signed overflow! Real MIPS add/sub would raise an exception here (L08 s12); this simulator just wraps.';
          break; }
        case 'addi': case 'addiu': case 'andi': case 'ori': case 'slti': {
          const d = rg(a[0]), s = rg(a[1]); let k = imm(a[2]); const x = v(s); let r;
          if (ins.op === 'andi' || ins.op === 'ori') k = L.mask(k, 16);
          if (ins.op === 'andi') r = x & k; else if (ins.op === 'ori') r = x | k; else if (ins.op === 'slti') r = x < k ? 1 : 0; else r = x + k;
          set(d, r);
          const sym = { addi: '+', addiu: '+', andi: 'AND', ori: 'OR', slti: '<' }[ins.op];
          msg = `${N[d]} = ${N[s]} ${sym} ${k} = ${x} ${sym} ${k} = ${R[d]}`; break; }
        case 'sll': case 'srl': {
          const d = rg(a[0]), s = rg(a[1]), k = imm(a[2]); const x = v(s);
          const r = ins.op === 'sll' ? (x << k) : (x >>> k); set(d, r);
          msg = `${N[d]} = ${N[s]} ${ins.op === 'sll' ? '<<' : '>>>'} ${k} = ${x} ${ins.op === 'sll' ? '×' : '÷'} 2^${k} = ${R[d]}`; break; }
        case 'lui': { const d = rg(a[0]), k = L.mask(imm(a[1]), 16); set(d, k << 16); msg = `${N[d]} = ${k} << 16 = ${R[d]}`; break; }
        case 'move': { const d = rg(a[0]), s = rg(a[1]); set(d, v(s)); msg = `move is a pseudo-instruction for add ${N[d]}, $zero, ${N[s]} → ${N[d]} = ${v(s)}`; break; }
        case 'li': { const d = rg(a[0]); const k = imm(a[1]); set(d, k); msg = `li (pseudo-instruction) → ${N[d]} = ${k}`; break; }
        case 'lw': case 'sw': {
          const t = rg(a[0]); const { off, base } = memop(a[1]); const addr = (v(base) + off) | 0;
          if (addr % 4 !== 0) throw new Error(`Line ${ins.line}: address ${addr} is not a multiple of 4 — words must be aligned (L05 s17).`);
          if (ins.op === 'lw') { const val = M.mem.has(addr) ? M.mem.get(addr) : 0; set(t, val); msg = `address = ${N[base]} + ${off} = ${v(base)} + ${off} = ${addr}; ${N[t]} = Memory[${addr}] = ${val}`; }
          else { M.mem.set(addr, v(t)); M.changed.mem.push(addr); msg = `address = ${N[base]} + ${off} = ${v(base)} + ${off} = ${addr}; Memory[${addr}] = ${N[t]} = ${v(t)}`; }
          break; }
        case 'beq': case 'bne': {
          const s = rg(a[0]), t = rg(a[1]); const eq = v(s) === v(t); const take = ins.op === 'beq' ? eq : !eq;
          msg = `${N[s]} (${v(s)}) ${eq ? '==' : '!='} ${N[t]} (${v(t)}) → branch ${take ? 'TAKEN to ' + a[2] : 'not taken (fall through)'}`;
          if (take) next = label(a[2]); break; }
        case 'j': next = label(a[0]); msg = `jump to ${a[0]}`; break;
        case 'jal': set(31, L.TEXT_BASE + 4 * (M.pc + 1)); next = label(a[0]); msg = `$ra = return address ${'0x' + (L.TEXT_BASE + 4 * (M.pc + 1)).toString(16)}; jump to ${a[0]}`; break;
        case 'jr': { const s = rg(a[0]); const addr = v(s); const idx = (addr - L.TEXT_BASE) / 4;
          if (!Number.isInteger(idx) || idx < 0 || idx > M.prog.instrs.length) { M.halted = true; msg = `jr ${N[s]}: return to the caller — the procedure has finished.`; next = M.pc; }
          else { next = idx; msg = `jump to address in ${N[s]}`; } break; }
        case 'nop': msg = 'no operation'; break;
        default: throw new Error(`Line ${ins.line}: "${ins.op}" isn't supported by this simulator.`);
      }
    } catch (e) { M.halted = true; return { error: e.message }; }
    M.log.push(ins.text + '  →  ' + msg);
    M.pc = next; M.steps++;
    if (M.pc >= M.prog.instrs.length) M.halted = true;
    return { msg, ins };
  };

  /* ---------- pipeline: parse, dependencies, simulation ---------- */
  const LOADS = { lw: 1, lb: 1, lh: 1, ld: 1, lbu: 1, lhu: 1 };
  const STORES = { sw: 1, sb: 1, sh: 1, sd: 1 };
  function canonReg(t) {
    t = String(t).trim();
    const tl = t.toLowerCase();
    const n = L.regNum(tl);
    if (/^r\d+$/i.test(t)) return n === 0 ? null : 'R' + (+t.slice(1));
    if (n === 0) return null;
    if (n > 0) return /^\$\d+$/.test(tl) ? '$' + n : L.REGNAMES[n];
    return undefined; // not a register
  }
  L.canonReg = canonReg;
  L.parsePipe = function (line) {
    const s = String(line).replace(/#(?!\s*-?\d).*$/, '').replace(/\/\/.*$/, '').trim();
    if (!s) return null;
    const m = s.match(/^(?:(I\d+)\s*[:.]?\s*)?([a-zA-Z]+)\s*(.*)$/);
    if (!m) return { error: `can't read "${s}"` };
    const op = m[2].toLowerCase(); const args = splitArgs(m[3]);
    const out = { text: s.replace(/^I\d+\s*[:.]?\s*/, ''), op, dst: null, srcs: [], isLoad: !!LOADS[op], isStore: !!STORES[op] };
    const regOrImm = t => { const c = canonReg(t); return c === undefined ? 'imm' : c; };
    const memBase = t => { const mm = t.match(/\(\s*([^)]+)\)/); return mm ? canonReg(mm[1]) : undefined; };
    if (op === 'nop') return out;
    if (out.isLoad) { out.dst = canonReg(args[0]); const b = memBase(args[1] || ''); if (b) out.srcs.push(b); }
    else if (out.isStore) { const d = canonReg(args[0]); if (d) out.srcs.push(d); const b = memBase(args[1] || ''); if (b && out.srcs.indexOf(b) < 0) out.srcs.push(b); }
    else if (op === 'beq' || op === 'bne') { [args[0], args[1]].forEach(t => { const c = t && canonReg(t); if (c && out.srcs.indexOf(c) < 0) out.srcs.push(c); }); out.isBranch = true; }
    else if (op === 'j' || op === 'jal') { if (op === 'jal') out.dst = '$ra'; }
    else if (op === 'jr') { const c = canonReg(args[0]); if (c) out.srcs.push(c); }
    else if (op === 'li' || op === 'lui') { out.dst = canonReg(args[0]); }
    else {
      out.dst = args.length ? canonReg(args[0]) : null;
      if (out.dst === undefined) return { error: `"${args[0]}" in "${s}" is not a register` };
      args.slice(1).forEach(t => { const c = regOrImm(t); if (c && c !== 'imm' && out.srcs.indexOf(c) < 0) out.srcs.push(c); });
    }
    if (out.dst === undefined) out.dst = null;
    return out;
  };
  L.parsePipeProgram = function (text) {
    const instrs = [], errors = [];
    String(text).split('\n').forEach((ln, i) => { const p = L.parsePipe(ln); if (!p) return; if (p.error) errors.push(`Line ${i + 1}: ${p.error}`); else instrs.push(p); });
    return { instrs, errors };
  };
  // registers typed as $8 and $t0 are the same register
  const K = r => (r && r[0] === '$') ? '$' + L.regNum(r) : r;
  L.sameReg = (a, b) => a != null && b != null && K(a) === K(b);
  const hasReg = (list, r) => list.some(x => L.sameReg(x, r));
  // Dependencies. RAW uses the most recent earlier writer; WAR and WAW list every earlier/later pair (as the official solutions do).
  L.deps = function (ins) {
    const raw = [], war = [], waw = [];
    for (let j = 0; j < ins.length; j++) {
      for (const r of ins[j].srcs) {
        for (let i = j - 1; i >= 0; i--) if (L.sameReg(ins[i].dst, r)) { raw.push({ i, j, reg: r, dist: j - i, load: ins[i].isLoad }); break; }
      }
      if (ins[j].dst) for (let i = 0; i < j; i++) {
        if (hasReg(ins[i].srcs, ins[j].dst)) war.push({ i, j, reg: ins[j].dst, dist: j - i });
        if (L.sameReg(ins[i].dst, ins[j].dst)) waw.push({ i, j, reg: ins[j].dst, dist: j - i });
      }
    }
    return { raw, war, waw };
  };
  // Course convention stall penalty for one RAW pair considered on its own (L16 s6, s13)
  L.rawPenalty = (dist, load, fwd) => fwd ? (load ? Math.max(0, 2 - dist) : 0) : Math.max(0, 3 - dist);

  // Cycle-accurate 5-stage in-order pipeline (IF ID EX MEM WB). Options: fwd (EX/MEM & MEM/WB → EX), singleMem (one memory for IF and MEM).
  L.simulate = function (ins, opt) {
    opt = opt || {};
    const R = [], events = [];
    const memBusy = new Set();
    for (let i = 0; i < ins.length; i++) {
      const I = ins[i];
      const prev = R[i - 1];
      const plannedIF = i === 0 ? 1 : Math.max(prev.IF + 1, prev.IDs);
      let IF = plannedIF;
      if (opt.singleMem) while (memBusy.has(IF)) IF++;
      if (IF > plannedIF) events.push({ kind: 'struct', i, cycles: IF - plannedIF, text: `Structural hazard: memory is busy with an earlier load/store's MEM in cycle${IF - plannedIF > 1 ? 's' : ''} ${range(plannedIF, IF - 1)}, so I${i + 1}'s fetch waits ${IF - plannedIF} cycle${IF - plannedIF > 1 ? 's' : ''}.` });
      const IDs = i === 0 ? IF + 1 : Math.max(IF + 1, prev.EX);
      let EX = IDs + 1; const why = [];
      for (const r of I.srcs) {
        let p = -1; for (let k = i - 1; k >= 0; k--) if (L.sameReg(ins[k].dst, r)) { p = k; break; }
        if (p < 0) continue;
        const P = R[p];
        let need;
        if (!opt.fwd) need = P.WB + 1; else need = ins[p].isLoad ? P.MEM + 1 : P.EX + 1;
        if (need > EX) { why.push({ p, r, need }); EX = need; }
      }
      const rec = { i, plannedIF, IF, IDs, EX, MEM: EX + 1, WB: EX + 2, idStall: EX - (IDs + 1), ifHold: IDs - (IF + 1) };
      R.push(rec);
      if (I.isLoad || I.isStore) memBusy.add(rec.MEM);
      if (rec.idStall > 0) {
        const w = why[why.length - 1];
        events.push({ kind: 'data', i, p: w.p, reg: w.r, cycles: rec.idStall,
          text: `I${i + 1} needs ${w.r} from I${w.p + 1}${ins[w.p].isLoad ? ' (a load)' : ''}: held in ID for ${rec.idStall} cycle${rec.idStall > 1 ? 's' : ''} (cycle${rec.idStall > 1 ? 's' : ''} ${range(IDs + 1, EX - 1)}).` });
      }
      // how each source value arrives
      for (const r of I.srcs) {
        let p = -1; for (let k = i - 1; k >= 0; k--) if (L.sameReg(ins[k].dst, r)) { p = k; break; }
        if (p < 0) continue;
        const P = R[p];
        if (EX - 1 >= P.WB) { if (EX - 1 === P.WB) events.push({ kind: 'rf', i, p, reg: r, cycle: P.WB, text: `Cycle ${P.WB}: I${p + 1} writes ${r} in the first half, I${i + 1} reads it in the second half (register file).` }); }
        else if (opt.fwd) {
          const from = EX - P.EX === 1 ? 'EX/MEM' : 'MEM/WB';
          events.push({ kind: 'fwd', i, p, reg: r, cycle: EX, from, text: `Cycle ${EX}: forward ${r} from the ${from} pipeline register (I${p + 1}) to the ALU input of I${i + 1}.` });
        }
      }
    }
    const N = ins.length;
    const total = N ? R[N - 1].WB : 0;
    const stalls = N ? total - (N + 4) : 0;
    return { rows: R, events, total, stalls, ideal: N ? N + 4 : 0, cpi: N ? (N + stalls) / N : 0 };
    function range(a, b) { return a === b ? '' + a : a + '–' + b; }
  };
  // label for instruction i in cycle c
  L.cell = function (r, c) {
    if (c < r.plannedIF || c > r.WB) return '';
    if (c < r.IF) return 'stall';
    if (c === r.IF) return 'IF';
    if (c < r.IDs) return 'IF*';
    if (c === r.IDs) return 'ID';
    if (c < r.EX) return 'stall';
    if (c === r.EX) return 'EX';
    if (c === r.MEM) return 'MEM';
    return 'WB';
  };
  // which instruction is in each stage each cycle (resource view)
  L.resourceView = function (sim) {
    const out = { IF: {}, ID: {}, EX: {}, MEM: {}, WB: {} };
    sim.rows.forEach(r => {
      for (let c = r.IF; c < r.IDs; c++) out.IF[c] = r.i;
      for (let c = r.IDs; c < r.EX; c++) out.ID[c] = r.i;
      out.EX[r.EX] = r.i; out.MEM[r.MEM] = r.i; out.WB[r.WB] = r.i;
    });
    return out;
  };
  // A reordering is safe (register-wise) if every dependent pair keeps its order.
  L.checkOrder = function (orig, perm) {
    const pos = {}; perm.forEach((o, k) => pos[o] = k);
    const d = L.deps(orig); const bad = [];
    [['RAW', d.raw], ['WAR', d.war], ['WAW', d.waw]].forEach(([t, list]) => list.forEach(x => { if (pos[x.i] > pos[x.j]) bad.push(`${t} I${x.i + 1}→I${x.j + 1} on ${x.reg}`); }));
    const memWarn = [];
    for (let a = 0; a < orig.length; a++) for (let b = a + 1; b < orig.length; b++) {
      const A = orig[a], B = orig[b];
      if ((A.isStore || B.isStore) && (A.isLoad || A.isStore) && (B.isLoad || B.isStore) && pos[a] > pos[b]) memWarn.push(`I${a + 1} and I${b + 1} both use memory and one is a store — only safe if they never touch the same address`);
    }
    return { ok: bad.length === 0, bad, memWarn };
  };

  /* ---------- small formula helpers ---------- */
  L.amdahl = (f, s) => 1 / ((1 - f) + f / s);
  L.amdahlLimit = f => (f >= 1 ? Infinity : 1 / (1 - f));
  L.powerRatio = (c, v, fq) => c * v * v * fq;


export const Logic = L;
export default L;
