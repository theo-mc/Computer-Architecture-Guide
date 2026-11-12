<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import MockHelpPanel from './MockHelpPanel.svelte';
  import { TOPICS } from '@/data/index.js';
  import { app } from '@/stores/app.svelte.js';
  import { router } from '@/stores/router.svelte.js';
  import { pad2 } from '@/utils/html.js';
  import { richHtml } from '@/utils/actions.js';
  import { KIND, DIFF, PTS, mmss, bank, pickQuestions, findQuestion, helpUsed, helpTag } from '@/utils/mockHelp.js';

  const defaultPrefs = () => ({
    n: 12,
    min: 30,
    kinds: ['off', 'ai', 'wild'],
    topics: TOPICS.filter((t) => (t.tests || [1, 2]).indexOf(1) >= 0).map((t) => t.id),
    help: true
  });

  const savedPre = untrack(() => app.s.mockPrefs || defaultPrefs());
  let prefN = $state(savedPre.n || 12);
  let prefMin = $state(savedPre.min != null ? savedPre.min : 30);
  let prefHelp = $state(savedPre.help !== false);
  let prefKinds = $state((savedPre.kinds || ['off', 'ai', 'wild']).slice());
  let prefTopics = $state((savedPre.topics || defaultPrefs().topics).slice());

  let confirmFinish = $state(false);
  let nowTs = $state(Date.now());
  let saveTimer = 0;

  function topicScores() {
    const agg = {};
    (app.s.mocks || []).forEach((h) =>
      Object.keys(h.per || {}).forEach((k) => {
        const a = (agg[k] = agg[k] || { s: 0, m: 0 });
        a.s += h.per[k].s;
        a.m += h.per[k].m;
      })
    );
    const out = {};
    Object.keys(agg).forEach((k) => {
      out[k] = agg[k].s / Math.max(1, agg[k].m);
    });
    return out;
  }

  const availCount = $derived(
    bank().filter((x) => prefTopics.indexOf(x.t.id) >= 0 && prefKinds.indexOf(x.q.kind) >= 0).length
  );
  const hist = $derived((app.s.mocks || []).slice(-6).reverse());
  const m = $derived(app.s.mock);

  // Reset finish confirmation on slide change or phase change
  $effect(() => {
    void m?.cur;
    void m?.phase;
    confirmFinish = false;
  });

  // Countdown ticker in timed test phase
  $effect(() => {
    if (!m || m.phase !== 'test' || !m.limit) return;
    nowTs = Date.now();
    const id = setInterval(() => {
      nowTs = Date.now();
      const rem = m.limit - (nowTs - m.start) / 1000;
      if (rem <= 0) {
        m.phase = 'review';
        m.timeUp = true;
        m.spent = m.limit;
        app.save();
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  });

  // Cleanup debounced save timer on destroy
  $effect(() => () => {
    if (saveTimer) clearTimeout(saveTimer);
  });

  function toggleKind(k) {
    if (prefKinds.includes(k)) prefKinds = prefKinds.filter((x) => x !== k);
    else prefKinds = [...prefKinds, k];
  }

  function toggleTopic(id) {
    if (prefTopics.includes(id)) prefTopics = prefTopics.filter((x) => x !== id);
    else prefTopics = [...prefTopics, id];
  }

  function pickWeakest() {
    const sc = topicScores();
    const ranked = TOPICS.map((x) => [x.id, sc[x.id] != null ? sc[x.id] : app.progress(x).n / Math.max(1, app.progress(x).tot)])
      .sort((a, b) => a[1] - b[1])
      .slice(0, 5)
      .map((x) => x[0]);
    prefTopics = ranked;
  }

  function startTest() {
    const p = { n: prefN, min: prefMin, kinds: prefKinds.slice(), topics: prefTopics.slice(), help: prefHelp };
    app.s.mockPrefs = { ...(app.s.mockPrefs || {}), ...p };
    const items = pickQuestions(p);
    if (!items.length) return;
    app.s.mock = {
      phase: 'test',
      items,
      cur: 0,
      notes: {},
      flags: {},
      marks: {},
      used: {},
      help: p.help,
      start: Date.now(),
      limit: p.min * 60,
      spent: 0
    };
    nowTs = Date.now();
    app.save();
  }

  function ensureHelpUse(curIdx) {
    if (!m.used) m.used = {};
    if (!m.used[curIdx]) m.used[curIdx] = { h: 0, w: 0, open: false };
    return m.used[curIdx];
  }

  function onNoteInput(val) {
    m.notes[m.cur] = val;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => app.save(), 400);
  }

  function goToQuestion(idx) {
    m.cur = idx;
    app.save();
  }

  function goFinishOrConfirm() {
    const left = m.items.length - Object.keys(m.notes).filter((k) => m.notes[k]).length;
    if (left && !confirmFinish) {
      confirmFinish = true;
      return;
    }
    m.phase = 'review';
    m.spent = (Date.now() - m.start) / 1000;
    app.save();
  }

  function markQuestion(val) {
    m.marks[m.cur] = val;
    const nx = m.items.findIndex((_, i) => m.marks[i] == null);
    if (nx >= 0) m.cur = nx;
    app.save();
  }

  function finishMarking() {
    let score = 0;
    let max = 0;
    const per = {};
    m.items.forEach((it, i) => {
      const x = findQuestion(it);
      if (!x) return;
      const w = PTS[x.q.diff] || 1;
      max += w;
      score += w * (m.marks[i] || 0);
      const p = (per[it.tid] = per[it.tid] || { s: 0, m: 0 });
      p.s += w * (m.marks[i] || 0);
      p.m += w;
      app.toggleDone(app.qKey(x.t, x.q), true);
    });
    const time = m.spent || (Date.now() - m.start) / 1000;
    const entry = { at: Date.now(), score, max, n: m.items.length, per, time };
    app.s.mocks = app.s.mocks || [];
    if (m.saved && app.s.mocks.length) app.s.mocks[app.s.mocks.length - 1] = entry;
    else app.s.mocks.push(entry);
    app.s.mocks = app.s.mocks.slice(-30);
    m.saved = true;
    m.phase = 'results';
    m.result = { score, max, per, time };
    app.save();
  }

  function startNewTest() {
    delete app.s.mock;
    app.save();
  }

  // Fallback recovery if saved mock references removed question id
  $effect(() => {
    if (m && (m.phase === 'test' || m.phase === 'review')) {
      const it = m.items?.[m.cur];
      if (!it || !findQuestion(it)) {
        m.phase = m.phase === 'test' ? 'review' : 'results';
        app.save();
      }
    }
  });
</script>

<ToolShell title="Mock test" sub="timed · drawn from Lectures 1–16 · you mark it yourself" className="mk">
  <div class="mk-b">
    {#if !m}
      <div class="mk-setup">
        <div class="mk-col">
          <div class="mk-q">
            <span class="mk-lab">Length</span>
            <div class="seg" data-g="n">
              {#each [6, 12, 20, 30] as n}
                <button type="button" aria-pressed={prefN === n} onclick={() => (prefN = n)}>{n} questions</button>
              {/each}
            </div>
          </div>

          <div class="mk-q">
            <span class="mk-lab">Time limit</span>
            <div class="seg" data-g="min">
              {#each [10, 20, 30, 45, 60, 0] as minVal}
                <button type="button" aria-pressed={prefMin === minVal} onclick={() => (prefMin = minVal)}>
                  {minVal ? minVal + ' min' : 'untimed'}
                </button>
              {/each}
            </div>
            <span class="ref">The real test's duration isn't stated in the materials — pick what suits you.</span>
          </div>

          <div class="mk-q">
            <span class="mk-lab">Help during the test</span>
            <div class="seg" data-g="help">
              <button type="button" aria-pressed={prefHelp} onclick={() => (prefHelp = true)}>💡 Hints &amp; step-by-step working</button>
              <button type="button" aria-pressed={!prefHelp} onclick={() => (prefHelp = false)}>Exam conditions — no help</button>
            </div>
            <span class="ref">
              With help on, every question has optional hints and a working you can open one step at a time, with each step broken into tiny steps.
            </span>
          </div>

          <div class="mk-q">
            <span class="mk-lab">Question types</span>
            <div class="mk-chk">
              {#each Object.keys(KIND) as k}
                <label>
                  <input type="checkbox" checked={prefKinds.includes(k)} onchange={() => toggleKind(k)} />
                  {KIND[k]}
                </label>
              {/each}
            </div>
          </div>

          <div class="mk-q">
            <span class="mk-lab">
              Topics
              <button type="button" class="mk-mini" onclick={() => (prefTopics = TOPICS.map((t) => t.id))}>all</button>
              <button type="button" class="mk-mini" onclick={() => (prefTopics = [])}>none</button>
              <button type="button" class="mk-mini" onclick={() => (prefTopics = TOPICS.filter((t) => (t.tests || [1, 2]).indexOf(1) >= 0).map((t) => t.id))}>
                Test 1 topics
              </button>
              <button type="button" class="mk-mini" onclick={pickWeakest}>my weakest</button>
            </span>
            <div class="mk-topics nodeco">
              {#each TOPICS as t}
                <label>
                  <input type="checkbox" checked={prefTopics.includes(t.id)} onchange={() => toggleTopic(t.id)} />
                  <span class="mk-tn">{pad2(t.num)}</span>
                  <span class="mk-tl">{t.short || t.title}</span>
                </label>
              {/each}
            </div>
          </div>

          <div class="mk-go">
            <button type="button" class="mbtn go" disabled={!availCount} onclick={startTest}>Start the test ▸</button>
            <span class="mk-avail ref">{availCount} questions match · {Math.min(availCount, prefN)} will be used</span>
          </div>
        </div>

        <div class="mk-col mk-side">
          <div class="mk-card">
            <b>How it works</b>
            <ol>
              <li>Answer each question in the notes box (or on paper). Flag any you want to come back to.</li>
              <li>
                Stuck? Press 💡 Hint for a nudge, or open the working one step at a time. Any help you use is shown next to that question when you mark it.
              </li>
              <li>When you finish — or time runs out — the answers appear.</li>
              <li>Mark each one ✓ right, ½ partly or ✗ wrong. Hard questions count 3, medium 2, easy 1.</li>
              <li>You get a score per topic and a list of what to revisit. Every question is also ticked as attempted.</li>
            </ol>
          </div>
          <div class="mk-card">
            <b>Your previous attempts</b>
            {#if hist.length}
              <div class="mk-hist">
                {#each hist as h}
                  {@const hpct = Math.round((100 * h.score) / Math.max(1, h.max))}
                  <div class="mk-h">
                    <span>{new Date(h.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    <span class="mk-hb"><i style="width:{hpct}%"></i></span>
                    <b class="tk-num">{hpct}%</b>
                    <span class="ref">{h.n} q</span>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="ref">None yet.</p>
            {/if}
          </div>
        </div>
      </div>
    {:else if m.phase === 'test'}
      {@const found = findQuestion(m.items[m.cur])}
      {#if found}
        {@const { t, q } = found}
        {@const rem = m.limit ? m.limit - (nowTs - m.start) / 1000 : Infinity}
        {@const answeredCount = Object.keys(m.notes).filter((k) => m.notes[k]).length}
        {@const flaggedCount = Object.keys(m.flags).filter((k) => m.flags[k]).length}
        {@const leftCount = m.items.length - answeredCount}
        <div class="mk-test">
          <div class="mk-top">
            <span class="mk-qn">Question <b class="tk-num">{m.cur + 1}</b> of <b class="tk-num">{m.items.length}</b></span>
            <span class="mk-timer" class:off={!m.limit} class:low={m.limit > 0 && rem < 120}>
              <span>{m.limit ? mmss(rem) : 'untimed'}</span>
              <span class="mk-tbar"><i style="width:{m.limit ? Math.max(0, (100 * rem) / m.limit) : 100}%"></i></span>
            </span>
            <button type="button" class="mbtn" onclick={goFinishOrConfirm}>
              {confirmFinish && leftCount ? `${leftCount} unanswered — finish anyway?` : 'Finish & mark'}
            </button>
          </div>

          <div class="mk-grid">
            {#each m.items as _, i}
              <button
                type="button"
                class="mk-cell"
                class:cur={i === m.cur}
                class:ans={!!m.notes[i]}
                class:flag={!!m.flags[i]}
                class:hlp={helpUsed((m.used || {})[i])}
                aria-label="question {i + 1}"
                onclick={() => goToQuestion(i)}
              >
                {i + 1}
              </button>
            {/each}
          </div>

          <div class="mk-qcard">
            <div class="mk-meta">
              <span class="mk-pill k-{q.kind}">{KIND[q.kind] || q.kind}</span>
              <span class="mk-pill d-{q.diff}">{DIFF[q.diff] || q.diff} · {PTS[q.diff] || 1} pt{PTS[q.diff] > 1 ? 's' : ''}</span>
              <span class="ref">topic hidden until marking</span>
              <button
                type="button"
                class="mk-flag"
                class:on={!!m.flags[m.cur]}
                onclick={() => {
                  m.flags[m.cur] = !m.flags[m.cur];
                  app.save();
                }}
              >
                ⚑ {m.flags[m.cur] ? 'flagged' : 'flag'}
              </button>
            </div>
            <div class="prose mk-qtext" use:richHtml={q.q}></div>
            {#if m.help !== false && (q.steps || []).length}
              {@const u = ensureHelpUse(m.cur)}
              <div class="mk-help">
                <MockHelpPanel {t} {q} qKey={app.qKey(t, q)} {u} use={u} review={false} onSave={() => app.save()} />
              </div>
            {/if}
            <label class="mk-notes">
              <span>Your answer / working</span>
              <textarea
                value={m.notes[m.cur] || ''}
                oninput={(e) => onNoteInput(e.currentTarget.value)}
                spellcheck="false"
                placeholder="Write your answer here — it stays with this attempt."
              ></textarea>
            </label>
          </div>

          <div class="mk-nav">
            <button type="button" class="mbtn" disabled={m.cur === 0} onclick={() => goToQuestion(m.cur - 1)}>◀ previous</button>
            <span class="ref">answered <b class="tk-num">{answeredCount}</b> · flagged <b class="tk-num">{flaggedCount}</b></span>
            {#if m.cur < m.items.length - 1}
              <button type="button" class="mbtn go" onclick={() => goToQuestion(m.cur + 1)}>next ▶</button>
            {:else}
              <button type="button" class="mbtn go" onclick={goFinishOrConfirm}>
                {confirmFinish && leftCount ? `${leftCount} unanswered — finish anyway?` : 'finish ▸'}
              </button>
            {/if}
          </div>
        </div>
      {/if}
    {:else if m.phase === 'review'}
      {@const found = findQuestion(m.items[m.cur])}
      {#if found}
        {@const { t, q } = found}
        {@const done = Object.keys(m.marks).length}
        {@const mk = m.marks[m.cur]}
        <div class="mk-test rev">
          <div class="mk-top">
            <span class="mk-qn">Marking <b class="tk-num">{m.cur + 1}</b> of <b class="tk-num">{m.items.length}</b></span>
            {#if m.timeUp}
              <span class="mk-pill d-H">time was up</span>
            {/if}
            <span class="ref">marked <b class="tk-num">{done}</b> / {m.items.length}</span>
            <button type="button" class="mbtn go" disabled={done < m.items.length} onclick={finishMarking}>See results ▸</button>
          </div>

          <div class="mk-grid">
            {#each m.items as _, i}
              {@const mCls = m.marks[i] != null ? 'm' + String(m.marks[i]).replace('.', '') : ''}
              <button
                type="button"
                class="mk-cell {mCls}"
                class:cur={i === m.cur}
                class:hlp={helpUsed((m.used || {})[i])}
                onclick={() => goToQuestion(i)}
              >
                {i + 1}
              </button>
            {/each}
          </div>

          <div class="mk-split">
            <div class="mk-qcard">
              <div class="mk-meta">
                <span class="mk-pill k-{q.kind}">{KIND[q.kind] || q.kind}</span>
                <span class="mk-pill d-{q.diff}">{DIFF[q.diff] || q.diff} · {PTS[q.diff] || 1} pt</span>
                <a
                  class="mk-topic nodeco"
                  href="#{t.id}"
                  onclick={(e) => {
                    e.preventDefault();
                    router.go(t.id);
                  }}
                >
                  {pad2(t.num)} · {t.short || t.title}
                </a>
                {@html helpTag((m.used || {})[m.cur], q)}
              </div>
              <div class="prose mk-qtext" use:richHtml={q.q}></div>
              <div class="mk-yours">
                <span>Your answer</span>
                <pre>{m.notes[m.cur] || '— nothing written —'}</pre>
              </div>
            </div>

            <div class="mk-qcard mk-ans">
              <div class="mk-meta">
                <b>Answer</b>
                {#if q.src}
                  <span class="ref">{q.src}</span>
                {/if}
              </div>
              <div class="result" use:richHtml={q.ans || ''}></div>
              {#if (q.steps || []).length}
                <details class="mk-steps" data-resize>
                  <summary>Full working ({q.steps.length} steps) — with tiny steps</summary>
                  <div class="mk-help rev">
                    <MockHelpPanel {t} {q} qKey={app.qKey(t, q)} review={true} onSave={() => app.save()} />
                  </div>
                </details>
              {/if}
              {#if q.official}
                <details class="mk-steps" data-resize>
                  <summary>Official answer, word for word</summary>
                  <div class="mk-off" use:richHtml={q.official}></div>
                </details>
              {/if}
            </div>
          </div>

          <div class="mk-mark">
            <span class="mk-lab">How did you do?</span>
            <button type="button" class="mk-m m1" class:on={mk === 1} onclick={() => markQuestion(1)}>✓ right</button>
            <button type="button" class="mk-m m05" class:on={mk === 0.5} onclick={() => markQuestion(0.5)}>½ partly</button>
            <button type="button" class="mk-m m0" class:on={mk === 0} onclick={() => markQuestion(0)}>✗ wrong</button>
            <span class="mk-sp"></span>
            <button type="button" class="mbtn" disabled={m.cur === 0} onclick={() => goToQuestion(m.cur - 1)}>◀</button>
            <button type="button" class="mbtn" disabled={m.cur >= m.items.length - 1} onclick={() => goToQuestion(m.cur + 1)}>▶</button>
          </div>
        </div>
      {/if}
    {:else}
      {@const r = m.result || { score: 0, max: 1, per: {}, time: 0 }}
      {@const pct = Math.round((100 * r.score) / Math.max(1, r.max))}
      {@const rows = Object.keys(r.per)
        .map((k) => ({ t: TOPICS.find((x) => x.id === k), ...r.per[k] }))
        .filter((x) => x.t)
        .sort((a, b) => a.s / a.m - b.s / b.m)}
      {@const weak = rows.filter((x) => x.s / x.m < 0.6)}
      {@const markCounts = [1, 0.5, 0].map((v) => Object.values(m.marks).filter((x) => x === v).length).join(' / ')}
      {@const helpUsedCount = m.items.filter((_, i) => helpUsed((m.used || {})[i])).length}
      <div class="mk-res">
        <div class="mk-score">
          <div class="mk-ring" style="--p:{pct}">
            <b>{pct}%</b>
            <span>{r.score} / {r.max} pts</span>
          </div>
          <div class="mk-sum">
            <div><span>Questions</span><b class="tk-num">{m.items.length}</b></div>
            <div><span>Time used</span><b class="tk-num">{mmss(r.time)}</b></div>
            <div><span>Right / partly / wrong</span><b>{markCounts}</b></div>
            <div><span>Module pass line</span><b>{pct >= 40 ? '✓ at or above 40%' : 'below 40%'}</b></div>
            {#if m.help !== false}
              <div class="mk-sum-w"><span>Help used</span><b>{helpUsedCount} of {m.items.length} questions</b></div>
            {/if}
          </div>
        </div>

        <div class="mk-bytopic nodeco">
          <b>By topic</b> <span class="ref">weakest first · points weighted by difficulty</span>
          {#each rows as x}
            {@const p = Math.round((100 * x.s) / x.m)}
            <a
              class="mk-tr"
              href="#{x.t.id}"
              onclick={(e) => {
                e.preventDefault();
                router.go(x.t.id);
              }}
            >
              <span class="mk-tn">{pad2(x.t.num)}</span>
              <span class="mk-tt">{x.t.short || x.t.title}</span>
              <span class="mk-tb"><i class={p < 50 ? 'bad' : p < 75 ? 'mid' : 'good'} style="width:{p}%"></i></span>
              <b class="tk-num">{p}%</b>
            </a>
          {/each}
        </div>

        {#if weak.length}
          <div class="mk-card warn">
            <b>Revisit next</b>
            <p>
              {#each weak as x, idx}
                {#if idx > 0}{' · '}{/if}
                <a
                  href="#{x.t.id}"
                  onclick={(e) => {
                    e.preventDefault();
                    router.go(x.t.id);
                  }}
                >
                  {x.t.short || x.t.title}
                </a>
              {/each}
            </p>
          </div>
        {:else}
          <div class="mk-card ok"><b>No weak topics in this attempt.</b> Try a longer test or the Hard questions.</div>
        {/if}

        <div class="mk-go">
          <button
            type="button"
            class="mbtn"
            onclick={() => {
              m.phase = 'review';
              app.save();
            }}
          >
            ◀ back to marking
          </button>
          <button type="button" class="mbtn go" onclick={startNewTest}>New test ▸</button>
        </div>
      </div>
    {/if}
  </div>
</ToolShell>
