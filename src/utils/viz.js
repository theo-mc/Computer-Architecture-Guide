import { Logic } from './logic.js';
import { esc } from './html.js';
import { asm as asmHL } from './hl.js';

export const STG = ['IF', 'ID', 'EX', 'MEM', 'WB'];
export const SC = {
  IF: 'var(--st-if)',
  ID: 'var(--st-id)',
  EX: 'var(--st-ex)',
  MEM: 'var(--st-mem)',
  WB: 'var(--st-wb)'
};
export const SNAME = { IF: 'fetch', ID: 'decode', EX: 'execute', MEM: 'memory', WB: 'write back' };
export const IC = [
  'var(--tn-blue)',
  'var(--tn-magenta)',
  'var(--tn-green)',
  'var(--tn-orange)',
  'var(--tn-cyan)',
  'var(--tn-yellow)',
  'var(--tn-red)',
  'var(--tn-teal)'
];

export const vizH = (s) => asmHL(s);
export const uid = (p = 'vz') => p + Math.random().toString(36).slice(2, 7);
export const vizCls = (I) =>
  I.isLoad ? 0 : I.isStore ? 1 : I.isBranch || /^(j|jal|jr|beq|bne)$/.test(I.op) ? 3 : 2;
export const CNAME = ['load', 'store', 'ALU', 'branch'];
export const USES = [
  [1, 1, 1, 1, 1],
  [1, 1, 1, 1, 0],
  [1, 1, 1, 0, 1],
  [1, 1, 1, 0, 0]
];

export const LAT = {
  l12: {
    name: 'L12 s16 / R1 s21 — 200 · 100 · 200 · 200 · 100 ps',
    unit: 'ps',
    rows: [
      [200, 100, 200, 200, 100],
      [200, 100, 200, 200, null],
      [200, 100, 200, null, 100],
      [200, 100, 200, null, null]
    ]
  },
  l10: {
    name: 'L10 s16 — memory 200, ALU 100, register file 50 ps',
    unit: 'ps',
    rows: [
      [200, 50, 100, 200, 50],
      [200, 50, 100, 200, null],
      [200, 50, 100, null, 50],
      [200, 50, 100, null, null]
    ]
  },
  ps2: {
    name: 'PS2 Q5 — per-class latencies (ns)',
    unit: 'ns',
    rows: [
      [2, 2, 2, 2, 4],
      [2, 2, 4, 5, null],
      [2, 2, 6, null, 4],
      [2, 2, 2, null, null]
    ]
  },
  bal: {
    name: 'Perfectly balanced — 200 ps every step',
    unit: 'ps',
    rows: [
      [200, 200, 200, 200, 200],
      [200, 200, 200, 200, null],
      [200, 200, 200, null, 200],
      [200, 200, 200, null, null]
    ]
  }
};

export const PROG = {
  l13: {
    name: 'Five independent instructions (L13 s8)',
    code: 'lw  $10, 20($1)\nsub $11, $2, $3\nadd $12, $3, $4\nlw  $13, 24($1)\nadd $14, $5, $6'
  },
  mix: {
    name: 'One of each class: lw, add, sw, beq',
    code: 'lw  $t0, 0($s1)\nadd $t1, $s2, $s3\nsw  $t1, 4($s1)\nbeq $s4, $s5, 2'
  },
  l15: {
    name: 'sub then four users of $2 (L15 s4)',
    code: 'sub $2, $1, $3\nand $12, $2, $5\nor  $13, $6, $2\nadd $14, $2, $2\nsw  $15, 100($2)'
  },
  l16: {
    name: 'Load-use (L16 s11)',
    code: 'lw  $2, 20($1)\nand $4, $2, $5\nor  $8, $2, $6\nadd $9, $4, $2\nslt $1, $6, $7'
  },
  pt: {
    name: 'Practice Test Q4',
    code: 'lw  $t5, -16($t4)\nsw  $t1, -12($t5)\nadd $t4, $t5, $t1\nlw  $t3, -12($s1)\nsub $t2, $t3, $t1'
  },
  ps3: {
    name: 'PS3 Q4',
    code: 'lw  $s0, -12($t1)\nadd $t0, $s1, $s0\nxor $t2, $s2, $s1\nsub $s3, $t3, $t1'
  },
  r1: {
    name: 'Loop body (R1 s29)',
    code: 'lw   $t0, 0($s1)\naddu $t0, $t0, $s2\nsw   $t2, 0($s1)\naddi $s1, $s1, -4'
  },
  adds: {
    name: 'Four independent adds (L11 s13)',
    code: 'add $t0, $s0, $s1\nadd $t1, $s2, $s3\nadd $t2, $s4, $s5\nadd $t3, $s6, $s7'
  }
};

export function vizModel(code, latKey, haz) {
  const pp = Logic.parsePipeProgram(code);
  const ins = pp.instrs.slice(0, 8);
  const lat = LAT[latKey] || LAT.l12;
  const rows = lat.rows;
  const N = ins.length;
  const cl = ins.map(vizCls);
  const sum = (r) => r.reduce((a, c) => a + (c || 0), 0);
  const tcS = Math.max(...rows.map(sum));
  const worst = rows.findIndex((r) => sum(r) === tcS);
  const tcM = Math.max(...rows.flatMap((r) => r.filter((x) => x != null)));

  const single = ins.map((_, k) => {
    let t = k * tcS;
    const seg = [];
    rows[cl[k]].forEach((d, s) => {
      if (d != null) {
        seg.push({ s, t0: t, t1: t + d });
        t += d;
      }
    });
    return { k, t0: k * tcS, t1: (k + 1) * tcS, seg, work: t - k * tcS };
  });

  const multi = [];
  let cyc = 0;
  ins.forEach((_, k) => {
    const first = cyc;
    const cells = [];
    rows[cl[k]].forEach((d, s) => {
      if (d != null) {
        cells.push({ s, c: cyc, d });
        cyc++;
      }
    });
    multi.push({ k, c0: first, n: cells.length, cells });
  });
  const cycM = cyc;

  const pins = haz === 'ideal' ? ins.map((I) => Object.assign({}, I, { srcs: [] })) : ins;
  const sim = Logic.simulate(pins, { fwd: haz === 'fwd' });

  return {
    ins,
    N,
    cl,
    lat,
    rows,
    unit: lat.unit,
    tcS,
    tcM,
    worst,
    single,
    multi,
    cycM,
    sim,
    TS: N * tcS,
    TM: cycM * tcM,
    TP: sim.total * tcM,
    errors: pp.errors,
    haz
  };
}

export const vizF = (x) => String(Math.round(x * 1000) / 1000);

export function mapSVG() {
  const COL = [
    {
      x: 20,
      k: 'i1',
      term: 'IC',
      sub: 'instructions executed',
      who: 'set by the program, compiler and ISA',
      nodes: [
        ['isa1', '06', 'MIPS: registers & memory', 'RISC: few simple instructions, lw / sw'],
        ['encoding', '07', 'R, I and J formats', 'every instruction is one 32-bit word'],
        ['isa2', '08', 'Branches & procedures', 'beq / bne, jal, the stack'],
        ['translate', '09', 'Compile, assemble, link, load', 'the same C gives a different IC on each ISA'],
        ['vonneumann', '02', 'ISA vs microarchitecture', 'the ISA is the contract: what, not how'],
        ['arch', '01', 'Great ideas & the walls', 'why the ISA stays put while hardware changes']
      ]
    },
    {
      x: 340,
      k: 'i2',
      term: 'CPI',
      sub: 'cycles per instruction',
      who: 'set by the design and the hazards',
      nodes: [
        ['single', '13', 'Single-cycle', 'CPI = 1, but a long clock'],
        ['multi', '14', 'Multi-cycle', 'CPI = Σ mix × steps|(lw 5, sw 4, R 4, beq 3 cycles)'],
        ['pipe', '15', 'Pipelined', 'cycles = 5 + (N − 1), so CPI → 1'],
        ['hazards', '16', 'Hazards → stalls', 'CPI = 1 + Σ fraction × penalty'],
        ['datahaz', '17', 'RAW dependencies', 'no forwarding: 3 − distance stall cycles'],
        ['forward', '18', 'Forwarding & reordering', 'only load-use still stalls (1 cycle)']
      ]
    },
    {
      x: 660,
      k: 'i3',
      term: 'T\u2009c',
      sub: 'clock period = 1 / rate',
      who: 'set by the slowest path and the technology',
      nodes: [
        ['uarch', '12', 'State, logic and the clock', 'clock ≥ the longest combinational path'],
        ['single', '13', 'Single-cycle clock', '= the slowest instruction (sum of its parts)'],
        ['multi', '14', 'Multi-cycle clock', '= the slowest single step'],
        ['pipe', '15', 'Pipeline clock & depth', 'T/k + S: register delay limits the gain'],
        ['arch', '01', 'The power wall', 'P = C × V² × f stops the clock rising'],
        ['perf', '03', 'Clock period and rate', 'T = 1 / f, with the unit prefixes']
      ]
    }
  ];
  const NW = 300,
    NH = 50,
    GAP = 8,
    Y0 = 158,
    CPC = 6.15;
  const wrap = (t, n) => {
    if (t.indexOf('|') >= 0) return t.split('|');
    if (t.length <= n) return [t];
    const w = t.split(' ');
    let best = null;
    for (let i = 1; i < w.length; i++) {
      const l1 = w.slice(0, i).join(' '),
        l2 = w.slice(i).join(' '),
        d = Math.max(l1.length, l2.length);
      if (!best || d < best.d) best = { d, L: [l1, l2] };
    }
    return best.L;
  };
  let g = `<text x="500" y="24" class="mm-h">CPU time  =  instructions  ×  cycles per instruction  ×  seconds per cycle</text>`;
  g += `<a href="#cpuperf" class="mm-n bar"><rect x="20" y="36" width="960" height="22" /><text x="500" y="51" class="mm-bt">Topic 04, the iron law: every Test 1 calculation changes one of these three terms</text></a>`;
  COL.forEach((c) => {
    const cx = c.x + NW / 2;
    g += `<g class="mm-col ${c.k}"><rect x="${c.x}" y="70" width="${NW}" height="72" class="mm-term"/><text x="${cx}" y="106" class="mm-tt">${
      c.term === 'T\u2009c' ? 'T<tspan dy="6" font-size="17">c</tspan>' : c.term
    }</text><text x="${cx}" y="123" class="mm-ts">${c.sub}</text><text x="${cx}" y="136" class="mm-tw">${c.who}</text>`;
    g += `<line x1="${c.x + 12}" x2="${c.x + 12}" y1="142" y2="${Y0 + (c.nodes.length - 1) * (NH + GAP) + NH / 2}" class="mm-sp"/>`;
    c.nodes.forEach((n, i) => {
      const y = Y0 + i * (NH + GAP),
        bx = c.x + 26,
        bw = NW - 26,
        bc = bx + bw / 2;
      const sub = wrap(n[3], 41);
      g += `<line x1="${c.x + 12}" x2="${bx}" y1="${y + NH / 2}" y2="${y + NH / 2}" class="mm-sp"/><a href="#${n[0]}" class="mm-n"><rect x="${bx}" y="${y}" width="${bw}" height="${NH}"/><text x="${bc}" y="${
        y + 19
      }" class="mm-nt">${esc(n[2])}</text>${sub
        .map((l, j) => `<text x="${bc}" y="${y + 33 + j * 11}" class="mm-nf">${esc(l)}</text>`)
        .join('')}<text x="${bx + 6}" y="${y + 12}" class="mm-nn">${n[1]}</text></a>`;
    });
    g += '</g>';
  });
  const yB = Y0 + 6 * (NH + GAP) + 26;
  const wide = (x, w, id, num, t, f) => {
    const bc = x + w / 2,
      sub = wrap(f, Math.floor((w - 16) / CPC));
    return `<a href="#${id}" class="mm-n w"><rect x="${x}" y="${yB}" width="${w}" height="${NH}"/><text x="${bc}" y="${
      yB + 19
    }" class="mm-nt">${esc(t)}</text>${sub
      .map((l, j) => `<text x="${bc}" y="${yB + 33 + j * 11}" class="mm-nf">${esc(l)}</text>`)
      .join('')}<text x="${x + 6}" y="${yB + 12}" class="mm-nn">${num}</text></a>`;
  };
  g += `<line x1="20" x2="980" y1="${yB - 18}" y2="${yB - 18}" class="mm-rule"/><text x="500" y="${yB - 5}" class="mm-sec">the tools that sit underneath all three terms</text>`;
  const w4 = (960 - 3 * 12) / 4;
  [
    ['perf', '03', 'Performance = 1 / time', 'n = T(slow) ÷ T(fast), and % change'],
    ['amdahl', '05', 'Amdahl’s law', '1 ÷ ((1 − f) + f/s), limit 1 ÷ (1 − f)'],
    ['binary', '10', 'Binary & two’s complement', 'carry vs overflow, sign extension'],
    ['float', '11', 'IEEE 754 floating point', '(−1)^S × 1.F × 2^(E − 127)']
  ].forEach((x, i) => {
    g += wide(20 + i * (w4 + 12), w4, x[0], x[1], x[2], x[3]);
  });
  return `<svg viewBox="0 0 1000 ${yB + NH + 12}" class="mm-svg" role="img" aria-label="map of the Test 1 topics">${g}</svg>`;
}
