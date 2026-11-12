import { Logic } from './logic.js';
import { autoMath } from './math.js';
import { stepsHTML } from './refs.js';

export const TK = {
  F: (x, dp) => Logic.fmt(x, dp),
  EQ: (x, dp) => Logic.eq(x, dp),
  T: (x, dp) => {
    const s = Logic.fmt(x, dp);
    return s.indexOf('\\') >= 0 ? '\\(' + s + '\\)' : s;
  },
  err: (m) => `<div class="err-msg">${m}</div>`,
  math: autoMath,
  steps: (s) => stepsHTML(s.map((x) => [autoMath(x[0]), x[1]]))
};
