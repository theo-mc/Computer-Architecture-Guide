<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import { Logic } from '$utils/logic.js';
  import { esc } from '$utils/html.js';
  import { decorate as decorateHL } from '$utils/hl.js';
  import { STG, vizModel, vizF, vizH } from '$utils/viz.js';

  let { opts = {} } = $props();

  const EX = {
    arr: {
      name: 'A[12] = h + A[8];',
      c: 'A[12] = h + A[8];',
      map: [['h', '$s2'], ['base of A', '$s3']],
      asm: [
        ['lw  $t0, 32($s3)', 'load A[8]: element 8 is 8 × 4 = 32 bytes from the base'],
        ['add $t0, $s2, $t0', 'h + A[8]'],
        ['sw  $t0, 48($s3)', 'store into A[12]: 12 × 4 = 48']
      ],
      ref: 'L05 s19'
    },
    fgh: {
      name: 'f = (g + h) - (i + j);',
      c: 'f = (g + h) - (i + j);',
      map: [['f', '$s0'], ['g', '$s1'], ['h', '$s2'], ['i', '$s3'], ['j', '$s4']],
      asm: [
        ['add $t0, $s1, $s2', 't0 = g + h'],
        ['add $t1, $s3, $s4', 't1 = i + j'],
        ['sub $s0, $t0, $t1', 'f = t0 − t1']
      ],
      ref: 'L05 s9'
    },
    swap: {
      name: 'swap v[k] and v[k+1]',
      c: 'temp = v[k];\nv[k] = v[k+1];\nv[k+1] = temp;',
      map: [['v', '$a0'], ['k', '$a1'], ['temp', '$t0']],
      asm: [
        ['sll $t1, $a1, 2', 't1 = k × 4 (byte offset)'],
        ['add $t1, $a0, $t1', 't1 = address of v[k]'],
        ['lw  $t0, 0($t1)', 'temp = v[k]'],
        ['lw  $t2, 4($t1)', 't2 = v[k+1]'],
        ['sw  $t2, 0($t1)', 'v[k] = t2'],
        ['sw  $t0, 4($t1)', 'v[k+1] = temp']
      ],
      ref: 'L07 s9–s10'
    }
  };

  const FC = {
    op: 'var(--tn-magenta)',
    rs: 'var(--tn-blue)',
    rt: 'var(--tn-green)',
    rd: 'var(--tn-orange)',
    shamt: 'var(--tn-dark5)',
    funct: 'var(--tn-yellow)',
    immediate: 'var(--tn-cyan)',
    address: 'var(--tn-cyan)'
  };

  let ex = $state(untrack(() => opts.ex || 'arr'));
  let sel = $state(0);
  let haz = $state('fwd');
  let stackEl = $state(null);

  const reg = (n) => Logic.REGNAMES[n];

  function uses(a, I, c) {
    const f = {};
    a.fields.forEach((x) => (f[x.name] = x));
    const R = (n) => `<span class="tk-reg">${reg(n)}</span>`;
    const rows = [];
    if (a.format === 'R') {
      const sh = /^s(ll|rl|ra)$/.test(I.op);
      rows.push(['op', '0 = “R-format, look at funct”', 'Control unit → RegDst = 1, ALUSrc = 0, RegWrite = 1, ALUOp = 10', 'ID']);
      rows.push(['rs', sh ? 'unused by a shift (0)' : R(f.rs.value), sh ? '—' : 'register file, read register 1 → ALU top input', sh ? '' : 'ID → EX']);
      rows.push(['rt', R(f.rt.value), 'register file, read register 2 → ALU bottom input (ALUSrc = 0)', 'ID → EX']);
      rows.push(['rd', R(f.rd.value), 'write register (RegDst = 1) — the number travels along and is used last', 'WB']);
      rows.push(['shamt', sh ? 'shift by ' + f.shamt.value : '0 (not a shift)', sh ? 'shift amount for the ALU' : '—', sh ? 'EX' : '']);
      rows.push(['funct', f.funct.value + ' = ' + I.op, 'ALU control → the 4-bit ALU operation', 'EX']);
    } else {
      const ld = c === 0,
        st = c === 1;
      rows.push([
        'op',
        f.op.value + ' = ' + I.op,
        'Control unit → ' +
          (ld
            ? 'ALUSrc = 1, MemRead = 1, MemtoReg = 1, RegWrite = 1'
            : st
              ? 'ALUSrc = 1, MemWrite = 1, RegWrite = 0'
              : c === 3
                ? 'Branch = 1, ALUOp = 01, RegWrite = 0'
                : 'ALUSrc = 1, RegWrite = 1, RegDst = 0'),
        'ID'
      ]);
      rows.push(['rs', R(f.rs.value) + (ld || st ? ' (base)' : ''), 'register file, read register 1 → ALU top input', 'ID → EX']);
      rows.push([
        'rt',
        R(f.rt.value),
        ld
          ? 'write register (RegDst = 0): where the loaded word goes'
          : st
            ? 'read register 2 → data memory “write data” (goes round the ALU)'
            : c === 3
              ? 'read register 2 → ALU bottom input (compare)'
              : 'write register (RegDst = 0)',
        ld ? 'WB' : st ? 'ID → MEM' : c === 3 ? 'ID → EX' : 'WB'
      ]);
      rows.push([
        'immediate',
        String(f.immediate.signedValue != null ? f.immediate.signedValue : f.immediate.value),
        c === 3 ? 'sign-extend → shift left 2 → branch-target adder' : 'sign-extend to 32 bits → ALU bottom input (ALUSrc = 1)',
        'ID → EX'
      ]);
    }
    return rows;
  }

  function acts(I, c) {
    const m = I.text.match(/\(([^)]+)\)/);
    const base = m ? m[1] : '';
    return [
      ['IF', 'fetch the 32-bit word from instruction memory; PC + 4'],
      ['ID', 'control decodes the opcode; register file reads; immediate sign-extended'],
      ['EX', c <= 1 ? `ALU adds ${base} + offset → the memory address` : `ALU computes the ${I.op.trim()}`],
      ['MEM', c === 0 ? 'data memory is read at that address' : c === 1 ? 'data memory is written at that address' : null],
      ['WB', c === 0 ? `the loaded word is written to ${I.dst}` : c === 2 ? `the result is written to ${I.dst}` : null]
    ];
  }

  const stackHtml = $derived.by(() => {
    const E = EX[ex];
    const code = E.asm.map((x) => x[0]).join('\n');
    const M = vizModel(code, 'l12', haz);
    const I = M.ins[sel];
    const c = M.cl[sel];
    const a = Logic.assemble(E.asm[sel][0], { pc: Logic.TEXT_BASE + 4 * sel });
    const d = Logic.deps(M.ins);
    const F = vizF;
    const T = Math.max(M.TS, M.TM, M.TP);
    const layer = (n, name, links, body) =>
      `<section class="ol-l"><div class="ol-rail"><span class="ol-n">${n}</span><span class="ol-name">${name}</span>${links
        .map((l) => `<a href="#${l[0]}">${l[1]}</a>`)
        .join('')}</div><div class="ol-body">${body}</div></section>`;

    let h = '';
    h += layer(
      1,
      'C source',
      [['translate', 'topic 09']],
      `<pre class="ol-c">${esc(E.c)}</pre><div class="ol-map">the compiler has put ${E.map
        .map((m) => `<span><i>${esc(m[0])}</i> in <span class="tk-reg">${m[1]}</span></span>`)
        .join(' · ')} <span class="ref">${E.ref}</span></div>`
    );
    h += layer(
      2,
      'MIPS assembly',
      [['isa1', 'topic 06'], ['isa2', '08']],
      `<div class="ol-asm">${E.asm
        .map(
          (x, i) =>
            `<button type="button" class="ol-ins ${i === sel ? 'on' : ''}" data-i="${i}"><span class="ol-in">I${i + 1}</span><code class="asm">${vizH(
              x[0]
            )}</code><span class="ol-cm"># ${esc(x[1])}</span></button>`
        )
        .join('')}</div><div class="ref">the compiler turned one statement into ${E.asm.length} instructions (the instruction count, IC) — click one to follow it down</div>`
    );

    let bits = '';
    let pos = 31;
    const word = a.word >>> 0;
    a.fields.forEach((f) => {
      const v = f.value >>> 0;
      const bs = v.toString(2).padStart(f.width, '0').slice(-f.width);
      bits += `<div class="ol-f" style="--fc:${FC[f.name] || 'var(--tn-dark5)'};flex-grow:${f.width}"><div class="ol-fn">${
        f.name === 'immediate' ? 'immediate' : f.name
      }</div><div class="ol-fb">${bs}</div><div class="ol-fr">${pos}–${pos - f.width + 1}</div></div>`;
      pos -= f.width;
    });
    h += layer(
      3,
      'Machine code',
      [['encoding', 'topic 07']],
      `<div class="ol-word"><code class="asm">${vizH(E.asm[sel][0])}</code> <span class="ref">→ ${a.format}-format →</span> <b class="tk-hex">0x${word
        .toString(16)
        .toUpperCase()
        .padStart(8, '0')}</b></div><div class="ol-bits">${bits}</div>`
    );

    h += layer(
      4,
      'In the datapath',
      [['single', 'topic 13'], ['lab-datapath', 'datapath lab']],
      `<div class="tbl-wrap"><table class="t nodeco ol-t"><thead><tr><th>Field</th><th>Holds</th><th>Feeds</th><th>Stage</th></tr></thead><tbody>${uses(
        a,
        I,
        c
      )
        .map(
          (r) =>
            `<tr><td><b style="color:${FC[r[0]]}">${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]
              .split(' → ')
              .filter(Boolean)
              .map((s) => `<span class="stg ${s.toLowerCase()}">${s}</span>`)
              .join(' → ')}</td></tr>`
        )
        .join('')}</tbody></table></div>
      <div class="ol-st">${acts(I, c)
        .map(
          (x) =>
            `<div class="${x[1] ? '' : 'off'}"><span class="stg ${x[0].toLowerCase()}">${x[0]}</span><span>${
              x[1] ? esc(x[1]) : 'nothing to do'
            }</span><i>${M.rows[c][STG.indexOf(x[0])] != null ? M.rows[c][STG.indexOf(x[0])] + ' ps' : '—'}</i></div>`
        )
        .join('')}</div>
      <div class="ref">delays from L12 s16 · this instruction needs ${M.rows[c].reduce((s, x) => s + (x || 0), 0)} ps of real work and uses ${
        M.rows[c].filter((x) => x != null).length
      } of the 5 steps</div>`
    );

    const bar = (name, T1, f, cls) =>
      `<div class="ol-bar ${T1 === Math.min(M.TS, M.TM, M.TP) ? 'win' : ''}"><span class="ol-bn">${name}</span><span class="ol-bt"><i style="width:${
        (100 * T1) / T
      }%" class="${cls}"></i></span><span class="ol-bv"><b>${F(T1)}</b> ps</span><span class="ol-bf">${f}</span></div>`;
    const dl = d.raw.length
      ? d.raw
          .map((x) => `I${x.i + 1} → I${x.j + 1} on <span class="tk-reg">${esc(x.reg)}</span> (distance ${x.dist}${x.load ? ', producer is a load' : ''})`)
          .join(' · ')
      : 'none';
    h += layer(
      5,
      'On the clock',
      [['multi', 'topic 14'], ['pipe', '15'], ['forward', '18'], ['lab-three-cpus', 'race lab']],
      `<div class="ps-bar"><div class="ps-tg"><span>Pipeline</span><div class="seg mini"><button type="button" data-haz="stall" aria-pressed="${
        haz === 'stall'
      }">no forwarding</button><button type="button" data-haz="fwd" aria-pressed="${
        haz === 'fwd'
      }">forwarding</button></div></div><span class="ref">RAW dependencies: ${dl}</span></div>
      ${bar('single-cycle', M.TS, `${M.N} × 1 × ${M.tcS}`, 'a')}${bar(
        'multi-cycle',
        M.TM,
        `${M.multi.map((x) => x.n).join(' + ')} = ${M.cycM} cycles × ${M.tcM}`,
        'b'
      )}${bar(
        'pipelined',
        M.TP,
        `(5 + ${M.N - 1}${M.sim.stalls ? ' + ' + M.sim.stalls + ' stall' + (M.sim.stalls > 1 ? 's' : '') : ''}) = ${M.sim.total} cycles × ${M.tcM}`,
        'c'
      )}`
    );

    h += layer(
      6,
      'CPU time',
      [['cpuperf', 'topic 04']],
      `<div class="ol-iron"><span>CPU time</span> = <span class="i1">IC</span> × <span class="i2">CPI</span> × <span class="i3">clock period</span></div>
      <div class="ol-who"><div><b class="i1">IC = ${M.N}</b><span>set by layers 1–2: the algorithm, the compiler and the ISA</span></div><div><b class="i2">CPI = 1 · ${F(
        M.cycM / M.N
      )} · ${F(
        M.sim.total / M.N
      )}</b><i class="ref">single · multi · pipelined</i><span>set by layer 5: the microarchitecture (and hazards)</span></div><div><b class="i3">T<sub>c</sub> = ${
        M.tcS
      } · ${M.tcM} · ${M.tcM} ps</b><span>set by layers 4–5: the slowest instruction, or the slowest step</span></div></div>
      <div class="ref">With only ${M.N} instructions the pipeline’s 4 fill-up cycles dominate its CPI; for a long program it tends to 1 + stalls per instruction.</div>`
    );
    return h;
  });

  $effect(() => {
    if (stackEl) {
      stackEl.innerHTML = stackHtml;
      decorateHL(stackEl);
    }
  });

  function onStackClick(e) {
    const x = e.target.closest('button');
    if (!x) return;
    if (x.dataset.i != null) sel = +x.dataset.i;
    else if (x.dataset.haz) haz = x.dataset.haz;
  }
</script>

<ToolShell title="One line of C, every layer" sub="follow the same statement from source code down to picoseconds">
  <div class="vz ol">
    <div class="ps-bar">
      <div class="ps-tg">
        <span>Statement</span>
        <div class="seg mini">
          {#each Object.keys(EX) as k}
            <button
              type="button"
              aria-pressed={ex === k}
              onclick={() => {
                ex = k;
                sel = 0;
              }}
            >
              {EX[k].name}
            </button>
          {/each}
        </div>
      </div>
    </div>
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="ol-stack" bind:this={stackEl} onclick={onStackClick}></div>
  </div>
</ToolShell>
