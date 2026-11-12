<script>
  import { richHtml } from '$utils/actions.js';
  import ToolSlot from '$lib/components/content/ToolSlot.svelte';

  let { lab } = $props();
</script>

<div class="page wide">
  <header class="page-head">
    <h1 class="page-title"><span class="hmark">#</span>{lab.title}</h1>
    <p class="lede" use:richHtml={lab.desc}></p>
  </header>
  {#if lab.intro}
    <div class="card">
      <div class="prose" use:richHtml={lab.intro}></div>
    </div>
  {/if}
  <ToolSlot kind="tool" name={lab.tool} opts={lab.opts || {}} showHelp={false} eager={true} />
</div>
