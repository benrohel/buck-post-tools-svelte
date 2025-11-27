<script lang="ts">
  import { onMount } from 'svelte';
  import { fs, os } from '../../lib/cep/node';
  import { CommonSharedFile } from '../../api/scripts/tools-scripts';
  import { ExternalLink, FolderOpen, XCircle } from 'lucide-svelte';
  import { Bookmark } from '../../stores/bookmark-store';
  import { evalES, evalFile } from '../../lib/utils/bolt';
  import { notifications } from '../../stores/notifications-store';
  import { openFile } from '../../lib/utils/utils';

  export let bookmark: Bookmark;
  export let onRemove: () => void;

  let offline = true;

  async function handleImportFolder() {
    let folderPath = await evalES(`openExistingFolder("${bookmark.path}")`);
    console.log(folderPath);

    if (folderPath && fs.existsSync(folderPath)) {
      const options = {
        filepath: folderPath,
        isSequence: false,
      };
      evalES(`importMediaFile(${JSON.stringify(options)})`, false).then(
        (res) => {
          if (res) {
            notifications.success(
              `Successfully imported ${bookmark.name}`,
              3000,
            );
          } else {
            notifications.error(`Failed to import ${bookmark.name}`, 3000);
          }
        },
      );
    } else {
      await evalES(`alert("You must choose a file")`, true);
    }
  }

  function handleRevealFolder() {
    openFile(bookmark.path);
  }

  function handleRemove() {
    onRemove();
  }
</script>

<div class="tool-card-container">
  {#if bookmark}
    <div class="tool-card-action">
      <button class="icon" on:click={handleImportFolder}>
        <FolderOpen />
      </button>
      <button class="icon" on:click={handleRevealFolder}>
        <ExternalLink />
      </button>
    </div>
    <div class="clip-name-header">
      <div class="shot-label">{bookmark.name}</div>
      <div class="shot-path">{bookmark.path}</div>
    </div>
    <button class="icon" on:click={handleRemove}><XCircle /></button>
  {/if}
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  .clip-name-header {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .tool-card-container {
    display: flex;
    flex-direction: row;
    gap: 4px;
    background-color: $extra-dark;
    padding: 4px;
    justify-content: space-between;
  }

  .selected {
    background-color: $highlight;
  }
  :hover {
    filter: brightness(1.1);
  }

  .shot-label {
    font-size: 11px;
    text-align: start;
    margin-left: 6px;
    color: white;
  }

  .shot-path {
    width: 50%;
    font-size: 11px;
    text-align: start;
    margin-left: 6px;
    color: $font;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    direction: rtl;
  }

  .tool-card-action {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 4px;
  }

  .tool-description {
    font-size: 11px;
    margin: 2px;
    color: $font;
    text-align: left;
  }

  .edit-version {
    cursor: pointer;
  }
</style>
