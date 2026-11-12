<script>
  import ToolShell from './ToolShell.svelte';
  import StepsList from '$lib/components/content/StepsList.svelte';

  const PT = { 0: 5, 1: 9, 2: null, 3: 2, 4: 7, 5: null, 6: 1, 7: 3 };

  let ps = $state(4096);
  let vaStr = $state('0x3A7C');

  const view = $derived.by(() => {
    const pageSize = Number(ps);
    const ob = Math.log2(pageSize);
    const va = parseInt(vaStr, 16);
    const vpn = Math.floor(va / pageSize);
    const off = va % pageSize;
    const fr = PT[vpn];
    if (!isFinite(va)) {
      return { vpn, err: 'Type a hex address, e.g. 0x3A7C.' };
    }
    const hx = (n) => '\\texttt{0x' + n.toString(16).toUpperCase() + '}';
    const steps = [
      [String.raw`\text{offset bits} = \log_2 ${pageSize} = ${ob}`, 'The offset picks the byte inside a page and is not translated.'],
      [
        String.raw`VPN = \lfloor ${hx(va)} / ${pageSize} \rfloor = ${vpn},\ \ \text{offset} = ${hx(off)}`,
        'Split the address: the top bits are the virtual page number.'
      ]
    ];
    if (fr === undefined || fr === null) {
      steps.push([
        String.raw`\text{entry } ${vpn}\ \text{invalid} \Rightarrow \text{page fault}`,
        'The OS loads the page from disk, updates the table and restarts the instruction.'
      ]);
    } else {
      steps.push(
        [String.raw`\text{frame} = PT[${vpn}] = ${fr}`, 'Look up the page table.'],
        [String.raw`PA = ${fr} \times ${pageSize} + ${hx(off)} = ${hx(fr * pageSize + off)}`, 'Frame number, then the same offset.']
      );
    }
    return { vpn, steps };
  });
</script>

<ToolShell title="Virtual-to-physical translation" sub="page number → page table → frame number; the offset is copied">
  <div class="row">
    <label class="fld">
      Page size
      <select bind:value={ps}>
        <option value={4096}>4 KiB</option>
        <option value={1024}>1 KiB</option>
        <option value={16384}>16 KiB</option>
      </select>
    </label>
    <label class="fld">
      Virtual address (hex)
      <input type="text" bind:value={vaStr} />
    </label>
  </div>

  <div class="cs-grid vm-grid">
    <div class="cs-pane">
      <div class="cs-h">Page table</div>
      <div>
        <table class="t cs-t">
          <thead>
            <tr><th>VPN</th><th>Valid</th><th>Frame</th></tr>
          </thead>
          <tbody>
            {#each Object.keys(PT) as k}
              {@const match = +k === view.vpn}
              <tr class={match ? (PT[k] === null || PT[k] === undefined ? 'miss' : 'hit') : ''}>
                <td>{k}</td>
                <td>{PT[k] === null ? 0 : 1}</td>
                <td>{PT[k] === null ? '— (on disk)' : PT[k]}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
    <div class="cs-pane">
      <div class="cs-h">Translation</div>
      <div class="out">
        {#if view.err}
          <div class="err-msg">{view.err}</div>
        {:else}
          <StepsList steps={view.steps} />
        {/if}
      </div>
    </div>
  </div>
</ToolShell>
