import { R, B, PIPE } from '../../utils/dsl.js';

export default {
  id: 'control', num: 19, file: 'control-hazards-exceptions', week: 'L', weekLabel: '8–12', lectures: ['L17', 'L18', 'L19'], tests: [2], pending: true,
  title: 'Control hazards, branch prediction and exceptions', short: 'Control hazards',
  keywords: 'control hazard branch penalty flush stall predict not taken taken dynamic prediction branch history table 1-bit 2-bit predictor branch target buffer delayed branch exception interrupt epc cause',
  taught: 'Planned for L17–L19 (Canvas lecture list). The L17 and L18 slides went up on Canvas on 9 Nov (lectures Thu 12 Nov) but are not written up here yet, so for now this topic follows P&H §4.8–4.9. Practised in PS3 Q1c and Q3 (see 16-hazards-structural.md for Q3).',
  overview: {
    lede: 'The pipeline fetches a new instruction every cycle, but after a branch it doesn’t yet know which one comes next. What that costs, how prediction cuts the cost, and how exceptions (a surprise branch to the OS) are handled.',
    about: R`<p>A branch’s outcome is only known a few stages after it is fetched. Meanwhile the pipeline has already fetched the next instructions — which are wrong if the branch is taken. You can <b>stall</b> until the outcome is known, <b>predict</b> and flush when wrong, or decide the branch <b>earlier</b> so less is wasted. Each option has a CPI cost you can calculate. Exceptions use the same flushing machinery: stop, save the PC, jump to the operating system.</p>`,
    canDo: ['Explain where the branch penalty comes from and how deciding the branch in ID reduces it.', 'Compare always-stall, predict-not-taken and dynamic prediction, and compute the CPI for each.', 'Trace a 1-bit and a 2-bit predictor on a loop and count mispredictions.', 'Describe what MIPS does on an exception (EPC, Cause, flush, handler).'],
    buildsOn: ['hazards', 'forward', 'isa2'],
  },
  notationNote: R`P&H decide the branch in MEM in the basic datapath and then move the decision to ID; the penalty you use depends on which datapath the question describes. When a question just gives a penalty in cycles, use it.`,
  notation: [
    ['taken / not taken', 'Taken = jumps to its target; not taken = continues at PC + 4', ''],
    ['resolved', 'The stage where the pipeline knows the outcome and target', 'MEM (basic), ID (improved)'],
    ['flush', 'Discard wrongly fetched instructions, turning them into bubbles', ''],
    [R`\(p\)`, 'Branch penalty: cycles lost each time the pipeline guesses wrong (or stalls)', 'cycles'],
    [R`\(b,\ m\)`, 'Fraction of instructions that are branches; fraction of those that pay the penalty', '17% → 0.17'],
    ['BHT', 'Branch history (prediction) table: recent outcomes, indexed by low bits of the branch address', ''],
    ['BTB', 'Branch target buffer: remembers where a taken branch went', ''],
    ['EPC, Cause', 'Exception PC (address of the faulting instruction) and the reason code', 'MIPS registers'],
  ],
  steps: [
    { title: 'Why branches cost cycles', ref: 'P&H §4.8', blocks: [
      B.p('T', 'P&H §4.8', R`<p>A <code>beq</code> is fetched in cycle 1, but in the basic five-stage datapath its outcome is only known at the end of ${'<span class="stg ex">EX</span>'}/${'<span class="stg mem">MEM</span>'}. By then the next three instructions have already been fetched. If the branch is taken they are the wrong instructions and must be <b>flushed</b>.</p>`),
      B.states({ src: 'T', ref: 'P&H §4.8', title: 'How much a taken branch wastes', states: [
        ['Decided in MEM', PIPE(['beq | IF ID EX ^MEM WB', 'next 1 | . !IF !ID !EX', 'next 2 | . . !IF !ID', 'next 3 | . . . !IF', 'target | . . . . IF ID EX MEM WB']), 'Three wrong instructions are flushed: a 3-cycle penalty.'],
        ['Decided in ID', PIPE(['beq | IF ^ID EX MEM WB', 'next 1 | . !IF', 'target | . . IF ID EX MEM WB']), 'Compare the registers and add the offset in ID: only one instruction is wasted.'],
        ['Always stall', PIPE(['beq | IF ^ID EX MEM WB', 'stall | . *', 'next | . . IF ID EX MEM WB']), 'Never fetch past a branch until it is decided: every branch costs the bubble, taken or not.']],
        caption: 'Red rings mark instructions fetched down the wrong path and flushed. Moving the decision earlier shrinks the penalty.' }),
      B.derive('Why deciding in ID leaves exactly one bubble', R`<p>The instruction after the branch is fetched in cycle 2, while the branch itself is in ID. If the branch is resolved at the end of ID (cycle 2), the correct target can be fetched in cycle 3. So exactly one fetch — cycle 2's — may be wrong. Resolving in MEM (cycle 4) means cycles 2, 3 and 4 may all fetch wrong instructions: 3 bubbles. The penalty is always “resolve stage − 1”.</p>`),
    ] },
    { title: 'Option 1: stall on every branch', ref: 'P&H §4.8', blocks: [
      B.x(R`<p>The simplest policy: when the pipeline sees a branch, it stops fetching until the outcome is known. Correct every time, but every branch pays the full penalty, taken or not.</p>`),
      B.wk({ src: 'T', ref: 'P&H §4.8', title: 'Branches are 17% of instructions; stall 1 cycle each', steps: [[R`CPI = 1 + 0.17 \times 1`, 'Every branch pays one extra cycle.'], [R`= 1.17`, 'About 17% slower than an ideal pipeline.']], result: 'CPI 1.17.' }),
    ] },
    { title: 'Option 2: predict not taken', ref: 'P&H §4.8; PS3 Q3', blocks: [
      B.x(R`<p>Keep fetching PC + 4 as if the branch will not be taken. If it is not taken, no time is lost. If it is taken, flush what was fetched and pay the penalty. So only <b>taken</b> branches cost cycles: \(CPI = 1 + b \times t \times p\), where \(t\) is the fraction taken.</p>`),
      B.recipe({ title: 'CPI with a branch policy', for: 'PS3 Q3', steps: [
        'Write b, the fraction of instructions that are branches.',
        R`Find m, the fraction of branches that pay: always stall → 1; predict not taken → fraction taken; predict taken → fraction <i>not</i> taken; dynamic → 1 − accuracy.`,
        R`Branch term = \(b \times m \times p\). Add any other hazard terms the same way.`,
        R`\(CPI = 1 + \sum\) terms. Compare policies by CPI (same clock) or by CPI × period (different clocks).`] }),
      B.fx('branchcpi'),
    ] },
    { title: 'Option 3: dynamic prediction', ref: 'P&H §4.8', blocks: [
      B.p('T', 'P&H §4.8', R`<p>A <b>branch history table</b> (prediction buffer) keeps a bit (or two) per entry, indexed by the low bits of the branch address. A <b>1-bit</b> predictor guesses whatever happened last time. A <b>2-bit</b> predictor must be wrong twice in a row before it changes its guess. A <b>branch target buffer</b> also stores the target, so a predicted-taken branch can fetch from the target with no delay.</p>`),
      B.wk({ src: 'A', title: 'A loop branch taken 9 times, then not taken once (run the loop twice)', steps: [
        ['1-bit: the exit (not taken) mispredicts, and so does the first branch of the next run (still remembers “not taken”).', '2 wrong per run of the loop.'],
        ['2-bit: the single not-taken only moves it to “weakly taken”; the next run is predicted taken correctly.', '1 wrong per run.'],
        [R`\text{accuracy: 1-bit } 8/10 = 80\%,\ \ \text{2-bit } 9/10 = 90\%`, 'For a loop of 10 iterations, in steady state.']], result: 'The 2-bit scheme halves the mispredictions on loops.' }),
      B.sort({ title: 'Which policy pays on this branch?', cats: ['pays', 'free'], items: [
        ['Always stall — branch not taken', 0, 'Stalling costs the bubble whatever the outcome.'],
        ['Predict not taken — branch not taken', 1, 'The fetched instructions were right.'],
        ['Predict not taken — branch taken', 0, 'Wrong path fetched: flush.'],
        ['Predict taken (with BTB) — branch taken', 1, 'Correct guess, target already known.'],
        ['2-bit predictor in “strongly taken” — branch not taken', 0, 'A misprediction pays; the state only weakens.']] }),
      B.bg('Delayed branches', R`<p>Early MIPS defined a <b>branch delay slot</b>: the instruction right after a branch always executes, and the compiler tries to fill it with useful work. It hides a 1-cycle penalty for free but stops scaling when pipelines get deeper, so modern designs rely on prediction instead.</p>`, 'P&H §4.8'),
    ] },
    { title: 'Exceptions and interrupts', ref: 'P&H §4.9', blocks: [
      B.p('T', 'P&H §4.9', R`<p>An <b>exception</b> is an unexpected change of control flow from inside the processor (arithmetic overflow, undefined instruction); an <b>interrupt</b> comes from outside (I/O). MIPS saves the address of the offending instruction in <b>EPC</b>, records the reason in the <b>Cause</b> register, flushes the instructions behind it, and starts fetching the operating system’s handler at a fixed address. Afterwards the OS can terminate the program or return to EPC.</p>`),
      B.key('Same mechanism as a mispredicted branch', R`<p>An exception in EX is handled like a taken branch discovered in EX: flush the younger instructions (IF, ID), let older ones finish, and fetch from a new address — the handler instead of a branch target.</p>`),
      B.check(R`<p><code>add $t1, $t2, $t3</code> overflows in EX. Which instructions are flushed, and what is in EPC?</p>`, R`<p>The <code>add</code> itself (its result must not be written) and the younger instructions in IF and ID. EPC holds the address of the <code>add</code> (P&H stores PC + 4 and the handler subtracts 4 — either way the handler can find it).</p>`),
    ] },
  ],
  keyPoints: [
    'The branch penalty = how many wrong instructions were fetched before the branch was resolved.',
    'Deciding the branch in ID instead of MEM cuts the penalty from 3 cycles to 1.',
    R`\(CPI = 1 + b \times m \times p\): m = 1 for always-stall, fraction taken for predict-not-taken, 1 − accuracy for dynamic prediction.`,
    'A 2-bit predictor needs two wrong guesses in a row to flip, so a loop exit costs one misprediction instead of two.',
    'Exceptions flush younger instructions, save EPC and Cause, and jump to the OS handler.',
  ],
  traps: [
    '<b>Charging the penalty to every branch</b> under predict-not-taken. Only taken branches pay.',
    '<b>Using m as a fraction of all instructions.</b> m is a fraction of branches; multiply by b.',
    '<b>Comparing CPIs across different clocks.</b> Compare time per instruction (CPI × period).',
    '<b>Mixing up the BHT and BTB.</b> One predicts the direction, the other remembers the target.',
  ],
  };
