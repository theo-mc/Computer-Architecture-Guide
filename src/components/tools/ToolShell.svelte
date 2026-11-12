<script>
  import { holdCardHeight } from '@/utils/actions.js';

  let { title, sub = '', className = '', children } = $props();
</script>

<div class="tool {className}" use:holdCardHeight>
  <div class="tool-h">
    {@html title}{#if sub}<span class="sub">{sub}</span>{/if}
  </div>
  <div class="tool-b">
    {@render children?.()}
  </div>
</div>
