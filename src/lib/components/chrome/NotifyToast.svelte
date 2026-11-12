<script>
  import { notifyStore } from '$stores/notify.svelte.js';
</script>

<div id="notify" class:show={notifyStore.show}>
  {#if notifyStore.html}
    <div class="nt {notifyStore.kind}">
      <div class="nt-h">
        <span class="nt-i">{notifyStore.kind === 'err' ? '✗' : 'ℹ'}</span>
        {notifyStore.kind === 'err' ? 'Error' : 'Info'}
      </div>
      <div class="nt-b">{@html notifyStore.html}</div>
    </div>
  {/if}
</div>
