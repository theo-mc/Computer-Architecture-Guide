<script>
  import { srcChip } from '@/utils/refs.js';
  import { richHtml } from '@/utils/actions.js';

  let { locked } = $props();
</script>

<div class="page locked-page">
  <header class="page-head">
    <div class="fm">
      <span class="fm-d">---</span>
      <span><span class="fm-k">lecture:</span> {locked.num}</span>
      <span><span class="fm-k">status:</span> not released</span>
      <span class="fm-d">---</span>
    </div>
    <h1 class="page-title"><span class="hmark">#</span>{locked.title}</h1>
    <p class="lede">
      This lecture hasn't been delivered yet, so there's nothing to revise here. It will be written up from the slides and recording once they're on Canvas.
    </p>
  </header>
  <div class="card">
    <div class="chips">{@html srcChip('C', 'Introduction page · "Overview of Lectures Slides" table')}</div>
    <div class="prose">
      <p use:richHtml={`<b>Planned topics:</b> ${locked.plan}`}></p>
      <p class="caption">
        The Canvas table is a plan written before term; the actual decks haven't always matched its numbering, so treat it as a rough guide.
      </p>
    </div>
  </div>
</div>
