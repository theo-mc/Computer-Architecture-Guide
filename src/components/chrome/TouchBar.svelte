<script>
  import { vim } from '@/stores/vim.svelte.js';
  import { NF } from '@/utils/refs.js';

  let { onJumpSection, onScrollTop } = $props();
</script>

<nav id="touchbar" aria-label="Terminal touch controls">
  <button type="button" aria-label="files" onclick={() => (vim.navOpen = !vim.navOpen)}>
    <span class="tbi">{NF.tree}</span><span class="tbl">files</span>
  </button>
  <button type="button" aria-label="find" onclick={() => vim.openFinder()}>
    <span class="tbi">{NF.find}</span><span class="tbl">find</span>
  </button>
  <button
    type="button"
    aria-label="keys"
    onclick={() => (vim.wkOpen ? vim.closeWhichKey() : vim.openWhichKey())}
  >
    <span class="tbi">␣</span><span class="tbl">keys</span>
  </button>
  <button type="button" aria-label="cmd" onclick={() => vim.openCmd(':')}>
    <span class="tbi">:</span><span class="tbl">cmd</span>
  </button>
  <button type="button" aria-label="§ prev" onclick={() => onJumpSection?.(-1)}>
    <span class="tbi">▲</span><span class="tbl">§ prev</span>
  </button>
  <button type="button" aria-label="§ next" onclick={() => onJumpSection?.(1)}>
    <span class="tbi">▼</span><span class="tbl">§ next</span>
  </button>
  <button type="button" aria-label="top" onclick={() => onScrollTop?.()}>
    <span class="tbi">⤒</span><span class="tbl">top</span>
  </button>
</nav>
