<script>
  import { richHtml } from '@/utils/actions.js';

  let { block } = $props();

  let picks = $state({});

  let score = $derived(
    block.items.reduce((acc, it, k) => acc + (picks[k] === it[1] ? 1 : 0), 0)
  );

  function pick(k, ci) {
    if (picks[k] !== undefined) return;
    picks = { ...picks, [k]: ci };
  }

  function reset() {
    picks = {};
  }
</script>

<div class="sortx">
  <div class="sortx-h">
    <span class="sortx-tag">Sort it</span>
    <span class="sortx-title">{@html block.title}</span>
    <span class="sortx-score">{score} / {block.items.length}</span>
  </div>
  <div class="sortx-list">
    {#each block.items as it, k}
      {@const chosen = picks[k]}
      {@const done = chosen !== undefined}
      {@const ok = chosen === it[1]}
      <div class="sortx-it" class:done class:right={done && ok} class:wrong={done && !ok}>
        <div class="sortx-q" use:richHtml={it[0]}></div>
        <div class="sortx-btns">
          {#each block.cats as cat, ci}
            <button type="button" class={'btn sm ' + (done && ci === it[1] ? 'ok' : '') + (done && chosen === ci && !ok ? ' bad' : '')} onclick={() => pick(k, ci)}>
              {@html cat}
            </button>
          {/each}
        </div>
        <div class="sortx-why" use:richHtml={it[2] || ''}></div>
      </div>
    {/each}
  </div>
  <div class="sortx-f">
    <button type="button" class="btn sm" onclick={reset}>Start again</button>
  </div>
</div>
