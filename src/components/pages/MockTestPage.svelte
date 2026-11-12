<script>
  import ToolSlot from '@/components/content/ToolSlot.svelte';
</script>

<div class="page wide">
  <header class="page-head">
    <h1 class="page-title"><span class="hmark">#</span>mock-test.lua</h1>
    <p class="lede">
      A timed practice test drawn from the Lectures 1–16 question bank. You mark it yourself, and it tells you which topics to revisit.
    </p>
  </header>
  <ToolSlot kind="tool" name="mock" opts={{}} showHelp={false} eager={true} />
</div>
