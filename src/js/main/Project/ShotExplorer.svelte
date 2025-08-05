<script lang="ts">
  import {
    RefreshCcw,
    ChevronDown,
    ChevronRight,
    Folder,
    FilePlay,
    Download,
    Film,
  } from 'lucide-svelte';
  import { type PathItem } from '../../api/exporter';
  import {
    getShotFilesTree,
    collectFolderNamesByLevel,
    filterByDepth,
    type HierarchyFilters,
  } from '../../api/files/buck5-file-browser';
  import { PROJECT_ROOT } from '../../api/files/files';
  import { evalES } from '../../lib/utils/bolt';
  import MenuSelect from '../../components/MultiSelect/MenuSelect.svelte';
  import { onMount } from 'svelte';
  import Button from '../../components/Button/Button.svelte';
  import Toggle from '../../components/Toggle/Toggle.svelte';
  let pathStructure: PathItem[] = [];
  let selectedItemId: string | null = null;
  let filteredItems: PathItem[] = [];
  let isLoading = false;
  let shotNames: any[] = [];
  let sequenceNames: any[] = [];
  let taskNames: any[] = [];

  let onlyShowLatestVersions = false;

  $: shotNames;
  $: sequenceNames;
  $: taskNames;

  $: console.log('sequenceNames', sequenceNames);

  let selectedSequences: any[] = [];

  let selectedSequenceName: any = '';
  let selectedShotName: any = '';
  let selectedTaskName: any = '';

  let filters: HierarchyFilters;
  $: filters = {
    sequence: [selectedSequenceName.value ? selectedSequenceName.value : ''],
    shot: [selectedShotName.value ? selectedShotName.value : ''],
    task: [selectedTaskName.value ? selectedTaskName.value : ''],
  };

  $: depthFilters = [
    (node: PathItem) => node.name.match('Shots'), // Level 0: only folders containing 'Shots'
    (node: PathItem) => node.name.match(selectedSequenceName.value), // Level 1: only sequences with 'Main'
    (node: PathItem) => node.name.match(selectedShotName.value), // Level 2: shots starting with 'Sh'
    (node: PathItem) => node.name.match(selectedTaskName.value), // Level 3: only CAEN department
    (node: PathItem) => node.name.includes(''), // Level 4: only v042 files
  ];

  $: filteredItems = filterByDepth(
    pathStructure,
    depthFilters,
    onlyShowLatestVersions,
  );

  // $: console.log('filteredItems', JSON.stringify(filteredItems));

  const handleOnMenuChange = (value: any) => {
    console.log(selectedShotName);
    console.log(selectedSequenceName);
    console.log(selectedTaskName);
    console.log(filters);
  };

  const loadShotLibrary = async () => {
    isLoading = true;
    const projectFile = await evalES(`getProjectFile()`, false);

    const rootFolder = PROJECT_ROOT(projectFile);
    const res = await getShotFilesTree(rootFolder);
    pathStructure = res;
    const folderNames = collectFolderNamesByLevel(res);
    shotNames = [
      { value: '', label: 'All Shots', selected: true },
      ...folderNames[2].map((shotName) => ({
        value: shotName,
        label: shotName,
        selected: true,
      })),
    ];
    sequenceNames = [
      { value: '', label: 'All Sequences', selected: true },
      ...folderNames[1].map((sequenceName) => ({
        value: sequenceName,
        label: sequenceName,
        selected: true,
      })),
    ];
    taskNames = [
      { value: '', label: 'All Tasks', selected: true },
      ...folderNames[3].map((taskName) => ({
        value: taskName,
        label: taskName,
        selected: true,
      })),
    ];

    selectedSequenceName = sequenceNames[0];
    selectedShotName = shotNames[0];
    selectedTaskName = taskNames[0];
    isLoading = false;
  };

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

  onMount(() => {
    loadShotLibrary();
  });
</script>

<div>
  <div class="flex-row-between">
    <div class="flex-row-start">
      <Toggle bind:checked={onlyShowLatestVersions} />
      <span>Only show latest versions</span>
    </div>
    <div class="flex-row-end">
      <button on:click={loadShotLibrary}>
        <RefreshCcw size={16} />
      </button>
      <button on:click={importAllVisible}>
        <Download size={16} />
      </button>
    </div>
  </div>
  <div class="flex-row-start">
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
    <MenuSelect
      items={taskNames}
      placeholder="Task"
      bind:value={selectedTaskName}
      onChange={handleOnMenuChange}
    />
  </div>

  <div class="tree-container">
    {#if isLoading}
      <div>Loading files ...</div>
    {/if}
    {#if !isLoading}
      <div class="tree-structure">
        {#each flattenTree(filteredItems) as { node, depth }}
          <div
            class="tree-item {node.type} {selectedItemId === node.id
              ? 'selected'
              : ''}"
            style="margin-left: {depth * 20}px;"
            on:click={(e) => {
              e.stopPropagation();
              selectedItemId = node.id;
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
                  <FilePlay color="white" size="20" strokeWidth="1" />
                {/if}
              </div>

              <div class="item-content">
                <div
                  class="item-info"
                  on:keydown={(e) => {
                    e.preventDefault();
                    if (e.key === 'Enter') {
                      importItem(node.id);
                    }
                  }}
                  on:dblclick={() => importItem(node.id)}
                >
                  <span class={`item-name`}>{node.name || '[empty]'}</span>
                  {#if node.type === 'file'}
                    <button on:click={() => importItem(node.id)}
                      ><Download size="16" color="white" /></button
                    >
                  {/if}
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
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
    margin-bottom: 2px;
    border-radius: 3px;
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
</style>
