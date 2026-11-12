<script>
  import { TOOL_HELP } from '@/data/index.js';
  import { SLOT_H, saveSlotH, slotKey } from '@/utils/layout.js';
  import { richHtml } from '@/utils/actions.js';
  import ToolHost from '@/components/tools/ToolHost.svelte';
  import FormulaVisualiser from '@/components/tools/FormulaVisualiser.svelte';

  let { kind = 'tool', name, opts = {}, showHelp = true, eager = false } = $props();

  let slotEl = $state(null);
  // eager is only read once on purpose: it decides whether the tool mounts on first render.
  // svelte-ignore state_referenced_locally
  let mounted = $state(eager);

  let hp = $derived(kind === 'tool' ? TOOL_HELP[name] : null);
  let ex = $derived(opts && opts.exam);
  let keyName = $derived(kind === 'fx' ? 'fx:' + name : name);

  let initialMinHeight = $derived(mounted ? '' : (SLOT_H[slotKey(keyName)] || 320) + 'px');

  // Mount a tool only when its slot is near the viewport.
  $effect(() => {
    if (eager) {
      mounted = true;
      return;
    }
    if (!slotEl || mounted) return;
    if (!window.IntersectionObserver) {
      mounted = true;
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          mounted = true;
          obs.disconnect();
        }
      },
      { rootMargin: '600px 0px' }
    );
    obs.observe(slotEl);
    return () => obs.disconnect();
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
