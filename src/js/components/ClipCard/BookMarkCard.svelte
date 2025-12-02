<script lang="ts">
  import { fs, os, path } from '../../lib/cep/node';
  import { ExternalLink, FolderOpen, CircleX, ClipboardCopy } from 'lucide-svelte';
  import { Bookmark } from '../../stores/bookmark-store';
  import { evalES, evalFile } from '../../lib/utils/bolt';
  import { notifications } from '../../stores/notifications-store';
  import { openFile } from '../../lib/utils/utils';
  import csInterface from '../../lib/cep/csinterface';
  import { PROJECT_ROOT } from '../../api/files/files';
  import {copyToClipboard} from '../../lib/utils/utils';
  import { platform } from 'os';
  export let bookmark: Bookmark;
  export let onRemove: () => void;

  let actualPath = async () => {
    if (bookmark.isRelative) {
      const projectDir = await evalES(`getProjectDir()`);
      console.log("projectDir", projectDir);
      console.log('PROJECT_ROOT(projectDir)', PROJECT_ROOT(projectDir));
      console.log('bookmark.path', bookmark.path.split(PROJECT_ROOT(bookmark.path)));
      const macPath = path.posix.join(PROJECT_ROOT(projectDir), bookmark.path.split(PROJECT_ROOT(bookmark.path)).pop());
      const windowsPath = path.win32.join(PROJECT_ROOT(projectDir), bookmark.path.split(PROJECT_ROOT(bookmark.path)).pop());

      return os.platform() === 'win32' ? `\\${windowsPath}` : macPath;
    } else {
      return bookmark.path;
    }
  };




  async function handleImportFolder() {
    const sourceFolder = await actualPath();
    console.log("sourceFolder", sourceFolder);
    copyToClipboard(sourceFolder);
   
    
    if(os.platform() === 'win32') {
      notifications.info(`Path copied to clipboard: ${sourceFolder}`, 2000);
      return;
    }
    
    let folderPath = await evalES(`openExistingFolder("${sourceFolder}")`);
    console.log("folderPath", folderPath);

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

  async function handleRevealFolder() {
    const path = await actualPath();
    openFile(path);
  }

  function handleRemove() {
    onRemove();
  }
</script>

<div class="tool-card-container">
  {#if bookmark}
    <div class="tool-card-action">
      <button class="icon" on:click={handleImportFolder}>
        {#if os.platform()== "win32"}
          <ClipboardCopy />
          {:else}
          <FolderOpen />
        {/if}

      </button>
      <button class="icon" on:click={handleRevealFolder}>
        <ExternalLink />
      </button>
    </div>
    <div
      style="display: flex; flex-direction: row; align-items: center; width: 100%;"
    >
      <div class="clip-name-header">
        {#await actualPath() then path}
          <div class="shot-label">{bookmark.name}</div>
          <div class="shot-path" aria-label={path}>{path}</div>
        {/await}
      </div>
    </div>
    <button class="icon" on:click={handleRemove}><CircleX /></button>
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
