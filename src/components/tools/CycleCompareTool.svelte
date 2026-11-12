<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import StepsList from '@/components/content/StepsList.svelte';
  import { Logic } from '@/utils/logic.js';
  import { TK } from '@/utils/toolKit.js';
  import { richHtml } from '@/utils/actions.js';

  const R = String.raw;
  let { opts = {} } = $props();

  const CC_PRESETS = {
    l12: {
      name: 'L12 s16 / R1 s21 (ps)',
      unit: 'ps',
      rows: [
        ['Load word', 30, 200, 100, 200, 200, 100],
        ['Store word', 30, 200, 100, 200, 200, ''],
        ['R-format', 20, 200, 100, 200, '', 100],
        ['Branch', 20, 200, 100, 200, '', '']
      ]
    },
    ps2: {
      name: 'PS2 Q5 (ns)',
      unit: 'ns',
      rows: [
        ['Load', 35, 2, 2, 2, 2, 4],
        ['Store', 12, 2, 2, 4, 5, ''],
        ['Arithmetic', 35, 2, 2, 6, '', 4],
        ['Branch', 18, 2, 2, 2, '', '']
      ]
    }
  };

  const p0Key = untrack(() => opts.preset || 'l12');
  const p0 = CC_PRESETS[p0Key];

  let presetKey = $state(p0Key);
  let unit = $state(p0.unit);
  let tableRows = $state(p0.rows.map((r) => r.map((c) => String(c))));

  function loadPreset(k) {
    presetKey = k;
    const p = CC_PRESETS[k];
    unit = p.unit;
    tableRows = p.rows.map((r) => r.map((c) => String(c)));
  }

  const result = $derived.by(() => {
    const F = TK.F;
    const EQ = TK.EQ;
    const u = unit;
    const U = R`\,\text{${u}}`;
    const parsed = [];
    for (const r of tableRows) {
      const c = r.map((x) => String(x == null ? '' : x).trim());
      const st = c.slice(2).map((x) => (x === '' ? null : Number(x)));
      if (st.some((x) => x != null && !(x >= 0))) {
        return { err: 'Stage times must be numbers ≥ 0 (leave blank if unused).' };
      }
      parsed.push({ name: c[0], pct: Number(c[1]) || 0, st });
    }
    const tot = (r) => r.st.reduce((a, c) => a + (c || 0), 0);
    const nst = (r) => r.st.filter((x) => x != null).length;
    const sumPct = parsed.reduce((a, r) => a + r.pct, 0);
    const sc = Math.max(...parsed.map(tot));
    const worst = parsed.find((r) => tot(r) === sc);
    const mc = Math.max(...parsed.flatMap((r) => r.st.filter((x) => x != null)));
    const avg = parsed.reduce((a, r) => a + (r.pct / 100) * nst(r) * mc, 0);
    const steps = [
      [
        R`\textbf{Single-cycle: } ${parsed.map((r) => R`\text{${r.name}} = ${r.st.filter((x) => x != null).join('+')} = ${F(tot(r))}`).join(',\\ ')}`,
        'Add each class’s stage times — in a single-cycle machine they all happen inside one cycle.'
      ],
      [
        R`T_{c,\,single} = \max = ${F(sc)}${U}\ (\text{${worst.name}}),\ \ \text{throughput} = \dfrac{1}{${F(sc)}${U}}`,
        'The clock must fit the slowest instruction; one instruction completes per cycle, so throughput = 1/clock (PS2 Q5a).'
      ],
      [
        R`\textbf{Multi-cycle: } T_{c,\,multi} = \max(\text{every stage}) = ${F(mc)}${U}`,
        'Each step gets its own cycle, so the cycle only has to fit the slowest single step (L11 s8, R1 s18).'
      ],
      [
        R`${parsed.map((r) => R`\text{${r.name}}: ${nst(r)} \times ${F(mc)} = ${F(nst(r) * mc)}`).join(',\\ ')}`,
        'Each class takes (number of stages it uses) cycles, and every cycle is a full clock period even if the stage needs less time.'
      ],
      [
        R`\overline{T} = ${parsed.map((r) => R`${F(r.pct / 100)}\times${F(nst(r) * mc)}`).join(' + ')} ${EQ(avg)} ${F(avg)}${U}`,
        `Weight each class by how often it appears (L12 s16)${Math.abs(sumPct - 100) > 1e-9 ? ` — warning: your percentages add to ${F(sumPct)}%, not 100%` : ''}.`
      ],
      [
        R`${avg > sc ? R`${F(avg)} > ${F(sc)} \Rightarrow \text{multi-cycle is SLOWER here}` : avg < sc ? R`${F(avg)} < ${F(sc)} \Rightarrow \text{multi-cycle is faster here}` : R`\text{equal}`}`,
        'Compare average time per instruction. Multi-cycle wastes time when stages are unbalanced, because short stages still take a whole cycle.'
      ],
      [
        R`\textbf{Pipeline: } T_{c,\,pipe} = ${F(mc)}${U},\ \text{throughput} = \dfrac{1}{${F(mc)}${U}}\ \text{(ideal, no stalls)}`,
        'Same short clock as multi-cycle, but a new instruction finishes every cycle once the pipeline is full (PS2 Q5c, R1 s22). Latency of one instruction is still 5 × ' +
          F(mc) +
          ' ' +
          u +
          '.'
      ]
    ];
    const tp = (x) => Logic.fmt(1 / (x * Logic.TIME[u]), 2) + ' instr/s';
    const summaryHtml = `<div class="tbl-wrap"><table class="t"><thead><tr><th></th><th>Clock</th><th>Avg time / instr</th><th>Throughput</th></tr></thead><tbody><tr><td>Single-cycle</td><td>${F(sc)} ${u}</td><td>${F(sc)} ${u}</td><td>\\(${tp(sc)}\\)</td></tr><tr><td>Multi-cycle</td><td>${F(mc)} ${u}</td><td>${F(avg)} ${u}</td><td>\\(${tp(avg)}\\)</td></tr><tr><td>Pipelined (ideal)</td><td>${F(mc)} ${u}</td><td>${F(mc)} ${u} (steady state)</td><td>\\(${tp(mc)}\\)</td></tr></tbody></table></div>`;
    return { summaryHtml, steps };
  });
</script>

<ToolShell title="Single-cycle vs multi-cycle vs pipeline" sub="blank cell = stage not used">
  <div class="row">
    <label class="fld">
      Preset
      <select value={presetKey} onchange={(e) => loadPreset(e.currentTarget.value)}>
        {#each Object.keys(CC_PRESETS) as k}
          <option value={k}>{CC_PRESETS[k].name}</option>
        {/each}
      </select>
    </label>
    <label class="fld">
      Unit
      <select bind:value={unit}>
        <option value="ps">ps</option>
        <option value="ns">ns</option>
      </select>
    </label>
  </div>
  <div class="tbl-wrap">
    <table class="t">
      <thead>
        <tr>
          <th>Class</th>
          <th>% of program</th>
          <th>IF</th>
          <th>ID</th>
          <th>EX</th>
          <th>MEM</th>
          <th>WB</th>
        </tr>
      </thead>
      <tbody>
        {#each tableRows as r}
          <tr>
            {#each r as _, j}
              <td>
                <input
                  type={j ? 'number' : 'text'}
                  step={j ? 'any' : undefined}
                  bind:value={r[j]}
                  style="width:{j ? 56 : 100}px"
                />
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div class="out scroll-out">
    {#if result.err}
      <div class="err-msg">{result.err}</div>
    {:else}
      <div use:richHtml={result.summaryHtml}></div>
      <StepsList steps={result.steps} />
    {/if}
  </div>
</ToolShell>
