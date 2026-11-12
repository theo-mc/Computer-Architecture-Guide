<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import { Logic } from '@/utils/logic.js';
  import { asm as asmHL } from '@/utils/hl.js';
  import { esc } from '@/utils/html.js';

  let { opts = {} } = $props();

  const NOPS = Logic.ALL_OPS().length;
  const N = Logic.REGNAMES;
  const H8 = (v) => Logic.hex8(v);
  const hx2 = (v) => '0x' + v.toString(16).toUpperCase().padStart(2, '0');
  const PROG = 'Loop = 0x00400000, Exit = 0x0040000C';
  const FC = { op: 'op', rs: 'rs', rt: 'rt', rd: 'rd', shamt: 'sh', funct: 'fn', immediate: 'im', address: 'addr' };
  const DESC = {
    op: 'opcode — picks the instruction (0 for every R-format)',
    rs: 'first source register',
    rt: 'second source (R) / destination or data register (I)',
    rd: 'destination register',
    shamt: 'shift amount (only sll/srl/sra use it)',
    funct: 'function code — picks the R-format operation',
    immediate: '16-bit constant / offset (two’s complement if signed)',
    address: '26-bit word address: bits 27–2 of the target'
  };
  const EX = [
    ['add $t0, $s1, $s2', 'R'],
    ['sll $t1, $s3, 2', 'R shift'],
    ['mult $s0, $s1', 'R hi/lo'],
    ['jr $ra', 'R jump'],
    ['lw $t0, 32($s3)', 'I load'],
    ['sw $t0, 48($s3)', 'I store'],
    ['addi $sp, $sp, -8', 'I negative'],
    ['lui $t0, 0x1001', 'I upper'],
    ['beq $t0, $zero, Exit', 'I branch → label', 0x00400000],
    ['beq $s1, $s2, 25', 'I branch offset', 0x00400000],
    ['j Loop', 'J → label', 0x00400008],
    ['jal 0x00400100', 'J call', 0x00400008],
    ['move $t0, $t1', 'pseudo']
  ];
  const PS = { move: 'move $t0, $t1', li: 'li $t0, 100', nop: 'nop', clear: 'clear $t0', not: 'not $t0, $t1' };
  const SAMPLE = (op) => {
    if (/^(sll|srl|sra)$/.test(op)) return `${op} $t0, $s1, 4`;
    if (/^(sllv|srlv|srav)$/.test(op)) return `${op} $t0, $s1, $s2`;
    if (op === 'jr') return 'jr $ra';
    if (op === 'jalr') return 'jalr $t9';
    if (op === 'syscall' || op === 'break') return op;
    if (op === 'mfhi' || op === 'mflo') return `${op} $t0`;
    if (/^(mult|multu|div|divu)$/.test(op)) return `${op} $s0, $s1`;
    if (op === 'lui') return 'lui $t0, 0x1001';
    if (/^(andi|ori|xori)$/.test(op)) return `${op} $t0, $s1, 0xFF`;
    if (/^(lb|lbu|lh|lhu|lw|ll|sb|sh|sw|sc)$/.test(op)) return `${op} $t0, 8($s1)`;
    if (op === 'beq' || op === 'bne') return `${op} $t0, $zero, Exit`;
    if (op === 'blez' || op === 'bgtz') return `${op} $t0, Exit`;
    if (op === 'j') return 'j Loop';
    if (op === 'jal') return 'jal 0x00400100';
    if (op in Logic.I_OP) return `${op} $t0, $s1, -5`;
    return `${op} $t0, $s1, $s2`;
  };
  const ALLG = [
    ['R-format', 'op 0 · funct', Object.keys(Logic.R_FUNCT).map((k) => [k, Logic.R_FUNCT[k]])],
    ['I-format', 'opcode', Object.keys(Logic.I_OP).map((k) => [k, Logic.I_OP[k]])],
    ['J-format', 'opcode', Object.keys(Logic.J_OP).map((k) => [k, Logic.J_OP[k]])],
    ['Pseudo', 'becomes', Logic.PSEUDO_OPS().map((k) => [k, null])]
  ];

  const isBranch = (op) => /^(beq|bne|blez|bgtz)$/.test(op);
  const fieldsOf = (w) => {
    const op = w >>> 26;
    if (op === 0) return [['op', 31, 26], ['rs', 25, 21], ['rt', 20, 16], ['rd', 15, 11], ['shamt', 10, 6], ['funct', 5, 0]];
    if (op === 2 || op === 3) return [['op', 31, 26], ['address', 25, 0]];
    return [['op', 31, 26], ['rs', 25, 21], ['rt', 20, 16], ['immediate', 15, 0]];
  };
  const fmtOf = (w) => {
    const op = w >>> 26;
    return op === 0 ? 'R' : op === 2 || op === 3 ? 'J' : 'I';
  };

  function initialAsm() {
    return opts.v || 'add $t0, $s1, $s2';
  }
  function initialPc() {
    if (opts.pc != null) return H8(opts.pc);
    const v = initialAsm();
    if (/\b(Loop|Exit)\b/.test(v)) {
      const e0 = EX.find((e) => e[0] === v);
      if (e0 && e0[2] != null) return H8(e0[2]);
    }
    return H8(0x00400000);
  }

  let asmVal = $state(untrack(() => initialAsm()));
  let pcVal = $state(untrack(() => initialPc()));
  let labVal = $state(untrack(() => opts.labels || PROG));
  let hexVal = $state('0x00000000');
  let word = $state(0);
  let src = $state('asm');
  let asmInfo = $state(null);
  let errMsg = $state(null);
  let width = $state(700);

  function parseCtx(pcStr, labStr) {
    const pc = Logic.parseImm(pcStr);
    const L = Logic.parseLabels(labStr);
    return {
      pc: isNaN(pc) ? 0x00400000 : (pc >>> 0) & ~3,
      labels: L.labels,
      bad: L.bad,
      pcBad: isNaN(pc) || pc < 0 || pc % 4
    };
  }

  function syncOutputs(w, err, currentSrc) {
    errMsg = err || null;
    const C = parseCtx(pcVal, labVal);
    const d = Logic.disassemble(w, C);
    const hx = (w >>> 0).toString(16).toUpperCase().padStart(8, '0');
    if (currentSrc !== 'asm' && !d.error) asmVal = d.asm;
    if (currentSrc !== 'hex') hexVal = '0x' + hx;
  }

  function runFromAsm() {
    src = 'asm';
    const C = parseCtx(pcVal, labVal);
    const info = Logic.assemble(asmVal, C);
    asmInfo = info;
    if (info.error) {
      syncOutputs(word, info.error, 'asm');
      return;
    }
    word = info.word >>> 0;
    syncOutputs(word, null, 'asm');
  }

  function runFromHex() {
    src = 'hex';
    asmInfo = null;
    const t = hexVal.trim().replace(/[\s_]/g, '');
    if (!/^(0x)?[0-9a-f]{1,8}$/i.test(t)) {
      syncOutputs(word, 'Hex: up to 8 digits, e.g. 0x02324020.', 'hex');
      return;
    }
    word = parseInt(t.replace(/^0x/i, ''), 16) >>> 0;
    syncOutputs(word, null, 'hex');
  }

  function reCtx() {
    if (src === 'asm') runFromAsm();
    else syncOutputs(word, null, src);
  }

  function toggleBit(k) {
    word = (word ^ (1 << k)) >>> 0;
    src = 'bits';
    asmInfo = null;
    syncOutputs(word, null, 'bits');
  }

  function loadExample(ex, pc) {
    if (pc != null) pcVal = H8(+pc);
    if (/Loop|Exit/.test(ex) && !/Loop\s*=|Exit\s*=/.test(labVal)) labVal = PROG;
    asmVal = ex;
    runFromAsm();
  }

  // Initial encode matching original `fromAsm()`
  untrack(() => runFromAsm());

  const view = $derived.by(() => {
    const C = parseCtx(pcVal, labVal);
    const w = word >>> 0;
    const bits = w.toString(2).padStart(32, '0');
    const fl = fieldsOf(w);
    const F = fmtOf(w);
    const colOf = (k) => FC[fl.find((x) => k <= x[1] && k >= x[2])[0]];
    const d = Logic.disassemble(w, C);
    const hx = w.toString(16).toUpperCase().padStart(8, '0');
    const unused = (!d.error && d.unused) || [];
    const halves = width < 600 ? [[31, 16], [15, 0]] : [[31, 0]];

    const boardHtml = halves
      .map(([H, Lo]) => {
        const n = H - Lo + 1;
        const col = (k) => H - k + 1;
        const idx = Array.from({ length: n }, (_, i) => `<span>${H - i}</span>`).join('');
        const bt = Array.from({ length: n }, (_, i) => {
          const k = H - i;
          const on = bits[31 - k] === '1';
          return `<button type="button" class="eb c-${colOf(k)} ${on ? 'on' : ''} ${fl.some((f) => f[2] === k && k !== Lo) ? 'brk' : ''}" data-bit="${k}" aria-label="bit ${k}">${on ? 1 : 0}</button>`;
        }).join('');
        const fs = fl
          .filter(([, hi, lo]) => hi >= Lo && lo <= H)
          .map(([nm, hi, lo]) => {
            const h2 = Math.min(hi, H);
            const l2 = Math.max(lo, Lo);
            const fw = hi - lo + 1;
            const v = Math.floor(w / Math.pow(2, lo)) % Math.pow(2, fw);
            const part = h2 !== hi || l2 !== lo;
            let val;
            let sub = `${fw} bits`;
            if (nm === 'rs' || nm === 'rt' || nm === 'rd') val = `<span class="tk-reg">${N[v]}</span>`;
            else if (nm === 'immediate') {
              const sv = d.fields ? d.fields.find((q) => q.name === 'immediate').signedValue : v;
              val = `<span class="tk-num">${sv}</span>`;
              if (!d.error && isBranch(d.op)) sub = `${fw} bits · × 4 from PC+4`;
            } else if (nm === 'address') {
              val = `<span class="tk-hex">0x${v.toString(16).toUpperCase().padStart(7, '0')}</span>`;
              sub = `${fw} bits · × 4 = ${H8(v * 4)}`;
            } else val = `<span class="tk-num">${v}</span>`;
            const un = unused.indexOf(nm) >= 0;
            if (un) sub = v ? 'should be 0' : 'unused · 0';
            const showVal = !part || h2 === hi;
            return `<div class="ef c-${FC[nm]} ${part ? 'part' : ''} ${un ? 'unused' : ''}" style="grid-column: ${col(h2)} / span ${h2 - l2 + 1}"><b>${nm}${part ? (h2 === hi ? ' →' : ' (cont.)') : ''}</b><span>${showVal ? val : '&nbsp;'}</span><i>${showVal ? sub : `${fw} bits`}</i></div>`;
          })
          .join('');
        const nb = Array.from({ length: n / 4 }, (_, q) => {
          const s0 = 31 - H + q * 4;
          return `<div class="en"><span>${bits.slice(s0, s0 + 4)}</span><b>${hx[s0 / 4]}</b></div>`;
        }).join('');
        return `<div class="enc-half" style="--n:${n};--nb:${n / 4}"><div class="enc-idx">${idx}</div><div class="enc-bits">${bt}</div><div class="enc-flds">${fs}</div><div class="enc-nib">${nb}</div></div>`;
      })
      .join('');

    const fmtHtml = ['R', 'I', 'J']
      .map((f) => {
        const parts =
          f === 'R'
            ? [['op', 6], ['rs', 5], ['rt', 5], ['rd', 5], ['shamt', 5], ['funct', 6]]
            : f === 'I'
              ? [['op', 6], ['rs', 5], ['rt', 5], ['immediate', 16]]
              : [['op', 6], ['address', 26]];
        return `<div class="ef-row ${f === F ? 'on' : ''}"><b>${f}</b>${parts
          .map(([n, fw]) => `<span class="c-${FC[n]}" style="flex:${fw}">${n}</span>`)
          .join('')}</div>`;
      })
      .join('');

    const pseudo = src === 'asm' && asmInfo && asmInfo.pseudo;
    let msgCls = 'enc-msg ok';
    let msgHtml = '';
    if (errMsg) {
      msgCls = 'enc-msg bad';
      msgHtml = esc(errMsg);
    } else if (d.error) {
      msgCls = 'enc-msg warn';
      msgHtml = esc('These bits aren’t an instruction this encoder knows: ' + d.error);
    } else {
      msgHtml = `<span class="fmtb">${d.format}-format</span><code class="asm">${asmHL(d.asm)}</code>${
        d.format === 'I' && d.label ? `<span class="ref">→ <b class="tk-lab">${esc(d.label)}</b></span>` : ''
      }${pseudo ? `<span class="ref">← <code class="asm">${asmHL(pseudo.from)}</code></span>` : ''}<span class="ref">= <b class="tk-hex">0x${hx}</b></span>`;
    }

    const pc4 = (C.pc + 4) >>> 0;
    const lab = (a) => {
      const k = Object.keys(C.labels).find((x) => C.labels[x] === a);
      return k ? ` = <b class="tk-lab">${esc(k)}</b>` : '';
    };
    let tg = '';
    if (!d.error && d.format === 'J') {
      const top = (pc4 >>> 28) & 15;
      const fieldBits = bits.slice(6);
      tg = `<span class="tg-k">${d.op === 'jal' ? '$ra ← PC + 4, then PC ←' : 'PC ←'}</span><span class="tg-p c-pc" title="top 4 bits of PC + 4 = ${H8(pc4)}">${top.toString(2).padStart(4, '0')}</span><span class="tg-op">∥</span><span class="tg-p c-addr" title="the 26-bit address field">${fieldBits}</span><span class="tg-op">∥</span><span class="tg-p c-z" title="always 00: instructions are word-aligned">00</span><span class="tg-op">=</span><b class="tk-hex">${H8(d.target)}</b>${lab(d.target)}`;
    } else if (!d.error && isBranch(d.op)) {
      const off = d.fields[3].signedValue;
      const cond =
        d.op === 'beq'
          ? `${N[(w >>> 21) & 31]} == ${N[(w >>> 16) & 31]}`
          : d.op === 'bne'
            ? `${N[(w >>> 21) & 31]} != ${N[(w >>> 16) & 31]}`
            : d.op === 'blez'
              ? `${N[(w >>> 21) & 31]} ≤ 0`
              : `${N[(w >>> 21) & 31]} > 0`;
      tg = `<span class="tg-k">if ${cond}: PC ←</span><span class="tg-p c-pc" title="PC + 4">${H8(pc4)}</span><span class="tg-op">+</span><span class="tg-p c-im">${off} × 4</span><span class="tg-op">=</span><b class="tk-hex">${H8(d.target)}</b>${lab(d.target)}<span class="tg-k dim">· else PC + 4</span>`;
    } else if (!d.error && (d.op === 'jr' || d.op === 'jalr')) {
      tg = `<span class="tg-k">${d.op === 'jalr' ? `${N[(w >>> 11) & 31]} ← PC + 4; ` : ''}PC ← <span class="tk-reg">${N[(w >>> 21) & 31]}</span> (a full 32-bit address: reaches anywhere)</span>`;
    } else if (!d.error) {
      tg = `<span class="tg-k dim">Not a jump or branch: next PC = PC + 4 = ${H8(pc4)}</span>`;
    }

    const ops = d.error ? null : d.op;
    const whySteps = [];
    if (C.bad.length || C.pcBad) {
      whySteps.push(
        `<li class="bad">${C.pcBad ? 'PC must be a word-aligned address such as 0x00400008. ' : ''}${
          C.bad.length
            ? `Couldn’t read label${C.bad.length > 1 ? 's' : ''}: ${C.bad.map(esc).join(', ')} — write name = word-aligned address.`
            : ''
        }</li>`
      );
    }
    if (!d.error) {
      if (pseudo) {
        whySteps.push(
          `<li><b>Pseudo-instruction.</b> <code class="asm">${asmHL(pseudo.from)}</code> isn’t real hardware: the assembler replaces it with <code class="asm">${asmHL(pseudo.to)}</code>, which is what gets encoded (L07 s4).</li>`
        );
      }
      if (d.nop) {
        whySteps.push(
          '<li><b>nop.</b> The all-zero word is <code class="asm">sll $zero, $zero, 0</code>: it writes $zero, which never changes, so it does nothing.</li>'
        );
      }
      whySteps.push(
        `<li><b>Format.</b> ${
          d.format === 'R'
            ? 'Opcode <span class="tk-num">0</span> → R-format: registers only, and the <span class="cf c-fn">funct</span> field picks the operation (L06 s5).'
            : d.format === 'I'
              ? `Opcode <span class="tk-num">${w >>> 26}</span> → I-format: <code class="asm">${ops}</code> carries a 16-bit constant or offset (L06 s8–9).`
              : `Opcode <span class="tk-num">${w >>> 26}</span> → J-format: <code class="asm">${ops}</code> carries a 26-bit word address (L06 s10).`
        }</li>`
      );
      const ref = src === 'asm' && asmInfo && asmInfo.ref;
      if (ref && ref.label && ref.kind === 'branch') {
        whySteps.push(
          `<li><b>Label → offset.</b> <b class="tk-lab">${esc(ref.label)}</b> is at <span class="tk-hex">${H8(ref.target)}</span>. This branch is at PC = <span class="tk-hex">${H8(ref.pc)}</span>, so PC + 4 = <span class="tk-hex">${H8(ref.pc + 4)}</span>. Offset = (<span class="tk-hex">${H8(ref.target)}</span> − <span class="tk-hex">${H8(ref.pc + 4)}</span>) ÷ 4 = <span class="tk-num">${ref.off}</span> instructions — that number goes in the immediate field.</li>`
        );
      }
      if (ref && ref.kind === 'jump') {
        whySteps.push(
          `<li><b>${ref.label ? 'Label → address field' : 'Target → address field'}.</b> ${
            ref.label ? `<b class="tk-lab">${esc(ref.label)}</b> is at <span class="tk-hex">${H8(ref.target)}</span>. ` : ''
          }Drop the top 4 bits (the CPU takes them from PC + 4) and the bottom 2 bits (always 00), i.e. target ÷ 4 = <span class="tk-hex">0x${(Math.floor(ref.target / 4) & 0x3ffffff).toString(16).toUpperCase()}</span>, which fills the 26-bit field.</li>`
        );
      }
      fl.forEach(([n, hi, lo]) => {
        const fw = hi - lo + 1;
        const v = Math.floor(w / Math.pow(2, lo)) % Math.pow(2, fw);
        let extra = '';
        if (n === 'rs' || n === 'rt' || n === 'rd') extra = ` = register <span class="tk-num">${v}</span> = <span class="tk-reg">${N[v]}</span>`;
        if (n === 'immediate') {
          const sv = d.fields[3].signedValue;
          extra =
            sv < 0
              ? ` → top bit is 1, so it’s negative: <span class="tk-num">${v}</span> − 2<sup>16</sup> = <span class="tk-num">${sv}</span>`
              : ` = <span class="tk-num">${sv}</span>`;
          if (isBranch(ops)) {
            extra += ` instructions, counted from PC + 4: target = <span class="tk-hex">${H8(pc4)}</span> + ${sv} × 4 = <span class="tk-hex">${H8(d.target)}</span>${d.label ? ' = ' + esc(d.label) : ''}`;
          }
          if (/^(lw|sw|lb|lbu|lh|lhu|sb|sh|ll|sc)$/.test(ops)) extra += ' bytes from the base register';
          if (ops === 'lui') extra += ' → goes into the upper 16 bits of rt; the lower 16 become 0';
        }
        if (n === 'address') {
          extra = ` = <span class="tk-hex">0x${v.toString(16).toUpperCase()}</span>. The CPU rebuilds the target: top 4 bits of PC + 4 (<span class="tk-hex">${H8(pc4)}</span> → <span class="tk-bin">${((pc4 >>> 28) & 15).toString(2).padStart(4, '0')}</span>), then these 26 bits, then <span class="tk-bin">00</span> = <span class="tk-hex">${H8(d.target)}</span>${d.label ? ' = ' + esc(d.label) : ''} (pseudo-direct addressing, P&H §2.10)`;
        }
        if (n === 'funct') extra = ` = <span class="tk-num">${v}</span> → <code class="asm">${ops}</code>`;
        const un = unused.indexOf(n) >= 0;
        whySteps.push(
          `<li${un ? ' class="muted"' : ''}><span class="cf c-${FC[n]}">${n}</span> bits ${hi}–${lo}: <span class="tk-bin">${bits.slice(31 - hi, 32 - lo)}</span>${
            un ? ` — not used by <code class="asm">${ops}</code>${v ? ', and should be 0' : ', so it is 0'}` : extra
          }. <span class="muted">${un ? '' : DESC[n] + '.'}</span></li>`
        );
      });
      if (ops === 'mult' || ops === 'multu' || ops === 'div' || ops === 'divu') {
        whySteps.push(
          `<li><b>Hi and Lo.</b> The result goes to the special registers Hi and Lo (${
            /mult/.test(ops) ? 'the 64-bit product: Hi = upper 32 bits, Lo = lower 32' : 'Lo = quotient, Hi = remainder'
          }); read them with <code class="asm">mflo</code> / <code class="asm">mfhi</code>.</li>`
        );
      }
      whySteps.push(
        `<li><b>Hex.</b> Split the 32 bits into eight groups of 4 and replace each group by one hex digit: <b class="tk-hex">0x${hx}</b>.</li>`
      );
    }

    return {
      boardHtml,
      fmtHtml,
      msgCls,
      msgHtml,
      tgtHtml: `<span class="tg-h">Next PC</span>${tg || '<span class="tg-k dim">—</span>'}`,
      whyHtml: `<div class="enc-wh">How to read it</div><ol>${whySteps.join('') || '<li class="muted">Fix the input above to see the breakdown.</li>'}</ol>`
    };
  });

  function onBoardClick(e) {
    const bt = e.target.closest('[data-bit]');
    if (bt) toggleBit(+bt.dataset.bit);
  }
</script>

<ToolShell
  title="MIPS instruction encoder ⇄ decoder"
  sub="{NOPS} instructions + labels · type assembly or hex, or click any bit"
>
  <div class="enc" bind:clientWidth={width}>
    <div class="enc-io">
      <label class="enc-f">
        <span>Assembly</span>
        <input bind:value={asmVal} oninput={runFromAsm} spellcheck="false" autocomplete="off" />
      </label>
      <span class="enc-x">⇄</span>
      <label class="enc-f hexf">
        <span>Machine code (hex)</span>
        <input bind:value={hexVal} oninput={runFromHex} spellcheck="false" autocomplete="off" maxlength="10" />
      </label>
    </div>

    <div class="enc-ctx">
      <label class="enc-c">
        <span>This instruction is at (PC)</span>
        <input bind:value={pcVal} oninput={reCtx} spellcheck="false" autocomplete="off" />
      </label>
      <label class="enc-c enc-cl">
        <span>Labels (name = address) — for j, jal, beq, bne, blez, bgtz</span>
        <input bind:value={labVal} oninput={reCtx} spellcheck="false" autocomplete="off" />
      </label>
    </div>

    <div class="enc-ex">
      {#each EX as e}
        <button
          type="button"
          class="fx-pre"
          aria-pressed={e[0] === asmVal.trim()}
          onclick={() => loadExample(e[0], e[2])}
        >
          <code class="asm">{@html asmHL(e[0])}</code>
          <i>{e[1]}</i>
        </button>
      {/each}
    </div>

    <details class="enc-all" data-resize>
      <summary>
        All {NOPS} instructions (+ {Logic.PSEUDO_OPS().length} pseudo-instructions) — click one to load an example
      </summary>
      <div class="enc-allb">
        {#each ALLG as [g, what, ops]}
          <div class="enc-ag">
            <b>{g}</b>
            <i>{what}</i>
            <div>
              {#each ops as [k, v]}
                {@const ex = g === 'Pseudo' ? PS[k] : SAMPLE(k)}
                {@const pc = /Exit|Loop/.test(ex) ? (k === 'j' ? 0x00400008 : 0x00400000) : null}
                <button
                  type="button"
                  class="enc-op"
                  title={ex}
                  onclick={() => loadExample(ex, pc)}
                >
                  <code>{k}</code>{#if v != null}<small>{hx2(v)}</small>{/if}
                </button>
              {/each}
            </div>
          </div>
        {/each}
      </div>
    </details>

    <div class={view.msgCls}>{@html view.msgHtml}</div>
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="enc-board" onclick={onBoardClick}>{@html view.boardHtml}</div>
    <div class="enc-tgt">{@html view.tgtHtml}</div>
    <div class="enc-fmt">{@html view.fmtHtml}</div>
    <div class="enc-why">{@html view.whyHtml}</div>
  </div>
</ToolShell>
