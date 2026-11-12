<script>
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { TOPICS, LABS, FORMULAS, EXAM } from '$data/index.js';
  import { router } from '$stores/router.svelte.js';
  import { vim } from '$stores/vim.svelte.js';
  import { buildSearchIndex, searchIndexEntries, highlightTitle } from '$utils/refs.js';
  import { renderMath } from '$utils/math.js';
  import { esc } from '$utils/html.js';

  const KIND_GLYPH = { topic: 'M↓', file: 'M↓', lab: '◆', formula: 'ƒ', question: '?' };

  let query = $state('');
  let sel = $state(0);
  let inputEl = $state(null);
  let listEl = $state(null);
  let pvEl = $state(null);

  let idx = null;
  function getIdx() {
    if (!idx) idx = buildSearchIndex({ topics: TOPICS, labs: LABS, formulas: FORMULAS, exam: EXAM });
    return idx;
  }

  let results = $derived.by(() => {
    const all = getIdx();
    return searchIndexEntries(all, query);
  });

  let selectedItem = $derived(results[Math.min(sel, Math.max(0, results.length - 1))]?.x || null);

  $effect(() => {
    if (vim.finderOpen) {
      query = '';
      sel = 0;
      requestAnimationFrame(() => inputEl?.focus());
    }
  });

  $effect(() => {
    if (sel >= results.length) sel = Math.max(0, results.length - 1);
    requestAnimationFrame(() => {
      const on = listEl?.querySelector('.fd-r.on');
      if (on) on.scrollIntoView({ block: 'nearest' });
    });
  });

  $effect(() => {
    if (!vim.finderOpen || !pvEl) return;
    const x = selectedItem;
    pvEl.innerHTML = x
      ? `<div class="pv-h">${esc(x.title)}</div><div class="pv-b prose">${x.preview || esc(x.sub || '')}</div>`
      : '';
    renderMath(pvEl);
  });

  function choose(x) {
    vim.finderOpen = false;
    if (!x) return;
    const scrollId = router.openResult(x);
    if (scrollId) {
      requestAnimationFrame(() => {
        const el = document.getElementById(scrollId);
        if (el) {
          el.scrollIntoView({ block: 'start' });
          vim.cursorTo(el);
        }
      });
    }
  }

  function onInputKeydown(ev) {
    if (ev.key === 'Escape') return;
    ev.stopPropagation();
    if (ev.key === 'ArrowDown' || (ev.ctrlKey && (ev.key === 'n' || ev.key === 'j'))) {
      ev.preventDefault();
      sel = Math.min(results.length - 1, sel + 1);
      return;
    }
    if (ev.key === 'ArrowUp' || (ev.ctrlKey && (ev.key === 'p' || ev.key === 'k'))) {
      ev.preventDefault();
      sel = Math.max(0, sel - 1);
      return;
    }
    if (ev.key === 'Enter') {
      ev.preventDefault();
      choose(selectedItem);
    }
  }
</script>

<Dialog.Root bind:open={vim.finderOpen}>
  <Dialog.Content
    overlayClass="bg-black/25 z-[70]"
    class="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[71] w-[min(1080px,calc(100vw-32px))]"
    onOpenAutoFocus={(e) => {
      e.preventDefault();
      inputEl?.focus();
    }}
  >
    <div class="finder">
      <Dialog.Title class="sr-only">Find topics, formulas, labs, questions</Dialog.Title>
      <div class="fd-l">
        <div class="fd-res">
          <div class="fd-list" id="fdRes" bind:this={listEl}>
            {#if results.length === 0}
              <div class="fd-empty">no matches</div>
            {:else}
              {#each results as r, i}
                <div
                  class="fd-r"
                  class:on={i === sel}
                  role="option"
                  aria-selected={i === sel}
                  tabindex="-1"
                  onclick={() => choose(r.x)}
                >
                  <span class="fd-sel">{i === sel ? '▍' : ' '}</span>
                  <span class="fd-k k-{r.x.kind}">{KIND_GLYPH[r.x.kind]}</span>
                  <span class="fd-t">{@html highlightTitle(r.x.title, r.hl)}</span>
                  <span class="fd-s">{r.x.sub || ''}</span>
                </div>
              {/each}
            {/if}
          </div>
        </div>
        <div class="fd-in">
          <span class="fd-p">❯</span>
          <input
            bind:this={inputEl}
            id="fdIn"
            bind:value={query}
            placeholder="topics, formulas, labs, questions…"
            autocomplete="off"
            spellcheck="false"
            oninput={() => { sel = 0; }}
            onkeydown={onInputKeydown}
          />
          <span class="fd-c" id="fdC">{results.length} / {getIdx().length}</span>
        </div>
      </div>
      <div class="fd-pv">
        <div class="fd-pvi" id="fdPv" bind:this={pvEl}></div>
      </div>
    </div>
  </Dialog.Content>
</Dialog.Root>
