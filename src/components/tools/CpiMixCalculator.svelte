<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import StepsList from '@/components/content/StepsList.svelte';
  import { Logic } from '@/utils/logic.js';
  import { TK } from '@/utils/toolKit.js';
  import { richHtml } from '@/utils/actions.js';

  const R = String.raw;
  let { opts = {} } = $props();

  let rows = $state(
    untrack(() =>
      (opts.rows || [
        ['ALU', 1, 50],
        ['Load', 2, 20],
        ['Store', 2, 10],
        ['Branch', 3, 20]
      ]).map((r) => [String(r[0]), String(r[1]), String(r[2])])
    )
  );
  let fStr = $state(untrack(() => (opts.f != null ? String(opts.f) : '2')));
  let fu = $state(untrack(() => opts.fu || 'GHz'));

  const toNum = (s) => (s === '' || s == null ? NaN : Number(s));

  const result = $derived.by(() => {
    const F = TK.F;
    const EQ = TK.EQ;
    const R2 = [];
    for (let i = 0; i < rows.length; i++) {
      const n = rows[i][0];
      const c = toNum(rows[i][1]);
      const k = toNum(rows[i][2]);
      if (!isNaN(c) && !isNaN(k) && k > 0) R2.push([n, c, k]);
    }
    if (!R2.length) return { err: 'Fill in at least one row with a CPI and a count.' };
    if (R2.some((r) => r[1] < 0)) return { err: 'CPI can’t be negative.' };
    const cyc = R2.reduce((s, r) => s + r[1] * r[2], 0);
    const ic = R2.reduce((s, r) => s + r[2], 0);
    const cpi = cyc / ic;
    const f = toNum(fStr) * Logic.FREQ[fu];
    const steps = [
      [
        R`\text{Total cycles} = \sum_i CPI_i \times C_i = ${R2.map((r) => `${F(r[1])}\\times ${F(r[2])}`).join(' + ')}`,
        'Each class contributes (its CPI) × (how many of it ran). Add the contributions (L10 s21; P&H §1.6).'
      ],
      [
        R`= ${R2.map((r) => F(r[1] * r[2])).join(' + ')} = ${F(cyc)}`,
        'Do each multiplication, then add.'
      ],
      [
        R`IC = ${R2.map((r) => F(r[2])).join(' + ')} = ${F(ic)}`,
        'The instruction count is the total of all the counts (if you typed percentages this is 100).'
      ],
      [
        R`\overline{CPI} = \dfrac{\text{Total cycles}}{IC} = \dfrac{${F(cyc)}}{${F(ic)}} ${EQ(cpi)} ${F(cpi)}`,
        'Average CPI = cycles per instruction on average. It is a weighted average, so a common class pulls it towards its own CPI.'
      ]
    ];
    let extra = '';
    if (f > 0) {
      const t = cyc / f;
      const mips = ic / (t * 1e6);
      steps.push([
        R`\text{CPU time} = \dfrac{\text{cycles}}{f} = \dfrac{${F(cyc)}}{${Logic.freqTex(f)}} = ${Logic.timeTex(t)}`,
        'Dividing cycles by the clock rate (cycles per second) gives seconds (R1 s8).'
      ]);
      steps.push([
        R`\text{MIPS} = \dfrac{IC}{\text{time} \times 10^{6}} = \dfrac{f}{\overline{CPI}\times 10^6} = \dfrac{${F(f, 0)}}{${F(cpi)} \times 10^{6}} ${EQ(mips, 2)} ${F(mips, 2)}`,
        'MIPS = millions of instructions per second (L04 s12; P&H §1.10 divides by 10⁶). Equivalent short form: clock rate ÷ (CPI × 10⁶).'
      ]);
      extra = `<dt>CPU time</dt><dd>\\(${Logic.timeTex(t)}\\)</dd><dt>MIPS rating</dt><dd>${TK.T(mips, 2)}</dd>`;
    }
    const kv = `<dt>Average CPI</dt><dd>${F(cpi)}</dd><dt>Total cycles</dt><dd>${TK.T(cyc)}</dd>${extra}`;
    return { kv, steps };
  });
</script>

<ToolShell title="Average CPI from an instruction mix" sub="Σ (CPIᵢ × countᵢ) ÷ total count">
  <div class="tbl-wrap">
    <table class="t">
      <thead>
        <tr><th>Class</th><th>CPIᵢ</th><th>Count (or %)</th></tr>
      </thead>
      <tbody>
        {#each rows as r}
          <tr>
            <td><input class="w-l" bind:value={r[0]} style="width:110px" /></td>
            <td><input type="number" step="any" bind:value={r[1]} style="width:80px" /></td>
            <td><input type="number" step="any" bind:value={r[2]} style="width:90px" /></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div class="row">
    <label class="fld">
      Clock rate
      <input type="number" step="any" bind:value={fStr} style="width:90px" />
    </label>
    <label class="fld">
      unit
      <select bind:value={fu}>
        {#each Object.keys(Logic.FREQ) as u}
          <option value={u}>{u}</option>
        {/each}
      </select>
    </label>
  </div>
  <div class="out">
    {#if result.err}
      <div class="err-msg">{result.err}</div>
    {:else}
      <div class="kv" use:richHtml={result.kv}></div>
      <StepsList steps={result.steps} />
    {/if}
  </div>
</ToolShell>
