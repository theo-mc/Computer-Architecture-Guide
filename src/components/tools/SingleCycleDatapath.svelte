<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import { Logic } from '@/utils/logic.js';
  import { esc } from '@/utils/html.js';
  import { asm as asmHL, decorate as decorateHL } from '@/utils/hl.js';

  let { opts = {}, embedded = false } = $props();

  const INS = [
    ['add', 'add $t0, $s1, $s2', 'R'],
    ['sub', 'sub $t0, $s1, $s2', 'R'],
    ['and', 'and $t0, $s1, $s2', 'R'],
    ['or', 'or $t0, $s1, $s2', 'R'],
    ['slt', 'slt $t0, $s1, $s2', 'R'],
    ['addi', 'addi $t0, $s1, 8', 'addi'],
    ['lw', 'lw $t0, 8($s1)', 'lw'],
    ['sw', 'sw $s2, 8($s1)', 'sw'],
    ['beq', 'beq $s1, $s2, 3', 'beq'],
    ['j', 'j 0x00400040', 'j']
  ];
  const FMT = { R: 'R-format', addi: 'I-format', lw: 'I-format', sw: 'I-format', beq: 'I-format', j: 'J-format' };
  const OPC = { R: '000000', addi: '001000', lw: '100011', sw: '101011', beq: '000100', j: '000010' };
  const STG = ['IF', 'ID', 'EX', 'MEM', 'WB'];
  const STG_SUB = ['fetch', 'decode', 'execute', 'memory', 'write back'];
  const SDESC = {
    IF: 'Fetch: the PC addresses instruction memory and the 32-bit instruction comes out. At the same time a dedicated adder computes PC + 4.',
    ID: 'Decode: the opcode (bits 31–26) goes to the control unit, which sets every control signal for the rest of the cycle. rs and rt are read from the register file and the 16-bit immediate is sign-extended — all in parallel, whether or not the instruction needs them.',
    EX: 'Execute: the ALU does the work — an operation (R-type), an address (lw/sw), a sum with a constant (addi) or a comparison (beq). The branch target is computed in parallel by its own adder.',
    MEM: 'Memory: only lw reads and only sw writes data memory (MemRead / MemWrite). Every other instruction passes straight by.',
    WB: 'Write back + next PC: the register file writes (if RegWrite = 1) at the clock edge that ends the cycle, and the PC is loaded with PC + 4, the branch target or the jump address.'
  };
  const SIG = ['RegDst', 'ALUSrc', 'MemtoReg', 'RegWrite', 'MemRead', 'MemWrite', 'Branch', 'ALUOp', 'Jump'];
  const CTL = {
    R: { RegDst: 1, ALUSrc: 0, MemtoReg: 0, RegWrite: 1, MemRead: 0, MemWrite: 0, Branch: 0, ALUOp: '10', Jump: 0 },
    addi: { RegDst: 0, ALUSrc: 1, MemtoReg: 0, RegWrite: 1, MemRead: 0, MemWrite: 0, Branch: 0, ALUOp: '00', Jump: 0 },
    lw: { RegDst: 0, ALUSrc: 1, MemtoReg: 1, RegWrite: 1, MemRead: 1, MemWrite: 0, Branch: 0, ALUOp: '00', Jump: 0 },
    sw: { RegDst: 'X', ALUSrc: 1, MemtoReg: 'X', RegWrite: 0, MemRead: 0, MemWrite: 1, Branch: 0, ALUOp: '00', Jump: 0 },
    beq: { RegDst: 'X', ALUSrc: 0, MemtoReg: 'X', RegWrite: 0, MemRead: 0, MemWrite: 0, Branch: 1, ALUOp: '01', Jump: 0 },
    j: { RegDst: 'X', ALUSrc: 'X', MemtoReg: 'X', RegWrite: 0, MemRead: 0, MemWrite: 0, Branch: 0, ALUOp: 'XX', Jump: 1 }
  };
  const ROWNAME = { R: 'R-type', addi: 'addi', lw: 'lw', sw: 'sw', beq: 'beq', j: 'j' };
  const EQN = {
    RegDst: ['R-format', 'Picks rd (1) or rt (0) as the register to write.'],
    ALUSrc: ['lw + sw + addi', 'Picks the sign-extended immediate (1) or read data 2 (0) as the ALU’s second input.'],
    MemtoReg: ['lw', 'Picks memory data (1) or the ALU result (0) as the value written to the register.'],
    RegWrite: ['R-format + lw + addi', 'Lets the register file write at the end of the cycle.'],
    MemRead: ['lw', 'Data memory puts the word at the address on its read-data output.'],
    MemWrite: ['sw', 'Data memory stores the write-data input at the address.'],
    Branch: ['beq', 'ANDed with the ALU’s Zero flag to make PCSrc.'],
    ALUOp: ['ALUOp1 = R-format, ALUOp0 = beq', '2-bit hint to ALU control: 00 add, 01 subtract, 10 look at funct.'],
    Jump: ['j', 'Picks the jump address (1) for the next PC instead of PC+4 / branch target (0).']
  };
  const ALUC = { add: ['0010', 'add'], sub: ['0110', 'subtract'], and: ['0000', 'AND'], or: ['0001', 'OR'], slt: ['0111', 'set on less than'] };
  const FUNCT = { add: '100000', sub: '100010', and: '100100', or: '100101', slt: '101010' };
  const MUX = {
    regdst: {
      name: 'RegDst mux', sig: 'RegDst', at: 'in front of the register file’s <i>write register</i> input',
      in0: 'rt — instruction bits [20–16]', in1: 'rd — instruction bits [15–11]',
      pick: {
        R: [1, 'R-format: rt is the second <b>source</b>, so the destination is held in rd.'],
        addi: [0, 'I-format has no rd field — the destination is in rt.'],
        lw: [0, 'I-format: the loaded value goes to rt.'],
        sw: ['X', 'RegWrite = 0: no register is written, so whichever number it passes is ignored.'],
        beq: ['X', 'RegWrite = 0: no register is written.'],
        j: ['X', 'RegWrite = 0: no register is written.']
      },
      when: 'Set in ID; the chosen register number must be steady at the write-register input before the clock edge at the end of the cycle (WB).',
      trap: 'RegDst does not choose a <b>source</b>. rs and rt are always read; RegDst only decides which field names the <b>destination</b>.'
    },
    alusrc: {
      name: 'ALUSrc mux', sig: 'ALUSrc', at: 'in front of the ALU’s second (lower) input',
      in0: 'read data 2 — the value of register rt', in1: 'the sign-extended 16-bit immediate [15–0]',
      pick: {
        R: [0, 'Two register operands: rs op rt.'],
        addi: [1, 'Register + constant: rs + immediate.'],
        lw: [1, 'Address = base register rs + offset.'],
        sw: [1, 'Address = base register rs + offset. (rt’s value still leaves read data 2, but goes to data memory’s write-data input, not the ALU.)'],
        beq: [0, 'Compares two registers: the ALU subtracts rt from rs and checks Zero.'],
        j: ['X', 'The ALU result is not used by a jump.']
      },
      when: 'Set in ID; matters in EX, while the ALU computes.',
      trap: 'sw has ALUSrc = 1 even though it needs rt’s value — that value goes round the ALU to memory’s write-data input.'
    },
    memtoreg: {
      name: 'MemtoReg mux', sig: 'MemtoReg', at: 'in front of the register file’s <i>write data</i> input (far right in the figure)',
      in0: 'the ALU result', in1: 'the word read from data memory',
      pick: {
        R: [0, 'The answer comes from the ALU.'],
        addi: [0, 'The sum comes from the ALU.'],
        lw: [1, 'The value to write is the word loaded from memory.'],
        sw: ['X', 'RegWrite = 0: nothing is written back.'],
        beq: ['X', 'RegWrite = 0: nothing is written back.'],
        j: ['X', 'RegWrite = 0: nothing is written back.']
      },
      when: 'Set in ID; matters in WB, when the register file captures the value at the clock edge.',
      trap: 'P&H draw this mux with input 1 (memory) on top and 0 (ALU) underneath — the reverse of the other muxes. Read the numbers, not the position.'
    },
    pcsrc: {
      name: 'PCSrc (branch) mux', sig: 'PCSrc', at: 'top right, choosing the sequential or the branch address',
      in0: 'PC + 4', in1: 'branch target = PC + 4 + (sign-extended offset × 4)',
      pick: {
        R: [0, 'Branch = 0, so PCSrc = 0.'],
        addi: [0, 'Branch = 0.'],
        lw: [0, 'Branch = 0.'],
        sw: [0, 'Branch = 0.'],
        beq: ['Z', 'PCSrc = Branch AND Zero: 1 if rs = rt (taken), 0 if not.'],
        j: [0, 'Branch = 0 (and the Jump mux overrides it anyway).']
      },
      when: 'Decided at the end of EX (needs Zero); the PC loads the chosen address at the clock edge that ends the cycle.',
      trap: 'PCSrc is <b>not</b> an output of the control unit. Control only gives Branch; an AND gate combines it with the ALU’s Zero flag.'
    },
    jump: {
      name: 'Jump mux', sig: 'Jump', at: 'the very last mux before the PC',
      in0: 'the PCSrc mux’s output (PC + 4 or the branch target)', in1: 'jump address = PC+4[31–28] ∥ instruction[25–0] ∥ 00',
      pick: {
        R: [0, 'Not a jump.'],
        addi: [0, 'Not a jump.'],
        lw: [0, 'Not a jump.'],
        sw: [0, 'Not a jump.'],
        beq: [0, 'Not a jump.'],
        j: [1, 'The 26-bit target is shifted left 2 and joined to the top 4 bits of PC + 4.']
      },
      when: 'Set in ID; the PC loads its output at the clock edge.',
      trap: 'The 26-bit field is a <b>word</b> address: shifting left by 2 makes it a byte address (28 bits), and the top 4 bits come from PC + 4.'
    }
  };
  const MUXK = ['regdst', 'alusrc', 'memtoreg', 'pcsrc', 'jump'];
  const SH = { regdst: ['rt', 'rd'], alusrc: ['read data 2', 'immediate'], memtoreg: ['ALU', 'mem'], pcsrc: ['PC + 4', 'branch target'], jump: ['PC+4 / target', 'jump address'] };
  const SHL = { regdst: ['rt [20–16]', 'rd [15–11]'], alusrc: ['read data 2 (rt)', 'sign-extended immediate'], memtoreg: ['ALU result', 'memory read data'], pcsrc: ['PC + 4', 'branch target'], jump: ['PCSrc mux output', 'jump address'] };
  const W = [
    ['pc', '74,395 108,395', 'IF', 'all'], ['pcadd', '90,395 90,104 130,104', 'IF', 'all'], ['four', '114,140 130,140', 'IF', 'all'],
    ['pc4', '180,122 200,122 200,74 410,74', 'IF', 'all'], ['pc4m', '410,74 830,74 830,92 852,92', 'IF', 'R addi lw sw beq'],
    ['ins', '220,395 246,395', 'IF', 'all'], ['bus', '246,46 246,612', 'ID', 'all'],
    ['op', '246,230 297,230', 'ID', 'all'], ['rs', '246,352 420,352', 'ID', 'R addi lw sw beq'], ['rtA', '246,388 268,388', 'ID', 'R addi lw sw beq'],
    ['rtB', '268,388 420,388', 'ID', 'R sw beq'], ['rt2', '268,388 268,432 318,432', 'ID', 'addi lw'], ['rd', '246,468 318,468', 'ID', 'R'],
    ['wreg', '336,450 420,450', 'ID', 'R addi lw'], ['imm', '246,570 434,570', 'ID', 'addi lw sw beq'], ['fn', '246,612 668,612', 'ID', 'R'],
    ['j26', '246,46 300,46', 'ID', 'j'], ['j28', '370,46 410,46', 'ID', 'j'], ['pc4hi', '410,74 410,50', 'ID', 'j'], ['jaddr', '410,46 930,46 930,54 950,54', 'ID', 'j'],
    ['rd1', '538,360 650,360', 'EX', 'R addi lw sw beq'], ['rd2a', '538,430 548,430', 'EX', 'R sw beq'], ['rd2b', '548,430 588,430', 'EX', 'R beq'],
    ['sxa', '522,570 560,570', 'EX', 'addi lw sw beq'], ['sxv', '560,570 560,466', 'EX', 'addi lw sw beq'], ['sxm', '560,466 588,466', 'EX', 'addi lw sw'],
    ['aluB', '606,448 650,448', 'EX', 'R addi lw sw beq'], ['sx2', '560,466 560,140 565,140', 'EX', 'beq'], ['sl2o', '625,140 640,140', 'EX', 'beq'],
    ['pc4b', '600,74 600,104 640,104', 'EX', 'beq'], ['brt', '690,122 852,122', 'EX', 'beq'], ['zero', '722,360 760,360 760,157 826,157', 'EX', 'beq'],
    ['res', '722,420 772,420', 'EX', 'R addi lw sw'], ['resm', '772,420 800,420', 'MEM', 'lw sw'], ['wd', '548,430 548,540 786,540 786,486 800,486', 'MEM', 'sw'],
    ['mrd', '920,400 962,400', 'MEM', 'lw'], ['byp', '772,420 772,316 940,316 940,440 962,440', 'WB', 'R addi'],
    ['wb', '980,418 1004,418 1004,636 400,636 400,496 420,496', 'WB', 'R addi lw'],
    ['pcsrcO', '870,109 910,109 910,100 950,100', 'WB', 'R addi lw sw beq'], ['npc', '968,78 990,78 990,18 12,18 12,395 28,395', 'WB', 'all']
  ];
  const CY = { Branch: 167, Jump: 182, MemtoReg: 196, MemRead: 210, MemWrite: 224, ALUOp: 238, ALUSrc: 252, RegWrite: 266 };
  const ex = (y) => (345 + 48 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 230) / 78, 2)))).toFixed(1);
  const CW = [
    ['Branch', `${ex(167)},167 826,167`, [754, 163, 'end']],
    ['Jump', `${ex(182)},182 959,182 959,119`, [955, 178, 'end']],
    ['MemtoReg', `${ex(196)},196 971,196 971,379`, [967, 192, 'end']],
    ['MemRead', `${ex(210)},210 880,210 880,329`, [884, 300, 'start']],
    ['MemWrite', `${ex(224)},224 840,224 840,329`, [836, 300, 'end']],
    ['ALUOp', `${ex(238)},238 744,238 744,600`, [748, 590, 'start']],
    ['ALUSrc', `${ex(252)},252 597,252 597,415`, [601, 408, 'start']],
    ['RegWrite', `${ex(266)},266 479,266 479,329`, [483, 322, 'start']],
    ['RegDst', '327,302 327,417', [323, 412, 'end']]
  ];
  const BADGE = {
    pc: [51, 343], pc4: [300, 68], ins: [165, 476], op: [272, 246], rs: [340, 346], rtB: [345, 382], rt2: [294, 426], rd: [296, 462], wreg: [378, 444], imm: [340, 564],
    fn: [560, 606], jaddr: [690, 40], rd1: [620, 354], rd2a: [571, 424], aluB: [628, 442], sx2: [560, 300], sl2o: [632, 161], brt: [770, 116], zero: [740, 352],
    res: [752, 413], mrd: [941, 394], wd: [670, 534], byp: [856, 310], wb: [860, 630], npc: [500, 12], pcsrcO: [920, 122]
  };
  const MEMV = 42, PC0 = 0x00400010;
  const GROUPS = ['R', 'I', 'J'].map((f) => ({
    f,
    items: INS.map((x, k) => [x, k]).filter(([x]) => FMT[x[2]][0] === f)
  }));

  let cur = $state(untrack(() => Math.max(0, INS.findIndex((x) => x[0] === (opts.ins === 'R' ? 'add' : opts.ins || 'lw')))));
  let stage = $state(4);
  let tab = $state(untrack(() => opts.tab || (opts.mux ? 'mux' : 'stage')));
  let selMux = $state(untrack(() => opts.mux || 'alusrc'));
  let s1Val = $state(untrack(() => (opts.s1 != null ? String(opts.s1) : '20')));
  let s2Val = $state(untrack(() => (opts.s2 != null ? String(opts.s2) : '20')));
  let mVal = $state(String(MEMV));

  let cvEl = $state(null);
  let svgEl = $state(null);
  let sayEl = $state(null);
  let drawn = false;

  const box = (x, y, w, h, t, sub, cls, data) =>
    `<g class="dp-u ${cls || ''}"${data ? ` data-part="${data}" tabindex="0" role="button"` : ''}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7"/><text x="${x + w / 2}" y="${y + h / 2 + (sub ? -2 : 4)}" class="dp-ut">${t}</text>${sub ? `<text x="${x + w / 2}" y="${y + h / 2 + 13}" class="dp-us">${sub}</text>` : ''}</g>`;
  const adder = (x, y, cls, t) =>
    `<g class="dp-u ${cls || ''}"><path d="M${x} ${y} L${x + 50} ${y + 20} L${x + 50} ${y + 52} L${x} ${y + 72} L${x} ${y + 44} L${x + 10} ${y + 36} L${x} ${y + 28} Z"/><text x="${x + 30}" y="${y + 40}" class="dp-us">${t || 'Add'}</text></g>`;
  const ell = (cx, cy, rx, ry, t, cls, data) =>
    `<g class="dp-u ${cls || ''}"${data ? ` data-part="${data}" tabindex="0" role="button"` : ''}><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/><text x="${cx}" y="${cy + 4}" class="dp-us">${t}</text></g>`;
  const cls01 = (v) => (v === 'X' || v === 'XX' ? 'x' : /1/.test(String(v)) ? '1' : '0');
  const v01 = (v) => `<span class="v-${cls01(v)}">${v}</span>`;

  const C = $derived.by(() => {
    const ins = INS[cur], k = ins[2], op = ins[0], a = Logic.assemble(ins[1], { pc: PC0 });
    const s1 = Number(s1Val) | 0, s2 = Number(s2Val) | 0, mv = Number(mVal) | 0;
    const imm = k === 'j' ? 0 : a.fields[3] && a.fields[3].signedValue != null ? a.fields[3].signedValue : 0;
    const A = s1, B = k === 'R' || k === 'beq' ? s2 : imm, aop = k === 'R' ? op : k === 'beq' ? 'sub' : 'add';
    let res = 0;
    if (aop === 'add') res = (A + B) | 0;
    else if (aop === 'sub') res = (A - B) | 0;
    else if (aop === 'and') res = A & B;
    else if (aop === 'or') res = A | B;
    else if (aop === 'slt') res = A < B ? 1 : 0;
    const zero = res === 0 ? 1 : 0;
    const tgt = (PC0 + 4 + 4 * imm) >>> 0;
    const taken = k === 'beq' && zero === 1;
    const jfield = k === 'j' ? a.fields[1].value : 0;
    const jaddr = (((PC0 + 4) & 0xF0000000) | (jfield << 2)) >>> 0;
    const npc = k === 'j' ? jaddr : taken ? tgt : PC0 + 4;
    const wbv = k === 'lw' ? mv : res;
    const pcsrc = taken ? 1 : 0;
    const hx = (v) => '0x' + (v >>> 0).toString(16).toUpperCase().padStart(8, '0');
    const dest = k === 'R' || k === 'addi' || k === 'lw' ? '$t0' : '';
    const ctl = CTL[k], aluc = k === 'j' ? null : ALUC[aop];
    const V = {
      pc: hx(PC0), pc4: hx(PC0 + 4), ins: hx(a.word), op: OPC[k], rs: '$s1',
      rtA: k === 'R' || k === 'sw' || k === 'beq' ? '$s2' : '$t0', rtB: '$s2', rt2: '$t0', rd: '$t0', wreg: dest, imm,
      fn: k === 'R' ? FUNCT[op] : '', j26: '0x' + jfield.toString(16).toUpperCase(), jaddr: hx(jaddr),
      rd1: A, rd2a: s2, aluB: B, sx2: imm, sl2o: imm * 4, brt: hx(tgt), zero: 'Zero=' + zero, res, mrd: mv, wd: s2,
      byp: res, wb: wbv, npc: hx(npc), pcsrcO: hx(taken ? tgt : PC0 + 4)
    };
    if (k !== 'beq') {
      V.sx2 = '';
      V.sl2o = '';
    }
    return { a, k, op, aop, A, B, res, zero, tgt, taken, npc, wbv, PC: PC0, imm, mv, s1, s2, V, hx, ctl, aluc, jaddr, jfield, pcsrc, dest };
  });

  const muxSel = (cData, key) => (key === 'pcsrc' ? cData.pcsrc : cData.ctl[MUX[key].sig]);

  const svgHtml = $derived.by(() => {
    const k = C.k, ctl = C.ctl, known = stage >= 1;
    const used = (w) => w[3] === 'all' || w[3].split(' ').includes(k);
    const st = (w) => (used(w) ? (STG.indexOf(w[2]) <= stage ? 'act' + (STG.indexOf(w[2]) === stage ? ' now' : '') : 'later') : 'idle');
    const use = (classes, sg) => {
      const u = classes === 'all' || classes.split(' ').includes(k);
      const si = STG.indexOf(sg);
      return u ? (si <= stage ? 'act' + (si === stage ? ' now' : '') : 'later') : 'idle';
    };
    function mux(key, x, y, h, ys, yOut, sel, cls, nums, labelPos) {
      const n0 = nums ? nums[0] : 0, n1 = nums ? nums[1] : 1;
      let s = `<g class="dp-u dp-mux ${cls}${selMux === key && tab === 'mux' ? ' picked' : ''}" data-part="mux:${key}" tabindex="0" role="button" aria-label="${MUX[key].name}"><rect x="${x}" y="${y}" width="18" height="${h}" rx="9"/>`;
      s += `<text x="${x + 4}" y="${ys[0] + 3}" class="dp-mn ${sel === n0 ? 'sel' : ''}">${n0}</text><text x="${x + 4}" y="${ys[1] + 3}" class="dp-mn ${sel === n1 ? 'sel' : ''}">${n1}</text>`;
      if (sel === 0 || sel === 1) {
        const yi = sel === n0 ? ys[0] : ys[1];
        s += `<path d="M${x + 9} ${yi} L${x + 16} ${yOut}" class="dp-switch"/>`;
      } else if (sel === 'X') s += `<text x="${x + 13}" y="${yOut + 3}" class="dp-mx">X</text>`;
      if (sel === 0 || sel === 1) s += `<text x="${labelPos[0]}" y="${labelPos[1]}" class="dp-mlab" text-anchor="${labelPos[2] || 'middle'}">passes ${SH[key][sel]}</text>`;
      else if (sel === 'X') s += `<text x="${labelPos[0]}" y="${labelPos[1]}" class="dp-mlab x" text-anchor="${labelPos[2] || 'middle'}">don’t care</text>`;
      s += '</g>';
      return s;
    }

    let g = '<defs><marker id="dpar" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0 L8 4 L0 8z" class="dp-arh"/></marker><marker id="dpac" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0 L8 4 L0 8z" class="dp-arc"/></marker></defs>';
    W.forEach((w) => {
      g += `<polyline points="${w[1]}" class="dp-halo"/><polyline points="${w[1]}" class="dp-w ${st(w)} ${w[0] === 'npc' && (C.taken || k === 'j') ? 'taken' : ''}" marker-end="url(#dpar)"/>`;
    });
    const cval = (n) => (n === 'PCSrc' ? C.pcsrc : n === 'ALUop4' ? (C.aluc ? C.aluc[0] : 'XXXX') : ctl[n]);
    const cwire = (n, pts, lp) => {
      const v = cval(n), c = known ? 'c' + cls01(v) : 'cq';
      return `<polyline points="${pts}" class="dp-halo c"/><polyline points="${pts}" class="dp-cw ${c}" marker-end="url(#dpac)"/>` + (lp ? `<text x="${lp[0]}" y="${lp[1]}" text-anchor="${lp[2]}" class="dp-cl ${c}">${n}${known ? '=' + v : ''}</text>` : '');
    };
    CW.forEach((c) => { g += cwire(c[0], c[1], c[2]); });
    g += cwire('PCSrc', '848,162 861,162 861,143', [866, 156, 'start']);
    g += cwire('ALUop4', '712,596 712,452', null) + `<text x="716" y="520" class="dp-cl ${known && C.aluc ? 'c1' : known ? 'cx' : 'cq'}">${known ? (C.aluc ? 'ALU op ' + C.aluc[0] : 'ALU op X') : 'ALU operation'}</text>`;

    g += box(28, 350, 46, 90, 'PC', '', use('all', 'IF')) + box(108, 330, 112, 130, 'Instruction', 'memory', use('all', 'IF')) + adder(130, 86, use('all', 'IF')) + `<text x="110" y="144" class="dp-us" text-anchor="end">4</text>`;
    g += `<g class="dp-u dp-ctlu ${use('all', 'ID')}" data-part="control" tabindex="0" role="button" aria-label="control unit"><ellipse cx="345" cy="230" rx="48" ry="78"/><text x="345" y="226" class="dp-ut">Control</text><text x="345" y="241" class="dp-us">opcode → signals</text></g>`;
    CW.forEach((c) => {
      if (c[0] === 'RegDst') return;
      const y = CY[c[0]];
      g += `<text x="${(+ex(y) + 3).toFixed(1)}" y="${y - 2.5}" class="dp-cs">${c[0]}</text>`;
    });
    g += `<text x="331" y="318" class="dp-cs" text-anchor="end">RegDst</text>`;
    g += `<g class="dp-u ${use('R addi lw sw beq', 'ID')}"><rect x="420" y="330" width="118" height="190" rx="7"/><text x="479" y="412" class="dp-ut">Registers</text></g>`;
    g += `<text x="425" y="355" class="dp-port">read reg 1</text><text x="425" y="391" class="dp-port">read reg 2</text><text x="425" y="453" class="dp-port">write reg</text><text x="425" y="499" class="dp-port">write data</text><text x="533" y="372" class="dp-port" text-anchor="end">data 1</text><text x="533" y="442" class="dp-port" text-anchor="end">data 2</text>`;
    g += ell(478, 570, 44, 17, 'Sign-extend', use('addi lw sw beq', 'ID')) + ell(335, 46, 35, 13, 'Shift ≪ 2', use('j', 'ID'));
    g += `<g class="dp-u ${use('R addi lw sw beq', 'EX')}"><path d="M650 318 L722 346 L722 446 L650 474 L650 418 L662 396 L650 374 Z"/><text x="694" y="400" class="dp-ut">ALU</text><text x="718" y="364" class="dp-port" text-anchor="end">Zero</text><text x="718" y="424" class="dp-port" text-anchor="end">result</text></g>`;
    g += ell(712, 612, 44, 16, 'ALU control', use('R addi lw sw beq', 'EX'), 'aluctl');
    g += ell(595, 140, 30, 12, 'Shift ≪ 2', use('beq', 'EX')) + adder(640, 86, use('beq', 'EX'), 'Add');
    g += `<g class="dp-u ${use('beq', 'EX')}" data-part="and" tabindex="0" role="button" aria-label="AND gate"><path d="M826 151 L836 151 A11 11 0 0 1 836 173 L826 173 Z"/><text x="836" y="186" class="dp-us">AND</text></g>`;
    g += `<g class="dp-u ${use('lw sw', 'MEM')}"><rect x="800" y="330" width="120" height="176" rx="7"/><text x="860" y="448" class="dp-ut">Data</text><text x="860" y="463" class="dp-us">memory</text></g>`;
    g += `<text x="805" y="423" class="dp-port">address</text><text x="805" y="489" class="dp-port">write data</text><text x="915" y="403" class="dp-port" text-anchor="end">read data</text>`;

    const sv = (key) => (known ? (key === 'pcsrc' ? (stage >= 2 ? C.pcsrc : k === 'beq' ? '?' : 0) : muxSel(C, key)) : '?');
    g += mux('regdst', 318, 418, 64, [432, 468], 450, sv('regdst'), use('R addi lw', 'ID'), null, [327, 497]);
    g += mux('alusrc', 588, 416, 64, [430, 466], 448, sv('alusrc'), use('R addi lw sw beq', 'EX'), null, [597, 494]);
    g += mux('memtoreg', 962, 380, 76, [400, 440], 418, sv('memtoreg'), use('R addi lw', 'WB'), [1, 0], [971, 470]);
    g += mux('pcsrc', 852, 76, 66, [92, 122], 109, sv('pcsrc'), use('R addi lw sw beq', 'WB'), null, [861, 70]);
    g += mux('jump', 950, 38, 80, [100, 54], 78, sv('jump'), use('all', 'WB'), [0, 1], [945, 32, 'end']);
    g += `<circle cx="410" cy="46" r="2.6" class="dp-dot"/><circle cx="268" cy="388" r="2.4" class="dp-dot"/><circle cx="548" cy="430" r="2.4" class="dp-dot"/><circle cx="560" cy="466" r="2.4" class="dp-dot"/><circle cx="772" cy="420" r="2.4" class="dp-dot"/><circle cx="410" cy="74" r="2.4" class="dp-dot"/><circle cx="600" cy="74" r="2.4" class="dp-dot"/><circle cx="90" cy="395" r="2.4" class="dp-dot"/>`;
    g += `<text x="252" y="41" class="dp-bit">[25–0]</text><text x="374" y="40" class="dp-bit">28 bits</text><text x="414" y="66" class="dp-bit">PC+4 [31–28]</text><text x="440" y="40" class="dp-bit">jump address [31–0]</text><text x="252" y="226" class="dp-bit">[31–26]</text><text x="252" y="348" class="dp-bit">[25–21] rs</text><text x="272" y="384" class="dp-bit">[20–16] rt</text><text x="252" y="481" class="dp-bit">[15–11] rd</text><text x="252" y="566" class="dp-bit">[15–0]</text><text x="252" y="608" class="dp-bit">[5–0] funct</text><text x="526" y="564" class="dp-bit">32 bits</text>`;

    W.forEach((w) => {
      const p = BADGE[w[0]];
      if (!p || !used(w) || STG.indexOf(w[2]) > stage) return;
      const t = C.V[w[0]];
      if (t === '' || t == null) return;
      const s = String(t);
      const wd = s.length * 6.4 + 10;
      g += `<g class="dp-val ${STG.indexOf(w[2]) === stage ? 'now' : ''}"><rect x="${p[0] - wd / 2}" y="${p[1] - 11}" width="${wd}" height="15" rx="4"/><text x="${p[0]}" y="${p[1]}">${esc(s)}</text></g>`;
    });
    return g;
  });

  const sayHtml = $derived.by(() => {
    const k = C.k, hx = C.hx, ctl = C.ctl;
    const head = `<div class="dp-sh"><span class="dp-stg">${STG[stage]}</span><code class="asm">${asmHL(INS[cur][1])}</code><span class="dp-fmt">${FMT[k]} · opcode ${OPC[k]}${k === 'R' ? ' · funct ' + FUNCT[C.op] : ''}</span></div>`;
    if (tab === 'stage') {
      const opn = { add: '+', sub: '−', and: 'AND', or: 'OR', slt: '<' };
      const rtl = {
        IF: [`instruction ← IM[PC = ${hx(C.PC)}] = ${hx(C.a.word)}`, `PC + 4 = ${hx(C.PC + 4)} (computed now, used at the end of the cycle)`],
        ID: [
          `opcode ${OPC[k]} → ${ROWNAME[k]} → control sets: ${SIG.map((s) => s + '=' + ctl[s]).join(', ')}`,
          ...(k === 'j'
            ? [`jump address = PC+4[31–28] ∥ ${C.jfield.toString(2).padStart(26, '0')} ∥ 00 = ${hx(C.jaddr)}`, 'the register file and sign-extend still work on the bits, but nothing uses their outputs']
            : [
                `read rs = $s1 = ${C.s1}` +
                  (k === 'R' || k === 'sw' || k === 'beq'
                    ? `; read rt = $s2 = ${C.s2}`
                    : '; rt = $t0 is read too, but only its NUMBER is used (as the destination)'),
                k === 'R' ? 'immediate bits are sign-extended too, but ALUSrc = 0 will ignore them' : `sign-extend immediate: ${C.imm}`
              ])
        ],
        EX:
          k === 'j'
            ? ['ALU not used (ALUOp = XX); nothing to compute — the jump address is already known']
            : [
                k === 'R' ? `ALU control: ALUOp 10 + funct ${FUNCT[C.op]} → ${C.aluc[0]} (${C.aluc[1]})` : `ALU control: ALUOp ${ctl.ALUOp} → ${C.aluc[0]} (${C.aluc[1]})`,
                k === 'R'
                  ? `ALU: ${C.A} ${opn[C.op]} ${C.B} = ${C.res}`
                  : k === 'beq'
                    ? `ALU: ${C.A} − ${C.B} = ${C.res} → Zero = ${C.zero}`
                    : k === 'addi'
                      ? `ALU: ${C.A} + ${C.imm} = ${C.res}`
                      : `ALU: address = ${C.A} + ${C.imm} = ${C.res}`,
                ...(k === 'beq' ? [`branch adder: target = PC + 4 + ${C.imm} × 4 = ${hx(C.tgt)}`, `PCSrc = Branch AND Zero = 1 AND ${C.zero} = ${C.pcsrc}`] : [])
              ],
        MEM:
          k === 'lw'
            ? [`MemRead = 1: read Mem[${C.res}] = ${C.mv}`]
            : k === 'sw'
              ? [`MemWrite = 1: Mem[${C.res}] ← $s2 = ${C.s2}`]
              : ['data memory not used (MemRead = MemWrite = 0)'],
        WB: [
          k === 'R' || k === 'addi'
            ? `RegWrite = 1, RegDst = ${ctl.RegDst} picks ${k === 'R' ? 'rd' : 'rt'}, MemtoReg = 0 picks the ALU: $t0 ← ${C.res}`
            : k === 'lw'
              ? `RegWrite = 1, RegDst = 0 picks rt, MemtoReg = 1 picks memory: $t0 ← ${C.mv}`
              : 'RegWrite = 0: no register written (RegDst, MemtoReg = X)',
          `PC ← ${
            k === 'j'
              ? `jump address ${hx(C.jaddr)} (Jump = 1)`
              : k === 'beq'
                ? C.taken
                  ? `branch target ${hx(C.tgt)} (PCSrc = 1, taken)`
                  : `PC + 4 = ${hx(C.PC + 4)} (PCSrc = 0, not taken)`
                : `PC + 4 = ${hx(C.PC + 4)} (PCSrc = 0, Jump = 0)`
          }`
        ]
      };
      return head + `<p>${SDESC[STG[stage]]}</p><ul>${rtl[STG[stage]].map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`;
    }
    if (tab === 'mux') {
      const m = MUX[selMux];
      return (
        head +
        `<p>A multiplexer passes ONE of its inputs to its output; a 1-bit select line decides which. The control unit drives every select line except PCSrc. Click a mux in the diagram (or a row) for the details.</p>` +
        `<div class="tbl-wrap"><table class="dp-tbl dp-mt"><thead><tr><th>Mux</th><th>Select</th><th>0 passes</th><th>1 passes</th><th>${ROWNAME[k]} picks</th></tr></thead><tbody>${MUXK.map((key) => {
          const x = MUX[key], p = x.pick[k], v = p[0] === 'Z' ? C.pcsrc : p[0];
          return `<tr data-mux="${key}" class="${key === selMux ? 'on' : ''}"><td>${x.name.replace(' mux', '')}</td><td>${x.sig}</td><td>${SHL[key][0]}</td><td>${SHL[key][1]}</td><td>${v01(v)}</td></tr>`;
        }).join('')}</tbody></table></div>` +
        `<div class="dp-md"><p><b>${m.name}</b> — ${m.at}. Input <b>0</b> → ${m.in0}; input <b>1</b> → ${m.in1}.</p><div class="tbl-wrap"><table class="dp-tbl"><thead><tr><th></th>${Object.keys(CTL).map((r) => `<th>${ROWNAME[r]}</th>`).join('')}</tr></thead><tbody><tr><td>${m.sig}</td>${Object.keys(CTL).map((r) => {
          const p = m.pick[r][0];
          return `<td class="${r === k ? 'cur' : ''}">${p === 'Z' ? '<span class="v-1">Zero</span>' : v01(p)}</td>`;
        }).join('')}</tr></tbody></table></div>` +
        `<ul class="dp-why">${Object.keys(CTL).map((r) => `<li class="${r === k ? 'cur' : ''}"><b>${ROWNAME[r]}</b> → ${m.pick[r][0] === 'Z' ? 'Branch AND Zero' : m.pick[r][0]}: ${m.pick[r][1]}</li>`).join('')}</ul>` +
        `<p><b>When:</b> ${m.when}</p><p class="dp-trap"><b>Trap:</b> ${m.trap}</p></div>`
      );
    }
    if (tab === 'ctl') {
      return (
        head +
        `<p>The control unit is combinational logic: its only input is the 6-bit opcode (bits 31–26). From it, it produces every control signal at once, early in the cycle, and they stay steady until the next instruction. Each signal is a simple OR of the instruction types that need it:</p>` +
        `<div class="tbl-wrap"><table class="dp-tbl dp-eq"><thead><tr><th>Signal</th><th>= 1 for</th><th>now</th><th>What it does</th></tr></thead><tbody>${SIG.map((s) => `<tr><td>${s}</td><td>${EQN[s][0]}</td><td>${v01(ctl[s])}</td><td>${EQN[s][1]}</td></tr>`).join('')}<tr><td>PCSrc</td><td>Branch AND Zero</td><td>${v01(stage >= 2 ? C.pcsrc : k === 'beq' ? '?' : 0)}</td><td>Not from control: an AND gate makes it from Branch and the ALU’s Zero flag.</td></tr></tbody></table></div>` +
        `<div class="tbl-wrap"><table class="dp-tbl"><thead><tr><th>Instr.</th><th>opcode</th>${SIG.map((n) => `<th>${n}</th>`).join('')}</tr></thead><tbody>${Object.keys(CTL).map((r) => `<tr class="${r === k ? 'on' : ''}"><td>${ROWNAME[r]}</td><td>${OPC[r]}</td>${SIG.map((n) => `<td class="v-${cls01(CTL[r][n])}">${CTL[r][n]}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` +
        `<p class="ref">R-type, lw, sw: L10 [33:41]–[38:17]. beq, ALUOp and Jump: P&H §4.4 (Figs 4.22, 4.24). addi is not in the P&H table; its row follows the same logic (register + constant, write rt). X = don’t care: the signal’s result is never used, because nothing is written that depends on it. Built from the equations above, every X simply comes out as 0 — harmless, which is exactly why X is allowed.</p>`
      );
    }
    const row = k === 'R' ? C.op : k === 'beq' ? 'beq' : k === 'j' ? 'j' : 'mem';
    const rows = [
      ['mem', 'lw / sw / addi', '00', 'XXXXXX', 'add', '0010'],
      ['beq', 'beq', '01', 'XXXXXX', 'subtract', '0110'],
      ['add', 'R-type add', '10', '100000', 'add', '0010'],
      ['sub', 'R-type sub', '10', '100010', 'subtract', '0110'],
      ['and', 'R-type and', '10', '100100', 'AND', '0000'],
      ['or', 'R-type or', '10', '100101', 'OR', '0001'],
      ['slt', 'R-type slt', '10', '101010', 'set on less than', '0111']
    ];
    return (
      head +
      `<p>Two levels of decoding. The main control unit only knows the opcode, so it sends a 2-bit <b>ALUOp</b>: 00 = “add” (address or addi), 01 = “subtract” (beq compare), 10 = “R-type: look at the funct field”. The small <b>ALU control</b> unit combines ALUOp with funct (bits 5–0) to make the 4-bit operation the ALU performs.</p>` +
      `<div class="tbl-wrap"><table class="dp-tbl"><thead><tr><th>Instruction</th><th>ALUOp</th><th>funct</th><th>ALU action</th><th>ALU control</th></tr></thead><tbody>${rows.map((r) => `<tr class="${r[0] === row ? 'on' : ''}"><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td></tr>`).join('')}<tr class="${row === 'j' ? 'on' : ''}"><td>j</td><td>XX</td><td>XXXXXX</td><td>— (not used)</td><td>X</td></tr></tbody></table></div>` +
      `<p class="ref">P&H §4.4, Figs 4.12–4.13. Why split it? The main control stays small (it ignores funct) and the ALU decoding is a separate little table.</p>`
    );
  });

  $effect(() => {
    void stage;
    if (cvEl && svgEl) {
      if (drawn && cvEl.scrollWidth > cvEl.clientWidth + 4) {
        const cx = [150, 340, 640, 860, 900][stage];
        const w = svgEl.getBoundingClientRect().width;
        cvEl.scrollTo({ left: Math.max(0, (cx / 1030) * w - cvEl.clientWidth / 2), behavior: 'smooth' });
      }
      drawn = true;
    }
  });

  $effect(() => {
    void sayHtml;
    if (sayEl) {
      sayEl.innerHTML = sayHtml;
      decorateHL(sayEl);
    }
  });

  function selectPart(p) {
    if (!p) return;
    if (p.startsWith('mux:')) {
      selMux = p.slice(4);
      tab = 'mux';
    } else if (p === 'control') tab = 'ctl';
    else if (p === 'aluctl') tab = 'alu';
    else if (p === 'and') {
      selMux = 'pcsrc';
      tab = 'mux';
    }
  }

  function onSvgClick(e) {
    const pt = e.target.closest('[data-part]');
    if (pt) selectPart(pt.dataset.part);
  }

  function onSvgKeydown(e) {
    const pt = e.target.closest?.('[data-part]');
    if (pt && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      selectPart(pt.dataset.part);
    }
  }

  function onSayClick(e) {
    const mr = e.target.closest('[data-mux]');
    if (mr) selMux = mr.dataset.mux;
  }
</script>

{#snippet body()}
  <div class="dp">
    <div class="dp-top">
      <div class="dp-ins">
        {#each GROUPS as g}
          <span class="dp-grp">
            <span class="dp-gl">{g.f}-format</span>
            {#each g.items as [x, k]}
              <button
                type="button"
                class="fx-pre"
                aria-pressed={cur === k}
                onclick={() => (cur = k)}
              >
                <code class="asm">{@html asmHL(x[1])}</code>
              </button>
            {/each}
          </span>
        {/each}
      </div>
      <div class="dp-regs">
        <label><span class="tk-reg">$s1</span><input type="number" bind:value={s1Val} /></label>
        <label><span class="tk-reg">$s2</span><input type="number" bind:value={s2Val} /></label>
        <label><span class="dp-memlbl">Mem[$s1+8]</span><input type="number" bind:value={mVal} /></label>
      </div>
    </div>

    <div class="dp-stages">
      <button type="button" class="mbtn" aria-label="previous stage" onclick={() => (stage = Math.max(0, stage - 1))}>◀</button>
      {#each STG as x, k}
        <button
          type="button"
          class="dp-sb"
          class:on={stage === k}
          class:past={k < stage}
          onclick={() => (stage = k)}
        >
          <b>{x}</b><i>{STG_SUB[k]}</i>
        </button>
      {/each}
      <button type="button" class="mbtn" aria-label="next stage" onclick={() => (stage = Math.min(4, stage + 1))}>▶</button>
      <button type="button" class="mbtn" onclick={() => (stage = 4)}>whole cycle</button>
    </div>

    <div class="dp-hint">Swipe the diagram sideways — it follows the stage you pick.</div>
    <div class="dp-canvas" bind:this={cvEl}>
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <svg
        viewBox="0 0 1030 650"
        class="dp-svg"
        role="img"
        aria-label="single-cycle datapath with control"
        bind:this={svgEl}
        onclick={onSvgClick}
        onkeydown={onSvgKeydown}
      >
        {@html svgHtml}
      </svg>
    </div>

    <div class="dp-key">
      <span><i class="k-act"></i>data used so far</span>
      <span><i class="k-now"></i>this stage</span>
      <span><i class="k-later"></i>used later in the cycle</span>
      <span><i class="k-idle"></i>not used</span>
      <span><i class="k-c1"></i>control = 1</span>
      <span><i class="k-c0"></i>control = 0</span>
      <span><i class="k-cx"></i>control = X (don’t care)</span>
    </div>

    <div class="dp-low">
      <div class="dp-tabs" role="tablist">
        {#each [['stage', 'This stage'], ['mux', 'Multiplexers'], ['ctl', 'Control unit'], ['alu', 'ALU control']] as t}
          <button
            type="button"
            role="tab"
            aria-selected={tab === t[0]}
            onclick={() => (tab = t[0])}
          >
            {t[1]}
          </button>
        {/each}
      </div>
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="dp-say" bind:this={sayEl} onclick={onSayClick}></div>
    </div>
  </div>
{/snippet}

{#if embedded}
  {@render body()}
{:else}
  <ToolShell title="Single-cycle MIPS datapath + control" sub="pick an instruction · step IF → ID → EX → MEM → WB · click a mux or the control unit">
    {@render body()}
  </ToolShell>
{/if}
