<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import StepsList from '@/components/content/StepsList.svelte';
  import { Logic } from '@/utils/logic.js';
  import { TK } from '@/utils/toolKit.js';
  import { richHtml } from '@/utils/actions.js';

  const R = String.raw;
  let { opts = {} } = $props();

  const SC_PRESETS = {
    l10: {
      name: 'L10 s16 (memory 200, ALU 100, RF 50)',
      im: 200, dm: 200, rf: 50, add: 100, addr: 100, mul: 100, br: 100,
      cnt: { lw: 1, sw: 1, R: 1, mult: 0, beq: 1, j: 1 }
    },
    ps2: {
      name: 'PS2 Q6 (IM 160, DM 210, ALU 170, RF 50)',
      im: 160, dm: 210, rf: 50, add: 170, addr: 170, mul: 170, br: 170,
      cnt: { lw: 1, sw: 1, R: 1, mult: 0, beq: 1, j: 0 }
    },
    pt: {
      name: 'Practice Test Q6 (separate adders + multiplier)',
      im: 50, dm: 100, rf: 50, add: 150, addr: 100, mul: 250, br: 150,
      cnt: { lw: 1, sw: 1, R: 2, mult: 1, beq: 0, j: 0 }
    }
  };

  const p0Key = untrack(() => opts.preset || 'l10');
  const p0 = SC_PRESETS[p0Key];

  let presetKey = $state(p0Key);
  let delays = $state({
    im: String(p0.im),
    dm: String(p0.dm),
    rf: String(p0.rf),
    addr: String(p0.addr),
    add: String(p0.add),
    mul: String(p0.mul),
    br: String(p0.br)
  });
  let counts = $state({
    lw: String(p0.cnt.lw),
    sw: String(p0.cnt.sw),
    R: String(p0.cnt.R),
    mult: String(p0.cnt.mult),
    beq: String(p0.cnt.beq),
    j: String(p0.cnt.j)
  });

  function loadPreset(k) {
    presetKey = k;
    const p = SC_PRESETS[k];
    delays = {
      im: String(p.im),
      dm: String(p.dm),
      rf: String(p.rf),
      addr: String(p.addr),
      add: String(p.add),
      mul: String(p.mul),
      br: String(p.br)
    };
    counts = {
      lw: String(p.cnt.lw),
      sw: String(p.cnt.sw),
      R: String(p.cnt.R),
      mult: String(p.cnt.mult),
      beq: String(p.cnt.beq),
      j: String(p.cnt.j)
    };
  }

  const toNum = (s) => (s === '' || s == null ? NaN : Number(s));

  const DELAY_FIELDS = [
    ['im', 'Instr. memory (ps)'],
    ['dm', 'Data memory (ps)'],
    ['rf', 'Register file read or write (ps)'],
    ['addr', 'ALU: address calc (ps)'],
    ['add', 'ALU: add/sub/and/or (ps)'],
    ['mul', 'ALU: multiply (ps)'],
    ['br', 'ALU: branch compare (ps)']
  ];
  const COUNT_KEYS = ['lw', 'sw', 'R', 'mult', 'beq', 'j'];

  const result = $derived.by(() => {
    const F = TK.F;
    const v = {};
    let bad = false;
    for (const [k] of DELAY_FIELDS) {
      v[k] = toNum(delays[k]);
      if (!(v[k] >= 0)) bad = true;
    }
    if (bad) return { err: 'Every delay must be a number ≥ 0.' };
    const cls = {
      lw: ['lw', [v.im, v.rf, v.addr, v.dm, v.rf]],
      sw: ['sw', [v.im, v.rf, v.addr, v.dm, 0]],
      R: ['add / sub (R-type)', [v.im, v.rf, v.add, 0, v.rf]],
      mult: ['mult', [v.im, v.rf, v.mul, 0, v.rf]],
      beq: ['beq', [v.im, v.rf, v.br, 0, 0]],
      j: ['j', [v.im, 0, 0, 0, 0]]
    };
    const cnt = {};
    let N = 0;
    for (const k of Object.keys(cls)) {
      cnt[k] = Math.max(0, toNum(counts[k]) || 0);
      N += cnt[k];
    }
    const used = Object.keys(cls).filter((k) => cnt[k] > 0);
    if (!used.length) return { err: 'Put at least one instruction in the program.' };
    const tot = (k) => cls[k][1].reduce((a, c) => a + c, 0);
    const worst = used.reduce((a, k) => (tot(k) > tot(a) ? k : a), used[0]);
    const clk = tot(worst);
    const maxStage = Math.max(...used.map((k) => Math.max(...cls[k][1])));
    const rows = Object.keys(cls).map((k) => ({
      k,
      label: cls[k][0],
      stages: cls[k][1],
      total: tot(k),
      cnt: cnt[k],
      isWorst: k === worst
    }));
    const steps = [
      [
        R`\text{IF} = \text{instr. memory};\ \text{ID} = \text{register read};\ \text{EX} = \text{the ALU unit that instruction needs};\ \text{MEM} = \text{data memory (lw/sw only)};\ \text{WB} = \text{register write (lw, R-type)}`,
        'Map each step to the hardware it uses and put 0 where the step uses nothing (L10 s16–19, PS2 Q6, Practice Test Q6).'
      ],
      [
        R`\text{${cls[worst][0]}}: ${cls[worst][1].join(' + ')} = ${clk}\,\text{ps}`,
        'Add the stages of each instruction. In a single-cycle machine the parts happen one after another inside one cycle, so the delays add up.'
      ],
      [
        R`T_c = \max(${used.map((k) => tot(k)).join(', ')}) = ${clk}\,\text{ps}`,
        'Every instruction gets the same clock cycle, so it must be long enough for the slowest one: that instruction is the critical path (L10 s14, s20).'
      ],
      [
        R`\text{time} = N \times CPI \times T_c = ${N} \times 1 \times ${clk} = ${F(N * clk)}\,\text{ps}`,
        'Single-cycle means CPI = 1 for every instruction (L10 s21).'
      ],
      [
        R`\text{ideal pipeline clock} = \max(\text{any single stage}) = ${maxStage}\,\text{ps}`,
        'For comparison: a pipelined version clocks at the slowest stage instead of the slowest instruction (PS2 Q6b).'
      ]
    ];
    const kv = `<dt>Clock period</dt><dd>${clk} ps (set by ${cls[worst][0]})</dd><dt>Clock rate</dt><dd>\\(${Logic.freqTex(1 / (clk * 1e-12))}\\)</dd><dt>Program time</dt><dd>${N} × ${clk} = ${F(N * clk)} ps</dd>`;
    return { rows, kv, steps };
  });
</script>

<ToolShell title="Single-cycle timing calculator" sub="component delays → per-instruction latency → clock period">
  <div class="row">
    <label class="fld">
      Preset
      <select value={presetKey} onchange={(e) => loadPreset(e.currentTarget.value)}>
        {#each Object.keys(SC_PRESETS) as k}
          <option value={k}>{SC_PRESETS[k].name}</option>
        {/each}
      </select>
    </label>
  </div>
  <div class="row">
    {#each DELAY_FIELDS as [k, lbl]}
      <label class="fld">
        {lbl}
        <input class="w-s" type="number" step="any" bind:value={delays[k]} />
      </label>
    {/each}
  </div>
  <div class="row">
    <span class="ref" style="align-self:center">How many of each in the program →</span>
    {#each COUNT_KEYS as k}
      <label class="fld">
        {k === 'R' ? 'add/sub' : k}
        <input class="w-s" type="number" min="0" bind:value={counts[k]} />
      </label>
    {/each}
  </div>
  <div class="out">
    {#if result.err}
      <div class="err-msg">{result.err}</div>
    {:else}
      <div class="tbl-wrap">
        <table class="t">
          <thead>
            <tr>
              <th>Instruction</th>
              <th class="c">IF</th>
              <th class="c">ID</th>
              <th class="c">EX</th>
              <th class="c">MEM</th>
              <th class="c">WB</th>
              <th class="c">Total (ps)</th>
              <th class="c">in program</th>
            </tr>
          </thead>
          <tbody>
            {#each result.rows as r}
              <tr style="{r.cnt ? '' : 'opacity:.45;'}{r.isWorst ? 'background:var(--warn-soft);' : ''}">
                <td>{r.label}</td>
                {#each r.stages as s}
                  <td class="c">{s}</td>
                {/each}
                <td class="c"><b>{r.total}</b></td>
                <td class="c">{r.cnt}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="kv" use:richHtml={result.kv}></div>
      <StepsList steps={result.steps} />
    {/if}
  </div>
</ToolShell>
