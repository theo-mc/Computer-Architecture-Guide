import { TOPICS } from '@/data/index.js';
import { notify } from './notify.svelte.js';

const KEY = 'csc3058-revision-v1';
const MAX_TABS = 3;

function loadInitial() {
  const base = {
    theme: 'system',
    palette: 'tokyo',
    done: {},
    tabs: [],
    filter: {},
    collapsed: {},
    tree: true,
    rel: true,
    last: null,
    folds: {},
    tabLRU: [],
    tw: 300,
    fs: 1
  };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) Object.assign(base, JSON.parse(raw));
  } catch (e) {
    // storage blocked
  }
  base.palette = 'tokyo';
  return base;
}

class AppStore {
  s = $state(loadInitial());
  systemDark = $state(
    typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  darkNow = $derived(
    this.s.theme === 'dark' || (this.s.theme !== 'light' && this.systemDark)
  );

  constructor() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        window
          .matchMedia('(prefers-color-scheme: dark)')
          .addEventListener('change', (e) => {
            this.systemDark = e.matches;
            if (this.s.theme === 'system') this.applyLook();
          });
      } catch (e) {}
    }
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.s));
    } catch (e) {}
  }

  clampW(w) {
    const max = Math.max(260, Math.min(560, (window.innerWidth || 1200) * 0.45));
    return Math.round(Math.max(200, Math.min(max, w)));
  }

  applyLook() {
    if (typeof document === 'undefined') return;
    const r = document.documentElement;
    if (this.s.theme === 'light' || this.s.theme === 'dark') {
      r.setAttribute('data-theme', this.s.theme);
    } else {
      r.removeAttribute('data-theme');
    }
    r.setAttribute('data-palette', this.s.palette || 'tokyo');
    r.classList.toggle('dark', this.darkNow);
    if (document.body) document.body.classList.toggle('tree-hidden', !this.s.tree);
    r.style.setProperty('--tree-w', this.clampW(this.s.tw || 300) + 'px');
    r.style.setProperty('--fs-scale', String(this.s.fs || 1));
  }

  nudgeWidth(d) {
    this.s.tw = d === 0 ? 300 : this.clampW((this.s.tw || 300) + d);
    this.save();
    this.applyLook();
  }

  setTheme(t) {
    this.s.theme = t;
    this.save();
    this.applyLook();
    notify('Theme: ' + (t === 'system' ? 'follows your device' : t));
  }

  toggleTree() {
    this.s.tree = !this.s.tree;
    this.save();
    this.applyLook();
    notify(
      this.s.tree
        ? 'Explorer shown'
        : 'Explorer hidden · <kbd>Space</kbd><kbd>e</kbd> to show'
    );
  }

  toggleRel() {
    this.s.rel = !this.s.rel;
    this.save();
  }

  toggleCollapsed(k, val) {
    const next = val != null ? val : !this.s.collapsed[k];
    this.s.collapsed[k] = next;
    this.save();
  }

  qKey(t, q) {
    return t.id + ':' + q.id;
  }

  progress(t) {
    const qs = t.questions || [];
    let n = 0;
    for (const q of qs) {
      if (this.s.done[this.qKey(t, q)]) n++;
    }
    return { n, tot: qs.length };
  }

  totals() {
    let n = 0;
    let tot = 0;
    for (const t of TOPICS) {
      const p = this.progress(t);
      n += p.n;
      tot += p.tot;
    }
    return { n, tot };
  }

  testTotals(num) {
    let a = 0;
    let b = 0;
    for (const t of TOPICS) {
      if ((t.tests || [1, 2]).indexOf(num) < 0) continue;
      const p = this.progress(t);
      a += p.n;
      b += p.tot;
    }
    return [a, b];
  }

  toggleDone(k, val) {
    if (val) this.s.done[k] = 1;
    else delete this.s.done[k];
    this.save();
  }

  resetDone() {
    this.s.done = {};
    this.save();
  }

  setFilter(topicId, kind, diff) {
    const cur = this.s.filter[topicId] || { kind: 'all', diff: 'all' };
    this.s.filter[topicId] = {
      kind: kind !== undefined ? kind : cur.kind,
      diff: diff !== undefined ? diff : cur.diff
    };
    this.save();
  }

  getFilter(topicId) {
    return this.s.filter[topicId] || { kind: 'all', diff: 'all' };
  }

  isFolded(topicId, stepNum) {
    return !!this.s.folds[topicId + ':' + stepNum];
  }

  toggleFold(topicId, stepNum, force) {
    const k = topicId + ':' + stepNum;
    const v = force != null ? force : !this.s.folds[k];
    if (v) this.s.folds[k] = 1;
    else delete this.s.folds[k];
    this.save();
    return v;
  }

  foldAll(topic, v) {
    if (!topic) return;
    topic.steps.forEach((_, i) => {
      const k = topic.id + ':' + (i + 1);
      if (v) this.s.folds[k] = 1;
      else delete this.s.folds[k];
    });
    this.save();
    notify(v ? 'all steps folded · <kbd>zR</kbd> to open' : 'all folds open');
  }

  recordTabVisit(r) {
    const lru = (this.s.tabLRU || []).filter((x) => x !== r).concat(r).slice(-30);
    this.s.tabLRU = lru;
    const rank = (x) => {
      const i = lru.lastIndexOf(x);
      return i < 0 ? -1 : i;
    };
    if (this.s.tabs.indexOf(r) < 0) this.s.tabs.push(r);
    while (this.s.tabs.length > MAX_TABS) {
      const v = this.s.tabs
        .filter((x) => x !== r)
        .sort((a, b) => rank(a) - rank(b))[0];
      const idx = this.s.tabs.indexOf(v);
      if (idx >= 0) this.s.tabs.splice(idx, 1);
      else break;
    }
    this.save();
  }

  closeTab(r, currentRoute, goFn) {
    const i = this.s.tabs.indexOf(r);
    if (i < 0) return;
    this.s.tabs.splice(i, 1);
    this.save();
    if (r === currentRoute) {
      goFn(this.s.tabs[Math.max(0, i - 1)] || 'home');
    }
  }

  closeAllTabs(goFn) {
    this.s.tabs = [];
    this.save();
    goFn('home');
  }

  setLastTopic(id) {
    if (this.s.last !== id) {
      this.s.last = id;
      this.save();
    }
  }
}

export const app = new AppStore();
