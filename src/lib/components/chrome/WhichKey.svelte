<script>
  import { vim } from '$stores/vim.svelte.js';

  let { actions } = $props();
</script>

{#if vim.wkOpen}
  <div id="whichkey">
    <div class="wk-title"> ␣ leader </div>
    <div class="wk-g">
      {#each actions as [key, title, desc, fn]}
        <button
          type="button"
          class="wk-i"
          onclick={() => {
            vim.closeWhichKey();
            fn();
          }}
        >
          <span class="wk-k">{key}</span>
          <span class="wk-a">➜</span>
          <span class="wk-d">{title}</span>
          <span class="wk-s">{desc}</span>
        </button>
      {/each}
    </div>
    <div class="wk-foot"><kbd>Esc</kbd> close</div>
  </div>
{/if}
