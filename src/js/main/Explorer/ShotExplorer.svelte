<script lang="ts">
  import { onMount } from 'svelte';

  import { RefreshCcw, Download, CircleX } from 'lucide-svelte';
  import { SyncLoader } from 'svelte-loading-spinners';
  import path from 'path';

  import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';
  import Toggle from '@/components/Toggle/Toggle.svelte';
  import FileBrowser from '@/components/FileBrowser/FileBrowser.svelte';

  import { buck5Server } from '@/stores/server-store';
  import { appStore, type AppStore } from '@/stores/app-store';
  import { localAppStore } from '@/stores/local-storage';
  import { buck5ShotLibraryStore } from '@/stores/buck5-shot-library-store';
  import { notifications } from '@/stores/notifications-store';

  import {
    getShotFilesTree,
    collectFolderNamesByLevel,
    filterByDepth,
    SHOT_VIDEO_EXTENSIONS,
    SHOT_IMAGE_EXTENSIONS,
    type HierarchyFilters,
  } from '@/api/files/buck5-file-browser';
  import { PROJECT_ROOT } from '@/api/files/files';
  import { evalES } from '@/lib/utils/bolt';
  import { openFile } from '@/lib/utils/utils';
  import type { PathItem } from '@/api/exporter';

  import { logModule } from '@/lib/logger';
  const log = logModule('shot-explorer');

  // tif/tiff and jpg/jpeg are matched together, see filterByExtension
  const extensionNames = [
    { value: '', label: 'All Extensions', selected: true },
    ...[...SHOT_VIDEO_EXTENSIONS, ...SHOT_IMAGE_EXTENSIONS]
      .map((ext) => ext.slice(1))
      .filter((ext) => ext !== 'tiff' && ext !== 'jpeg')
      .map((ext) => ({ value: ext, label: ext, selected: false })),
  ];

  let filteredItems: PathItem[] = [];
  let isLoading = false;
  let prefix = '';
  let isBuck5 = true;
  let fileBrowserRef: FileBrowser;
  let selectedItemIds: Set<string> = new Set();
  let onlyShowLatestVersions = true;
  let flattenView = false;
  let selectedSequenceName: any = '';
  let selectedShotName: any = '';
  let selectedTaskName: any = '';
  let selectedExtensionName: any = '';
  let filters: HierarchyFilters;

  $: shotNames = $buck5ShotLibraryStore.shotNames;
  $: sequenceNames = $buck5ShotLibraryStore.sequenceNames;
  $: taskNames = $buck5ShotLibraryStore.taskNames;
  $: pathStructure = $buck5ShotLibraryStore.pathStructure;
  $: existingMediaFiles = $buck5ShotLibraryStore.existingMediaFiles;
  $: filters = {
    sequence: [selectedSequenceName.value ? selectedSequenceName.value : ''],
    shot: [selectedShotName.value ? selectedShotName.value : ''],
    task: [selectedTaskName.value ? selectedTaskName.value : ''],
    extension: [selectedExtensionName.value ? selectedExtensionName.value : ''],
  };

  $: depthFilters = [
    (node: PathItem) => node.name.match('Shots'), // Level 0: only folders containing 'Shots'
    (node: PathItem) => node.name.match(selectedSequenceName.value), // Level 1: only sequences with 'Main'
    (node: PathItem) => node.name.match(selectedShotName.value), // Level 2: shots starting with 'Sh'
    (node: PathItem) => node.name.match(selectedTaskName.value), // Level 3: only CAEN department
    (node: PathItem) => node.name.includes(''), // Level 4: only v042 files
  ];

  $: filteredItemsAfterDepth = filterByDepth(
    pathStructure,
    depthFilters,
    onlyShowLatestVersions,
  );

  // Additional filtering by extension
  $: filteredItems = filterByExtension(
    filteredItemsAfterDepth,
    selectedExtensionName.value,
  );

  // Flat view: every visible file at the root, in tree order, without folders.
  // Node ids are unchanged so selection and import handlers keep working.
  $: displayedItems = flattenView
    ? getAllFilesFromTree(filteredItems).map((node) => ({
        ...node,
        parentId: null,
      }))
    : filteredItems;

  const handleOnMenuChange = (value: any) => {
    appStore.update((s: AppStore) => ({
      ...s,
      latestBuck5LibrarySettings: {
        sequenceName: selectedSequenceName.value ?? 'All Sequences',
        shotName: selectedShotName.value ?? 'All Shots',
        taskName: selectedTaskName.value ?? 'All Tasks',
        extensionName: selectedExtensionName.value ?? 'All Extensions',
      },
    }));
    localAppStore.set($appStore);
  };

  const loadShotLibrary = async (settings?: any) => {
    const projectFile = await evalES(`getProjectFile()`, false);

    // if (!PROJECT_ROOT(projectFile)) {

    //   notifications.error(
    //     'You need to be connected to a Buck 5 server to use this feature',
    //     3000,
    //   );
    //   return;
    // }
    // isLoading = true;

    const existingMediaFilesData = JSON.parse(
      await evalES(`collectAllFilePaths()`, false),
    ) as string[];
    const rootFolder = PROJECT_ROOT(projectFile);

    if (!rootFolder) {
      notifications.error(
        'You need to be connected to a Buck 5 server to use this feature',
        3000,
      );
      return;
    }
    const res = await getShotFilesTree(rootFolder, isBuck5, prefix);

    const folderNames = collectFolderNamesByLevel(res);

    const shotNamesData = [
      { value: '', label: 'All Shots', selected: true },
      ...(folderNames[2] || []).map((shotName) => ({
        value: shotName,
        label: shotName,
        selected: true,
      })),
    ];
    const sequenceNamesData = [
      { value: '', label: 'All Sequences', selected: true },
      ...(folderNames[1] || []).map((sequenceName) => ({
        value: sequenceName,
        label: sequenceName,
        selected: true,
      })),
    ];
    const taskNamesData = [
      { value: '', label: 'All Tasks', selected: true },
      ...(folderNames[3] || []).map((taskName) => ({
        value: taskName,
        label: taskName,
        selected: true,
      })),
    ];

    // Update the store with new data
    buck5ShotLibraryStore.update((store) => ({
      ...store,
      pathStructure: res,
      shotNames: shotNamesData,
      sequenceNames: sequenceNamesData,
      taskNames: taskNamesData,
      existingMediaFiles: existingMediaFilesData,
      lastUpdated: new Date(),
      isLoaded: true,
    }));

    if (settings) {
      selectedSequenceName = settings.sequenceName ?? '';
      selectedShotName = settings.shotName ?? '';
      selectedTaskName = settings.taskName ?? '';
    } else {
      selectedSequenceName = sequenceNamesData[0];
      selectedShotName = shotNamesData[0];
      selectedTaskName = taskNamesData[0];
    }
    isLoading = false;
  };

  // Helper function to apply saved filter settings from appStore
  const applyStoredFilterSettings = (settings: any) => {
    if (settings) {
      // Find matching options in the current data
      if (settings.sequenceName && sequenceNames.length > 0) {
        const foundSequence = sequenceNames.find(
          (item) => item.value === settings.sequenceName,
        );
        if (foundSequence) {
          selectedSequenceName = foundSequence;
        }
      }

      if (settings.shotName && shotNames.length > 0) {
        const foundShot = shotNames.find(
          (item) => item.value === settings.shotName,
        );
        if (foundShot) {
          selectedShotName = foundShot;
        }
      }

      if (settings.taskName && taskNames.length > 0) {
        const foundTask = taskNames.find(
          (item) => item.value === settings.taskName,
        );
        if (foundTask) {
          selectedTaskName = foundTask;
        }
      }

      if (settings.extensionName && extensionNames.length > 0) {
        const foundExtension = extensionNames.find(
          (item) => item.value === settings.extensionName,
        );
        if (foundExtension) {
          selectedExtensionName = foundExtension;
        }
      }
    }

    // Set defaults if nothing was found or no stored settings
    if (!selectedSequenceName && sequenceNames.length > 0) {
      selectedSequenceName = sequenceNames[0];
    }
    if (!selectedShotName && shotNames.length > 0) {
      selectedShotName = shotNames[0];
    }
    if (!selectedTaskName && taskNames.length > 0) {
      selectedTaskName = taskNames[0];
    }
    if (!selectedExtensionName && extensionNames.length > 0) {
      selectedExtensionName = extensionNames[0];
    }
  };

  // Function to filter files by extension
  const filterByExtension = (
    items: PathItem[],
    extensionFilter: string,
  ): PathItem[] => {
    if (!extensionFilter || extensionFilter === '') {
      return items; // No filter applied, return all items
    }

    const filterNodeRecursively = (node: PathItem): PathItem | null => {
      if (node.type === 'file') {
        // Sequence names end with the frame range, so match on the pattern
        const fileName = (node.metadata?.pattern ?? node.name).toLowerCase();
        const ext = extensionFilter.toLowerCase();
        const hasExtension =
          fileName.endsWith(`.${ext}`) ||
          (ext === 'tif' && fileName.endsWith('.tiff')) ||
          (ext === 'jpg' && fileName.endsWith('.jpeg'));
        return hasExtension ? node : null;
      } else if (node.type === 'folder') {
        // For folders, recursively filter children
        const filteredChildren = node.children
          ? (node.children
              .map((child) => filterNodeRecursively(child))
              .filter((child) => child !== null) as PathItem[])
          : [];

        // Keep folder if it has any matching children
        if (filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren,
          };
        }
      }
      return null;
    };

    return items
      .map((item) => filterNodeRecursively(item))
      .filter((item) => item !== null) as PathItem[];
  };

  const clearFilters = () => {
    // Reset all filters to default "All" options
    selectedSequenceName = sequenceNames.length > 0 ? sequenceNames[0] : '';
    selectedShotName = shotNames.length > 0 ? shotNames[0] : '';
    selectedTaskName = taskNames.length > 0 ? taskNames[0] : '';
    selectedExtensionName = extensionNames.length > 0 ? extensionNames[0] : '';

    // Update app store with cleared filters
    appStore.update((s: AppStore) => ({
      ...s,
      latestBuck5LibrarySettings: {
        sequenceName: '',
        shotName: '',
        taskName: '',
        extensionName: '',
      },
    }));
    localAppStore.set($appStore);
  };

  // Image sequences are imported from their first frame with isSequence set,
  // everything else (videos, stills) is imported as a single file.
  const getImportOptions = (
    node: PathItem | null,
    fallbackPath: string,
  ): { filepath: string; isSequence: boolean } => {
    const firstFrame = node?.metadata?.isSequence
      ? node.metadata.files?.[0]
      : undefined;
    return firstFrame
      ? { filepath: firstFrame, isSequence: true }
      : { filepath: node?.path ?? fallbackPath, isSequence: false };
  };

  const importNode = (node: PathItem | null, fallbackPath: string) => {
    const importOptions = getImportOptions(node, fallbackPath);
    evalES(`importMediaFile(${JSON.stringify(importOptions)})`).then((res) => {
      res ? true : false;
    });
  };

  const findFileNode = (nodes: PathItem[], id: string): PathItem | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children && node.children.length > 0) {
        const found = findFileNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Handler for file browser events
  const handleOpenFile = (
    event: CustomEvent<{ fileId: string; filePath: string }>,
  ) => {
    const node = findFileNode(filteredItems, event.detail.fileId);
    openFile(getImportOptions(node, event.detail.filePath).filepath);
  };

  const handleImportFile = (
    event: CustomEvent<{ fileId: string; filePath: string }>,
  ) => {
    importNode(
      findFileNode(filteredItems, event.detail.fileId),
      event.detail.filePath,
    );
  };

  const handleImportFiles = (
    event: CustomEvent<{ fileIds: string[]; filePaths: string[] }>,
  ) => {
    for (let i = 0; i < event.detail.filePaths.length; i++) {
      importNode(
        findFileNode(filteredItems, event.detail.fileIds[i]),
        event.detail.filePaths[i],
      );
    }
  };

  const handleSelectionChange = (
    event: CustomEvent<{ selectedIds: Set<string> }>,
  ) => {
    selectedItemIds = event.detail.selectedIds;
  };

  const importAllVisible = async () => {
    if (fileBrowserRef) {
      for (const node of getAllFilesFromTree(filteredItems)) {
        importNode(node, node.path);
      }
    }
  };

  const importSelectedItems = async () => {
    if (fileBrowserRef && selectedItemIds.size > 0) {
      for (const node of fileBrowserRef.getSelectedItems()) {
        importNode(node, node.path);
      }
    }
  };

  // Helper to get all file nodes from tree recursively
  const getAllFilesFromTree = (nodes: PathItem[]): PathItem[] => {
    let files: PathItem[] = [];

    for (const node of nodes) {
      if (node.type === 'file') {
        files.push(node);
      }
      if (node.children && node.children.length > 0) {
        files = files.concat(getAllFilesFromTree(node.children));
      }
    }

    return files;
  };

  onMount(() => {
    // Only load if not already loaded
    log.debug('ShotExplorer', 'onMount', 'ShotExplorer mounted', {
      buck5Server: $buck5Server,
      isLoaded: $buck5ShotLibraryStore.isLoaded,
    });
    if ($buck5Server && !$buck5ShotLibraryStore.isLoaded) {
      loadShotLibrary($appStore.latestBuck5LibrarySettings);
    } else {
      // Data is already loaded, just apply stored filter settings
      applyStoredFilterSettings($appStore.latestBuck5LibrarySettings);
    }
  });
</script>

<div>
  {#if !$buck5Server}
    <div>You need to be connected to Buck server to use this feature.</div>
  {:else}
    <div>
      <div class="flex-row-between">
        <div class="flex-row-start">
          <Toggle bind:checked={onlyShowLatestVersions} />
          <span>latest versions</span>
          <Toggle bind:checked={flattenView} />
          <span>flatten</span>
        </div>
        <div class="flex-row-end">
          {#if $buck5ShotLibraryStore.lastUpdated}
            <span class="last-updated-text">
              Updated: {$buck5ShotLibraryStore.lastUpdated.toLocaleTimeString()}
            </span>
          {/if}
          <button
            on:click={() =>
              loadShotLibrary($appStore.latestBuck5LibrarySettings)}
          >
            <RefreshCcw size={16} />
          </button>
          <button
            on:click={importSelectedItems}
            disabled={selectedItemIds.size === 0}
            style={`padding: 2px;${selectedItemIds.size === 0 ? 'opacity: 0.5;' : 'background-color:#086ce7;'}`}
            title="Import Selected ({selectedItemIds.size} items)"
          >
            <Download size={16} /> Selected ({selectedItemIds.size})
          </button>
          <button on:click={importAllVisible} title="Import All Visible">
            <Download size={16} /> All
          </button>
        </div>
      </div>
      <div class="flex-row-start">
        {#if !isBuck5}
          <div>
            <input type="text" bind:value={prefix} placeholder="prefix" />
          </div>
          <MenuSelect
            items={sequenceNames}
            placeholder="Shot"
            bind:value={selectedSequenceName}
            onChange={handleOnMenuChange}
          />
        {:else}
          <MenuSelect
            items={sequenceNames}
            placeholder="Sequence"
            bind:value={selectedSequenceName}
            onChange={handleOnMenuChange}
          />
          <MenuSelect
            items={shotNames}
            placeholder="Shot"
            bind:value={selectedShotName}
            onChange={handleOnMenuChange}
          />
        {/if}
        <MenuSelect
          items={taskNames}
          placeholder="Task"
          bind:value={selectedTaskName}
          onChange={handleOnMenuChange}
        />
        <MenuSelect
          items={extensionNames}
          placeholder="Extension"
          bind:value={selectedExtensionName}
          onChange={handleOnMenuChange}
        />
        <button on:click={clearFilters}>
          <CircleX size={16} />
        </button>
      </div>
      {#if isLoading}
        <div
          style="display: flex; justify-content: center; align-items: center; height: 100%;"
        >
          <SyncLoader color="#adadad" size="20" />
        </div>
      {:else}
        <FileBrowser
          bind:this={fileBrowserRef}
          items={displayedItems}
          existingFiles={existingMediaFiles}
          showFileActions={true}
          allowMultiSelect={true}
          on:openFile={handleOpenFile}
          on:importFile={handleImportFile}
          on:importFiles={handleImportFiles}
          on:selectionChange={handleSelectionChange}
        />
      {/if}
    </div>
  {/if}
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap');

  .flex-row-start {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    position: relative;
  }

  .flex-row-end {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 2px;
    position: relative;
  }
  .export-path-builder {
    color: #e0e0e0;
    padding: 4px;
    border-radius: 5px;
    border: 1px solid #444;
    margin-top: 4px;
  }

  .header {
    display: flex;
    flex-direction: column;
    margin-bottom: 8px;
    gap: 4px;
  }

  .header h2 {
    margin: 0;
    font-size: 18px;
  }

  .actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 4px;
    width: 100%;
  }

  select {
    background-color: #3a3a3a;
    border: 1px solid #555;
    color: #e0e0e0;
    padding: 5px;
    border-radius: 3px;
  }
  .last-updated-text {
    font-size: 11px;
    color: #888;
    font-style: italic;
    margin-right: 8px;
  }
</style>
