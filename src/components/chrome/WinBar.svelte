<script>
  import { router } from '@/stores/router.svelte.js';
  import { vim } from '@/stores/vim.svelte.js';
  import { NF } from '@/utils/refs.js';

  let pi = $derived(router.info);
  let parts = $derived.by(() => {
    const out = [['dir', 'csc3058']];
    for (const c of pi.crumb) out.push(['dir', c]);
    out.push(['file', pi.file]);
    if (vim.winSec) out.push(['h2', vim.winSec]);
    if (vim.winStep) out.push(['h3', vim.winStep]);
    return out;
  });
</script>

<div class="winbar" id="winbar">
  {#each parts as p, i}
    {#if i > 0}<i class="sep">›</i>{/if}
    <span class="wb-{p[0]}" class:wl={i === parts.length - 1}>
      {#if p[0] === 'h2'}
        <i class="wbi">§</i>{' '}
      {:else if p[0] === 'h3'}
        <i class="wbi">¶</i>{' '}
      {:else if p[0] === 'file'}
        <i class="wbi" class:lua={/\.lua$/.test(p[1])} class:md={!/\.lua$/.test(p[1])}>
          {(/\.lua$/).test(p[1]) ? NF.lua : NF.md}
        </i>{' '}
      {/if}{p[1]}
    </span>
  {/each}
</div>
