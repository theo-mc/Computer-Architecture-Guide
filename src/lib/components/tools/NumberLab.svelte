<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import { Logic as L } from '$utils/logic.js';
  import { richHtml } from '$utils/actions.js';
  import {
    P2,
    grp,
    fmtN,
    fmtV,
    parseVal,
    bitRow,
    dial,
    explainConvert,
    addPanel,
    negPanel,
    extPanel,
    shiftPanel,
    ieeePanel,
    encodeSteps
  } from '$utils/numlab.js';

  let { opts = {} } = $props();

  const TABS = [
    ['convert', 'Convert'],
    ['add', 'Add / subtract'],
    ['neg', 'Negate'],
    ['ext', 'Extend'],
    ['shift', 'Shift & logic'],
    ['ieee', 'IEEE 754']
  ];

  const initSt = untrack(() => {
    const s = {
      n: opts.n || 8,
      a: 0,
      b: 0,
      op: opts.op || 'add',
      tab: opts.tab || 'convert',
      col: null,
      to: opts.to || 0,
      k: opts.k != null ? opts.k : 2,
      sop: opts.sop || 'sll',
      how: 'bin',
      dec: null,
      fenc: null
    };
    const init = parseVal(opts.a != null ? opts.a : '13', s.n);
    if (!init.err) {
      s.a = init.u;
      s.how = init.how;
      s.dec = init.dec;
    }
    const ib = parseVal(opts.b != null ? opts.b : '0b1010', s.n);
    if (!ib.err) s.b = ib.u;
    if (opts.float != null) {
      s.n = 32;
      s.a = L.floatToBits(opts.float);
      s.fenc = { x: opts.float, steps: encodeSteps(opts.float) };
    }
    return s;
  });

  let st = $state(initSt);
  let aInput = $state(untrack(() => (opts.a != null ? String(opts.a) : '13')));
  let bInput = $state(fmtV(initSt.b, initSt.n));
  let finInput = $state('');
  let msgText = $state('type decimal (−115), hex (0x8D) or binary (0b10001101)');
  let msgBad = $state(false);
  let phone = $state(typeof window !== 'undefined' ? (window.innerWidth || 1200) < 600 : false);
  let rootEl = $state(null);

  $effect(() => {
    const onResize = () => {
      const ph = (window.innerWidth || 1200) < 600;
      if (ph !== phone) phone = ph;
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  });

  function setMsg(t, bad = false) {
    msgText = t;
    msgBad = !!bad;
  }

  function setA(u, how, dec, keepText = false) {
    st.a = L.mask(u, st.n);
    st.how = how || 'bin';
    st.dec = dec;
    st.col = null;
    st.fenc = null;
    if (!keepText) aInput = fmtV(st.a, st.n);
  }

  function setWidth(w) {
    const sa = L.signed(st.a, st.n);
    const sb = L.signed(st.b, st.n);
    const fit = (x) => x >= -P2(w - 1) && x <= P2(w - 1) - 1;
    const ua = st.a;
    const ub = st.b;
    st.n = w;
    st.a = fit(sa) ? L.mask(sa, w) : L.mask(ua, w);
    st.b = fit(sb) ? L.mask(sb, w) : L.mask(ub, w);
    st.col = null;
    st.fenc = null;
    st.to = st.to > w ? st.to : Math.min(32, w * 2);
    st.k = Math.min(st.k, w - 1);
    aInput = String(L.signed(st.a, w));
    bInput = fmtV(st.b, w);
    st.how = st.a >= P2(w - 1) ? 'neg' : 'dec';
    st.dec = L.signed(st.a, w);
    setMsg(`${w} bits: unsigned 0 … ${fmtN(P2(w) - 1)}, signed ${fmtN(-P2(w - 1))} … ${fmtN(P2(w - 1) - 1)}`);
  }

  function onAInput() {
    const r = parseVal(aInput, st.n);
    if (r.err) {
      setMsg(r.err, true);
      return;
    }
    setMsg('A = ' + fmtN(r.u) + ' unsigned = ' + fmtN(L.signed(r.u, st.n)) + ' signed');
    setA(r.u, r.how, r.dec, true);
  }

  function onBInput() {
    const r = parseVal(bInput, st.n);
    if (r.err) {
      setMsg('B: ' + r.err, true);
      return;
    }
    setMsg('B = ' + fmtN(r.u));
    st.b = r.u;
    st.col = null;
  }

  function encodeFloat() {
    const raw = (finInput || '').trim().replace('−', '-');
    const x = raw === '' ? NaN : Number(raw);
    if (!isFinite(x)) {
      setMsg('Type a decimal number to encode, like −0.75.', true);
      return;
    }
    st.a = L.floatToBits(x);
    st.fenc = { x, steps: encodeSteps(x) };
    aInput = '0x' + L.hex(st.a, 32);
    const back = L.bitsToFloat(st.a);
    setMsg(
      back === x
        ? 'Encoded ' + x + ' as IEEE 754 single precision.'
        : 'Encoded ' + x + ' → nearest single-precision value is ' + back + ' (rounded).'
    );
  }

  function handleBoardClick(e) {
    const t = e.target.closest('button');
    if (!t || t.disabled) return;
    if (t.dataset.bit != null && t.dataset.k === 'ro') {
      setMsg('That row is worked out from A, so it follows A — click the bits of A (the top board, or the A row here) to change it.');
      const ar = rootEl?.querySelectorAll('[data-k="a"]') || [];
      ar.forEach((x) => {
        x.classList.remove('nl-ping');
        void x.offsetWidth;
        x.classList.add('nl-ping');
      });
      return;
    }
    if (t.dataset.bit != null) {
      const k = t.dataset.k;
      const i = +t.dataset.bit;
      if (k === 'a') {
        setA(Math.floor(st.a / P2(i)) % 2 ? st.a - P2(i) : st.a + P2(i), 'bin');
      } else if (k === 'b') {
        st.b = Math.floor(st.b / P2(i)) % 2 ? st.b - P2(i) : st.b + P2(i);
        st.col = null;
        bInput = fmtV(st.b, st.n);
      }
      return;
    }
    const nl = t.dataset.nl;
    if (nl === 'useneg') setA(P2(st.n) - st.a, 'bin');
    else if (nl === 'useres') setA(+t.dataset.v, 'bin');
    else if (nl === 'w32') setWidth(32);
  }

  const HINTS = {
    convert: 'Click any bit of A to flip it, or type a value above. Every view updates together.',
    neg: 'Negate works on A: click A’s bits (above, or the A row below). The dashed rows are worked out from it.',
    ieee: 'Click any bit of the 32-bit pattern: sign (red), exponent (green), fraction (blue).'
  };

  const aRowHtml = $derived(bitRow(st.a, st.n, 'a', st.tab === 'ieee' && st.n === 32 ? { fields: 1 } : {}, phone));
  const visHtml = $derived(
    st.tab === 'add' && st.n === 4
      ? dial(4, st.a, (() => {
          const r = L.addSub(st.a, st.b, 4, st.op);
          return { from: st.a, r: r.result, delta: st.b, op: st.op };
        })())
      : dial(st.n, st.a)
  );
  const readCards = $derived([
    ['binary', grp(L.bin(st.a, st.n)), 'b', 'tk-bin'],
    ['hex', '0x' + L.hex(st.a, st.n), 'h', 'tk-hex'],
    ['unsigned', fmtN(st.a), 'u', ''],
    ["two's complement", fmtN(L.signed(st.a, st.n)), 's', '']
  ]);
  const resHtml = $derived.by(() => {
    const n = st.n;
    const u = st.a;
    if (st.tab === 'convert') return explainConvert(u, n, st.how, st.dec);
    if (st.tab === 'add') return `<div class="nl-brow"><span class="nl-lab">B</span>${bitRow(st.b, n, 'b', { noW: 1, noIdx: 1, small: 1 }, phone)}</div>` + addPanel(st);
    if (st.tab === 'neg') return negPanel(st, phone);
    if (st.tab === 'ext') return extPanel(st, phone);
    if (st.tab === 'shift') return shiftPanel(st, phone);
    if (st.tab === 'ieee') return ieeePanel(st);
    return '';
  });

  const extTargets = $derived([8, 16, 32].filter((w) => w > st.n));
  const extSelected = $derived(st.to > st.n ? st.to : Math.min(32, st.n * 2));
</script>

<ToolShell title="Number lab" sub="one bit pattern, every view · click any bit to flip it" className="nl">
  <div bind:this={rootEl}>
    <div class="nl-head">
      <div class="seg" data-g="w" role="group" aria-label="width" data-resize>
        {#each [4, 8, 16, 32] as w}
          <button type="button" aria-pressed={w === st.n} onclick={() => setWidth(w)}>{w}-bit</button>
        {/each}
      </div>
      <label class="nl-in">
        <span>A =</span>
        <input bind:value={aInput} oninput={onAInput} spellcheck="false" autocomplete="off" aria-label="value of A" />
      </label>
      <button type="button" class="mbtn" onclick={() => setA(0, 'bin')}>Clear</button>
      <button type="button" class="mbtn" onclick={() => setA(Math.floor(Math.random() * P2(st.n)), 'bin')}>Random</button>
      <span class="nl-msg" class:bad={msgBad}>{msgText}</span>
    </div>

    <div class="nl-top">
      <div class="nl-left">
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div class="nl-arow" onclick={handleBoardClick}>{@html aRowHtml}</div>
        <div class="nl-read">
          {#each readCards as [lbl, val, c, cls]}
            <div class="nl-card c-{c}">
              <span>{lbl}</span>
              <b>{#if cls}<span class={cls}>{val}</span>{:else}{val}{/if}</b>
            </div>
          {/each}
        </div>
      </div>
      <div class="nl-vis">{@html visHtml}</div>
    </div>

    <div class="seg nl-tabs" role="tablist">
      {#each TABS as t}
        <button
          type="button"
          role="tab"
          aria-selected={t[0] === st.tab}
          aria-pressed={t[0] === st.tab}
          onclick={() => (st.tab = t[0])}
        >
          {t[1]}
        </button>
      {/each}
    </div>

    <div class="nl-panel">
      <div class="nl-ctl">
        {#if st.tab === 'add'}
          <div class="seg">
            {#each [['add', 'A + B'], ['sub', 'A − B']] as x}
              <button
                type="button"
                aria-pressed={x[0] === st.op}
                onclick={() => {
                  st.op = x[0];
                  st.col = null;
                }}
              >
                {x[1]}
              </button>
            {/each}
          </div>
          <label class="nl-in">
            <span>B =</span>
            <input
              bind:value={bInput}
              oninput={onBInput}
              spellcheck="false"
              autocomplete="off"
              aria-label="value of B"
              style="width:{st.n <= 8 ? 150 : st.n <= 16 ? 200 : 170}px"
            />
          </label>
          <div class="nl-colbtns">
            <button
              type="button"
              class="mbtn"
              aria-label="previous column"
              onclick={() => (st.col = st.col == null ? st.n - 1 : Math.max(0, st.col - 1))}
            >
              ◀
            </button>
            <button
              type="button"
              class="mbtn go"
              onclick={() => (st.col = st.col == null ? 0 : Math.min(st.n - 1, st.col + 1))}
            >
              column ▶
            </button>
            <button type="button" class="mbtn" onclick={() => (st.col = null)}>clear</button>
          </div>
        {:else if st.tab === 'ext' && st.n !== 32}
          <label class="nl-in">
            <span>extend to</span>
            <select value={extSelected} onchange={(e) => (st.to = +e.currentTarget.value)}>
              {#each extTargets as w}
                <option value={w}>{w}</option>
              {/each}
            </select>
            <span>bits</span>
          </label>
        {:else if st.tab === 'shift'}
          <div class="seg">
            {#each ['sll', 'srl', 'sra', 'and', 'or', 'xor', 'nor'] as x}
              <button type="button" aria-pressed={x === st.sop} onclick={() => (st.sop = x)}>{x}</button>
            {/each}
          </div>
          <label
            class="nl-in"
            style="visibility:{['and', 'or', 'xor', 'nor'].includes(st.sop) ? 'hidden' : 'visible'}"
          >
            <span>shift by</span>
            <input
              type="number"
              min="0"
              max={st.n - 1}
              value={st.k}
              oninput={(e) => (st.k = Math.max(0, Math.min(st.n - 1, +e.currentTarget.value || 0)))}
              style="width:64px"
            />
          </label>
        {:else if st.tab === 'ieee'}
          <label class="nl-in">
            <span>encode</span>
            <input bind:value={finInput} placeholder="e.g. -0.75 or 5.5" style="width:150px" />
          </label>
          <button type="button" class="mbtn go" onclick={encodeFloat}>into A ▸</button>
        {:else}
          <span class="ref">{HINTS[st.tab] || 'Click A’s bits to change it; dashed rows are worked out from A.'}</span>
        {/if}
      </div>

      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="nl-res" use:richHtml={resHtml} onclick={handleBoardClick}></div>
    </div>
  </div>
</ToolShell>
