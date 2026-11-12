<script>
  import { untrack } from 'svelte';
  import { app } from '@/stores/app.svelte.js';
  import { router } from '@/stores/router.svelte.js';
  import { vim } from '@/stores/vim.svelte.js';
  import { notify } from '@/stores/notify.svelte.js';
  import { applyV3Layout } from '@/utils/layout.js';
  import { afterMath } from '@/utils/math.js';

  import TabBar from '@/components/chrome/TabBar.svelte';
  import Sidebar from '@/components/chrome/Sidebar.svelte';
  import WinBar from '@/components/chrome/WinBar.svelte';
  import TouchBar from '@/components/chrome/TouchBar.svelte';
  import StatusLine from '@/components/chrome/StatusLine.svelte';
  import NotifyToast from '@/components/chrome/NotifyToast.svelte';
  import WhichKey from '@/components/chrome/WhichKey.svelte';
  import CmdPalette from '@/components/chrome/CmdPalette.svelte';
  import FinderModal from '@/components/chrome/FinderModal.svelte';
  import HelpModal from '@/components/chrome/HelpModal.svelte';

  import HomePage from '@/components/pages/HomePage.svelte';
  import TopicPage from '@/components/pages/TopicPage.svelte';
  import FormulasPage from '@/components/pages/FormulasPage.svelte';
  import LabsPage from '@/components/pages/LabsPage.svelte';
  import LabDetailPage from '@/components/pages/LabDetailPage.svelte';
  import MockTestPage from '@/components/pages/MockTestPage.svelte';
  import SettingsPage from '@/components/pages/SettingsPage.svelte';
  import LockedPage from '@/components/pages/LockedPage.svelte';
  import NotFoundPage from '@/components/pages/NotFoundPage.svelte';

  let mainEl = $state(null);

  const route = $derived(router.route);
  const pi = $derived(router.info);

  function foldAllCurrent(v) {
    const t = pi.t;
    if (!t) return;
    app.foldAll(t, v);
    requestAnimationFrame(() => {
      applyV3Layout(mainEl);
      vim.buildLines(mainEl);
      vim.setCursor(vim.cursor, true, false, mainEl);
    });
  }

  const WK = [
    ['f', 'Find', 'find anything', () => vim.openFinder()],
    ['e', 'Explorer', 'toggle file tree', () => app.toggleTree()],
    ['h', 'Home', '00-exam-info.md', () => router.go('home')],
    ['s', 'Sheet', '99-formula-sheet.md', () => router.go('formulas')],
    ['l', 'Labs', 'labs/', () => router.go('labs')],
    ['m', 'Mock test', 'mock-test.lua', () => router.go('mock')],
    ['c', 'Config', 'init.lua', () => router.go('settings')],
    ['n', 'Next', 'next topic', () => router.cycle(1)],
    ['p', 'Prev', 'previous topic', () => router.cycle(-1)],
    ['b', 'Background', 'toggle dark / light', () => app.setTheme(app.darkNow ? 'light' : 'dark')],
    [
      'r',
      'Relnum',
      'toggle relative numbers',
      () => {
        app.s.rel = !app.s.rel;
        app.save();
        vim.numberLines();
      }
    ],
    ['z', 'Fold all', 'fold every step', () => foldAllCurrent(true)],
    ['o', 'Open all', 'open every fold', () => foldAllCurrent(false)],
    ['?', 'Help', 'keymaps', () => vim.openHelp()]
  ];

  // Router lifecycle + theme/font/resize listeners
  $effect(() => {
    const stopRouter = router.init();
    app.applyLook();

    const onResize = () => {
      app.applyLook();
      applyV3Layout(mainEl);
      vim.alignGutterSoon(mainEl);
    };
    window.addEventListener('resize', onResize);

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        applyV3Layout(mainEl);
        vim.alignGutterSoon(mainEl);
      });
    }

    return () => {
      stopRouter();
      window.removeEventListener('resize', onResize);
    };
  });

  // Sync visual look & body classes
  $effect(() => {
    void app.s.theme;
    void app.s.tree;
    void app.s.tw;
    void app.s.fs;
    void app.darkNow;
    app.applyLook();
  });

  $effect(() => {
    if (typeof document === 'undefined' || !document.body) return;
    document.body.classList.toggle('nav-open', vim.navOpen);
    document.body.classList.toggle('tree-focus', vim.treeMode);
  });

  $effect(() => {
    if (!vim.treeMode) return;
    void vim.treeIdx;
    requestAnimationFrame(() => {
      document.querySelector('#sidebar .tr.kbd')?.scrollIntoView({ block: 'nearest' });
    });
  });

  // Update title, tabs, scroll, layout & line numbers whenever route renders
  $effect(() => {
    const r = router.route;
    void router.refreshTick;
    const info = router.info;
    const valid =
      r === 'home' ||
      r === 'formulas' ||
      r === 'labs' ||
      r === 'settings' ||
      r === 'mock' ||
      !!info.t ||
      !!info.lab ||
      !!info.locked;

    untrack(() => {
      vim.navOpen = false;
      if (typeof document !== 'undefined') {
        document.title = info.name + ' — CSC3058 Architecture Notes';
      }
      if (valid) app.recordTabVisit(r);
      if (mainEl && !router.pendingScroll) {
        mainEl.scrollTop = 0;
        vim.cursor = 0;
        vim.scrollPct = 0;
      }
    });

    afterMath(() => {
      applyV3Layout(mainEl);
      vim.buildLines(mainEl);
    });
  });

  // Pending scroll target (from Finder / deep search)
  $effect(() => {
    const id = router.pendingScroll;
    void router.route;
    if (!id) return;
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      router.pendingScroll = null;
      const st = el.closest('.step');
      if (st && router.info.t) {
        const sn = +st.id.replace('st-', '');
        if (app.isFolded(router.info.t.id, sn)) {
          app.toggleFold(router.info.t.id, sn, false);
        }
      }
      requestAnimationFrame(() => {
        applyV3Layout(mainEl);
        vim.buildLines(mainEl);
        el.scrollIntoView({ block: 'start' });
        vim.cursorTo(el);
      });
    });
  });

  let relayoutRaf = 0;
  function relayoutSoon() {
    if (relayoutRaf) return;
    relayoutRaf = requestAnimationFrame(() => {
      relayoutRaf = 0;
      applyV3Layout(mainEl);
      vim.buildLines(mainEl);
    });
  }

  function scrollTop() {
    if (!mainEl) return;
    vim.setCursor(0, true, false, mainEl);
    mainEl.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function activateLine() {
    const el = vim.curLines[vim.cursor];
    if (!el) return;
    if (el.matches('.step-title, .fold-line')) {
      const st = el.closest('.step');
      const n = +(el.dataset.fold || (st ? st.id.replace('st-', '') : 0));
      if (pi.t && n) {
        app.toggleFold(pi.t.id, n);
        relayoutSoon();
      }
      return;
    }
    if (el.matches('.q')) {
      el.querySelector('[data-act="ans"]')?.click();
      relayoutSoon();
      return;
    }
    const d = el.matches('details') ? el : el.querySelector('details');
    if (d && !el.querySelector('a[href], [data-check]')) {
      d.open = !d.open;
      relayoutSoon();
      return;
    }
    const btn = el.querySelector('[data-check], a[href], .btn.primary, button, summary');
    if (btn) {
      btn.click();
      relayoutSoon();
    }
  }

  function onMainClick(e) {
    const goEl = e.target.closest('[data-goto]');
    if (goEl) {
      e.preventDefault();
      router.go(goEl.dataset.goto);
      return;
    }
    const jmp = e.target.closest('[data-jump]');
    if (jmp) {
      e.preventDefault();
      const stepNum = +jmp.dataset.jump;
      if (pi.t && app.isFolded(pi.t.id, stepNum)) {
        app.toggleFold(pi.t.id, stepNum, false);
      }
      requestAnimationFrame(() => {
        applyV3Layout(mainEl);
        vim.buildLines(mainEl);
        const target = document.getElementById('st-' + stepNum);
        if (target) {
          vim.scrollLock = performance.now() + 900;
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          vim.cursorTo(target);
        }
      });
      return;
    }
    const ln = e.target.closest('.ln');
    if (ln) vim.focusCursorOnElement(ln);
    if (!e.target.closest('.tool, .fx-slot') && e.target.closest('button, summary, [data-act], .seg button')) {
      relayoutSoon();
    }
  }

  function onKeydown(e) {
    const tag = (e.target?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) return;
    if (e.metaKey || e.altKey) return;
    if (vim.helpOpen || vim.finderOpen || vim.cmdOpen) return;
    const k = e.key;

    if (vim.wkOpen) {
      const w = WK.find((x) => x[0] === k);
      vim.closeWhichKey();
      e.preventDefault();
      if (w) w[3]();
      return;
    }

    if (vim.treeMode) {
      const rows = Array.from(document.querySelectorAll('#sidebar .tr'));
      if (k === 'j' || k === 'ArrowDown') {
        vim.treeIdx = Math.min(rows.length - 1, vim.treeIdx + 1);
        e.preventDefault();
        return;
      }
      if (k === 'k' || k === 'ArrowUp') {
        vim.treeIdx = Math.max(0, vim.treeIdx - 1);
        e.preventDefault();
        return;
      }
      if (k === 'Enter' || k === 'l' || k === 'o' || k === 'h') {
        const r = rows[vim.treeIdx];
        e.preventDefault();
        if (!r) return;
        if (r.dataset.dir) {
          const c = !!app.s.collapsed[r.dataset.dir];
          const nv = k === 'h' ? true : k === 'l' ? false : !c;
          if (nv !== c) app.toggleCollapsed(r.dataset.dir, nv);
          return;
        }
        if (k === 'h') return;
        vim.treeMode = false;
        router.go(r.dataset.nav);
        return;
      }
      if (k === 'Escape' || (e.ctrlKey && k === 'l') || k === 't') {
        vim.treeMode = false;
        return;
      }
      return;
    }

    if (e.ctrlKey) {
      const half = () =>
        Math.max(
          1,
          Math.round((vim.curLines.length * (mainEl?.clientHeight || 600)) / Math.max(mainEl?.scrollHeight || 1, 1) / 2)
        );
      if (k === 'd') {
        e.preventDefault();
        vim.setCursor(vim.cursor + half(), false, true, mainEl);
      } else if (k === 'u') {
        e.preventDefault();
        vim.setCursor(vim.cursor - half(), false, true, mainEl);
      } else if (k === 'o') {
        e.preventDefault();
        history.back();
      } else if (k === 'i') {
        e.preventDefault();
        history.forward();
      } else if (k === 'w') {
        vim.pend = 'w';
        vim.pending = '^W';
        e.preventDefault();
      } else if (k === 'p' || k === 'f') {
        e.preventDefault();
        vim.openFinder();
      }
      return;
    }

    const n0 = () => {
      const n = Math.max(1, parseInt(vim.count || '1', 10));
      vim.count = '';
      return n;
    };

    if (vim.pend === 'w') {
      vim.clearPend();
      if (k === '>' || k === '<' || k === '=') {
        app.nudgeWidth(k === '=' ? 0 : k === '>' ? 24 * n0() : -24 * n0());
        notify('Explorer width ' + app.clampW(app.s.tw || 300) + 'px');
        return;
      }
      if (k === 'h') {
        if (!app.s.tree) app.toggleTree();
        const rows = Array.from(document.querySelectorAll('#sidebar .tr'));
        vim.treeIdx = Math.max(0, rows.findIndex((r) => r.classList.contains('active')));
        vim.treeMode = true;
      }
      return;
    }

    if (vim.pend === 'g') {
      vim.clearPend();
      if (k === 'g') {
        vim.setCursor(0, false, false, mainEl);
        mainEl?.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (k === 't') router.cycle(1);
      else if (k === 'T') router.cycle(-1);
      return;
    }

    if (vim.pend === 'z') {
      vim.clearPend();
      const st = vim.curLines[vim.cursor]?.closest('.step');
      if (k === 'a' || k === 'c' || k === 'o') {
        if (st && pi.t) {
          const sn = +st.id.replace('st-', '');
          app.toggleFold(pi.t.id, sn, k === 'a' ? null : k === 'c');
          relayoutSoon();
        }
      } else if (k === 'M') foldAllCurrent(true);
      else if (k === 'R') foldAllCurrent(false);
      else if (k === 'z') {
        vim.setCursor(vim.cursor, false, true, mainEl);
        vim.flashCursor();
      }
      return;
    }

    if (vim.pend === ']' || vim.pend === '[') {
      const d = vim.pend === ']' ? 1 : -1;
      vim.clearPend();
      if (k === ']' || k === '[') vim.jumpSection(d, mainEl);
      if (k === 'b') router.cycle(d);
      return;
    }

    if (/^[1-9]$/.test(k) || (vim.count && k === '0')) {
      vim.count += k;
      vim.pending = vim.count;
      return;
    }

    const hadCount = !!vim.count;
    const n = n0();
    vim.pending = '';

    if (k === ' ') {
      e.preventDefault();
      vim.openWhichKey();
      return;
    }
    if (k === 'j' || k === 'ArrowDown') {
      e.preventDefault();
      vim.setCursor(vim.cursor + n, false, false, mainEl);
    } else if (k === 'k' || k === 'ArrowUp') {
      e.preventDefault();
      vim.setCursor(vim.cursor - n, false, false, mainEl);
    } else if (k === 'g' || k === 'z' || k === ']' || k === '[') {
      vim.pend = k;
      vim.pending = k;
    } else if (k === 'G') {
      if (hadCount) {
        vim.setCursor(n - 1, false, true, mainEl);
      } else {
        vim.setCursor(vim.curLines.length - 1, false, false, mainEl);
        if (mainEl) mainEl.scrollTo({ top: mainEl.scrollHeight, behavior: 'smooth' });
      }
    } else if (k === '}') vim.jumpSection(1, mainEl);
    else if (k === '{') vim.jumpSection(-1, mainEl);
    else if (k === 'L') router.cycle(1);
    else if (k === 'H') router.cycle(-1);
    else if (k === 'Enter' || k === 'o') {
      e.preventDefault();
      activateLine();
    } else if (k === 'x') {
      const el = vim.curLines[vim.cursor];
      const cb = el && el.matches('.q') && el.querySelector('[data-act="done"]');
      if (cb) cb.click();
    } else if (k === ':') {
      e.preventDefault();
      vim.openCmd(':');
    } else if (k === '/') {
      e.preventDefault();
      vim.openFinder();
    } else if (k === '?') {
      vim.openHelp();
    } else if (k === 't') {
      if (!app.s.tree) app.toggleTree();
      const rows = Array.from(document.querySelectorAll('#sidebar .tr'));
      vim.treeIdx = Math.max(0, rows.findIndex((r) => r.classList.contains('active')));
      vim.treeMode = true;
    } else if (k === 'Escape') {
      vim.closeWhichKey();
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div id="app">
  <TabBar />
  <Sidebar />
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions, a11y_click_events_have_key_events -->
  <main
    id="main"
    tabindex="-1"
    bind:this={mainEl}
    onscroll={() => vim.onMainScroll(mainEl)}
    onclick={onMainClick}
    ontoggle={relayoutSoon}
  >
    <WinBar />
    {#key route}
      {#if route === 'home'}
        <HomePage />
      {:else if route === 'formulas'}
        <FormulasPage />
      {:else if route === 'labs'}
        <LabsPage />
      {:else if route === 'settings'}
        <SettingsPage />
      {:else if route === 'mock'}
        <MockTestPage />
      {:else if pi.lab}
        <LabDetailPage lab={pi.lab} />
      {:else if pi.t}
        <TopicPage topic={pi.t} />
      {:else if pi.locked}
        <LockedPage locked={pi.locked} />
      {:else}
        <NotFoundPage />
      {/if}
    {/key}
  </main>
  <TouchBar onJumpSection={(d) => vim.jumpSection(d, mainEl)} onScrollTop={scrollTop} />
  <StatusLine />
</div>

<NotifyToast />
<WhichKey actions={WK} />
<CmdPalette />
<FinderModal />
<HelpModal />
