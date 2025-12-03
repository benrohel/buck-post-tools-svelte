<script lang="ts">
  import { fs, os, path } from '../../lib/cep/node';
  import {
    ExternalLink,
    FolderOpen,
    CircleX,
    ClipboardCopy,
  } from 'lucide-svelte';
  import { Bookmark } from '../../stores/bookmark-store';
  import { evalES, evalFile } from '../../lib/utils/bolt';
  import { notifications } from '../../stores/notifications-store';
  import { openFile } from '../../lib/utils/utils';
  import csInterface from '../../lib/cep/csinterface';
  import { PROJECT_ROOT } from '../../api/files/files';
  import { copyToClipboard } from '../../lib/utils/utils';
  import FileBrowser from '../FileBrowser/FileBrowser.svelte';
  import { platform } from 'os';
  import {
    getRootFolder,
    loadFolderChildren,
    updateNodeChildren,
  } from '../../api/files/file-explorer';
  import { type PathItem } from '../../api/exporter';

  export let bookmark: Bookmark;
  export let onRemove: () => void;

  let fileBrowserRef: FileBrowser;
  let fileTreeItems: PathItem[] = [];
  let isLoadingTree = false;
  let showFileBrowser = false;

  let actualPath = async () => {
    if (bookmark.isRelative) {
      const projectDir = await evalES(`getProjectDir()`);
      console.log('projectDir', projectDir);
      console.log('PROJECT_ROOT(projectDir)', PROJECT_ROOT(projectDir));
      console.log(
        'bookmark.path',
        bookmark.path.split(PROJECT_ROOT(bookmark.path)),
      );
      const macPath = path.posix.join(
        PROJECT_ROOT(projectDir),
        bookmark.path.split(PROJECT_ROOT(bookmark.path)).pop(),
      );
      const windowsPath = path.win32.join(
        PROJECT_ROOT(projectDir),
        bookmark.path.split(PROJECT_ROOT(bookmark.path)).pop(),
      );

      return os.platform() === 'win32' ? `\\${windowsPath}` : macPath;
    } else {
      return bookmark.path;
    }
  };

  async function handleImportFolder() {
    const sourceFolder = await actualPath();
    console.log('sourceFolder', sourceFolder);
    copyToClipboard(sourceFolder);
    notifications.info(`Path copied to clipboard: ${sourceFolder}`, 2000);

    // let folderPath = await evalES(`openExistingFolder("${sourceFolder}")`);
    // console.log("folderPath", folderPath);

    // if (folderPath && fs.existsSync(folderPath)) {
    //   const options = {
    //     filepath: folderPath,
    //     isSequence: false,
    //   };

    //   evalES(`importMediaFile(${JSON.stringify(options)})`, false).then(
    //     (res) => {
    //       if (res) {
    //         notifications.success(
    //           `Successfully imported ${bookmark.name}`,
    //           3000,
    //         );
    //       } else {
    //         notifications.error(`Failed to import ${bookmark.name}`, 3000);
    //       }
    //     },
    //   );
    // } else {
    //   await evalES(`alert("You must choose a file")`, true);
    // }
  }

  async function handleRevealFolder() {
    const path = await actualPath();
    openFile(path);
  }

  function handleRemove() {
    onRemove();
  }

  async function loadFileBrowser() {
    isLoadingTree = true;
    try {
      const rootPath = await actualPath();
      fileTreeItems = await getRootFolder(rootPath);
      showFileBrowser = !showFileBrowser;
    } catch (error) {
      console.error('Error loading file browser:', error);
      notifications.error('Failed to load folder contents', 3000);
    } finally {
      isLoadingTree = false;
    }
  }

  async function handleLoadFolder(
    event: CustomEvent<{ folderId: string; folderPath: string }>,
  ) {
    try {
      const { folderId, folderPath } = event.detail;
      const children = await loadFolderChildren(folderPath, folderId);
      fileTreeItems = updateNodeChildren(fileTreeItems, folderId, children);
    } catch (error) {
      console.error('Error loading folder children:', error);
      notifications.error('Failed to load folder contents', 3000);
    }
  }

  function handleOpenFileFromBrowser(
    event: CustomEvent<{ fileId: string; filePath: string }>,
  ) {
    openFile(event.detail.filePath);
  }

  async function handleImportFile(
    event: CustomEvent<{ fileId: string; filePath: string }>,
  ) {
    const options = {
      filepath: event.detail.filePath,
      isSequence: false,
    };

    const result = await evalES(
      `importMediaFile(${JSON.stringify(options)})`,
      false,
    );
    if (result) {
      notifications.success('Successfully imported file', 2000);
    } else {
      notifications.error('Failed to import file', 3000);
    }
  }

  async function handleImportFiles(
    event: CustomEvent<{ fileIds: string[]; filePaths: string[] }>,
  ) {
    const result = await evalES(
      `importMediaFiles(${JSON.stringify(event.detail.filePaths)})`,
      false,
    );
    if (result) {
      notifications.success(
        `Successfully imported ${event.detail.filePaths.length} files`,
        2000,
      );
    } else {
      notifications.error('Failed to import files', 3000);
    }
  }
</script>

<div class="bookmark-container">
  {#if bookmark}
    <div class="tool-card-container">
      <div class="tool-card-action">
        <button class="icon" on:click={handleImportFolder}>
          <ClipboardCopy />
        </button>
        <button class="icon" on:click={handleRevealFolder}>
          <ExternalLink />
        </button>
        <button
          class="icon"
          on:click={loadFileBrowser}
          disabled={isLoadingTree}
          title="Browse files"
        >
          <FolderOpen />
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
    </div>

    {#if showFileBrowser && fileTreeItems.length > 0}
      <div class="file-browser-container">
        <FileBrowser
          bind:this={fileBrowserRef}
          items={fileTreeItems}
          existingFiles={[]}
          showFileActions={true}
          allowMultiSelect={true}
          on:loadFolder={handleLoadFolder}
          on:openFile={handleOpenFileFromBrowser}
          on:importFile={handleImportFile}
          on:importFiles={handleImportFiles}
        />
      </div>
    {/if}
  {/if}
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  .bookmark-container {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

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

  .file-browser-container {
    background-color: $extra-dark;
    border: 1px solid #444;
    border-radius: 3px;
    max-height: 400px;
    overflow: hidden;
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
