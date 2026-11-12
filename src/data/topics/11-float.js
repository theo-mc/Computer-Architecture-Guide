import { R, B } from '../../utils/dsl.js';

export default {
  id: 'float', num: 11, file: 'floating-point', week: 3, lectures: ['L08'],
  title: 'Floating point and IEEE 754', short: 'Floating point (IEEE 754)',
  keywords: 'floating point ieee 754 single precision sign exponent bias 127 fraction significand normalise',
  taught: 'L08 s14–s16 (Week 3, "a brief look"). Encoding/decoding steps from P&H §3.5.',
  overview: {
    lede: 'How fractions and very large or very small numbers are stored: sign, exponent and fraction fields, the bias, the hidden 1, and the special cases.',
    about: R`<p>Integers can't hold 3.1416, 0.000000001 or \(3.15576\times10^9\). Floating point stores a sign, an exponent and a significand, like scientific notation in base 2. IEEE 754 fixes the layout: single precision uses 1 + 8 + 23 bits, double 1 + 11 + 52. The lecture only gives "a brief look" and there are no official practice questions on it yet, but the formula and field sizes are on the slides.</p>`,
    canDo: ['State the IEEE 754 single and double layouts and biases.', 'Decode a 32-bit pattern into a decimal value, step by step.', 'Encode a simple decimal number into single precision.', 'Explain the range-vs-precision trade-off and the special values (∞, NaN, underflow).'],
    buildsOn: ['binary'],
  },
  notation: [
    ['S', 'Sign bit: 0 positive, 1 negative', '1 bit'],
    ['Exponent', 'Stored (biased) exponent field', '8 bits single, 11 double'],
    ['Fraction', 'Bits after the binary point of the significand', '23 bits single, 52 double'],
    ['Significand', '1 + fraction (the leading 1 is implicit, "hidden")', 'L08 s14'],
    ['Bias', 'Number subtracted from the stored exponent', '127 single, 1023 double'],
    [R`\((-1)^S\)`, '+1 if S = 0, −1 if S = 1', ''],
    ['NaN', 'Not a Number, e.g. 0 ÷ 0', 'L08 s16'],
    ['underflow', 'Result too close to zero to represent normally', 'L08 s16'],
  ],
  steps: [
    { title: 'Why floating point', ref: 'L08 s14', blocks: [
      B.p('S', 'L08 s14', R`<p>We need numbers with fractions (3.1416), very small numbers (.000000001) and very large numbers (\(3.15576\times10^9\)). Representation: <b>sign, exponent, significand</b>:</p>\[(-1)^{\text{sign}} \times \text{significand} \times 2^{\text{exponent}}\]<ul><li>More bits for the significand → more <b>accuracy</b>.</li><li>More bits for the exponent → more <b>range</b>.</li></ul>`),
      B.p('L', 'L08 [44:02]', R`<p>"The more exponent means more range and the more significand means more precision."</p>`),
    ] },
    { title: 'The idea: scientific notation in binary', ref: 'L08 s14', blocks: [
      B.x(R`<p>Scientists write 299 792 458 as \(2.99792458 \times 10^{8}\): one digit before the point, the rest after, and a power of ten saying where the point really goes. That lets one format hold enormous and tiny numbers. Floating point does the same in base 2: every number is written as \(1.\text{something} \times 2^{\text{power}}\), and the computer stores the sign, the power and the “something”.</p>`),
      B.key('Fractions in binary', R`<p>After the binary point the places are worth \(\tfrac12, \tfrac14, \tfrac18, \tfrac1{16} \dots\) So \(0.11_2 = \tfrac12 + \tfrac14 = 0.75\) and \(101.11_2 = 4 + 1 + 0.5 + 0.25 = 5.75\). Some simple decimals, like 0.1, never end in binary (like ⅓ = 0.333… in decimal), so they can only be stored approximately.</p>`),
      B.check(R`<p>Write \(6.5\) in binary, then in the form \(1.\text{xxx} \times 2^{e}\).</p>`, R`<p>6 = 110, 0.5 = .1, so 6.5 = 110.1₂. Move the point two places left: \(1.101_2 \times 2^{2}\).</p>`),
    ] },
    { title: 'IEEE 754 layout', ref: 'L08 s14–s15', blocks: [
      B.dia({ src: 'S', ref: 'L08 s15', ascii: `Single (32 bit):  | S | exponent (8) |        fraction (23)          |
                   31   30......23   22.........................0
value = (-1)^S x (1 + fraction) x 2^(exponent - 127)

Double (64 bit):  | S | exponent (11) | fraction (20) | fraction cont. (32) |
value = (-1)^S x (1 + fraction) x 2^(exponent - 1023)` }),
      B.p('S', 'L08 s14–s15', R`\[\text{single: } (-1)^S \times (1 + \text{fraction}) \times 2^{\,\text{exponent} - 127} \qquad \text{double: } (-1)^S \times (1+\text{fraction}) \times 2^{\,\text{exponent}-1023}\]<p>Single precision: 8-bit exponent, 23-bit fraction. Double: 11-bit exponent, 52-bit fraction. The significand = 1 + fraction is defined implicitly — the leading 1 isn't stored.</p>`),
      B.fx('ieee'),
    ] },
    { title: 'Decoding a bit pattern', ref: 'L08 s15; P&H §3.5', blocks: [
      B.wk({ src: 'T', ref: 'P&H §3.5 example (−0.75)', title: 'Decode 1 01111110 10000000000000000000000 (0xBF400000)', steps: [
        [R`\(S = 1 \Rightarrow \text{negative}\)`, 'First bit.'],
        [R`\(\text{exponent} = 01111110_2 = 64+32+16+8+4+2 = 126\)`, 'Next 8 bits as an unsigned number.'],
        [R`\(126 - 127 = -1\)`, 'Subtract the bias.'],
        [R`\(\text{fraction} = .1000\ldots_2 = 2^{-1} = 0.5\)`, 'First fraction bit is worth ½.'],
        [R`\(\text{significand} = 1 + 0.5 = 1.5\)`, 'Add the hidden 1.'],
        [R`\((-1)^1 \times 1.5 \times 2^{-1} = -1.5 \times 0.5 = -0.75\)`, R`\(2^{-1} = 1/2\).`],
      ], result: '−0.75' }),
    ] },
    { title: 'Encoding a decimal number', ref: 'P&H §3.5', blocks: [
      B.wk({ src: 'T', ref: 'P&H §3.5 method', title: 'Encode 5.75 in single precision', steps: [
        [R`\(5 = 101_2,\ \ 0.75 = 0.5 + 0.25 = 0.11_2 \Rightarrow 5.75 = 101.11_2\)`, 'Integer part by repeated ÷2; fraction part: 0.75×2 = 1.5 → 1, 0.5×2 = 1.0 → 1, done.'],
        [R`\(101.11_2 = 1.0111_2 \times 2^{2}\)`, 'Move the point 2 places left so one 1 is in front of it (normalise).'],
        [R`\(\text{exponent field} = 2 + 127 = 129 = 10000001_2\)`, 'Add the bias.'],
        [R`\(\text{fraction} = 0111\,0000\ldots0\ (23\ \text{bits})\)`, 'The bits after the point; the leading 1 is dropped.'],
        [R`\(0\ 10000001\ 01110000000000000000000 = \texttt{0x40B80000}\)`, 'Sign 0 (positive). Group into hex: 0100 0000 1011 1000 0000…'],
      ], result: '0x40B80000' }),
    ] },
    { title: 'Try any number', ref: 'P&H §3.5', blocks: [
      B.x(R`<p>In the Number lab's IEEE 754 tab, type a decimal and press <b>Encode into A</b>: it shows the repeated-doubling for the fraction, the normalised form, the biased exponent and the stored fraction bits. Then flip individual bits of A to see how the value changes — the sign bit flips the sign, exponent bits scale by powers of 2, fraction bits make small adjustments.</p>`),
      B.tool('numlab', { float: 5.75, tab: 'ieee' }),
    ] },
    { title: 'Complexities and special values', ref: 'L08 s16', blocks: [
      B.p('S', 'L08 s16', R`<ul><li>Operations are more complicated than integer ones (see book).</li><li>Besides overflow we can get <b>underflow</b>.</li><li>Accuracy can be a big problem: IEEE 754 keeps two extra bits, <b>guard and round</b>, and has <b>four rounding modes</b>.</li><li>Positive ÷ zero gives <b>infinity</b>; zero ÷ zero gives <b>NaN</b> (not a number).</li><li>Implementing the standard can be tricky; not using it can be even worse.</li></ul>`),
      B.bg('Special exponent values', R`<table class="t"><thead><tr><th>Exponent field</th><th>Fraction</th><th>Meaning</th></tr></thead><tbody><tr><td>0</td><td>0</td><td>±0</td></tr><tr><td>0</td><td>≠ 0</td><td>denormalised (tiny) number, no hidden 1</td></tr><tr><td>1–254</td><td>any</td><td>normal number</td></tr><tr><td>255</td><td>0</td><td>±∞</td></tr><tr><td>255</td><td>≠ 0</td><td>NaN</td></tr></tbody></table><p>A biased exponent (rather than two's complement) makes numbers compare correctly as unsigned integers: the most negative exponent is 00…0 and the most positive 11…1.</p>`, 'P&H §3.5'),
    ] },
  ],
  keyPoints: [
    R`Value = \((-1)^S \times (1 + \text{fraction}) \times 2^{\text{exponent} - \text{bias}}\).`,
    'Single: 1 + 8 + 23 bits, bias 127. Double: 1 + 11 + 52 bits, bias 1023.',
    'Hidden leading 1: significand = 1 + fraction for normal numbers.',
    'More exponent bits = more range; more fraction bits = more precision.',
    'Extra issues: underflow, rounding (guard and round bits, 4 modes), ∞ and NaN.',
  ],
  traps: [
    '<b>Forgetting the bias.</b> Stored 129 means 2², not 2¹²⁹.',
    '<b>Forgetting the hidden 1.</b> Fraction .1 means significand 1.5, not 0.5.',
    '<b>Treating the exponent as two’s complement.</b> It’s biased (unsigned − 127).',
    '<b>Assuming 0.1 is exact.</b> Most decimal fractions repeat forever in binary and get rounded.',
  ],
  };
