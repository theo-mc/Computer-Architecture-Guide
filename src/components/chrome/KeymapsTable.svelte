<script>
  let { items } = $props();
</script>

<div class="tbl-wrap">
  <table class="t keys">
    <tbody>
      {#each [
        ['<kbd>Space</kbd>', 'Leader: which-key menu'],
        ['<kbd>/</kbd> or <kbd>Space</kbd><kbd>f</kbd>', 'Telescope: find topics, formulas, labs, questions'],
        ['<kbd>j</kbd> <kbd>k</kbd> (with a count: <kbd>5j</kbd>)', 'Move the cursor line'],
        ['<kbd>Ctrl</kbd>+<kbd>d</kbd> <kbd>Ctrl</kbd>+<kbd>u</kbd>', 'Half a page down / up'],
        ['<kbd>gg</kbd> <kbd>G</kbd> <kbd>12G</kbd> <kbd>zz</kbd>', 'Top / bottom / line 12 / centre the cursor'],
        ['<kbd>]]</kbd> <kbd>[[</kbd> · <kbd>}</kbd> <kbd>{</kbd>', 'Next / previous heading'],
        ['<kbd>za</kbd> <kbd>zM</kbd> <kbd>zR</kbd>', 'Toggle fold / fold all steps / open all'],
        ['<kbd>Enter</kbd> or <kbd>o</kbd>', 'Activate the line (reveal answer, follow link, open fold)'],
        ['<kbd>x</kbd>', 'Tick “Attempted” on the question under the cursor'],
        ['<kbd>L</kbd> <kbd>H</kbd> · <kbd>]b</kbd> <kbd>[b</kbd>', 'Next / previous topic'],
        ['<kbd>Ctrl</kbd>+<kbd>o</kbd> <kbd>Ctrl</kbd>+<kbd>i</kbd>', 'Jump back / forward'],
        ['<kbd>t</kbd> · <kbd>Ctrl</kbd>+<kbd>w</kbd> <kbd>h</kbd>', 'Focus the file tree (<kbd>Esc</kbd> to leave)'],
        ['<kbd>Space</kbd><kbd>e</kbd>', 'Show / hide the file tree'],
        ['<kbd>:</kbd>', 'Command line (Tab completes): <code>:e 5</code> <code>:set bg=dark</code> <code>:q</code> <code>:help</code>'],
        ['<kbd>?</kbd>', 'This help']
      ] as row}
        <tr>
          <td>{@html row[0]}</td>
          <td>{@html row[1]}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
