<script lang="ts">
  import { FolderSearch } from "svelte-lucide";
  import { evalES } from "../../lib/utils/bolt";
  import { onMount } from "svelte";

  export let onChange: Function;
  export let defaultFolder = "";
  export let label = "Select Folder";

  let rootFolder = defaultFolder;
  const handleSetOutputFolder = async () => {
    console.log("Selecting Folder triggered");
    const folderPath = await evalES(
      `openFolderDialog("Select New Root Folder.")`
    );
    if (folderPath) {
      onChange(folderPath);
      rootFolder = folderPath;
    }
  };
</script>

<div class="select-folder">
  <button on:click={handleSetOutputFolder} style="height: 18px;">
    <FolderSearch size="14" />
  </button>

  <input
    id="folder-path"
    style="flex-grow: 1; border: none; background-color: transparent; readonly"
    type="text"
    bind:value={rootFolder}
    placeholder={label}
  />
</div>

<style lang="scss">
  @use "../../variables.scss" as *;

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
    direction: rtl;
    text-overflow: ellipsis;
    display: block;
    align-items: center;
    // background-color: $extra-dark;
    margin: 2px;
    line-height: 20px;
    height: 20px;
    flex-grow: 1;
  }
</style>
