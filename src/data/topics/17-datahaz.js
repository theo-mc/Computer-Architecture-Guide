import { R, B } from '../../utils/dsl.js';

export default {
  id: 'datahaz', num: 17, file: 'data-hazards', week: 5, weekLabel: '5–7', lectures: ['L15', 'L16'],
  title: 'Data hazards: RAW, WAR, WAW and stalls', short: 'Data hazards',
  keywords: 'data hazard raw war waw read after write dependency true anti output distance stall register file write first half read second half',
  taught: 'L15 s1–s15 (Week 5) and L16 s3–s6 (Week 7). Reviewed R1 s23–s24, s28. Practised in PS3 Q2, Practice Test Q1i and Q4i.',
  overview: {
    lede: 'When an instruction needs a value an earlier instruction hasn’t written yet. Find every RAW, WAR and WAW dependency, know which ones actually stall an in-order pipeline, and count the stall cycles by distance.',
    about: R`<p>In the 5-stage pipeline a result is written in WB (stage 5) but read in ID (stage 2), so a dependent instruction right behind its producer would read the old value. That read-after-write (RAW) case is a true dependence and must be handled — by stalling here, by forwarding in Topic 18. WAR and WAW are "name" dependencies that can't cause trouble in an in-order 5-stage pipeline. Test questions ask you to fill a dependency table and count stalls using the course's distance convention.</p>`,
    canDo: ['Explain why a RAW dependency becomes a hazard in a 5-stage pipeline.', 'Find all RAW, WAR and WAW dependencies in a code sequence, with registers.', 'Explain which dependency types stall an in-order pipeline and why.', 'Count stall cycles using the distance convention (2, 1, 0) and compute the CPI impact.'],
    buildsOn: ['hazards', 'pipe'],
  },
  notation: [
    ['RAW', 'Read after write: j reads a register that earlier i writes (true dependence)', 'L15 s8'],
    ['WAR', 'Write after read: j writes a register that earlier i reads (anti-dependence)', 'L15 s9'],
    ['WAW', 'Write after write: j and earlier i both write the same register (output dependence)', 'L15 s10'],
    ['Producer / consumer', 'The instruction that writes a value / the one that reads it', 'L16 [6:37]'],
    ['dist(i, j)', 'Distance: how many instructions apart (1 = consumer straight after producer)', 'L16 s5'],
    ['Bubble / nop', 'An empty pipeline slot inserted during a stall; "no operation"', 'L15 s13'],
    ['Hazard detection', 'Logic that compares an instruction’s source registers with destinations of earlier in-flight instructions', 'L15 s6'],
    ['Rx', 'The register carrying the value from producer to consumer', 'L16 s5'],
  ],
  steps: [
    { title: 'What a data hazard looks like', ref: 'L15 s3–s4', blocks: [
      B.p('S', 'L15 s3', R`<p>Data hazard: any condition in which either the source or the destination operands of an instruction are not available when needed in the pipeline.</p>`),
      B.p('L', 'L15 [4:47]–[9:55]', R`<p>Slide example: <code>sub $2, $1, $3</code> computes −20 for $2, which holds 10 until cycle 5. Then <code>and $12, $2, $5</code>, <code>or $13, $6, $2</code>, <code>add $14, $2, $2</code>, <code>sw $15, 100($2)</code> all read $2. sub writes $2 in WB, cycle 5. <b>and</b> reads $2 in its ID stage in cycle 3 — it gets the old 10. <b>or</b> reads in cycle 4 — also old. <b>add</b> reads in cycle 5 — the write happens in the first half, the read in the second, so it gets −20. <b>sw</b> reads in cycle 6 — fine. "The result is a program that executes quickly but produces a completely incorrect output."</p>`),
      B.tool('pipeSim', { preset: 'l15', presets: ['l15', 'l14'] }),
    ] },
    { title: 'Dependency → hazard → stall', ref: 'L15 s5–s6', blocks: [
      B.analogy('Cooking from someone else’s sauce', R`<p>You're told to pour the sauce onto the pasta, but your colleague two places up the line is still making the sauce. You must wait until it's ready — that waiting is a stall. The <b>dependency</b> is the fact that your step uses their result; it becomes a <b>hazard</b> only because the line is overlapped and you've arrived too early.</p>`),
      B.p('S', 'L15 s5', R`<p><code>I1: Add R2, R3, #100</code> then <code>I2: Subtract R9, R2, #30</code>. R2 carries data from I1 to I2 — a data dependency. I1 writes R2 in WB; I2 reads R2 in ID. If I2 reads before I1 writes, I2 uses the old value — a <b>read-after-write</b> hazard. I2 must wait.</p>`),
      B.p('S', 'L15 s6', R`<p>I2 is <b>stalled in the decode stage for two additional cycles</b>. Hardware: control circuitry spots the dependency when decoding I2 by <b>comparing source register IDs with destination register IDs of prior instructions</b>. During cycles 3–5 I1 proceeds and I2 is held in ID. In cycle 5, I1 writes R2 in the first half-cycle and I2 reads R2 in the second half.</p>`),
    ] },
    { title: 'RAW, WAR and WAW', ref: 'L15 s7–s10', blocks: [
      B.tbl({ src: 'S', ref: 'L15 s7–s10', head: ['Type', 'What happens (j comes after i)', 'Example', 'In the 5-stage in-order pipeline'], rows: [
        ['RAW — true dependence', 'j tries to read an operand before i writes it', 'i: add r1, r2, r3<br>j: sub r4, r1, r3', '<b>Causes stalls</b> — must be handled'],
        ['WAR — anti-dependence', 'j tries to write an operand before i reads it', 'i: sub r4, r1, r3<br>j: add r1, r2, r3', 'Can’t occur (i reads in ID, long before j’s WB)'],
        ['WAW — output dependence', 'j writes the same register before i writes it', 'i: sub r1, r4, r3<br>j: add r1, r2, r3<br>k: mul r6, r1, r7', 'Can’t occur (writes happen in program order)']] }),
      B.p('S', 'L15 s7', R`<p>WAR and WAW are <b>false</b> dependences: they exist only because of the limited number of architectural registers — "they denote dependence on a name, not an actual value". They matter for out-of-order processors (later in the module).</p>`),
      B.dis({ id: 'l15-typo', title: 'L15 s7 says "output (WAR)"', items: [['Slide L15 s7, last bullet', '"Anti (WAR) and output (WAR) dependences exist due to limited number of architectural registers".'], ['Same slide, earlier bullets; L15 s10; lecture L15 [22:46]', 'Output dependence = WAW.']], likely: 'A typo: output dependence is WAW. Anti = WAR, output = WAW.' }),
      B.dis({ id: 'pt-anti', title: 'is WAW an "anti-dependence"?', items: [['Official solution, Practice Test Q1i and Q4ii', '"The WAW and WAR are anti dependencies not really causing stalls…"'], ['Slides L15 s7, s9–s10', 'WAR = anti-dependence; WAW = output dependence. Both are false (name) dependences.']], likely: 'Use the slide names: WAR = anti, WAW = output; both are "false/name" dependences that don’t stall an in-order 5-stage pipeline. The official answer’s point (only RAW stalls) is right.' }),
    ] },
    { title: 'Finding every dependency systematically', ref: 'L15 s11; PS3 Q2; Practice Test Q4i', blocks: [
      B.p('L', 'L15 [24:00]–[33:39]', R`<p>"Don't just look for a register that appears more than once": decide whether each use is a read or a write, and check the order. In the L15 s11 exercise <b>only RAW</b> exists (sub is the only writer of $2): and and or have RAW hazards (they read the old value); add and sw have RAW dependencies but read after the new value is available.</p>`),
      B.wk({ src: 'O', ref: 'method for PS3 Q2 / Practice Test Q4i', title: 'Method for a dependency table', steps: [
        ['Write, for each instruction, the register it WRITES and the registers it READS.', 'Format "op dest, src1, src2": first operand written. lw rt, off(rs): writes rt, reads rs. sw rt, off(rs): writes NOTHING, reads rt and rs. beq: reads both.'],
        ['RAW: for each register an instruction reads, find the most recent earlier instruction that wrote it.', 'That pair is a RAW on that register.'],
        ['WAR: for each register an instruction writes, list every earlier instruction that read it.', 'Official tables list all such pairs.'],
        ['WAW: for each register an instruction writes, list every earlier instruction that also wrote it.', R`Two writes to the same register name = write after write.`],
        ['Fill the table: Instruction X, Instruction Y, register, type.', 'X is the earlier instruction.'],
      ] }),
      B.tool('depFinder'),
    ] },
    { title: 'Stalls and their cost', ref: 'L15 s12–s14', blocks: [
      B.p('S', 'L15 s12–s13', R`<p>Stalling lets some instructions proceed while others wait (and no new ones are fetched) until the hazard is gone — "clearing the hazard". A stall inserts a <b>bubble</b>, equivalent to a <b>nop</b>, that travels down the pipeline doing nothing. Stalling increases CPI and reduces the speedup from pipelining.</p>`),
      B.wk({ src: 'S', ref: 'L15 s14', title: 'Every 5th instruction causes a 2-cycle stall', steps: [
        [R`\Delta CPI = \tfrac{1}{5} \times 2 = 0.4`, 'Fraction of instructions affected × penalty.'],
        [R`CPI = 1 + 0.4 = 1.4`, 'Or (N + S)/N = (5 + 2)/5 = 1.4.'],
      ], result: '40% more cycles. Avoid stalls: compiler (reordering, nops) or microarchitecture (data forwarding — Topic 18).' }),
    ] },
    { title: 'Stall penalty depends on distance', ref: 'L16 s5–s6; R1 s28', blocks: [
      B.p('S', 'L16 s6', R`<p>Course convention (unless a question says otherwise), assuming the register file can be written and read in the same cycle:</p><ul><li>Dependent instruction <b>right after</b> the producer (distance 1): <b>stall 2 cycles</b>.</li><li>Separated by <b>one</b> intermediate instruction (distance 2): <b>stall 1 cycle</b>.</li><li>Distance 3 or more: no stall (L16 [12:24]).</li></ul>\[\text{stalls} = \max(0,\ 3 - d)\]`),
      B.wk({ src: 'L', ref: 'L16 [14:52]–[16:09]', title: 'Add R2, R3, #100 → Or R4, R5, R6 → Sub R9, R2, #30', steps: [
        ['Producer: Add writes R2. Consumer: Sub reads R2.', 'Or doesn’t touch R2.'],
        [R`d = 2`, 'One independent instruction between them.'],
        [R`\text{stalls} = 3 - 2 = 1`, 'Convention: distance 2 → 1 cycle.'],
      ], result: '1 stall cycle.' }),
      B.fx('distance', { mode: 'nofwd' }),
      B.tool('distance', { p: 'alu', d: 1, f: false }),
      B.check(R`<p>Without forwarding, how many stalls for: <code>add $t0, $t1, $t2</code> → <code>sub $t3, $t4, $t5</code> → <code>or $t6, $t0, $t1</code>?</p>`, R`<p>The only dependency is add → or on $t0, at distance 2. Course convention: \(\max(0, 3 - 2) = 1\) stall. (or reads in ID while add writes in WB; one bubble lines those up in the same cycle, write first half, read second half.)</p>`),
    ] },
  ],
  keyPoints: [
    'Write in WB (stage 5), read in ID (stage 2) → a consumer right after its producer would read a stale value.',
    'RAW = true dependence; WAR = anti; WAW = output. Only RAW stalls an in-order 5-stage pipeline.',
    'sw reads both its registers and writes none; lw writes rt and reads the base.',
    'Hazard detection compares source register IDs with destinations of earlier in-flight instructions.',
    'Stall = bubble = nop; CPI = 1 + fraction × penalty.',
    'No forwarding: distance 1 → 2 stalls, distance 2 → 1, distance ≥ 3 → 0.',
  ],
  traps: [
    '<b>Treating sw’s first register as a destination.</b> sw $t1, −12($t5) reads $t1 and $t5.',
    '<b>Listing WAR/WAW as causing stalls</b> in the 5-stage pipeline (Practice Test Q1i: the answer is A, RAW only — with justification).',
    '<b>Missing the base register</b> of lw/sw as a source (PT Q4: lw $t5, −16($t4) reads $t4 → WAR with a later write of $t4).',
    '<b>RAW with a later writer in between.</b> The true dependence is on the most recent writer.',
    '<b>Adding penalties of overlapping pairs.</b> A stall for one pair can also satisfy another; simulate when in doubt.',
    '<b>Distance counts instructions</b>, not cycles: right after = distance 1.',
  ],
  };
