<script>
  import ToolShell from './ToolShell.svelte';
  import StepsList from '$lib/components/content/StepsList.svelte';

  const R = String.raw;
  const N = 8;

  let D = $state([0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1]);
  let showQ = $state(true);

  const view = $derived.by(() => {
    const x0 = 50, w = 37.5, rows = { clk: 30, d: 90, q: 150 }, hi = 22;
    const wave = (vals, y, color) => {
      let p = '';
      vals.forEach((v, i) => {
        const x = x0 + i * w;
        const yy = y - v * hi;
        p += (i ? `L${x} ${yy}` : `M${x} ${yy}`) + `L${x + w} ${yy}`;
      });
      return `<path d="${p}" fill="none" stroke="${color}" stroke-width="2.4"/>`;
    };
    const clk = [];
    for (let i = 0; i < 2 * N; i++) clk.push(i % 2 === 0 ? 1 : 0);
    const Q = [];
    let q = 0;
    for (let i = 0; i < 2 * N; i++) {
      if (i % 2 === 0) q = D[i];
      Q.push(q);
    }
    let g = '';
    for (let c = 0; c < N; c++) {
      const x = x0 + 2 * c * w;
      g += `<line x1="${x}" x2="${x}" y1="6" y2="${showQ ? 175 : 110}" stroke="var(--c-orange)" stroke-dasharray="3 4" opacity=".7"/><text x="${x + 3}" y="14" font-size="10" fill="var(--c-orange)">↑${c + 1}</text>`;
    }
    g += `<text x="6" y="${rows.clk - 6}" font-size="12" fill="var(--fg)">CLK</text>` + wave(clk, rows.clk, 'var(--muted)');
    g += `<text x="6" y="${rows.d - 6}" font-size="12" fill="var(--fg)">D</text>` + wave(D, rows.d, 'var(--c-blue)');
    D.forEach((_, i) => {
      g += `<rect data-seg="${i}" x="${x0 + i * w}" y="${rows.d - hi - 6}" width="${w}" height="${hi + 12}" fill="transparent" style="cursor:pointer"/>`;
    });
    if (showQ) g += `<text x="6" y="${rows.q - 6}" font-size="12" fill="var(--fg)">Q</text>` + wave(Q, rows.q, 'var(--c-green)');

    const steps = [];
    for (let c = 0; c < N; c++) {
      steps.push([
        R`\text{edge } ${c + 1}: D = ${D[2 * c]} \Rightarrow Q = ${D[2 * c]}`,
        c === 0
          ? 'At a rising edge (clock going 0 → 1) the flip-flop copies D to Q (L09 s15, lecture [22:52]). Changes of D between edges are ignored.'
          : D[2 * c + 1] !== D[2 * c]
            ? 'D changed in the middle of this cycle, but Q waits for the next rising edge.'
            : 'Q holds this value until the next rising edge.'
      ]);
    }
    return { svg: g, steps };
  });

  function onSvgClick(e) {
    const s = e.target.closest('[data-seg]');
    if (!s) return;
    const i = +s.dataset.seg;
    D[i] = 1 - D[i];
  }

  function randomize() {
    D = D.map(() => (Math.random() < 0.5 ? 1 : 0));
  }
</script>

<ToolShell title="Edge-triggered D flip-flop" sub="click the D wave to change it; Q copies D at each rising clock edge">
  <div class="row">
    <button type="button" class="btn" onclick={() => (showQ = !showQ)}>
      {showQ ? 'Hide Q (quiz me)' : 'Show Q'}
    </button>
    <button type="button" class="btn" onclick={randomize}>Random D</button>
  </div>
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <svg viewBox="0 0 660 190" class="wave" style="width:100%;max-width:700px" onclick={onSvgClick}>
    {@html view.svg}
  </svg>
  <div class="out">
    {#if showQ}
      <StepsList steps={view.steps} />
    {:else}
      <p class="ref">Work out Q at each rising edge, then press "Show Q".</p>
    {/if}
  </div>
</ToolShell>
