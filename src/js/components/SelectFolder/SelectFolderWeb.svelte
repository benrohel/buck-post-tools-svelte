<script lang="ts">
  import type { FolderSelectCallback } from '@/types/callbacks';
  import { FolderSearch } from 'lucide-svelte';
  import { fs, path } from '@/lib/cep/node';
  import { evalES } from '@/lib/utils/bolt';
  export let defaultFolder = '';
  export let label = 'Select Folder';
  export let value = defaultFolder;
  export let onChange: FolderSelectCallback = () => {};

  const handleSetOutputFolder = async () => {
    let res = await evalES(`selectFolder("${label}")`);
    let folderPath = JSON.parse(res).absoluteURI;
    folderPath = folderPath.replace('file://', '');
    if (folderPath && fs.statSync(folderPath).isDirectory()) {
      value = folderPath;
      onChange(folderPath);
    } else {
      await evalES(`alert("You must choose a directory")`, false);
    }
  };
</script>

<div class="select-folder">
  <button on:click={handleSetOutputFolder} style="height: 18px;">
    <FolderSearch size="14" />
  </button>

  <input
    id="folder-path"
    style="flex-grow: 1; border: none; background-color: transparent;"
    type="text"
    bind:value
    placeholder={label}
  />
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  #select-folder-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 4px;
  }

  .select-folder {
    height: 22px;
    flex-grow: 1;
    background-color: $extra-dark;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    padding: 2px;
    padding-left: 4px;
    border-radius: 4px;
    border: 1px solid $dimmed-font-color;
  }

  #folder-path {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    align-items: center;
    margin: 2px;
    line-height: 20px;
    height: 20px;
    flex-grow: 1;
  }
</style>
