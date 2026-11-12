<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import StepsList from '@/components/content/StepsList.svelte';
  import { Logic } from '@/utils/logic.js';
  import { TK } from '@/utils/toolKit.js';
  import { richHtml } from '@/utils/actions.js';

  const R = String.raw;
  let { opts = {} } = $props();

  let parts = $state(
    untrack(() =>
      (opts.parts || [
        ['A', 20],
        ['B', 60],
        ['C', 10],
        ['D', 90],
        ['E', 5]
      ]).map((p) => [p[0], String(p[1])])
    )
  );

  let optionsState = $state(
    untrack(() =>
      (opts.options || [
        ['B', 'tred', 20],
        ['A', 'tred', 30]
      ]).map((op) => [op[0], op[1], String(op[2])])
    )
  );

  const toNum = (s) => (s === '' || s == null ? NaN : Number(s));

  const result = $derived.by(() => {
    const F = TK.F;
    const EQ = TK.EQ;
    const T = parts.map((p) => toNum(p[1]));
    if (T.some((x) => !(x >= 0))) return { err: 'All routine times must be numbers ≥ 0.' };
    const tot = T.reduce((a, c) => a + c, 0);
    if (!(tot > 0)) return { err: 'Total time must be above 0.' };
    let errs = [];
    let best = null;
    const steps = [
      [R`T_{old} = ${T.map((t) => F(t)).join(' + ')} = ${F(tot)}\ \text{s}`, 'Add the routines to get the whole program’s execution time.']
    ];
    optionsState.forEach((op, i) => {
      const r = op[0];
      const m = op[1];
      const v = toNum(op[2]);
      const k = parts.findIndex((p) => p[0] === r);
      const tp = T[k];
      const f = tp / tot;
      const s = m === 'tred' ? 1 / (1 - v / 100) : m === 'pinc' ? 1 + v / 100 : v;
      if (!(s > 0) || !isFinite(s)) {
        errs.push(`Option ${i + 1}: that improvement isn't valid.`);
        return;
      }
      const sp = Logic.amdahl(f, s);
      const tn = tot / sp;
      steps.push([
        R`\textbf{Option ${i + 1}:}\ f = \dfrac{${F(tp)}}{${F(tot)}} ${EQ(f)} ${F(f)},\quad s = ${m === 'tred' ? R`\dfrac{1}{1-${F(v / 100)}}` : m === 'pinc' ? R`1 + ${F(v / 100)}` : ''} ${EQ(s)} ${F(s)}`,
        `Routine ${r} is ${F(tp)} s of the ${F(tot)} s total. ${m === 'tred' ? 'A time reduction of x% means s = 1/(1 − x).' : m === 'pinc' ? 'A performance gain of x% means s = 1 + x.' : ''}`
      ]);
      steps.push([
        R`\text{Speedup}_{${i + 1}} = \dfrac{1}{(1 - ${F(f)}) + \dfrac{${F(f)}}{${F(s)}}} ${EQ(sp)} ${F(sp)},\quad T_{new} = \dfrac{${F(tot)}}{${F(sp)}} ${EQ(tn)} ${F(tn)}\ \text{s}`,
        `Amdahl's law, then new time = old ÷ speedup. Shortcut check: only routine ${r} changes, from ${F(tp)} s to ${F(tp / s)} s, so total = ${F(tot - tp + tp / s)} s.`
      ]);
      if (!best || sp > best.sp) best = { i, sp };
    });
    return {
      okMsg: best ? `Option ${best.i + 1} gives the larger overall speedup (${F(best.sp)}×).` : '',
      errs,
      steps
    };
  });
</script>

<ToolShell title="Compare optimisation options" sub="which change gives the bigger overall speedup?">
  <div class="row">
    {#each parts as p}
      <label class="fld">
        Routine {p[0]} (s)
        <input class="w-s" type="number" step="any" bind:value={p[1]} />
      </label>
    {/each}
  </div>
  {#each optionsState as op, i}
    <div class="row">
      <b style="align-self:center">Option {i + 1}</b>
      <label class="fld">
        speed up routine
        <select bind:value={op[0]}>
          {#each parts as p}
            <option value={p[0]}>{p[0]}</option>
          {/each}
        </select>
      </label>
      <label class="fld">
        given as
        <select bind:value={op[1]}>
          <option value="tred">time reduced by %</option>
          <option value="pinc">performance improved by %</option>
          <option value="x">× times faster</option>
        </select>
      </label>
      <label class="fld">
        value
        <input class="w-s" type="number" step="any" bind:value={op[2]} />
      </label>
    </div>
  {/each}
  <div class="out">
    {#if result.err}
      <div class="err-msg">{result.err}</div>
    {:else}
      {#if result.okMsg}
        <div class="ok-msg" use:richHtml={result.okMsg}></div>
      {/if}
      {#each result.errs as e}
        <div class="err-msg">{e}</div>
      {/each}
      <StepsList steps={result.steps} />
    {/if}
  </div>
</ToolShell>
