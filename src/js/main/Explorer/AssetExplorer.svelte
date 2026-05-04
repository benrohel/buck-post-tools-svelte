<script lang="ts">
  import { onMount } from 'svelte';

  import { RefreshCcw, Download, CircleX } from 'lucide-svelte';
  import { SyncLoader } from 'svelte-loading-spinners';

  import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';
  import Toggle from '@/components/Toggle/Toggle.svelte';
  import FileBrowser from '@/components/FileBrowser/FileBrowser.svelte';

  import { buck5Server } from '@/stores/server-store';
  import { appStore, type AppStore } from '@/stores/app-store';
  import { localAppStore } from '@/stores/local-storage';
  import { buck5AssetLibraryStore } from '@/stores/buck5-asset-library-store';
  import { notifications } from '@/stores/notifications-store';

  import {
    getAssetFilesTree,
    collectFolderNamesByLevel,
    filterByDepth,
  } from '@/api/files/buck5-file-browser';
  import { PROJECT_ROOT } from '@/api/files/files';
  import { evalES } from '@/lib/utils/bolt';
  import { openFile } from '@/lib/utils/utils';
  import type { PathItem } from '@/api/exporter';

  import { logModule } from '@/lib/logger';
  const log = logModule('asset-explorer');

  const extensionNames = [
    { value: '', label: 'All Extensions', selected: true },
    { value: 'mov', label: 'mov', selected: false },
    { value: 'mp4', label: 'mp4', selected: false },
    { value: 'png', label: 'png', selected: false },
    { value: 'exr', label: 'exr', selected: false },
    { value: 'jpg', label: 'jpg', selected: false },
  ];

  let filteredItems: PathItem[] = [];
  let isLoading = false;
  let fileBrowserRef: FileBrowser;
  let selectedItemIds: Set<string> = new Set();
  let onlyShowLatestVersions = true;
  let selectedLibraryName: any = '';
  let selectedAssetName: any = '';
  let selectedTaskName: any = '';
  let selectedExtensionName: any = '';

  $: libraryNames = $buck5AssetLibraryStore.libraryNames;
  $: assetNames = $buck5AssetLibraryStore.assetNames;
  $: taskNames = $buck5AssetLibraryStore.taskNames;
  $: pathStructure = $buck5AssetLibraryStore.pathStructure;
  $: existingMediaFiles = $buck5AssetLibraryStore.existingMediaFiles;

  $: depthFilters = [
    (node: PathItem) => node.name.match('Assets'), // Level 0: Assets root
    (node: PathItem) => node.name.match(selectedLibraryName.value), // Level 1: Library
    (node: PathItem) => node.name.match(selectedAssetName.value), // Level 2: Asset
    (node: PathItem) => node.name.match(selectedTaskName.value), // Level 3: Task
    (node: PathItem) => node.name.includes(''), // Level 4: files
  ];

  $: filteredItemsAfterDepth = filterByDepth(
    pathStructure,
    depthFilters,
    onlyShowLatestVersions,
  );

  $: filteredItems = filterByExtension(
    filteredItemsAfterDepth,
    selectedExtensionName.value,
  );

  const handleOnMenuChange = (value: any) => {
    appStore.update((s: AppStore) => ({
      ...s,
      latestBuck5AssetLibrarySettings: {
        libraryName: selectedLibraryName.value ?? 'All Libraries',
        assetName: selectedAssetName.value ?? 'All Assets',
        taskName: selectedTaskName.value ?? 'All Tasks',
        extensionName: selectedExtensionName.value ?? 'All Extensions',
      },
    }));
    localAppStore.set($appStore);
  };

  const loadAssetLibrary = async (settings?: any) => {
    if (!PROJECT_ROOT) {
      notifications.error(
        'You need to be connected to a Buck 5 server to use this feature',
        3000,
      );
      return;
    }
    isLoading = true;
    const projectFile = await evalES(`getProjectFile()`, false);
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
    const res = await getAssetFilesTree(rootFolder);

    const folderNames = collectFolderNamesByLevel(res);

    const libraryNamesData = [
      { value: '', label: 'All Libraries', selected: true },
      ...(folderNames[1] || []).map((libraryName) => ({
        value: libraryName,
        label: libraryName,
        selected: true,
      })),
    ];
    const assetNamesData = [
      { value: '', label: 'All Assets', selected: true },
      ...(folderNames[2] || []).map((assetName) => ({
        value: assetName,
        label: assetName,
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

    buck5AssetLibraryStore.update((store) => ({
      ...store,
      pathStructure: res,
      libraryNames: libraryNamesData,
      assetNames: assetNamesData,
      taskNames: taskNamesData,
      existingMediaFiles: existingMediaFilesData,
      lastUpdated: new Date(),
      isLoaded: true,
    }));

    if (settings) {
      selectedLibraryName = settings.libraryName ?? '';
      selectedAssetName = settings.assetName ?? '';
      selectedTaskName = settings.taskName ?? '';
    } else {
      selectedLibraryName = libraryNamesData[0];
      selectedAssetName = assetNamesData[0];
      selectedTaskName = taskNamesData[0];
    }
    isLoading = false;
  };

  const applyStoredFilterSettings = (settings: any) => {
    if (settings) {
      if (settings.libraryName && libraryNames.length > 0) {
        const found = libraryNames.find(
          (item) => item.value === settings.libraryName,
        );
        if (found) selectedLibraryName = found;
      }

      if (settings.assetName && assetNames.length > 0) {
        const found = assetNames.find(
          (item) => item.value === settings.assetName,
        );
        if (found) selectedAssetName = found;
      }

      if (settings.taskName && taskNames.length > 0) {
        const found = taskNames.find(
          (item) => item.value === settings.taskName,
        );
        if (found) selectedTaskName = found;
      }

      if (settings.extensionName && extensionNames.length > 0) {
        const found = extensionNames.find(
          (item) => item.value === settings.extensionName,
        );
        if (found) selectedExtensionName = found;
      }
    }

    if (!selectedLibraryName && libraryNames.length > 0) {
      selectedLibraryName = libraryNames[0];
    }
    if (!selectedAssetName && assetNames.length > 0) {
      selectedAssetName = assetNames[0];
    }
    if (!selectedTaskName && taskNames.length > 0) {
      selectedTaskName = taskNames[0];
    }
    if (!selectedExtensionName && extensionNames.length > 0) {
      selectedExtensionName = extensionNames[0];
    }
  };

  const filterByExtension = (
    items: PathItem[],
    extensionFilter: string,
  ): PathItem[] => {
    if (!extensionFilter || extensionFilter === '') {
      return items;
    }

    const filterNodeRecursively = (node: PathItem): PathItem | null => {
      if (node.type === 'file') {
        const fileName = node.name.toLowerCase();
        const hasExtension = fileName.endsWith(
          `.${extensionFilter.toLowerCase()}`,
        );
        return hasExtension ? node : null;
      } else if (node.type === 'folder') {
        const filteredChildren = node.children
          ? (node.children
              .map((child) => filterNodeRecursively(child))
              .filter((child) => child !== null) as PathItem[])
          : [];

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
    selectedLibraryName = libraryNames.length > 0 ? libraryNames[0] : '';
    selectedAssetName = assetNames.length > 0 ? assetNames[0] : '';
    selectedTaskName = taskNames.length > 0 ? taskNames[0] : '';
    selectedExtensionName = extensionNames.length > 0 ? extensionNames[0] : '';

    appStore.update((s: AppStore) => ({
      ...s,
      latestBuck5AssetLibrarySettings: {
        libraryName: '',
        assetName: '',
        taskName: '',
        extensionName: '',
      },
    }));
    localAppStore.set($appStore);
  };

  const handleOpenFile = (
    event: CustomEvent<{ fileId: string; filePath: string }>,
  ) => {
    openFile(event.detail.filePath);
  };

  const handleImportFile = (
    event: CustomEvent<{ fileId: string; filePath: string }>,
  ) => {
    const importOptions = {
      filepath: event.detail.filePath,
      isSequence: false,
    };

    evalES(`importMediaFile(${JSON.stringify(importOptions)})`).then((res) => {
      res ? true : false;
    });
  };

  const handleImportFiles = (
    event: CustomEvent<{ fileIds: string[]; filePaths: string[] }>,
  ) => {
    for (let i = 0; i < event.detail.filePaths.length; i++) {
      const importOptions = {
        filepath: event.detail.filePaths[i],
        isSequence: false,
      };
      evalES(`importMediaFile(${JSON.stringify(importOptions)})`).then(
        (res) => {
          res ? true : false;
        },
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
      const allVisibleFiles = getAllFilesFromTree(filteredItems);

      for (let i = 0; i < allVisibleFiles.length; i++) {
        const importOptions = {
          filepath: allVisibleFiles[i],
          isSequence: false,
        };
        evalES(`importMediaFile(${JSON.stringify(importOptions)})`).then(
          (res) => {
            res ? true : false;
          },
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
            },
          );
        }
      }
    }
  };

  const getAllFilesFromTree = (nodes: PathItem[]): string[] => {
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
  };

  onMount(() => {
    if ($buck5Server && !$buck5AssetLibraryStore.isLoaded) {
      loadAssetLibrary($appStore.latestBuck5AssetLibrarySettings);
    } else {
      applyStoredFilterSettings($appStore.latestBuck5AssetLibrarySettings);
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
        <div class="flex-row-end">
          {#if $buck5AssetLibraryStore.lastUpdated}
            <span class="last-updated-text">
              Updated: {$buck5AssetLibraryStore.lastUpdated.toLocaleTimeString()}
            </span>
          {/if}
          <button
            on:click={() =>
              loadAssetLibrary($appStore.latestBuck5AssetLibrarySettings)}
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
        <MenuSelect
          items={libraryNames}
          placeholder="Library"
          bind:value={selectedLibraryName}
          onChange={handleOnMenuChange}
        />
        <MenuSelect
          items={assetNames}
          placeholder="Asset"
          bind:value={selectedAssetName}
          onChange={handleOnMenuChange}
        />
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

  .last-updated-text {
    font-size: 11px;
    color: #888;
    font-style: italic;
    margin-right: 8px;
  }
</style>
