<script>
  import { untrack } from 'svelte';
  import { app } from '$stores/app.svelte.js';
  import { esc } from '$utils/html.js';
  import { autoMath } from '$utils/math.js';
  import { richHtml } from '$utils/actions.js';
  import { basicsFor, hintsFor, getHelpPacks } from '$utils/mockHelp.js';

  let { t, q, qKey, use = $bindable({ h: 0, w: 0, open: false }), review = false, onSave = () => {} } = $props();

  const n = $derived((q.steps || []).length);
  const hints = $derived(review ? [] : hintsFor(t, q));

  let tinyOpen = $state(new Set());
  let basicOpen = $state(new Set());

  // Reset per-question ephemeral toggles when question changes
  $effect(() => {
    void qKey;
    untrack(() => {
      tinyOpen = new Set();
      basicOpen = new Set();
    });
  });

  const beg = $derived((app.s.mockPrefs || {}).beg !== false);
  const packs = $derived(getHelpPacks());
  const pack = $derived(packs[qKey] || null);
  const visibleSteps = $derived.by(() => {
    if (!review && !use.open) return [];
    const k = review ? n : Math.max(1, Math.min(use.w, n));
    return (q.steps || []).slice(0, k);
  });
  const kShown = $derived(review ? n : Math.max(1, Math.min(use.w, n)));

  const txtHtml = (s) => esc(s).replace(/\n/g, '<br>');

  function setBeg(checked) {
    app.s.mockPrefs = { ...(app.s.mockPrefs || {}), beg: checked };
    tinyOpen = new Set();
    app.save();
  }

  function toggleStepTiny(i) {
    if (beg) {
      app.s.mockPrefs = { ...(app.s.mockPrefs || {}), beg: false };
      tinyOpen = new Set(Array.from({ length: n }, (_, x) => x).filter((x) => x !== i));
      app.save();
    } else {
      const next = new Set(tinyOpen);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      tinyOpen = next;
    }
  }

  function toggleBasic(i, bId) {
    const key = i + ':' + bId;
    const next = new Set(basicOpen);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    basicOpen = next;
  }

  function nextHint() {
    use.h = Math.min(hints.length, (use.h || 0) + 1);
    onSave();
  }

  function toggleWork() {
    use.open = !use.open;
    if (use.open) use.w = Math.max(1, use.w || 0);
    onSave();
  }

  function nextWorkStep() {
    use.w = Math.min(n, (use.w || 1) + 1);
    onSave();
  }

  function showAllWork() {
    use.w = n;
    onSave();
  }
</script>

{#if !review}
  {@const more = (use.h || 0) < hints.length}
  <div class="mk-hbar">
    <button type="button" class="mbtn" disabled={!more} onclick={nextHint}>
      💡 {use.h ? (more ? 'Next hint' : 'No more hints') : 'Hint'} <span class="mk-hc">{use.h || 0}/{hints.length}</span>
    </button>
    <button type="button" class="mbtn" aria-pressed={!!use.open} onclick={toggleWork}>
      {use.open ? '▾ Hide the working' : '🪜 Show the working, step by step'}
    </button>
    <span class="ref mk-hnote">optional — any help you use is shown when you mark</span>
  </div>
  {#if use.h > 0}
    <div class="mk-hints">
      {#each hints.slice(0, use.h) as x, i}
        <div class="mk-hint">
          <div class="mk-hint-h">Hint {i + 1} · {x.label}</div>
          <div class="prose" use:richHtml={x.html}></div>
        </div>
      {/each}
    </div>
  {/if}
{/if}

{#if review || use.open}
  <div class="mk-work">
    <div class="mk-wk-h">
      <span class="work-h">{review ? 'Full working' : `Working · step ${kShown} of ${n}`}</span>
      <label class="mk-tog">
        <input type="checkbox" checked={beg} onchange={(e) => setBeg(e.currentTarget.checked)} />
        break every step into tiny steps
      </label>
    </div>

    {#if !pack && (beg || tinyOpen.size > 0)}
      <div class="mk-ai">
        <span class="ref">Claude-written tiny steps aren’t available here, so each step shows the algebra basics it uses instead.</span>
      </div>
    {/if}

    {#if pack && pack.terms && pack.terms.length && beg}
      <div class="mk-terms">
        <b>Words to know</b>
        {#each pack.terms as x}
          <div><i>{x.word}</i> — <span use:richHtml={txtHtml(x.means)}></span></div>
        {/each}
      </div>
    {/if}

    <ol class="ws">
      {#each visibleSteps as s, i}
        {@const open = beg || tinyOpen.has(i)}
        {@const bs = open && !pack ? [] : basicsFor(s)}
        {@const ex = bs.filter((x) => basicOpen.has(i + ':' + x.id))}
        {@const stepBasics = open && !pack ? basicsFor(s) : []}
        <li class:named={!!s[2]}>
          {#if s[2]}
            <div class="ws-n">
              <span class="ws-nt">{@html s[2]}</span>
              {#if s[3]}
                <span class="ws-ref" title="where this is taught">{s[3]}</span>
              {/if}
            </div>
          {/if}
          <div class="ws-do" use:richHtml={autoMath(s[0])}></div>
          {#if s[1]}
            <div class="ws-why" use:richHtml={s[1]}></div>
          {/if}
          <div class="mk-tinybar">
            <button
              type="button"
              class="mk-tbtn"
              aria-expanded={open}
              onclick={() => toggleStepTiny(i)}
            >
              {open ? '▾' : '▸'} tiny steps
            </button>
            {#each bs as x}
              <button
                type="button"
                class="mk-chip"
                aria-pressed={basicOpen.has(i + ':' + x.id)}
                onclick={() => toggleBasic(i, x.id)}
              >
                {x.name}
              </button>
            {/each}
          </div>
          {#if ex.length}
            <div class="mk-basics">
              {#each ex as x}
                <div class="mk-basic">
                  <b>{x.name}</b>
                  <div use:richHtml={x.html}></div>
                </div>
              {/each}
            </div>
          {/if}
          {#if open}
            <div class="mk-tiny">
              {#if pack && pack.steps && pack.steps[i] && pack.steps[i].moves && pack.steps[i].moves.length}
                <ol class="mk-moves">
                  {#each pack.steps[i].moves as m}
                    <li>
                      {#if m.do}<div class="mv-do" use:richHtml={txtHtml(m.do)}></div>{/if}
                      {#if m.say}<div class="mv-say" use:richHtml={txtHtml(m.say)}></div>{/if}
                    </li>
                  {/each}
                </ol>
              {:else if pack}
                <p class="ref">This step is already as small as it gets — read the Why line above.</p>
              {:else if stepBasics.length}
                <div class="mk-tiny-h">The algebra this step uses</div>
                {#each stepBasics as b}
                  <div class="mk-basic">
                    <b>{b.name}</b>
                    <div use:richHtml={b.html}></div>
                  </div>
                {/each}
              {:else}
                <p class="ref">No maths in this step — nothing to break down further.</p>
              {/if}
            </div>
          {/if}
        </li>
      {/each}
    </ol>

    {#if q.check && kShown >= n}
      <div class="qcheck">
        <span class="qcheck-k">✓ check</span>
        <span class="qc-b" use:richHtml={autoMath(q.check)}></span>
      </div>
    {/if}

    {#if !review && kShown < n}
      <div class="mk-wnav">
        <button type="button" class="mbtn go" onclick={nextWorkStep}>Next step ▸</button>
        <button type="button" class="mbtn" onclick={showAllWork}>Show all {n} steps</button>
        <span class="ref">try the next step yourself first</span>
      </div>
    {/if}

    {#if pack}
      <p class="ref mk-ainote">
        Tiny steps are written by Claude from the official working. If one ever disagrees with the numbered step, trust the numbered step.
      </p>
    {/if}
  </div>
{/if}
