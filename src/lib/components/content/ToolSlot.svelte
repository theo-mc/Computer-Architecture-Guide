<script>
  import { TOOL_HELP } from '$data/index.js';
  import { SLOT_H, saveSlotH, slotKey } from '$utils/layout.js';
  import { richHtml } from '$utils/actions.js';
  import ToolHost from '$lib/components/tools/ToolHost.svelte';
  import FormulaVisualiser from '$lib/components/tools/FormulaVisualiser.svelte';

  let { kind = 'tool', name, opts = {}, showHelp = true, eager = false } = $props();

  let slotEl = $state(null);
  let mounted = $state(eager);

  let hp = $derived(kind === 'tool' ? TOOL_HELP[name] : null);
  let ex = $derived(opts && opts.exam);
  let keyName = $derived(kind === 'fx' ? 'fx:' + name : name);

  let initialMinHeight = $derived(mounted ? '' : (SLOT_H[slotKey(keyName)] || 320) + 'px');

  $effect(() => {
    if (eager) {
      mounted = true;
      return;
    }
    if (!slotEl || mounted) return;

    let idleId = 0;
    let obs = null;

    const mountNow = () => {
      if (mounted) return;
      mounted = true;
      if (obs) {
        obs.disconnect();
        obs = null;
      }
      if (idleId) {
        if (window.cancelIdleCallback) window.cancelIdleCallback(idleId);
        else clearTimeout(idleId);
        idleId = 0;
      }
    };

    if (window.IntersectionObserver) {
      obs = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) mountNow();
        },
        { rootMargin: '1200px 0px 1200px 0px' }
      );
      obs.observe(slotEl);
    } else {
      mountNow();
    }

    const ric = window.requestIdleCallback || ((fn) => setTimeout(fn, 60));
    idleId = ric(mountNow, { timeout: 1500 });

    return () => {
      if (obs) obs.disconnect();
      if (idleId) {
        if (window.cancelIdleCallback) window.cancelIdleCallback(idleId);
        else clearTimeout(idleId);
      }
    };
  });

  $effect(() => {
    if (!mounted || !slotEl) return;
    requestAnimationFrame(() => {
      if (!slotEl) return;
      const h = slotEl.getBoundingClientRect().height;
      if (h > 40) {
        SLOT_H[slotKey(keyName)] = Math.round(h);
        saveSlotH();
      }
    });
  });
</script>

{#if showHelp && (hp || ex)}
  <details class="toolhelp" data-resize>
    <summary>
      <span class="th-k">How to use it</span>
      {#if hp && hp.assume}<span class="th-a">· model assumptions</span>{/if}
      {#if ex}<span class="th-x">· exam link: {@html ex}</span>{/if}
    </summary>
    <div class="prose" use:richHtml={(hp ? hp.how : '') + (hp && hp.assume ? `<p class="th-as"><b>Assumes:</b> ${hp.assume}</p>` : '') + (ex ? `<p class="th-as"><b>Try it on:</b> ${ex}</p>` : '')}></div>
  </details>
{/if}

<div
  bind:this={slotEl}
  class="{kind === 'fx' ? 'fx-slot' : 'tool-slot'}"
  class:slot-wait={!mounted}
  style:min-height={initialMinHeight}
>
  {#if mounted}
    {#if kind === 'fx'}
      <FormulaVisualiser id={name} {opts} />
    {:else}
      <ToolHost {name} {opts} />
    {/if}
  {/if}
</div>
