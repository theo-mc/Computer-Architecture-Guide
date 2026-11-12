<script>
  import { app } from '$stores/app.svelte.js';
  import { router } from '$stores/router.svelte.js';
  import { vim } from '$stores/vim.svelte.js';
  import { NF } from '$utils/refs.js';
  import { daysTo, T1 } from '$utils/calendar.js';

  const MODE_NAME = {
    normal: 'NORMAL',
    command: 'COMMAND',
    tree: 'TREE',
    insert: 'INSERT',
    visual: 'VISUAL'
  };

  function pctLabel(p) {
    return p === 0 ? 'Top' : p >= 99 ? 'Bot' : p + '%';
  }

  let pi = $derived(router.info);
  let p = $derived(pi.t ? app.progress(pi.t) : null);
  let tt = $derived(app.totals());
  let d1 = $derived(daysTo(T1));
  let md = $derived(vim.mode);
  let lines = $derived(vim.lineCount);
  let ln = $derived(Math.min(vim.cursor + 1, lines || 1));
  let filetype = $derived(
    /\.lua$/.test(pi.file) ? 'lua' : pi.file === 'labs/' ? 'directory' : 'markdown'
  );
</script>

<footer id="statusline">
  <span class="sl-mode m-{md}">{NF.vim} {MODE_NAME[md]}</span>
  <span class="sl-b">{NF.branch} test-{d1 >= 0 ? '1' : '2'}</span>
  <span class="sl-c">
    <span class="sl-file">{pi.file}</span>
    {#if p}
      <span class="sl-diag">
        <span class="ok">{NF.ok} {p.n}</span>
        <span class="todo">{NF.todo} {p.tot - p.n}</span>
      </span>
    {/if}
    {#if vim.pending}
      <span class="sl-pend">{vim.pending}</span>
    {/if}
  </span>
  <span class="sl-fill"></span>
  <span class="sl-x warn">
    {d1 > 0
      ? NF.clock + ' test 1 in ' + d1 + 'd'
      : d1 === 0
        ? NF.clock + ' TEST 1 TODAY'
        : NF.clock + ' test 2 · 9 dec'}
  </span>
  <span class="sl-x dim">{tt.n}/{tt.tot}</span>
  <span class="sl-x dim">utf-8</span>
  <span class="sl-x dim">{filetype}</span>
  <span class="sl-y">{pctLabel(vim.scrollPct)}</span>
  <span class="sl-z">{ln}:{lines}</span>
</footer>
