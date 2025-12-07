<script lang="ts">
  import { fs, os, path } from '@/lib/cep/node';
  import {
    ExternalLink,
    FolderOpen,
    CircleX,
    ClipboardCopy,
  } from 'lucide-svelte';
  import { Bookmark } from '@/stores/bookmark-store';
  import { evalES, evalFile } from '@/lib/utils/bolt';
  import { notifications } from '@/stores/notifications-store';
  import { openFile } from '@/lib/utils/utils';
  import csInterface from '@/lib/cep/csinterface';
  import { PROJECT_ROOT } from '@/api/files/files';
  import { copyToClipboard } from '@/lib/utils/utils';
  import FileBrowser from '../FileBrowser/FileBrowser.svelte';
  import { platform } from 'os';
  import {
    getRootFolder,
    loadFolderChildren,
    updateNodeChildren,
  } from '@/api/files/file-explorer';
  import { type PathItem } from '@/api/exporter';
  import { logModule } from '@/lib/logger';

  const log = logModule('bookmark-card');

  export let bookmark: Bookmark;
  export let onRemove: () => void;

  let fileBrowserRef: FileBrowser;
  let fileTreeItems: PathItem[] = [];
  let isLoadingTree = false;
  let showFileBrowser = false;
  let groupSequences = true;

  let actualPath = async () => {
    if (bookmark.isRelative) {
      const projectDir = await evalES(`getProjectDir()`);
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
    log.debug('Copy source folder path', { path: sourceFolder });
    copyToClipboard(sourceFolder);
    notifications.info(`Path copied to clipboard: ${sourceFolder}`, 2000);

    // let folderPath = await evalES(`openExistingFolder("${sourceFolder}")`);
    // log.debug('Selected folder', { path: folderPath });

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
      fileTreeItems = await getRootFolder(rootPath, groupSequences);
      showFileBrowser = !showFileBrowser;
    } catch (error) {
      log.error('Failed to load file browser', error as Error, { rootPath });
      notifications.error('Failed to load folder contents', 3000);
    } finally {
      isLoadingTree = false;
    }
  }

  async function handleLoadFolder(
    event: CustomEvent<{
      folderId: string;
      folderPath: string;
      groupSequences: boolean;
    }>,
  ) {
    try {
      const { folderId, folderPath, groupSequences: groupSeq } = event.detail;
      const children = await loadFolderChildren(folderPath, folderId, groupSeq);
      fileTreeItems = updateNodeChildren(fileTreeItems, folderId, children);
    } catch (error) {
      log.error('Failed to load folder children', error as Error, { folderId, folderPath });
      notifications.error('Failed to load folder contents', 3000);
    }
  }

  async function handleSequenceToggle(
    event: CustomEvent<{ groupSequences: boolean }>,
  ) {
    groupSequences = event.detail.groupSequences;
    // Reload the file tree with new settings
    if (showFileBrowser && fileTreeItems.length > 0) {
      isLoadingTree = true;
      try {
        const rootPath = await actualPath();
        fileTreeItems = await getRootFolder(rootPath, groupSequences);
      } catch (error) {
        log.error('Failed to reload file browser', error as Error, { rootPath, groupSequences });
        notifications.error('Failed to reload folder contents', 3000);
      } finally {
        isLoadingTree = false;
      }
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
    const node = findNodeById(fileTreeItems, event.detail.fileId);
    const isSequence = node?.metadata?.isSequence || false;

    // For sequences, use the first frame's path
    let filepath = event.detail.filePath;
    if (isSequence && node?.metadata?.files && node.metadata.files.length > 0) {
      filepath = node.metadata.files[0]; // First frame
    }

    const options = {
      filepath: filepath,
      isSequence: isSequence,
    };

    const result = await evalES(
      `importMediaFile(${JSON.stringify(options)})`,
      false,
    );
    if (result) {
      if (isSequence && node?.metadata?.frameCount) {
        notifications.success(
          `Successfully imported sequence (${node.metadata.frameCount} frames)`,
          2000,
        );
      } else {
        notifications.success('Successfully imported file', 2000);
      }
    } else {
      notifications.error('Failed to import file', 3000);
    }
  }

  function findNodeById(nodes: PathItem[], id: string): PathItem | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
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

  function handleRevealFile(
    event: CustomEvent<{ fileId: string; filePath: string }>,
  ) {
    // TODO: Implement reveal file functionality
    log.debug('Reveal file in folder', { filePath: event.detail.filePath });

    openFile(path.dirname(event.detail.filePath));
    // You can use the CEP API to reveal the file in the OS file explorer
    // For now, just log it
    // TODO: Use CEP API to reveal file
    // Example: cep.fs.revealInFileBrowser(event.detail.filePath);
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
          showSequenceToggle={true}
          showExtensionFilter={true}
          bind:groupSequences
          height="400px"
          on:loadFolder={handleLoadFolder}
          on:openFile={handleOpenFileFromBrowser}
          on:revealFile={handleRevealFile}
          on:importFile={handleImportFile}
          on:importFiles={handleImportFiles}
          on:sequenceToggle={handleSequenceToggle}
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
