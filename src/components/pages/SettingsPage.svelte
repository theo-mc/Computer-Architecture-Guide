<script>
  import { app } from '@/stores/app.svelte.js';
  import { notify } from '@/stores/notify.svelte.js';
  import KeymapsTable from '@/components/chrome/KeymapsTable.svelte';

  let tt = $derived(app.totals());

  function resetProgress() {
    let ok = false;
    try {
      ok = window.confirm('Clear every "Attempted" tick?');
    } catch (e) {}
    if (ok) {
      app.resetDone();
      notify('progress cleared');
    }
  }
</script>

<div class="page">
  <header class="page-head">
    <h1 class="page-title"><span class="hmark">#</span>init.lua</h1>
    <p class="lede">
      Settings for this site. They're saved in this browser along with your “Attempted” ticks.
    </p>
  </header>

  <pre class="code lua"><span class="cm">-- background</span>
<span class="op">vim</span>.o.background = <button type="button" class="lua-v" class:on={app.s.theme === 'dark'} onclick={() => app.setTheme('dark')}>"dark"</button> <button type="button" class="lua-v" class:on={app.s.theme === 'light'} onclick={() => app.setTheme('light')}>"light"</button> <button type="button" class="lua-v" class:on={app.s.theme === 'system'} onclick={() => app.setTheme('system')}>"auto"</button>
<span class="op">vim</span>.o.relativenumber = <button type="button" class="lua-v on" onclick={() => app.toggleRel()}>{app.s.rel ? 'true' : 'false'}</button>
<span class="cm">-- progress: {tt.n} of {tt.tot} questions attempted</span>
<span class="op">require</span>(<span class="nm">"progress"</span>).reset() <button type="button" class="lua-v danger" onclick={resetProgress}>:reset!</button></pre>

  <h2 class="sec-title"><span class="hmark">##</span><span class="st">Keymaps</span></h2>
  <div class="card flush">
    <KeymapsTable />
  </div>
</div>
