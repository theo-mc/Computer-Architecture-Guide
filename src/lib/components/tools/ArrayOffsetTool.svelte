<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import StepsList from '$lib/components/content/StepsList.svelte';
  import { richHtml } from '$utils/actions.js';

  const R = String.raw;
  let { opts = {} } = $props();

  let arrName = $state(untrack(() => opts.n || 'A'));
  let iStr = $state(untrack(() => (opts.i != null ? String(opts.i) : '8')));
  let baseReg = $state(untrack(() => opts.r || '$s3'));
  let baseAddrStr = $state(untrack(() => (opts.b != null ? String(opts.b) : '1000')));
  let elemSize = $state(4);

  const toNum = (s) => (s === '' || s == null ? NaN : Number(s));

  const result = $derived.by(() => {
    const n = arrName || 'A';
    const i = toNum(iStr);
    const r = baseReg;
    const base = toNum(baseAddrStr);
    const sz = Number(elemSize);
    if (!Number.isInteger(i) || i < 0) return { err: 'Index must be a whole number ≥ 0.' };
    const off = i * sz;
    const steps = [
      [
        R`\text{offset} = i \times ${sz} = ${i} \times ${sz} = ${off}`,
        sz === 4
          ? 'MIPS memory is byte-addressed and a word is 4 bytes, so element i starts 4·i bytes after the base (L05 s17–18).'
          : `Each element is ${sz} bytes.`
      ],
      [
        R`\texttt{lw \$t0, ${off}(${r.replace('$', '\\$')})}`,
        'The offset goes in front of the brackets; the register holding the base address goes inside.'
      ]
    ];
    if (!isNaN(base)) {
      steps.push([
        R`\text{address} = ${base} + ${off} = ${base + off}`,
        'Base addressing: effective address = base register + offset (L06 s23).' +
          ((base + off) % 4 && sz === 4 ? ' Warning: not a multiple of 4, so this word access would be unaligned.' : '')
      ]);
    }
    return { big: `${n}[${i}] → offset ${off}`, steps };
  });
</script>

<ToolShell title="Array element → lw/sw offset" sub="byte offset = index × 4">
  <div class="row">
    <label class="fld">
      Array name
      <input class="w-s" bind:value={arrName} />
    </label>
    <label class="fld">
      Index i
      <input class="w-s" type="number" bind:value={iStr} />
    </label>
    <label class="fld">
      Base register
      <input class="w-s" bind:value={baseReg} />
    </label>
    <label class="fld">
      Base address (optional)
      <input type="number" bind:value={baseAddrStr} />
    </label>
    <label class="fld">
      Bytes per element
      <select bind:value={elemSize}>
        <option value={4}>4 (word / int)</option>
        <option value={1}>1 (byte / char)</option>
        <option value={2}>2 (half)</option>
        <option value={8}>8 (double)</option>
      </select>
    </label>
  </div>
  <div class="out">
    {#if result.err}
      <div class="err-msg">{result.err}</div>
    {:else}
      <div class="big" use:richHtml={result.big}></div>
      <StepsList steps={result.steps} />
    {/if}
  </div>
</ToolShell>
