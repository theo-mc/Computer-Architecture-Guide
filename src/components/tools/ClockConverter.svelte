<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import StepsList from '@/components/content/StepsList.svelte';
  import { Logic } from '@/utils/logic.js';
  import { TK } from '@/utils/toolKit.js';
  import { richHtml } from '@/utils/actions.js';

  const R = String.raw;
  let { opts = {} } = $props();

  const units = Object.keys(Logic.FREQ).concat(Object.keys(Logic.TIME));
  let val = $state(untrack(() => (opts.v != null ? String(opts.v) : '2')));
  let unit = $state(untrack(() => opts.u || 'ns'));

  const result = $derived.by(() => {
    const v = val === '' || val == null ? NaN : Number(val);
    if (!(v > 0)) return { err: 'Enter a positive number.' };
    const F = TK.F;
    const isF = unit in Logic.FREQ;
    const e = Logic.EXP[unit];
    const base = v * Math.pow(10, e);
    const tex = isF ? Logic.FREQ_TEX[unit] : Logic.TIME_TEX[unit];
    const res = 1 / base;
    const best = isF ? Logic.bestTime(res) : Logic.bestFreq(res);
    const steps = [
      [
        R`${F(v)}\,${tex} = ${F(v)} \times 10^{${e}}\,${isF ? R`\text{Hz}` : R`\text{s}`}`,
        `Replace the prefix with its power of ten: ${isF ? 'k = 10^3, M = 10^6, G = 10^9' : 'm = 10^{-3}, µ = 10^{-6}, n = 10^{-9}, p = 10^{-12}'}.`.replace(
          /10\^\{?(-?\d+)\}?/g,
          '\\(10^{$1}\\)'
        )
      ],
      [
        isF
          ? R`T = \dfrac{1}{f} = \dfrac{1}{${F(v)} \times 10^{${e}}}\,\text{s}`
          : R`f = \dfrac{1}{T} = \dfrac{1}{${F(v)} \times 10^{${e}}}\,\text{Hz}`,
        isF
          ? 'Clock period is the time for one cycle, the reciprocal of the clock rate (L03 s13).'
          : 'Clock rate is cycles per second, the reciprocal of the period (L03 s13).'
      ],
      [
        R`= \dfrac{1}{${F(v)}} \times 10^{${-e}} = ${F(1 / v, 6)} \times 10^{${-e}}\,${isF ? R`\text{s}` : R`\text{Hz}`}`,
        R`Dividing by \(10^{${e}}\) is the same as multiplying by \(10^{${-e}}\) (flip the sign of the power).`
      ],
      [
        R`= ${F(best.v, 4)}\,${isF ? Logic.TIME_TEX[best.u] : Logic.FREQ_TEX[best.u]}`,
        'Move the power of ten into the nearest unit prefix so the number is easy to read.'
      ]
    ];
    return { big: `${F(best.v, 4)} ${best.u}`, steps };
  });
</script>

<ToolShell title="Clock rate ⇄ clock period" sub="period = 1 / rate">
  <div class="row">
    <label class="fld">
      Value
      <input type="number" step="any" bind:value={val} />
    </label>
    <label class="fld">
      Unit
      <select bind:value={unit}>
        {#each units as u}
          <option value={u}>{u}</option>
        {/each}
      </select>
    </label>
  </div>
  <div class="out">
    {#if result.err}
      <div class="err-msg">{result.err}</div>
    {:else}
      <div class="big" use:richHtml={result.big}></div>
      <StepsList steps={result.steps} />
    {/if}
  </div>
</ToolShell>
