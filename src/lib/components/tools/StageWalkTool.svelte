<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import StepsList from '$lib/components/content/StepsList.svelte';
  import { richHtml } from '$utils/actions.js';

  const R = String.raw;
  let { opts = {} } = $props();

  const I = {
    add: [
      'add R3, R4, R5',
      [
        ['Fetch the instruction at PC; PC ← PC + 4', 'instruction memory, PC, PC+4 adder'],
        ['Decode: it is an add; read R4 and R5', 'control unit, register file (read)'],
        ['Compute R4 + R5', 'ALU'],
        ['No action — no memory operand', '— (idle)'],
        ['Write the sum into R3', 'register file (write)']
      ],
      'L09 s26, L10 s4'
    ],
    lw: [
      'lw R5, X(R7)',
      [
        ['Fetch the instruction; PC ← PC + 4', 'instruction memory, PC, PC+4 adder'],
        ['Decode: it is a load; read R7; sign-extend X', 'control unit, register file (read), sign-extend'],
        ['Effective address = X + R7', 'ALU (adder)'],
        ['Read memory at that address', 'data memory (read)'],
        ['Write the loaded value into R5', 'register file (write)']
      ],
      'L09 s27, L10 s6'
    ],
    sw: [
      'sw R6, X(R8)',
      [
        ['Fetch the instruction; PC ← PC + 4', 'instruction memory, PC, PC+4 adder'],
        ['Decode: it is a store; read R6 and R8; sign-extend X', 'control unit, register file (read), sign-extend'],
        ['Effective address = X + R8', 'ALU (adder)'],
        ['Write R6 into memory at that address', 'data memory (write)'],
        ['No action — nothing goes back to a register', '— (idle)']
      ],
      'L10 s7'
    ],
    beq: [
      'beq R1, R2, offset',
      [
        ['Fetch the instruction; PC ← PC + 4', 'instruction memory, PC, PC+4 adder'],
        ['Decode: it is a branch; read R1 and R2; sign-extend offset', 'control unit, register file (read), sign-extend'],
        ['Compare R1 and R2 (subtract, check Zero); target = PC+4 + offset×4', 'ALU, branch-target adder'],
        ['No memory access', '— (idle)'],
        ['No register write', '— (idle)']
      ],
      'L09 s23, R1 s17'
    ]
  };

  const STAGES = ['IF', 'ID', 'EX', 'MEM', 'WB'];

  let sel = $state(untrack(() => opts.i || 'lw'));
  let code = $state('lw $v1, 0($a0)\naddi $v0, $v0, 1\nsw $v1, 0($a1)\naddi $a0, $a0, 1');

  const info = $derived(I[sel]);
  const memResult = $derived.by(() => {
    const lines = code
      .split('\n')
      .map((s) => s.replace(/#.*/, '').trim())
      .filter(Boolean);
    const dm = lines.filter((l) => /^(lw|sw|lb|sb|lh|sh|ld|sd)\b/i.test(l));
    const kv = `<dt>Instruction memory</dt><dd>${lines.length}</dd><dt>Data memory</dt><dd>${dm.length}</dd>`;
    const steps = [
      [R`\text{instruction memory} = ${lines.length}`, 'Every instruction has to be fetched once, so count the instructions.'],
      [
        R`\text{data memory} = ${dm.length}${dm.length ? R`\ (${dm.map((l) => R`\texttt{${l.split(/\s/)[0]}}`).join(',')})` : ''}`,
        'Only loads and stores touch data memory, in their MEM step. Register reads/writes are not memory accesses.'
      ]
    ];
    return { kv, steps };
  });
</script>

<ToolShell title="Five steps of an instruction" sub="what each stage does and which hardware it uses">
  <div class="row">
    <label class="fld">
      Instruction
      <select bind:value={sel}>
        {#each Object.keys(I) as k}
          <option value={k}>{I[k][0]}</option>
        {/each}
      </select>
    </label>
  </div>
  <div class="sw-t">
    <div class="tbl-wrap">
      <table class="t">
        <thead>
          <tr><th>Stage</th><th>What happens</th><th>Hardware used</th></tr>
        </thead>
        <tbody>
          {#each STAGES as s, i}
            <tr>
              <td><b>{s}</b></td>
              <td>{info[1][i][0]}</td>
              <td>{info[1][i][1]}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="ref">Source: {info[2]}. In a single-cycle machine all five happen inside ONE long clock cycle (L09 s28).</p>
  </div>
  <hr style="border:0;border-top:1px dashed var(--border);width:100%" />
  <b>Memory access counter</b> <span class="ref">(PS2 Q1d / R1 s14)</span>
  <textarea bind:value={code}></textarea>
  <div class="out">
    <div class="kv" use:richHtml={memResult.kv}></div>
    <StepsList steps={memResult.steps} />
  </div>
</ToolShell>
