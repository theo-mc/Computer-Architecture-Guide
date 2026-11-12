<script>
  import { untrack } from 'svelte';
  import SingleCycleDatapath from './SingleCycleDatapath.svelte';
  import ThreeClockDatapath from './ThreeClockDatapath.svelte';

  let { opts = {} } = $props();

  let view = $state(untrack(() => (opts.view === 'three' ? 'three' : 'sc')));
</script>

<div class="dpx">
  <div class="dpx-tabs" role="tablist">
    <button
      type="button"
      role="tab"
      aria-selected={view === 'sc'}
      onclick={() => (view = 'sc')}
    >
      Single-cycle · every control wire
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={view === 'three'}
      onclick={() => (view = 'three')}
    >
      Single-cycle vs multi-cycle vs pipelined
    </button>
  </div>
  <div class="dpx-body">
    {#if view === 'sc'}
      <SingleCycleDatapath {opts} />
    {:else}
      <ThreeClockDatapath opts={{ mode: opts.mode || 'single', prog: opts.prog, lat: opts.lat }} />
    {/if}
  </div>
</div>
