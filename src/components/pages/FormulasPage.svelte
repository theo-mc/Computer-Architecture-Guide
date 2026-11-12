<script>
  import { TOPICS, FORMULAS, MISTAKES, KEYF, FXMAP, byTopicId } from '@/data/index.js';
  import { vim } from '@/stores/vim.svelte.js';
  import { pad2 } from '@/utils/html.js';
  import { richHtml } from '@/utils/actions.js';
  import FormulaVisualiser from '@/components/tools/FormulaVisualiser.svelte';

  let openFx = $state({});

  function jumpTo(id) {
    const el = document.getElementById(id);
    if (!el) return;
    vim.scrollLock = performance.now() + 900;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    vim.cursorTo(el);
  }

  let grouped = $derived.by(() => {
    const groups = {};
    FORMULAS.forEach((f, idx) => {
      (groups[f[0]] = groups[f[0]] || []).push({ f, idx });
    });
    return TOPICS.map((t) => {
      const list = groups[t.id];
      if (!list) return null;
      const sorted = list
        .slice()
        .sort((a, b) => (KEYF.has(b.f[1]) ? 1 : 0) - (KEYF.has(a.f[1]) ? 1 : 0));
      let seenSupport = false;
      const entries = sorted.map((item) => {
        const key = KEYF.has(item.f[1]);
        const showSupHeader = !key && !seenSupport;
        if (!key) seenSupport = true;
        return {
          ...item,
          key,
          showSupHeader,
          fx: FXMAP[item.idx] || null
        };
      });
      return { t, entries };
    }).filter(Boolean);
  });

  let disagreements = $derived.by(() => {
    const out = [];
    TOPICS.forEach((t) =>
      t.steps.forEach((s) =>
        s.blocks.forEach((b) => {
          if (b.t === 'dis') out.push([t, b]);
        })
      )
    );
    return out;
  });
</script>

<div class="page">
  <header class="page-head">
    <div class="ph-t">
      <div class="eyebrow">
        <span>All topics</span><span>Lectures 1–16</span>
      </div>
      <h1 class="page-title"><span class="hmark">#</span>Formula sheet</h1>
      <p class="lede">
        Every formula in the module, what each symbol means, and where it was taught. Each topic has one <b>★ key formula</b> to memorise (shown first, highlighted); the smaller dashed entries under it are <b>supporting formulas</b>: variants, special cases and helpers. Open “Visualise it” under any formula to move sliders and watch the substituted working update. Click a topic name for the full explanation.
      </p>
      <nav class="toc">
        <a href="#formulas" onclick={(e) => { e.preventDefault(); jumpTo('f-list'); }}>Formulas</a>
        <a href="#formulas" onclick={(e) => { e.preventDefault(); jumpTo('f-mist'); }}>Common mistakes</a>
        <a href="#formulas" onclick={(e) => { e.preventDefault(); jumpTo('f-dis'); }}>Where sources disagree</a>
      </nav>
    </div>
  </header>

  <section class="sec" id="f-list">
    <h2 class="sec-title"><span class="hmark">##</span>Formulas</h2>
    {#each grouped as group (group.t.id)}
      <div class="card formula">
        <div class="formula-h">
          <a href="#{group.t.id}">{pad2(group.t.num)} · {group.t.title}</a>
        </div>
        {#each group.entries as { f, idx, key, showSupHeader, fx } (idx)}
          {#if showSupHeader}
            <div class="f-sup-h">
              Supporting formulas <span>variants, special cases and helpers</span>
            </div>
          {/if}
          <div class="fentry" class:f-key={key} class:f-sup={!key} id={'f-' + idx}>
            {#if key}<span class="f-badge">★ Key formula</span>{/if}
            <b>{@html f[1]}</b>
            <div use:richHtml={`\\[${f[2]}\\]`}></div>
            {#if f[3] && f[3].length}
              <dl class="syms">
                {#each f[3] as s}
                  <dt use:richHtml={s[0]}></dt>
                  <dd use:richHtml={s[1]}></dd>
                {/each}
              </dl>
            {/if}
            <span class="ref">{f[4]}</span>
            {#if fx}
              <details
                class="fx-lazy"
                ontoggle={(e) => {
                  if (e.currentTarget.open && !openFx[idx]) {
                    openFx = { ...openFx, [idx]: true };
                  }
                }}
              >
                <summary>Visualise it — try your own numbers</summary>
                <div class="fx-host">
                  {#if openFx[idx]}
                    <FormulaVisualiser id={fx[0]} opts={fx[1] ? { mode: fx[1] } : {}} />
                  {/if}
                </div>
              </details>
            {/if}
          </div>
        {/each}
      </div>
    {/each}
  </section>

  <section class="sec" id="f-mist">
    <h2 class="sec-title"><span class="hmark">##</span>Common mistakes</h2>
    <div class="card">
      <div class="tbl-wrap">
        <table class="t">
          <thead><tr><th>Mistake</th><th>Correct</th><th>Topic</th></tr></thead>
          <tbody>
            {#each MISTAKES as m}
              {@const t = byTopicId(m[2])}
              <tr>
                <td use:richHtml={m[0]}></td>
                <td use:richHtml={m[1]}></td>
                <td>
                  {#if t}<a href="#{t.id}">{pad2(t.num)}</a>{/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <section class="sec" id="f-dis">
    <h2 class="sec-title"><span class="hmark">##</span>Where the slides, recordings and solutions disagree</h2>
    <div class="card">
      <div class="tbl-wrap">
        <table class="t">
          <thead><tr><th>Topic</th><th>Issue</th><th>What each source says</th><th>Most likely on the test</th></tr></thead>
          <tbody>
            <tr>
              <td><a href="#home">Exam info</a></td>
              <td>Weight of Test 2</td>
              <td><b>Slides L01 s9 / Canvas:</b> 60%. <b>Recording L01 [10:10]:</b> 40%.</td>
              <td>60%</td>
            </tr>
            {#each disagreements as [t, b]}
              <tr>
                <td><a href="#{t.id}">{pad2(t.num)}</a></td>
                <td>{@html b.title}</td>
                <td use:richHtml={b.items.map((i) => `<b>${i[0]}:</b> ${i[1]}`).join('<br>')}></td>
                <td use:richHtml={b.likely}></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </section>
</div>
