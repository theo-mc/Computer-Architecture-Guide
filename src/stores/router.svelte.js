import { TOPICS, LOCKED, LABS, CHAPTERS, byTopicId } from '$data/index.js';
import { pad2 } from '$utils/html.js';

function readHash() {
  if (typeof window === 'undefined') return 'home';
  const h = decodeURIComponent((location.hash || '#home').slice(1));
  return h || 'home';
}

class RouterStore {
  route = $state(readHash());
  pendingScroll = $state(null);
  refreshTick = $state(0);

  info = $derived(this.pageInfo(this.route));

  init() {
    if (typeof window === 'undefined') return () => {};
    if (!location.hash) {
      history.replaceState(null, '', '#home');
    }
    this.route = readHash();
    const onHash = () => {
      this.route = readHash();
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }

  go(r) {
    if ('#' + r === location.hash) {
      this.refreshTick++;
    } else {
      location.hash = '#' + r;
    }
  }

  openResult(x) {
    if (x.scroll) this.pendingScroll = x.scroll;
    if (this.route === x.go && x.scroll) {
      const id = x.scroll;
      this.pendingScroll = null;
      return id;
    }
    this.go(x.go);
    return null;
  }

  pageInfo(r) {
    const chDir = (fn) => {
      const c = CHAPTERS.find(fn);
      return c ? c.dir : 'csc3058';
    };
    if (r === 'home') return { name: 'Exam info', file: '00-exam-info.md', crumb: [] };
    if (r === 'formulas') return { name: 'Formula sheet', file: '99-formula-sheet.md', crumb: [] };
    if (r === 'labs') return { name: 'Labs', file: 'labs/', crumb: [] };
    if (r === 'settings') return { name: 'Settings', file: 'init.lua', crumb: [] };
    if (r === 'mock') return { name: 'Mock test', file: 'mock-test.lua', crumb: [] };
    if (r.startsWith('lab-')) {
      const l = LABS.find((x) => 'lab-' + x.id === r);
      if (l) return { name: l.title, file: l.id + '.lua', crumb: ['labs'], lab: l };
    }
    const t = byTopicId(r);
    if (t) {
      return {
        name: t.title,
        short: t.short || t.title,
        file: pad2(t.num) + '-' + t.file + '.md',
        crumb: [chDir((c) => c.nums.indexOf(t.num) >= 0)],
        t
      };
    }
    const l = LOCKED.find((x) => x.id === r);
    if (l) {
      return {
        name: l.title,
        file: l.num + '-' + l.file + '.md',
        crumb: [chDir((c) => c.n === l.chapter)],
        locked: l
      };
    }
    return { name: 'Not found', file: '[No Name]', crumb: [] };
  }

  cycle(d) {
    const order = ['home', ...TOPICS.map((t) => t.id), 'formulas'];
    let i = order.indexOf(this.route);
    if (i < 0) i = 0;
    this.go(order[(i + d + order.length) % order.length]);
  }
}

export const router = new RouterStore();
