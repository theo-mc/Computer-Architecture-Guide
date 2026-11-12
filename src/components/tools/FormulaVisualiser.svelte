<script>
  import { FX_DEFS } from '@/data/index.js';
  import { setTextScale, tickLabel } from '@/utils/svg.js';
  import { holdCardHeight, richHtml } from '@/utils/actions.js';
  import { renderMath } from '@/utils/math.js';
  import StepsList from '@/components/content/StepsList.svelte';

  const VC = ['blue', 'orange', 'green', 'magenta', 'teal', 'red', 'cyan', 'yellow'];
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  function sliderPos(val, d) {
    return d.log
      ? ((Math.log10(val) - Math.log10(d.min)) / (Math.log10(d.max) - Math.log10(d.min))) * 1000
      : ((val - d.min) / (d.max - d.min)) * 1000;
  }

  function sliderVal(p, d) {
    let val = d.log
      ? Math.pow(10, Math.log10(d.min) + (p / 1000) * (Math.log10(d.max) - Math.log10(d.min)))
      : d.min + (p / 1000) * (d.max - d.min);
    if (d.step) val = Math.round(val / d.step) * d.step;
    if (d.log && !d.step) val = +val.toPrecision(3);
    return +val.toPrecision(10);
  }

  function colourTex(tex, syms) {
    if (!syms.length) return tex;
    const parts = [];
    let k = 0;
    const re = /\\(?:text|mathrm|operatorname|textbf)\{[^{}]*\}/g;
    let m;
    while ((m = re.exec(tex))) {
      parts.push([tex.slice(k, m.index), 1]);
      parts.push([m[0], 0]);
      k = m.index + m[0].length;
    }
    parts.push([tex.slice(k), 1]);
    const sorted = syms.slice().sort((a, b) => b[0].length - a[0].length);
    return parts
      .map(([t, can]) => {
        if (!can) return t;
        const marks = [];
        let out = t;
        sorted.forEach(([sym, ci]) => {
          const e = sym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const rx = new RegExp(
            '(?<![\\\\A-Za-z])' + e + (/[A-Za-z}]$/.test(sym) ? '(?![A-Za-z_])' : ''),
            'g'
          );
          out = out.replace(rx, () => {
            marks.push(`\\htmlClass{fxc fxc-${ci}}{${sym}}`);
            return '\u0000' + (marks.length - 1) + '\u0001';
          });
        });
        return out.replace(/\u0000(\d+)\u0001/g, (_, n) => marks[+n]);
      })
      .join('');
  }

  function symOf(label) {
    const m = String(label).match(/\\\((.+?)\\\)/);
    return m ? m[1].trim() : null;
  }

  let { id, opts = {} } = $props();

  let d = $derived(FX_DEFS[id]);

  function initVals(defSpec, options) {
    const out = {};
    if (!defSpec) return out;
    (defSpec.vars || []).forEach((x) => {
      out[x.k] = options && options[x.k] != null ? options[x.k] : x.v;
    });
    return out;
  }

  let vals = $state({});
  let mode = $state(null);
  let activePre = $state(-1);
  let stepsOpen = $state(false);
  let vizEl = $state(null);
  let topEl = $state(null);

  $effect(() => {
    const defSpec = d;
    vals = initVals(defSpec, opts);
    mode = (opts && opts.mode) || (defSpec?.modes ? defSpec.modes[0][0] : null);
    activePre = -1;
  });

  let syms = $derived.by(() => {
    if (!d) return [];
    const list = [];
    (d.vars || []).forEach((x, i) => {
      const sy = x.sym || symOf(x.label);
      if (sy && !list.some((q) => q[0] === sy)) {
        list.push([sy, x.col ? VC.indexOf(x.col) : i % VC.length]);
      }
    });
    return list;
  });

  function legCol(sym) {
    const h = syms.find((q) => q[0] === sym || sym.split(/\s*,\s*/).includes(q[0]));
    return h ? VC[h[1]] : null;
  }

  let res = $derived.by(() => {
    if (!d) return { err: `No visualiser called "${id}".` };
    const vw = vizEl ? vizEl.clientWidth : 0;
    const ts = vw && vw < 420 ? Math.max(1, Math.min(1.45, 440 / vw)) : 1;
    setTextScale(ts);
    let r;
    try {
      r = d.calc(vals, mode);
    } catch (e) {
      r = { err: e.message };
    }
    setTextScale(1);
    return { ...r, tsUsed: ts };
  });

  $effect(() => {
    if (!vizEl || res.err) return;
    vizEl.innerHTML = res.viz || '';
    if (res.tsUsed > 1) {
      vizEl.querySelectorAll('svg').forEach((sv) => {
        const vb = (sv.getAttribute('viewBox') || '').split(/\s+/).map(Number);
        if (vb.length !== 4) return;
        const m = Math.round(vb[2] * (res.tsUsed - 1) * 0.22);
        sv.setAttribute('viewBox', `${vb[0] - m} ${vb[1]} ${vb[2] + 2 * m} ${vb[3]}`);
      });
    }
  });

  $effect(() => {
    if (!topEl || !d) return;
    const fx = topEl.querySelector('.fx-f');
    if (fx && fx.querySelector('.katex-error')) {
      fx.innerHTML = `\\[${d.tex}\\]`;
      renderMath(fx);
    }
  });

  function onNumInput(x, raw) {
    const val = parseFloat(raw);
    if (!isFinite(val)) return;
    let v = x.hardMin != null ? Math.max(x.hardMin, val) : val;
    if (x.int) v = Math.round(v);
    vals = { ...vals, [x.k]: v };
    activePre = -1;
  }

  function onRangeInput(x, raw) {
    vals = { ...vals, [x.k]: sliderVal(+raw, x) };
    activePre = -1;
  }

  function applyPreset(pr, idx) {
    vals = { ...vals, ...pr[1] };
    if (pr[2]) mode = pr[2];
    activePre = idx;
  }

  let mappedSteps = $derived(
    (res.steps || []).map((q) => [
      /^\s*</.test(q[0]) ? q[0] : '\\(\\displaystyle ' + q[0] + '\\)',
      q[1]
    ])
  );
</script>

{#if !d}
  <div class="err-msg">No visualiser called "{id}".</div>
{:else}
  <div class="fx-card ln-skip" use:holdCardHeight>
    <div class="fx-h">
      <span class="fx-tag">Formula visualiser</span>
      <b>{@html d.title}</b>
      {#if d.ref}<span class="ref">{d.ref}</span>{/if}
    </div>

    <div class="fx-top" bind:this={topEl}>
      <div class="fx-f" use:richHtml={`\\[${colourTex(d.tex, syms)}\\]`}></div>
      {#if d.legend}
        <dl class="fx-legend">
          {#each d.legend as s2}
            {@const c = legCol(s2[0])}
            <dt style={c ? `--vc:var(--c-${c})` : undefined} class:has-c={!!c} use:richHtml={`\\(${s2[0]}\\)`}></dt>
            <dd use:richHtml={s2[1]}></dd>
          {/each}
        </dl>
      {/if}
    </div>

    <div class="fx-body">
      <div class="fx-ctl">
        {#if d.modes}
          <div class="seg fx-modes">
            {#each d.modes as m}
              <button
                type="button"
                aria-pressed={m[0] === mode}
                onclick={() => {
                  mode = m[0];
                  activePre = -1;
                }}
              >
                {m[1]}
              </button>
            {/each}
          </div>
        {/if}

        {#each d.vars || [] as x, i}
          {@const off = !!(x.modes && x.modes.indexOf(mode) < 0)}
          {@const curV = vals[x.k] ?? x.v}
          {@const pos = sliderPos(clamp(curV, x.min, x.max), x)}
          <div class="fx-var" class:off style="--vc:var(--c-{x.col || VC[i % VC.length]})">
            <label>
              <span class="fx-sw"></span>
              <span class="fx-vl" use:richHtml={x.label}></span>
              <span class="fx-in">
                <input
                  type="number"
                  step="any"
                  value={+(+curV).toPrecision(8)}
                  disabled={off}
                  aria-label={x.k}
                  oninput={(e) => onNumInput(x, e.currentTarget.value)}
                />
                {#if x.unit}<span class="fx-u">{x.unit}</span>{/if}
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="1000"
              value={pos}
              disabled={off}
              style="--p:{pos / 10}%"
              aria-label="{x.k} slider"
              oninput={(e) => onRangeInput(x, e.currentTarget.value)}
            />
            <div class="fx-mm nodeco">
              <span>{tickLabel(x.min)}</span>
              <span>{tickLabel(x.max)}</span>
            </div>
          </div>
        {/each}

        {#if d.presets}
          <div class="fx-presets">
            <span class="fx-pl">Try an example</span>
            {#each d.presets as p, i}
              <button
                type="button"
                class="fx-pre"
                aria-pressed={activePre === i}
                onclick={() => applyPreset(p, i)}
              >
                {p[0]}
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <div class="fx-viz" class:dim={!!res.err} bind:this={vizEl}></div>
    </div>

    <div class="fx-subw">
      <span class="fx-subl">with your numbers</span>
      <div class="fx-sub">
        {#if res.err}
          <div class="err-msg">{@html res.err}</div>
        {:else if res.sub}
          <div use:richHtml={`\\[${res.sub}\\]`}></div>
        {/if}
      </div>
    </div>

    <div class="fx-note" use:richHtml={!res.err && res.note ? res.note : ''}></div>

    <details
      class="fx-steps"
      data-resize
      ontoggle={(e) => {
        stepsOpen = e.currentTarget.open;
      }}
    >
      <summary>Show the working, step by step</summary>
      <div class="fx-sw2">
        {#if stepsOpen && !res.err}
          <StepsList steps={mappedSteps} />
        {/if}
      </div>
    </details>
  </div>
{/if}
