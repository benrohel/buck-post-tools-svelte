<script lang="ts">
  import { RefreshCcw, Download, CircleX } from 'lucide-svelte';
  import { SyncLoader } from 'svelte-loading-spinners';
  import { type PathItem } from '@/api/exporter';
  import {
    getShotFilesTree,
    collectFolderNamesByLevel,
    filterByDepth,
    type HierarchyFilters,
  } from '@/api/files/buck5-file-browser';
  import { PROJECT_ROOT } from '@/api/files/files';
  import { evalES } from '@/lib/utils/bolt';
  import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';
  import { onMount } from 'svelte';
  import { openFile } from '@/lib/utils/utils';
  import { buck5Server } from '@/stores/server-store';
  import { appStore, type AppStore } from '@/stores/app-store';
  import { localAppStore } from '@/stores/local-storage';
  import { buck5ShotLibraryStore } from '@/stores/buck5-shot-library-store';
  import Toggle from '@/components/Toggle/Toggle.svelte';
  import FileBrowser from '@/components/FileBrowser/FileBrowser.svelte';
  import { logModule } from '@/lib/logger';

  const log = logModule('shot-explorer');

  import path from 'path';
  let filteredItems: PathItem[] = [];
  let isLoading = false;
  let prefix = '';
  let isBuck5 = true;
  let fileBrowserRef: FileBrowser;
  let selectedItemIds: Set<string> = new Set();

  let onlyShowLatestVersions = true;

  $: shotNames = $buck5ShotLibraryStore.shotNames;
  $: sequenceNames = $buck5ShotLibraryStore.sequenceNames;
  $: taskNames = $buck5ShotLibraryStore.taskNames;
  $: pathStructure = $buck5ShotLibraryStore.pathStructure;
  $: existingMediaFiles = $buck5ShotLibraryStore.existingMediaFiles;

  $: log.debug('Sequence names updated', { count: sequenceNames.length }, sequenceNames);

  let selectedSequenceName: any = '';
  let selectedShotName: any = '';
  let selectedTaskName: any = '';
  let selectedExtensionName: any = '';

  // Extension filter options
  const extensionNames = [
    { value: '', label: 'All Extensions', selected: true },
    { value: 'mov', label: 'mov', selected: false },
    { value: 'mp4', label: 'mp4', selected: false },
  ];

  let filters: HierarchyFilters;
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
    onlyShowLatestVersions
  );

  // Additional filtering by extension
  $: filteredItems = filterByExtension(
    filteredItemsAfterDepth,
    selectedExtensionName.value
  );

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

  const loadShotLibrary = async () => {
    isLoading = true;
    const projectFile = await evalES(`getProjectFile()`, false);
    const existingMediaFilesData = JSON.parse(
      await evalES(`collectAllFilePaths()`, false)
    ) as string[];
    const rootFolder = PROJECT_ROOT(projectFile);
    const res = await getShotFilesTree(rootFolder, isBuck5, prefix);

    const folderNames = collectFolderNamesByLevel(res);

    const shotNamesData = [
      { value: '', label: 'All Shots', selected: true },
      ...folderNames[2].map((shotName) => ({
        value: shotName,
        label: shotName,
        selected: true,
      })),
    ];
    const sequenceNamesData = [
      { value: '', label: 'All Sequences', selected: true },
      ...folderNames[1].map((sequenceName) => ({
        value: sequenceName,
        label: sequenceName,
        selected: true,
      })),
    ];
    const taskNamesData = [
      { value: '', label: 'All Tasks', selected: true },
      ...folderNames[3].map((taskName) => ({
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

    if ($appStore.latestBuck5LibrarySettings) {
      selectedSequenceName =
        $appStore.latestBuck5LibrarySettings.sequenceName ?? '';
      selectedShotName = $appStore.latestBuck5LibrarySettings.shotName ?? '';
      selectedTaskName = $appStore.latestBuck5LibrarySettings.taskName ?? '';
    } else {
      selectedSequenceName = sequenceNamesData[0];
      selectedShotName = shotNamesData[0];
      selectedTaskName = taskNamesData[0];
    }
    isLoading = false;
  };

  // Helper function to apply saved filter settings from appStore
  function applyStoredFilterSettings() {
    if ($appStore.latestBuck5LibrarySettings) {
      const settings = $appStore.latestBuck5LibrarySettings;

      // Find matching options in the current data
      if (settings.sequenceName && sequenceNames.length > 0) {
        const foundSequence = sequenceNames.find(
          (item) => item.value === settings.sequenceName
        );
        if (foundSequence) {
          selectedSequenceName = foundSequence;
        }
      }

      if (settings.shotName && shotNames.length > 0) {
        const foundShot = shotNames.find(
          (item) => item.value === settings.shotName
        );
        if (foundShot) {
          selectedShotName = foundShot;
        }
      }

      if (settings.taskName && taskNames.length > 0) {
        const foundTask = taskNames.find(
          (item) => item.value === settings.taskName
        );
        if (foundTask) {
          selectedTaskName = foundTask;
        }
      }

      if (settings.extensionName && extensionNames.length > 0) {
        const foundExtension = extensionNames.find(
          (item) => item.value === settings.extensionName
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
  }

  // Function to filter files by extension
  function filterByExtension(
    items: PathItem[],
    extensionFilter: string
  ): PathItem[] {
    if (!extensionFilter || extensionFilter === '') {
      return items; // No filter applied, return all items
    }

    function filterNodeRecursively(node: PathItem): PathItem | null {
      if (node.type === 'file') {
        // For files, check if the extension matches
        const fileName = node.name.toLowerCase();
        const hasExtension = fileName.endsWith(
          `.${extensionFilter.toLowerCase()}`
        );
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
    }

    return items
      .map((item) => filterNodeRecursively(item))
      .filter((item) => item !== null) as PathItem[];
  }

  function clearFilters() {
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
  }

  // Handler for file browser events
  function handleOpenFile(
    event: CustomEvent<{ fileId: string; filePath: string }>
  ) {
    openFile(event.detail.filePath);
  }

  function handleImportFile(
    event: CustomEvent<{ fileId: string; filePath: string }>
  ) {
    const importOptions = {
      filepath: event.detail.filePath,
      isSequence: false,
    };

    evalES(`importMediaFile(${JSON.stringify(importOptions)})`).then((res) => {
      res ? true : false;
    });
  }

  function handleImportFiles(
    event: CustomEvent<{ fileIds: string[]; filePaths: string[] }>
  ) {
    for (let i = 0; i < event.detail.filePaths.length; i++) {
      const importOptions = {
        filepath: event.detail.filePaths[i],
        isSequence: false,
      };
      evalES(`importMediaFile(${JSON.stringify(importOptions)})`).then(
        (res) => {
          res ? true : false;
        }
      );
    }
  }

  function handleSelectionChange(
    event: CustomEvent<{ selectedIds: Set<string> }>
  ) {
    selectedItemIds = event.detail.selectedIds;
  }

  const importAllVisible = async () => {
    if (fileBrowserRef) {
      const allVisibleFiles = getAllFilesFromTree(filteredItems);

      for (let i = 0; i < allVisibleFiles.length; i++) {
        const importOptions = {
          filepath: allVisibleFiles[i],
          isSequence: false,
        };
        evalES(`importMediaFile(${JSON.stringify(importOptions)})`).then(
          (res) => {
            res ? true : false;
          }
        );
      }
    }
  };

  const importSelectedItems = async () => {
    if (fileBrowserRef && selectedItemIds.size > 0) {
      const selectedFiles = fileBrowserRef
        .getSelectedItems()
        .map((item) => item.path);
      if (selectedFiles.length > 0) {
        for (let i = 0; i < selectedFiles.length; i++) {
          const importOptions = {
            filepath: selectedFiles[i],
            isSequence: false,
          };
          evalES(`importMediaFile(${JSON.stringify(importOptions)})`).then(
            (res) => {
              res ? true : false;
            }
          );
        }
      }
    }
  };

  // Helper to get all files from tree recursively
  function getAllFilesFromTree(nodes: PathItem[]): string[] {
    let filePaths: string[] = [];

    for (const node of nodes) {
      if (node.type === 'file') {
        filePaths.push(node.path);
      }
      if (node.children && node.children.length > 0) {
        filePaths = filePaths.concat(getAllFilesFromTree(node.children));
      }
    }

    return filePaths;
  }

  onMount(() => {
    // Only load if not already loaded
    if (!$buck5ShotLibraryStore.isLoaded) {
      loadShotLibrary();
    } else {
      // Data is already loaded, just apply stored filter settings
      applyStoredFilterSettings();
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
        </div>
        <!-- <div class="flex-row-start">
          <span>Buck 3</span>
          <Toggle bind:checked={isBuck5} />
          <span>Buck 5</span>
        </div> -->

        <div class="flex-row-end">
          {#if $buck5ShotLibraryStore.lastUpdated}
            <span class="last-updated-text">
              Updated: {$buck5ShotLibraryStore.lastUpdated.toLocaleTimeString()}
            </span>
          {/if}
          <button on:click={loadShotLibrary}>
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
          items={filteredItems}
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
