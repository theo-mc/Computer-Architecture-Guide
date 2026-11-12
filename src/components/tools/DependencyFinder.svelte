<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import { Logic } from '@/utils/logic.js';
  import { esc } from '@/utils/html.js';
  import { pdAsm, pdText } from '@/utils/svg.js';

  let { opts = {} } = $props();

  const uid = 'df' + Math.random().toString(36).slice(2, 7);
  let code = $state(
    untrack(() => opts.code || 'Mult R1, R2, R3\nDiv  R3, R1, R5\nAdd  R2, R3, R4\nDiv  R4, R7, R6\nAdd  R4, R8, R5')
  );
  let show = $state({ raw: true, war: true, waw: true });
  let hov = $state(null);

  let taEl = $state(null);
  let hlEl = $state(null);

  const parsed = $derived.by(() => {
    const pp = Logic.parsePipeProgram(code);
    if (pp.errors.length) return { err: pp.errors.join(' · ') };
    const ins = pp.instrs;
    const d = Logic.deps(ins);
    const s0 = Logic.simulate(ins, {});
    const s1 = Logic.simulate(ins, { fwd: true });
    return { ins, d, s0, s1 };
  });

  const arcsSvg = $derived.by(() => {
    if (parsed.err) return '';
    const { ins, d } = parsed;
    const N = ins.length;
    const RH = 32, W = 360, H = Math.max(6, N) * RH + 14, xL = 158;
    let g = '';
    ins.forEach((x, i) => {
      const y = 12 + i * RH + RH / 2;
      g += `<text x="6" y="${y + 4}" class="pd-i">I${i + 1}</text><text x="30" y="${y + 4}" class="pd-t">${pdText(x.text)}</text><circle cx="${xL}" cy="${y}" r="3" class="df-dot"/>`;
    });
    const all = [];
    [['raw', d.raw], ['war', d.war], ['waw', d.waw]].forEach(([t, list]) =>
      list.forEach((x) => all.push(Object.assign({ t }, x)))
    );
    all.sort((a2, b2) => a2.j - a2.i - (b2.j - b2.i));
    all.forEach((x, n) => {
      if (!show[x.t]) return;
      const y1 = 12 + x.i * RH + RH / 2;
      const y2 = 12 + x.j * RH + RH / 2;
      const r = 22 + (x.j - x.i) * 24 + (n % 4) * 11;
      const key = x.t + x.i + '-' + x.j;
      const on = hov === key;
      const dim = hov && !on ? 'dim' : '';
      g += `<path d="M${xL} ${y1} C ${xL + r} ${y1}, ${xL + r} ${y2}, ${xL + 4} ${y2}" class="df-arc a-${x.t} ${on ? 'on' : ''} ${dim}" marker-end="url(#dfm-${uid}-${x.t})"/><text x="${xL + r * 0.75 + 4}" y="${(y1 + y2) / 2 + 4}" class="df-al a-${x.t} ${dim}">${esc(x.reg)}</text>`;
    });
    const mk = (t) =>
      `<marker id="dfm-${uid}-${t}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L8 4L0 8z" class="df-mk a-${t}"/></marker>`;
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="pd-svg"><defs>${mk('raw')}${mk('war')}${mk('waw')}</defs>${g}</svg>`;
  });

  const tables = $derived(
    parsed.err
      ? []
      : [
          { t: 'raw', title: 'RAW · read after write (true dependence)', list: parsed.d.raw, extra: true },
          { t: 'war', title: 'WAR · write after read (anti)', list: parsed.d.war, extra: false },
          { t: 'waw', title: 'WAW · write after write (output)', list: parsed.d.waw, extra: false }
        ]
  );

  function syncScroll() {
    if (hlEl && taEl) {
      hlEl.scrollTop = taEl.scrollTop;
      hlEl.scrollLeft = taEl.scrollLeft;
    }
  }
</script>

<ToolShell title="Data dependency finder" sub="RAW, WAR and WAW — drawn as arcs and listed like the official answer tables">
  <div class="df">
    <div class="df-top">
      <div class="mp-pane df-src">
        <div class="mp-ph">
          <span>Instructions</span>
          <span class="mp-legend">op dest, src1, src2 · lw rt, off(base)</span>
        </div>
        <div class="mp-edw">
          <pre class="mp-edhl" aria-hidden="true" bind:this={hlEl}>{@html pdAsm(code) + '\n'}</pre>
          <textarea bind:this={taEl} bind:value={code} onscroll={syncScroll} spellcheck="false" aria-label="instructions"></textarea>
        </div>
      </div>

      <div class="mp-pane df-arcs">
        <div class="mp-ph">
          <span>Dependency arcs</span>
          <span class="df-flt">
            {#each ['raw', 'war', 'waw'] as k}
              <button
                type="button"
                aria-pressed={show[k]}
                onclick={() => (show[k] = !show[k])}
              >
                {k.toUpperCase()}
              </button>
            {/each}
          </span>
        </div>
        <div class="df-svg">{@html arcsSvg}</div>
      </div>
    </div>

    <div class="df-msg">
      {#if parsed.err}
        <div class="err-msg">{parsed.err}</div>
      {:else}
        <div class="ps-deps">
          <span class="dp-raw"><b>{parsed.d.raw.length}</b> RAW</span>
          <span class="dp-war"><b>{parsed.d.war.length}</b> WAR</span>
          <span class="dp-waw"><b>{parsed.d.waw.length}</b> WAW</span>
          <span class="ref">
            whole sequence: <b class="tk-num">{parsed.s0.stalls}</b> stall cycles without forwarding,
            <b class="tk-num">{parsed.s1.stalls}</b> with
          </span>
        </div>
      {/if}
    </div>

    {#if !parsed.err}
      <div class="mp-pane df-tbl">
        <div class="mp-ph">
          <span>Tables</span>
          <span class="mp-legend">hover a row to light up its arc</span>
        </div>
        <div class="df-tw" onmouseleave={() => (hov = null)}>
          {#each tables as tb}
            <div class="df-t a-{tb.t}">
              <div class="df-th">
                <span class="df-sw"></span>
                <b>{tb.title}</b>
                <span class="ref">{tb.list.length}</span>
              </div>
              <table class="t nodeco">
                <thead>
                  <tr>
                    <th>X</th>
                    <th>Y</th>
                    <th>Reg</th>
                    <th>Dist.</th>
                    {#if tb.extra}
                      <th>Stalls no fwd</th>
                      <th>Stalls fwd</th>
                    {:else}
                      <th></th>
                    {/if}
                  </tr>
                </thead>
                <tbody>
                  {#each tb.list as x}
                    {@const key = tb.t + x.i + '-' + x.j}
                    <tr class:on={hov === key} onmouseenter={() => (hov = key)}>
                      <td>I{x.i + 1}</td>
                      <td>I{x.j + 1}</td>
                      <td><span class="tk-reg">{x.reg}</span></td>
                      <td class="tk-num">{x.dist}</td>
                      {#if tb.extra}
                        <td class="tk-num">{Logic.rawPenalty(x.dist, x.load, false)}</td>
                        <td class="tk-num">
                          {Logic.rawPenalty(x.dist, x.load, true)}{#if x.load && x.dist === 1}{' '}<span class="ref">load-use</span>{/if}
                        </td>
                      {:else}
                        <td class="ref">never stalls in-order</td>
                      {/if}
                    </tr>
                  {:else}
                    <tr><td colspan={tb.extra ? 6 : 5} class="ref">none</td></tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</ToolShell>
