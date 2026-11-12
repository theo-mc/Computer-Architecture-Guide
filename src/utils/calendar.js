export const WEEK1 = new Date(2026, 8, 21);
export const DAY = 864e5;
export const T1 = new Date(2026, 10, 11);
export const T2 = new Date(2026, 11, 9);

export function today() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function weekNo(d) {
  return Math.floor(Math.round((d - WEEK1) / DAY) / 7) + 1;
}

export function weekDates(w) {
  const a = new Date(2026, 8, 21 + (w - 1) * 7);
  const b = new Date(2026, 8, 27 + (w - 1) * 7);
  const f = (x) => x.getDate() + ' ' + x.toLocaleString('en-GB', { month: 'short' });
  return f(a) + '–' + f(b);
}

export const CUR_WEEK = weekNo(today());

export function daysTo(d) {
  return Math.round((d - today()) / DAY);
}
