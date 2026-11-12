<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import StepsList from '$lib/components/content/StepsList.svelte';
  import { Logic } from '$utils/logic.js';
  import { TK } from '$utils/toolKit.js';
  import { richHtml } from '$utils/actions.js';

  const R = String.raw;
  let { opts = {} } = $props();

  let fm = $state(untrack(() => opts.fm || 'pct'));
  let f1Str = $state(untrack(() => (opts.f1 != null ? String(opts.f1) : '95')));
  let f2Str = $state(untrack(() => (opts.f2 != null ? String(opts.f2) : '')));
  let sm = $state(untrack(() => opts.sm || 'tred'));
  let sStr = $state(untrack(() => (opts.s != null ? String(opts.s) : '10')));
  let t0Str = $state(untrack(() => (opts.t0 != null ? String(opts.t0) : '')));

  const toNum = (s) => (s === '' || s == null ? NaN : Number(s));

  function buildChart(f, s, sp, lim) {
    const W = 520, H = 210, x0 = 46, y0 = 180, x1 = 505, y1 = 16;
    const smax = 100;
    const ymax = Math.max(2, Math.min(isFinite(lim) ? lim * 1.15 : 20, 20));
    const X = (v) => x0 + ((x1 - x0) * Math.log10(v)) / Math.log10(smax);
    const Y = (v) => y0 - ((y0 - y1) * (v - 1)) / (ymax - 1);
    let path = '';
    for (let i = 0; i <= 120; i++) {
      const v = Math.pow(10, (i / 120) * 2);
      const y = Math.min(Logic.amdahl(f, v), ymax);
      path += (i ? 'L' : 'M') + X(v).toFixed(1) + ' ' + Y(y).toFixed(1);
    }
    let g = `<rect x="0" y="0" width="${W}" height="${H}" fill="none"/>`;
    [1, 2, 5, 10, 20, 50, 100].forEach((v) => {
      g += `<line x1="${X(v)}" x2="${X(v)}" y1="${y1}" y2="${y0}" stroke="var(--border)"/><text x="${X(v)}" y="${y0 + 15}" font-size="10" text-anchor="middle" fill="var(--muted)">${v}</text>`;
    });
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const v = 1 + ((ymax - 1) * i) / ticks;
      g += `<line x1="${x0}" x2="${x1}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--border)"/><text x="${x0 - 6}" y="${Y(v) + 3}" font-size="10" text-anchor="end" fill="var(--muted)">${Logic.round(v, 1)}</text>`;
    }
    if (isFinite(lim) && lim <= ymax) {
      g += `<line x1="${x0}" x2="${x1}" y1="${Y(lim)}" y2="${Y(lim)}" stroke="var(--c-red)" stroke-dasharray="5 4"/><text x="${x1}" y="${Y(lim) - 5}" font-size="10" text-anchor="end" fill="var(--c-red)">limit 1/(1−f) = ${Logic.round(lim, 3)}</text>`;
    }
    g += `<path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.2"/>`;
    if (s >= 1 && s <= smax && sp <= ymax) {
      g += `<circle cx="${X(s)}" cy="${Y(sp)}" r="5" fill="var(--accent)"/><text x="${X(s) + 8}" y="${Y(sp) + 14}" font-size="11" fill="var(--fg)">s = ${Logic.round(s, 3)}, speedup ${Logic.round(sp, 3)}</text>`;
    }
    g += `<text x="${(x0 + x1) / 2}" y="${H - 2}" font-size="10.5" text-anchor="middle" fill="var(--muted)">s, speedup of the improved part (log scale)</text><text x="12" y="${(y0 + y1) / 2}" font-size="10.5" fill="var(--muted)" transform="rotate(-90 12 ${(y0 + y1) / 2})" text-anchor="middle">overall speedup</text>`;
    return g;
  }

  const result = $derived.by(() => {
    const F = TK.F;
    const EQ = TK.EQ;
    const f1 = toNum(f1Str);
    const f2 = toNum(f2Str);
    const sv = toNum(sStr);
    const t0 = toNum(t0Str);
    let f, fStep;
    if (fm === 'pct') {
      f = f1 / 100;
      fStep = [R`f = \dfrac{${F(f1)}}{100} = ${F(f)}`, 'f must be a decimal fraction between 0 and 1, so divide the percentage by 100.'];
    } else if (fm === 'frac') {
      f = f1;
      fStep = [R`f = ${F(f)}`, 'Already a fraction of the old execution time.'];
    } else {
      f = f1 / f2;
      fStep = [
        R`f = \dfrac{\text{time of improved part}}{\text{total time}} = \dfrac{${F(f1)}}{${F(f2)}} ${EQ(f)} ${F(f)}`,
        'f is the fraction of the <b>original execution time</b> spent in the part you improve (L04 s4).'
      ];
    }
    if (!(f >= 0 && f <= 1)) return { err: 'f must be between 0 and 1 (0% to 100%).', svg: '' };
    let s, sStep;
    if (sm === 'x') {
      s = sv;
      sStep = [R`s = ${F(s)}`, 's is how many times faster the improved part runs.'];
    } else if (sm === 'tred') {
      if (!(sv < 100)) return { err: 'A time reduction must be below 100%.', svg: '' };
      s = 1 / (1 - sv / 100);
      sStep = [
        R`s = \dfrac{1}{1 - ${F(sv / 100)}} = \dfrac{1}{${F(1 - sv / 100)}} ${EQ(s)} ${F(s)}`,
        'If that part’s time is cut by x%, its new time is (1 − x) of the old, so it runs 1/(1 − x) times faster (L04 s9–10).'
      ];
    } else {
      s = 1 + sv / 100;
      sStep = [
        R`s = 1 + ${F(sv / 100)} = ${F(s)}`,
        'If that part’s performance rises by x%, it runs (1 + x) times as fast (L04 [26:55], R1 s12).'
      ];
    }
    if (!(s > 0)) return { err: 's must be positive.', svg: '' };
    const one = 1 - f;
    const fs = f / s;
    const den = one + fs;
    const sp = 1 / den;
    const lim = Logic.amdahlLimit(f);
    const steps = [
      fStep,
      sStep,
      [R`1 - f = 1 - ${F(f)} = ${F(one)}`, 'The part you did NOT improve still takes this fraction of the old time.'],
      [R`\dfrac{f}{s} = \dfrac{${F(f)}}{${F(s)}} ${EQ(fs, 6)} ${F(fs, 6)}`, 'The improved part now takes its old fraction divided by s.'],
      [R`(1-f) + \dfrac{f}{s} = ${F(one)} + ${F(fs, 6)} ${EQ(den, 6)} ${F(den, 6)}`, 'This sum is the new time as a fraction of the old time.'],
      [R`\text{Speedup} = \dfrac{1}{${F(den, 6)}} ${EQ(sp)} ${F(sp)}`, 'Speedup = old time ÷ new time; with old time = 1 that is 1 ÷ the sum.']
    ];
    if (t0 > 0) {
      steps.push([
        R`T_{new} = \dfrac{T_{old}}{\text{Speedup}} = \dfrac{${F(t0)}}{${F(sp)}} ${EQ(t0 / sp)} ${F(t0 / sp)}`,
        'Speedup = old/new, so new = old ÷ speedup. (Check: it also equals old × the sum above.)'
      ]);
    }
    steps.push([
      R`\text{Limit as } s\to\infty: \dfrac{1}{1-f} = \dfrac{1}{${F(one)}} ${f >= 1 ? '' : EQ(lim)} ${f >= 1 ? R`\to\infty` : F(lim)}`,
      'Even an infinitely fast improvement can’t beat this: the untouched part (1 − f) becomes the bottleneck (L04 s7–8).'
    ]);
    const kv = `<dt>Overall speedup</dt><dd>${F(sp)}× (${F((sp - 1) * 100, 2)}% faster)</dd><dt>Best possible (s → ∞)</dt><dd>${f >= 1 ? '∞' : F(lim) + '×'}</dd>${t0 > 0 ? `<dt>New time</dt><dd>${F(t0 / sp)}</dd>` : ''}`;
    return { kv, steps, svg: buildChart(f, s, sp, lim) };
  });
</script>

<ToolShell title="Amdahl's law calculator" sub="speedup = 1 / ((1 − f) + f / s)">
  <div class="row">
    <label class="fld">
      Fraction f given as
      <select bind:value={fm}>
        <option value="pct">percentage of time</option>
        <option value="frac">decimal fraction</option>
        <option value="time">part time and total time</option>
      </select>
    </label>
    <label class="fld">
      {fm === 'time' ? 'time of the part being improved' : fm === 'pct' ? 'f (%)' : 'f (0–1)'}
      <input type="number" step="any" bind:value={f1Str} />
    </label>
    <label class="fld" hidden={fm !== 'time'}>
      total time
      <input type="number" step="any" bind:value={f2Str} />
    </label>
  </div>
  <div class="row">
    <label class="fld">
      Improvement given as
      <select bind:value={sm}>
        <option value="x">s (times faster)</option>
        <option value="tred">that part’s time reduced by %</option>
        <option value="pinc">that part’s performance improved by %</option>
      </select>
    </label>
    <label class="fld">
      value
      <input type="number" step="any" bind:value={sStr} />
    </label>
    <label class="fld">
      Old total time (optional)
      <input type="number" step="any" bind:value={t0Str} />
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
  <svg viewBox="0 0 520 210" style="width:100%;max-width:560px">
    {@html result.svg}
  </svg>
</ToolShell>
