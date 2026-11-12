<script>
  import ToolShell from './ToolShell.svelte';

  const STAGES = [
    ['C program', 'swap.c', 'You write high-level code: <code>temp = v[k]; v[k] = v[k+1]; v[k+1] = temp;</code>'],
    ['Compiler', 'C → assembly', 'Translates high-level code into assembly language for the target ISA (many compilers produce object modules directly — L07 s3).'],
    [
      'Assembler',
      'assembly → object file',
      'Turns each assembly instruction into machine code and expands pseudo-instructions (e.g. <code>move</code> → <code>add … $zero …</code>). Output is an object file with: header, text segment, static data segment, relocation info, symbol table, debug info (L07 s5).'
    ],
    [
      'Linker',
      'object files + libraries → executable',
      '1) Merge the segments of all modules; 2) resolve labels (find the address of every function/variable); 3) patch location-dependent and external references (L07 s6).'
    ],
    [
      'Loader (OS)',
      'executable on disk → process in memory',
      '1) read the header for segment sizes; 2) create a virtual address space; 3) copy text and data into memory (or set page table entries); 4) put arguments on the stack; 5) initialise registers ($sp, $fp, $gp); 6) jump to the start-up routine, which calls main and does an exit syscall when main returns (L07 s7).'
    ],
    [
      'CPU runs it',
      'fetch → decode → execute',
      'Instructions are fetched from memory as 32-bit words, exactly like data — the stored-program idea (L06 s11).'
    ]
  ];

  let idx = $state(0);
</script>

<ToolShell title="From C to a running program" sub="click through the stages (L07 s3–7)">
  <div class="order-list">
    {#each STAGES as s, i}
      <div
        role="button"
        tabindex="0"
        onclick={() => (idx = i)}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            idx = i;
          }
        }}
        style="cursor:pointer;{idx === i ? 'background:var(--sel);' : ''}"
      >
        <b style="width:120px">{s[0]}</b>
        <span class="ref">{s[1]}</span>
      </div>
    {/each}
  </div>
  <div class="row">
    <button type="button" class="btn" onclick={() => (idx = Math.max(0, idx - 1))}>◀ Back</button>
    <button type="button" class="btn primary" onclick={() => (idx = Math.min(STAGES.length - 1, idx + 1))}>Next ▶</button>
  </div>
  <div class="card tr-card">
    <b>{STAGES[idx][0]}</b>
    <span class="ref">{STAGES[idx][1]}</span>
    <p>{@html STAGES[idx][2]}</p>
  </div>
</ToolShell>
