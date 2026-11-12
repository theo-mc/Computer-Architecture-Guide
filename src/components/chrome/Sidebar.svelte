<script>
  import { app } from '@/stores/app.svelte.js';
  import { router } from '@/stores/router.svelte.js';
  import { vim } from '@/stores/vim.svelte.js';
  import { CHAPTERS, LABS, chapterItems } from '@/data/index.js';
  import { NF } from '@/utils/refs.js';
  import { pad2 } from '@/utils/html.js';
  import { CUR_WEEK, T1, T2, daysTo, weekDates } from '@/utils/calendar.js';

  let treeEl = $state(null);

  let tt = $derived(app.totals());
  let cur = $derived(router.route);

  function statusOf(p) {
    if (p.tot && p.n === p.tot) return { cls: 'ok', title: 'all attempted', ch: '✔' };
    if (p.n) return { cls: 'mod', title: 'some attempted', ch: 'M' };
    return { cls: 'new', title: 'not started', ch: '?' };
  }

  let treeData = $derived.by(() => {
    const col = (k) => !!app.s.collapsed[k];
    const rows = [];
    let trCount = 0;

    const addDir = (dirKey, label, g, dd, tags, wk) => {
      rows.push({
        kind: 'dir',
        trIdx: trCount++,
        dirKey,
        closed: col(dirKey),
        label,
        g,
        dd,
        tags: tags || '',
        wk
      });
    };

    const addFile = (href, ic, label, g, cls, right, tags, wk) => {
      rows.push({
        kind: 'file',
        trIdx: trCount++,
        href,
        ic,
        label,
        g,
        cls: cls || '',
        right,
        tags: tags || '',
        wk,
        cur: cur === href
      });
    };

    const addVt = (tags, which) => {
      const d = daysTo(which === 1 ? T1 : T2);
      rows.push({
        kind: 'vt',
        trIdx: -1,
        tags,
        vt: which,
        label: which === 1 ? `${NF.clock} test 1` : `${NF.grad} test 2`,
        date: which === 1 ? 'wed 11 nov · 40%' : 'wed 9 dec · 60%',
        count: d > 0 ? d + 'd' : d === 0 ? 'today' : 'done'
      });
    };

    addFile('home', 'md', '00-exam-info.md', ['  '], cur === 'home' ? 'active' : '');
    addFile('formulas', 'md', '99-formula-sheet.md', ['  '], cur === 'formulas' ? 'active' : '');
    addFile('mock', 'lua', 'mock-test.lua', ['  '], cur === 'mock' ? 'active' : '', { dd: 'timed' });
    addDir('labs', 'labs', ['  '], String(LABS.length));
    if (!col('labs')) {
      LABS.forEach((l, i, a) => {
        addFile(
          'lab-' + l.id,
          'lua',
          l.id + '.lua',
          ['  ', i === a.length - 1 ? '└ ' : '├ '],
          cur === 'lab-' + l.id ? 'active' : ''
        );
      });
    }
    addVt('2', 2);
    addVt('12', 1);

    CHAPTERS.forEach((c) => {
      const it = chapterItems(c);
      const k = 'ch' + c.n;
      const nums = it.topics.map((t) => t.num);
      const lk = it.locked.length
        ? `${it.locked[0].num}–${it.locked[it.locked.length - 1].num.slice(1)}${it.topics.length ? '' : ' locked'}`
        : '';
      const dd = [
        nums.length ? pad2(nums[0]) + (nums.length > 1 ? '–' + pad2(nums[nums.length - 1]) : '') : '',
        lk
      ]
        .filter(Boolean)
        .join(' · ');
      const tags = it.topics.some((t) => (t.tests || [1, 2]).indexOf(1) >= 0) ? '12' : '2';
      addDir(k, c.dir, ['  '], dd, tags);
      if (col(k)) return;

      const items = [];
      it.topics.forEach((t, i) => {
        if (i && t.week - it.topics[i - 1].week > 1) items.push({ gap: it.topics[i - 1].week + 1 });
        items.push({ t });
      });
      it.locked.forEach((l) => items.push({ l }));

      items.forEach((x, i) => {
        const g = ['  ', i === items.length - 1 ? '└ ' : '├ '];
        if (x.gap) {
          rows.push({
            kind: 'gap',
            trIdx: -1,
            tags: '12',
            wk: x.gap,
            g: ['  ', '│ '],
            text: `┄ week ${pad2(x.gap)} · reading week, no lectures`
          });
          return;
        }
        if (x.t) {
          const t = x.t;
          const p = app.progress(t);
          addFile(
            t.id,
            'md',
            `${pad2(t.num)}-${t.file}.md`,
            g,
            cur === t.id ? 'active' : '',
            { p, st: statusOf(p) },
            (t.tests || [1, 2]).join(''),
            t.week
          );
          return;
        }
        const l = x.l;
        addFile(
          l.id,
          'lock',
          `${l.num}-${l.file}.md`,
          g,
          'locked ' + (cur === l.id ? 'active' : ''),
          l.chNote ? { dd: l.chNote.toLowerCase() } : null,
          '2',
          'L'
        );
      });
    });

    addFile('settings', 'lua', 'init.lua', ['  '], cur === 'settings' ? 'active' : '', { dd: 'settings' });

    const has = (r, t) => r.tags.indexOf(t) >= 0;
    const idxList = (t) => rows.map((r, k) => (has(r, t) ? k : -1)).filter((k) => k >= 0);
    const r2 = idxList('2');
    const r1 = idxList('1');

    const runs = [];
    rows.forEach((r, k) => {
      if (r.wk == null) return;
      const L = runs[runs.length - 1];
      if (L && L.wk === r.wk) {
        L.b = k;
        L.cur = L.cur || r.cur;
      } else {
        runs.push({ wk: r.wk, a: k, b: k, cur: !!r.cur });
      }
    });

    const wkAt = (k) => runs.find((u) => k >= u.a && k <= u.b);
    const wkTitle = (w) =>
      w === 'L'
        ? 'weeks 8–12 · lectures 17–26 · locked'
        : `week ${w} · ${weekDates(w)}${w === 6 ? ' · reading week' : ''}${w === CUR_WEEK ? ' · this week' : ''}`;

    const enriched = rows.map((r, k) => {
      const u = wkAt(k);
      let week = null;
      if (u) {
        const st =
          u.wk === 'L'
            ? 'lk'
            : u.wk === 6
              ? 'rw'
              : u.cur
                ? 'cur'
                : u.wk === CUR_WEEK
                  ? 'now'
                  : 'w' + (u.wk % 2);
        const lab = k === u.a ? (u.wk === 'L' ? '8+' : 'w' + u.wk) : '  ';
        const pc = u.a === u.b ? '1' : k === u.a ? 'a' : k === u.b ? 'z' : 'm';
        week = { st, lab, pc, title: k === u.a ? wkTitle(u.wk) : null };
      }

      const signFor = (list, t) => {
        if (!list.length || k < list[0] || k > list[list.length - 1]) return { ch: ' ', cls: '' };
        const ch = r.vt === +t ? '┓' : k === list[list.length - 1] ? '┛' : '┃';
        return { ch, cls: 'sg' + t };
      };

      return {
        ...r,
        week,
        s1: signFor(r1, '1'),
        s2: signFor(r2, '2')
      };
    });

    return enriched;
  });

  $effect(() => {
    void cur;
    requestAnimationFrame(() => {
      if (!treeEl) return;
      const a = treeEl.querySelector('.active');
      if (!a) return;
      const ar = a.getBoundingClientRect();
      const sr = treeEl.getBoundingClientRect();
      if (ar.top < sr.top + 40 || ar.bottom > sr.bottom - 40) {
        treeEl.scrollTop += ar.top - sr.top - sr.height / 2;
      }
    });
  });

  $effect(() => {
    if (!treeEl) return;
    if (vim.treeMode && vim.treeIdx >= 0) {
      const rows = treeEl.querySelectorAll('.tr');
      const target = rows[vim.treeIdx];
      if (target) target.scrollIntoView({ block: 'nearest' });
    }
  });

  function startResize(ev) {
    if (ev.button !== 0) return;
    const r = document.documentElement;
    const x0 = ev.clientX;
    const w0 = app.clampW(app.s.tw || 300);
    let w = w0;
    document.body.classList.add('is-resizing');
    ev.preventDefault();
    const mv = (e) => {
      w = app.clampW(w0 + (e.clientX - x0));
      r.style.setProperty('--tree-w', w + 'px');
    };
    const up = () => {
      window.removeEventListener('pointermove', mv);
      window.removeEventListener('pointerup', up);
      document.body.classList.remove('is-resizing');
      app.s.tw = w;
      app.save();
    };
    window.addEventListener('pointermove', mv);
    window.addEventListener('pointerup', up);
  }
</script>

<aside id="sidebar" aria-label="Topics">
  <div class="tree" bind:this={treeEl}>
    <div class="tree-tabs">
      <span class="on">{NF.file} Files</span>
      <span>Buffers {app.s.tabs.length}</span>
      <span>Git</span>
    </div>
    <div class="tree-root">
      <span class="dn">~/csc3058</span>
      <span class="cnt">{tt.n}/{tt.tot}</span>
    </div>

    {#each treeData as row}
      {#if row.kind === 'dir'}
        <div
          class="tr dirrow"
          class:closed={row.closed}
          class:kbd={vim.treeMode && row.trIdx === vim.treeIdx}
          data-dir={row.dirKey}
          role="button"
          tabindex="-1"
          onclick={() => app.toggleCollapsed(row.dirKey)}
        >
          {#if row.week}
            <span class="wks ws-{row.week.st}" title={row.week.title || undefined}>
              <i class="wl">{row.week.lab}</i><i class="wb wb-{row.week.pc}"></i>
            </span>
          {:else}
            <span class="wks"><i class="wl">  </i><i class="wb"></i></span>
          {/if}
          {#each row.g as g}<span class="gd">{g}</span>{/each}
          <span class="chev">{row.closed ? '▸' : '▾'}</span>
          <span class="dico">{row.closed ? NF.dirC : NF.dirO}</span>
          <span class="dn">{row.label}</span>
          {#if row.dd}<span class="dd">{row.dd}</span>{/if}
          <span class="sgs sgs-r">
            <i class="sg {row.s1.cls}">{row.s1.ch}</i>
            <i class="sg {row.s2.cls}">{row.s2.ch}</i>
          </span>
        </div>
      {:else if row.kind === 'file'}
        <a
          class="tr {row.cls}"
          class:kbd={vim.treeMode && row.trIdx === vim.treeIdx}
          href="#{row.href}"
          data-nav={row.href}
          onclick={() => {
            vim.navOpen = false;
          }}
        >
          {#if row.week}
            <span class="wks ws-{row.week.st}" title={row.week.title || undefined}>
              <i class="wl">{row.week.lab}</i><i class="wb wb-{row.week.pc}"></i>
            </span>
          {:else}
            <span class="wks"><i class="wl">  </i><i class="wb"></i></span>
          {/if}
          {#each row.g as g}<span class="gd">{g}</span>{/each}
          <span class="fi {row.ic}">
            {row.ic === 'md' ? NF.md : row.ic === 'lua' ? NF.lua : NF.lock}
          </span>
          <span class="fn">{row.label}</span>
          {#if row.right?.p}
            <span class="tr-r">
              <span class="pc">{row.right.p.n}/{row.right.p.tot}</span>
              <span class="gs {row.right.st.cls}" title={row.right.st.title}>{row.right.st.ch}</span>
            </span>
          {:else if row.right?.dd}
            <span class="tr-r"><span class="dd">{row.right.dd}</span></span>
          {/if}
          <span class="sgs sgs-r">
            <i class="sg {row.s1.cls}">{row.s1.ch}</i>
            <i class="sg {row.s2.cls}">{row.s2.ch}</i>
          </span>
        </a>
      {:else if row.kind === 'vt'}
        <div class="vt vt{row.vt}">
          <span class="wks"><i class="wl">  </i><i class="wb"></i></span>
          <span class="vt-l">{row.label}</span>
          <span class="vt-d">{row.date}</span>
          <span class="vt-c">{row.count}</span>
          <span class="sgs sgs-r">
            <i class="sg {row.s1.cls}">{row.s1.ch}</i>
            <i class="sg {row.s2.cls}">{row.s2.ch}</i>
          </span>
        </div>
      {:else if row.kind === 'gap'}
        <div class="vt vrw">
          {#if row.week}
            <span class="wks ws-{row.week.st}" title={row.week.title || undefined}>
              <i class="wl">{row.week.lab}</i><i class="wb wb-{row.week.pc}"></i>
            </span>
          {:else}
            <span class="wks"><i class="wl">  </i><i class="wb"></i></span>
          {/if}
          {#each row.g as g}<span class="gd">{g}</span>{/each}
          <span class="vrw-l">{row.text}</span>
          <span class="sgs sgs-r">
            <i class="sg {row.s1.cls}">{row.s1.ch}</i>
            <i class="sg {row.s2.cls}">{row.s2.ch}</i>
          </span>
        </div>
      {/if}
    {/each}

    <div class="tree-legend">
      <span class="tl-w">w1╭</span> week
      <span class="tl-l">8+┆</span> not taught yet
      <span class="tl-1">┃</span> test 1
      <span class="tl-2">┃</span> test 2
    </div>
  </div>
  <div class="tree-help">
    <kbd>t</kbd> focus <kbd>j</kbd><kbd>k</kbd> move <kbd>l</kbd> open <kbd>h</kbd> close
  </div>
</aside>

<div
  id="treeRz"
  role="separator"
  aria-orientation="vertical"
  aria-label="Resize file tree"
  title="Drag to resize · double-click to reset · Ctrl-w > / <"
  onpointerdown={startResize}
  ondblclick={() => app.nudgeWidth(0)}
></div>

<div
  id="scrim"
  role="presentation"
  onclick={() => (vim.navOpen = false)}
></div>
