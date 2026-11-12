<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import { Logic } from '@/utils/logic.js';
  import { esc } from '@/utils/html.js';
  import { decorate as decorateHL } from '@/utils/hl.js';
  import { pipeSVG, pdText, pdLegend } from '@/utils/svg.js';
  import { vizH, uid as mkUid } from '@/utils/viz.js';

  let { opts = {} } = $props();

  const uid = mkUid('hd');
  const POOL = ['$t0', '$t1', '$t2', '$t3', '$t4', '$s1', '$s2', '$s3'];
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  const QS = [
    ['raw', 'RAW dependencies', (c) => c.d.raw.length],
    ['nf', 'stall cycles, no forwarding', (c) => c.s0.stalls],
    ['fw', 'stall cycles, with forwarding', (c) => c.s1.stalls],
    ['cy', 'total cycles, with forwarding', (c) => c.s1.total]
  ];

  function genSeq(len) {
    for (let tries = 0; tries < 200; tries++) {
      const lines = [];
      const recent = [];
      for (let i = 0; i < len; i++) {
        const r = Math.random();
        const src = () => (recent.length && Math.random() < 0.6 ? pick(recent.slice(-2)) : pick(POOL));
        let dst = pick(POOL);
        let t;
        if (r < 0.27) t = `lw  ${dst}, ${pick([0, 4, 8, -4, 12])}(${src()})`;
        else if (r < 0.42) {
          t = `sw  ${src()}, ${pick([0, 4, 8, -8])}(${src()})`;
          dst = null;
        } else {
          t = `${pick(['add', 'sub', 'and', 'or ', 'add', 'sub'])} ${dst}, ${src()}, ${src()}`;
        }
        lines.push(t);
        if (dst) recent.push(dst);
      }
      const ins = Logic.parsePipeProgram(lines.join('\n')).instrs;
      const d = Logic.deps(ins);
      const s0 = Logic.simulate(ins, {});
      const s1 = Logic.simulate(ins, { fwd: true });
      if (d.raw.length >= 1 && d.raw.length <= len && s0.stalls >= 1 && (tries > 40 || Math.random() < 0.75 || s1.stalls > 0)) {
        return { lines, ins, d, s0, s1 };
      }
    }
    const fallback = ['lw  $t0, 0($s1)', 'add $t1, $t0, $s2', 'sub $t2, $t1, $s3', 'and $t3, $t2, $t0', 'sw  $t3, 4($s1)'].slice(0, len);
    const ins = Logic.parsePipeProgram(fallback.join('\n')).instrs;
    return { lines: fallback, ins, d: Logic.deps(ins), s0: Logic.simulate(ins, {}), s1: Logic.simulate(ins, { fwd: true }) };
  }

  let n = $state(untrack(() => opts.n || 5));
  let cur = $state(untrack(() => genSeq(opts.n || 5)));
  let shown = $state(false);
  let score = $state({ ok: 0, tot: 0 });
  let inputs = $state({ raw: '', nf: '', fw: '', cy: '' });
  let marks = $state({ raw: null, nf: null, fw: null, cy: null });
  let doneKey = $state({});

  let solEl = $state(null);

  function freshSeq(newN = n) {
    n = newN;
    cur = genSeq(newN);
    shown = false;
    inputs = { raw: '', nf: '', fw: '', cy: '' };
    marks = { raw: null, nf: null, fw: null, cy: null };
    doneKey = {};
  }

  function checkAnswers() {
    const seqId = cur.lines.join();
    let any = false;
    QS.forEach(([k, , fn]) => {
      const val = String(inputs[k] ?? '').trim();
      if (val === '') {
        marks[k] = null;
        return;
      }
      any = true;
      const good = +val === fn(cur);
      if (doneKey[k] !== seqId) {
        score.tot++;
        if (good) score.ok++;
        doneKey[k] = seqId;
      }
      marks[k] = good ? 'ok' : 'bad';
    });
    return any;
  }

  function solveSeq() {
    checkAnswers();
    shown = true;
  }

  const solHtml = $derived.by(() => {
    if (!shown) return '';
    const { ins, d, s0, s1 } = cur;
    const rows = d.raw
      .map(
        (x) =>
          `<tr><td>I${x.i + 1} → I${x.j + 1}</td><td><span class="tk-reg">${esc(x.reg)}</span></td><td class="tk-num">${x.dist}</td><td>${
            x.load ? 'load' : 'ALU'
          }</td><td class="tk-num">${Logic.rawPenalty(x.dist, x.load, false)}</td><td class="tk-num">${Logic.rawPenalty(x.dist, x.load, true)}</td></tr>`
      )
      .join('');
    const why = (s) =>
      s.events
        .filter((e) => e.kind === 'data')
        .map((e) => `<li>${esc(e.text)}</li>`)
        .join('') || '<li>No instruction has to wait.</li>';
    return `<div class="hd-ans">${QS.map((x) => `<span>${x[1]}: <b>${x[2](cur)}</b></span>`).join('')}</div>
      <div class="tbl-wrap"><table class="t nodeco"><thead><tr><th>RAW pair</th><th>Reg</th><th>Distance</th><th>Producer</th><th>Alone, no fwd<br><span class="ref">3 − d</span></th><th>Alone, fwd<br><span class="ref">load: 2 − d</span></th></tr></thead><tbody>${rows}</tbody></table></div>
      <p class="vz-note">The per-pair numbers are what each dependency would cost <b>on its own</b>. When an earlier instruction has already been delayed, a later one may not need to wait as long — so always confirm on the diagram. WAR: ${d.war.length}, WAW: ${d.waw.length} (never stall an in-order pipeline).</p>
      <div class="hd-dia"><div class="hd-dt">Without forwarding — ${s0.stalls} stall cycle${s0.stalls === 1 ? '' : 's'}, ${s0.total} cycles</div>${pipeSVG(ins, s0, {
        asm: pdText,
        id: uid + 'a',
        lw: 168,
        cw: 40
      })}<ul class="hd-why">${why(s0)}</ul></div>
      <div class="hd-dia"><div class="hd-dt">With forwarding — ${s1.stalls} stall cycle${s1.stalls === 1 ? '' : 's'}, ${s1.total} cycles</div>${pipeSVG(ins, s1, {
        asm: pdText,
        id: uid + 'b',
        lw: 168,
        cw: 40
      })}<ul class="hd-why">${why(s1)}</ul></div>${pdLegend()}`;
  });

  $effect(() => {
    if (shown && solEl) {
      solEl.innerHTML = solHtml;
      decorateHL(solEl);
    }
  });
</script>

<ToolShell
  title="Hazard drill"
  sub="a fresh sequence every time · count the dependencies and the stalls · then check against the pipeline diagram"
>
  <div class="vz hd">
    <div class="ps-bar">
      <div class="ps-tg">
        <span>Length</span>
        <div class="seg mini">
          {#each [[3, '3'], [4, '4'], [5, '5 (exam)'], [6, '6']] as opt}
            <button type="button" aria-pressed={n === opt[0]} onclick={() => freshSeq(opt[0])}>{opt[1]}</button>
          {/each}
        </div>
      </div>
      <button type="button" class="mbtn go" onclick={() => freshSeq(n)}>↻ New sequence</button>
      <span class="hd-score">
        {#if score.tot}
          score <b>{score.ok}</b>/{score.tot} answers
        {:else}
          method: find each RAW pair → its distance → 3 − d (no fwd) or load-use only (fwd) → then draw it, because stalls can overlap
        {/if}
      </span>
    </div>

    <div class="hd-main">
      <div class="mp-pane">
        <div class="mp-ph"><span>Sequence</span><span class="mp-legend">5-stage pipeline · reg file writes ½, reads ½</span></div>
        <pre class="hd-code">{@html cur.lines.map((l, i) => `<span class="hd-ln">I${i + 1}</span>${vizH(l)}`).join('\n')}</pre>
      </div>
      <div class="mp-pane">
        <div class="mp-ph"><span>Your answers</span><span class="mp-legend">whole sequence</span></div>
        <div class="hd-qs">
          {#each QS as [k, lbl]}
            {@const m = marks[k]}
            <label class="hd-q">
              <span>{lbl}</span>
              <input
                type="number"
                min="0"
                step="1"
                inputmode="numeric"
                class={m || ''}
                bind:value={inputs[k]}
                onkeydown={(e) => e.key === 'Enter' && checkAnswers()}
              />
              <i class={m || ''}>{m === 'ok' ? '✓' : m === 'bad' ? '✗' : ''}</i>
            </label>
          {/each}
          <div class="hd-btns">
            <button type="button" class="mbtn go" onclick={checkAnswers}>Check</button>
            <button type="button" class="mbtn" onclick={solveSeq}>Show the solution</button>
          </div>
        </div>
      </div>
    </div>

    <div class="hd-sol" hidden={!shown} bind:this={solEl}></div>
  </div>
</ToolShell>
