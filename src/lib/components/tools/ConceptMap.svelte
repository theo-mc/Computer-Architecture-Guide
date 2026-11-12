<script>
  import ToolShell from './ToolShell.svelte';
  import { mapSVG } from '$utils/viz.js';
</script>

<ToolShell title="Lectures 1–16 on one page" sub="every topic hangs off one equation · click a box to open its notes">
  <div class="vz">
    <div class="vz-canvas mm-canvas">{@html mapSVG()}</div>
    <div class="vz-note">
      Reading it: a question that changes the <b>program or ISA</b> changes IC; one that changes the <b>design</b> (single-cycle, multi-cycle, pipeline, stalls, forwarding) changes CPI and usually the clock; one about <b>delays</b> changes the clock period. Topics 13–15 appear twice because each design fixes both its CPI and its clock.
    </div>
  </div>
</ToolShell>
