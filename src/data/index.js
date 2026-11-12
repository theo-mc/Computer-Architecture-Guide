import q01, { id as qid01 } from './questions/01-arch.js';
import q02, { id as qid02 } from './questions/02-vonneumann.js';
import q03, { id as qid03 } from './questions/03-perf.js';
import q04, { id as qid04 } from './questions/04-cpuperf.js';
import q05, { id as qid05 } from './questions/05-amdahl.js';
import q06, { id as qid06 } from './questions/06-isa1.js';
import q07, { id as qid07 } from './questions/07-encoding.js';
import q08, { id as qid08 } from './questions/08-isa2.js';
import q09, { id as qid09 } from './questions/09-translate.js';
import q10, { id as qid10 } from './questions/10-binary.js';
import q11, { id as qid11 } from './questions/11-float.js';
import q12, { id as qid12 } from './questions/12-uarch.js';
import q13, { id as qid13 } from './questions/13-single.js';
import q14, { id as qid14 } from './questions/14-multi.js';
import q15, { id as qid15 } from './questions/15-pipe.js';
import q16, { id as qid16 } from './questions/16-hazards.js';
import q17, { id as qid17 } from './questions/17-datahaz.js';
import q18, { id as qid18 } from './questions/18-forward.js';
import q19, { id as qid19 } from './questions/19-control.js';
import q20, { id as qid20 } from './questions/20-ilp.js';
import q21, { id as qid21 } from './questions/21-cache.js';
import q22, { id as qid22 } from './questions/22-cacheperf.js';
import q23, { id as qid23 } from './questions/23-vm.js';
import { applyQuestionOverlays } from './questions/overlays.js';

import t01 from './topics/01-arch.js';
import t02 from './topics/02-vonneumann.js';
import t03 from './topics/03-perf.js';
import t04 from './topics/04-cpuperf.js';
import t05 from './topics/05-amdahl.js';
import t06 from './topics/06-isa1.js';
import t07 from './topics/07-encoding.js';
import t08 from './topics/08-isa2.js';
import t09 from './topics/09-translate.js';
import t10 from './topics/10-binary.js';
import t11 from './topics/11-float.js';
import t12 from './topics/12-uarch.js';
import t13 from './topics/13-single.js';
import t14 from './topics/14-multi.js';
import t15 from './topics/15-pipe.js';
import t16 from './topics/16-hazards.js';
import t17 from './topics/17-datahaz.js';
import t18 from './topics/18-forward.js';
import t19 from './topics/19-control.js';
import t20 from './topics/20-ilp.js';
import t21 from './topics/21-cache.js';
import t22 from './topics/22-cacheperf.js';
import t23 from './topics/23-vm.js';
import { applyTopicOverlays } from './topics/overlays.js';

import { LOCKED, CHAPTERS, chapterItems as rawChapterItems, EXAM, PTMAP } from './exam.js';
import { FORMULAS, MISTAKES, KEYF, FXMAP } from './formulas.js';
import { buildLabs, TOOL_HELP } from './labs.js';
import { FX_DEFS } from './fxDefs.js';

const qMap = {
  [qid01]: q01, [qid02]: q02, [qid03]: q03, [qid04]: q04, [qid05]: q05,
  [qid06]: q06, [qid07]: q07, [qid08]: q08, [qid09]: q09, [qid10]: q10,
  [qid11]: q11, [qid12]: q12, [qid13]: q13, [qid14]: q14, [qid15]: q15,
  [qid16]: q16, [qid17]: q17, [qid18]: q18, [qid19]: q19, [qid20]: q20,
  [qid21]: q21, [qid22]: q22, [qid23]: q23
};

applyQuestionOverlays(qMap);

const TOPICS = [
  t01, t02, t03, t04, t05, t06, t07, t08, t09, t10, t11, t12,
  t13, t14, t15, t16, t17, t18, t19, t20, t21, t22, t23
];

TOPICS.forEach((t) => {
  t.questions = qMap[t.id] || [];
});

applyTopicOverlays(TOPICS, qMap);

const LABS = buildLabs(TOPICS);

const byTopicId = (id) => TOPICS.find((t) => t.id === id);
const chapterItems = (c) => rawChapterItems(TOPICS, c);

export {
  TOPICS,
  LOCKED,
  CHAPTERS,
  chapterItems,
  EXAM,
  PTMAP,
  FORMULAS,
  MISTAKES,
  KEYF,
  FXMAP,
  LABS,
  TOOL_HELP,
  FX_DEFS,
  byTopicId
};
