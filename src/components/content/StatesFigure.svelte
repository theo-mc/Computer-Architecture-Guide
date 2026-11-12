<script>
  import { richHtml } from '@/utils/actions.js';
  import { srcChip } from '@/utils/refs.js';

  let { block } = $props();
  let active = $state(0);
</script>

<figure class="figst sblock" data-src={block.src || ''}>
  {#if block.src}
    <div class="chips">{@html srcChip(block.src, block.ref)}</div>
  {/if}
  {#if block.title}
    <div class="figst-t">{@html block.title}</div>
  {/if}
  <div class="figst-btns" role="tablist">
    {#each block.states as st, k}
      <button
        type="button"
        role="tab"
        aria-selected={active === k}
        onclick={() => (active = k)}
      >
        {@html st[0]}
      </button>
    {/each}
  </div>
  <div class="figst-panes">
    {#each block.states as st, k}
      <div class="figst-p" class:off={active !== k}>
        <div use:richHtml={st[1]}></div>
        {#if st[2]}
          <div class="figst-note" use:richHtml={st[2]}></div>
        {/if}
      </div>
    {/each}
  </div>
  {#if block.caption}
    <figcaption class="caption fig" use:richHtml={block.caption}></figcaption>
  {/if}
</figure>
