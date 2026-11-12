<script>
  import { TOPICS, byTopicId } from '$data/index.js';
  import { app } from '$stores/app.svelte.js';
  import { vim } from '$stores/vim.svelte.js';
  import { chip } from '$utils/refs.js';
  import { pad2 } from '$utils/html.js';
  import { applyV3Layout } from '$utils/layout.js';
  import { richHtml } from '$utils/actions.js';
  import BlockRenderer from '$lib/components/content/BlockRenderer.svelte';
  import QuestionList from '$lib/components/content/QuestionList.svelte';

  let { topic } = $props();

  let p = $derived(app.progress(topic));
  let idx = $derived(TOPICS.indexOf(topic));
  let prevTopic = $derived(idx > 0 ? TOPICS[idx - 1] : null);
  let nextTopic = $derived(idx >= 0 && idx < TOPICS.length - 1 ? TOPICS[idx + 1] : null);

  let nextObj = $derived(idx >= 0 ? TOPICS[idx + 1] : null);

  $effect(() => {
    app.setLastTopic(topic.id);
  });

  function jumpToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    vim.scrollLock = performance.now() + 900;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    vim.cursorTo(el);
  }

  function toggleFold(stepNum) {
    app.toggleFold(topic.id, stepNum);
    requestAnimationFrame(() => {
      applyV3Layout();
      const st = document.getElementById('st-' + stepNum);
      const keep = st && st.querySelector('.step-title');
      vim.buildLines();
      if (keep) {
        const i = vim.curLines.indexOf(keep);
        if (i >= 0) vim.setCursor(i);
      }
    });
  }

  function jumpStep(stepNum) {
    if (app.isFolded(topic.id, stepNum)) {
      app.toggleFold(topic.id, stepNum, false);
    }
    requestAnimationFrame(() => {
      applyV3Layout();
      vim.buildLines();
      jumpToId('st-' + stepNum);
    });
  }

  let pendingText = $derived.by(() => {
    if (!topic.pending) return '';
    const refMatch = (topic.taught || '').match(/P&H §[\d.–, ]+\d/);
    const ref = refMatch ? refMatch[0] : 'P&H';
    return `${topic.lectures.join(', ')} haven’t been delivered. Until they are, this topic follows the textbook (${ref}). Expect the slides to add detail and possibly change emphasis; Test 2 only.`;
  });
</script>

<div class="page topic" style="counter-reset: fig 0 tab 0 tnum {topic.num}">
  <header class="page-head">
    <div class="fm">
      <span class="fm-d">---</span>
      <span><span class="fm-k">topic:</span> {pad2(topic.num)}</span>
      <span><span class="fm-k">week:</span> {topic.weekLabel || topic.week}</span>
      <span><span class="fm-k">lectures:</span> [{topic.lectures.join(', ')}]</span>
      <span>
        <span class="fm-k">tests:</span>
        {@html (topic.tests || [1, 2]).map((n) => chip('t' + n, 'Test ' + n)).join('')}
      </span>
      <span><span class="fm-k">progress:</span> <span data-pcount>{p.n}/{p.tot}</span></span>
      <span class="fm-d">---</span>
    </div>
    <h1 class="page-title"><span class="hmark">#</span>{topic.title}</h1>
    <p class="lede" use:richHtml={topic.overview.lede || ''}></p>
    {#if topic.pending}
      <div class="callout pending">
        <div class="callout-h">Written from the textbook · slides not released yet</div>
        <div class="prose"><p>{pendingText}</p></div>
      </div>
    {/if}
  </header>

  <nav class="toc" aria-label="On this page">
    {#each [
      ['ov', 'Overview'],
      ['no', 'Notation'],
      ['ex', 'Explanation'],
      ['kp', 'Key points'],
      ['tr', 'Exam traps'],
      ['pq', 'Practice']
    ] as [id, label]}
      <a
        href="#{topic.id}"
        onclick={(e) => {
          e.preventDefault();
          jumpToId('s-' + id);
        }}
      >{label}</a>
    {/each}
  </nav>

  <section class="sec" id="s-ov">
    <h2 class="sec-title"><span class="hmark">##</span><span class="st">Overview</span></h2>
    <div class="card ovcard">
      <div class="prose" use:richHtml={topic.overview.about}></div>
      <div class="ov-rows">
        <div class="ovr">
          <div class="ovk">can_do</div>
          <ul class="cando">
            {#each topic.overview.canDo as c}
              <li use:richHtml={c}></li>
            {/each}
          </ul>
        </div>
        <div class="ovr">
          <div class="ovk">builds_on</div>
          <div class="links">
            {#if topic.overview.buildsOn && topic.overview.buildsOn.length}
              {#each topic.overview.buildsOn as id}
                {@const b = byTopicId(id)}
                {#if b}
                  <a class="lnk" href="#{b.id}">{pad2(b.num)}-{b.file}.md</a>
                {:else}
                  <span>{id}</span>
                {/if}
              {/each}
            {:else}
              <span class="muted">nothing — this is a starting point</span>
            {/if}
          </div>
        </div>
        <div class="ovr">
          <div class="ovk">taught_in</div>
          <div use:richHtml={topic.taught}></div>
        </div>
        {#if nextObj}
          <div class="ovr">
            <div class="ovk">next</div>
            <div>
              <a class="lnk" href="#{nextObj.id}">{pad2(nextObj.num)}-{nextObj.file}.md</a>
              {#if topic.nextWhy}
                {' '}<span class="muted" use:richHtml={'— ' + topic.nextWhy}></span>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </section>

  <section class="sec" id="s-no">
    <h2 class="sec-title"><span class="hmark">##</span><span class="st">Notation</span></h2>
    {#if topic.notationNote}
      <div class="callout notenote">
        <div class="callout-h">Notation note</div>
        <div class="prose" use:richHtml={topic.notationNote}></div>
      </div>
    {/if}
    <div class="card flush">
      <div class="tbl-wrap">
        <table class="t notation">
          <thead>
            <tr><th>Symbol / term</th><th>Meaning</th><th>Units · example</th></tr>
          </thead>
          <tbody>
            {#each topic.notation as r}
              <tr>
                <td use:richHtml={r[0]}></td>
                <td use:richHtml={r[1]}></td>
                <td use:richHtml={r[2] || ''}></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <section class="sec" id="s-ex">
    <h2 class="sec-title">
      <span class="hmark">##</span>
      <span class="st">Explanation</span>
      <span class="sec-hint"><kbd>za</kbd> fold · <kbd>zM</kbd> fold all · <kbd>zR</kbd> open all</span>
    </h2>
    <div class="steps">
      {#each topic.steps as s, i}
        {@const stepNum = i + 1}
        {@const folded = app.isFolded(topic.id, stepNum)}
        <div class="step" class:folded id={'st-' + stepNum}>
          <h3
            class="step-title"
            data-fold={stepNum}
            onclick={(e) => {
              if (!e.target.closest('a')) toggleFold(stepNum);
            }}
          >
            <span class="hmark">###</span>
            <span class="foldc">{folded ? '▸' : '▾'}</span>
            <span class="step-n">{stepNum}</span>
            <span class="stt" use:richHtml={s.title}></span>
            {#if s.ref}<span class="ref">{s.ref}</span>{/if}
          </h3>
          <div class="fold-line" data-fold={stepNum} onclick={() => toggleFold(stepNum)}>
            ··· {s.blocks.length} block{s.blocks.length === 1 ? '' : 's'} folded · <kbd>za</kbd> to open
          </div>
          <div class="step-body">
            {#each s.blocks as b}
              <BlockRenderer block={b} />
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </section>

  <div class="wrapup">
    <section class="sec" id="s-kp">
      <h2 class="sec-title"><span class="hmark">##</span><span class="st">Key points</span></h2>
      <div class="card list">
        <ul class="rows kp">
          {#each topic.keyPoints as x}
            <li use:richHtml={x}></li>
          {/each}
        </ul>
      </div>
    </section>

    <section class="sec" id="s-tr">
      <h2 class="sec-title"><span class="hmark">##</span><span class="st">Exam traps</span></h2>
      <div class="card list">
        <ul class="rows traps">
          {#each topic.traps as x}
            <li use:richHtml={x}></li>
          {/each}
        </ul>
      </div>
    </section>
  </div>

  <section class="sec" id="s-pq">
    <h2 class="sec-title">
      <span class="hmark">##</span>
      <span class="st">Practice questions</span>
      <span class="sec-hint"><kbd>Enter</kbd> answer · <kbd>x</kbd> attempted</span>
    </h2>
    <QuestionList {topic} onJumpStep={jumpStep} />
  </section>

  <nav class="pager">
    {#if prevTopic}
      <a href="#{prevTopic.id}" class="pg prev">
        <span class="pg-k">[b previous</span>
        <span class="pg-t">{pad2(prevTopic.num)}-{prevTopic.file}.md</span>
      </a>
    {:else}
      <span></span>
    {/if}
    {#if nextTopic}
      <a href="#{nextTopic.id}" class="pg next">
        <span class="pg-k">]b next</span>
        <span class="pg-t">{pad2(nextTopic.num)}-{nextTopic.file}.md</span>
      </a>
    {:else}
      <a href="#formulas" class="pg next">
        <span class="pg-k">]b next</span>
        <span class="pg-t">99-formula-sheet.md</span>
      </a>
    {/if}
  </nav>
</div>
