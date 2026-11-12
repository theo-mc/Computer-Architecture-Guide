<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import StepsList from '$lib/components/content/StepsList.svelte';

  const R = String.raw;
  let { opts = {} } = $props();

  let mode = $state(untrack(() => opts.m || 'base'));
  let r2Str = $state('400');
  let r3Str = $state('7');
  let cStr = $state('100');
  let pcStr = $state('0x00400010');
  let mvStr = $state('42');

  const toNum = (s) => (s === '' || s == null ? NaN : Number(s));

  const result = $derived.by(() => {
    const r2 = toNum(r2Str);
    const r3 = toNum(r3Str);
    const c = toNum(cStr);
    const mv = toNum(mvStr);
    const pc = parseInt(pcStr, 16);
    if (mode === 'reg') {
      return {
        steps: [
          [
            R`\$1 = \$2 + \$3 = ${r2} + ${r3} = ${r2 + r3}`,
            'Register addressing: both operands are already in registers named in the instruction — the fastest mode (L06 s22).'
          ]
        ]
      };
    }
    if (mode === 'base') {
      return {
        steps: [
          [
            R`\text{EA} = \text{base register} + \text{offset} = \$2 + ${c} = ${r2} + ${c} = ${r2 + c}`,
            'Base (displacement) addressing: the effective address is the base register plus the 16-bit offset (L06 s23).'
          ],
          [
            R`\$1 = \text{Memory}[${r2 + c}] = ${mv}`,
            'The load then reads the word stored at that address. (Slide example: $2 = 400, M[500] = 42.)'
          ]
        ]
      };
    }
    if (mode === 'imm') {
      return {
        steps: [
          [
            R`\$1 = \$2 + ${c} = ${r2} + ${c} = ${r2 + c}`,
            'Immediate addressing: the constant is inside the instruction itself, no memory access needed (L06 s24).'
          ]
        ]
      };
    }
    if (isNaN(pc)) return { err: 'PC must be a hex address like 0x00400010.' };
    const t = pc + 4 + 4 * c;
    return {
      steps: [
        [
          R`PC + 4 = \texttt{0x${pc.toString(16)}} + 4 = \texttt{0x${(pc + 4).toString(16)}}`,
          'By the time the branch executes, the PC has already been incremented to the next instruction (P&H §2.10; the lecture says "measured from the instruction immediately following" — L06 [53:18]).'
        ],
        [
          R`\text{offset} \times 4 = ${c} \times 4 = ${4 * c}`,
          'The 16-bit field counts instructions (words), not bytes, so shift it left by 2 (×4). Lecture L06 [53:18]: "shift the offset 100 left by two bits … 400".'
        ],
        [
          R`\text{target} = \texttt{0x${(pc + 4).toString(16)}} + ${4 * c} = \texttt{0x${(t >>> 0).toString(16)}}`,
          'Add them. Note slide L06 s25 writes "PC = PC + 100" — a simplification; see the Sources disagree box in this topic.'
        ]
      ]
    };
  });
</script>

<ToolShell title="Addressing modes" sub="where does the operand come from?">
  <div class="row">
    <label class="fld">
      Mode
      <select bind:value={mode}>
        <option value="reg">register — add $1, $2, $3</option>
        <option value="base">base / displacement — lw $1, 100($2)</option>
        <option value="imm">immediate — addi $1, $2, 100</option>
        <option value="pc">PC-relative — beq $1, $2, offset</option>
      </select>
    </label>
    <label class="fld">
      value in $2
      <input type="number" bind:value={r2Str} />
    </label>
    <label class="fld">
      value in $3 / $1
      <input type="number" bind:value={r3Str} />
    </label>
    <label class="fld">
      constant / offset
      <input type="number" bind:value={cStr} />
    </label>
    <label class="fld">
      PC of the branch (hex)
      <input bind:value={pcStr} />
    </label>
    <label class="fld">
      Memory word at the address
      <input type="number" bind:value={mvStr} />
    </label>
  </div>
  <div class="out">
    {#if result.err}
      <div class="err-msg">{result.err}</div>
    {:else}
      <StepsList steps={result.steps} />
    {/if}
  </div>
</ToolShell>
