<script>
  import { app } from '@/stores/app.svelte.js';
  import { router } from '@/stores/router.svelte.js';
  import { vim } from '@/stores/vim.svelte.js';
  import { NF } from '@/utils/refs.js';

  let currentIdx = $derived(app.s.tabs.indexOf(router.route));
</script>

<div id="tabs">
  <button
    type="button"
    class="tl-menu"
    aria-label="File tree"
    onclick={() => (vim.navOpen = !vim.navOpen)}
  >☰</button>
  <div class="tl-off">
    <span>{app.s.tree ? NF.tree + '  Explorer' : ''}</span>
  </div>
  <div class="bufs">
    {#each app.s.tabs as x, i (x)}
      {@const pi = router.pageInfo(x)}
      {@const p = pi.t ? app.progress(pi.t) : null}
      {@const isLua = /\.lua$/.test(pi.file)}
      <span
        class="buf"
        class:cur={x === router.route}
        role="button"
        tabindex="0"
        onclick={() => router.go(x)}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.go(x); } }}
      >
        <span class="bn">{i + 1}</span>
        <span class="fi" class:lua={isLua} class:md={!isLua}>{isLua ? NF.lua : NF.md}</span>
        <span class="bname">{pi.file}</span>
        {#if p && p.n > 0 && p.n < p.tot}
          <span class="mod" title="partly attempted">●</span>
        {:else if p && p.tot && p.n === p.tot}
          <span class="ok" title="all attempted">✔</span>
        {/if}
        <span
          class="x"
          role="button"
          tabindex="-1"
          title="close buffer (:q)"
          onclick={(e) => {
            e.stopPropagation();
            app.closeTab(x, router.route, (r) => router.go(r));
          }}
        >×</span>
      </span>
    {/each}
  </div>
  <div class="tl-right">
    <span class="tl-count">{currentIdx + 1}/{app.s.tabs.length}</span>
    <button type="button" class="tl-btn" title="Find (Space f)" onclick={() => vim.openFinder()}>
      {NF.find} find
    </button>
    <button
      type="button"
      class="tl-btn"
      title="Toggle background (Space b)"
      onclick={() => app.setTheme(app.darkNow ? 'light' : 'dark')}
    >
      {app.darkNow ? NF.moon : NF.sun}<span class="tl-lbl">{app.darkNow ? ' night' : ' day'}</span>
    </button>
  </div>
</div>
