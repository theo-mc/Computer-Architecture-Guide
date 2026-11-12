<script>
  import ToolShell from './ToolShell.svelte';

  const LAYERS = [
    ['Problem', 'What you want the computer to do.', 'SW'],
    ['Algorithm', 'A step-by-step method that solves the problem. Affects instruction count (L03 s22).', 'SW'],
    ['Program / Language', 'The algorithm written in a high-level language such as C or Java.', 'SW'],
    ['Runtime system (VM, OS, MM)', 'System software: compiler, operating system (I/O, memory, scheduling) — L02 s22.', 'SW'],
    [
      'ISA',
      'The hardware/software interface: the instructions, registers, data types, addressing modes, memory model, interrupts and I/O that a low-level programmer can see. "What" the processor does (L02 s23, transcript [33:58]).',
      'IF'
    ],
    [
      'Microarchitecture',
      'One particular implementation of the ISA: pipelining, caches, in-order or out-of-order, etc. "How" it does it. Invisible to software (L02 s24, s27).',
      'HW'
    ],
    ['Logic', 'Gates, adders, multiplexers, flip-flops (L09 s13–15).', 'HW'],
    ['Circuits', 'Transistor circuits that build the gates.', 'HW'],
    ['Electrons', 'The physics underneath it all.', 'HW']
  ];

  let selected = $state(4);
</script>

<ToolShell title="Layers of abstraction" sub="click a layer (L02 s20–24)">
  <div class="split">
    <div class="order-list">
      {#each LAYERS as l, i}
        <div
          role="button"
          tabindex="0"
          onclick={() => (selected = i)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              selected = i;
            }
          }}
          style="cursor:pointer;justify-content:space-between;{l[2] === 'IF' ? 'border-color:var(--accent);font-weight:700;' : ''}{selected === i ? 'background:var(--sel);' : ''}"
        >
          <span>{l[0]}</span>
          <span class="ref">{l[2] === 'SW' ? 'software' : l[2] === 'HW' ? 'hardware' : 'interface'}</span>
        </div>
      {/each}
    </div>
    <div class="out card">
      <b>{LAYERS[selected][0]}</b>
      <p>{LAYERS[selected][1]}</p>
    </div>
  </div>
</ToolShell>
