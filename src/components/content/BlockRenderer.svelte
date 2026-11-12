<script>
  import { esc } from '@/utils/html.js';
  import { asm } from '@/utils/hl.js';
  import { srcChip } from '@/utils/refs.js';
  import { richHtml } from '@/utils/actions.js';
  import StepsList from './StepsList.svelte';
  import CheckBlock from './CheckBlock.svelte';
  import SortBlock from './SortBlock.svelte';
  import StatesFigure from './StatesFigure.svelte';
  import ToolSlot from './ToolSlot.svelte';

  let { block } = $props();
</script>

{#if block.t === 'p'}
  <div class="sblock" data-src={block.src}>
    <div class="chips">{@html srcChip(block.src, block.ref)}</div>
    <div class="prose" use:richHtml={block.html}></div>
  </div>
{:else if block.t === 'x'}
  <div class="prose expl" use:richHtml={block.html}></div>
{:else if block.t === 'bg'}
  <details class="bgblock">
    <summary>
      <span class="bg-tag">Background · not examined</span>
      <span class="bg-title">{block.title}</span>
      {#if block.ref}<span class="ref">{block.ref}</span>{/if}
    </summary>
    <div class="prose" use:richHtml={block.html}></div>
  </details>
{:else if block.t === 'tip'}
  <div class="callout tip">
    <div class="callout-h">Tip</div>
    <div class="prose" use:richHtml={block.html}></div>
  </div>
{:else if block.t === 'key'}
  <div class="callout key">
    <div class="callout-h">{@html block.title || 'Key idea'}</div>
    <div class="prose" use:richHtml={block.html}></div>
  </div>
{:else if block.t === 'analogy'}
  <div class="callout analogy">
    <div class="callout-h">{@html block.title || 'Analogy'}</div>
    <div class="prose" use:richHtml={block.html}></div>
  </div>
{:else if block.t === 'warn'}
  <div class="callout warnc">
    <div class="callout-h">{@html block.title || 'Careful'}</div>
    <div class="prose" use:richHtml={block.html}></div>
  </div>
{:else if block.t === 'derive'}
  <div class="callout derive">
    <div class="callout-h">{@html block.title || 'Why the rule works'}</div>
    <div class="prose" use:richHtml={block.html}></div>
  </div>
{:else if block.t === 'check'}
  <CheckBlock {block} />
{:else if block.t === 'worked'}
  <div class="worked">
    <div class="worked-h">
      <span class="worked-tag">Worked example</span>
      <span class="worked-title">{@html block.title || ''}</span>
      {#if block.src}{@html srcChip(block.src, block.ref)}{/if}
    </div>
    <div class="worked-b">
      {#if block.ctx}
        <div class="wctx">
          <span class="wlab">Context</span>
          <div use:richHtml={block.ctx}></div>
        </div>
      {/if}
      {#if block.given}
        <div class="given">
          <span class="wlab">Problem</span>
          <div use:richHtml={block.given}></div>
        </div>
      {/if}
      <StepsList steps={block.steps} />
      {#if block.result}
        <div class="result" use:richHtml={block.result}></div>
      {/if}
    </div>
  </div>
{:else if block.t === 'dis'}
  <div class="disagree" id={'dis-' + (block.id || '')}>
    <div class="disagree-h">
      <span class="dis-tag">Sources disagree</span>
      {#if block.title}<span>{@html block.title}</span>{/if}
    </div>
    <ul>
      {#each block.items as item}
        <li use:richHtml={`<b>${item[0]}:</b> ${item[1]}`}></li>
      {/each}
    </ul>
    <div class="likely" use:richHtml={`<b>Most likely on the test:</b> ${block.likely}`}></div>
  </div>
{:else if block.t === 'tbl'}
  <div class="sblock tblock" data-src={block.src || ''}>
    {#if block.src}
      <div class="chips">{@html srcChip(block.src, block.ref)}</div>
    {/if}
    <div class="tbl-wrap" use:richHtml={`<table class="t ${block.cls || ''}"><thead><tr>${block.head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${block.rows.map((r) => '<tr>' + r.map((c) => `<td>${c}</td>`).join('') + '</tr>').join('')}</tbody></table>`}></div>
    {#if block.caption}
      <div class="caption tab" use:richHtml={block.caption}></div>
    {/if}
  </div>
{:else if block.t === 'dia'}
  <div class="sblock dblock" data-src={block.src || ''}>
    {#if block.src}
      <div class="chips">{@html srcChip(block.src, block.ref)}</div>
    {/if}
    <div class="dia" class:has-ascii={!!block.ascii} class:ascii-only={!block.svg}>
      {#if block.svg}{@html block.svg}{/if}
      {#if block.ascii}<pre class="ascii">{block.ascii}</pre>{/if}
      {#if block.caption}<div class="caption fig" use:richHtml={block.caption}></div>{/if}
    </div>
  </div>
{:else if block.t === 'code'}
  <div class="sblock cblock" data-src={block.src || ''}>
    {#if block.src}
      <div class="chips">{@html srcChip(block.src, block.ref)}</div>
    {/if}
    <div class="codewin">
      <div class="codewin-h">
        <span class="cw-lang">mips</span>
        <span class="cw-file">{block.file || 'assembly'}</span>
      </div>
      <pre class="code">{@html asm(block.code)}</pre>
    </div>
    {#if block.caption}
      <div class="caption" use:richHtml={block.caption}></div>
    {/if}
  </div>
{:else if block.t === 'recipe'}
  <div class="recipe">
    <div class="recipe-h">
      <span class="recipe-tag">Method</span>
      <span class="recipe-title">{@html block.title}</span>
      {#if block.for}<span class="recipe-for">for {@html block.for}</span>{/if}
    </div>
    <ol class="recipe-steps">
      {#each block.steps as x}
        <li><div use:richHtml={x}></div></li>
      {/each}
    </ol>
    {#if block.back}
      <div class="recipe-back" use:richHtml={block.back}></div>
    {/if}
  </div>
{:else if block.t === 'read'}
  <div class="readal">
    <div class="readal-h">Read it aloud</div>
    {#each block.rows as r}
      <div class="ra-row">
        <span class="ra-c">
          {#if /^\s*(<|\\\()/.test(r[0])}
            <span use:richHtml={r[0]}></span>
          {:else}
            <code class="asm">{@html asm(r[0])}</code>
          {/if}
        </span>
        <span class="ra-s" use:richHtml={`“${r[1]}”`}></span>
      </div>
    {/each}
  </div>
{:else if block.t === 'sort'}
  <SortBlock {block} />
{:else if block.t === 'states'}
  <StatesFigure {block} />
{:else if block.t === 'tool'}
  <ToolSlot kind="tool" name={block.name} opts={block.opts} />
{:else if block.t === 'fx'}
  <ToolSlot kind="fx" name={block.id} opts={block.opts} />
{/if}
