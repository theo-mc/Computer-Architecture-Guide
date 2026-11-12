<script>
  import ToolShell from './ToolShell.svelte';
  import { srcChip } from '@/utils/refs.js';

  const P = {
    move: ['move $t0, $t1', (s) => [`add ${s[0]}, $zero, ${s[1]}`], 'Adding $zero (always 0) copies the register. Slides L07 s4.', 'S'],
    blt: ['blt $t0, $t1, L', (s) => [`slt $at, ${s[0]}, ${s[1]}`, `bne $at, $zero, ${s[2]}`], 'slt sets $at = 1 if first < second; then branch if $at ≠ 0. Slides L07 s4.', 'S'],
    bgt: ['bgt $t0, $t1, L', (s) => [`slt $at, ${s[1]}, ${s[0]}`, `bne $at, $zero, ${s[2]}`], 'a > b is the same as b < a, so swap the operands of slt.', 'T'],
    ble: ['ble $t0, $t1, L', (s) => [`slt $at, ${s[1]}, ${s[0]}`, `beq $at, $zero, ${s[2]}`], 'a ≤ b is "NOT (b < a)", so branch when slt gives 0.', 'T'],
    bge: ['bge $t0, $t1, L', (s) => [`slt $at, ${s[0]}, ${s[1]}`, `beq $at, $zero, ${s[2]}`], 'a ≥ b is "NOT (a < b)", so branch when slt gives 0.', 'T']
  };

  let input = $state('blt $s1, $s2, Loop');

  const result = $derived.by(() => {
    const v = input.trim();
    const m = v.match(/^(\w+)\s+(.*)$/);
    const op = m && m[1].toLowerCase();
    if (!m || !P[op]) return { err: 'Try move, blt, bgt, ble or bge — e.g. "move $t0, $t1".' };
    const args = m[2].split(',').map((x) => x.trim());
    const need = op === 'move' ? 2 : 3;
    if (args.length !== need) return { err: `${op} needs ${need} operands, like: ${P[op][0]}` };
    const lines = P[op][1](args);
    const src = P[op][3];
    const refText = src === 'S' ? 'L07 s4' : 'P&H §2.12 lists bgt, bge and ble as pseudo-instructions; the slt expansions follow the same pattern as blt';
    return {
      code: lines.join('\n'),
      src,
      chip: srcChip(src, refText),
      why: P[op][2]
    };
  });
</script>

<ToolShell title="Pseudo-instruction expander" sub="what the assembler really emits">
  <div class="row">
    <label class="fld">
      Pseudo-instruction
      <input class="w-l" bind:value={input} />
    </label>
  </div>
  <div class="out">
    {#if result.err}
      <div class="err-msg">{result.err}</div>
    {:else}
      <pre class="code nomath">{result.code}</pre>
      <div class="sblock" data-src={result.src}>
        <div class="chips">{@html result.chip}</div>
        <p>{result.why} <code>$at</code> (register 1) is reserved as the assembler temporary for exactly this.</p>
      </div>
    {/if}
  </div>
</ToolShell>
