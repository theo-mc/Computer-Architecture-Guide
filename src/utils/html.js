export const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  }[c]));

export const pad2 = (n) => String(n).padStart(2, '0');

export function stripHtml(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\\\(|\\\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
