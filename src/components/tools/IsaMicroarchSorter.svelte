<script>
  import ToolShell from './ToolShell.svelte';

  const ITEMS = [
    ['The machine does not have a subtract instruction.', 'ISA', 'Which instructions exist is part of the contract the programmer sees.', 'PS2 Q2c'],
    ['The ALU of the machine does not have a subtract unit.', 'uARCH', 'How the ALU is built is hidden; subtraction could be done with an adder and two’s complement.', 'PS2 Q2a'],
    ['The register file has one input port and two output ports.', 'uARCH', 'Ports are a hardware implementation detail the programmer never sees.', 'PS2 Q2b'],
    ['The machine does not have a multiply-accumulate instruction.', 'ISA', 'Again, which instructions exist is visible to the programmer.', 'PS2 Q2d'],
    ['The ALU consists of two separate units.', 'uARCH', 'Internal organisation of the ALU — invisible to software.', 'PS2 Q2e'],
    ['Addressing mode of instructions', 'ISA', 'Addressing modes are listed in the ISA definition (L02 s23).', 'Practice Test Q2i'],
    ['Number of registers in the register file', 'ISA', 'Programmers name registers ($t0…), so how many there are is architectural (L02 s23 "registers").', 'Practice Test Q2ii'],
    ['Type of multipliers implemented in a processor', 'uARCH', 'Like the adder example (L02 s25): many hardware designs can implement the same multiply instruction.', 'Practice Test Q2iii'],
    ['Size (width) of instructions', 'ISA', 'Instruction format is part of the hardware/software contract.', 'R1 s6'],
    ['Number of pipeline stages', 'uARCH', 'Pipelining is a way of implementing the ISA (L02 s27).', 'R1 s6'],
    ['Ripple-carry vs carry-lookahead adder', 'uARCH', 'Explicit example on L02 s25.', 'L02 s25'],
    ['Cache size, levels and associativity', 'uARCH', 'Listed under microarchitecture on L02 s27.', 'L02 s27'],
    ['In-order vs out-of-order execution', 'uARCH', 'Listed on L02 s27; software still sees sequential (von Neumann) behaviour (L02 s28).', 'L02 s27–28'],
    ['Interrupt and exception handling mechanism', 'ISA', 'Listed in the ISA definition (L02 s23, s26).', 'L02 s23'],
    ['Opcodes and instruction formats (R, I, J)', 'ISA', 'Listed under ISA on L02 s26.', 'L02 s26'],
    ['Separate instruction and data caches', 'uARCH', 'An implementation trick hidden from software (L02 s28).', 'L02 s28'],
    ['Speculative execution / prefetching', 'uARCH', 'Listed on L02 s27.', 'L02 s27'],
    ['Native data types (e.g. 32-bit word)', 'ISA', 'Listed in the ISA definition on L02 s23.', 'L02 s23']
  ];

  let picks = $state(Array(ITEMS.length).fill(null));

  const done = $derived(picks.filter(Boolean).length);
  const right = $derived(picks.filter((p, i) => p === ITEMS[i][1]).length);

  function pick(i, val) {
    if (picks[i]) return;
    picks[i] = val;
  }
</script>

<ToolShell title="ISA or microarchitecture?" sub="click your answer for each item">
  <div class="sq-score">
    <span class="sq-bar"><i style="width:{(100 * done) / ITEMS.length}%"></i></span>
    <b>{done} / {ITEMS.length}</b> answered · <b class="tk-num">{right}</b> correct
  </div>
  <div class="sortq">
    {#each ITEMS as it, i}
      {@const p = picks[i]}
      {@const ok = p ? p === it[1] : null}
      <div class="item" class:good={ok === true} class:bad={ok === false}>
        <span class="txt">{it[0]}</span>
        <span class="sq-btns">
          <button type="button" class="btn" class:picked={p === 'ISA'} onclick={() => pick(i, 'ISA')}>ISA</button>
          <button type="button" class="btn" class:picked={p === 'uARCH'} onclick={() => pick(i, 'uARCH')}>µarch</button>
        </span>
        <span class="fb">
          {#if p}
            <span class="pill {ok ? 'good' : 'bad'}">
              {ok ? '✓ Correct' : '✗ It’s ' + (it[1] === 'uARCH' ? 'µarch' : 'ISA')}
            </span>
            {' '}
            <span class="sq-why">{it[2]} <span class="ref">{it[3]}</span></span>
          {/if}
        </span>
      </div>
    {/each}
  </div>
</ToolShell>
