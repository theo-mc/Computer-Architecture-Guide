<script>
  // Minimal modal: backdrop + positioned panel. Escape or backdrop click closes it.
  let { open = $bindable(false), dim = 0.25, z = 70, high = false, width = 'min(1080px,calc(100vw - 32px))', children } = $props();
</script>

<svelte:window onkeydown={(e) => open && e.key === 'Escape' && (open = false)} />

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="modal-bg" style:background="rgb(0 0 0 / {dim})" style:z-index={z} class:high onmousedown={(e) => e.target === e.currentTarget && (open = false)}>
    <div class="modal-panel" role="dialog" aria-modal="true" style:width>
      {@render children()}
    </div>
  </div>
{/if}
