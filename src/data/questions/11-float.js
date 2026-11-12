import { R, Q } from '../../utils/dsl.js';

export const id = 'float';
export default [
    Q({ id: 'ai-f1', kind: 'ai', diff: 'E', taught: 'L08 s14–s15', q: '<p>Give the number of bits in the sign, exponent and fraction fields and the bias for IEEE 754 single and double precision.</p>', ans: 'Single: 1, 8, 23, bias 127. Double: 1, 11, 52, bias 1023.',
      steps: [['Single: 1 + 8 + 23 = 32 bits, bias 127.', 'L08 s15.'], ['Double: 1 + 11 + 52 = 64 bits, bias 1023.', 'L08 s15 (shown as 20 + 32 fraction bits across two words).']] }),
    Q({ id: 'ai-f2', kind: 'ai', diff: 'M', taught: 'L08 s15', q: '<p>Decode the single-precision value 0x40490000.</p>', ans: '3.140625',
      steps: [['0x40490000 = 0 10000000 10010010000000000000000', 'Hex → binary, then split 1 | 8 | 23.'], [R`S = 0;\ \text{exponent} = 128 \Rightarrow 128 - 127 = 1`, 'Positive; true exponent 1.'], [R`\text{fraction} = 2^{-1} + 2^{-4} + 2^{-7} = 0.5 + 0.0625 + 0.0078125 = 0.5703125`, 'Fraction bits 1, 4 and 7 (after the point) are set.'], [R`(1 + 0.5703125) \times 2^1 = 1.5703125 \times 2 = 3.140625`, 'Add the hidden 1 and multiply by 2¹.']] }),
    Q({ id: 'ai-f3', kind: 'ai', diff: 'M', taught: 'L08 s15; P&H §3.5', q: '<p>Encode −12.375 in IEEE 754 single precision (give hex).</p>', ans: '0xC1460000',
      steps: [[R`12 = 1100_2,\ \ 0.375 = 0.25 + 0.125 = 0.011_2`, '0.375×2 = 0.75 → 0; 0.75×2 = 1.5 → 1; 0.5×2 = 1.0 → 1.'], [R`12.375 = 1100.011_2 = 1.100011_2 \times 2^{3}`, 'Normalise: move the point 3 places left.'], [R`\text{exponent} = 3 + 127 = 130 = 10000010_2`, 'Add the bias.'], ['fraction = 100011 followed by 17 zeros; sign = 1', 'Negative.'], [R`1\ 10000010\ 10001100000000000000000 = \texttt{0xC1460000}`, '1100 0001 0100 0110 0000 … → C 1 4 6 0 0 0 0.']] }),
    Q({ id: 'ai-f4', kind: 'ai', diff: 'E', taught: 'L08 s16', q: '<p>What results from (a) a positive number divided by zero and (b) zero divided by zero in IEEE 754?</p>', ans: '(a) +∞ (infinity) (b) NaN',
      steps: [['Positive ÷ 0 → infinity.', 'L08 s16.'], ['0 ÷ 0 → NaN, "not a number".', 'L08 s16.']] }),
    Q({ id: 'ai-f5', kind: 'ai', diff: 'M', taught: 'L08 s14; L08 [44:02]', q: '<p>A designer can move 3 bits from the fraction field into the exponent field of a 32-bit format. What do they gain and lose?</p>', ans: 'Gain range (bigger and smaller exponents); lose precision (fewer significand bits).',
      steps: [['More exponent bits → larger range of magnitudes.', 'L08 s14.'], ['Fewer fraction bits → fewer significant digits, bigger rounding errors.', 'Trade-off: range vs precision.']] }),
    Q({ id: 'w-f1', kind: 'wild', src: 'Wildcard · explain why', diff: 'M', taught: 'L08 s16; P&H §3.5', q: '<p>Why can’t 0.1 be stored exactly in IEEE 754, while 0.75 can?</p>', ans: '0.75 = ½ + ¼ is a finite binary fraction; 0.1 in binary is 0.000110011001100… repeating forever, so it must be rounded to 23 bits.',
      steps: [['0.75 → .11₂ exactly (two doubling steps reach 0).', R`Fraction to binary: double and take the integer part each time. 0.75 × 2 = 1.5 → 1; 0.5 × 2 = 1.0 → 1; the remainder is 0, so stop.`], ['0.1×2 = 0.2 → 0, 0.4 → 0, 0.8 → 0, 1.6 → 1, 1.2 → 1, 0.4 → 0 … repeats.', 'The pattern 0011 repeats forever.'], ['Only 23 fraction bits are stored, so 0.1 is rounded (to 0x3DCCCCCD).', 'Accuracy issue, L08 s16.']] }),
    Q({ id: 'w-f2', kind: 'wild', src: 'Wildcard · work backwards', diff: 'H', taught: 'L08 s15', q: '<p>What is the largest exponent field value that still represents a normal number, and what power of 2 does it give in single precision?</p>', ans: '254 → 2^(254 − 127) = 2^127.',
      steps: [['Field 255 is reserved for ∞ and NaN.', 'P&H §3.5 (background).'], [R`254 - 127 = 127 \Rightarrow 2^{127}`, 'So the largest normal value is just under 2 × 2¹²⁷.']] }),
  ];
