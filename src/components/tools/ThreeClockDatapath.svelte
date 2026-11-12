<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import { Logic } from '@/utils/logic.js';
  import { esc } from '@/utils/html.js';
  import { snugScroll } from '@/utils/math.js';
  import { decorate as decorateHL } from '@/utils/hl.js';
  import { pipeSVG, pdText } from '@/utils/svg.js';
  import { STG, IC, LAT, PROG, CNAME, vizCls, vizModel, vizF, vizH, uid as mkUid } from '@/utils/viz.js';

  let { opts = {} } = $props();

  const uid = mkUid('d3');
  const MODES = [['single', 'Single-cycle'], ['multi', 'Multi-cycle'], ['pipe', 'Pipelined']];
  const OPS = { add: '+', addu: '+', addi: '+', addiu: '+', sub: '−', subu: '−', and: 'AND', andi: 'AND', or: 'OR', ori: 'OR', xor: 'XOR', slt: '<', slti: '<' };
  const SX = [205, 415, 615, 805];
  const BX = [0, ...SX, 1000];
  const all = () => true;
  const br = (f) => f.c === 3;
  const wr = (f) => f.wr;
  const PREG = ['IF/ID', 'ID/EX', 'EX/MEM', 'MEM/WB'];

  const W = [
    ['32,225 44,225', 0, all], ['74,225 96,225', 0, all], ['84,225 84,93 104,93', 0, all], ['92,127 104,127', 0, all], ['148,110 165,110 165,70 197,70', 0, all],
    ['165,70 165,50 10,50 10,210 18,210', 0, all, 'npc'], ['184,225 197,225', 0, all],
    ['213,225 236,225', 1, all], ['236,132 236,410', 1, all], ['236,132 272,132', 1, all], ['236,200 262,200', 1, all], ['236,225 262,225', 1, (f) => f.c === 1 || f.c === 3 || f.aluRt],
    ['236,345 270,345', 1, (f) => f.imm != null], ['236,410 407,410', 1, wr, 'dst'], ['213,70 407,70', 1, br], ['348,132 407,132', 1, all, 'ctl'],
    ['358,205 407,205', 1, all], ['358,261 407,261', 1, (f) => f.c === 1 || f.aluRt], ['350,345 407,345', 1, (f) => f.imm != null],
    ['423,205 490,205', 2, all], ['423,261 432,261', 2, (f) => f.c === 1 || f.aluRt], ['432,261 452,261', 2, (f) => f.aluRt], ['432,261 432,320 607,320', 2, (f) => f.c === 1], ['423,345 442,345', 2, (f) => f.imm != null], ['442,345 442,285 452,285', 2, (f) => f.useImm],
    ['442,345 442,104 456,104', 2, br], ['484,104 490,104', 2, br], ['466,273 490,273', 2, all], ['423,70 490,70', 2, br], ['534,87 607,87', 2, br], ['550,212 607,212', 2, br],
    ['550,240 607,240', 2, (f) => f.c !== 3], ['423,410 607,410', 2, wr, 'dst'], ['423,132 607,132', 2, all, 'ctl'], ['520,132 520,192', 2, all, 'ctl'],
    ['623,240 650,240', 3, (f) => f.c !== 3], ['650,240 668,240', 3, (f) => f.c <= 1], ['623,320 668,320', 3, (f) => f.c === 1], ['650,240 650,365 797,365', 3, (f) => f.c === 2], ['764,240 797,240', 3, (f) => f.c === 0],
    ['623,87 640,87 640,40 4,40 4,240 18,240', 3, br, 'npc'], ['623,410 797,410', 3, wr, 'dst'], ['623,132 797,132', 3, all, 'ctl'], ['716,132 716,190', 3, (f) => f.c <= 1, 'ctl'],
    ['813,240 850,240', 4, (f) => f.c === 0], ['813,365 832,365 832,300 850,300', 4, (f) => f.c === 2], ['864,270 892,270 892,432 250,432 250,285 262,285', 4, wr],
    ['813,410 876,410 876,446 228,446 228,262 262,262', 4, wr, 'dst'], ['813,132 857,132 857,228', 4, wr, 'ctl']
  ];
  const CR = [
    [0, 70, all], [0, 225, all, 'IR'],
    [1, 70, br], [1, 132, all, null, 'ctl'], [1, 205, all, 'A'], [1, 261, (f) => f.c === 1 || f.aluRt, 'B'], [1, 345, (f) => f.imm != null], [1, 410, wr, null, 'dst'],
    [2, 87, br, 'target'], [2, 132, all, null, 'ctl'], [2, 212, br], [2, 240, (f) => f.c !== 3, 'ALUOut'], [2, 320, (f) => f.c === 1], [2, 410, wr, null, 'dst'],
    [3, 132, wr, null, 'ctl'], [3, 240, (f) => f.c === 0, 'MDR'], [3, 365, (f) => f.c === 2], [3, 410, wr, null, 'dst']
  ];

  function opInfo(I) {
    const m = I.text.match(/^\s*(\w+)\s*(.*)$/);
    const a = (m ? m[2] : '').split(',').map((s) => s.trim()).filter(Boolean);
    const c = vizCls(I);
    const f = { c, op: I.op, text: I.text };
    const mem = (s) => {
      const mm = String(s || '').match(/^(.*)\((.+)\)\s*$/);
      return mm ? [mm[1].trim() || '0', mm[2].trim()] : ['0', s];
    };
    if (c === 0) {
      f.dest = a[0];
      const x = mem(a[1]);
      f.imm = x[0];
      f.rs = x[1];
    } else if (c === 1) {
      f.rt = a[0];
      const x = mem(a[1]);
      f.imm = x[0];
      f.rs = x[1];
    } else if (c === 3) {
      f.rs = a[0];
      f.rt = a[1];
      f.imm = a[2] != null ? a[2] : '';
    } else {
      f.dest = a[0];
      f.rs = a[1];
      if (/^(-?\d|0x)/i.test(a[2] || '')) f.imm = a[2];
      else f.rt = a[2];
    }
    f.useImm = f.imm != null && c !== 3;
    f.aluRt = c === 3 || (c === 2 && f.imm == null);
    f.wr = c === 0 || c === 2;
    return f;
  }

  let mode = $state(untrack(() => opts.mode || 'pipe'));
  let prog = $state(untrack(() => opts.prog || 'l13'));
  let latK = $state(untrack(() => opts.lat || 'l12'));
  let fwd = $state(untrack(() => (opts.fwd != null ? !!opts.fwd : true)));
  let cyc = $state(untrack(() => opts.cyc || 1));
  let autoTimer = $state(0);

  let cvEl = $state(null);
  let stagesEl = $state(null);
  let stripEl = $state(null);

  function stopAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = 0;
    }
  }

  $effect(() => () => stopAuto());

  const M = $derived(vizModel(PROG[prog].code, latK, fwd ? 'fwd' : 'stall'));
  const INF = $derived(M.ins.map(opInfo));
  const total = $derived(mode === 'single' ? M.N : mode === 'multi' ? M.cycM : M.sim.total);
  const tc = $derived(mode === 'single' ? M.tcS : M.tcM);
  const cycClamped = $derived(Math.max(1, Math.min(total, cyc)));

  function act(k, s) {
    const f = INF[k];
    if (s === 0) return 'fetch the instruction · PC + 4';
    if (s === 1) {
      return f.c === 0
        ? `decode · read ${f.rs} · sign-extend ${f.imm}`
        : f.c === 1
          ? `decode · read ${f.rs} and ${f.rt} · sign-extend ${f.imm}`
          : f.c === 3
            ? `decode · read ${f.rs} and ${f.rt}`
            : f.imm != null
              ? `decode · read ${f.rs} · sign-extend ${f.imm}`
              : `decode · read ${f.rs} and ${f.rt}`;
    }
    if (s === 2) {
      return f.c <= 1
        ? `ALU: address = ${f.rs} + ${f.imm}`
        : f.c === 3
          ? `ALU: ${f.rs} − ${f.rt} → Zero? · adder: branch target`
          : `ALU: ${f.rs} ${OPS[f.op] || f.op} ${f.imm != null ? f.imm : f.rt}`;
    }
    if (s === 3) {
      return f.c === 0
        ? 'read data memory at the address'
        : f.c === 1
          ? `write ${f.rt} to data memory`
          : f.c === 3
            ? 'nothing in memory (branch decided: PC ← target if taken)'
            : null;
    }
    return f.c === 0 ? `${f.dest} ← memory data` : f.c === 2 ? `${f.dest} ← ALU result` : null;
  }

  const occData = $derived.by(() => {
    const occ = [null, null, null, null, null];
    const st = ['', '', '', '', ''];
    const flags = {};
    const c = cycClamped;
    if (mode === 'single') {
      const k = c - 1;
      for (let s = 0; s < 5; s++) {
        occ[s] = k;
        st[s] = 'live';
      }
      flags.k = k;
    } else if (mode === 'multi') {
      const I = M.multi.find((x) => c - 1 < x.c0 + x.n);
      const cell = I.cells[c - 1 - I.c0];
      for (let s = 0; s < 5; s++) {
        occ[s] = I.k;
        st[s] = s === cell.s ? 'live' : s < cell.s ? 'held' : 'later';
      }
      flags.k = I.k;
      flags.s = cell.s;
      flags.step = c - I.c0;
      flags.n = I.n;
    } else {
      const rv = Logic.resourceView(M.sim);
      STG.forEach((s, i) => {
        const k = rv[s][c];
        if (k != null) {
          occ[i] = k;
          st[i] = 'live';
        }
      });
      flags.held = {};
      M.sim.rows.forEach((r, i) => {
        const l = Logic.cell(r, c);
        if (l === 'stall' || l === 'IF*') flags.held[i] = l;
      });
      flags.bubble = occ.map((k, s) => k == null && occ.slice(0, s).some((x) => x != null) && occ.slice(s + 1).some((x) => x != null));
    }
    return { occ, st, flags };
  });

  const svgHtml = $derived.by(() => {
    const { occ, st, flags } = occData;
    const ins = M.ins;
    const pipe = mode === 'pipe';
    const col = (k) => IC[k % IC.length];
    const wstate = (s, used) => {
      const k = occ[s];
      if (k == null || !used(INF[k])) return ['idle', ''];
      return [st[s], col(k)];
    };
    let g = `<defs><marker id="${uid}a" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0 L8 4 L0 8z" fill="context-stroke"/></marker></defs>`;
    for (let s = 0; s < 5; s++) {
      const k = occ[s], live = st[s] === 'live', x = BX[s], w = BX[s + 1] - BX[s];
      g += `<rect x="${x}" y="32" width="${w}" height="430" class="d3-band ${live ? 'live' : ''}" style="--ic:${k != null ? col(k) : 'transparent'}"/>`;
      if (mode !== 'single') {
        const bub = pipe && flags.bubble[s], held = pipe && k != null && flags.held[k] && (s === 0 || s === 1);
        g += `<g class="d3-hd ${live ? 'live' : st[s]} ${bub ? 'bub' : ''}" style="--ic:${k != null ? col(k) : 'var(--tn-gutter)'}"><rect x="${x + 3}" y="4" width="${w - 6}" height="24"/><text x="${x + 10}" y="20" class="d3-hs">${STG[s]}</text><text x="${x + w - 9}" y="20" class="d3-hi">${
          bub ? 'bubble (no work)' : k == null ? (mode === 'multi' ? '' : 'empty') : st[s] === 'live' ? `I${k + 1} ${esc(ins[k].op)}${held ? ' · held' : ''}` : st[s] === 'held' ? 'done' : 'not yet'
        }</text></g>`;
      }
    }
    if (mode === 'single') {
      const k = flags.k;
      g += `<g class="d3-hd live" style="--ic:${col(k)}"><rect x="3" y="4" width="994" height="24"/><text x="12" y="20" class="d3-hs">ONE CLOCK CYCLE</text><text x="500" y="20" class="d3-hm">IF → ID → EX → MEM → WB all ripple through before the next edge</text><text x="989" y="20" class="d3-hi">I${k + 1} ${esc(
        ins[k].text.replace(/\s+/g, ' ')
      )}</text></g>`;
    }
    W.forEach((w) => {
      const [cls, c] = wstate(w[1], w[2]);
      g += `<polyline points="${w[0]}" class="d3-halo"/><polyline points="${w[0]}" class="d3-w ${cls} ${w[3] || ''}" style="--ic:${c || 'transparent'}" marker-end="url(#${uid}a)"/>`;
    });
    SX.forEach((x, i) => {
      if (pipe) {
        const k = occ[i + 1];
        g += `<g class="d3-preg ${k != null ? 'full' : ''}" style="--ic:${k != null ? col(k) : 'var(--tn-dark3)'}"><rect x="${x - 8}" y="58" width="16" height="364"/><text transform="translate(${x + 3.5} 168) rotate(-90)" class="d3-pl">${PREG[i]}</text>${
          k != null ? `<text transform="translate(${x + 3.5} 392) rotate(-90)" class="d3-pk">I${k + 1}</text>` : ''
        }</g>`;
      } else {
        g += `<line x1="${x}" x2="${x}" y1="36" y2="456" class="d3-cut"/>`;
      }
    });
    if (!pipe) {
      CR.forEach((c) => {
        const [cls, cc] = wstate(c[0], c[2]), x = SX[c[0]];
        if (mode === 'multi' && c[3]) {
          const has = occ[0] != null && c[2](INF[occ[0]]) && (st[c[0] + 1] === 'live' || st[c[0] + 1] === 'held');
          g += `<g class="d3-mreg ${has ? 'full' : cls === 'live' ? 'load' : ''}" style="--ic:${cc || col(occ[0])}"><rect x="${x - 8}" y="${c[1] - 13}" width="16" height="26"/><text x="${x}" y="${c[1] - 17}" class="d3-ml">${c[3]}</text></g>`;
        } else {
          g += `<line x1="${x - 8}" x2="${x + 8}" y1="${c[1]}" y2="${c[1]}" class="d3-w ${cls} ${c[4] || ''}" style="--ic:${cc || 'transparent'}"/>`;
        }
      });
    }
    const U = (s, used, inner, extra) => {
      const k = occ[s], on = k != null && (!used || used(INF[k]));
      return `<g class="d3-u ${on ? st[s] : 'idle'} ${extra || ''}" style="--ic:${on ? col(k) : 'transparent'}">${inner}</g>`;
    };
    const adder = (x, y) =>
      `<path d="M${x} ${y} L${x + 44} ${y + 16} L${x + 44} ${y + 44} L${x} ${y + 60} L${x} ${y + 36} L${x + 8} ${y + 30} L${x} ${y + 24} Z"/><text x="${x + 26}" y="${y + 34}" class="d3-us">Add</text>`;
    g += U(0, null, `<rect x="18" y="196" width="14" height="58" rx="7"/><text x="22" y="213" class="d3-mn">0</text><text x="22" y="243" class="d3-mn">1</text>`);
    g += U(0, null, `<rect x="44" y="198" width="30" height="54"/><text x="59" y="229" class="d3-ut">PC</text>`);
    g += U(0, null, `<rect x="96" y="180" width="88" height="90"/><text x="140" y="222" class="d3-ut">Instruction</text><text x="140" y="236" class="d3-us">memory</text>`);
    g += U(0, null, adder(104, 80) + `<text x="89" y="131" class="d3-us" text-anchor="end">4</text>`);
    g += U(1, null, `<ellipse cx="310" cy="132" rx="38" ry="17"/><text x="310" y="136" class="d3-ut">Control</text>`, 'ctl');
    g += U(
      1,
      null,
      `<rect x="262" y="180" width="96" height="120"/><text x="312" y="236" class="d3-ut">Registers</text><text x="266" y="203" class="d3-port">rs</text><text x="266" y="228" class="d3-port">rt</text><text x="266" y="265" class="d3-port">write reg</text><text x="266" y="288" class="d3-port">write data</text><text x="354" y="208" class="d3-port" text-anchor="end">data 1</text><text x="354" y="264" class="d3-port" text-anchor="end">data 2</text>`
    );
    {
      const k = occ[4];
      if (k != null && INF[k].wr && st[4] === 'live') {
        g += `<g class="d3-wr" style="--ic:${col(k)}"><rect x="262" y="252" width="5" height="48"/><text x="312" y="253" class="d3-wt">write ${esc(INF[k].dest)} ← I${k + 1}</text></g>`;
      }
    }
    g += U(1, (f) => f.imm != null, `<ellipse cx="310" cy="345" rx="40" ry="14"/><text x="310" y="349" class="d3-us">Sign-extend</text>`);
    g += U(2, null, `<rect x="452" y="250" width="14" height="46" rx="7"/><text x="456" y="264" class="d3-mn">0</text><text x="456" y="289" class="d3-mn">1</text>`);
    g += U(2, null, `<path d="M490 180 L550 205 L550 275 L490 300 L490 250 L500 240 L490 230 Z"/><text x="526" y="244" class="d3-ut">ALU</text>`);
    g += U(2, br, `<ellipse cx="470" cy="104" rx="14" ry="10"/><text x="470" y="107.5" class="d3-us">≪2</text>`) + U(2, br, adder(490, 57));
    g += U(
      3,
      (f) => f.c <= 1,
      `<rect x="668" y="190" width="96" height="150"/><text x="716" y="268" class="d3-ut">Data</text><text x="716" y="282" class="d3-us">memory</text><text x="672" y="243" class="d3-port">address</text><text x="672" y="323" class="d3-port">write data</text><text x="760" y="232" class="d3-port" text-anchor="end">read data</text>`
    );
    g += U(4, wr, `<rect x="850" y="228" width="14" height="84" rx="7"/><text x="854" y="243" class="d3-mn">1</text><text x="854" y="303" class="d3-mn">0</text>`);
    g += `<circle cx="84" cy="225" r="2.2" class="d3-dot"/><circle cx="165" cy="70" r="2.2" class="d3-dot"/><circle cx="432" cy="261" r="2.2" class="d3-dot"/><circle cx="442" cy="285" r="2.2" class="d3-dot"/><circle cx="650" cy="240" r="2.2" class="d3-dot"/>`;
    g += `<text x="88" y="46" class="d3-lab">branch target (if taken)</text><text x="88" y="62" class="d3-lab">PC + 4</text><text x="560" y="208" class="d3-lab">Zero</text><text x="556" y="236" class="d3-lab">result</text><text x="300" y="406" class="d3-lab">destination register number</text><text x="428" y="128" class="d3-lab ctl">control signals</text><text x="560" y="83" class="d3-lab">target</text><text x="898" y="350" class="d3-lab">write-back</text>`;

    if (pipe && M.haz === 'fwd') {
      const ev = (M.sim.events || []).filter((e) => e.kind === 'fwd' && e.cycle === cycClamped);
      const side = (e) => {
        const f = INF[e.i];
        return f.rs && Logic.sameReg(Logic.canonReg(f.rs), e.reg) ? 'a' : 'b';
      };
      const P = {
        'EX/MEM': { a: 'M632 240 L632 158 L476 158 L476 205', b: 'M632 240 L632 158 L476 158 L476 273' },
        'MEM/WB': { a: 'M878 270 L878 148 L470 148 L470 205', b: 'M878 270 L878 148 L470 148 L470 273' }
      };
      g += `<path d="${P['EX/MEM'].a}" class="d3-fwg"/><path d="M476 205 L476 273" class="d3-fwg"/><path d="M878 270 L878 148 L470 148 L470 205" class="d3-fwg"/>`;
      ev.forEach((e) => {
        const sd = side(e), d = P[e.from][sd];
        g += `<text x="${sd === 'a' ? 428 : 470}" y="${sd === 'a' ? 199 : 296}" class="d3-stale">✗ old value</text><path d="${d}" class="d3-fw" marker-end="url(#${uid}a)"/><g class="d3-fwl"><rect x="628" y="164" width="${('forward ' + e.reg + ' from ' + e.from).length * 5.9 + 10}" height="16"/><text x="633" y="176">forward ${esc(e.reg)} from ${e.from}</text></g>`;
      });
    }
    if (pipe) {
      const rf = (M.sim.events || []).filter((e) => e.kind === 'rf' && e.cycle === cycClamped);
      if (rf.length) g += `<text x="310" y="174" class="d3-rf">write 1st half → read 2nd half: ${esc(rf.map((e) => e.reg).join(', '))}</text>`;
    }
    return g;
  });

  const stageCardsHtml = $derived.by(() => {
    const { occ, st, flags } = occData;
    const ins = M.ins, pipe = mode === 'pipe', col = (k) => IC[k % IC.length];
    return STG.map((S, s) => {
      const k = occ[s], a = k != null ? act(k, s) : null, live = st[s] === 'live', bub = pipe && flags.bubble[s];
      const body = bub
        ? '<span class="d3-no">bubble — the stalled instruction left a gap</span>'
        : k == null
          ? '<span class="d3-no">empty</span>'
          : !live
            ? `<span class="d3-no">${st[s] === 'held' ? '✓ done' : 'not yet'}${a ? ' · ' + esc(a) : ' · (step not used)'}</span>`
            : a == null
              ? `<span class="d3-no">${pipe ? 'passes through, nothing to do (keeps every instruction in step)' : 'not used by this instruction'}</span>`
              : esc(a);
      let extra = '';
      if (pipe && k != null) {
        const evs = M.sim.events || [];
        if (s === 2) evs.filter((e) => e.kind === 'fwd' && e.cycle === cycClamped && e.i === k).forEach((e) => { extra += `<div class="d3-ex fw">⤷ ${esc(e.reg)} forwarded from ${e.from} (I${e.p + 1})</div>`; });
        if (s === 1 && flags.held[k] === 'stall') {
          const d = evs.find((e) => e.kind === 'data' && e.i === k);
          extra += `<div class="d3-ex st">held: waiting for ${d ? esc(d.reg) + ' from I' + (d.p + 1) : 'an earlier result'} — a bubble goes down the pipeline instead</div>`;
        }
        if (s === 0 && flags.held[k]) extra += `<div class="d3-ex st">held: the instruction ahead is stuck in ID</div>`;
        if (s === 1) evs.filter((e) => e.kind === 'rf' && e.cycle === cycClamped && e.i === k).forEach((e) => { extra += `<div class="d3-ex rf">${esc(e.reg)}: written by I${e.p + 1} in the first half of this cycle, read here in the second</div>`; });
      }
      return `<div class="d3-sc ${live && k != null ? 'live' : ''}" style="--ic:${k != null ? col(k) : 'var(--tn-gutter)'}"><div class="d3-sh"><span class="stg ${S.toLowerCase()}">${S}</span>${
        k != null && live ? `<b>I${k + 1}</b><code class="asm">${vizH(ins[k].text.replace(/\s+/g, ' '))}</code>` : ''
      }</div><div class="d3-sb">${body}</div>${extra}</div>`;
    }).join('');
  });

  const stripHtml = $derived.by(() => {
    const ins = M.ins, pipe = mode === 'pipe', col = (k) => IC[k % IC.length];
    if (pipe) return pipeSVG(ins, M.sim, { asm: pdText, cyc: cycClamped, id: uid, lw: 168, cw: 46 });
    const cells =
      mode === 'single'
        ? M.single.map((I) => ({ k: I.k, lab: STG.filter((_, s) => M.rows[M.cl[I.k]][s] != null), w: 5 }))
        : M.multi.flatMap((I) => I.cells.map((c) => ({ k: I.k, lab: [STG[c.s]], w: 1 })));
    return `<div class="d3-seq ${mode}">${cells
      .map(
        (c, i) =>
          `<button type="button" class="d3-cell ${i + 1 === cycClamped ? 'now' : i + 1 < cycClamped ? 'past' : ''}" data-go="${i + 1}" style="--ic:${col(c.k)};flex-grow:${
            c.w
          }" title="cycle ${i + 1}"><span class="d3-ci">${i + 1}</span><span class="d3-cn">I${c.k + 1} ${esc(ins[c.k].op)}</span><span class="d3-cs">${c.lab
            .map((l) => `<i class="stg ${l.toLowerCase()}">${l}</i>`)
            .join('')}</span></button>`
      )
      .join('')}</div>`;
  });

  const modeTabs = $derived.by(() => {
    const u = M.unit;
    const d = {
      single: [M.tcS, M.N, M.TS, 'no internal registers'],
      multi: [M.tcM, M.cycM, M.TM, '+ IR, A, B, ALUOut, MDR'],
      pipe: [M.tcM, M.sim.total, M.TP, '+ 4 pipeline registers']
    };
    const best = Math.min(M.TS, M.TM, M.TP);
    return MODES.map(([id, label]) => ({ id, label, vals: d[id], u, win: d[id][2] === best }));
  });

  const whatMainHtml = $derived.by(() => {
    const u = M.unit, F = vizF, { occ, flags } = occData;
    if (mode === 'single') {
      return `<b>Single-cycle.</b> No registers inside the datapath: the instruction’s signals ripple through all five parts and the PC, register file and memory are written once, at the clock edge that ends the cycle. So the clock must be as long as the slowest instruction: <b>${F(M.tcS)} ${u}</b> (${CNAME[M.worst]}). Hardware in use: the units this one instruction needs, for one long cycle.`;
    }
    if (mode === 'multi') {
      return `<b>Multi-cycle.</b> Added: the registers <b>IR, A, B, ALUOut, MDR</b> (they keep each step’s result for the next cycle) and a control unit that is now a state machine. One step per short cycle of <b>${F(M.tcM)} ${u}</b>; this instruction uses ${flags.n || ''} of them. But only <b>one</b> stage works at a time — the other four are idle (limited concurrency, L11 s10).`;
    }
    return `<b>Pipelined.</b> Added: four full <b>pipeline registers</b>. Each carries everything its instruction still needs — data, the control bits and the destination register number — so five different instructions can use the five stages at once. Same short clock (<b>${F(M.tcM)} ${u}</b>); stages busy this cycle: <b>${occ.filter((k) => k != null).length} of 5</b>.`;
  });

  $effect(() => {
    void occData;
    void mode;
    if (cvEl && cvEl.scrollWidth > cvEl.clientWidth + 4) {
      const live = occData.st.map((s, i) => (s === 'live' ? i : -1)).filter((i) => i >= 0);
      const mid = live.length && mode !== 'single' ? live.reduce((a, i) => a + (BX[i] + BX[i + 1]) / 2, 0) / live.length : 500;
      cvEl.scrollTo({ left: Math.max(0, (mid / 1000) * cvEl.scrollWidth - cvEl.clientWidth / 2), behavior: 'smooth' });
    }
  });

  $effect(() => {
    void stageCardsHtml;
    if (stagesEl) {
      stagesEl.innerHTML = stageCardsHtml;
      decorateHL(stagesEl);
    }
  });

  $effect(() => {
    void stripHtml;
    if (stripEl) {
      if (mode === 'pipe') snugScroll(stripEl);
      const nowc = stripEl.querySelector('.d3-cell.now');
      if (nowc) stripEl.scrollLeft = Math.max(0, nowc.offsetLeft - stripEl.clientWidth / 2 + nowc.offsetWidth / 2);
    }
  });

  function toggleAuto() {
    if (autoTimer) {
      stopAuto();
      return;
    }
    if (cycClamped >= total) cyc = 1;
    autoTimer = setInterval(() => {
      if (cyc >= total) {
        stopAuto();
        return;
      }
      cyc++;
    }, 1100);
  }
</script>

<ToolShell
  title="One datapath, three clocks"
  sub="single-cycle → multi-cycle → pipelined: what is added, and what each clock tick does"
>
  <div class="vz d3">
    <div class="d3-modes" role="tablist">
      {#each modeTabs as mt}
        <button
          type="button"
          role="tab"
          aria-selected={mt.id === mode}
          class:win={mt.win}
          onclick={() => {
            stopAuto();
            mode = mt.id;
            cyc = 1;
          }}
        >
          <span class="d3-mt">{mt.label}</span>
          <span class="d3-mh">{mt.vals[3]}</span>
          <span class="d3-mv"><b>{vizF(mt.vals[0])}</b> {mt.u} clock × <b>{mt.vals[1]}</b> cycles = <b>{vizF(mt.vals[2])}</b> {mt.u}</span>
        </button>
      {/each}
    </div>

    <div class="ps-bar">
      <label class="mp-pick">
        <span>Program</span>
        <select bind:value={prog} onchange={() => { stopAuto(); cyc = 1; }}>
          {#each Object.keys(PROG) as k}
            <option value={k}>{PROG[k].name}</option>
          {/each}
        </select>
      </label>
      <label class="mp-pick">
        <span>Delays</span>
        <select bind:value={latK} onchange={() => { stopAuto(); cyc = 1; }}>
          {#each Object.keys(LAT) as k}
            <option value={k}>{LAT[k].name}</option>
          {/each}
        </select>
      </label>
      <span class="d3-fw" hidden={mode !== 'pipe'}>
        <div class="ps-tg">
          <span>Forwarding</span>
          <div class="seg mini">
            <button type="button" aria-pressed={!fwd} onclick={() => { stopAuto(); fwd = false; }}>off</button>
            <button type="button" aria-pressed={fwd} onclick={() => { stopAuto(); fwd = true; }}>on</button>
          </div>
        </div>
      </span>
    </div>

    <div class="d3-ctl">
      <button type="button" class="mbtn" aria-label="first cycle" disabled={cycClamped <= 1} onclick={() => { stopAuto(); cyc = 1; }}>⏮</button>
      <button type="button" class="mbtn" disabled={cycClamped <= 1} onclick={() => { stopAuto(); cyc = Math.max(1, cycClamped - 1); }}>◀ back</button>
      <button type="button" class="mbtn go" disabled={cycClamped >= total} onclick={() => { stopAuto(); cyc = Math.min(total, cycClamped + 1); }}>clock tick ▶</button>
      <button type="button" class="mbtn" onclick={toggleAuto}>{autoTimer ? '❚❚ pause' : '▶ auto'}</button>
      <input
        type="range"
        min="1"
        max={total}
        step="1"
        value={cycClamped}
        aria-label="clock cycle"
        oninput={(e) => {
          stopAuto();
          cyc = Number(e.currentTarget.value);
        }}
      />
      <span class="d3-clk">
        cycle <b>{cycClamped}</b>/{total} · t = {vizF((cycClamped - 1) * tc)}–<b>{vizF(cycClamped * tc)}</b> {M.unit}
      </span>
    </div>

    <div class="dp-hint">Swipe the diagram sideways on a small screen.</div>
    <div class="vz-canvas d3-canvas" bind:this={cvEl}>
      <svg viewBox="0 0 1000 462" class="d3-svg" role="img" aria-label="datapath">
        {@html svgHtml}
      </svg>
    </div>

    <div class="vz-leg d3-leg">
      <span class="lg-live"><i></i>data moving this cycle (colour = which instruction)</span>
      <span class="lg-ctl"><i></i>control bits · destination register number</span>
      <span class="lg-fwd"><i></i>forwarding path</span>
      <span class="lg-off"><i></i>not used</span>
    </div>

    <div class="d3-stages" bind:this={stagesEl}></div>

    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div
      class="d3-strip"
      bind:this={stripEl}
      onclick={(e) => {
        const gq = e.target.closest('[data-go]');
        if (gq) {
          stopAuto();
          cyc = +gq.dataset.go;
        }
      }}
    >
      {@html stripHtml}
    </div>

    <div class="d3-what">
      <div class="vz-note">{@html whatMainHtml}</div>
      <div class="vz-note sm">
        The same five-step layout is kept in all three views so you can see what changes. A real multi-cycle design can also save hardware by sharing one ALU and one memory between steps (L11 s8). The pipelined view decides branches in MEM, as in the basic P&amp;H datapath; branch penalties are a Test 2 topic.
      </div>
    </div>
  </div>
</ToolShell>
