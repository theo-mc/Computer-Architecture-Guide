<script>
  import { untrack } from 'svelte';
  import ToolShell from './ToolShell.svelte';
  import StepsList from '$lib/components/content/StepsList.svelte';
  import { Logic } from '$utils/logic.js';
  import { TK } from '$utils/toolKit.js';
  import { richHtml } from '$utils/actions.js';

  const R = String.raw;
  let { opts = {} } = $props();

  const TU = Object.keys(Logic.TIME);
  const FU = Object.keys(Logic.FREQ);

  let icStr = $state(untrack(() => (opts.ic != null ? String(opts.ic) : '100')));
  let cpiStr = $state(untrack(() => (opts.cpi != null ? String(opts.cpi) : '2')));
  let cm = $state(untrack(() => opts.cm || 'rate'));
  let ckStr = $state(untrack(() => (opts.ck != null ? String(opts.ck) : '2')));
  let cku = $state(
    untrack(() => {
      const r = (opts.cm || 'rate') === 'rate';
      return r ? opts.cku || 'GHz' : opts.cku && opts.cku in Logic.TIME ? opts.cku : 'ns';
    })
  );
  let tStr = $state(untrack(() => (opts.t != null ? String(opts.t) : '')));
  let tu = $state(untrack(() => opts.tu || 'ns'));

  const ckUnits = $derived(cm === 'rate' ? FU : TU);

  function onModeChange() {
    cku = cm === 'rate' ? opts.cku || 'GHz' : opts.cku && opts.cku in Logic.TIME ? opts.cku : 'ns';
  }

  const toNum = (s) => (s === '' || s == null ? NaN : Number(s));

  const result = $derived.by(() => {
    const F = TK.F;
    const EQ = TK.EQ;
    const ic = toNum(icStr);
    const cpi = toNum(cpiStr);
    const ck = toNum(ckStr);
    const t = toNum(tStr);
    const isRate = cm === 'rate';
    const missing = [isNaN(ic), isNaN(cpi), isNaN(ck), isNaN(t)].filter(Boolean).length;
    if (missing !== 1) return { err: 'Leave exactly one of IC, CPI, clock or CPU time empty.' };
    const e = Logic.EXP[cku];
    const Tc = isNaN(ck) ? NaN : isRate ? 1 / (ck * Math.pow(10, e)) : ck * Math.pow(10, e);
    const tS = isNaN(t) ? NaN : t * Logic.TIME[tu];
    const steps = [];
    const tcTex = isRate
      ? R`\dfrac{1}{${F(ck)}\times 10^{${e}}\,\text{Hz}}`
      : R`${F(ck)}\times 10^{${e}}\,\text{s}`;
    if (!isNaN(ck)) {
      steps.push([
        R`T_c = ${tcTex} = ${Logic.timeTex(Tc)}`,
        isRate
          ? 'The equation needs the clock period (seconds per cycle), so first turn the rate into a period: T_c = 1/f.'
          : 'The clock period is already seconds per cycle; just write the prefix as a power of ten.'
      ]);
    }
    steps.push([
      R`\text{CPU time} = IC \times CPI \times T_c`,
      'The iron law / performance equation (L03 s14): instructions × cycles per instruction × seconds per cycle = seconds.'
    ]);
    let ans;
    if (isNaN(t)) {
      const r = ic * cpi * Tc;
      steps.push([R`= ${F(ic)} \times ${F(cpi)} \times ${Logic.timeTex(Tc)}`, 'Substitute the three known values.']);
      steps.push([
        R`= ${F(ic * cpi)}\ \text{cycles} \times ${Logic.timeTex(Tc)} ${EQ(r / Logic.bestTime(r).v)} ${Logic.timeTex(r)}`,
        'IC × CPI is the total number of clock cycles; multiply by the length of one cycle.'
      ]);
      ans = Logic.timeTex(r);
    } else if (isNaN(ic)) {
      const r = tS / (cpi * Tc);
      steps.push([
        R`IC = \dfrac{\text{CPU time}}{CPI \times T_c} = \dfrac{${Logic.timeTex(tS)}}{${F(cpi)} \times ${Logic.timeTex(Tc)}} ${EQ(r)} ${F(r)}`,
        'Divide both sides of the equation by CPI × T_c to get IC on its own. Convert both times to the same unit first.'
      ]);
      ans = F(r) + R`\text{ instructions}`;
    } else if (isNaN(cpi)) {
      const r = tS / (ic * Tc);
      steps.push([
        R`CPI = \dfrac{\text{CPU time}}{IC \times T_c} = \dfrac{${Logic.timeTex(tS)}}{${F(ic)} \times ${Logic.timeTex(Tc)}} ${EQ(r)} ${F(r)}`,
        'Divide both sides by IC × T_c. Units cancel (seconds ÷ seconds), so CPI has no unit.'
      ]);
      ans = R`CPI = ${F(r)}`;
    } else {
      const r = tS / (ic * cpi);
      const fr = 1 / r;
      steps.push([
        R`T_c = \dfrac{\text{CPU time}}{IC \times CPI} = \dfrac{${Logic.timeTex(tS)}}{${F(ic)} \times ${F(cpi)}} = ${Logic.timeTex(r)}`,
        'Divide both sides by IC × CPI to get the length of one cycle.'
      ]);
      steps.push([
        R`f = \dfrac{1}{T_c} = \dfrac{1}{${Logic.timeTex(r)}} = ${Logic.freqTex(fr)}`,
        'If the question asks for a clock rate, take the reciprocal of the period.'
      ]);
      ans = R`T_c = ${Logic.timeTex(r)},\ f = ${Logic.freqTex(fr)}`;
    }
    return { ans: `\\(${ans}\\)`, steps };
  });
</script>

<ToolShell title="CPU time solver" sub="leave exactly one box empty and I solve for it">
  <div class="row">
    <label class="fld">
      Instruction count (IC)
      <input type="number" step="any" bind:value={icStr} />
    </label>
    <label class="fld">
      CPI
      <input type="number" step="any" bind:value={cpiStr} />
    </label>
    <label class="fld">
      Clock given as
      <select bind:value={cm} onchange={onModeChange}>
        <option value="rate">clock rate</option>
        <option value="period">clock period</option>
      </select>
    </label>
    <label class="fld">
      Clock
      <input type="number" step="any" bind:value={ckStr} />
    </label>
    <label class="fld">
      unit
      <select bind:value={cku}>
        {#each ckUnits as u}
          <option value={u}>{u}</option>
        {/each}
      </select>
    </label>
    <label class="fld">
      CPU time
      <input type="number" step="any" bind:value={tStr} />
    </label>
    <label class="fld">
      unit
      <select bind:value={tu}>
        {#each TU as u}
          <option value={u}>{u}</option>
        {/each}
      </select>
    </label>
  </div>
  <div class="out">
    {#if result.err}
      <div class="err-msg">{result.err}</div>
    {:else}
      <div class="result" use:richHtml={result.ans}></div>
      <StepsList steps={result.steps} />
    {/if}
  </div>
</ToolShell>
