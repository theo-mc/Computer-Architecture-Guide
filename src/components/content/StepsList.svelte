<script>
  import { richHtml } from '@/utils/actions.js';
  import { autoMath } from '@/utils/math.js';

  let { steps = [], check = null, limit = null } = $props();
</script>

<ol class="ws">
  {#each steps as s, idx}
    {@const hidden = limit != null && idx >= limit}
    <li class:named={!!s[2]} {hidden}>
      {#if s[2]}
        <div class="ws-n">
          <span class="ws-nt">{@html s[2]}</span>
          {#if s[3]}
            <span class="ws-ref" title="where this is taught">{s[3]}</span>
          {/if}
        </div>
      {/if}
      <div class="ws-do" use:richHtml={autoMath(s[0])}></div>
      {#if s[1]}
        <div class="ws-why" use:richHtml={s[1]}></div>
      {/if}
    </li>
  {/each}
</ol>
{#if check}
  <div class="qcheck" hidden={limit != null && limit < steps.length}>
    <span class="qcheck-k">✓ check</span>
    <span class="qc-b" use:richHtml={autoMath(check)}></span>
  </div>
{/if}
