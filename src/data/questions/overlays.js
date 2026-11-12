import { R, Q, CODE, TBL, NAME } from '../../utils/dsl.js';

export function applyQuestionOverlays(qMap) {
  const name = (id, qid, names, extra) => NAME(qMap, id, qid, names, extra);

  // --- zz-ladder ---
  {
const add = (id, list) => list.forEach(q => qMap[id].push(Q(Object.assign({ kind: 'ai' }, q))));

  add('arch', [
    { id: 'lad-pow1', diff: 'E', taught: 'L02 s10–s11', q: '<p>A redesign raises the clock rate by 20%, lowers the supply voltage by 10% and adds 10% more capacitive load. What is the new power as a fraction of the old?</p>', ans: '≈ 1.07 of the old power (about 7% more).',
      steps: [[R`c = 1.1,\ v = 0.9,\ f = 1.2`, '+10% → ×1.1, −10% → ×0.9, +20% → ×1.2.', 'Turn each change into a multiplier', 'L02 s11'], [R`\(v^2 = 0.81\)`, 'Voltage is squared.', 'Square the voltage multiplier', 'L02 s10'], [R`1.1 \times 0.81 \times 1.2 = 1.0692`, 'Everything else cancels in new ÷ old.', 'Multiply the multipliers', 'L02 s11']],
      check: R`\(0.891 \times 1.2 = 1.0692\) ✓ — the voltage cut nearly cancels the faster clock.` },
    { id: 'lad-pow2', diff: 'M', taught: 'L02 s10–s11', q: '<p>A new chip has 10% more capacitive load and 20% lower supply voltage. By how much can its clock rate rise if power must stay the same?</p>', ans: 'About 42% (×1.42).',
      steps: [[R`1.1 \times 0.8^2 \times z = 1`, 'Same power means new ÷ old = 1.', 'Set the power ratio to 1', 'L02 s11'], [R`1.1 \times 0.64 = 0.704`, '0.8² = 0.64.', 'Combine the known multipliers', 'L02 s10'], [R`z = 1 / 0.704 \approx 1.42`, 'Divide both sides by 0.704.', 'Solve for the clock multiplier', 'L02 s11']],
      check: R`\(1.1 \times 0.64 \times 1.42 \approx 1.00\) ✓.` },
    { id: 'lad-moore1', diff: 'E', taught: 'L02 s6–s7', q: '<p>A chip has 2 billion transistors. If the count doubles every 2 years, how many will a chip have 10 years later?</p>', ans: '64 billion.',
      steps: [[R`10 / 2 = 5\ \text{doublings}`, 'One doubling per 2 years.', 'Count the doublings', 'L02 s6'], [R`2 \times 2^5 = 2 \times 32 = 64\ \text{billion}`, 'Each doubling multiplies by 2.', 'Multiply by 2 for each', 'L02 s6']] },
    { id: 'lad-moore2', diff: 'M', taught: 'L02 s6–s7', q: '<p>How many years does it take for the transistor count to grow 8× if it doubles every 2 years? And if it doubles every 18 months?</p>', ans: '6 years; 4.5 years.',
      steps: [[R`8 = 2^3 \Rightarrow 3\ \text{doublings}`, R`\(\log_2 8 = 3\).`, 'Turn the growth into doublings', 'L02 s6'], [R`3 \times 2 = 6\ \text{years};\ \ 3 \times 1.5 = 4.5\ \text{years}`, 'Doublings × period.', 'Multiply by the doubling period', 'L02 s6']], check: R`\(2^{6/2} = 8\) ✓.` },
  ]);

  add('perf', [
    { id: 'lad-clk', diff: 'E', taught: 'L03 s12–s13', q: '<p>A processor’s clock period is 250 ps. What is its clock rate?</p>', ans: '4 GHz.',
      steps: [[R`f = 1 / (250 \times 10^{-12})`, 'Rate = 1 ÷ period; ps = 10⁻¹².', 'Rate = 1 ÷ period', 'L03 s13'], [R`= 4 \times 10^9\ \text{Hz} = 4\ \text{GHz}`, '1/250 = 0.004 and 10¹² × 0.004 = 4 × 10⁹.', 'Simplify and add a prefix', 'R1 s7']], check: R`\(4\ \text{GHz} \times 250\ \text{ps} = 1\) ✓.` },
    { id: 'lad-pct1', diff: 'M', taught: 'L03 s9–s10', q: '<p>A program’s run time is cut by 25%. By what percentage has performance increased?</p>', ans: 'About 33.3%.',
      steps: [[R`T_{new} = 0.75\,T`, '25% less time.', 'Write the new time', 'L03 s9'], [R`\text{Perf}_{new}/\text{Perf}_{old} = T/T_{new} = 1/0.75 \approx 1.333`, 'Performance is 1 ÷ time.', 'Flip to performance', 'L03 s6'], [R`1.333 - 1 = 0.333 \Rightarrow 33.3\%`, 'Increase relative to the old performance.', 'Turn it into a percentage', 'L03 s10']] },
    { id: 'lad-pct2', diff: 'M', taught: 'L03 s9–s10', q: '<p>A team needs 60% higher performance. By what percentage must the run time fall?</p>', ans: '37.5%.',
      steps: [[R`T_{new} = T / 1.6 = 0.625\,T`, '60% more performance → time ÷ 1.6.', 'Turn performance into time', 'L03 s6'], [R`1 - 0.625 = 0.375 \Rightarrow 37.5\%`, 'Reduction relative to the old time.', 'Percentage reduction', 'L03 s10']], check: R`\(1 / 0.625 = 1.6\) ✓.` },
    { id: 'lad-chain', diff: 'H', taught: 'L03 s7–s8', q: '<p>A is 1.5 times faster than B, and B is 1.2 times faster than C. C takes 9 s. How long do B and A take, and how many times faster is A than C?</p>', ans: 'B 7.5 s, A 5 s; A is 1.8× faster than C.',
      steps: [[R`T_B = 9 / 1.2 = 7.5\ \text{s}`, '“n times faster” → time ÷ n.', 'Find B from C', 'L03 s8'], [R`T_A = 7.5 / 1.5 = 5\ \text{s}`, 'Same rule.', 'Find A from B', 'L03 s8'], [R`\(T_C / T_A = 9 / 5 = 1.8\)`, 'Factors multiply: 1.5 × 1.2 = 1.8.', 'Compare A with C', 'L03 s7']], check: R`\(1.5 \times 1.2 = 1.8\) ✓.` },
  ]);

  add('cpuperf', [
    { id: 'lad-cpu1', diff: 'E', taught: 'L03 s14–s15', q: '<p>A program executes 2 × 10⁹ instructions with average CPI 1.5 on a 3 GHz processor. What is the CPU time?</p>', ans: '1 s.',
      steps: [[R`T = IC \times CPI / f`, 'The iron law.', 'Write the iron law', 'L03 s14'], [R`= 2 \times 10^9 \times 1.5 / (3 \times 10^9) = 1\ \text{s}`, '3 × 10⁹ cycles ÷ 3 × 10⁹ cycles per second.', 'Substitute', 'L03 s15']] },
    { id: 'lad-cpu2', diff: 'M', taught: 'L03 s18–s19', q: '<p>The same program must finish in 0.8 s on the same 3 GHz clock. What average CPI is needed?</p>', ans: 'CPI = 1.2.',
      steps: [[R`0.8 = 2 \times 10^9 \times CPI / (3 \times 10^9)`, 'Put the target time into the iron law.', 'Set the target', 'L03 s18'], [R`CPI = 0.8 \times 3 / 2 = 1.2`, 'Rearrange.', 'Solve for CPI', 'L03 s18']], check: R`\(2 \times 10^9 \times 1.2 / 3 \times 10^9 = 0.8\) s ✓.` },
    { id: 'lad-mix', diff: 'M', taught: 'L10 s21; P&H §1.6', q: '<p>An instruction mix is 50% ALU (CPI 1), 30% loads/stores (CPI 2) and 20% branches (CPI 5). What is the average CPI?</p>', ans: '2.1.',
      steps: [[R`0.5 \times 1 + 0.3 \times 2 + 0.2 \times 5`, 'Weight each CPI by its share.', 'Weight each class', 'P&H §1.6'], [R`\(= 0.5 + 0.6 + 1.0 = 2.1\)`, 'Add.', 'Add up', 'P&H §1.6']], check: '2.1 lies between the smallest (1) and largest (5) class CPI ✓.' },
    { id: 'lad-clkneed', diff: 'H', taught: 'L03 s14–s19', q: '<p>A program of 4 × 10⁹ instructions with CPI 2.1 must run in 2 s. What clock rate is needed?</p>', ans: '4.2 GHz.',
      steps: [[R`f = IC \times CPI / T`, 'Rearrange the iron law for f.', 'Rearrange for the clock', 'L03 s14'], [R`= 4 \times 10^9 \times 2.1 / 2 = 4.2 \times 10^9\ \text{Hz}`, '8.4 × 10⁹ cycles in 2 s.', 'Substitute', 'L03 s15']], check: R`\(4 \times 10^9 \times 2.1 / 4.2 \times 10^9 = 2\) s ✓.` },
    { id: 'lad-comp', diff: 'H', taught: 'L03 s22; L07 s11–s13', q: '<p>A compiler optimisation cuts the instruction count by 20% but raises CPI from 1.5 to 1.8. The clock is unchanged. Is the program faster or slower, and by how much?</p>', ans: 'Faster: about 1.04× (4%).',
      steps: [[R`\text{old cycles} \propto 1 \times 1.5 = 1.5`, 'Clock is the same, so compare IC × CPI.', 'Cycles before', 'L03 s22'], [R`\text{new} \propto 0.8 \times 1.8 = 1.44`, '−20% IC → ×0.8.', 'Cycles after', 'L03 s22'], [R`1.5 / 1.44 \approx 1.042`, 'Slow ÷ fast.', 'Compare', 'L03 s17']], check: 'Lower IC × CPI at the same clock always means less time: 1.44 < 1.5 ✓.' },
  ]);

  add('amdahl', [
    { id: 'lad-findf', diff: 'H', taught: 'L04 s5', q: '<p>Part of a program is made 2× faster and the whole program becomes 1.25× faster. What fraction of the original time did that part take?</p>', ans: 'f = 0.4 (40%).',
      steps: [[R`\dfrac{1}{(1-f) + f/2} = 1.25`, 'Amdahl with s = 2.', 'Write Amdahl with the target', 'L04 s5'], [R`\((1-f) + f/2 = 0.8\)`, '1/1.25 = 0.8.', 'Flip both sides', 'L04 s5'], [R`1 - f/2 = 0.8 \Rightarrow f = 0.4`, 'Collect the f terms.', 'Solve for f', 'L04 s5']], check: R`\(1/(0.6 + 0.2) = 1.25\) ✓.` },
    { id: 'lad-serial', diff: 'H', taught: 'L04 s7–s8', q: '<p>A program runs on a 1024-core GPU and the goal is a 100× overall speedup. What is the largest serial fraction the program can have?</p>', ans: 'About 0.9%.',
      steps: [[R`\dfrac{1}{(1-f) + f/1024} = 100`, 'f = parallel fraction, s = 1024.', 'Write Amdahl with the target', 'L04 s8'], [R`1 - f\left(1 - \tfrac{1}{1024}\right) = 0.01`, 'Flip and collect.', 'Flip and collect the f terms', 'L04 s5'], [R`f = 0.99 / 0.99902 \approx 0.99097`, 'Divide.', 'Solve for f', 'L04 s5'], [R`1 - f \approx 0.0090 = 0.90\%`, 'The serial part.', 'Serial fraction = 1 − f', 'L04 s8']], check: R`\(1/(0.00903 + 0.99097/1024) \approx 1/0.01 = 100\) ✓.` },
    { id: 'lad-needs', diff: 'M', taught: 'L04 s5, s7–s8', q: '<p>80% of a program’s time can be accelerated. How many times faster must that part become for a 4× overall speedup? Is 5× possible?</p>', ans: 's = 16; 5× is the limit and cannot be reached with finite s.',
      steps: [[R`\(0.2 + 0.8/s = 1/4 = 0.25\)`, 'Flip the target.', 'Flip the target', 'L04 s5'], [R`0.8/s = 0.05 \Rightarrow s = 16`, 'Subtract 0.2.', 'Solve for s', 'L04 s5'], [R`\text{limit} = 1/0.2 = 5`, 'Only reached as s → ∞.', 'Compare with the limit', 'L04 s7']], check: R`\(1/(0.2 + 0.05) = 4\) ✓.` },
    { id: 'lad-secs', diff: 'E', taught: 'L04 s5; PS1-SOL Q1c time form', q: '<p>A 100 s program spends 40 s in a routine that is made 4× faster. Give the new time and the speedup.</p>', ans: '70 s; ≈ 1.43×.',
      steps: [[R`40 / 4 = 10\ \text{s}`, 'Only the routine shrinks.', 'Shrink the improved part', 'L04 s5'], [R`10 + 60 = 70\ \text{s}`, 'The other 60 s are unchanged.', 'Add the unchanged part', 'L04 s5'], [R`100 / 70 \approx 1.43`, 'Old ÷ new.', 'Speedup = old ÷ new', 'L04 s4']], check: R`Fraction form: \(1/(0.6 + 0.4/4) = 1/0.7 \approx 1.43\) ✓.` },
  ]);

  add('isa1', [
    { id: 'lad-off', diff: 'E', taught: 'L05 s18–s19', q: '<p>A is an array of 32-bit words. What byte offset reaches <code>A[5]</code>?</p>', ans: '20.', steps: [[R`5 \times 4 = 20`, 'Each word is 4 bytes.', 'Index × 4', 'L05 s19']] },
    { id: 'lad-ld', diff: 'M', taught: 'L05 s18–s19', q: '<p>g is in <code>$s1</code>, h in <code>$s2</code> and the base of A in <code>$s3</code>. Write MIPS for <code>g = h + A[3];</code></p>', ans: '<code>lw $t0, 12($s3)</code> then <code>add $s1, $s2, $t0</code>.',
      steps: [['<code>lw $t0, 12($s3)</code>', 'A[3] is at byte offset 12.', 'Load the array element', 'L05 s19'], ['<code>add $s1, $s2, $t0</code>', 'g is a plain variable, so no store is needed.', 'Add into g’s register', 'L05 s8']] },
    { id: 'lad-ld2', diff: 'M', taught: 'L05 s18–s19', q: '<p>The base of A is in <code>$s3</code>. Write MIPS for <code>A[10] = A[2] + A[3];</code></p>', ans: 'lw 8, lw 12, add, sw 40.',
      steps: [['<code>lw $t0, 8($s3)</code>', 'A[2]: 2 × 4.', 'Load A[2]', 'L05 s19'], ['<code>lw $t1, 12($s3)</code>', 'A[3]: 3 × 4.', 'Load A[3]', 'L05 s19'], ['<code>add $t0, $t0, $t1</code>', 'Arithmetic only on registers.', 'Add', 'L05 s8'], ['<code>sw $t0, 40($s3)</code>', 'A[10]: 10 × 4.', 'Store into A[10]', 'L05 s19']] },
    { id: 'lad-back', diff: 'H', taught: 'L05 s18–s19', q: '<p>Reading backwards: <code>sw $t0, 36($s3)</code> stores into which element of the word array whose base is in <code>$s3</code>?</p>', ans: 'A[9].', steps: [[R`\(36 / 4 = 9\)`, 'Byte offset ÷ 4 bytes per word.', 'Offset ÷ 4', 'L05 s18']], check: R`\(9 \times 4 = 36\) ✓.` },
    { id: 'lad-endian', diff: 'H', taught: 'L05 s15–s17', q: '<p>The word 0x12345678 is stored at address 0x10010004 on big-endian MIPS. Which byte is at 0x10010004, and which at 0x10010007?</p>', ans: '0x12 at …04; 0x78 at …07.',
      steps: [['Big-endian: the most significant byte goes at the lowest address.', 'The “big end” comes first.', 'Recall big-endian', 'L05 s17'], ['0x12 at …04, 0x34 at …05, 0x56 at …06, 0x78 at …07', 'One byte per address.', 'Lay the bytes out', 'L05 s16']] },
  ]);

  add('encoding', [
    { id: 'lad-enc1', diff: 'M', taught: 'L06 s5–s6', q: '<p>Encode <code>sub $t2, $s3, $s4</code> (funct for sub = 34) in hex.</p>', ans: '0x02745022.',
      steps: [[R`op\ 0,\ rs\ 19,\ rt\ 20,\ rd\ 10,\ shamt\ 0,\ funct\ 34`, '$s3 = 19, $s4 = 20, $t2 = 10.', 'Fill the fields in decimal', 'L06 s6'], ['<code>000000 10011 10100 01010 00000 100010</code>', 'Each field at its exact width.', 'Convert each field to binary', 'L06 s6'], ['<code>0000 0010 0111 0100 0101 0000 0010 0010</code> = 0x02745022', 'Regroup in fours from the right.', 'Regroup into hex', 'L06 s7']], check: 'Decode 0x02745022: op 0, funct 34 → sub; rs 19, rt 20, rd 10 ✓.' },
    { id: 'lad-enc2', diff: 'M', taught: 'L06 s8–s9', q: '<p>Encode <code>lw $t0, 32($s3)</code> (op for lw = 35) in hex.</p>', ans: '0x8E680020.',
      steps: [[R`op\ 35,\ rs\ 19,\ rt\ 8,\ imm\ 32`, 'rs = base register, rt = destination.', 'Fill the fields', 'L06 s8'], ['<code>100011 10011 01000 0000000000100000</code>', '6, 5, 5, 16 bits.', 'Convert to binary', 'L06 s9'], ['<code>1000 1110 0110 1000 0000 0000 0010 0000</code> = 0x8E680020', 'Regroup.', 'Regroup into hex', 'L06 s7']] },
    { id: 'lad-dec', diff: 'H', taught: 'L06 s5–s6, s10', q: '<p>Decode 0x02328020.</p>', ans: '<code>add $s0, $s1, $s2</code>.',
      steps: [['<code>0000 0010 0011 0010 1000 0000 0010 0000</code>', 'Hex → 32 bits.', 'Expand to binary', 'L06 s7'], ['op = 000000 → R-format', 'The first 6 bits.', 'Read the opcode', 'L06 s10'], [R`rs = 17,\ rt = 18,\ rd = 16,\ shamt = 0,\ funct = 32`, 'Cut at 5, 5, 5, 5, 6.', 'Cut the rest into fields', 'L06 s6'], ['funct 32 = add → <code>add $s0, $s1, $s2</code>', 'Assembly order is rd, rs, rt.', 'Name the instruction', 'L06 s6']] },
    { id: 'lad-imm', diff: 'E', taught: 'L06 s8–s9', q: '<p>What are the largest and smallest values an <code>addi</code> immediate can hold?</p>', ans: '32 767 and −32 768.',
      steps: [[R`16\text{-bit two's complement}`, 'The immediate field is 16 bits, signed.', 'Field width and type', 'L06 s8'], [R`2^{15} - 1 = 32767,\ \ -2^{15} = -32768`, 'n-bit two’s complement range.', 'Use the range formula', 'L06 s9']] },
  ]);

  add('isa2', [
    { id: 'lad-sll', diff: 'E', taught: 'L06 s12–s13', q: '<p><code>$s0</code> = 9. What is in <code>$t2</code> after <code>sll $t2, $s0, 4</code>?</p>', ans: '144.', steps: [[R`9 \times 2^4 = 144`, 'Shifting left by n multiplies by 2ⁿ.', 'Shift left = multiply by 2ⁿ', 'L06 s13']], check: R`\(1001_2 \to 1001\,0000_2 = 128 + 16 = 144\) ✓.` },
    { id: 'lad-mask', diff: 'M', taught: 'L06 s14–s15', q: '<p><code>$t1</code> = 0x1234ABCD. Write one instruction that keeps only its lowest 8 bits in <code>$t0</code>, and give the result.</p>', ans: '<code>andi $t0, $t1, 0xFF</code> → 0x000000CD.',
      steps: [['<code>andi $t0, $t1, 0xFF</code>', 'AND with 1 keeps a bit; AND with 0 clears it.', 'Pick a mask', 'L06 s14'], ['0x000000CD', 'Only the low byte CD survives.', 'Apply it', 'L06 s14']] },
    { id: 'lad-slt', diff: 'M', taught: 'L06 s16–s17', q: '<p>a, b, c are in <code>$s0</code>, <code>$s1</code>, <code>$s2</code>. Write MIPS for <code>c = (a &lt; b) ? 1 : 0;</code></p>', ans: '<code>slt $s2, $s0, $s1</code>.', steps: [['<code>slt $s2, $s0, $s1</code>', 'slt sets its destination to 1 if the first source is less than the second, otherwise 0 — exactly this expression.', 'Use set-on-less-than', 'L06 s16']] },
    { id: 'lad-btgt', diff: 'H', taught: 'L06 s22–s25', q: '<p>A <code>beq</code> at address 0x00400010 has immediate −3. Where does it go if taken?</p>', ans: '0x00400008.',
      steps: [[R`PC + 4 = \texttt{0x00400014}`, 'Offsets count from the next instruction.', 'Find PC + 4', 'L06 s23'], [R`-3 \times 4 = -12\ \text{bytes}`, 'The immediate counts instructions.', 'Turn the immediate into bytes', 'L06 s23'], [R`\texttt{0x00400014} - 12 = \texttt{0x00400008}`, '0x14 = 20; 20 − 12 = 8.', 'Add to PC + 4', 'L06 s23']], check: R`\((\texttt{0x08} - \texttt{0x14}) / 4 = -12/4 = -3\) ✓.` },
  ]);

  add('translate', [
    { id: 'lad-tool', diff: 'E', taught: 'L07 s5–s7', q: '<p>Which tool resolves a call to a library routine such as <code>printf</code>, and when?</p>', ans: 'The linker, when it joins the object files and libraries into an executable.', steps: [['Linker', 'The assembler leaves the address of an external routine unresolved; the linker fills it in.', 'Name the tool', 'L07 s6']] },
    { id: 'lad-li', diff: 'M', taught: 'L07 s4', q: '<p>Expand the pseudo-instruction <code>li $t0, 0x12345678</code> into real instructions.</p>', ans: '<code>lui $t0, 0x1234</code> then <code>ori $t0, $t0, 0x5678</code>.',
      steps: [['<code>lui $t0, 0x1234</code>', 'An immediate only holds 16 bits, so load the upper half first (lower half becomes 0).', 'Load the upper 16 bits', 'L07 s4'], ['<code>ori $t0, $t0, 0x5678</code>', 'OR in the lower 16 bits.', 'OR in the lower 16 bits', 'L07 s4']] },
    { id: 'lad-opt', diff: 'H', taught: 'L07 s11–s13', q: '<p>Unoptimised: 10⁹ instructions, CPI 1.2. Optimised: 0.9 × 10⁹ instructions, CPI 1.3. Same clock. Which is faster, and does this support “instruction count alone is a poor indicator”?</p>', ans: 'Optimised, by about 2.6% — and yes: IC fell 10% but time only 2.5%.',
      steps: [[R`1.2 \times 10^9\ \text{vs}\ 0.9 \times 1.3 \times 10^9 = 1.17 \times 10^9\ \text{cycles}`, 'Same clock: compare cycles.', 'Cycles for each', 'L07 s11'], [R`1.2 / 1.17 \approx 1.026`, 'Slow ÷ fast.', 'Compare', 'L07 s12'], ['IC −10% but time only −2.5%', 'CPI rose, eating most of the gain.', 'Draw the lesson', 'L07 s13']] },
  ]);

  add('binary', [
    { id: 'lad-m1', diff: 'E', taught: 'L08 s6–s7', q: '<p>Write −1 as an 8-bit two’s complement pattern.</p>', ans: '1111 1111.', steps: [['00000001', '+1.', 'Write +1', 'L08 s7'], ['11111110', 'Invert.', 'Invert', 'L08 s7'], ['11111111', 'Add 1.', 'Add 1', 'L08 s7']], check: R`\(-128 + 127 = -1\) ✓.` },
    { id: 'lad-range', diff: 'M', taught: 'L08 s6', q: '<p>What range of values can a 6-bit two’s complement number hold?</p>', ans: '−32 to +31.', steps: [[R`-2^{5}\ \text{to}\ 2^{5} - 1`, 'Range for n bits: −2ⁿ⁻¹ to 2ⁿ⁻¹ − 1.', 'Use the range formula', 'L08 s6'], [R`-32\ \text{to}\ 31`, '2⁵ = 32.', 'Evaluate', 'L08 s6']] },
    { id: 'lad-sext', diff: 'M', taught: 'L08 s13', q: '<p>Sign-extend the 8-bit value 1011 0100 to 16 bits and give its decimal value.</p>', ans: '1111 1111 1011 0100 = −76.',
      steps: [['1111 1111 1011 0100', 'Copy the sign bit (1) into the new top 8 bits.', 'Copy the sign bit', 'L08 s13'], [R`\(-128 + 32 + 16 + 4 = -76\)`, 'In 8 bits: weights of bits 7, 5, 4, 2.', 'Read the value', 'L08 s6']], check: 'Negate 10110100 → 01001011 + 1 = 01001100 = 76 ✓.' },
    { id: 'lad-back100', diff: 'H', taught: 'L08 s7', q: '<p>Working backwards: which 8-bit two’s complement pattern means −100?</p>', ans: '1001 1100.', steps: [['100 = 0110 0100', '64 + 32 + 4.', 'Write +100', 'L08 s5'], ['1001 1011', 'Invert.', 'Invert', 'L08 s7'], ['1001 1100', 'Add 1.', 'Add 1', 'L08 s7']], check: R`\(-128 + 16 + 8 + 4 = -100\) ✓.` },
    { id: 'lad-ovf', diff: 'H', taught: 'L08 s11–s12', q: '<p>What does <code>add</code> produce for 0x7FFFFFFF + 1, and what happens?</p>', ans: '0x80000000 = −2³¹: signed overflow, so add raises an exception (addu would not).',
      steps: [['0x7FFFFFFF + 1 = 0x80000000', 'Hex addition carries all the way up.', 'Add', 'L08 s9'], ['Two positives gave a negative pattern', 'Same signs in, other sign out.', 'Apply the overflow rule', 'L08 s11'], ['add → overflow exception; addu ignores it', 'Signed vs unsigned instructions.', 'Say what MIPS does', 'L08 s12']] },
  ]);

  add('float', [
    { id: 'lad-f1', diff: 'E', taught: 'L08 s15; P&H §3.5', q: '<p>Decode the single-precision pattern 0x40400000.</p>', ans: '3.0.',
      steps: [['0 | 1000 0000 | 1000…0', 'Hex → bits; split 1 / 8 / 23.', 'Split the fields', 'L08 s15'], [R`\(128 - 127 = 1\)`, 'Subtract the bias.', 'Exponent', 'L08 s15'], [R`\(1.1_2 = 1.5\)`, 'Leading 1 plus fraction .1.', 'Significand', 'P&H §3.5'], [R`+1.5 \times 2^1 = 3.0`, 'Sign bit 0.', 'Combine', 'P&H §3.5']] },
    { id: 'lad-f2', diff: 'M', taught: 'P&H §3.5', q: '<p>Encode 5.0 in single precision (hex).</p>', ans: '0x40A00000.',
      steps: [[R`5 = 101_2 = 1.01_2 \times 2^2`, 'Normalise.', 'Write in binary and normalise', 'P&H §3.5'], [R`2 + 127 = 129 = 1000\,0001`, 'Bias the exponent.', 'Biased exponent', 'P&H §3.5'], ['0 | 1000 0001 | 0100…0', 'Fraction = bits after the point.', 'Assemble the fields', 'P&H §3.5'], ['0100 0000 1010 0000 … = 0x40A00000', 'Regroup.', 'Regroup into hex', 'L06 s7']] },
    { id: 'lad-f3', diff: 'H', taught: 'P&H §3.5', q: '<p>Encode −0.375 in single precision (hex).</p>', ans: '0xBEC00000.',
      steps: [[R`0.375 = 0.011_2 = 1.1_2 \times 2^{-2}`, '0.375 = 1/4 + 1/8.', 'Binary and normalise', 'P&H §3.5'], [R`-2 + 127 = 125 = 0111\,1101`, 'Bias.', 'Biased exponent', 'P&H §3.5'], ['1 | 0111 1101 | 1000…0', 'Sign 1 for negative.', 'Assemble', 'P&H §3.5'], ['1011 1110 1100 0000 … = 0xBEC00000', 'Regroup.', 'Regroup into hex', 'L06 s7']], check: R`Decode back: exponent 125 − 127 = −2, \(1.1_2 = 1.5\), \(-1.5 \times 2^{-2} = -0.375\) ✓.` },
  ]);

  add('uarch', [
    { id: 'lad-u1', diff: 'E', taught: 'L09 s16, s18', q: '<p>The critical path of a design is 500 ps. What is its maximum clock rate?</p>', ans: '2 GHz.', steps: [[R`T_{clk} \ge 500\ \text{ps}`, 'The clock must fit the slowest path.', 'Clock ≥ critical path', 'L09 s18'], [R`f = 1/500\ \text{ps} = 2\ \text{GHz}`, 'Rate = 1 ÷ period.', 'Turn it into a rate', 'L03 s13']] },
    { id: 'lad-u2', diff: 'M', taught: 'L09 s16, s18; R1 s16', q: '<p>Three register-to-register paths take 300, 450 and 380 ps, and each register adds 50 ps of overhead. What is the minimum clock period?</p>', ans: '500 ps.', steps: [['450 ps is the critical path', 'Take the slowest.', 'Find the slowest path', 'L09 s18'], [R`450 + 50 = 500\ \text{ps}`, 'Add the register overhead.', 'Add the overhead', 'L09 s16']] },
    { id: 'lad-u3', diff: 'M', taught: 'L09 s19–s24', q: '<p>Which of the five steps does <code>add</code> use, and which does <code>sw</code> use?</p>', ans: 'add: IF, ID, EX, WB. sw: IF, ID, EX, MEM.', steps: [['add: IF, ID, EX, WB', 'No data-memory access.', 'add', 'L09 s22'], ['sw: IF, ID, EX, MEM', 'Writes memory, not a register.', 'sw', 'L09 s23']] },
  ]);

  add('single', [
    { id: 'lad-s1', diff: 'E', taught: 'L10 s16–s19', q: '<p>Instruction memory 200 ps, register file 100 ps, ALU 150 ps, data memory 200 ps. How long is the <code>lw</code> path?</p>', ans: '750 ps.', steps: [[R`\(200 + 100 + 150 + 200 + 100\)`, 'Fetch, read, ALU, memory, write back.', 'List the units on the path', 'L10 s16'], [R`= 750\ \text{ps}`, 'Add.', 'Add', 'L10 s16']] },
    { id: 'lad-s2', diff: 'M', taught: 'L10 s16–s19', q: '<p>Same delays. How long is the R-type path, and how much of each clock cycle does an R-type waste?</p>', ans: '550 ps; 200 ps wasted (the clock is 750 ps).', steps: [[R`\(200 + 100 + 150 + 100 = 550\)`, 'No data memory.', 'R-type path', 'L10 s16'], [R`750 - 550 = 200\ \text{ps}`, 'The clock is set by lw.', 'Compare with the clock', 'L10 s20']] },
    { id: 'lad-s3', diff: 'H', taught: 'L10 s20–s21', q: '<p>25% of instructions are <code>lw</code> (750 ps), the rest R-type (550 ps). If a clock could stretch to fit each instruction, how much faster would it be than single-cycle?</p>', ans: '1.25× (600 ps vs 750 ps average) — the waste multi-cycle and pipelining go after.',
      steps: [[R`0.25 \times 750 + 0.75 \times 550 = 600`, 'Weighted average time.', 'Average time with a stretchy clock', 'L10 s21'], [R`\(750 / 600 = 1.25\)`, 'Single-cycle gives every instruction 750 ps.', 'Compare with single-cycle', 'L10 s20']] },
  ]);

  add('multi', [
    { id: 'lad-n1', diff: 'E', taught: 'L11 s8–s9', q: '<p>Stage latencies are 200, 100, 200, 200 and 100 ps. What is the multi-cycle clock period?</p>', ans: '200 ps.', steps: [['200 ps', 'One step per cycle, so the cycle must fit the slowest step.', 'Clock = slowest step', 'L11 s8']] },
    { id: 'lad-n2', diff: 'M', taught: 'L11 s9; R1 s18', q: '<p>Mix: 20% lw (5 steps), 10% sw (4), 50% R-type (4), 20% beq (3). Clock 200 ps. Average CPI and time per instruction?</p>', ans: 'CPI 4.0; 800 ps.', steps: [[R`0.2 \times 5 + 0.1 \times 4 + 0.5 \times 4 + 0.2 \times 3`, 'Weighted steps.', 'Weight the step counts', 'L11 s9'], [R`\(= 1.0 + 0.4 + 2.0 + 0.6 = 4.0\)`, 'Add.', 'Add', 'L11 s9'], [R`4.0 \times 200 = 800\ \text{ps}`, 'CPI × clock.', 'Time per instruction', 'L11 s9']], check: 'Weights 0.2 + 0.1 + 0.5 + 0.2 = 1 ✓.' },
    { id: 'lad-n3', diff: 'H', taught: 'L11 s9; L12 s16', q: '<p>Single-cycle takes 800 ps per instruction. With the CPI of 4.0 above, what multi-cycle clock period would make multi-cycle 1.25× faster?</p>', ans: '160 ps.', steps: [[R`800 / 1.25 = 640\ \text{ps}`, 'Target time per instruction.', 'Target time', 'L03 s7'], [R`640 / 4.0 = 160\ \text{ps}`, 'Time = CPI × clock.', 'Solve for the clock', 'L11 s9']], check: R`\(4.0 \times 160 = 640\) and \(800/640 = 1.25\) ✓.` },
  ]);

  add('pipe', [
    { id: 'lad-p1', diff: 'E', taught: 'L12 s14–s18', q: '<p>How many cycles do 100 instructions take on an ideal 5-stage pipeline?</p>', ans: '104.', steps: [[R`\(k + N - 1 = 5 + 100 - 1 = 104\)`, 'Fill, then one per cycle.', 'Use k + N − 1', 'L12 s18']] },
    { id: 'lad-p2', diff: 'M', taught: 'L12 s16–s18', q: '<p>Stages take 200, 100, 200, 200 and 100 ps. How long do 1000 instructions take on the pipelined version?</p>', ans: '200.8 ns.', steps: [['Clock = 200 ps', 'Slowest stage.', 'Clock = slowest stage', 'L12 s17'], [R`5 + 1000 - 1 = 1004\ \text{cycles}`, 'k + N − 1.', 'Count cycles', 'L12 s18'], [R`1004 \times 200\ \text{ps} = 200\,800\ \text{ps}`, '= 200.8 ns.', 'Cycles × clock', 'L12 s18']] },
    { id: 'lad-p3', diff: 'H', taught: 'L12 s9–s12', q: '<p>Balanced 5-stage pipeline. How many instructions are needed before it is at least 4× faster than the same design without pipelining?</p>', ans: 'N ≥ 16.', steps: [[R`\text{speedup} = \dfrac{5N}{N + 4}`, 'N × 5 stage-times vs (5 + N − 1).', 'Write the speedup', 'L12 s9'], [R`5N \ge 4(N + 4) \Rightarrow N \ge 16`, 'Rearrange.', 'Solve for N', 'L12 s9']], check: R`\(5 \times 16 / 20 = 4\) ✓.` },
    { id: 'lad-p4', diff: 'H', taught: 'L12 s11–s12', q: '<p>An 800 ps single-cycle design is cut into 5 balanced stages, and each pipeline register adds 20 ps. What is the clock period, and the best-case speedup for a long program?</p>', ans: '180 ps; ≈ 4.44×.', steps: [[R`800 / 5 = 160\ \text{ps}`, 'Balanced.', 'Split the work', 'L12 s11'], [R`160 + 20 = 180\ \text{ps}`, 'Register overhead each stage.', 'Add register overhead', 'L12 s12'], [R`800 / 180 \approx 4.44`, 'One instruction per cycle in steady state.', 'Speedup', 'L12 s9']] },
  ]);

  add('hazards', [
    { id: 'lad-h1', diff: 'E', taught: 'L14 s7; L15 s14', q: '<p>30% of instructions cause a 1-cycle stall. What is the CPI?</p>', ans: '1.3.', steps: [[R`1 + 0.3 \times 1 = 1.3`, 'Ideal CPI plus fraction × penalty.', 'Add the stall term', 'L15 s14']] },
    { id: 'lad-h2', diff: 'M', taught: 'L15 s14; PS3 Q3', q: '<p>20% of instructions stall 2 cycles and another 10% stall 3 cycles. What is the CPI?</p>', ans: '1.7.', steps: [[R`0.2 \times 2 = 0.4;\ 0.1 \times 3 = 0.3`, 'Each hazard type separately.', 'Each hazard term', 'L15 s14'], [R`\(1 + 0.4 + 0.3 = 1.7\)`, 'Add to 1.', 'Add up', 'L15 s14']] },
    { id: 'lad-h3', diff: 'M', taught: 'L14 s7', q: '<p>A pipeline measures CPI 1.6. All its stalls come from 30% of instructions, which each stall the same number of cycles. How many?</p>', ans: '2 cycles each.', steps: [[R`\(1 + 0.3c = 1.6\)`, 'Ideal 1 plus the stall term.', 'Write the CPI equation', 'L14 s7'], [R`\(c = 0.6 / 0.3 = 2\)`, 'Solve.', 'Solve for the penalty', 'L14 s7']] },
    { id: 'lad-h4', diff: 'H', taught: 'L15 s14; Practice Test Q5', q: '<p>P1: CPI 1.5 at 2 GHz. P2: CPI 1.2 at 1.6 GHz. Which is faster?</p>', ans: 'Neither: both take 0.75 ns per instruction.', steps: [[R`1.5 / 2\ \text{GHz} = 0.75\ \text{ns}`, 'CPI × period.', 'Time per instruction on P1', 'L03 s14'], [R`1.2 / 1.6\ \text{GHz} = 0.75\ \text{ns}`, 'Same.', 'Time per instruction on P2', 'L03 s14'], ['Equal', 'Lower CPI exactly offsets the slower clock.', 'Compare', 'L15 s14']] },
  ]);

  add('datahaz', [
    { id: 'lad-d1', diff: 'E', taught: 'L16 s5–s6', q: '<p>Without forwarding, how many stall cycles if the consumer is two instructions after its producer (one instruction in between)?</p>', ans: '1.', steps: [[R`\max(0, 3 - 2) = 1`, 'Distance d = 2.', 'Use the distance rule', 'L16 s6']] },
    { id: 'lad-d2', diff: 'M', taught: 'L16 s5–s6', q: '<p><code>add $t0, $t1, $t2</code>; <code>sub $t3, $t0, $t4</code>; <code>and $t5, $t0, $t6</code>. How many stalls in total without forwarding?</p>', ans: '2.', steps: [['add → sub: distance 1 → 2 stalls', 'sub waits in ID until add’s WB.', 'First dependency', 'L16 s6'], ['add → and: and’s ID now comes after add’s WB → 0', 'The stall already delayed and by 2 cycles.', 'Second dependency, after the stall', 'L15 s12']], check: 'Draw it: add WB in cycle 5; sub ID in 5; and ID in 6 ≥ 5 ✓.' },
    { id: 'lad-d3', diff: 'M', taught: 'L15 s7–s11', q: '<p>List every dependency: I1 <code>lw $t1, 0($t0)</code>; I2 <code>add $t2, $t1, $t3</code>; I3 <code>sub $t1, $t4, $t5</code>.</p>', ans: 'RAW I1→I2 ($t1); WAR I2→I3 ($t1); WAW I1→I3 ($t1).', steps: [['Writes: I1 $t1, I2 $t2, I3 $t1. Reads: I1 $t0; I2 $t1, $t3; I3 $t4, $t5.', 'Separate writes from reads.', 'List writes and reads', 'L15 s11'], ['RAW I1→I2 on $t1', 'I2 reads what I1 wrote.', 'RAW', 'L15 s8'], ['WAR I2→I3 on $t1', 'I3 writes what I2 read.', 'WAR', 'L15 s9'], ['WAW I1→I3 on $t1', 'Both write $t1.', 'WAW', 'L15 s10']] },
    { id: 'lad-d4', diff: 'H', taught: 'L16 s5–s6', q: '<p>Without forwarding, how many independent instructions must sit between a producer and its consumer to remove every stall?</p>', ans: 'Two (distance 3).', steps: [[R`3 - d \le 0 \Rightarrow d \ge 3`, 'Stalls = max(0, 3 − d).', 'Set the stall count to 0', 'L16 s6'], ['d = 3 → two instructions in between', 'Distance counts the consumer itself.', 'Turn distance into a gap', 'L16 s5']] },
  ]);

  add('forward', [
    { id: 'lad-w1', diff: 'E', taught: 'L16 s9–s10', q: '<p>With forwarding, how many stalls for <code>add $t0, …</code> followed immediately by <code>sub …, $t0, …</code>?</p>', ans: '0.', steps: [['ALU result ready at the end of EX; sub needs it at the start of its EX one cycle later', 'Forwarded from EX/MEM.', 'Compare ready time with need time', 'L16 s10']] },
    { id: 'lad-w2', diff: 'M', taught: 'L16 s11–s13', q: '<p><code>lw $t0, 0($s0)</code> followed immediately by <code>add $t1, $t0, $t2</code>. Stalls with and without forwarding?</p>', ans: '1 with forwarding, 2 without.', steps: [['Without: max(0, 3 − 1) = 2', 'Wait for WB.', 'Without forwarding', 'L16 s6'], ['With: max(0, 2 − 1) = 1', 'Load data only exists at the end of MEM.', 'With forwarding (load-use)', 'L16 s11']] },
    { id: 'lad-w3', diff: 'M', taught: 'L16 s11–s13; L15 s14', q: '<p>With full forwarding, 20% of instructions are loads and half of those are followed immediately by an instruction that uses the loaded value. No other stalls. CPI?</p>', ans: '1.1.', steps: [[R`0.2 \times 0.5 = 0.1`, 'Fraction of instructions causing a load-use stall.', 'Fraction that stalls', 'L16 s11'], [R`1 + 0.1 \times 1 = 1.1`, 'One stall each.', 'Add to the ideal CPI', 'L15 s14']] },
    { id: 'lad-w4', diff: 'H', taught: 'L16 s7', q: '<p>Adding forwarding lengthens the clock period by 5% but cuts CPI from 1.5 to 1.1. Is it worth it?</p>', ans: 'Yes: about 1.30× faster.', steps: [[R`1.1 \times 1.05 = 1.155`, 'New time per instruction (relative).', 'New CPI × new period', 'L16 s7'], [R`1.5 / 1.155 \approx 1.30`, 'Old ÷ new.', 'Compare with the old', 'L16 s7']], check: 'Lower time per instruction wins even with the slower clock ✓.' },
  ]);

  }

  // --- zz-names-a ---
  {
name('arch', 'ps1q1d', [['State the formula', 'L02 s10'], ['Name every symbol', 'L02 s10']]);
name('arch', 'l02s11', [['Turn each change into a multiplier', 'L02 s11'], ['Divide new by old', 'L02 s10'], ['Multiply out, squaring V', 'L02 s11'], ['Say it in words', 'L02 s11']],
  { check: R`\(0.85 \times 0.85^2 \times 0.85 = 0.85^4\): four factors of 0.85, and \(0.85^4 \approx 0.52\).` });
name('arch', 'ps1q3', [['Turn each change into a multiplier', 'L02 s10'], ['Write the power target as a multiplier', 'L02 s11'], ['Set new ÷ old equal to the target', 'L02 s10'], ['Square the voltage multiplier', 'L02 s10'], ['Combine the known multipliers', 'L02 s11'], ['Solve for the frequency multiplier', 'L02 s11'], ['Scale the old clock', 'L02 s11']],
  { check: R`\(0.6 \times 0.65^2 \times 1.775 = 0.45\), and \(3.55 / 2 = 1.775\).` });
name('arch', 'r1s3a', [['Say what doubles and how often', 'L02 s6']]);

name('vonneumann', 'ps2q1c', [['Define the ISA', 'L02 s23–s24'], ['Define the microarchitecture', 'L02 s23'], ['Contrast them in one line', 'L02 s24']]);
name('vonneumann', 'r1s5', [['Name the parts', 'R1 s5'], ['Say what control does', 'L02 s18'], ['Say what the datapath does', 'L02 s18']]);

name('perf', 'l03s8', [['Find the faster machine', 'L03 s7'], ['Divide slow time by fast time', 'L03 s8']], { check: R`\(10 \times 1.5 = 15\) s: B’s time ✓.` });
name('perf', 'l03s10', [['Percentage change in time', 'L03 s9'], ['Convert both times to performance', 'L03 s6'], ['Percentage change in performance', 'L03 s10']],
  { check: R`Old time ÷ new time \(= 10/6 = 1.667\): 66.7% more performance ✓.` });
name('perf', 'ptq1ii', [['Rate = 1 ÷ period', 'L03 s13'], ['Simplify the powers of ten', 'L03 s13'], ['Rewrite with a unit prefix', 'R1 s7']], { check: R`\(500\ \text{MHz} \times 2\ \text{ns} = 500 \times 10^6 \times 2 \times 10^{-9} = 1\) ✓ (rate × period is always 1).` });
name('perf', 'r1s10', [['A vs B, with B as the reference', 'L03 s9'], ['Turn it into a percentage', 'R1 s10'], ['B vs A, with A as the reference', 'L03 s9'], ['Turn it into a percentage', 'R1 s10']]);
name('perf', 'r1s7', [['Faster clock: multiply the rate', 'R1 s7'], ['Period of B', 'L03 s13'], ['Period of A', 'L03 s13']], { check: R`\(f_A \times T_{c,A} = 2\ \text{GHz} \times 0.5\ \text{ns} = 1\) ✓.` });

name('cpuperf', 'ps1q2a', [['Iron law for P1', 'L03 s14'], ['Simplify', 'L03 s14'], ['Iron law for P2', 'L03 s14'], ['Divide slow by fast', 'L03 s17']]);
name('cpuperf', 'ps1q2b', [['Write P3’s time from “two times slower”', 'L03 s18'], ['Iron law for P3', 'L03 s14'], ['Solve for CPI', 'L03 s18']], { check: R`\(100 \times 10 \times 2\ \text{ns} = 2000\ \text{ns} = 2\ \mu s = 2 \times T_{P2}\) ✓.` });
name('cpuperf', 'ps1q2c', [['Scale the instruction count', 'L03 s14'], ['Iron law again', 'L03 s14'], ['Compare with the old time', 'L03 s14']], { check: 'Time ∝ IC when CPI and clock are fixed: +50% IC → +50% time ✓.' });
name('cpuperf', 'l03s17', [['Time for A', 'L03 s17'], ['Time for B', 'L03 s17'], ['Ratio slow ÷ fast', 'L03 s17']]);
name('cpuperf', 'l03s18', [['Set the two times equal', 'L03 s18'], ['Solve for CPI(A)', 'L03 s18']], { check: R`\(2.4 \times 1 = 1.2 \times 2 = 2.4\) ns per instruction on both ✓.` });
name('cpuperf', 'l03s19', [['Set the two times equal', 'L03 s19'], ['Solve for A’s period', 'L03 s19']], { check: R`\(2.0 \times 1.2 = 1.2 \times 2 = 2.4\) ns per instruction ✓.` });
name('cpuperf', 'r1s8', [['Write the definition', 'R1 s8'], ['Substitute the iron law', 'R1 s8'], ['Cancel IC', 'R1 s8']]);

name('amdahl', 'ps1q1c', [['Fraction form', 'L04 s5'], ['Time form', 'L04 s5']]);
name('amdahl', 'l04s6', [['Option 1: plug in f and s', 'L04 s6'], ['Option 2: plug in f and s', 'L04 s6'], ['Option 2 with s → ∞', 'L04 s7'], ['Pick the winner', 'L04 s6']],
  { check: R`In seconds from 100: option 1 → \(5 + 95/1.1 = 91.4\); option 2 → \(95 + 0.5 = 95.5\). Smaller time wins: option 1 ✓.` });
name('amdahl', 'l04s8', [['Use the limit 1 ÷ (1 − f)', 'L04 s7–s8'], ['Exact value with s = 1024', 'L04 s8']]);
name('amdahl', 'ps1q4a', [['Turn each percentage into seconds', 'L04 s4'], ['INT is what is left', 'L04 s4']], { check: R`\(300 + 450 + 250 = 1000\) ✓.` });
name('amdahl', 'ps1q4b', [['Shrink FP', 'L04 s9'], ['Grow INT', 'L04 s9'], ['Add up the new total', 'L04 s4'], ['Percentage change from the old total', 'L04 s4']]);
name('amdahl', 'ps1q5a', [['Total the original time', 'L04 s4'], ['f = D’s share of the time', 'L04 s5'], ['Turn “reduced by 40%” into s', 'L04 s9'], ['Shrink the improved fraction', 'L04 s5'], ['Apply Amdahl', 'L04 s5'], ['New time = old ÷ speedup', 'L04 s5']],
  { check: R`D becomes \(90 \times 0.6 = 54\) s, so \(20 + 60 + 10 + 54 + 5 = 149\) s ✓.` });
name('amdahl', 'ps1q5b', [['Option (i): f and s', 'L04 s9'], ['Option (i): speedup', 'L04 s5'], ['Option (ii): f, s and speedup', 'L04 s5'], ['Pick the winner', 'L04 s6']],
  { check: R`In seconds: (i) B → 48 s, total 173 s; (ii) A → 14 s, total 179 s. 173 < 179 ✓.` });

name('isa1', 'ps1q6a', [['Load B[2]', 'L05 s19'], ['Load A[4]', 'L05 s19'], ['Subtract: h − A[4]', 'L05 s8'], ['Add: B[2] + (h − A[4])', 'L05 s8'], ['Store into B[6]', 'L05 s19']]);
name('isa1', 'ps1q6b', [['Read the addi', 'L05 s21'], ['Read the adds', 'L05 s8'], ['Read the sub', 'L05 s8'], ['Turn the store offset into an index', 'L05 s18']]);
name('isa1', 'ptq3', [['Load A[2]', 'L05 s19'], ['Load B[8]', 'L05 s19'], ['Subtract: f − A[2]', 'L05 s8'], ['Add: B[8] + (f − A[2])', 'L05 s8'], ['Store into A[4]', 'L05 s19']]);
name('isa1', 'l05s19', [['Index × 4 bytes', 'L05 s19']]);
name('isa1', 'r1s14', [['Recompute each offset', 'L05 s17'], ['Check the load', 'L05 s19'], ['Check the store', 'L05 s19']]);
name('isa1', 'r1s13', [['Read the add', 'L05 s8'], ['Read the lw', 'L05 s15']]);

name('encoding', 'l06s6', [['Opcode: R-format', 'L06 s5'], ['rs field', 'L06 s6'], ['rt field', 'L06 s6'], ['rd field', 'L06 s6'], ['shamt and funct', 'L06 s6'], ['Regroup into hex', 'L06 s7']], { check: R`Decode 0x02324020: op 0 → R-format, funct 32 → add, rs 17 = $s1, rt 18 = $s2, rd 8 = $t0 ✓.` });
name('encoding', 'l06s9', [['Opcode for addi', 'L06 s8'], ['rs and rt (rt is the destination)', 'L06 s8'], ['Immediate in 16 bits', 'L06 s9']], { check: R`\(0000\,0000\,0110\,0100_2 = 64 + 32 + 4 = 100\) ✓.` });
name('encoding', 'l06s7', [['Expand the first four digits', 'L06 s7'], ['Expand the last four', 'L06 s7']]);

name('isa2', 'ps1q7', [['Initialise the sum', 'L05 s21'], ['Exit test at the top', 'L06 s16'], ['Loop body: add a', 'L05 s8'], ['Count b down', 'L05 s21'], ['Jump back', 'L06 s16'], ['Add 100 and return it', 'L05 s21'], ['Write the equivalent C', 'L06 s17']], { check: 'Trace a = 3, b = 2: sum 0 → 3 → 6, then +100 = 106 = 3 × 2 + 100 ✓.' });
name('isa2', 'l06s14', [['Apply the AND rule', 'L06 s14'], ['Work out the low 16 bits', 'L06 s14']]);
name('isa2', 'l06s15', [['Apply the OR rule', 'L06 s15'], ['Work out the low 16 bits', 'L06 s15']]);
name('isa2', 'l06s23', [['Effective address = base + offset', 'L06 s23'], ['Load from that address', 'L06 s23']]);
name('isa2', 'disc-bne', [['Count static instructions', 'L06 s17'], ['Count dynamic instructions (bne)', 'L06 s17'], ['Same for beq', 'L06 s17'], ['Conclude', 'L06 s17']]);

name('translate', 'ps2q1b', [['Compiler', 'L07 s3'], ['Assembler', 'L07 s5'], ['Linker', 'L07 s6'], ['Loader', 'L07 s7']]);
name('translate', 'l07s4', [['move → add with $zero', 'L07 s4'], ['blt, part 1: slt into $at', 'L07 s4'], ['blt, part 2: branch if $at ≠ 0', 'L07 s4']]);
  }

  // --- zz-names-b ---
  {
name('binary', 'ps2q3a', [['Add the weights of the 1 bits', 'L08 s5']], { check: R`\(13 = 8 + 4 + 1\): bits 3, 2, 0 → 00001101 ✓.` });
name('binary', 'ps2q3b', [['Look at the sign bit', 'L08 s7'], ['Add the weights', 'L08 s5']]);
name('binary', 'ps2q3c', [['Give the top bit weight −128', 'L08 s6'], ['Add up', 'L08 s6'], ['Check by negating', 'L08 s7']]);
name('binary', 'ps2q3d', [['Add column by column with carries', 'L08 s9'], ['Predict the decimal answer', 'L08 s11'], ['Read the result back', 'L08 s6']]);
name('binary', 'ps2q4a', [['Add the significant hex digits', 'L08 s9'], ['Put the zeros back', 'L08 s9'], ['Keep 32 bits', 'L08 s11'], ['Decide whether it overflowed', 'L08 s11']]);
name('binary', 'ps2q4b', [['Set up the hex subtraction', 'L08 s10'], ['Lowest digit, with a borrow', 'L08 s10'], ['Remaining digits', 'L08 s10'], ['Result and overflow check', 'L08 s11']],
  { check: R`Add it back: \(0x57C00000 + 0x82A00000 = 0xDA600000\) ✓.` });
name('binary', 'l08s6', [['Weigh the bits (top bit negative)', 'L08 s6'], ['Add up', 'L08 s6']]);
name('binary', 'r1-5', [['Write +5 in 8 bits', 'L08 s7'], ['Invert every bit', 'L08 s7'], ['Add 1', 'L08 s7']], { check: R`\(11111011 + 00000101 = 1\,00000000\) → 0 in 8 bits ✓.` });

name('uarch', 'ps2q1a', [['IF', 'L09 s22'], ['ID', 'L09 s22'], ['EX', 'L09 s23'], ['MEM', 'L09 s23'], ['WB', 'L09 s24']]);
name('uarch', 'ps2q1d', [['Count instruction fetches', 'L09 s22'], ['Count data accesses', 'L09 s23']]);
name('uarch', 'r1s16', [['State machine view', 'L09 s10–s11'], ['What sets the clock', 'L09 s18'], ['Define the critical path', 'L09 s18']]);
name('uarch', 'r1s17', [['Fetch', 'L09 s20'], ['Decode', 'L09 s20'], ['Execute', 'L09 s21'], ['Memory', 'L09 s21'], ['Write back', 'L09 s21']]);
name('uarch', 'l09dff', [['First rising edge', 'L09 s15'], ['Second rising edge', 'L09 s15'], ['Third rising edge', 'L09 s15']]);

name('single', 'ptq6i', [['IF delay', 'L10 s16'], ['ID delay', 'L10 s16'], ['EX: the unit each one uses', 'L10 s17'], ['MEM: loads and stores only', 'L10 s17'], ['WB: everything but sw', 'L10 s17']]);
name('single', 'ptq6ii', [['Total each instruction’s path', 'L10 s16'], ['Clock = the slowest', 'L10 s16'], ['Time = N × CPI × period', 'L10 s20']], { check: 'Each of the 5 instructions gets the full 400 ps, even the 300 ps ones: 5 × 400 = 2000 ps ✓.' });
name('single', 'ps2q6a', [['Load: all five units', 'L10 s16'], ['Store: no write-back', 'L10 s17'], ['R-format: no memory', 'L10 s17'], ['Branch: no memory, no write-back', 'L10 s17']]);
name('single', 'l10s16', [['R-type path', 'L10 s16'], ['Load path', 'L10 s16'], ['Store path', 'L10 s16'], ['Branch and jump paths', 'L10 s16'], ['Clock = the slowest', 'L10 s16']]);

name('multi', 'ps2q5a', [['Total each row', 'L12 s16'], ['Single-cycle clock = slowest total', 'L10 s14'], ['Throughput = 1 ÷ period', 'L12 s16']]);
name('multi', 'ps2q5b', [['Clock = slowest stage', 'L11 s8'], ['Time per class = steps × clock', 'L11 s9'], ['Weight by the mix', 'L11 s9'], ['Add up', 'L11 s9'], ['Throughput', 'L12 s16'], ['Compare with single-cycle', 'L12 s16']],
  { check: 'The weights add to 1: 0.35 + 0.12 + 0.35 + 0.18 = 1 ✓.' });
name('multi', 'l12s16', [['Single-cycle clock', 'L12 s16'], ['Multi-cycle clock', 'L12 s16'], ['Weighted time per instruction', 'L12 s16']]);
name('multi', 'r1s18', [['Single-cycle', 'L10 s14'], ['Multi-cycle', 'L11 s8']]);

name('pipe', 'ps2q5c', [['Clock = slowest stage', 'L12 s17'], ['Throughput = one per cycle', 'L12 s9'], ['Compare the three designs', 'R1 s22']]);
name('pipe', 'ps2q6b', [['Clock = slowest stage', 'L12 s17'], ['Throughput', 'L12 s9']], { check: R`\(1 / 210\ \text{ps} = 1/(2.1 \times 10^{-10}) \approx 4.76 \times 10^9\) per second ✓.` });
name('pipe', 'l11s13', [['One after another', 'L11 s13'], ['Overlapped', 'L11 s13']], { check: R`\(k + N - 1 = 4 + 4 - 1 = 7\) ✓.` });
name('pipe', 'l12s18', [['Non-pipelined throughput', 'L12 s16'], ['Pipelined throughput', 'L12 s17'], ['Ratio', 'L12 s18'], ['Latency of one instruction', 'L12 s18']]);
name('pipe', 'l13s6', [['lw: one stage per cycle', 'L13 s6'], ['sub: one cycle behind', 'L13 s6'], ['Every instruction uses every stage', 'L13 s4']]);

name('hazards', 'l14cpi', [['CPI = (N + S) ÷ N', 'L14 s7']], { check: R`\(1 + 20/100 = 1.2\) ✓.` });
name('hazards', 'ptq5', [['CPI of P1', 'L14 s7'], ['CPI of P2', 'L14 s7'], ['Time on each (iron law)', 'L15 s14'], ['Ratio slow ÷ fast', 'L15 s14'], ['Percentage difference', 'L15 s14']], { check: R`Same clock, so the time ratio equals the CPI ratio: \(1.8 / 1.5 = 1.2\) ✓.` });
name('hazards', 'ps3q3ac', [['P1 has no stalls', 'L14 s7'], ['Data-hazard term', 'L15 s14'], ['Branch term: predict not taken', 'L15 s14'], ['Add up for P2', 'L14 s7'], ['Branch term: predict taken', 'L15 s14'], ['Add the structural term for P3', 'L14 s7']]);
name('hazards', 'ps3q3d', [['Time per instruction on each', 'L03 s14'], ['Name the fastest', 'L03 s7'], ['Percentage vs P2', 'L03 s9'], ['Percentage vs P1', 'L03 s9'], ['As speedups', 'L03 s7']]);
name('hazards', 'ps3q3e', [['Steady state needs no stalls', 'L12 s9'], ['CPI with “always taken”', 'L14 s7'], ['Compare and recommend', 'L14 s7']]);

name('datahaz', 'ps3q2a', [['List writes and reads', 'L15 s11'], ['Find RAW', 'L15 s8'], ['Find WAR', 'L15 s9'], ['Find WAW', 'L15 s10']]);
name('datahaz', 'ptq4i', [['List what each writes', 'L15 s11'], ['List what each reads', 'L15 s11'], ['Find RAW', 'L15 s8'], ['Find WAR', 'L15 s9'], ['Find WAW', 'L15 s10']]);
name('datahaz', 'l15s11', [['Find the writer and the readers', 'L15 s11'], ['Which read too early', 'L15 s11'], ['Which read in time', 'L15 s11'], ['Rule out WAR and WAW', 'L15 s11']]);
name('datahaz', 'l15s14', [['Average stall per instruction', 'L15 s14'], ['Add to the ideal CPI', 'L15 s14']], { check: R`Per 5 instructions: 5 + 2 = 7 cycles, \(7/5 = 1.4\) ✓.` });

name('forward', 'l16s7', [['CPI of P2', 'L16 s7'], ['Clock period of P2', 'L16 s7'], ['Time ratio (IC cancels)', 'L16 s7'], ['Turn it into “n times faster”', 'L16 s7']], { check: R`\(1.4 / 1.05 = 1.333\): P2 takes a third longer ✓.` });
name('forward', 'ps3q4', [['Find the RAW and its distance', 'L16 s5'], ['Stalls without forwarding', 'L16 s6'], ['Stalls with forwarding (load-use)', 'L16 s13'], ['Reorder an independent instruction', 'R1 s29'], ['Recount', 'L16 s13']]);
name('forward', 'ptq4ii', [['WAR never stalls in order', 'L16 s9'], ['I1 → I3 at distance 2', 'L16 s11'], ['I1 → I2: load-use', 'L16 s11'], ['I4 → I5: load-use', 'L16 s11']]);
name('forward', 'ptq4iii', [['Find the load-use pairs', 'L16 s11'], ['Move the independent load up', 'L16 s8'], ['Recount the distances', 'L16 s13'], ['Check every dependency order', 'R1 s29']]);
name('forward', 'r1s29', [['Find the RAW', 'R1 s29'], ['Count the stalls', 'L16 s13'], ['Find an independent instruction', 'R1 s29'], ['Recount', 'R1 s29']]);
  }

  // --- zz-zformat ---
  {
  const Qd = (t, id) => { const q = (qMap[t] || []).find(x => x.id === id); if (!q) throw new Error('format: no ' + t + '/' + id); return q; };
  const set = (t, id, o) => Object.assign(Qd(t, id), o);

  set('isa1', 'ps1q6a', { ans: CODE([['lw  $t0, 8($s2)', '$t0 = B[2]'], ['lw  $t1, 16($s1)', '$t1 = A[4]'], ['sub $t1, $s0, $t1', '$t1 = h - A[4]'], ['add $t0, $t0, $t1', '$t0 = B[2] + (h - A[4])'], ['sw  $t0, 24($s2)', 'B[6] = $t0']]) });
  set('isa1', 'ptq3', { ans: CODE([['lw  $t0, 8($s1)', '$t0 = A[2]'], ['lw  $t1, 32($s2)', '$t1 = B[8]'], ['sub $t2, $s0, $t0', '$t2 = f - A[2]'], ['add $t3, $t1, $t2', '$t3 = B[8] + f - A[2]'], ['sw  $t3, 16($s1)', 'A[4] = $t3']]) });
  set('isa1', 'ai-a3', { ans: CODE(['lw  $t0, 20($s3)', 'sub $t0, $t0, $s2', 'sw  $t0, 12($s3)']) });
  set('isa1', 'lad-ld', { ans: CODE([['lw  $t0, 12($s3)', '$t0 = A[3]'], ['add $s1, $s2, $t0', 'g = h + A[3]']]) });
  const q7 = Qd('isa2', 'ps1q7'); q7.steps[5][0] = CODE([['addi $t0, $t0, 100', 'sum + 100'], ['add  $v0, $t0, $zero', 'return it in $v0']]);
  set('translate', 'l07s4', { ans: '<p><code>move $t0, $t1</code> becomes:</p>' + CODE(['add $t0, $zero, $t1']) + '<p><code>blt $t0, $t1, L</code> becomes:</p>' + CODE([['slt $at, $t0, $t1', '$at = 1 if $t0 < $t1'], ['bne $at, $zero, L', 'branch if $at is not 0']]) });
  set('translate', 'lad-li', { ans: CODE([['lui $t0, 0x1234', 'upper 16 bits (lower half becomes 0)'], ['ori $t0, $t0, 0x5678', 'OR in the lower 16 bits']]) });
  set('translate', 'w-order', { q: '<p>Someone rewrites the end of <code>swap</code> with the two stores swapped round:</p>' + CODE(['lw $t0, 0($t1)', 'lw $t2, 4($t1)', 'sw $t0, 4($t1)', 'sw $t2, 0($t1)']) + '<p>Does it still swap correctly? What order of the four instructions <b>would</b> break it?</p>',
    ans: 'Yes — both values are in registers before either store, so the stores can go in either order. It breaks if a store to <code>4($t1)</code> happens before <code>lw $t2, 4($t1)</code>: the load would then read the value that was just overwritten.' });
  set('datahaz', 'lad-d2', { q: CODE(['add $t0, $t1, $t2', 'sub $t3, $t0, $t4', 'and $t5, $t0, $t6']) + '<p>How many stalls in total without forwarding?</p>' });
  set('datahaz', 'lad-d3', { q: '<p>List every dependency:</p>' + CODE([['lw  $t1, 0($t0)', 'I1'], ['add $t2, $t1, $t3', 'I2'], ['sub $t1, $t4, $t5', 'I3']]) });
  set('datahaz', 'w-err', { q: '<p>A student’s table for</p>' + CODE([['sw  $t1, 0($t5)', 'I1'], ['add $t1, $t2, $t3', 'I2']]) + '<p>says "WAW on $t1 (I1, I2)". Correct it.</p>' });
  set('forward', 'ptq4ii', { q: '<p>For the Practice Test Q4 sequence</p>' + CODE([['lw  $t5, -16($t4)', 'I1'], ['sw  $t1, -12($t5)', 'I2'], ['add $t4, $t5, $t1', 'I3'], ['lw  $t3, -12($s1)', 'I4'], ['sub $t2, $t3, $t1', 'I5']]) + '<p>P1 gets forwarding from EX to MEM and from MEM to EX. Can forwarding eliminate all stalls? If not, which dependencies still stall at least one cycle, and why?</p>' });
  set('forward', 'ptq4iii', { ans: '<p>For example I1, I4, I2, I5, I3 — 0 stalls with forwarding:</p>' + CODE([['lw  $t5, -16($t4)', 'I1'], ['lw  $t3, -12($s1)', 'I4'], ['sw  $t1, -12($t5)', 'I2'], ['sub $t2, $t3, $t1', 'I5'], ['add $t4, $t5, $t1', 'I3']]) });
  set('forward', 'r1s29', { q: '<p>Loop body:</p>' + CODE(['lw   $t0, 0($s1)', 'addu $t0, $t0, $s2', 'sw   $t2, 0($s1)', 'addi $s1, $s1, -4']) + '<p>How many stalls without forwarding, with forwarding, and how can you eliminate them?</p>' });
  set('forward', 'ai-re', { ans: '<p>0 stalls:</p>' + CODE(['lw  $t1, 0($a0)', 'lw  $t2, 4($a0)', 'lw  $t4, 8($a0)', 'add $t3, $t1, $t2', 'sw  $t3, 12($a0)', 'add $t5, $t4, $t4']) });
  set('ilp', 'i-rename', { q: CODE([['lw   $t0, 0($s1)', 'I1'], ['addu $t0, $t0, $s2', 'I2'], ['sw   $t0, 0($s1)', 'I3'], ['lw   $t0, 4($s1)', 'I4']]) + '<p>Which dependences can renaming remove so I4 can start early?</p>' });

  }

  // --- zz-context ---
  {
    const Qd = (t, id) => { const q = (qMap[t] || []).find(x => x.id === id); if (!q) throw new Error('context: no ' + t + '/' + id); return q; };
  const set = (t, id, o) => Object.assign(Qd(t, id), o);
  const add = (t, o) => { qMap[t].push(Object.assign({ kind: 'off' }, o)); };

  /* ---- shared contexts ---- */
  const P123 = 'Three processors P1, P2 and P3 execute the same program of 100 instructions. P1 has a 2 GHz clock rate and a CPI of 2. P2 has a 300 MHz clock rate and a CPI of 3. P3 has a 2 ns cycle time.';
  const ROUT = TBL(['Routine A', 'Routine B', 'Routine C', 'Routine D', 'Routine E'], [['20 s', '60 s', '10 s', '90 s', '5 s']]);
  const MIX5 = TBL(['', 'Load', 'Store', 'Arithmetic', 'Branch'], [['Distribution', '35%', '12%', '35%', '18%'], ['IF', '2 ns', '2 ns', '2 ns', '2 ns'], ['ID', '2 ns', '2 ns', '2 ns', '2 ns'], ['EX', '2 ns', '4 ns', '6 ns', '2 ns'], ['MEM', '2 ns', '5 ns', 'X', 'X'], ['WB', '4 ns', 'X', '4 ns', 'X']]) + '<p>(X = the stage is not accessed.)</p>';
  const SCEN3 = '<p>A program has 100 instructions. 25% of them are data dependent, resulting in data hazards (a two-cycle stall each). 35% suffer structural hazards (a one-cycle stall each). A further 25% of the instructions are branches, to which branch prediction is applied: on average 60% of branches are taken; a correct guess costs no penalty and an incorrect guess costs 2 cycles. The program runs on three pipelined processors: <b>P1</b> resolves all hazards, <b>P2</b> resolves only the structural hazards, and <b>P3</b> leaves all hazards unresolved. Unless stated otherwise the CPI of an ideal processor without hazards is 1.</p>';
  const PT4 = CODE([['lw  $t5, -16($t4)', 'I1'], ['sw  $t1, -12($t5)', 'I2'], ['add $t4, $t5, $t1', 'I3'], ['lw  $t3, -12($s1)', 'I4'], ['sub $t2, $t3, $t1', 'I5']]);
  const PT6 = CODE([['I1 lw   $t5, 16($s1)', ''], ['I2 add  $t2, $t5, $t3', ''], ['I3 mult $t2, $t1, $t4', ''], ['I4 sub  $t2, $t5, $t2', ''], ['I5 sw   $t4, 24($s3)', '']].map(r => r[0]));

  /* ---- Practice Set 1 ---- */
  set('cpuperf', 'ps1q2a', { q: '<p>' + P123 + '</p><p>(a) Calculate the execution time of the program on P1 and P2 in seconds, and say which processor is faster.</p>' });
  set('cpuperf', 'ps1q2b', { q: '<p>' + P123 + '</p><p>(b) The program is found to run two times slower on P3 than on P2. Calculate the CPI of P3.</p>' });
  set('cpuperf', 'ps1q2c', { q: '<p>' + P123 + '</p><p>(c) Find the increase in the execution time of P1 if the number of instructions in the program is increased by 50% (without affecting the CPI).</p>' });
  set('amdahl', 'ps1q4b', { q: '<p>A program made of floating-point (FP), load/store (L/S) and integer (INT) instructions takes 1000 s on processor P1. The FP instructions take 30% of the total execution time and the L/S instructions take 45%; the rest is INT.</p><p>(b) By how much does the total time change (increase or reduce) if the time spent on FP operations is reduced by 40% and the time for INT instructions is increased by 20%?</p>' });
  set('amdahl', 'ps1q5a', { q: '<p>The table shows the execution time of the five routines that make up a program (total 185 s).</p>' + ROUT + '<p>(a) A micro-architectural change reduces the execution time of routine D by 40%. Using Amdahl’s law, calculate the overall speedup achieved and the new total execution time.</p>' });
  set('amdahl', 'ps1q5b', { q: '<p>The table shows the execution time of the five routines that make up a program (total 185 s).</p>' + ROUT + '<p>(b) You can apply a micro-architectural change that speeds up either (i) routine B by 20% or (ii) routine A by 30%. Say which option you would choose, and use Amdahl’s law to calculate the overall speedup and new execution time in both cases.</p>' });

  /* ---- Practice Set 2 ---- */
  set('binary', 'ps2q4b', { q: '<p>The 32-bit registers <code>$s0</code> and <code>$s1</code> hold <code>0x82A00000</code> and <code>0xDA600000</code> respectively. What is the value of <code>$t0</code> after</p>' + CODE(['sub $t0, $s1, $s0']) });
  set('multi', 'ps2q5a', { q: '<p>Instruction classes, their distribution in the program, and their latency in each pipeline stage:</p>' + MIX5 + '<p>(a) If the architect implements a <b>single-cycle</b> datapath, what is (i) the cycle time and (ii) the throughput (instructions per second) for this program?</p>' });
  set('multi', 'ps2q5b', { q: '<p>Instruction classes, their distribution in the program, and their latency in each pipeline stage:</p>' + MIX5 + '<p>(b) If the architect implements a <b>multi-cycle</b> datapath: (i) what is the cycle time for this program? (ii) Using the instruction distribution, find the average latency and then the throughput. Is the multi-cycle datapath faster than the single-cycle datapath for this program?</p>' });
  set('pipe', 'ps2q5c', { q: '<p>Instruction classes, their distribution in the program, and their latency in each pipeline stage:</p>' + MIX5 + '<p>(c) If the architect pipelines the machine into 5 stages, what are the clock cycle and the throughput for this program? (Assume there are no pipeline stalls at all.)</p>' });
  set('pipe', 'ps2q6b', { q: '<p>You build a processor from hardware resources with these worst-case timings: instruction memory read 160 ps; data memory (read or write) 210 ps; ALU (multiplier/adder) 170 ps; register file (read or write) 50 ps; other combinational logic 0 ps.</p><p>(b) If the machine is pipelined, what is the clock cycle time? Also determine the throughput of an ideal pipeline (neglecting dependencies and any delay overhead due to pipeline registers).</p>' });
  set('single', 'ps2q6a', { q: '<p>You build a processor from hardware resources with these worst-case timings: instruction memory read 160 ps; data memory (read or write) 210 ps; ALU (multiplier/adder) 170 ps; register file (read or write) 50 ps; other combinational logic 0 ps.</p><p>(a) Fill in the time each instruction class (load, store, R-format, branch) spends in each of the five steps IF, ID, EX, MEM, WB, and its total time. If an instruction does not need a particular unit in a step, put 0 ps.</p>' + TBL(['Class', 'IF', 'ID', 'EX', 'MEM', 'WB', 'Total'], [['Load', '', '', '', '', '', ''], ['Store', '', '', '', '', '', ''], ['R-format', '', '', '', '', '', ''], ['Branch', '', '', '', '', '', '']]) });

  /* ---- Practice Set 3 ---- */
  set('datahaz', 'ps3q2b', { q: '<p>Format: <code>op destination, source1, source2</code>.</p>' + CODE(['I1: Mult R1, R2, R3', 'I2: Div  R3, R1, R5', 'I3: Add  R2, R3, R4', 'I4: Div  R4, R7, R6', 'I5: Add  R4, R8, R5']) + '<p>(b) For each type of dependency (RAW, WAR and WAW) select a set of instructions from this sequence and briefly explain the issue each dependency could cause in a pipelined processor. Use the registers of the instructions in your explanation.</p>' });
  set('hazards', 'ps3q3ac', { q: SCEN3 + '<p>(a) What is the CPI of P1? (b) What is the CPI of P2? Consider two branch-prediction policies and give the CPI for both: (i) the processor predicts every branch is <b>not taken</b>; (ii) the processor predicts every branch is <b>taken</b>. (c) What is the CPI of P3, if it predicts every branch is not taken?</p>' });
  set('hazards', 'ps3q3d', { q: SCEN3 + '<p>(d) The clock rates are: P1 0.9 GHz, P2 1.2 GHz, P3 2.2 GHz, and the branch predictors of P2 and P3 predict that every branch is <b>not taken</b>. Which processor is the fastest, and by how much? Compare the execution times as percentages.</p>' });
  set('hazards', 'ps3q3e', { q: SCEN3 + '<p>(e) You are hired as a consultant for a research lab that wants to buy a processor that offers a steady-state pipeline at all times for its program. (i) Which of P1, P2 and P3 do you recommend, and why? (ii) If you were to recommend P3, would you have it predict branches as always not taken or always taken?</p>' });

  /* ---- Practice Test ---- */
  set('single', 'ptq6ii', { q: '<p>Consider this 5-instruction sequence on a single-cycle processor P1 built from: instruction memory 50 ps; data memory 100 ps; multiplier (in ALU) 250 ps; adder (in ALU) for address calculation 100 ps; adder (in ALU) for addition/subtraction 150 ps; register file (read or write) 50 ps; other combinational logic 0 ps.</p>' + PT6 + '<p>Calculate the total execution time of the instruction sequence on P1. Show your calculations.</p>' });
  set('forward', 'ptq4iii', { q: '<p>A single-issue, in-order, 5-stage MIPS processor P1 has data forwarding (EX to MEM and MEM to EX). It executes:</p>' + PT4 + '<p>(a) Show at least one reordering of the sequence that eliminates the stalls due to data hazards. (b) Explain how your reordering helps minimise the stalls.</p>' });
  set('forward', 'ptq4ii', { q: '<p>A single-issue, in-order, 5-stage MIPS processor P1 executes:</p>' + PT4 + '<p>P1 is enhanced with data forwarding from the EX stage to the MEM stage and from the MEM stage to the EX stage. Can forwarding eliminate all stalls caused by the dependencies of this sequence? If not, for which dependencies must the processor still stall at least one cycle even with forwarding? Explain clearly, naming the registers and the operations/stages that must wait.</p>' });

  /* ---- Lecture examples with their givens spelt out ---- */
  set('cpuperf', 'l03s18', { q: '<p>Machine A has a clock cycle time of 1 ns; machine B has a clock cycle time of 2 ns and a CPI of 1.2. They run the same program (same instruction count). For the two machines to have equal performance, what must the CPI of A be?</p>' });
  set('cpuperf', 'l03s19', { q: '<p>Machine A has CPI 2.0 and machine B has CPI 1.2; B’s clock cycle time is 2 ns. They run the same program (same instruction count). For equal performance, what must A’s clock cycle time be?</p>' });
  set('isa2', 'l06s15', { q: '<p>The registers hold <code>$t2 = 0000 0000 0000 0000 0000 1101 1100 0000</code> and <code>$t1 = 0000 0000 0000 0000 0011 1100 0000 0000</code>. What is <code>$t0</code> after</p>' + CODE(['or $t0, $t1, $t2']) });
  set('multi', 'l12s16', { q: '<p>Stage latencies and instruction mix:</p>' + TBL(['Class', 'IF', 'ID', 'EX', 'MEM', 'WB', 'Total', 'Mix'], [['Load', '200', '100', '200', '200', '100', '800 ps', '30%'], ['Store', '200', '100', '200', '200', 'X', '700 ps', '30%'], ['R-format', '200', '100', '200', 'X', '100', '600 ps', '20%'], ['Branch', '200', '100', '200', 'X', 'X', '500 ps', '20%']]) + '<p>(All times in ps; X = stage not used.) Find (i) the clock cycle of a single-cycle machine, (ii) the clock cycle of a multi-cycle machine, and (iii) the average time per instruction on the multi-cycle machine (a load takes 5 cycles, a store 4, an R-format 4 and a branch 3).</p>' });

  /* ================= NEW official questions ================= */
  add('control', { id: 'ps3q1c', src: 'Practice Set 3, Q1c', diff: 'M', taught: 'R1 s24; R1 s30',
    q: '<p>In under about 50 words: explain <b>one</b> method for reducing the mis-prediction penalty, and <b>one</b> method for reducing the probability of wrong guesses, in the case of control hazards in a pipelined processor.</p>',
    ans: '<p><b>Reduce the penalty:</b> resolve the branch condition (and target) early, in the ID stage, so fewer wrongly fetched instructions have to be flushed.</p><p><b>Reduce wrong guesses:</b> use dynamic branch prediction — a branch target buffer plus a history (e.g. 1-bit) predictor that remembers whether each branch was taken last time.</p>',
    steps: [['Control hazard', 'The next instruction to fetch depends on a branch whose outcome is not known yet, so the pipeline guesses.'], ['Cheaper mistakes: resolve the branch early in ID', 'A comparator and adder in ID decide the branch one stage sooner, cutting the penalty from the EX/MEM-stage cost to a single wasted fetch.'], ['Fewer mistakes: dynamic prediction', 'A Branch Target Buffer stores previous targets and a 1-bit (or 2-bit) predictor stores each branch’s history, so the guess adapts to program behaviour.']],
    official: 'Implement a dynamic branch prediction method such as the Branch Target Buffer (BTB) and the 1-bit predictor that keeps track of the history of the branches (taken / not taken) by storing the target address from previous instances and allowing the PC to access them, increasing the probability of not making a wrong guess through the dynamic adaptation to the program behaviour. (R1 s30: resolve the branch condition early in the ID stage to limit the misprediction penalty; use a Branch Target Buffer to reduce wrong guesses.)' });

  add('isa1', { id: 'l05s12', src: 'Lecture example, L05 s12', diff: 'E', taught: 'L05 s12',
    q: '<p>Compile the C statement <code>f = (g + h) - (i + j);</code> into MIPS. The variables f, g, h, i and j are in <code>$s0</code>, <code>$s1</code>, <code>$s2</code>, <code>$s3</code> and <code>$s4</code>; use <code>$t0</code> and <code>$t1</code> as temporaries.</p>',
    ans: CODE([['add $t0, $s1, $s2', '$t0 = g + h'], ['add $t1, $s3, $s4', '$t1 = i + j'], ['sub $s0, $t0, $t1', 'f = $t0 - $t1']]),
    steps: [['<code>add $t0, $s1, $s2</code>', 'g + h goes into a temporary — MIPS adds only two operands at a time.', 'Add the first pair'], ['<code>add $t1, $s3, $s4</code>', 'i + j into a second temporary.', 'Add the second pair'], ['<code>sub $s0, $t0, $t1</code>', 'Subtract and put the result directly in f’s register $s0.', 'Subtract into f']],
    official: '$t0 and $t1 are temps, $s0 is f, $s1 is g, $s2 is h, $s3 is i and $s4 is j: add $t0,$s1,$s2 / add $t1,$s3,$s4 / sub $s0,$t0,$t1' });

  add('isa1', { id: 'l05s18', src: 'Lecture example, L05 s18', diff: 'E', taught: 'L05 s18',
    q: '<p>Compile <code>g = h + A[8];</code> into MIPS. g is in <code>$s1</code>, h is in <code>$s2</code>, and the base address of array A is in <code>$s3</code> (each element is a 4-byte word).</p>',
    ans: CODE([['lw  $t0, 32($s3)', '$t0 = A[8]'], ['add $s1, $s2, $t0', 'g = h + A[8]']]),
    steps: [['\\text{offset} = 8 \\times 4 = 32', 'Index 8 needs a byte offset of 32 because each word is 4 bytes.', 'Work out the offset'], ['<code>lw $t0, 32($s3)</code>', 'Load A[8] from base + offset into a temporary.', 'Load A[8]'], ['<code>add $s1, $s2, $t0</code>', 'Add h and A[8], result into g.', 'Add']],
    official: 'Index 8 requires offset of 32 (4 bytes per word): lw $t0, 32($s3) # load word ; add $s1, $s2, $t0' });

  add('isa2', { id: 'l06s19', src: 'Lecture example, L06 s19–s20', diff: 'M', taught: 'L06 s19–s20',
    q: '<p>Compile this leaf procedure into MIPS. Arguments g, h, i, j arrive in <code>$a0</code>–<code>$a3</code>; f lives in <code>$s0</code> (so <code>$s0</code> must be saved on the stack); the result is returned in <code>$v0</code>.</p><pre class="code nomath">int leaf_example (int g, h, i, j)\n{ int f;\n  f = (g + h) - (i + j);\n  return f;\n}</pre>',
    ans: CODE([['leaf_example:', ''], ['addi $sp, $sp, -4', 'make room on the stack'], ['sw   $s0, 0($sp)', 'save $s0'], ['add  $t0, $a0, $a1', 'g + h'], ['add  $t1, $a2, $a3', 'i + j'], ['sub  $s0, $t0, $t1', 'f = (g+h) - (i+j)'], ['add  $v0, $s0, $zero', 'return value in $v0'], ['lw   $s0, 0($sp)', 'restore $s0'], ['addi $sp, $sp, 4', 'pop the stack'], ['jr   $ra', 'return to caller']].map(r => r[1] ? r : r[0])),
    steps: [['<code>addi $sp, $sp, -4</code> ; <code>sw $s0, 0($sp)</code>', '$s0 is a saved register, so the callee must preserve it: push it on the stack.', 'Save $s0 on the stack'], ['<code>add $t0,$a0,$a1</code> ; <code>add $t1,$a2,$a3</code> ; <code>sub $s0,$t0,$t1</code>', 'The body: two sums into temporaries (which need no saving), then the difference into f.', 'Procedure body'], ['<code>add $v0, $s0, $zero</code>', 'Copy f into the return register.', 'Result'], ['<code>lw $s0, 0($sp)</code> ; <code>addi $sp, $sp, 4</code>', 'Restore $s0 and pop the stack.', 'Restore $s0'], ['<code>jr $ra</code>', 'Jump back to the caller.', 'Return']],
    official: 'leaf_example: addi $sp,$sp,-4 / sw $s0,0($sp) / add $t0,$a0,$a1 / add $t1,$a2,$a3 / sub $s0,$t0,$t1 / add $v0,$s0,$zero / lw $s0,0($sp) / addi $sp,$sp,4 / jr $ra (textbook pp. 97–100)' });

  add('translate', { id: 'l07s9', src: 'Lecture example, L07 s9–s10', diff: 'M', taught: 'L07 s9–s10',
    q: '<p>Compile this leaf procedure into MIPS. The array base address v is in <code>$a0</code>, k is in <code>$a1</code>, and temp is in <code>$t0</code>.</p><pre class="code nomath">void swap(int v[], int k)\n{ int temp;\n  temp = v[k];\n  v[k] = v[k+1];\n  v[k+1] = temp;\n}</pre>',
    ans: CODE([['swap: sll $t1, $a1, 2', '$t1 = k * 4'], ['add $t1, $a0, $t1', '$t1 = v + k*4 = address of v[k]'], ['lw  $t0, 0($t1)', 'temp = v[k]'], ['lw  $t2, 4($t1)', '$t2 = v[k+1]'], ['sw  $t2, 0($t1)', 'v[k] = $t2'], ['sw  $t0, 4($t1)', 'v[k+1] = temp'], ['jr  $ra', 'return']]),
    steps: [['<code>sll $t1,$a1,2</code> ; <code>add $t1,$a0,$t1</code>', 'Shifting left 2 multiplies k by 4 (bytes per word); adding the base gives the address of v[k].', 'Compute the address of v[k]'], ['<code>lw $t0,0($t1)</code> ; <code>lw $t2,4($t1)</code>', 'Load both values into registers first: v[k] into temp, v[k+1] into $t2.', 'Load both elements'], ['<code>sw $t2,0($t1)</code> ; <code>sw $t0,4($t1)</code>', 'Store them back crosswise.', 'Store them swapped'], ['<code>jr $ra</code>', 'Leaf procedure: just return.', 'Return']],
    official: 'sll $t1,$a1,2 # $t1 = k*4 ; add $t1,$a0,$t1 # $t1 = v+(k*4), address of v[k] ; lw $t0,0($t1) # temp = v[k] ; lw $t2,4($t1) # $t2 = v[k+1] ; sw $t2,0($t1) # v[k] = $t2 ; sw $t0,4($t1) # v[k+1] = temp' });

  add('uarch', { id: 'l10s7', src: 'Lecture example, L10 s7', diff: 'E', taught: 'L10 s7; L09 s26–s27',
    q: '<p>For the store instruction <code>sw R6, X(R8)</code> (memory[X + [R8]] ← [R6]) in the 5-step instruction flow, say what happens in Fetch, Decode, Execute, Memory Access and Write-back. Which are the source and destination registers?</p>',
    ans: '<p>Source registers R6 and R8; no destination register.</p><p><b>IF:</b> fetch the instruction, PC + 4. <b>ID:</b> decode, read R6 and R8. <b>EX:</b> compute the effective address X + [R8]. <b>MEM:</b> write [R6] to memory at X + [R8]. <b>WB:</b> no action.</p>',
    steps: [['\\text{IF}', 'Fetch the instruction and increment the program counter.'], ['\\text{ID}', 'Decode it as a store; read the contents of R6 (data) and R8 (base).'], ['\\text{EX}', 'ALU adds the immediate X to [R8]: the effective address.'], ['\\text{MEM}', 'Store the contents of R6 into memory location X + [R8].'], ['\\text{WB}', 'No action — a store writes memory, not a register.']],
    official: 'Source registers: R6, R8; destination register: none. Fetch; Decode (read R6 and R8); Execute: effective address X + [R8]; Memory access: store R6 at X + [R8]; Writeback: no action.' });

  add('datahaz', { id: 'l15s4', src: 'Lecture example, L15 s4', diff: 'M', taught: 'L15 s4; L15 s11',
    q: '<p>A 5-stage MIPS pipeline (IF, ID, EX, MEM, WB) has no forwarding. The register file is written in the first half of a clock cycle and read in the second half. Register <code>$2</code> holds 10 before the sequence starts.</p>' + CODE(['sub $2, $1, $3', 'and $12, $2, $5', 'or  $13, $6, $2', 'add $14, $2, $2', 'sw  $15, 100($2)']) + '<p>The instructions enter the pipeline one per cycle with no stalls (sub fetched in cycle 1). Which of the four later instructions read the <i>old</i> value of <code>$2</code> (10) rather than the new value written by <code>sub</code>?</p>',
    ans: '<code>and</code> and <code>or</code> read the stale value; <code>add</code> and <code>sw</code> are fine.',
    steps: [['\\text{sub: IF1 ID2 EX3 MEM4 WB5}', 'sub writes $2 in its WB stage, cycle 5 (first half).'], ['\\text{and: ID in cycle 3}', 'Reads $2 in cycle 3 — before cycle 5: old value 10. RAW hazard.'], ['\\text{or: ID in cycle 4}', 'Reads in cycle 4 — still before the write: old value. RAW hazard.'], ['\\text{add: ID in cycle 5}', 'Write happens in the first half of cycle 5, read in the second: new value. No hazard.'], ['\\text{sw: ID in cycle 6}', 'Reads after the write: new value. No hazard.']],
    official: 'Value of register $2 is 10 until the write in CC5 (10/–20); and, or read $2 before it is written (data hazards); add, sw see the new value (L15 s4).' });

  add('amdahl', { id: 'r1s11', src: 'Review slides R1 s11 (L04 s6)', diff: 'E', taught: 'L04 s5–s6; R1 s11',
    q: '<p>Using Amdahl’s law, \\(\\text{Speedup} = \\dfrac{1}{(1-f) + f/s}\\), find the overall speedup when: (i) a fraction f = 95% of the time is sped up by s = 1.10; (ii) f = 5% is sped up by s = 10; (iii) f = 5% is sped up by s = ∞.</p>',
    ans: '(i) 1.094 (ii) 1.047 (iii) 1.052 — making the common case faster wins, and the fraction limits the speedup.',
    steps: [['\\dfrac{1}{0.05 + 0.95/1.10} = \\dfrac{1}{0.9136} \\approx 1.094', '(1 − f) = 0.05; f/s = 0.95/1.10 = 0.8636.', 'Case (i)'], ['\\dfrac{1}{0.95 + 0.05/10} = \\dfrac{1}{0.955} \\approx 1.047', '(1 − f) = 0.95; f/s = 0.005.', 'Case (ii)'], ['\\dfrac{1}{0.95 + 0} \\approx 1.052', 'With s = ∞, f/s = 0: the speedup is capped at 1/(1 − f).', 'Case (iii)']],
    official: 'Examples: f = 95%, s = 1.10 → 1.094; f = 5%, s = 10 → 1.047; f = 5%, s = ∞ → 1.052 (R1 s11)' });

  add('amdahl', { id: 'r1s12', src: 'Review slides R1 s12', diff: 'M', taught: 'R1 s12; L03 s9–s10',
    q: '<p>CPU A runs a program in execA = 10 s. CPU B reduces the execution time of the program by 10% compared with CPU A. (a) What is execB? (b) By what percentage does B’s <i>performance</i> exceed A’s?</p>',
    ans: '(a) execB = 0.9 × 10 = 9 s. (b) performance ratio 10/9 = 1.111, i.e. B’s performance is about 11.1% higher.',
    steps: [['\\text{exec}_B = 0.9 \\times 10 = 9\\ \\text{s}', '"Reduces by 10%" leaves 90% of the time.', 'Execution time'], ['\\dfrac{\\text{Perf}_B}{\\text{Perf}_A} = \\dfrac{\\text{exec}_A}{\\text{exec}_B} = \\dfrac{10}{9} = 1.111', 'Performance is the inverse of time.', 'Performance ratio'], ['1.111 - 1 \\approx 11.1\\%', 'A 10% time reduction is an 11.1% performance gain — the two are not the same.', 'Percentage improvement']],
    official: 'Assume execA = 10 s and the speedup achieved by cpuB is 10%. Then execB = 0.9 × execA = 9 s. (R1 s12 also distinguishes "x% reduction in time" from "x% performance improvement".)' });

  add('datahaz', { id: 'r1s28', src: 'Review slides R1 s28', diff: 'E', taught: 'R1 s28; L15 s14',
    q: '<p>In this course, unless a question says otherwise, what stall penalty is assumed (a) if the dependent instruction follows right after the producer, and (b) if the producer and the dependent instruction are separated by one intermediate instruction? How does the penalty depend on the distance between them?</p>',
    ans: '(a) 2 cycles. (b) 1 cycle. The penalty shrinks as the distance grows; with two or more instructions in between there is no stall.',
    steps: [['\\text{adjacent} \\Rightarrow \\text{penalty } 2', 'The consumer must wait until the producer has written the register in WB.', 'Back-to-back'], ['\\text{one instruction between} \\Rightarrow \\text{penalty } 1', 'The intermediate instruction hides one of the two cycles.', 'One instruction apart'], ['\\text{penalty falls with distance}', 'This assumes the register file can write in the first half and read in the second half of a cycle (the convention depends on the machine).', 'General rule']],
    official: 'If the dependent instruction follows right after the producer, stall the pipe for 2 cycles (penalty = 2). If separated by an intermediate instruction, stall penalty = 1. Stall penalty depends upon the distance between producer and dependent instruction.' });

  add('hazards', { id: 'r1s30', src: 'Review slides R1 s30', diff: 'E', taught: 'R1 s30; L14–L17',
    q: '<p>For each of the three hazard types (structural, data, control), state the basic solution, how the performance cost can be minimised, and the technique used.</p>',
    ans: TBL(['Hazard', 'Solution', 'Minimise the performance cost'], [['Structural', 'Stall', 'Replicate resources'], ['Data', 'Stall', 'Data forwarding; instruction reordering'], ['Control', 'Stall', 'Resolve the branch condition early (in ID) to limit the misprediction penalty; a Branch Target Buffer to reduce wrong guesses']]),
    steps: [['\\text{Structural: stall; replicate resources}', 'Separate instruction and data memory, separate adders for PC + 4 and the ALU.'], ['\\text{Data: stall; forwarding and reordering}', 'Forward results from EX/MEM stages; move independent instructions between producer and consumer.'], ['\\text{Control: stall; early resolve and BTB}', 'Compare in ID; use a Branch Target Buffer and predictor so guesses are right more often.']],
    official: 'Hazards Summary (R1 s30): Structural — Stall — Replicate Resources. Data — Stall — Data Forwarding / Instruction Reordering. Control — Stall — Resolve branch condition early in ID for limiting misprediction penalty; implement Branch Target Buffer for reducing wrong guesses.' });

  }
}
