/* Home page: exam info */
export const LOCKED = [
  ['L17', 'Data forwarding, control hazards', 'Pipelining Issues – Data Forwarding, Control Hazards (Book Ch. 4)'],
  ['L18', 'Control hazards & performance', 'Pipelining Issues – Control Hazards, Performance Analysis (Ch. 4)'],
  ['L19', 'Resolving control hazards, exceptions', 'Pipelining Issues – Resolving Control Hazards, Exceptions (Ch. 4)'],
  ['L20', 'ILP: static scheduling', 'Instruction Level Parallelism – Static Scheduling (Ch. 4)'],
  ['L21', 'Superscalars & Tomasulo', 'Instruction Level Parallelism – Dynamic Multiple Issue Processors (Superscalars), Tomasulo Algorithm (Ch. 4)'],
  ['L22', 'Multi-cycle operations in pipelines', 'Pipelined Processors with Multi-Cycle Instructions/Operations (Ch. 4, 5)'],
  ['L23', 'Memory technologies, direct-mapped cache', 'Memory Hierarchy – Types of Memory Technologies, Direct Mapped Cache (Ch. 5)'],
  ['L24', 'Cache performance, set-associative', 'Memory Hierarchy – Performance Evaluation, Set Associative Caches (Ch. 5)'],
  ['L25', 'Reducing miss rate & miss penalty', 'Memory Hierarchy – Improving Performance by Decreasing Miss Rate and Miss Penalty (Ch. 5)'],
  ['L26', 'Virtual memory', 'Memory Hierarchy – Virtual Memory (Ch. 5)'],
].map(x => ({ id: 'lec-' + x[0].toLowerCase(), num: x[0], title: x[1], file: x[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, ''), plan: x[2] }));

/* Nav grouping: textbook chapters (P&H, Computer Organization and Design, MIPS edition).
   Locked lectures take the first chapter their Canvas title names; topics follow the chapter their notes cite
   (01/03/04/05 §1, 07/08/10 Ch. 2, 11 §3, 13/18 §4), uncited ones go with the chapter of their subject. */
export const CHAPTERS = [
  { n: 1, dir: 'ch1-abstractions', title: 'Computer abstractions & technology', nums: [1, 2, 3, 4, 5] },
  { n: 2, dir: 'ch2-instructions', title: 'Instructions: language of the computer', nums: [6, 7, 8, 9, 10] },
  { n: 3, dir: 'ch3-arithmetic', title: 'Arithmetic for computers', nums: [11] },
  { n: 4, dir: 'ch4-processor', title: 'The processor', nums: [12, 13, 14, 15, 16, 17, 18, 19, 20] },
  { n: 5, dir: 'ch5-memory', title: 'Memory hierarchy', nums: [21, 22, 23] },
];
LOCKED.forEach(l => { const m = /Ch\. ([\d, ]+)\)/.exec(l.plan); l.chapter = m ? +m[1].split(',')[0] : 5; l.chNote = m && m[1].indexOf(',') > 0 ? 'Ch. ' + m[1] : ''; });
export const chapterItems = (topics, c) => ({
  topics: topics.filter((t) => c.nums.indexOf(t.num) >= 0),
  locked: LOCKED.filter((l) => l.chapter === c.n && !topics.some((t) => t.lectures.indexOf(l.num) >= 0))
});

export const EXAM = {
  dates: [
    ['2026-09-21', 'Week 1 starts (first lecture, online)', 'C', 'Announcement: Welcome'],
    ['2026-09-30', 'First tutorial (tutorials run from Week 2)', 'C', 'Announcement 23 Sep'],
    ['2026-10-04', 'Practice Assignment 1 released', 'C', 'Announcement 4 Oct'],
    ['2026-10-14', 'L11 + L12 moved to Wednesday, online (Thursday cancelled)', 'C', 'Announcement 11 Oct'],
    ['2026-10-15', 'Practice Assignment 1 due (23:59 UK)', 'C', 'Assignment page'],
    ['2026-10-26', 'Independent study week; Practice Test released', 'C', 'Announcements 22 & 26 Oct'],
    ['2026-11-02', 'Lecture 16 (Monday)', 'C', 'Announcement 29 Oct'],
    ['2026-11-05', 'Review session 1 (Lectures 1–16)', 'C', 'Announcement 29 Oct'],
    ['2026-11-06', 'Practice Assignment 2 due (21:00 UK) · Green Room requests to the lecturer by today', 'C', 'Assignment page; Announcement 23 Oct'],
    ['2026-11-09', 'Rest of the review slides (s23–s30, hazards) covered; no new topics, to leave time to prepare for the test', 'L', 'R1 Part III [0:29]; Announcement 8 Nov'],
    ['2026-11-10', 'Practice Assignment 3 due (17:00 UK)', 'C', 'Assignment page'],
    ['2026-11-11', 'CLASS TEST 1 · 40% · Lectures 1–16 · arrive before 15:05, starts 15:15 · CSB/0G/028 (Green Room: Lab 5)', 'C', 'Announcements 23 Oct & 8 Nov', 'key'],
    ['2026-11-12', 'Lectures 17 and 18 (Thursday); slides already on Canvas', 'C', 'Announcement 8 Nov; Week 8 page'],
    ['2026-12-09', 'CLASS TEST 2 · 60% · Lectures 1–26 (tentative date)', 'C', 'Canvas front page', 'key'],
  ],
  types: [
    ['Multiple choice + justification', 'Which data dependencies can stall a single-issue in-order pipeline? (A RAW, B WAR, C WAW, D all) — "To get any points you need to appropriately justify your answer."', 'Practice Test Q1', 'datahaz'],
    ['Units / definitions', 'A 2 ns clock cycle gives which clock rate?', 'Practice Test Q1ii, PS1 Q1', 'perf'],
    ['ISA or microarchitecture?', 'Circle ISA or uARCH: addressing mode; number of registers; type of multiplier.', 'Practice Test Q2, PS2 Q2', 'vonneumann'],
    ['C → MIPS (and MIPS → C)', 'A[4] = B[8] + f − A[2] with f in $s0, A in $s1, B in $s2.', 'Practice Test Q3, PS1 Q6', 'isa1'],
    ['Explain MIPS code line by line', 'Comment each line of a loop and say what function it computes (a × b + 100).', 'PS1 Q7', 'isa2'],
    ['Performance equation', 'Three processors, 100 instructions: find execution times, then a CPI.', 'PS1 Q2', 'cpuperf'],
    ['Power', 'Capacitance −40%, voltage −35%: what clock frequency gives 55% less power?', 'PS1 Q3', 'arch'],
    ['Amdahl’s law / relative time', 'Five routines; speed one up by x%; compare two options.', 'PS1 Q4–Q5', 'amdahl'],
    ['Binary arithmetic', 'Convert 8-bit patterns; add them; add/subtract 32-bit hex registers.', 'PS2 Q3–Q4', 'binary'],
    ['Stages & units', 'Describe the stages of a LOAD and the hardware used in each; count memory accesses.', 'PS2 Q1', 'uarch'],
    ['Single vs multi-cycle vs pipeline', 'Given stage latencies and an instruction mix: cycle times, average latency, throughput.', 'PS2 Q5', 'multi'],
    ['Timing table from component delays', 'Fill IF/ID/EX/MEM/WB times per instruction, then the single-cycle clock and total time.', 'Practice Test Q6, PS2 Q6', 'single'],
    ['Dependency table', 'List every RAW / WAR / WAW with the instructions and register.', 'Practice Test Q4i, PS3 Q2', 'datahaz'],
    ['Forwarding & stalls (explain)', 'Which stalls remain with EX→EX / MEM→EX forwarding, and why?', 'Practice Test Q4ii, PS3 Q4', 'forward'],
    ['Reordering', 'Reorder the code so a 5-stage pipeline with forwarding never stalls.', 'Practice Test Q4iii, PS3 Q4', 'forward'],
    ['CPI with hazards / compare processors', 'Hazard percentages and penalties → CPI; clock rates → which processor is faster and by how much.', 'Practice Test Q5, PS3 Q3, L16 s7', 'hazards'],
    ['Short explanations (< 50 words)', 'One technique to reduce structural-hazard stalls.', 'PS3 Q1', 'hazards'],
  ],
  review: [
    ['s3', 'What computer architecture is; classes of computers; Moore’s law; power wall, memory wall, reliability', 'arch'],
    ['s4', 'The eight great ideas — name and describe them', 'arch'],
    ['s5', 'von Neumann model: CPU (control + datapath), memory, I/O', 'vonneumann'],
    ['s6', 'C → compiler → assembler → binary; ISA vs microarchitecture (instruction size vs pipeline stages)', 'vonneumann'],
    ['s7–s10', 'Performance = 1/time; clock period = 1/rate (with the "n times faster clock" caution); iron law and its alternative forms; Machine A vs B example; % change with different references', 'perf'],
    ['s11–s12', 'Amdahl’s law, its limit, and x% time reduction vs x% performance improvement', 'amdahl'],
    ['s13–s14', 'CISC vs RISC; MIPS formats; describing add/lw; stored program; spot the wrong offset (28 → 32); counting memory accesses', 'isa1'],
    ['s15', 'Binary: two’s complement, adding and subtracting', 'binary'],
    ['s16–s17', 'Instruction processing as a state machine; clock cycle and critical path; the five steps', 'uarch'],
    ['s18', 'Single vs multi-cycle: cycles per instruction and how the clock is set', 'multi'],
    ['s19–s22', 'Why pipelining; pipelined operation of lw/sub; single vs multi vs pipelined numbers (800 / 820 / 200 ps)', 'pipe'],
    ['s23', 'The three hazard types (structural, data, control; control comes in L17 onwards). RAW is the true dependency and must always be resolved. WAR and WAW cannot stall the basic in-order 5-stage MIPS pipeline (reads early in ID, writes late in WB, in program order); they matter in out-of-order machines. The general fix is to stall (insert bubbles), at a cost in performance. (R1 Part III [1:00]–[4:01])', 'datahaz'],
    ['s24', 'Structural hazards: stall, or avoid the stalls by adding hardware, e.g. separate instruction and data memory, and a dedicated adder for PC+4 in IF besides the ALU adder in EX. (R1 Part III [4:01]–[8:18])', 'hazards'],
    ['s25–s26', 'Cost of stalls: if every fifth instruction stalls 2 cycles, extra CPI = 1/5 × 2 = 0.4, so CPI goes 1 → 1.4. Worked example P1 (CPI 1) vs P2 (clock 1.05× faster, 40% of instructions cost 1 stall, so CPI 1.4): T1/T2 = 1.05/1.4 = 0.75, so P1 is 1.333× faster and P2 about 33% slower. Watch the direction of the ratio. (R1 Part III [8:20]–[19:06])', 'hazards'],
    ['s27', 'Avoiding data-hazard stalls: forwarding (add $t1,$t2,$t3 then sub $t4,$t1,$t5: the result is at the ALU output, in EX/MEM, at the end of EX and feeds the next ALU input) and compiler reordering. Forwarding cannot fix a load followed straight away by its use (load-use hazard): the data exists only at the end of MEM but is needed at the start of EX in the same cycle, so a stall remains. (R1 Part III [19:06]–[25:15])', 'forward'],
    ['s28', 'Stall conventions in this module: the register file cannot be read and written in the same cycle. Dependent instruction right after the producer: 2-cycle stall; one independent instruction in between: 1-cycle stall (stall penalty depends on the distance). Worked example add R2,R3,100 / or R4,R5,R6 / sub R9,R2,30: distance 2, so 1 stall. (R1 Part III [25:15]–[29:04])', 'forward'],
    ['s29', 'Addressing RAW in the R1 loop (lw, addu, sw, addi, bne): the lw→addu dependency is a load-use hazard and costs 2 stalls even with forwarding. Fix by combining forwarding with reordering: move independent instructions (the sw, which then stores the previous iteration’s result) between lw and addu, and re-check that the new order is still correct. (R1 Part III [29:08]–[33:27])', 'forward'],
    ['s30', 'Hazards summary: structural → stall, minimise the cost by replicating resources; data → stall, minimise with forwarding plus instruction reordering (load-use still needs a stall); control → stall, minimise with early branch resolution in ID and a branch target buffer (control hazards are next, L17–L18). (R1 Part III [33:27]–[35:12])', 'hazards'],
  ],
};

export const PTMAP = [
  ['Q4', 30, 'Dependencies, forwarding, reordering', ['datahaz', 'forward']],
  ['Q6', 24, 'Single-cycle timing', ['single', 'uarch']],
  ['Q5', 16, 'CPI with hazards', ['hazards', 'cpuperf']],
  ['Q1', 12, 'Multiple choice + justification', ['datahaz', 'perf']],
  ['Q3', 10, 'C → MIPS', ['isa1']],
  ['Q2', 8, 'ISA or microarchitecture?', ['vonneumann']]
];

