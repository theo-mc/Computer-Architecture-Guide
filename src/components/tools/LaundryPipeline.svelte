<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import StepsList from '@/components/content/StepsList.svelte';
  import { TK } from '@/utils/toolKit.js';

  const R = String.raw;
  let { opts = {} } = $props();

  let s0 = $state('30');
  let s1 = $state(untrack(() => String(opts.dry || 60)));
  let s2 = $state('30');
  let s3 = $state('30');
  let nStr = $state('4');
  let dryers = $state(1);
  let mode = $state('p');

  const toNum = (s) => (s === '' || s == null ? NaN : Number(s));

  const result = $derived.by(() => {
    const st = [toNum(s0), toNum(s1), toNum(s2), toNum(s3)];
    const n = Math.min(8, Math.max(1, toNum(nStr) | 0));
    const dCount = Number(dryers);
    if (st.some((x) => !(x > 0))) return { err: 'Every step needs a positive time.', viewBox: '0 0 640 210', svg: '' };
    const cap = [1, dCount, 1, 1];
    const free = cap.map((c) => Array(c).fill(0));
    const sched = [];
    let prevEnd = 0;
    for (let i = 0; i < n; i++) {
      let t = mode === 's' ? prevEnd : 0;
      const row = [];
      for (let s = 0; s < 4; s++) {
        let u = 0;
        for (let k = 1; k < cap[s]; k++) if (free[s][k] < free[s][u]) u = k;
        const start = Math.max(t, free[s][u]);
        const end = start + st[s];
        free[s][u] = end;
        row.push([start, end, u]);
        t = end;
      }
      sched.push(row);
      prevEnd = t;
    }
    const total = sched[n - 1][3][1];
    const colors = ['var(--c-blue)', 'var(--c-orange)', 'var(--c-green)', 'var(--c-magenta)'];
    const names = ['wash', 'dry', 'fold', 'away'];
    const x0 = 50, x1 = 630;
    const X = (t) => x0 + ((x1 - x0) * t) / total;
    const rh = Math.min(30, 170 / n);
    let g = '';
    for (let t = 0; t <= total; t += 30) {
      g += `<line x1="${X(t)}" x2="${X(t)}" y1="8" y2="${12 + n * rh}" stroke="var(--border)"/>`;
      if (t % 60 === 0) g += `<text x="${X(t)}" y="${26 + n * rh}" font-size="9.5" text-anchor="middle" fill="var(--muted)">${t}</text>`;
    }
    sched.forEach((row, i) => {
      g += `<text x="6" y="${12 + i * rh + rh / 2 + 4}" font-size="11" fill="var(--fg)">${'ABCDEFGH'[i]}</text>`;
      row.forEach((s, k) => {
        const w = X(s[1]) - X(s[0]);
        g += `<rect x="${X(s[0]) + 1}" y="${12 + i * rh + 2}" width="${Math.max(1, w - 2)}" height="${rh - 4}" rx="4" fill="${colors[k]}" opacity="${k === 1 && s[2] ? 0.55 : 0.85}"/>`;
        if (w > 34) {
          g += `<text x="${(X(s[0]) + X(s[1])) / 2}" y="${12 + i * rh + rh / 2 + 4}" font-size="9.5" text-anchor="middle" fill="var(--accent-fg)">${names[k]}${k === 1 && dCount > 1 ? ' ' + (s[2] + 1) : ''}</text>`;
        }
      });
    });
    g += `<text x="${(x0 + x1) / 2}" y="${40 + n * rh}" font-size="10" text-anchor="middle" fill="var(--muted)">minutes</text>`;
    const bott = Math.max(...st.map((x, i) => x / cap[i]));
    const F = TK.F;
    const steps =
      mode === 's'
        ? [
            [
              R`\text{one load} = ${st.join('+')} = ${F(st.reduce((a, c) => a + c, 0))}\ \text{min};\ \ ${n}\ \text{loads} = ${F(total)}\ \text{min}`,
              'Without pipelining each load waits for the previous one to be completely put away.'
            ]
          ]
        : [
            [
              R`\text{bottleneck} = \max\left(${st.map((x, i) => (cap[i] > 1 ? `\\tfrac{${x}}{${cap[i]}}` : x)).join(', ')}\right) = ${F(bott)}\ \text{min per load}`,
              'In steady state a new load can only finish as often as the slowest step allows (L12 s7). Two dryers halve the drying bottleneck (L12 s8).'
            ],
            [
              R`\text{throughput} = \dfrac{60}{${F(bott)}} = ${F(60 / bott)}\ \text{loads/hour};\ \ \text{total for } ${n} = ${F(total)}\ \text{min}`,
              'Latency of one load is unchanged (it still goes through every step); throughput is what improved (L12 s6).'
            ]
          ];
    return { viewBox: `0 0 640 ${50 + n * rh}`, svg: g, steps };
  });
</script>

<ToolShell title="Laundry pipeline" sub="the L12 analogy, with real times">
  <div class="row">
    <label class="fld">Wash (min)<input class="w-s" type="number" bind:value={s0} /></label>
    <label class="fld">Dry (min)<input class="w-s" type="number" bind:value={s1} /></label>
    <label class="fld">Fold (min)<input class="w-s" type="number" bind:value={s2} /></label>
    <label class="fld">Put away (min)<input class="w-s" type="number" bind:value={s3} /></label>
    <label class="fld">Loads<input class="w-s" type="number" min="1" max="8" bind:value={nStr} /></label>
    <label class="fld">
      Dryers
      <select bind:value={dryers}>
        <option value={1}>1</option>
        <option value={2}>2</option>
      </select>
    </label>
    <label class="fld">
      Mode
      <select bind:value={mode}>
        <option value="p">pipelined</option>
        <option value="s">one load at a time</option>
      </select>
    </label>
  </div>
  <svg viewBox={result.viewBox} style="width:100%">
    {@html result.svg}
  </svg>
  <div class="out">
    {#if result.err}
      <div class="err-msg">{result.err}</div>
    {:else}
      <StepsList steps={result.steps} />
    {/if}
  </div>
</ToolShell>
