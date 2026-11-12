<script>
  import { TOPICS, EXAM, PTMAP, byTopicId } from '$data/index.js';
  import { app } from '$stores/app.svelte.js';
  import { router } from '$stores/router.svelte.js';
  import { vim } from '$stores/vim.svelte.js';
  import { NF, srcChip } from '$utils/refs.js';
  import { pad2 } from '$utils/html.js';
  import { CUR_WEEK, T1, T2, DAY, today, daysTo } from '$utils/calendar.js';
    import { richHtml } from '$utils/actions.js';
  import { mapSVG } from '$utils/viz.js';

  const ART_LINES = [
    ' ██████╗███████╗ ██████╗██████╗  ██████╗ ███████╗ █████╗ ',
    '██╔════╝██╔════╝██╔════╝╚════██╗██╔═████╗██╔════╝██╔══██╗',
    '██║     ███████╗██║      █████╔╝██║██╔██║███████╗╚█████╔╝',
    '██║     ╚════██║██║      ╚═══██╗████╔╝██║╚════██║██╔══██╗',
    '╚██████╗███████║╚██████╗██████╔╝╚██████╔╝███████║╚█████╔╝',
    ' ╚═════╝╚══════╝ ╚═════╝╚═════╝  ╚═════╝ ╚══════╝ ╚════╝ '
  ].join('\n');

  const ART_HTML = ART_LINES.replace(/[╗╔═║╚╝]+/g, (m) => `<i>${m}</i>`);

  let tt = $derived(app.totals());
  let d1 = $derived(daysTo(T1));
  let td = $derived(today());
  let cd1 = $derived(Math.round((T1 - td) / DAY));
  let cd2 = $derived(Math.round((T2 - td) / DAY));
  let resumeTopic = $derived(app.s.last && byTopicId(app.s.last));
  let totalQuestions = $derived(TOPICS.reduce((a, t) => a + t.questions.length, 0));

  let ring1 = $derived(app.testTotals(1));
  let ring2 = $derived(app.testTotals(2));

  const CIRC = 2 * Math.PI * 26;

  function countdownLabel(d, lbl) {
    if (d > 0) return { big: String(d), sub: `${d === 1 ? 'day' : 'days'} until ${lbl}` };
    if (d === 0) return { big: 'Today', sub: lbl };
    return { big: 'Done', sub: lbl };
  }

  let cnt1 = $derived(countdownLabel(cd1, 'Class Test 1'));
  let cnt2 = $derived(countdownLabel(cd2, 'Class Test 2'));

  function topicLink(id) {
    const t = byTopicId(id);
    return t ? `<a href="#${t.id}">${pad2(t.num)} ${t.short || t.title}</a>` : '';
  }

  function timelineRows() {
    return EXAM.dates.map((x) => {
      const d = new Date(x[0] + 'T00:00:00');
      const st = x[4] === 'key' ? 'key' : d < td ? 'past' : 'future';
      const label = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
      return { st, label, text: x[1], ref: x[3], isKey: x[4] === 'key' };
    });
  }
</script>

<div class="dash">
  <pre class="dash-art" aria-label="CSC3058">{@html ART_HTML}</pre>
  <div class="dash-sub">advanced computer architecture · revision</div>
  <div class="dash-btns">
    <button type="button" class="dash-b" onclick={() => vim.openFinder()}>
      <span class="di">{NF.find}</span><span class="dl">Find file, formula or question</span><span class="dk">f</span>
    </button>
    {#if resumeTopic}
      <button type="button" class="dash-b" onclick={() => router.go(resumeTopic.id)}>
        <span class="di">↺</span><span class="dl">Resume {router.pageInfo(resumeTopic.id).file}</span><span class="dk">r</span>
      </button>
    {/if}
    <button type="button" class="dash-b" onclick={() => router.go('formulas')}>
      <span class="di">{NF.sigma}</span><span class="dl">Formula sheet</span><span class="dk">s</span>
    </button>
    <button type="button" class="dash-b" onclick={() => router.go('mock')}>
      <span class="di">{NF.clock}</span><span class="dl">Mock test (timed)</span><span class="dk">m</span>
    </button>
    <button type="button" class="dash-b" onclick={() => router.go('labs')}>
      <span class="di">{NF.flask}</span><span class="dl">Labs</span><span class="dk">l</span>
    </button>
    <button type="button" class="dash-b" onclick={() => router.go(TOPICS[0].id)}>
      <span class="di">{NF.play}</span><span class="dl">Start at topic 01</span><span class="dk">n</span>
    </button>
    <button type="button" class="dash-b" onclick={() => router.go('settings')}>
      <span class="di">{NF.gear}</span><span class="dl">Config (init.lua)</span><span class="dk">c</span>
    </button>
    <button type="button" class="dash-b" onclick={() => vim.openHelp()}>
      <span class="di">{NF.kb}</span><span class="dl">Keymaps</span><span class="dk">?</span>
    </button>
  </div>
  <div class="dash-foot">
    <span class="warn">
      {NF.clock} {d1 > 1 ? `class test 1 in ${d1} days` : d1 === 1 ? 'class test 1 tomorrow' : d1 === 0 ? 'class test 1 TODAY' : 'class test 2 · 9 dec'}
    </span>
    · <span class="ok">{NF.ok} {tt.n}/{tt.tot}</span> questions attempted · week {CUR_WEEK}
  </div>
</div>

<div class="page">
  <header class="page-head hero">
    <div class="ph-t">
      <div class="eyebrow">
        <span>CSC3058 · Advanced Computer Architecture</span>
        <span>QUB</span>
        <span>Week {CUR_WEEK}</span>
      </div>
      <h1 class="page-title"><span class="hmark">#</span>Exam info</h1>
      <p class="lede">
        Everything taught in Lectures 1–16, re-explained in order, with tools to play with and {totalQuestions} practice questions. Start with a topic in the sidebar, or the formula sheet if the test is close.
      </p>
    </div>
  </header>

  <div class="countdowns">
    <div class="card cd">
      <div class="big-n">{cnt1.big}</div>
      <div class="lbl">{cnt1.sub}</div>
      <div>Wed 11 Nov 2026 · <b>40%</b> · Lectures 1–16</div>
      <div class="ref">15:15 · CSB/0G/028 (Green Room: Lab 5) · arrive before 15:05</div>
    </div>
    <div class="card cd">
      <div class="big-n">{cnt2.big}</div>
      <div class="lbl">{cnt2.sub}</div>
      <div>Wed 9 Dec 2026 (tentative) · <b>60%</b> · Lectures 1–26</div>
      <div class="ref">L17–L18 slides out (taught Thu 12 Nov); L19–L26 not released yet</div>
    </div>
    <div class="card cd">
      <div class="big-n">40%</div>
      <div class="lbl">to pass the module</div>
      <div>overall average across the two tests</div>
      <div class="ref">Canvas front page; L01 [11:26]</div>
    </div>
  </div>

  <section class="sec" id="s-progress">
    <h2 class="sec-title"><span class="hmark">##</span>Your progress by test</h2>
    <div class="card">
      <div class="tprog">
        {#each [
          { v: ring1[0], tot: ring1[1], label: 'Test 1', sub: 'Topics 01–18 · Wed 11 Nov', col: 'var(--t1, var(--tn-yellow))' },
          { v: ring2[0], tot: ring2[1], label: 'Test 2', sub: 'All topics · Wed 9 Dec', col: 'var(--t2, var(--tn-magenta))' }
        ] as r}
          {@const f = r.tot ? r.v / r.tot : 0}
          <figure class="tring" style="--rc:{r.col}">
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <circle cx="32" cy="32" r="26" class="trg-bg" />
              <circle
                cx="32"
                cy="32"
                r="26"
                class="trg-fg"
                opacity={f ? undefined : '0'}
                stroke-dasharray="{(CIRC * f).toFixed(1)} {CIRC.toFixed(1)}"
              />
              <text x="32" y="36.5" text-anchor="middle">{Math.round(100 * f)}%</text>
            </svg>
            <figcaption>
              <b>{r.label}</b>
              <span>{r.v} of {r.tot} questions tried</span>
              <span class="muted">{r.sub}</span>
            </figcaption>
          </figure>
        {/each}
      </div>
    </div>

    <details class="ckey" data-resize>
      <summary>
        <span class="ck-k">Colour key and how to use these notes</span>
        <span class="ck-mini">
          <span class="stg if">IF</span><span class="stg ex">EX</span><span class="stg wb">WB</span>
        </span>
      </summary>
      <div class="ck-grid">
        <div>
          <h4>Pipeline stages</h4>
          <div class="ck-row">
            <span class="stg if">IF</span><span class="stg id">ID</span><span class="stg ex">EX</span><span class="stg mem">MEM</span><span class="stg wb">WB</span><span class="stg st">stall</span>
          </div>
          <p class="muted">The same colours in every diagram, table and simulator.</p>
        </div>
        <div>
          <h4>In the text</h4>
          <div class="ck-row nodeco">
            <span class="tk tk-num">42</span> number <span class="tk tk-reg">$t0</span> register <span class="tk tk-hex">0x1F</span> hex <span class="tk tk-bin">0b1010</span> binary
          </div>
          <p class="muted">Code is in <code>mono</code>; maths is typeset.</p>
        </div>
        <div>
          <h4>Tests</h4>
          <div class="ck-row"><span class="ck-t t1">Test 1</span><span class="ck-t t2">Test 2</span></div>
          <p class="muted">Brackets in the sidebar show which test each topic is on; week brackets sit on the left.</p>
        </div>
        <div>
          <h4>Boxes</h4>
          <div class="ck-row ck-boxes">
            <span class="ck-b recipe-k">Method</span>
            <span class="ck-b derive-k">Why the rule works</span>
            <span class="ck-b check-k">Check yourself</span>
            <span class="ck-b sort-k">Sort it</span>
            <span class="ck-b dis-k">Sources disagree</span>
            <span class="ck-b bg-k">Background · not examined</span>
          </div>
        </div>
      </div>
      <div class="ck-how">
        <h4>How to use a topic</h4>
        <ol>
          <li>Read <b>After this topic you can</b> in the overview: that is the target.</li>
          <li>Work through the explanation. Answer every <b>Check yourself</b> and <b>Sort it</b> before reading on.</li>
          <li>When a <b>Method</b> box appears, use it on the worked example that follows it.</li>
          <li>Practice: official questions first, then the AI ladder from easy to hard. Stuck? The <b>you need</b> chips jump to the step that teaches it.</li>
          <li>Use <b>Step by step</b> working: name the next move yourself before revealing it — every step is named and tagged with its slide.</li>
          <li>Finish with <b>Key points</b> and <b>Exam traps</b>, then a timed <a href="#mock">mock test</a>.</li>
        </ol>
      </div>
    </details>
  </section>

  <section class="sec" id="s-prog">
    <h2 class="sec-title"><span class="hmark">##</span>Where you are</h2>
    <div class="card list">
      <div class="prog-grid">
        {#each TOPICS as t}
          {@const p = app.progress(t)}
          {@const pc = p.tot ? Math.round((100 * p.n) / p.tot) : 0}
          <a class="prog-row" href="#{t.id}">
            <span class="pr-t"><span class="pr-n">{pad2(t.num)}</span> {t.short || t.title}</span>
            <span class="pr-bar"><i style="width:{pc}%"></i></span>
            <span class="pr-c">{p.n}/{p.tot}</span>
          </a>
        {/each}
      </div>
    </div>
    <p class="ref">Ticks come from the “Attempted” switch on each practice question. Aim to attempt every Official question at least once before the test.</p>
  </section>

  <section class="sec" id="s-map">
    <h2 class="sec-title">Module map: Lectures 1–16 on one page</h2>
    <div class="card">
      <div class="vz-canvas mm-canvas">{@html mapSVG()}</div>
      <p class="ref" style="margin-top:8px">Click a box to open its notes. Also in labs/ as module-map.lua.</p>
    </div>
  </section>

  <section class="sec" id="s-weight">
    <h2 class="sec-title"><span class="hmark">##</span>Where the marks were on the Practice Test</h2>
    <div class="card">
      <div class="ptmap">
        {#each PTMAP as q}
          <div class="pt-row">
            <span class="pt-q">{q[0]}</span>
            <span class="pt-bar"><i style="width:{(q[1] / 30) * 100}%"></i></span>
            <span class="pt-p">{q[1]} pts</span>
            <span class="pt-d" use:richHtml={`${q[2]} · ${q[3].map(topicLink).join(' · ')}`}></span>
          </div>
        {/each}
      </div>
      <p class="ref">From the Practice Test (100 points). The lecturer warned it is not a copy of the real test, but it shows the format and the weighting he uses: 70 of 100 points came from Topics 13–18.</p>
    </div>
  </section>

  <section class="sec" id="s-fmt">
    <h2 class="sec-title"><span class="hmark">##</span>Test format</h2>
    <div class="grid2">
      <div class="card prose">
        <div class="chips">{@html srcChip('C', 'Practice Test + "Feedback Practice Test" page')}</div>
        <ul>
          <li><b>Closed book, closed notes.</b> Calculators may be used; no other electronic devices.</li>
          <li><b>90 minutes</b> (confirmed in the 8 Nov announcement; no hand-in or leaving in the first 45 minutes, no re-entry; entry closes at 15:30).</li>
          <li>Write with a <b>blue pen</b> (no pencil, green or red).</li>
          <li>Printed <b>single-sided</b>: use the blank back of each page for working.</li>
          <li>Final answers, explanations and final workings go in the <b>text box under each question</b>.</li>
          <li>Multiple-choice parts need a justification: "To get any points you need to appropriately justify your answer."</li>
        </ul>
        <p class="ref">The lecturer: "please do not consider this as the exact copy of the upcoming test" — it shows the format, not the questions.</p>
      </div>
      <div class="card prose">
        <div class="chips">{@html srcChip('S', 'L01 s9–s10')}</div>
        <ul>
          <li><b>Test 1 — 40%:</b> Lectures 1–16; book Ch. 1, 2, 3, 4.</li>
          <li><b>Test 2 — 60%:</b> Lectures 1–26; book Ch. 1 to 6.</li>
          <li>~60% of marks: solve mathematical problems and apply concepts ("easy", "medium").</li>
          <li>~40%: critical thinking on harder problems ("medium", "more challenging"), e.g. compare two designs and justify which is better.</li>
        </ul>
        <p class="ref">The Practice Test was 6 questions, 100 points: Q1 multiple choice (12), Q2 ISA/uARCH (8), Q3 C→MIPS (10), Q4 dependencies, forwarding, reordering (30), Q5 CPI with hazards (16), Q6 single-cycle timing (24).</p>
      </div>
    </div>

    <div class="disagree">
      <div class="disagree-h">Sources disagree — weight of Test 2</div>
      <ul>
        <li><b>Slides L01 s9, Canvas front page, Canvas assignment groups:</b> Test 2 = 60%.</li>
        <li><b>Lecture recording L01 [10:10]:</b> "class test two … counts for 40%".</li>
      </ul>
      <div class="likely"><b>Most likely:</b> 60%. Three written sources agree and the Canvas gradebook groups are set to 40/60; the recording is a slip of the tongue.</div>
    </div>

    <div class="callout key">
      <div class="callout-h">Revise everything</div>
      <div class="prose">
        <p>The review session is <b>not</b> a guide to what's on the test. The lecturer: "The test may include topics covered in the review session, topics not discussed during the session, as well as smaller details from the lecture materials." (Announcement 23 Oct) Revise every lecture from 1 to 16 plus Practice Sets 1–3.</p>
      </div>
    </div>
  </section>

  <section class="sec">
    <h2 class="sec-title"><span class="hmark">##</span>Key dates</h2>
    <div class="card timeline">
      {#each timelineRows() as row}
        <div class="tl {row.st}">
          <div class="d">{row.label}</div>
          <div class="dot"></div>
          <div>
            {#if row.isKey}<b>{row.text}</b>{:else}{row.text}{/if}
            <span class="ref">· {row.ref}</span>
          </div>
        </div>
      {/each}
    </div>
    <p class="ref">Canvas due times are stored in UTC. The UK has been on GMT (UTC+0) since 25 Oct, so 21:00 UTC is 21:00 UK time.</p>
  </section>

  <section class="sec">
    <h2 class="sec-title"><span class="hmark">##</span>Question types seen so far</h2>
    <div class="card">
      <div class="tbl-wrap">
        <table class="t">
          <thead><tr><th>Type</th><th>Example</th><th>Seen in</th><th>Practise in</th></tr></thead>
          <tbody>
            {#each EXAM.types as t}
              <tr>
                <td><b>{t[0]}</b></td>
                <td use:richHtml={t[1]}></td>
                <td class="ref">{t[2]}</td>
                <td use:richHtml={topicLink(t[3])}></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <section class="sec" id="review">
    <h2 class="sec-title"><span class="hmark">##</span>Review session 1 (Thu 5 and Mon 9 Nov) — what it covered</h2>
    <div class="card prose">
      <div class="chips">{@html srcChip('S', 'R1 slides s1–s30')} {@html srcChip('L', 'R1 Part I, II & III recordings')}</div>
      <p>The review slides are "a collection of basic and important concepts that at minimum you should be aware of", not all the material (R1 s2). You should be able to answer the questions on them, plus Practice Questions 1–3, the slides and Book chapters 1–4. The recording got through slide 22, then stopped: "we still have, I think, eight and nine slides … we can continue the remaining parts next Monday" (R1 Part II [47:19]). Part III on Mon 9 Nov covered s23–s30 and added no new topics (R1 Part III [0:29]).</p>
      <div class="tbl-wrap">
        <table class="t">
          <thead><tr><th>Slides</th><th>Content</th><th>Topic</th></tr></thead>
          <tbody>
            {#each EXAM.review as r}
              <tr>
                <td class="mono">{r[0]}</td>
                <td use:richHtml={r[1]}></td>
                <td use:richHtml={topicLink(r[2])}></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <section class="sec">
    <h2 class="sec-title"><span class="hmark">##</span>How to use this site</h2>
    <div class="card prose">
      <ul>
        <li>Every topic has the same six parts: Overview, Notation, Explanation (with lecture and slide references), Key points, Exam traps, Practice questions.</li>
        <li>Coloured tags show where content came from: {@html srcChip('S', '')} {@html srcChip('L', '')} {@html srcChip('T', '')} and greyed, collapsible <span class="chip B"><span>Background (not examined)</span></span> blocks. "L03 s7" means Lecture 3, slide 7; "L03 [21:15]" means 21 min 15 s into the recording.</li>
        <li>Orange <b>Sources disagree</b> boxes appear wherever the slides, recording, official solutions or textbook don't match, with a verdict on what the test most likely follows.</li>
        <li>Tick <b>Attempted</b> on each question; progress is saved in this browser only.</li>
        <li>Every formula has an interactive <b>visualiser</b> (on the formula sheet and inside the topics): move the sliders and the substituted working updates.</li>
        <li>The <b>Labs</b> page collects the big simulators: Number lab, MIPS step-through, pipeline simulator, datapath, encoder and dependency finder.</li>
        <li>Switch between day and night from the button top right, or press <kbd>Space</kbd> <kbd>b</kbd>. Press <kbd>?</kbd> for keyboard shortcuts.</li>
      </ul>
    </div>
  </section>
</div>
