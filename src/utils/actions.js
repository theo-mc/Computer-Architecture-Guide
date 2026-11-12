import { renderMath } from './math.js';
import { holdHeight } from './layout.js';

export function richHtml(node, html) {
  function apply(val) {
    node.innerHTML = val == null ? '' : String(val);
    renderMath(node);
  }
  apply(html);
  return {
    update(newHtml) {
      apply(newHtml);
    }
  };
}

export function holdCardHeight(node) {
  const stop = holdHeight(node);
  return {
    destroy() {
      stop();
    }
  };
}
