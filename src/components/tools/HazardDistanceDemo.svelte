<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import { Logic } from '@/utils/logic.js';
  import { snugScroll } from '@/utils/math.js';
  import { decorate as decorateHL } from '@/utils/hl.js';
  import { pipeSVG, pdText } from '@/utils/svg.js';

  let { opts = {} } = $props();

  const uid = 'ds' + Math.random().toString(36).slice(2, 7);
  let p = $state(untrack(() => opts.p || 'alu'));
  let d = $state(untrack(() => opts.d || 1));
  let f = $state(untrack(() => !!opts.f));
  let width = $state(700);
  let diaEl = $state(null);
  let whyEl = $state(null);

  const view = $derived.by(() => {
    const lines = [p === 'alu' ? 'add $t1, $t2, $t3' : 'lw  $t1, 0($t2)'];
    for (let k = 1; k < d; k++) lines.push(`add $s${k}, $s6, $s7`);
    lines.push('sub $t4, $t1, $t5');
    const ins = Logic.parsePipeProgram(lines.join('\n')).instrs;
    const sim = Logic.simulate(ins, { fwd: f });
    const st = sim.stalls;
    const pr = sim.rows[0];
    const nr = width < 620;
    const svg = pipeSVG(ins, sim, {
      asm: pdText,
      lw: nr ? 128 : 150,
      cw: nr ? 34 : 38,
      minCols: 11,
      minRows: 5,
      hl: [0, ins.length - 1],
      id: uid
    });
    const whyHtml = !f
      ? `Without forwarding <code>sub</code> can only read $t1 in ID once the producer reaches WB (cycle ${pr.WB}: write in the first half, read in the second). Its ID would naturally be in cycle ${d + 2}, so it waits ${st}.`
      : p === 'alu'
        ? `The ALU result exists at the end of the producer's EX (cycle ${pr.EX}); the orange arrow forwards it straight into the consumer's EX — no stall at any distance.`
        : `A load's data only exists at the end of its MEM (cycle ${pr.MEM}). The consumer's EX must start after that, so it waits ${st}. Forwarding can't send a value back in time (L16 s11, s13).`;
    const formula = !f ? `max(0, 3 − ${d}) = ${st}` : p === 'alu' ? 'forwarded: 0' : `max(0, 2 − ${d}) = ${st}`;
    return { svg, st, formula, whyHtml, activeRule: !f ? 'nf' : p === 'alu' ? 'fa' : 'fl' };
  });

  $effect(() => {
    void view.svg;
    if (diaEl) snugScroll(diaEl);
  });

  $effect(() => {
    void view.whyHtml;
    if (whyEl) decorateHL(whyEl);
  });
</script>

<ToolShell title="Distance between producer and consumer" sub="how many stalls? (L16 s5–6, s13)">
  <div class="ds" bind:clientWidth={width}>
    <div class="ps-bar">
      <div class="ps-tg">
        <span>Producer</span>
        <div class="seg mini">
          <button type="button" aria-pressed={p === 'alu'} onclick={() => (p = 'alu')}>ALU · add</button>
          <button type="button" aria-pressed={p === 'ld'} onclick={() => (p = 'ld')}>load · lw</button>
        </div>
      </div>
      <div class="ps-tg">
        <span>Distance</span>
        <div class="seg mini">
          {#each [1, 2, 3, 4] as k}
            <button type="button" aria-pressed={d === k} onclick={() => (d = k)}>{k}</button>
          {/each}
        </div>
      </div>
      <div class="ps-tg">
        <span>Forwarding</span>
        <div class="seg mini">
          <button type="button" aria-pressed={!f} onclick={() => (f = false)}>off</button>
          <button type="button" aria-pressed={f} onclick={() => (f = true)}>on</button>
        </div>
      </div>
    </div>

    <div class="ds-main">
      <div class="ds-big">
        <div class="ds-n {view.st ? 'bad' : 'ok'}">{view.st}</div>
        <div class="ds-l">stall cycle{view.st === 1 ? '' : 's'}</div>
        <code class="ds-f">{view.formula}</code>
      </div>
      <div class="ds-dia" bind:this={diaEl}>{@html view.svg}</div>
    </div>

    <div class="ds-why" bind:this={whyEl}>{@html view.whyHtml}</div>

    <div class="ds-rule">
      <b>Course rule (L16 s6, s13)</b>
      <div class="ds-rr" class:on={view.activeRule === 'nf'}>
        <span>no forwarding</span><code>stalls = max(0, 3 − d)</code>
      </div>
      <div class="ds-rr" class:on={view.activeRule === 'fa'}>
        <span>forwarding, ALU producer</span><code>stalls = 0</code>
      </div>
      <div class="ds-rr" class:on={view.activeRule === 'fl'}>
        <span>forwarding, load producer</span><code>stalls = max(0, 2 − d)</code>
      </div>
    </div>
  </div>
</ToolShell>
