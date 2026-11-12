<script>
  import { app } from '@/stores/app.svelte.js';
  import { vim } from '@/stores/vim.svelte.js';
  import { notify } from '@/stores/notify.svelte.js';
  import { KIND, DIFF, NF, chip, needFor } from '@/utils/refs.js';
  import { richHtml } from '@/utils/actions.js';
  import StepsList from './StepsList.svelte';

  const QI = { ans: '◉', off: NF.grad, all: NF.list, step: '»', next: '▸', rest: '⇣' };

  let { topic, q, index, onJumpStep } = $props();

  let showAns = $state(false);
  let showOff = $state(false);
  let workMode = $state(''); // '' | 'all' | 'step'
  let stepLimit = $state(1);

  let qKey = $derived(app.qKey(topic, q));
  let done = $derived(!!app.s.done[qKey]);
  let needs = $derived(needFor(topic, q));
  let totalSteps = $derived((q.steps || []).length);

  function toggleDone(e) {
    const checked = e.currentTarget.checked;
    app.toggleDone(qKey, checked);
    const tt = app.totals();
    notify((checked ? 'Marked attempted' : 'Unmarked') + ` · ${tt.n}/${tt.tot} overall`);
  }

  function toggleWork(mode) {
    if (workMode === mode) {
      workMode = '';
    } else {
      workMode = mode;
      if (mode === 'step') stepLimit = 1;
    }
  }
</script>

<article class="q" class:done data-qi={index} id={'q-' + q.id}>
  <div class="q-top">
    <label class="attempt" title="Mark as attempted (x)">
      <input type="checkbox" data-act="done" checked={done} onchange={toggleDone} />
      <span class="sw" aria-hidden="true"></span>
    </label>
    <span class="q-id">Q{index + 1}</span>
    {@html chip(q.kind, KIND[q.kind])}
    {@html chip(q.diff, DIFF[q.diff])}
    <span class="q-src">
      {q.src || (q.kind === 'ai' ? 'AI-written in the official style' : 'Wildcard — a new angle')}
    </span>
  </div>

  <div class="q-body prose" use:richHtml={q.q}></div>

  {#if needs.length}
    <div class="need">
      <span class="need-k">you need</span>
      {#each needs as [stepNum, st]}
        <a
          class="need-a"
          href={'#' + topic.id}
          title={`Jump to explanation step ${stepNum}${st.ref ? ' · ' + st.ref : ''}`}
          onclick={(e) => {
            e.preventDefault();
            onJumpStep?.(stepNum);
          }}
        >
          <span class="need-n">{stepNum}</span>
          <span class="need-t">{@html st.title}</span>
        </a>
      {/each}
    </div>
  {/if}

  <div class="qbtns q-actions">
    <div class="qsplit qs-ans" role="group" aria-label="Answer">
      <button
        type="button"
        class="qb qb-ans"
        data-act="ans"
        aria-pressed={showAns}
        onclick={() => (showAns = !showAns)}
      >
        <i class="qi">{QI.ans}</i><span>Answer</span>
      </button>
      <button
        type="button"
        class="qb qb-off"
        data-act="off"
        aria-pressed={showOff}
        disabled={!q.official}
        title={q.official
          ? 'The official solution, word for word'
          : 'No official solution: this question was written for these notes'}
        onclick={() => (showOff = !showOff)}
      >
        <i class="qi">{QI.off}</i><span>Official</span>
      </button>
    </div>

    <div class="qsplit qs-work" role="group" aria-label="Working">
      <button
        type="button"
        class="qb qb-all"
        data-act="all"
        aria-pressed={workMode === 'all'}
        title="The full working at once"
        onclick={() => toggleWork('all')}
      >
        <i class="qi">{QI.all}</i><span>Working</span>
      </button>
      <button
        type="button"
        class="qb qb-step"
        data-act="step"
        aria-pressed={workMode === 'step'}
        title="Reveal the working one step at a time"
        onclick={() => toggleWork('step')}
      >
        <i class="qi">{QI.step}</i><span>Step by step</span>
      </button>
    </div>

    <span class="q-taught">taught in {q.taught || 'reference not found'}</span>
  </div>

  <div class="reveal" data-r="ans" hidden={!showAns}>
    {#if showAns}
      <div class="result" use:richHtml={q.ans}></div>
    {/if}
  </div>

  <div class="reveal" data-r="work" hidden={!workMode}>
    {#if workMode}
      <div class="work-h">{workMode === 'step' ? 'Step by step' : 'Full working'}</div>
      <StepsList
        steps={q.steps || []}
        check={q.check}
        limit={workMode === 'step' ? stepLimit : null}
      />
      {#if workMode === 'step'}
        <div class="qstep-nav">
          <button
            type="button"
            class="qb qb-next"
            data-act="next"
            disabled={stepLimit >= totalSteps}
            onclick={() => {
              if (stepLimit < totalSteps) stepLimit++;
            }}
          >
            <span>Next step</span><i class="qi">{QI.next}</i>
          </button>
          <button
            type="button"
            class="qb qb-rest"
            data-act="rest"
            disabled={stepLimit >= totalSteps}
            onclick={() => {
              stepLimit = totalSteps;
            }}
          >
            <i class="qi">{QI.rest}</i><span>Show the rest</span>
          </button>
          <span class="qstep-c">step {stepLimit} of {totalSteps}</span>
        </div>
      {/if}
    {/if}
  </div>

  <div class="reveal" data-r="off" hidden={!showOff}>
    {#if showOff && q.official}
      <div class="official">
        <div class="official-h">Official answer, word for word · {q.src}</div>
        <div class="verb" use:richHtml={q.official}></div>
      </div>
      {#if q.offNote}
        <div class="callout key">
          <div class="callout-h">Note</div>
          <div class="prose" use:richHtml={q.offNote}></div>
        </div>
      {/if}
    {/if}
  </div>
</article>
