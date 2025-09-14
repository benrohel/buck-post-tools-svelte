<script lang="ts">
  import {
    RefreshCcw,
    ChevronDown,
    ChevronRight,
    Folder,
    Download,
    Eye,
    Film,
    CircleX,
  } from 'lucide-svelte';
  import { type PathItem } from '../../api/exporter';
  import {
    getShotFilesTree,
    collectFolderNamesByLevel,
    filterByDepth,
    type HierarchyFilters,
  } from '../../api/files/buck5-file-browser';
  import {
    getShotFilesTreeBuck3,
    collectFolderNamesByLevelBuck3,
  } from '../../api/files/buck3-file-browser';
  import { PROJECT_ROOT } from '../../api/files/files';
  import { evalES } from '../../lib/utils/bolt';
  import MenuSelect from '../../components/MultiSelect/MenuSelect.svelte';
  import { onMount } from 'svelte';
  import { openFile } from '../../lib/utils/utils';
  import { buck5Server } from '../../stores/server-store';
  import { SyncLoader } from 'svelte-loading-spinners';
  import { appStore, type AppStore } from '../../stores/app-store';
  import { localAppStore } from '../../stores/local-storage';
  import { buck5ShotLibraryStore } from '../../stores/buck5-shot-library-store';
  import Toggle from '../../components/Toggle/Toggle.svelte';

  import path from 'path';
  let selectedItemIds: Set<string> = new Set();
  let lastClickedId: string | null = null;
  let filteredItems: PathItem[] = [];
  let isLoading = false;
  let prefix = '';
  let isBuck5 = true;

  let onlyShowLatestVersions = false;

  $: shotNames = $buck5ShotLibraryStore.shotNames;
  $: sequenceNames = $buck5ShotLibraryStore.sequenceNames;
  $: taskNames = $buck5ShotLibraryStore.taskNames;
  $: pathStructure = $buck5ShotLibraryStore.pathStructure;
  $: existingMediaFiles = $buck5ShotLibraryStore.existingMediaFiles;

  $: console.log('sequenceNames', sequenceNames);

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
    onlyShowLatestVersions,
  );

  // Additional filtering by extension
  $: filteredItems = filterByExtension(
    filteredItemsAfterDepth,
    selectedExtensionName.value,
  );

  // $: console.log('filteredItems', JSON.stringify(filteredItems));

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
      await evalES(`collectAllFilePaths()`, false),
    ) as string[];
    const rootFolder = PROJECT_ROOT(projectFile);
    let getShotFilesTreeFunc = getShotFilesTree;
    let collectFolderNamesByLevelFunc = collectFolderNamesByLevel;
    if (!isBuck5) {
      getShotFilesTreeFunc = getShotFilesTreeBuck3;
      collectFolderNamesByLevelFunc = collectFolderNamesByLevelBuck3;
    }
    const res = await getShotFilesTreeFunc(rootFolder, isBuck5, prefix);
    const folderNames = collectFolderNamesByLevelFunc(res);
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

  const handleOpenFile = (itemId: string) => {
    openFile(itemId);
  };

  // Helper function to apply saved filter settings from appStore
  function applyStoredFilterSettings() {
    if ($appStore.latestBuck5LibrarySettings) {
      const settings = $appStore.latestBuck5LibrarySettings;

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
  }

  // Function to filter files by extension
  function filterByExtension(
    items: PathItem[],
    extensionFilter: string,
  ): PathItem[] {
    if (!extensionFilter || extensionFilter === '') {
      return items; // No filter applied, return all items
    }

    function filterNodeRecursively(node: PathItem): PathItem | null {
      if (node.type === 'file') {
        // For files, check if the extension matches
        const fileName = node.name.toLowerCase();
        const hasExtension = fileName.endsWith(
          `.${extensionFilter.toLowerCase()}`,
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

  // Function to handle item selection with multi-select support (files only)
  function handleItemClick(itemId: string, event: MouseEvent) {
    const flatItems = flattenTree(filteredItems).map((item) => item.node);
    const clickedNode = findNodeById(filteredItems, itemId);

    if (!clickedNode) return;

    // Only handle selection for files, ignore folder clicks for selection
    if (clickedNode.type !== 'file') return;

    if (event.metaKey || event.ctrlKey) {
      // Cmd/Ctrl+Click: Toggle file selection
      const newSelection = new Set(selectedItemIds);
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
      selectedItemIds = newSelection;
      lastClickedId = itemId;
    } else if (event.shiftKey && lastClickedId) {
      // Shift+Click: Select range of files
      const currentIndex = flatItems.findIndex((item) => item.id === itemId);
      const lastIndex = flatItems.findIndex(
        (item) => item.id === lastClickedId,
      );

      if (currentIndex !== -1 && lastIndex !== -1) {
        const startIndex = Math.min(currentIndex, lastIndex);
        const endIndex = Math.max(currentIndex, lastIndex);

        // Add all files in range to selection
        const newSelection = new Set(selectedItemIds);
        for (let i = startIndex; i <= endIndex; i++) {
          const rangeNode = flatItems[i];
          if (rangeNode.type === 'file') {
            newSelection.add(rangeNode.id);
          }
        }
        selectedItemIds = newSelection;
      }
    } else {
      // Regular click: Select only this file
      selectedItemIds = new Set([itemId]);
      lastClickedId = itemId;
    }
  }

  // Function to clear selection when clicking outside items
  function handleContainerClick() {
    selectedItemIds = new Set();
    lastClickedId = null;
  }

  // Function to flatten the tree for iterative rendering
  function flattenTree(
    nodes: PathItem[],
  ): Array<{ node: PathItem; depth: number; path: string[] }> {
    const result: Array<{ node: PathItem; depth: number; path: string[] }> = [];
    const stack: Array<{ node: PathItem; depth: number; path: string[] }> = [];

    // Initialize stack with root nodes
    for (let i = nodes.length - 1; i >= 0; i--) {
      stack.push({
        node: nodes[i],
        depth: 0,
        path: [nodes[i].name],
      });
    }

    // Process stack iteratively instead of recursively
    while (stack.length > 0) {
      const item = stack.pop()!;
      const { node, depth, path } = item;

      // Add current node to result
      result.push(item);

      // If folder is expanded and has children, push children to stack
      if (
        node.type === 'folder' &&
        node.expanded &&
        node.children &&
        node.children.length > 0 &&
        depth < 10
      ) {
        // Add children in reverse order so they appear in correct order when popped
        for (let i = node.children.length - 1; i >= 0; i--) {
          const child = node.children[i];
          stack.push({
            node: child,
            depth: depth + 1,
            path: [...path, child.name],
          });
        }
      }
    }

    return result;
  }

  // Helper function to find a node by ID in the tree
  function findNodeById(nodes: PathItem[], id: string): PathItem | null {
    // First check at the current level
    const directMatch = nodes.find((node) => node.id === id);
    if (directMatch) return directMatch;

    // Then check children
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        const childMatch = findNodeById(node.children, id);
        if (childMatch) return childMatch;
      }
    }

    return null;
  }

  // Function to build a path for a node
  function buildPath(node: PathItem): string {
    if (node.parentId === null) {
      return node.name;
    }
    const parentNode = findNodeById(pathStructure, node.parentId);
    if (!parentNode) {
      return node.name;
    }
    return `${buildPath(parentNode)}/${node.name}`;
  }

  // Helper function to update a node in the tree by ID
  function updateNodeInTree(
    nodes: PathItem[],
    nodeId: string,
    updateFn: (node: PathItem) => PathItem,
  ): PathItem[] {
    return nodes.map((node) => {
      if (node.id === nodeId) {
        node.path = buildPath(node);
        return updateFn(node);
      } else if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: updateNodeInTree(node.children, nodeId, updateFn),
        };
      }
      return node;
    });
  }

  // Function to toggle node expansion
  function toggleExpand(itemId: string) {
    pathStructure = updateNodeInTree(pathStructure, itemId, (node) => ({
      ...node,
      expanded: !node.expanded,
    }));
  }

  // Function to edit an item by ID
  function importItem(itemId: string) {
    console.log('importItem', itemId);

    const importOptions = {
      filepath: itemId,
      isSequence: false,
    };

    evalES(`importMediaFile(${JSON.stringify(importOptions)})`).then((res) => {
      res ? true : false;
    });
  }

  // Helper function to find node of a specific type and return an array of nodes
  function findNodesByType(nodes: PathItem[], type: string): PathItem[] {
    let results: PathItem[] = [];

    // Add matches at the current level
    results = results.concat(nodes.filter((node) => node.type === type));

    // Then recursively check children
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        const childMatches = findNodesByType(node.children, type);
        results = results.concat(childMatches);
      }
    }

    return results;
  }

  function fileExistsInProject(node: PathItem): boolean {
    const basename = path.basename(node.path);
    return existingMediaFiles
      .map((file) => path.basename(file))
      .includes(basename);
  }

  const importAllVisible = async () => {
    const visibleFileItems = findNodesByType(filteredItems, 'file').map(
      (item) => item.path,
    );
    await evalES(`importMediaFiles(${JSON.stringify(visibleFileItems)})`).then(
      (res) => {
        res ? true : false;
      },
    );
  };

  const importSelectedItems = async () => {
    if (selectedItemIds.size === 0) return;

    // Get selected file items
    const allItems = findNodesByType(filteredItems, 'file');
    const selectedFileItems = allItems
      .filter((item) => selectedItemIds.has(item.id))
      .map((item) => item.path);

    if (selectedFileItems.length > 0) {
      await evalES(
        `importMediaFiles(${JSON.stringify(selectedFileItems)})`,
      ).then((res) => {
        res ? true : false;
      });
    }
  };

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
        <div class="flex-row-start">
          <span>Buck 3</span>
          <Toggle bind:checked={isBuck5} />
          <span>Buck 5</span>
        </div>

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
        <div class="tree-container" on:click={handleContainerClick}>
          <div class="tree-structure">
            {#each flattenTree(filteredItems) as { node, depth }}
              <div
                class="tree-item {node.type} {selectedItemIds.has(node.id)
                  ? 'selected'
                  : ''} {fileExistsInProject(node) ? 'disabled' : ''}"
                style="margin-left: {depth * 20}px;"
                on:click={(e) => {
                  e.stopPropagation();
                  handleItemClick(node.id, e);
                }}
              >
                <div class="item-header">
                  {#if node.type === 'folder'}
                    <button
                      class="icon-only"
                      on:click|stopPropagation={() => toggleExpand(node.id)}
                    >
                      {#if node.expanded}
                        <ChevronDown />
                      {:else}
                        <ChevronRight />
                      {/if}
                    </button>
                  {:else}
                    <span class="indent"></span>
                  {/if}
                  <div class="item-icon">
                    {#if node.type === 'folder'}
                      <Folder color="white" size="20" />
                    {:else}
                      <Film color="white" size="20" strokeWidth="1" />
                    {/if}
                  </div>

                  <div class="item-content">
                    <div
                      class="item-info"
                      on:keydown={(e) => {
                        e.preventDefault();
                        if (e.key === 'Enter') {
                          if (selectedItemIds.size > 1) {
                            importSelectedItems();
                          } else {
                            importItem(node.id);
                          }
                        }
                      }}
                      on:dblclick={() => {
                        if (selectedItemIds.size > 1) {
                          importSelectedItems();
                        } else {
                          importItem(node.id);
                        }
                      }}
                    >
                      <span class={`item-name`}>{node.name || '[empty]'}</span>
                      {#if node.type === 'file'}
                        <div class="flex-row-end">
                          <button on:click={() => handleOpenFile(node.id)}
                            ><Eye size="16" color="white" /></button
                          >
                          <button on:click={() => importItem(node.id)}
                            ><Download size="16" color="white" /></button
                          >
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
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
    gap: 8px;
    margin: 1px;
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

  .tree-container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 168px);
    overflow-y: auto;
  }

  .tree-structure {
    flex: 1;
    border: 1px solid #444;
    border-radius: 3px;
    overflow-y: auto;
    padding: 4px;
  }

  .tree-item {
    margin-bottom: 1px;
    border-radius: 3px;
    cursor: pointer;
  }

  .tree-item.selected > .item-header {
    background-color: $darker;
    border: 1px solid $active;
    box-shadow: 0 0 2px rgba(255, 255, 255, 0.1);
  }

  .item-header {
    display: flex;
    padding: 0px;
    align-items: center;
    border-radius: 3px;
  }

  .folder > .item-header {
    background-color: #2a2a2a;
  }

  .file > .item-header {
    background-color: #303030;
  }

  .tree-item.disabled > .item-header {
    opacity: 0.5;
    background-color: #1a1a1a !important;
  }

  .tree-item.disabled .item-name {
    color: #666;
  }

  .expand-btn {
    background: none;
    border: none;
    color: #aaa;
    cursor: pointer;
    font-size: 10px;
    padding: 0 5px;
    width: 20px;
    text-align: center;
  }

  .indent {
    display: inline-block;
    width: 20px;
  }

  .children {
    padding-left: 5px;
  }

  .item-icon {
    text-align: center;
    margin-right: 6px;
  }

  .item-content {
    flex: 1;
    position: relative;
    display: flex;
  }

  .item-name {
    font-family: 'Roboto Mono', monospace;
    font-size: 11px;

    text-align: left;
  }

  .item-name-file {
    font-family: 'Roboto Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    text-align: left;
  }

  .item-info {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-right: 4px;
  }

  .dropdown-content {
    background-color: $extra-dark;
    border: 1px solid #555;
    border-radius: 3px;
    padding: 5px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  /* Container for dropdowns */
  .dropdown-container {
    position: fixed !important;
    z-index: 200 !important; /* Even higher z-index */
    pointer-events: auto !important; /* Ensure clicks are captured */
  }

  /* Container for tree and actions */
  .container {
    display: flex;
    gap: 10px;
    position: relative;
  }

  .no-selection {
    color: #888;
    font-style: italic;
    font-size: 13px;
    text-align: center;
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
