<script>
  import { Button } from '$lib/components/ui/button/index.js';
  import { richHtml } from '$utils/actions.js';
  import { vim } from '$stores/vim.svelte.js';

  let { block } = $props();
  let open = $state(false);
  let seq = $derived(block.id || (block.q || '').length);

  function toggle() {
    open = !open;
    requestAnimationFrame(() => vim.buildLines());
  }
</script>

<div class="check" id={'ck' + seq}>
  <div class="check-h">Check yourself</div>
  <div class="prose" use:richHtml={block.q}></div>
  <Button variant="default" size="sm" onclick={toggle}>
    {open ? 'Hide' : 'Reveal'}
  </Button>
  <div class="check-a" hidden={!open}>
    {#if open}
      <div class="prose" use:richHtml={block.a}></div>
    {/if}
  </div>
</div>
