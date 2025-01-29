<script lang="ts">
  import { sequenceOutputFolder } from '../../stores/local-storage';
  import { evalES } from '../../lib/utils/bolt';
  import { FolderInput } from 'svelte-lucide';

  const handelSetOutputFolder = async () => {
    let folderPath = await evalES(`openFolderDialog("Select Output Folder")`);
    sequenceOutputFolder.set(String(folderPath));
  };

  const handleSubmitExport = async () => {
    console.log('click');
  };
</script>

<div>Export Sequence</div>
<div
  class="folder-select"
  style="display:flex; flex-direction:row; gap:4px; margin-left:2px; margin-right:2px"
>
  <button on:click={handelSetOutputFolder}>
    <FolderInput size="16" strokeWidth={1} />
  </button>
  <input type="text" bind:value={$sequenceOutputFolder} class="folder-input" />
</div>
<div class="flex-row-end action-row">
  <button class="active" on:click={handleSubmitExport}>Export Sequence</button>
</div>
<!-- 
<div
  class="folder-select"
  style="display:flex; flex-direction:row; gap:4px; margin-left:2px; margin-right:2px"
>
</div>
<div class="flex-row-end action-row">
  <button
    class="active"
    on:click={handleSubmitExport}
    disabled={$sequenceOutputFolder.length === 0}>Export Sequence</button
  >
</div> -->
