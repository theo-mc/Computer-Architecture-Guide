let timer = null;

export const notifyStore = $state({
  show: false,
  html: '',
  kind: ''
});

export function notify(html, kind = '') {
  notifyStore.html = html;
  notifyStore.kind = kind;
  notifyStore.show = true;
  clearTimeout(timer);
  timer = setTimeout(() => {
    notifyStore.show = false;
  }, 2800);
}
