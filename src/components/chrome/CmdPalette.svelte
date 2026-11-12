<script>
  import Modal from './Modal.svelte';
  import { TOPICS, LABS, byTopicId } from '@/data/index.js';
  import { app } from '@/stores/app.svelte.js';
  import { router } from '@/stores/router.svelte.js';
  import { vim } from '@/stores/vim.svelte.js';
  import { notify } from '@/stores/notify.svelte.js';
  import { esc, pad2 } from '@/utils/html.js';

  const CMDS = [
    'e ',
    'b ',
    'q',
    'qa',
    'w',
    'home',
    'f',
    'formulas',
    'labs',
    'settings',
    'set bg=dark',
    'set bg=light',
    'set bg=auto',
    'set rnu',
    'set nornu',
    'Neotree',
    'Telescope',
    'reset!',
    'help'
  ];

  let value = $state('');
  let sel = $state(-1);
  let inputEl = $state(null);

  let cands = $derived.by(() => {
    const m = value.match(/^(e|b|edit)\s+(.*)$/);
    if (m) {
      const a = m[2].toLowerCase();
      return ['home', 'formulas', 'labs', 'settings', 'mock']
        .concat(
          TOPICS.map((t) => pad2(t.num) + '-' + t.file),
          LABS.map((l) => 'lab-' + l.id)
        )
        .filter((x) => x.toLowerCase().indexOf(a) >= 0)
        .slice(0, 10)
        .map((x) => m[1] + ' ' + x);
    }
    return CMDS.filter((c) => c.startsWith(value)).slice(0, 10);
  });

  $effect(() => {
    if (vim.cmdOpen) {
      value = '';
      sel = -1;
      requestAnimationFrame(() => inputEl?.focus());
    }
  });

  function runCmd(v) {
    const [c, ...rest] = v.split(/\s+/);
    const arg = rest.join(' ');
    const ok = (m) => { if (m) notify(esc(m)); };
    const err = (m) => notify(esc(m), 'err');
    if (!c) return;
    if (c === 'q' || c === 'bd' || c === 'q!') {
      app.closeTab(router.route, router.route, (r) => router.go(r));
      return;
    }
    if (c === 'qa' || c === 'qa!') {
      app.closeAllTabs((r) => router.go(r));
      return;
    }
    if (c === 'e' || c === 'b' || c === 'edit') {
      if (!arg) return err('E32: No file name');
      if (['home', 'formulas', 'labs', 'settings', 'mock'].indexOf(arg) >= 0 || arg.startsWith('lab-')) {
        router.go(arg);
        return;
      }
      const n = parseInt(arg, 10);
      const t = !isNaN(n)
        ? TOPICS.find((x) => x.num === n)
        : byTopicId(arg) ||
          TOPICS.find(
            (x) =>
              (pad2(x.num) + '-' + x.file).indexOf(arg) >= 0 ||
              x.title.toLowerCase().indexOf(arg.toLowerCase()) >= 0
          );
      if (t) {
        router.go(t.id);
        return;
      }
      return err(`E94: No matching buffer for ${arg}`);
    }
    if (c === 'home') return router.go('home');
    if (c === 'f' || c === 'formulas') return router.go('formulas');
    if (c === 'labs') return router.go('labs');
    if (c === 'mock') return router.go('mock');
    if (c === 'settings' || c === 'config') return router.go('settings');
    if (c === 'find' || c === 'Telescope') {
      vim.openFinder();
      return;
    }
    if (c === 'Neotree' || c === 'NvimTreeToggle') {
      app.toggleTree();
      return;
    }
    if (c === 'set' && /^(bg|background)=(dark|light|auto)$/.test(arg)) {
      const m = arg.split('=')[1];
      app.setTheme(m === 'auto' ? 'system' : m);
      return;
    }
    if (c === 'set' && /^(no)?(rnu|relativenumber)$/.test(arg)) {
      app.s.rel = !arg.startsWith('no');
      app.save();
      vim.numberLines();
      return ok(arg);
    }
    if (c === 'reset!') {
      app.resetDone();
      return ok('progress cleared');
    }
    if (c === 'reset') return err('This clears every "Attempted" tick. Type :reset! to confirm.');
    if (c === 'help' || c === 'h') {
      vim.openHelp();
      return;
    }
    if (c === 'w' || c === 'wq' || c === 'x') {
      return ok('"' + router.info.file + '" written — progress saves automatically');
    }
    if (/^\d+$/.test(c)) {
      vim.setCursor(+c - 1);
      return;
    }
    err(`E492: Not an editor command: ${v}`);
  }

  function onInputKeydown(ev) {
    if (ev.key === 'Escape') return;
    ev.stopPropagation();
    if (ev.key === 'Tab' || ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
      ev.preventDefault();
      if (cands.length) {
        sel = (sel + (ev.shiftKey || ev.key === 'ArrowUp' ? -1 : 1) + cands.length) % cands.length;
        value = cands[sel].trim();
      }
      return;
    }
    if (ev.key === 'Enter') {
      const v = value.trim();
      vim.cmdOpen = false;
      runCmd(v);
    }
  }
</script>

<Modal bind:open={vim.cmdOpen} dim={0} z={76} high width="min(620px,calc(100vw - 32px))">
    <div class="cmd-box">
      <h2 class="cmd-title">{vim.cmdPrefix === ':' ? 'Cmdline' : 'Search'}</h2>
      <div class="cmd-row">
        <span class="cp">{vim.cmdPrefix === ':' ? '❯' : '/'}</span>
        <input
          bind:this={inputEl}
          id="cmdIn"
          bind:value
          autocomplete="off"
          spellcheck="false"
          aria-label="command"
          oninput={() => { sel = -1; }}
          onkeydown={onInputKeydown}
        />
      </div>
    </div>
    {#if cands.length}
      <div class="wild cmd-wild" id="wild">
        {#each cands as c, i}
          <div
            class:on={i === sel}
            role="option"
            aria-selected={i === sel}
            tabindex="-1"
            onmousedown={(ev) => {
              ev.preventDefault();
              value = c.trim();
              inputEl?.focus();
            }}
          >
            <span class="wk">{c.startsWith('e ') || c.startsWith('b ') ? 'buf' : 'cmd'}</span>
            {c}
          </div>
        {/each}
      </div>
    {/if}
</Modal>
