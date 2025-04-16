<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Folder,
    File,
    ArrowUp,
    ArrowDown,
    Pencil,
    Settings,
    ChevronDown,
    ChevronRight,
    Trash,
  } from 'lucide-svelte';
  import { evalES } from '../../lib/utils/bolt';
  import SelectFolderWeb from '../../components/SelectFolder/SelectFolderWeb.svelte';
  import MenuSelect from '../../components/MultiSelect/MenuSelect.svelte';

  //
  let activeElement: HTMLInputElement | null = null;

  // Available tokens for path construction
  const availableTokens = [
    { name: 'Comp Name', token: '{comp}' },
    { name: 'Project Version', token: '{project_version}' },
    { name: 'Version', token: '{version}' },
    { name: 'Frame Number', token: '{frame}' },
    { name: 'Task Name', token: '{task}' },
  ];

  // Path structure components using hierarchical tree structure
  interface PathItem {
    id: string;
    type: 'folder' | 'file';
    path: string;
    name: string;
    isEditing: boolean;
    outputModule?: string;
    children?: PathItem[];
    expanded?: boolean;
    parentId?: string | null;
  }

  let pathStructure: PathItem[] = [];

  $: console.log(pathStructure);

  // Default exporters for different file types
  let outputModules: string[] = [
    'PNG Sequence',
    'JPEG Sequence',
    'EXR Sequence',
    'ProRes 4444',
    'ProRes 422 HQ',
    'H.264',
  ];

  $: outputModulesSelectItems = outputModules.map((module) => ({
    value: module,
    label: module,
  }));
  let selectedOutputModuleMenuItem = { label: '', value: '' };
  $: selectedOutputModule = outputModules.find(
    (module) => module === selectedOutputModuleMenuItem.value
  );

  let rootFolder = '';

  interface ExportPreset {
    name: string;
    path: PathItem[];
  }

  let exportPresets: ExportPreset[] = [
    {
      name: 'Buck Default',
      path: [
        {
          type: 'folder',
          name: 'renders',
          path: 'renders',
          children: [],
          id: generateId(),
          isEditing: false,
          parentId: null,
        },
      ],
    },
    {
      name: 'AEFTDefault',
      path: [
        {
          type: 'folder',
          name: 'renders',
          path: 'renders',
          children: [],
          id: generateId(),
          isEditing: false,
          parentId: null,
        },
      ],
    },
    {
      name: 'Default',
      path: [
        {
          type: 'folder',
          name: 'renders',
          path: 'renders',
          children: [],
          id: generateId(),
          isEditing: false,
          parentId: null,
        },
      ],
    },
    {
      name: 'Default',
      path: [
        {
          type: 'folder',
          name: 'renders',
          path: 'renders',
          children: [],
          id: generateId(),
          isEditing: false,
          parentId: null,
        },
      ],
    },
    {
      name: 'Default',
      path: [
        {
          type: 'folder',
          name: 'renders',
          path: 'renders',
          children: [],
          id: generateId(),
          isEditing: false,
          parentId: null,
        },
      ],
    },
  ];
  let exportPresetsSelectItems: { value: string; label: string }[] =
    exportPresets.map((preset: ExportPreset) => ({
      value: preset.name,
      label: preset.name,
    }));

  let selectedExportPresetMenuItem = exportPresetsSelectItems[0];
  let selectedExportPreset: ExportPreset = exportPresets[0];

  // Generate a unique ID for each path item
  function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  // Initialize with a basic hierarchical structure
  onMount(async () => {
    const rootId = generateId();
    const rendersId = generateId();

    pathStructure = [
      {
        id: rootId,
        type: 'folder',
        name: '{comp}',
        path: '{comp}',
        isEditing: false,
        expanded: true,
        parentId: null,
        children: [
          {
            id: rendersId,
            type: 'folder',
            name: 'renders',
            path: 'renders',
            isEditing: false,
            expanded: true,
            parentId: rootId,
            children: [
              {
                id: generateId(),
                type: 'file',
                name: '{comp}_{version}.####.{ext}',
                path: '{comp}_{version}.####.{ext}',
                outputModule: 'Prores 422HQ',
                isEditing: false,
                parentId: rendersId,
                children: [],
              },
            ],
          },
        ],
      },
    ];

    const renderSettings = JSON.parse(
      await evalES('getOutputModulesTemplates()')
    );
    outputModules = renderSettings as string[];
    selectedOutputModule = outputModules[0];
    outputModulesSelectItems = outputModules.map((module) => ({
      value: module,
      label: module,
    }));
    selectedOutputModuleMenuItem = outputModulesSelectItems[0];
  });

  // Variable to track the currently selected item for adding children
  let selectedItemId: string | null = null;

  // Function to set the Root Folder
  function setRootFolder(path: string) {
    rootFolder = path;
  }

  function handleOnChangeExportPreset(value: { value: string; label: string }) {
    selectedExportPresetMenuItem = value;
    selectedExportPreset = exportPresets.find(
      (preset) => preset.name === value.value
    );
  }

  function handleOnChangeOutputModule(
    id: string,
    value: { value: string; label: string }
  ) {
    selectedOutputModuleMenuItem = value;
    selectedOutputModule = outputModules.find(
      (module) => module === value.value
    );
    pathStructure = updateNodeInTree(pathStructure, id, (node) => ({
      ...node,
      outputModule: selectedOutputModule,
    }));
  }

  // Function to add a new folder
  function addFolder(parentId: string | null = null) {
    const newFolder = {
      id: generateId(),
      type: 'folder' as const,
      name: 'new_folder',
      isEditing: true,
      path: 'new_folder',
      expanded: true,
      parentId: parentId,
      children: [] as PathItem[],
    };

    if (parentId === null) {
      // Add to root level
      pathStructure = [...pathStructure, newFolder];
    } else {
      // Add as a child of the selected parent
      pathStructure = addChildToNode(pathStructure, parentId, newFolder);
    }
  }

  // Function to add a new file
  function addFile(parentId: string | null = null) {
    const newFile = {
      id: generateId(),
      type: 'file' as const,
      name: '{comp}_{version}.####.{ext}',
      isEditing: true,
      path: '{comp}_{version}.####.{ext}',
      outputModule: selectedOutputModule,
      parentId: parentId,
      children: [] as PathItem[],
    };

    if (parentId === null) {
      // Add to root level
      pathStructure = [...pathStructure, newFile];
    } else {
      // Add as a child of the selected parent
      pathStructure = addChildToNode(pathStructure, parentId, newFile);
    }
  }

  // Helper function to add a child to a specific node in the tree
  function addChildToNode(
    nodes: PathItem[],
    parentId: string,
    newChild: PathItem
  ): PathItem[] {
    return nodes.map((node) => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [...(node.children || []), newChild],
          expanded: true, // Auto-expand when adding children
        };
      } else if (node.children && node.children.length > 0) {
        return {
          ...node,
          children: addChildToNode(node.children, parentId, newChild),
        };
      }
      return node;
    });
  }

  // Function to edit an item by ID
  function editItem(itemId: string) {
    pathStructure = updateNodeInTree(pathStructure, itemId, (node) => ({
      ...node,
      isEditing: true,
    }));
  }

  // Function to save edits
  function saveItem(itemId: string, event: Event) {
    const newName = (event.target as HTMLInputElement).value;
    pathStructure = updateNodeInTree(pathStructure, itemId, (node) => ({
      ...node,
      name: newName,
      isEditing: false,
    }));
  }

  // Function to delete an item
  function deleteItem(itemId: string) {
    // First find the parent of this item
    const findParent = (nodes: PathItem[]): string | null => {
      for (const node of nodes) {
        if (node.children) {
          if (node.children.some((child) => child.id === itemId)) {
            return node.id;
          }
          const foundInChild = findParent(node.children);
          if (foundInChild) return foundInChild;
        }
      }
      return null;
    };

    const parentId = findParent(pathStructure);

    if (parentId) {
      // Item is a child of another node
      pathStructure = updateNodeInTree(pathStructure, parentId, (node) => ({
        ...node,
        children: (node.children || []).filter((child) => child.id !== itemId),
      }));
    } else {
      // Item is at the root level
      pathStructure = pathStructure.filter((item) => item.id !== itemId);
    }
  }

  // Function to toggle node expansion
  function toggleExpand(itemId: string) {
    pathStructure = updateNodeInTree(pathStructure, itemId, (node) => ({
      ...node,
      expanded: !node.expanded,
    }));
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
    updateFn: (node: PathItem) => PathItem
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

  // Function to insert a token at cursor position
  function insertToken(input: HTMLInputElement, token: string) {
    // const start = input.selectionStart || 0;
    // const end = input.selectionEnd || 0;
    // const beforeCursor = input.value.substring(0, start);
    // const afterCursor = input.value.substring(end);
    // input.value = beforeCursor + token + afterCursor;
    console.log('inserting token', token);
    input.value += token;

    // Update the model - node ID is stored in the data-id attribute
    const nodeId = input.dataset.id;
    if (nodeId) {
      pathStructure = updateNodeInTree(pathStructure, nodeId, (node) => ({
        ...node,
        name: input.value,
      }));
    }

    // Set cursor position after the inserted token
    // input.selectionStart = start + token.length;
    // input.selectionEnd = start + token.length;
    input.focus();
  }

  // Function to flatten the tree for iterative rendering
  function flattenTree(
    nodes: PathItem[]
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

  // Helper function to build paths (iterative version)
  function buildPathFromNodes(nodes: PathItem[]): string[] {
    const paths: string[] = [];
    const stack: Array<{ node: PathItem; path: string[] }> = [];

    // Initialize stack with root nodes
    for (const node of nodes) {
      stack.push({
        node,
        path: [node.name],
      });
    }

    // Process stack iteratively
    while (stack.length > 0) {
      const { node, path } = stack.pop()!;

      if (node.type === 'file') {
        paths.push(path.join('/'));
      } else if (node.children && node.children.length > 0) {
        // Add children to stack
        for (const child of node.children) {
          stack.push({
            node: child,
            path: [...path, child.name],
          });
        }
      } else {
        // Empty folder
        paths.push(path.join('/') + '/');
      }
    }

    return paths;
  }

  // Cache for path previews to reduce rebuilds
  let pathPreviewsCache: string[] = [];
  let lastPathStructure: string = '';

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

  // Generate the full path preview with memoization to prevent excessive recalculation
  function getMemoizedPaths(nodes: PathItem[]): string[] {
    const structureJson = JSON.stringify(nodes);
    if (structureJson !== lastPathStructure) {
      pathPreviewsCache = buildPathFromNodes(nodes);
      lastPathStructure = structureJson;
    }
    return pathPreviewsCache;
  }

  // Reactive variables for UI updates
  $: pathPreviews = getMemoizedPaths(pathStructure);
  $: fullPath = pathPreviews.join('\n');
  $: selectedNode = selectedItemId
    ? findNodeById(pathStructure, selectedItemId)
    : null;
</script>

<div class="export-path-builder">
  <div class="header">
    <div class="actions">
      <SelectFolderWeb onChange={setRootFolder} label="Set Root Folder" />
      <div style="display: flex; align-items: center; gap: 8px;">
        <label for="export-preset">Presets:</label>
        <MenuSelect
          items={exportPresetsSelectItems}
          bind:value={selectedExportPresetMenuItem}
          onChange={handleOnChangeExportPreset}
        />
      </div>
    </div>
  </div>

  <div class="tokens">
    <div class="token-list">
      {#each availableTokens as token}
        <button class="token-btn" title={token.name}>
          {token.token}
        </button>
      {/each}
    </div>
  </div>
  <!-- Item actions panel - outside the tree -->
  <div class="item-actions-panel">
    {#if selectedItemId}
      {@const selectedNode = findNodeById(pathStructure, selectedItemId)}
      {#if selectedNode}
        <div class="action-buttons">
          {#if selectedNode.type === 'folder'}
            <button
              on:click={() => addFolder(selectedNode.id)}
              class="outline"
              title="Add Folder"
            >
              <Folder />
            </button>
            <button class="outline" on:click={() => addFile(selectedNode.id)}>
              <File />
            </button>
          {/if}
          {#if selectedNode.type === 'file'}
            <MenuSelect
              items={outputModulesSelectItems}
              bind:value={selectedOutputModuleMenuItem}
              onChange={() =>
                handleOnChangeOutputModule(
                  selectedNode.id,
                  selectedOutputModuleMenuItem
                )}
            />
          {/if}
          <button
            on:click={() => editItem(selectedNode.id)}
            class="outline"
            title="Edit"
          >
            <Pencil />
          </button>
          <button
            on:click={() => deleteItem(selectedNode.id)}
            class="outline"
            title="Delete"
          >
            <Trash />
          </button>
        </div>
      {/if}
    {:else}
      <p class="no-selection">Select a folder or file to see actions</p>
    {/if}
    <div class="container">
      <div class="tree-structure">
        <!-- Non-recursive flat tree rendering -->
        {#each flattenTree(pathStructure) as { node, depth }}
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
                  <Folder color="white" size="16" />
                {:else}
                  <File color="white" size="16" />
                {/if}
              </div>

              <div class="item-content">
                {#if node.isEditing}
                  <input
                    id="item-name"
                    type="text"
                    placeholder="Enter name"
                    value={node.name}
                    data-id={node.id}
                    on:blur={(e) => saveItem(node.id, e)}
                    on:keydown={(e) =>
                      e.key === 'Enter' && saveItem(node.id, e)}
                    on:focus={(e) => (activeElement = e.target)}
                  />
                  <div class="token-dropdown">
                    <div class="dropdown-content">
                      {#each availableTokens as token}
                        <button
                          class="token-btn"
                          on:click={() =>
                            insertToken(activeElement, token.token)}
                        >
                          {token.name} ({token.token})
                        </button>
                      {/each}
                    </div>
                  </div>
                {:else}
                  <div class="item-info">
                    <span class="item-name">{node.name}</span>
                    {#if node.type === 'file' && node.outputModule}
                      <span class="exporter">{node.outputModule}</span>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <div class="preview">
    <div class="preview-header">Path Preview:</div>
    <div class="preview-path">
      {#each pathPreviews as path}
        <div class="path-item-preview">{path}</div>
      {/each}
    </div>
  </div>

  {#if pathStructure.some((item) => item.type === 'file')}
    <div class="exporter-selector">
      <div class="exporter-header">Default Exporter:</div>
      <select bind:value={selectedOutputModule}>
        {#each outputModules as outputModule}
          <option value={outputModule}>{outputModule}</option>
        {/each}
      </select>
    </div>
  {/if}
</div>

<style lang="scss">
  @use '../../variables.scss' as *;
  .export-path-builder {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #2d2d2d;
    color: #e0e0e0;
    padding: 15px;
    border-radius: 5px;
    max-width: 800px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    border-bottom: 1px solid #444;
    padding-bottom: 10px;
  }

  .header h2 {
    margin: 0;
    font-size: 18px;
  }

  .actions {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
  }

  .tokens {
    margin-bottom: 15px;
  }

  .tokens-header {
    font-size: 14px;
    margin-bottom: 5px;
  }

  .token-list {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .token-btn {
    background-color: #3a3a3a;
    border: 1px solid #555;
    color: #e0e0e0;
    padding: 2px 5px;
    border-radius: 3px;
    font-size: 12px;
    cursor: pointer;
  }

  .token-btn:hover {
    background-color: #4a4a4a;
  }

  .tree-structure {
    flex: 1;
    border: 1px solid #444;
    border-radius: 3px;
    max-height: 300px;
    overflow-y: auto;
    padding: 5px;
  }

  .tree-item {
    margin-bottom: 2px;
    border-radius: 3px;
  }

  .tree-item.selected > .item-header {
    background-color: $darker;
    border: 1px solid $highlight;
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
    width: 24px;
    text-align: center;
    margin-right: 5px;
  }

  .item-content {
    flex: 1;
    position: relative;
    display: flex;
  }

  .item-name {
    font-family: monospace;
  }

  .exporter {
    font-size: 11px;
    color: #aaa;
    margin-left: 10px;
  }

  .item-content input {
    background-color: $extra-dark;
    border: 1px solid #555;
    color: #e0e0e0;
    padding: 3px 5px;
    border-radius: 3px;
    width: calc(100% - 10px);
    font-family: monospace;
  }

  .item-info {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-right: 8px;
  }
  .token-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 10;
    display: none;
  }

  .item-content input:focus + .token-dropdown {
    display: block;
  }

  .dropdown-content {
    background-color: #3a3a3a;
    border: 1px solid #555;
    border-radius: 3px;
    padding: 5px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .item-actions {
    display: flex;
    gap: 5px;
  }

  .action-btn {
    background: none;
    border: none;
    color: #aaa;
    cursor: pointer;
    font-size: 12px;
    padding: 2px;
  }

  .action-btn:hover {
    color: #fff;
  }

  /* Container for tree and actions */
  .container {
    display: flex;
    gap: 10px;
  }

  /* Item actions panel */
  .item-actions-panel {
    flex: 0 0 200px;
    background-color: #333;
    border-radius: 5px;
    padding: 4px;
    border: 1px solid #444;
  }

  .item-actions-panel h3 {
    margin-top: 0;
    margin-bottom: 4%;
    font-size: 11px;
    color: #ddd;
    border-bottom: 1px solid #444;
    padding-bottom: 5px;
    word-break: break-word;
  }

  .action-buttons {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    gap: 2px;
    margin-bottom: 4px;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 6px 10px;
    border-radius: 3px;
    background-color: #444;
    border: none;
    color: #e0e0e0;
    cursor: pointer;
    font-size: 13px;
    transition: background-color 0.2s;
  }

  .action-btn.primary {
    background-color: #345995;
  }

  .action-btn.danger {
    background-color: #873e23;
  }

  .action-btn:hover {
    filter: brightness(1.2);
  }

  .no-selection {
    color: #888;
    font-style: italic;
    font-size: 13px;
    text-align: center;
  }

  .preview {
    margin-bottom: 15px;
    padding: 10px;
    background-color: #3a3a3a;
    border-radius: 3px;
  }

  .preview-header {
    font-size: 14px;
    margin-bottom: 5px;
  }

  .preview-path {
    font-family: monospace;
    word-break: break-all;
    max-height: 150px;
    overflow-y: auto;
  }

  .path-item-preview {
    padding: 3px 0;
    border-bottom: 1px dotted #444;
  }

  .path-item-preview:last-child {
    border-bottom: none;
  }

  .exporter-selector {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .exporter-header {
    font-size: 14px;
  }

  select {
    background-color: #3a3a3a;
    border: 1px solid #555;
    color: #e0e0e0;
    padding: 5px;
    border-radius: 3px;
  }
</style>
