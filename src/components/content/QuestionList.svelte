<script>
  import { app } from '@/stores/app.svelte.js';
  import { vim } from '@/stores/vim.svelte.js';
  import { applyV3Layout } from '@/utils/layout.js';
  import QuestionCard from './QuestionCard.svelte';

  const KINDS = [
    ['all', 'All'],
    ['off', 'Official'],
    ['ai', 'AI'],
    ['wild', 'Wildcard']
  ];
  const DIFFS = [
    ['all', 'Any'],
    ['E', 'Easy'],
    ['M', 'Medium'],
    ['H', 'Hard']
  ];

  let { topic, onJumpStep } = $props();

  let filter = $derived(app.getFilter(topic.id));

  let filtered = $derived(
    (topic.questions || [])
      .map((q, i) => ({ q, i }))
      .filter(
        (x) =>
          (filter.kind === 'all' || x.q.kind === filter.kind) &&
          (filter.diff === 'all' || x.q.diff === filter.diff)
      )
  );

  $effect(() => {
    void filtered.length;
    void filter.kind;
    void filter.diff;
    requestAnimationFrame(() => {
      applyV3Layout();
      vim.buildLines();
    });
  });
</script>

<div class="qfilter" id="qfilter">
  <span class="qf-k">kind</span>
  <div class="seg" role="group" aria-label="Question source">
    {#each KINDS as [k, label]}
      {@const count =
        k === 'all'
          ? (topic.questions || []).length
          : (topic.questions || []).filter((q) => q.kind === k).length}
      <button
        type="button"
        aria-pressed={filter.kind === k}
        onclick={() => app.setFilter(topic.id, k, undefined)}
      >
        {label} <span class="cnt">{count}</span>
      </button>
    {/each}
  </div>
  <span class="qf-k">difficulty</span>
  <div class="seg" role="group" aria-label="Difficulty">
    {#each DIFFS as [d, label]}
      <button
        type="button"
        aria-pressed={filter.diff === d}
        onclick={() => app.setFilter(topic.id, undefined, d)}
      >
        {label}
      </button>
    {/each}
  </div>
</div>

<div class="qlist qgrid" id="qlist">
  {#if filtered.length === 0}
    <p class="empty">No questions match this filter.</p>
  {:else}
    {#each filtered as { q, i } (q.id)}
      <QuestionCard {topic} {q} index={i} {onJumpStep} />
    {/each}
  {/if}
</div>
