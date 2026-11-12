<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';

  let { opts = {} } = $props();

  const PRE = [
    ['TTTTTTTTTNTTTTTTTTTN', 'loop of 10, run twice'],
    ['TTTNTTTNTTTN', 'loop of 4, three runs'],
    ['TNTNTNTNTN', 'alternating'],
    ['NNNNTNNNNN', 'rarely taken'],
    ['TTNNTTNNTTNN', 'pairs']
  ];
  const NAME = ['strongly', 'weakly', 'weakly', 'strongly'];
  const PR = ['not taken', 'not taken', 'taken', 'taken'];
  const X = [72, 177, 283, 388];

  let seq = $state(untrack(() => opts.seq || PRE[0][0]));
  let pos = $state(0);
  let init = $state(3);
  let seqInput = $state(untrack(() => opts.seq || PRE[0][0]));

  const sim = $derived.by(() => {
    const out = seq.split('').map((c) => c === 'T');
    const tr = [];
    let s2 = init;
    let s1 = init >= 2 ? 1 : 0;
    out.forEach((t) => {
      const p2 = s2 >= 2;
      const p1 = s1 === 1;
      const n2 = t ? Math.min(3, s2 + 1) : Math.max(0, s2 - 1);
      tr.push({ t, s2, p2, ok2: p2 === t, p1, ok1: p1 === t, n2 });
      s2 = n2;
      s1 = t ? 1 : 0;
    });
    return { tr, end2: s2 };
  });

  const N = $derived(sim.tr.length);
  const done = $derived(sim.tr.slice(0, pos));
  const stNow = $derived(pos < N ? sim.tr[pos].s2 : sim.end2);
  const last = $derived(pos ? sim.tr[pos - 1] : null);

  const svgHtml = $derived.by(() => {
    let g = `<defs><marker id="bpa" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L8 4L0 8z" fill="context-stroke"/></marker></defs>`;
    g += `<rect x="4" y="6" width="222" height="200" class="bp-zone nt"/><rect x="234" y="6" width="222" height="200" class="bp-zone t"/><text x="115" y="26" class="bp-zl nt">predict NOT TAKEN</text><text x="345" y="26" class="bp-zl t">predict TAKEN</text>`;
    for (let i = 0; i < 3; i++) {
      const usedT = last && last.t && last.s2 === i;
      const usedN = last && !last.t && last.s2 === i + 1;
      g += `<path d="M${X[i] + 30} 112 Q ${(X[i] + X[i + 1]) / 2} 84 ${X[i + 1] - 30} 112" class="bp-e t ${usedT ? 'on' : ''}" marker-end="url(#bpa)"/><text x="${(X[i] + X[i + 1]) / 2}" y="92" class="bp-el t">T</text>`;
      g += `<path d="M${X[i + 1] - 30} 148 Q ${(X[i] + X[i + 1]) / 2} 176 ${X[i] + 30} 148" class="bp-e n ${usedN ? 'on' : ''}" marker-end="url(#bpa)"/><text x="${(X[i] + X[i + 1]) / 2}" y="178" class="bp-el n">N</text>`;
    }
    g += `<path d="M${X[0] - 22} 106 C ${X[0] - 62} 70 ${X[0] - 62} 190 ${X[0] - 22} 154" class="bp-e n ${last && !last.t && last.s2 === 0 ? 'on' : ''}" marker-end="url(#bpa)"/><text x="${X[0] - 58}" y="134" class="bp-el n">N</text>`;
    g += `<path d="M${X[3] + 22} 106 C ${X[3] + 62} 70 ${X[3] + 62} 190 ${X[3] + 22} 154" class="bp-e t ${last && last.t && last.s2 === 3 ? 'on' : ''}" marker-end="url(#bpa)"/><text x="${X[3] + 58}" y="134" class="bp-el t">T</text>`;
    for (let i = 0; i < 4; i++) {
      g += `<g class="bp-s ${i === stNow ? 'now' : ''} ${i >= 2 ? 't' : 'nt'}"><circle cx="${X[i]}" cy="130" r="34"/><text x="${X[i]}" y="122" class="bp-sb">${i
        .toString(2)
        .padStart(2, '0')}</text><text x="${X[i]}" y="137" class="bp-sn">${NAME[i]}</text><text x="${X[i]}" y="149" class="bp-sn">${PR[i]}</text></g>`;
    }
    return `<g transform="translate(0 -2)">${g}</g>`;
  });

  const a1 = $derived([done.filter((x) => x.ok1).length, done.length]);
  const a2 = $derived([done.filter((x) => x.ok2).length, done.length]);
  const f1 = $derived(sim.tr.filter((x) => x.ok1).length);
  const f2 = $derived(sim.tr.filter((x) => x.ok2).length);
  const pct = (a) => (a[1] ? ((100 * a[0]) / a[1]).toFixed(0) + '%' : '—');

  function applySeq() {
    const v = seqInput.toUpperCase().replace(/[^TN]/g, '').slice(0, 40);
    if (v) {
      seq = v;
      pos = 0;
    }
    seqInput = seq;
  }
</script>

<ToolShell title="Branch predictors: 1-bit vs 2-bit" sub="feed in a branch’s history and watch both predictors guess">
  <div class="vz bp">
    <div class="ps-bar">
      <label class="nw-in">
        <span>Outcomes</span>
        <input type="text" bind:value={seqInput} onchange={applySeq} spellcheck="false" style="width:26ch !important" />
      </label>
      <div class="ps-tg">
        <span>2-bit starts in</span>
        <div class="seg mini">
          {#each [[0, 'strong NT'], [1, 'weak NT'], [2, 'weak T'], [3, 'strong T']] as s}
            <button type="button" aria-pressed={init === s[0]} onclick={() => (init = s[0])}>{s[1]}</button>
          {/each}
        </div>
      </div>
    </div>

    <div class="fx-presets">
      {#each PRE as p}
        <button
          type="button"
          class="fx-pre"
          aria-pressed={p[0] === seq}
          onclick={() => {
            seq = p[0];
            seqInput = p[0];
            pos = 0;
          }}
        >
          {p[1]}
        </button>
      {/each}
    </div>

    <div class="d3-ctl">
      <button type="button" class="mbtn" onclick={() => (pos = 0)}>⏮</button>
      <button type="button" class="mbtn" onclick={() => (pos = Math.max(0, pos - 1))}>◀ back</button>
      <button type="button" class="mbtn go" onclick={() => (pos = Math.min(N, pos + 1))}>next branch ▶</button>
      <button type="button" class="mbtn" onclick={() => (pos = N)}>run all ⏭</button>
      <span class="d3-clk">seen <b>{pos}</b>/{N}</span>
    </div>

    <div class="bp-main">
      <div class="bp-fig">
        <div class="bp-cap">
          {#if pos < N}
            Branch {pos + 1}: the 2-bit predictor is in <b>{stNow.toString(2).padStart(2, '0')}</b> and guesses <b>{PR[stNow].toUpperCase()}</b>
          {:else}
            End of the history
          {/if}
        </div>
        <div class="vz-canvas">
          <svg viewBox="0 0 460 215" class="bp-svg" role="img" aria-label="2-bit predictor state machine">
            {@html svgHtml}
          </svg>
        </div>
        <div class="bp-cap2">taken → one state right · not taken → one state left · the guess flips only after two misses in a row</div>
      </div>

      <div class="bp-side">
        <div class="nw-card">
          <div class="nw-ch">1-bit: “same as last time”</div>
          <div class="nw-eq"><b>{a1[0]}</b>/{a1[1]} right <small>{pct(a1)}</small></div>
          <div class="nw-v">whole history: {f1}/{N} = {((100 * f1) / N).toFixed(0)}% · {N - f1} mispredicted</div>
        </div>
        <div class="nw-card">
          <div class="nw-ch">2-bit saturating counter</div>
          <div class="nw-eq"><b>{a2[0]}</b>/{a2[1]} right <small>{pct(a2)}</small></div>
          <div class="nw-v">whole history: {f2}/{N} = {((100 * f2) / N).toFixed(0)}% · {N - f2} mispredicted</div>
        </div>
        <div class="vz-note">
          {#if last}
            Branch {pos} was <b>{last.t ? 'taken' : 'not taken'}</b>. 1-bit guessed {last.p1 ? 'T' : 'N'} {last.ok1 ? '✓' : '✗'};
            2-bit guessed {last.p2 ? 'T' : 'N'} {last.ok2 ? '✓' : '✗'} and moved {last.s2.toString(2).padStart(2, '0')} → {last.n2
              .toString(2)
              .padStart(2, '0')}.
          {:else}
            Step through the history. On a loop branch, watch the 1-bit predictor miss twice per run (the exit, then the first iteration of the next run) while the 2-bit one misses once.
          {/if}
        </div>
      </div>
    </div>

    <div class="bp-tape">
      <div class="bp-row">
        <span class="bp-rl">actual</span>
        {#each sim.tr as x, i}
          <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
          <i
            class="{x.t ? 't' : 'n'} {i === pos ? 'cur' : i > pos ? 'fut' : ''}"
            onclick={() => (pos = i)}
          >
            {x.t ? 'T' : 'N'}
          </i>
        {/each}
      </div>
      <div class="bp-row">
        <span class="bp-rl">1-bit</span>
        {#each sim.tr as x, i}
          <i class={i >= pos ? 'fut' : x.ok1 ? 'ok' : 'bad'}>{i >= pos ? '·' : x.p1 ? 'T' : 'N'}</i>
        {/each}
      </div>
      <div class="bp-row">
        <span class="bp-rl">2-bit</span>
        {#each sim.tr as x, i}
          <i class={i >= pos ? 'fut' : x.ok2 ? 'ok' : 'bad'}>{i >= pos ? '·' : x.p2 ? 'T' : 'N'}</i>
        {/each}
      </div>
    </div>
  </div>
</ToolShell>
