<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import StepsList from '$lib/components/content/StepsList.svelte';
  import { Logic } from '$utils/logic.js';
  import { TK } from '$utils/toolKit.js';
  import { esc } from '$utils/html.js';
  import { richHtml } from '$utils/actions.js';

  const R = String.raw;
  let { opts = {} } = $props();

  let baseStr = $state(untrack(() => String(opts.base || 1)));
  let hazards = $state(
    untrack(() =>
      (opts.hazards || [
        ['Structural', 35, 1],
        ['Data', 25, 2],
        ['Control (branches)', 25, 2, 60]
      ]).map((h) => [String(h[0]), String(h[1]), String(h[2]), String(h[3] != null ? h[3] : 100)])
    )
  );
  let procs = $state(
    untrack(() =>
      (opts.procs || [
        ['P1', 0.9, [0, 0, 0]],
        ['P2', 1.2, [0, 1, 1]],
        ['P3', 2.2, [1, 1, 1]]
      ]).map((p) => [String(p[0]), String(p[1]), p[2].map(Boolean)])
    )
  );

  const toNum = (s) => (s === '' || s == null ? NaN : Number(s));

  const result = $derived.by(() => {
    const F = TK.F;
    const EQ = TK.EQ;
    const base = toNum(baseStr);
    const hz = hazards.map((h) => ({
      n: h[0],
      f: toNum(h[1]) / 100,
      p: toNum(h[2]),
      q: toNum(h[3]) / 100
    }));
    if (hz.some((h) => isNaN(h.f) || isNaN(h.p) || isNaN(h.q)) || isNaN(base)) {
      return { err: 'Fill every hazard row with numbers.' };
    }
    const steps = [];
    const res = [];
    hz.forEach((h) => {
      steps.push([
        R`\text{${h.n}}: ${F(h.f)} ${h.q !== 1 ? R`\times ${F(h.q)}` : ''} \times ${F(h.p)} ${EQ(h.f * h.q * h.p)} ${F(h.f * h.q * h.p)}\ \text{extra cycles per instruction}`,
        h.q !== 1
          ? 'Only the fraction that actually goes wrong (e.g. wrong branch guesses) pays the penalty: fraction × probability × penalty (PS3 Q3).'
          : 'Fraction of instructions affected × cycles lost each time (L15 s14: "every 5th instruction … 2-cycle stall → +0.4").'
      ]);
    });
    procs.forEach((p) => {
      const name = p[0];
      const clk = toNum(p[1]) * 1e9;
      const on = hz.filter((_, k) => p[2][k]);
      const cpi = base + on.reduce((a, h) => a + h.f * h.q * h.p, 0);
      const tpi = cpi / clk;
      steps.push([
        R`CPI_{${name}} = ${F(base)} ${on.map((h) => '+ ' + F(h.f * h.q * h.p)).join(' ')} = ${F(cpi)};\ \ \dfrac{\text{time}}{\text{instr}} = \dfrac{CPI}{f} = \dfrac{${F(cpi)}}{${Logic.freqTex(clk)}} = ${Logic.timeTex(tpi)}`,
        on.length
          ? `${name} still suffers: ${on.map((h) => h.n).join(', ')}. Add their penalties to the ideal CPI, then divide by the clock rate (time = IC × CPI / f; IC is the same for all so it cancels).`
          : `${name} resolves every hazard, so its CPI stays at the ideal value.`
      ]);
      res.push({ name, cpi, tpi });
    });
    let kv = null;
    if (res.length && res.every((r) => r.tpi > 0 && isFinite(r.tpi))) {
      const best = res.reduce((a, r) => (r.tpi < a.tpi ? r : a));
      res
        .filter((r) => r !== best)
        .forEach((r) => {
          steps.push([
            R`\dfrac{T_{${r.name}}}{T_{${best.name}}} = \dfrac{${Logic.timeTex(r.tpi)}}{${Logic.timeTex(best.tpi)}} ${EQ(r.tpi / best.tpi)} ${F(r.tpi / best.tpi)}\ \Rightarrow\ ${best.name} \text{ is } ${F(r.tpi / best.tpi)}\times \text{ faster};\ \text{it needs } ${F((1 - best.tpi / r.tpi) * 100, 2)}\% \text{ less time}`,
            'Speedup n = slower time ÷ faster time (L03 s7). The "% less time" figure is (T_slow − T_fast)/T_slow — the style used in the PS3 Q3d solution. Say which one you are giving.'
          ]);
        });
      kv = res
        .map((r) => `<dt>${esc(r.name)}</dt><dd>CPI ${F(r.cpi)} · \\(${Logic.timeTex(r.tpi)}\\) per instruction${r === best ? ' · fastest' : ''}</dd>`)
        .join('');
    }
    return { kv, steps };
  });
</script>

<ToolShell title="CPI with stalls &amp; processor comparison" sub="CPI = ideal CPI + Σ (fraction × penalty)">
  <div class="row">
    <label class="fld">
      Ideal CPI
      <input class="w-s" type="number" step="any" bind:value={baseStr} />
    </label>
  </div>
  <div class="tbl-wrap">
    <table class="t">
      <thead>
        <tr>
          <th>Hazard</th>
          <th>% of instructions</th>
          <th>Penalty (cycles)</th>
          <th>% of those that actually stall<br /><span class="ref">e.g. mispredicted branches</span></th>
        </tr>
      </thead>
      <tbody>
        {#each hazards as h}
          <tr>
            <td><input bind:value={h[0]} style="width:136px" /></td>
            <td><input class="w-s" type="number" step="any" bind:value={h[1]} /></td>
            <td><input class="w-s" type="number" step="any" bind:value={h[2]} /></td>
            <td><input class="w-s" type="number" step="any" bind:value={h[3]} /></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div class="tbl-wrap">
    <table class="t">
      <thead>
        <tr>
          <th>Processor</th>
          <th>Clock rate (GHz)</th>
          {#each hazards as h}
            <th>suffers {h[0].split(' ')[0]}?</th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each procs as p}
          <tr>
            <td><input bind:value={p[0]} style="width:70px" /></td>
            <td><input class="w-s" type="number" step="any" bind:value={p[1]} /></td>
            {#each hazards as _, k}
              <td class="c"><input type="checkbox" bind:checked={p[2][k]} /></td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <div class="out">
    {#if result.err}
      <div class="err-msg">{result.err}</div>
    {:else}
      {#if result.kv}
        <div class="kv" use:richHtml={result.kv}></div>
      {/if}
      <StepsList steps={result.steps} />
    {/if}
  </div>
</ToolShell>
