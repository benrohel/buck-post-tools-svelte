<script lang="ts">
  import {
    ExternalLink,
    FolderOpen,
    CircleX,
    ClipboardCopy,
  } from 'lucide-svelte';

  import FileBrowser from '../FileBrowser/FileBrowser.svelte';
  import { Bookmark } from '@/stores/bookmark-store';
  import { notifications } from '@/stores/notifications-store';

  import { evalES } from '@/lib/utils/bolt';
  import { os, path } from '@/lib/cep/node';
  import { openFile, copyToClipboard } from '@/lib/utils/utils';
  import { PROJECT_ROOT } from '@/api/files/files';
  import {
    getRootFolder,
    loadFolderChildren,
    updateNodeChildren,
  } from '@/api/files/file-explorer';
  import type { PathItem } from '@/api/exporter';

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
    console.log('bookmark:', bookmark);
    if (bookmark.isRelative) {
      const projectDir = await evalES(`getProjectDir()`);
      if (!projectDir) {
        notifications.error('Failed to get project directory', 3000);
        return '';
      }
      const macPath = path.posix.join(
        PROJECT_ROOT(projectDir),
        bookmark.path.split(PROJECT_ROOT(bookmark.path)).pop() ?? '',
      );
      const windowsPath = path.win32.join(
        PROJECT_ROOT(projectDir),
        bookmark.path.split(PROJECT_ROOT(bookmark.path)).pop() ?? '',
      );

      return os.platform() === 'win32' ? `\\${windowsPath}` : macPath;
    } else {
      return bookmark.path;
    }
  };

  const handleImportFolder = async () => {
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
  };

  const handleRevealFolder = async () => {
    const path = await actualPath();
    openFile(path);
  };

  const handleRemove = () => {
    onRemove();
  };

  const loadFileBrowser = async () => {
    isLoadingTree = true;
    try {
      const rootPath = await actualPath();
      fileTreeItems = await getRootFolder(rootPath, groupSequences);
      showFileBrowser = !showFileBrowser;
    } catch (error) {
      log.error('Failed to load file browser', error as Error);
      notifications.error('Failed to load folder contents', 3000);
    } finally {
      isLoadingTree = false;
    }
  };

  const handleLoadFolder = async (
    event: CustomEvent<{
      folderId: string;
      folderPath: string;
      groupSequences: boolean;
    }>,
  ) => {
    const { folderId, folderPath, groupSequences: groupSeq } = event.detail;
    try {
      const children = await loadFolderChildren(folderPath, folderId, groupSeq);
      fileTreeItems = updateNodeChildren(fileTreeItems, folderId, children);
    } catch (error) {
      log.error('Failed to load folder children', error as Error, {
        folderId,
        folderPath,
      });
      notifications.error('Failed to load folder contents', 3000);
    }
  };

  const handleSequenceToggle = async (
    event: CustomEvent<{ groupSequences: boolean }>,
  ) => {
    groupSequences = event.detail.groupSequences;
    // Reload the file tree with new settings
    if (showFileBrowser && fileTreeItems.length > 0) {
      isLoadingTree = true;
      const rootPath = await actualPath();
      try {
        fileTreeItems = await getRootFolder(rootPath, groupSequences);
      } catch (error) {
        log.error('Failed to reload file browser', error as Error, {
          rootPath,
          groupSequences,
        });
        notifications.error('Failed to reload folder contents', 3000);
      } finally {
        isLoadingTree = false;
      }
    }
  };

  const handleOpenFileFromBrowser = (
    event: CustomEvent<{ fileId: string; filePath: string }>,
  ) => {
    openFile(event.detail.filePath);
  };

  const handleImportFile = async (
    event: CustomEvent<{ fileId: string; filePath: string }>,
  ) => {
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
  };

  const findNodeById = (nodes: PathItem[], id: string): PathItem | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleImportFiles = async (
    event: CustomEvent<{ fileIds: string[]; filePaths: string[] }>,
  ) => {
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
  };

  const handleRevealFile = (
    event: CustomEvent<{ fileId: string; filePath: string }>,
  ) => {
    log.debug('Reveal file in folder', { filePath: event.detail.filePath });

    openFile(path.dirname(event.detail.filePath));
    // You can use the CEP API to reveal the file in the OS file explorer
    // For now, just log it
    // TODO: Use CEP API to reveal file
    // Example: cep.fs.revealInFileBrowser(event.detail.filePath);
  };
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
