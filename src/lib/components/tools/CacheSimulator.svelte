<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import StepsList from '$lib/components/content/StepsList.svelte';

  let { opts = {} } = $props();

  const CS_PRE = {
    ph: { name: 'P&H §5.3: 8 blocks, word addresses 22 26 22 26 16 3 16 18', lines: 8, bw: 1, ways: 1, seq: '22 26 22 26 16 3 16 18' },
    conflict: { name: 'Conflict: 0 8 0 8 (8 blocks)', lines: 8, bw: 1, ways: 1, seq: '0 8 0 8 0 8' },
    assoc: { name: 'Same pattern, 2-way', lines: 8, bw: 1, ways: 2, seq: '0 8 0 8 0 8' },
    block: { name: 'Spatial locality: 4-word blocks', lines: 4, bw: 4, ways: 1, seq: '0 1 2 3 4 5 6 7 0 1' }
  };

  const p0 = CS_PRE[untrack(() => opts.preset || 'ph')];
  let presetKey = $state(untrack(() => opts.preset || 'ph'));
  let lines = $state(p0.lines);
  let bw = $state(p0.bw);
  let ways = $state(p0.ways);
  let seqStr = $state(p0.seq);

  function makeState(l, b, w, sqStr) {
    const seq = sqStr
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number)
      .filter((x) => isFinite(x) && x >= 0);
    const sets = Math.max(1, l / w);
    return {
      c: { lines: l, bw: b, ways: w, seq },
      sets,
      i: 0,
      hits: 0,
      set: Array.from({ length: sets }, () => []),
      log: [],
      last: null,
      evicted: null
    };
  }

  let st = $state(makeState(p0.lines, p0.bw, p0.ways, p0.seq));

  function reset() {
    st = makeState(Number(lines), Number(bw), Number(ways), seqStr);
  }

  function loadPreset(k) {
    presetKey = k;
    const p = CS_PRE[k];
    lines = p.lines;
    bw = p.bw;
    ways = p.ways;
    seqStr = p.seq;
    reset();
  }

  function access() {
    const c = st.c;
    if (st.i >= c.seq.length) return;
    const a = c.seq[st.i++];
    const blk = Math.floor(a / c.bw);
    const set = blk % st.sets;
    const tag = Math.floor(blk / st.sets);
    const S = st.set[set];
    const k = S.findIndex((x) => x.tag === tag);
    const hit = k >= 0;
    let way;
    if (hit) {
      const e = S.splice(k, 1)[0];
      S.push(e);
      st.hits++;
      way = e.way;
    } else {
      let ev = null;
      if (S.length >= c.ways) ev = S.shift();
      way = ev ? ev.way : S.length;
      S.push({ tag, blk, way });
      st.evicted = ev;
    }
    st.last = { a, blk, set, tag, hit, way, ev: hit ? null : st.evicted };
    st.log.push(st.last);
  }

  function runAll() {
    while (st.i < st.c.seq.length) access();
  }

  const rows = $derived.by(() => {
    const out = [];
    const c = st.c;
    const L = st.last;
    for (let s = 0; s < st.sets; s++) {
      for (let w = 0; w < c.ways; w++) {
        const e = st.set[s].find((x) => x.way === w);
        const on = L && L.set === s && L.way === w;
        out.push({
          cls: on ? (L.hit ? 'hit' : 'miss') : '',
          idx: w === 0 ? s.toString(2).padStart(Math.max(1, Math.log2(st.sets)), '0') : '',
          way: w,
          valid: e ? 'Y' : 'N',
          tag: e ? e.tag.toString(2) : '—',
          data: e ? `Mem[${e.blk * c.bw}${c.bw > 1 ? '…' + (e.blk * c.bw + c.bw - 1) : ''}]` : '—'
        });
      }
    }
    return out;
  });

  const lastSteps = $derived.by(() => {
    const L = st.last;
    const c = st.c;
    if (!L) return null;
    return [
      [String.raw`\text{block} = \lfloor ${L.a} / ${c.bw} \rfloor = ${L.blk}`, c.bw > 1 ? 'Several words share a block.' : 'One word per block.'],
      [
        String.raw`\text{index} = ${L.blk} \bmod ${st.sets} = ${L.set},\ \ \text{tag} = \lfloor ${L.blk} / ${st.sets} \rfloor = ${L.tag}`,
        'The index picks the set; the tag says which block is there.'
      ],
      [
        L.hit ? String.raw`\text{tag } ${L.tag} \text{ found} \Rightarrow \text{hit}` : String.raw`\text{tag } ${L.tag} \text{ not found} \Rightarrow \text{miss}`,
        L.hit
          ? 'Valid line with a matching tag.'
          : L.ev
            ? `Replaces the block with tag ${L.ev.tag} (least recently used).`
            : 'An empty line is filled.'
      ]
    ];
  });
</script>

<ToolShell title="Cache simulator" sub="word addresses · direct-mapped or set-associative · LRU">
  <div class="row">
    <label class="fld">
      Example
      <select value={presetKey} onchange={(e) => loadPreset(e.currentTarget.value)}>
        {#each Object.keys(CS_PRE) as k}
          <option value={k}>{CS_PRE[k].name}</option>
        {/each}
      </select>
    </label>
    <label class="fld">
      Blocks
      <select bind:value={lines} onchange={reset}>
        {#each [4, 8, 16] as v}
          <option value={v}>{v}</option>
        {/each}
      </select>
    </label>
    <label class="fld">
      Words per block
      <select bind:value={bw} onchange={reset}>
        {#each [1, 2, 4] as v}
          <option value={v}>{v}</option>
        {/each}
      </select>
    </label>
    <label class="fld">
      Ways
      <select bind:value={ways} onchange={reset}>
        {#each [1, 2, 4] as v}
          <option value={v}>{v}</option>
        {/each}
      </select>
    </label>
  </div>

  <div class="row">
    <label class="fld" style="flex:1 1 260px;min-width:220px">
      Word addresses (space-separated)
      <input type="text" style="width:100%" bind:value={seqStr} onchange={reset} />
    </label>
    <button type="button" class="btn" onclick={reset}>Reset</button>
    <button type="button" class="btn primary" onclick={access}>Next access ▸</button>
    <button type="button" class="btn" onclick={runAll}>Run all</button>
  </div>

  <div class="cs-grid">
    <div class="cs-pane">
      <div class="cs-h">Cache</div>
      <div class="cs-tbl">
        <table class="t cs-t">
          <thead>
            <tr>
              <th>{st.sets > 1 ? 'Index' : 'Set'}</th>
              {#if st.c.ways > 1}<th>Way</th>{/if}
              <th>V</th>
              <th>Tag</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {#each rows as r}
              <tr class={r.cls}>
                <td>{r.idx}</td>
                {#if st.c.ways > 1}<td>{r.way}</td>{/if}
                <td>{r.valid}</td>
                <td>{r.tag}</td>
                <td>{r.data}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <div class="cs-pane">
      <div class="cs-h">
        Accesses
        <span class="ref">
          {#if st.log.length}
            {st.hits} hits / {st.log.length} · hit rate {Math.round((100 * st.hits) / st.log.length)}%
          {/if}
        </span>
      </div>
      <div class="cs-log">
        {#if st.log.length}
          <table class="t cs-t">
            <thead>
              <tr>
                <th>#</th>
                <th>Addr</th>
                <th>Block</th>
                <th>{st.sets > 1 ? 'Index' : 'Set'}</th>
                <th>Tag</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {#each st.log as x, i}
                <tr class={x.hit ? 'hit' : 'miss'}>
                  <td>{i + 1}</td>
                  <td>{x.a}</td>
                  <td>{x.blk}</td>
                  <td>{x.set}</td>
                  <td>{x.tag}</td>
                  <td>{x.hit ? 'hit' : 'miss'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {:else}
          <p class="ref">Press “Next access”.</p>
        {/if}
      </div>
    </div>
  </div>

  <div class="out cs-out">
    {#if !lastSteps}
      <p class="ref">
        {st.sets} set{st.sets > 1 ? 's' : ''} × {st.c.ways} way{st.c.ways > 1 ? 's' : ''}, {st.c.bw} word{st.c.bw > 1 ? 's' : ''} per block.
        Block = ⌊address ÷ {st.c.bw}⌋, index = block mod {st.sets}, tag = ⌊block ÷ {st.sets}⌋.
      </p>
    {:else}
      <StepsList steps={lastSteps} />
    {/if}
  </div>
</ToolShell>
