<script>
  import ToolShell from './ToolShell.svelte';
  import StepsList from '@/components/content/StepsList.svelte';
  import { TK } from '@/utils/toolKit.js';
  import { STG, USES, vizF } from '@/utils/viz.js';

  const R = String.raw;
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const NM = ['Load', 'Store', 'R-format', 'Branch'];
  const QS = [
    ['s', 'single-cycle clock period (ps)', (c) => c.tcS, 0],
    ['m', 'multi-cycle clock period (ps)', (c) => c.tcM, 0],
    ['a', 'multi-cycle average time per instruction (ps)', (c) => c.avg, 0.51],
    ['p', 'ideal pipeline speedup over single-cycle (long program)', (c) => c.sp, 0.011]
  ];

  function genTable() {
    const d = [
      pick([150, 200, 250, 300]),
      pick([50, 100, 150]),
      pick([100, 150, 200, 250, 300]),
      pick([150, 200, 250, 300, 350]),
      pick([50, 100, 150])
    ];
    let mix;
    do {
      mix = [pick([20, 25, 30, 35]), pick([10, 15, 20, 25]), pick([25, 30, 35, 40, 45])];
      mix.push(100 - mix[0] - mix[1] - mix[2]);
    } while (mix[3] < 5 || mix[3] > 30);
    const tot = USES.map((u) => u.reduce((a, x, i) => a + (x ? d[i] : 0), 0));
    const tcS = Math.max(...tot);
    const tcM = Math.max(...d);
    const steps = USES.map((u) => u.reduce((a, x) => a + x, 0));
    const avg = mix.reduce((a, m, i) => a + (m / 100) * steps[i] * tcM, 0);
    return { d, mix, tot, tcS, tcM, steps, avg, sp: tcS / tcM };
  }

  let cur = $state(genTable());
  let shown = $state(false);
  let score = $state({ ok: 0, tot: 0 });
  let inputs = $state({ s: '', m: '', a: '', p: '' });
  let marks = $state({ s: null, m: null, a: null, p: null });
  let done = $state({});

  function fresh() {
    cur = genTable();
    shown = false;
    inputs = { s: '', m: '', a: '', p: '' };
    marks = { s: null, m: null, a: null, p: null };
    done = {};
  }

  function check() {
    QS.forEach(([k, , fn, tol]) => {
      const v = String(inputs[k] ?? '').trim();
      if (v === '') return;
      const good = Math.abs(+v - fn(cur)) <= tol + 1e-9;
      if (!done[k]) {
        score.tot++;
        if (good) score.ok++;
        done[k] = true;
      }
      marks[k] = good ? 'ok' : 'bad';
    });
  }

  function solve() {
    check();
    shown = true;
  }

  const solView = $derived.by(() => {
    if (!shown) return null;
    const c = cur;
    const F = TK.F;
    const EQ = TK.EQ;
    const mx = Math.max(c.tcS, ...c.steps.map((s) => s * c.tcM));
    const bars = NM.map((n, i) => {
      const mt = c.steps[i] * c.tcM;
      return {
        n,
        tot: c.tot[i],
        steps: c.steps[i],
        mt,
        sW: (100 * c.tcS) / mx,
        siW: (100 * c.tot[i]) / c.tcS,
        mW: (100 * mt) / mx,
        miW: (100 * c.tot[i]) / mt,
        cls: mt < c.tcS ? 'win' : mt > c.tcS ? 'lose' : ''
      };
    });
    const steps = [
      [R`\text{Load} = ${c.d.join(' + ')} = ${c.tot[0]},\ \text{Store} = ${c.tot[1]},\ \text{R} = ${c.tot[2]},\ \text{Branch} = ${c.tot[3]}`, 'Add the steps each class uses.'],
      [R`T_{c,\,single} = \max = ${c.tcS}\ \text{ps}`, 'The clock must fit the slowest instruction — the load, which uses all five steps.'],
      [R`T_{c,\,multi} = \max(${c.d.join(', ')}) = ${c.tcM}\ \text{ps}`, 'One step per cycle, so the clock only has to fit the slowest step.'],
      [
        R`\overline{T} = ${c.mix.map((m, i) => `${F(m / 100)} \\times ${c.steps[i]} \\times ${c.tcM}`).join(' + ')}`,
        'Load 5 cycles, store 4, R-format 4, branch 3 — weight each by its share of the program.'
      ],
      [
        R`= ${c.mix.map((m, i) => F((m / 100) * c.steps[i] * c.tcM)).join(' + ')} = ${F(c.avg)}\ \text{ps}\ \ ${
          c.avg > c.tcS ? R`> ${c.tcS} \Rightarrow \text{multi-cycle is slower here}` : c.avg < c.tcS ? R`< ${c.tcS} \Rightarrow \text{multi-cycle is faster here}` : R`= ${c.tcS}`
        }`,
        'Compare with the single-cycle time per instruction (its clock).'
      ],
      [
        R`\text{speedup}_{pipe} = \dfrac{T_{c,\,single}}{T_{c,\,pipe}} = \dfrac{${c.tcS}}{${c.tcM}} ${EQ(c.sp)} ${F(c.sp)}`,
        'An ideal pipeline uses the multi-cycle clock but finishes one instruction per cycle (CPI → 1 for a long program). It is below 5 because the stages are not balanced.'
      ]
    ];
    return { bars, steps, tcS: c.tcS, tcM: c.tcM };
  });
</script>

<ToolShell
  title="Clock drill"
  sub="a fresh delay table every time · single-cycle clock, multi-cycle clock and average, pipeline speedup"
>
  <div class="vz hd cd">
    <div class="ps-bar">
      <button type="button" class="mbtn go" onclick={fresh}>↻ New table</button>
      <span class="hd-score">
        {#if score.tot}
          score <b>{score.ok}</b>/{score.tot} answers
        {:else}
          single = slowest instruction · multi = slowest step · average = Σ mix × steps × clock
        {/if}
      </span>
    </div>

    <div class="hd-main">
      <div class="mp-pane">
        <div class="mp-ph"><span>Stage latencies (ps)</span><span class="mp-legend">— = step not used</span></div>
        <div class="cd-tbl">
          <table class="t nodeco mono">
            <thead>
              <tr>
                <th>Class</th>
                <th>Mix</th>
                {#each STG as s}
                  <th><span class="stg {s.toLowerCase()}">{s}</span></th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each NM as n, i}
                <tr>
                  <td>{n}</td>
                  <td class="tk-num">{cur.mix[i]}%</td>
                  {#each USES[i] as u, s}
                    <td class={u ? 'tk-num' : 'ref'}>{u ? cur.d[s] : '—'}</td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>

      <div class="mp-pane">
        <div class="mp-ph"><span>Your answers</span><span class="mp-legend">no pipeline-register delay</span></div>
        <div class="hd-qs">
          {#each QS as [k, lbl]}
            {@const m = marks[k]}
            <label class="hd-q">
              <span>{lbl}</span>
              <input
                type="number"
                step="any"
                inputmode="decimal"
                class={m || ''}
                bind:value={inputs[k]}
                onkeydown={(e) => e.key === 'Enter' && check()}
              />
              <i class={m || ''}>{m === 'ok' ? '✓' : m === 'bad' ? '✗' : ''}</i>
            </label>
          {/each}
          <div class="hd-btns">
            <button type="button" class="mbtn go" onclick={check}>Check</button>
            <button type="button" class="mbtn" onclick={solve}>Show the solution</button>
          </div>
        </div>
      </div>
    </div>

    {#if solView}
      <div class="hd-sol">
        <div class="hd-ans">
          {#each QS as x}
            <span>{x[1].replace(/ \(.*\)/, '')}: <b>{vizF(x[2](cur))}</b></span>
          {/each}
        </div>
        <div class="cd-vis">
          <div class="hd-dt">Time per instruction, to scale — solid = real work, empty = padding</div>
          {#each solView.bars as bar}
            <div class="cd-row">
              <span class="cd-n">{bar.n}</span>
              <div class="cd-bars">
                <div class="cd-b s" style="width:{bar.sW}%">
                  <i style="width:{bar.siW}%"></i>
                  <em>single: {bar.tot} of work in a {solView.tcS} cycle</em>
                </div>
                <div class="cd-b m {bar.cls}" style="width:{bar.mW}%">
                  <i style="width:{bar.miW}%"></i>
                  <em>multi: {bar.steps} × {solView.tcM} = {bar.mt}</em>
                </div>
              </div>
            </div>
          {/each}
        </div>
        <StepsList steps={solView.steps} />
      </div>
    {/if}
  </div>
</ToolShell>
