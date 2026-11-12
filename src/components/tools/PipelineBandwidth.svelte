<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import StepsList from '@/components/content/StepsList.svelte';
  import { TK } from '@/utils/toolKit.js';
  import { richHtml } from '@/utils/actions.js';

  const R = String.raw;
  let { opts = {} } = $props();

  let tStr = $state(untrack(() => String(opts.t || 800)));
  let sStr = $state(untrack(() => String(opts.s || 20)));
  let kStr = $state(untrack(() => String(opts.k || 5)));
  let gStr = $state(untrack(() => String(opts.g || 10000)));
  let lStr = $state(untrack(() => String(opts.l || 500)));

  const toNum = (s) => (s === '' || s == null ? NaN : Number(s));

  const result = $derived.by(() => {
    const F = TK.F;
    const EQ = TK.EQ;
    const T = toNum(tStr);
    const S = toNum(sStr);
    const k = toNum(kStr);
    const G = toNum(gStr);
    const Lc = toNum(lStr);
    if (!(T > 0) || !(S >= 0) || !(k >= 1) || !Number.isInteger(k)) {
      return { err: 'T > 0, S ≥ 0 and k a whole number ≥ 1.', svg: '' };
    }
    const bw1 = 1 / (T + S);
    const bwk = 1 / (T / k + S);
    const sp = bwk / bw1;
    const steps = [
      [R`BW_{1} = \dfrac{1}{T+S} = \dfrac{1}{${F(T)}+${F(S)}} = \dfrac{1}{${F(T + S)}\,\text{ps}}`, 'Not pipelined: one result every T + S (logic plus one register) — L12 s11.'],
      [
        R`BW_{${k}} = \dfrac{1}{T/k + S} = \dfrac{1}{${F(T)}/${k} + ${F(S)}} = \dfrac{1}{${F(T / k)} + ${F(S)}} = \dfrac{1}{${F(T / k + S)}\,\text{ps}}`,
        'Split the logic into k equal pieces; each stage still pays the register delay S.'
      ],
      [
        R`\text{speedup} = \dfrac{${F(T + S)}}{${F(T / k + S)}} ${EQ(sp)} ${F(sp)}\ (\text{ideal would be } ${k})`,
        'Register overhead stops the speedup from reaching k — more stages give diminishing returns.'
      ],
      [
        R`\text{cost} = G + L\cdot k = ${F(G)} + ${F(Lc)}\times${k} = ${F(G + Lc * k)}`,
        'Each extra stage adds another set of pipeline registers (L12 s12).'
      ]
    ];
    const kv = `<dt>Time per result</dt><dd>${F(T / k + S)} ps (was ${F(T + S)} ps)</dd><dt>Speedup</dt><dd>${F(sp)}×</dd><dt>Cost</dt><dd>${F(G + Lc * k)} (was ${F(G + Lc)})</dd>`;

    const K = Math.max(12, k);
    const x0 = 46, x1 = 505, y0 = 170, y1 = 14;
    const ym = 1 / S > 0 && isFinite(1 / S) ? Math.min(1 / S, (1 / (T / K + S)) * 1.1) : (1 / (T / K)) * 1.1;
    const X = (i) => x0 + ((x1 - x0) * (i - 1)) / (K - 1);
    const Y = (v) => y0 - ((y0 - y1) * v) / ym;
    let g = '';
    let p = '';
    for (let i = 1; i <= K; i++) {
      const v = 1 / (T / i + S);
      p += (i > 1 ? 'L' : 'M') + X(i) + ' ' + Y(v);
      g += `<text x="${X(i)}" y="${y0 + 14}" font-size="10" text-anchor="middle" fill="var(--muted)">${i}</text>`;
    }
    g += `<line x1="${x0}" x2="${x1}" y1="${y0}" y2="${y0}" stroke="var(--border-strong)"/><path d="${p}" fill="none" stroke="var(--accent)" stroke-width="2.2"/><circle cx="${X(k)}" cy="${Y(bwk)}" r="5" fill="var(--accent)"/>`;
    if (S > 0 && 1 / S <= ym * 1.0001) {
      g += `<line x1="${x0}" x2="${x1}" y1="${Y(1 / S)}" y2="${Y(1 / S)}" stroke="var(--c-red)" stroke-dasharray="5 4"/><text x="${x1}" y="${Y(1 / S) + 12}" font-size="10" text-anchor="end" fill="var(--c-red)">ceiling 1/S</text>`;
    }
    g += `<text x="${(x0 + x1) / 2}" y="198" font-size="10.5" text-anchor="middle" fill="var(--muted)">number of stages k</text><text x="12" y="92" font-size="10.5" fill="var(--muted)" transform="rotate(-90 12 92)" text-anchor="middle">throughput</text>`;

    return { kv, steps, svg: g };
  });
</script>

<ToolShell title="Pipeline depth: throughput vs cost" sub="BW = 1 / (T/k + S),  cost = G + L·k">
  <div class="row">
    <label class="fld">
      Logic delay T (ps)
      <input type="number" step="any" bind:value={tStr} />
    </label>
    <label class="fld">
      Register delay S (ps)
      <input type="number" step="any" bind:value={sStr} />
    </label>
    <label class="fld">
      Stages k
      <input type="number" min="1" step="1" bind:value={kStr} />
    </label>
    <label class="fld">
      Logic cost G (gates)
      <input type="number" bind:value={gStr} />
    </label>
    <label class="fld">
      Register cost L per stage
      <input type="number" bind:value={lStr} />
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
  <svg viewBox="0 0 520 200" style="width:100%;max-width:560px">
    {@html result.svg}
  </svg>
</ToolShell>
