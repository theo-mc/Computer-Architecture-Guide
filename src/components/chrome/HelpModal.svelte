<script>
  import Modal from './Modal.svelte';
  import KeymapsTable from './KeymapsTable.svelte';
  import { vim } from '@/stores/vim.svelte.js';

  function onKeydown(e) {
    if (vim.helpOpen && e.key === 'q') {
      e.preventDefault();
      vim.helpOpen = false;
    }
  }
</script>

<svelte:window onkeydowncapture={onKeydown} />

<Modal bind:open={vim.helpOpen} dim={0.3} z={81} width="min(720px,calc(100vw - 32px))">
    <div class="help-box">
      <h2 class="help-title">:help csc3058</h2>
      <div class="help-h">
        <b>Keymaps</b>
        <button type="button" class="btn sm" onclick={() => (vim.helpOpen = false)}>q close</button>
      </div>
      <KeymapsTable />
    </div>
</Modal>
