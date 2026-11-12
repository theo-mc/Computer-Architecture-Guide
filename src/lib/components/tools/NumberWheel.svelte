<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import { uid as mkUid } from '$utils/viz.js';

  let { opts = {} } = $props();

  const uid = mkUid('nw');
  let n = $state(untrack(() => opts.n || 4));
  let A = $state(untrack(() => (opts.a != null ? opts.a : 5)));
  let B = $state(untrack(() => (opts.b != null ? opts.b : 6)));
  let op = $state(untrack(() => opts.op || 'add'));

  const N = $derived(1 << n);
  const bin = (u) => u.toString(2).padStart(n, '0');

  let aTxt = $state(binTextInit(untrack(() => (opts.a != null ? opts.a : 5)), untrack(() => opts.n || 4)));
  let bTxt = $state(binTextInit(untrack(() => (opts.b != null ? opts.b : 6)), untrack(() => opts.n || 4)));

  function binTextInit(v, bits) {
    return v.toString(2).padStart(bits, '0');
  }

  function syncText() {
    aTxt = bin(A);
    bTxt = bin(B);
  }

  function parseVal(s, old) {
    s = s.trim().replace('−', '-');
    if (/^[01]{2,}$/.test(s) && s.length <= n + 1) return parseInt(s, 2) % N;
    if (/^-?\d+$/.test(s)) {
      const v = +s;
      if (v >= -(N / 2) && v < N) return ((v % N) + N) % N;
    }
    return old;
  }

  const view = $derived.by(() => {
    const sg = (u) => (u >= N / 2 ? u - N : u);
    const Bs = sg(B),
      As = sg(A),
      dirU = op === 'add' ? 1 : -1,
      stepsU = B,
      Rv = (((A + dirU * B) % N) + N) % N;
    const sStep = op === 'add' ? Bs : -Bs;
    const carry = op === 'add' ? A + B >= N : A < B;
    const trueS = op === 'add' ? As + Bs : As - Bs;
    const ovf = trueS > N / 2 - 1 || trueS < -N / 2;
    const trueU = op === 'add' ? A + B : A - B;

    const cx = 220,
      cy = 220,
      R0 = 150;
    const ang = (i) => (i / N) * 2 * Math.PI - Math.PI / 2;
    const P = (i, r) => [cx + r * Math.cos(ang(i)), cy + r * Math.sin(ang(i))];

    let g = `<defs><marker id="${uid}u" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L8 4L0 8z" class="nw-mu"/></marker><marker id="${uid}s" viewBox="0 0 8 8" refX="6" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L8 4L0 8z" class="nw-ms"/></marker></defs>`;
    g += `<circle cx="${cx}" cy="${cy}" r="${R0}" class="nw-ring"/>`;
    const bt = P(-0.5, R0 - 62),
      bt2 = P(-0.5, R0 + 46),
      bb = P(N / 2 - 0.5, R0 - 62),
      bb2 = P(N / 2 - 0.5, R0 + 46);
    g += `<line x1="${bt[0]}" y1="${bt[1]}" x2="${bt2[0]}" y2="${bt2[1]}" class="nw-cut u ${carry ? 'hit' : ''}"/><line x1="${bb[0]}" y1="${bb[1]}" x2="${bb2[0]}" y2="${bb2[1]}" class="nw-cut s ${ovf ? 'hit' : ''}"/>`;
    g += `<text x="${cx}" y="-4" class="nw-cl u" text-anchor="middle">unsigned wraps here: ${N - 1} | 0 → carry</text><text x="${cx}" y="460" class="nw-cl s" text-anchor="middle">signed wraps here: ${N / 2 - 1} | −${N / 2} → overflow</text>`;

    const arc = (from, steps, r, cls, mk) => {
      if (!steps) return '';
      const a0 = ang(from),
        a1 = a0 + (steps / N) * 2 * Math.PI,
        pad = steps > 0 ? 0.03 : -0.03;
      const x0 = cx + r * Math.cos(a0 + pad),
        y0 = cy + r * Math.sin(a0 + pad),
        x1 = cx + r * Math.cos(a1 - pad),
        y1 = cy + r * Math.sin(a1 - pad);
      return `<path d="M${x0} ${y0} A ${r} ${r} 0 ${Math.abs(steps) > N / 2 ? 1 : 0} ${steps > 0 ? 1 : 0} ${x1} ${y1}" class="nw-arc ${cls}" marker-end="url(#${uid}${mk})"/>`;
    };
    g += arc(A, dirU * stepsU, R0 + 44, 'u', 'u') + arc(A, sStep, R0 - 44, 's', 's');

    for (let i = 0; i < N; i++) {
      const p = P(i, R0),
        pb = P(i, R0),
        pu = P(i, R0 + 24),
        ps = P(i, R0 - 24),
        isA = i === A,
        isR = i === Rv;
      g += `<g class="nw-n ${isA ? 'a' : ''} ${isR ? 'r' : ''} ${sg(i) < 0 ? 'neg' : ''}" data-i="${i}" tabindex="0" role="button" aria-label="${bin(i)}"><circle cx="${p[0]}" cy="${p[1]}" r="${
        n === 5 ? 13.5 : 19
      }"/><text x="${pb[0]}" y="${pb[1] + 3.5}" class="nw-b" style="font-size:${n === 5 ? 7.4 : n === 4 ? 10.5 : 12.5}px">${bin(i)}</text><text x="${pu[0]}" y="${
        pu[1] + 4
      }" class="nw-u">${i}</text><text x="${ps[0]}" y="${ps[1] + 4}" class="nw-s">${sg(i) < 0 ? '−' + -sg(i) : sg(i)}</text></g>`;
    }
    g += `<text x="${cx}" y="${cy - 26}" class="nw-c1">${bin(A)} ${op === 'add' ? '+' : '−'} ${bin(B)}</text><text x="${cx}" y="${cy + 2}" class="nw-c2">= ${bin(Rv)}</text><text x="${cx}" y="${cy + 24}" class="nw-c3 u">outer ring: unsigned</text><text x="${cx}" y="${cy + 38}" class="nw-c3 s">inner ring: two’s complement</text>`;

    const sym = op === 'add' ? '+' : '−';
    const m = (v) => (v < 0 ? '−' + -v : '' + v);
    const sideHtml = `<div class="nw-card u ${carry ? 'bad' : 'ok'}"><div class="nw-ch">Read as unsigned</div><div class="nw-eq">${A} ${sym} ${B} = <b>${Rv}</b></div>
        <div class="nw-v">${
          carry
            ? `✗ wrong — the true answer ${m(trueU)} does not fit in ${n} bits (0…${N - 1}). The walk crossed the top: ${
                op === 'add' ? 'carry out = 1' : 'a borrow (B is bigger than A)'
              }.`
            : `✓ correct — the walk of ${B} step${B === 1 ? '' : 's'} ${op === 'add' ? 'clockwise' : 'anticlockwise'} never crossed the top.`
        }</div></div>
      <div class="nw-card s ${ovf ? 'bad' : 'ok'}"><div class="nw-ch">Read as two’s complement</div><div class="nw-eq">${m(As)} ${sym} ${
      Bs < 0 ? '(' + m(Bs) + ')' : m(Bs)
    } = <b>${m(sg(Rv))}</b></div>
        <div class="nw-v">${
          ovf
            ? `✗ overflow — the true answer ${m(trueS)} is outside ${m(-N / 2)}…${N / 2 - 1}. The walk crossed the bottom, so the sign bit came out wrong.`
            : `✓ correct — ${Math.abs(sStep)} step${Math.abs(sStep) === 1 ? '' : 's'} ${sStep >= 0 ? 'clockwise' : 'anticlockwise'} without crossing the bottom.`
        }</div></div>
      <div class="nw-card"><div class="nw-ch">What the hardware does</div><div class="nw-v">${
        op === 'sub' ? `Subtract = add the negation: ${bin(A)} + (invert ${bin(B)} → ${bin((N - 1) ^ B)}, + 1 → ${bin((N - B) % N)}). ` : ''
      }The adder produces the same ${n} bits <b>${bin(Rv)}</b> either way; only the <i>reading</i> differs. Unsigned programs watch the carry; signed programs watch overflow (L08 s11–s12): overflow can only happen when ${
        op === 'add' ? 'both operands have the same sign' : 'the operands have different signs'
      } and the result’s sign is ${op === 'add' ? 'different from theirs' : 'different from A’s'}.</div></div>
      <div class="vz-note">Negating a number mirrors it left ↔ right across the vertical line through 0 — except ${bin(N / 2)} (−${
      N / 2
    }), which has no positive partner. Going clockwise by ${N - 1} is the same as going back by 1: that is why −1 is all ones.</div>`;

    return { svg: g, sideHtml };
  });

  function setBits(newN) {
    n = newN;
    const nw = 1 << newN;
    A = A % nw;
    B = B % nw;
    syncText();
  }

  function onSvgClick(e) {
    const nd = e.target.closest('[data-i]');
    if (nd) {
      A = +nd.dataset.i;
      syncText();
    }
  }

  function onSvgKeydown(e) {
    const nd = e.target.closest?.('[data-i]');
    if (nd && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      A = +nd.dataset.i;
      syncText();
    }
  }
</script>

<ToolShell
  title="The number wheel"
  sub="one adder, two readings: unsigned goes wrong at the top, two’s complement at the bottom"
>
  <div class="vz nw">
    <div class="ps-bar">
      <div class="ps-tg">
        <span>Bits</span>
        <div class="seg mini">
          {#each [3, 4, 5] as b}
            <button type="button" aria-pressed={n === b} onclick={() => setBits(b)}>{b}</button>
          {/each}
        </div>
      </div>
      <div class="ps-tg">
        <span>Operation</span>
        <div class="seg mini">
          <button type="button" aria-pressed={op === 'add'} onclick={() => (op = 'add')}>A + B</button>
          <button type="button" aria-pressed={op === 'sub'} onclick={() => (op = 'sub')}>A − B</button>
        </div>
      </div>
      <label class="nw-in">
        <span>A</span>
        <input
          type="text"
          bind:value={aTxt}
          onchange={() => {
            A = parseVal(aTxt, A);
            syncText();
          }}
          onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          spellcheck="false"
        />
      </label>
      <label class="nw-in">
        <span>B</span>
        <input
          type="text"
          bind:value={bTxt}
          onchange={() => {
            B = parseVal(bTxt, B);
            syncText();
          }}
          onkeydown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          spellcheck="false"
        />
      </label>
      <span class="ref">type bits (0101), or a decimal such as 5 or −3 · or click the wheel to set A</span>
    </div>

    <div class="nw-main">
      <div class="vz-canvas nw-canvas">
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <svg
          class="nw-svg"
          viewBox="0 -16 440 480"
          role="img"
          aria-label="number wheel"
          onclick={onSvgClick}
          onkeydown={onSvgKeydown}
        >
          {@html view.svg}
        </svg>
      </div>
      <div class="nw-side">{@html view.sideHtml}</div>
    </div>
  </div>
</ToolShell>
