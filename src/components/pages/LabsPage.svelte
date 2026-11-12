<script>
  import { LABS, byTopicId } from '@/data/index.js';
  import { NF } from '@/utils/refs.js';
  import { pad2 } from '@/utils/html.js';
</script>

<div class="page">
  <header class="page-head">
    <h1 class="page-title"><span class="hmark">#</span>labs/</h1>
    <p class="lede">Every simulator in one place, full width. Each one is also embedded in the topic where it's taught.</p>
  </header>
  <div class="card list">
    <div class="rows labrows">
      {#each LABS as l (l.id)}
        <a class="labrow" href="#lab-{l.id}">
          <span class="lr-f"><span class="fi lua">{NF.lua}</span> {l.id}.lua</span>
          <span class="lr-t"><b>{l.title}</b><span>{@html l.desc}</span></span>
          <span class="lr-k">
            {(l.topics || []).map((id) => {
              const t = byTopicId(id);
              return t ? pad2(t.num) : '';
            }).join(' ')}
          </span>
        </a>
      {/each}
    </div>
  </div>
</div>
