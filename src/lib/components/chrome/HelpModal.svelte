<script>
  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import { Button } from '$lib/components/ui/button/index.js';
  import KeymapsTable from './KeymapsTable.svelte';
  import { vim } from '$stores/vim.svelte.js';

  function onKeydown(e) {
    if (e.key === 'q') {
      e.preventDefault();
      e.stopPropagation();
      vim.helpOpen = false;
    }
  }
</script>

<Dialog.Root bind:open={vim.helpOpen}>
  <Dialog.Content
    overlayClass="bg-black/30 z-[80]"
    class="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[81] w-[min(720px,calc(100vw-32px))]"
    onkeydown={onKeydown}
  >
    <div class="help-box">
      <Dialog.Title class="help-title">:help csc3058</Dialog.Title>
      <div class="help-h">
        <b>Keymaps</b>
        <Button variant="default" size="sm" onclick={() => (vim.helpOpen = false)}>q close</Button>
      </div>
      <KeymapsTable />
    </div>
  </Dialog.Content>
</Dialog.Root>
