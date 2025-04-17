<script lang="ts">
  import { onMount } from 'svelte';
  import { fs, path } from '../../lib/cep/node';
  import { computePosition } from '@floating-ui/dom';
  import {
    Folder,
    File,
    ArrowUp,
    ArrowDown,
    Pencil,
    ListPlus,
    ChevronDown,
    ChevronRight,
    Trash,
    ChevronUp,
    SquarePlus,
    Plus,
    Save,
  } from 'lucide-svelte';
  import { evalES } from '../../lib/utils/bolt';
  import { generateId } from '../../lib/utils/utils';
  import SelectFolderWeb from '../../components/SelectFolder/SelectFolderWeb.svelte';
  import MenuSelect from '../../components/MultiSelect/MenuSelect.svelte';
  import { lastFolderExport, localAppStore } from '../../stores/local-storage';
  import { getPreferenceByKey } from '../../api/preferences';
  import ModalSettings from '../../components/Modal/ModalSettings.svelte';
  import { appStore } from '../../stores/app-store';
  import {
    Exporter,
    PathItem,
    CompRenderData,
    addToRenderQueue,
    addCompsToRenderQueue,
  } from '../../api/exporter';
  import {
    getExporterPresets,
    setExporterPresets,
  } from '../../api/preferences';
  import { createFloatingActions } from 'svelte-floating-ui';
  // @ts-ignore
  import { offset, flip, shift } from 'svelte-floating-ui/dom';
  import { appId } from '../../lib/utils/cep';
  import { notifications } from '../../stores/notifications-store';

  //
  let isEditing = false;
  let activeElement: HTMLInputElement | null = null;
  let tokenDropdownRef: HTMLDivElement | null = null;

  const [floatingRef, floatingContent] = createFloatingActions({
    strategy: 'absolute',
    placement: 'top',
    middleware: [offset(6), flip(), shift()],
  });
  $: console.log(tokenDropdownRef);

  // Available tokens for path construction
  const aeAvailableTokens = [
    { name: 'Comp Name', token: '{shot}' },
    { name: 'Project Version', token: '{project_version}' },
    { name: 'Version', token: '{version}' },
    { name: 'Task Name', token: '{task}' },
  ];
  const pproAvailableTokens = [
    { name: 'Sequence Name', token: '{sequence}' },
    { name: 'Project Version', token: '{project_version}' },
    { name: 'Version', token: '{version}' },
    { name: 'Task Name', token: '{task}' },
  ];

  const availableTokens =
    appId === 'AEFT' ? aeAvailableTokens : pproAvailableTokens;

  $: modalOpen = false;
  $: showBuildPreset = false;

  let pathStructure: PathItem[] = [];
  let version = 0;
  $: versionString = `v${version.toString().padStart(3, '0')}`;

  $: console.log(pathStructure);

  // Default exporters for different file types
  let outputModules: string[] = [];

  $: outputModulesSelectItems = outputModules.map((module) => ({
    value: module,
    label: module,
  }));
  let selectedOutputModuleMenuItem = { label: '', value: '' };
  $: selectedOutputModule = outputModules.find(
    (module) => module === selectedOutputModuleMenuItem.value
  );

  let rootFolder = '';

  // Preset Name
  let presetName = '';
  $: presetNameExists = exportPresets.some(
    (preset) => preset.name === presetName
  );

  $: validPresetName = presetName.length < 5 || presetNameExists;

  // Exporter presets
  let exportPresets: Exporter[] = [];
  $: exportPresetsSelectItems = exportPresets.map((preset: Exporter) => ({
    value: preset.name,
    label: preset.name,
  }));

  let selectedExportPresetMenuItem = { label: '', value: '' };
  let selectedExportPreset: Exporter = exportPresets[0];

  // Initialize with a basic hierarchical structure
  onMount(async () => {
    tokenDropdownRef = document.querySelector('.dropdown-container');
    if ($appStore.rememberLastExportPath) {
      lastFolderExport.set($lastFolderExport);
    }
    rootFolder = $lastFolderExport;

    const storedExportPresets = await getExporterPresets(appId);
    console.log('storedExportPresets', storedExportPresets);
    if (storedExportPresets.length > 0) {
      exportPresets = storedExportPresets;
      selectedExportPreset = exportPresets[0];
      exportPresetsSelectItems = exportPresets.map((preset: Exporter) => ({
        value: preset.name,
        label: preset.name,
      }));
      selectedExportPresetMenuItem = exportPresetsSelectItems[0];
    }

    if (exportPresets.length > 0) {
      pathStructure = exportPresets[0].path;
    }

    const renderSettings = JSON.parse(
      await evalES('getOutputModulesTemplates()')
    );
    outputModules = renderSettings.filter(
      (p: string) => !p.startsWith('_HIDDEN')
    );
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
    lastFolderExport.set(path);
    if ($appStore.rememberLastExportPath) {
      lastFolderExport.set(path);
    }

    rootFolder = path;
  }

  function handleOnChangeExportPreset(value: { value: string; label: string }) {
    selectedExportPresetMenuItem = value;
    selectedExportPreset = exportPresets.find(
      (preset) => preset.name === value.value
    );
    pathStructure = selectedExportPreset.path;
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

  //Function ti add a new preset
  function addExporter(name: string): Exporter {
    // first check if the name already exists
    if (exportPresets.some((preset) => preset.name === name)) {
      notifications.error(
        'Exporter preset with this name already exists',
        2000
      );
      return;
    }

    const newExporter = {
      name: name,
      previewPath: '{shot}',
      path: [
        {
          id: generateId(),
          type: 'folder',
          name: '{shot}',
          expanded: true,
          path: '{shot}',
          isEditing: false,
          parentId: null,
          children: [],
        },
      ] as PathItem[],
      rootFolder: '',
      latestVersion: 0,
    };
    exportPresets.push(newExporter);
    selectedExportPreset = newExporter;
    exportPresetsSelectItems = exportPresets.map((preset: Exporter) => ({
      value: preset.name,
      label: preset.name,
    }));
    selectedExportPresetMenuItem =
      exportPresetsSelectItems[exportPresets.length - 1];
    pathStructure = selectedExportPreset.path;
    return newExporter;
  }

  // Function to save the current preset
  function saveExporter() {
    const updatedExportPreset = {
      ...selectedExportPreset,
      path: pathStructure,
    };
    const updatedExportPresets = exportPresets.map((preset) =>
      preset.name === selectedExportPreset.name ? updatedExportPreset : preset
    );
    setExporterPresets(appId, updatedExportPresets).then((result) => {
      if (result) {
        exportPresets = updatedExportPresets;
        exportPresetsSelectItems = exportPresets.map((preset: Exporter) => ({
          value: preset.name,
          label: preset.name,
        }));
        selectedExportPresetMenuItem = exportPresetsSelectItems.find(
          (preset) => preset.value === selectedExportPreset.name
        );
        pathStructure = selectedExportPreset.path;

        notifications.success('Exporter preset saved successfully', 2000);
      } else {
        notifications.error('Failed to save exporter preset', 2000);
      }
    });
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
    console.log('editItem', itemId);
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

  // Function to handle token addition
  function handleAddToken(token: { token: string; name: string }) {
    console.log('adding token', token);

    updateNodeInTree(pathStructure, selectedItemId, (node) => ({
      ...node,
      name: `${selectedNode.name}${token.name}`,
    }));
  }

  // Variables for autocomplete
  let suggestedTokens: { name: string; token: string }[] = [];
  let showSuggestions = false;
  let currentInputValue = '';
  let currentNodeId = '';

  // Function to check for token suggestion
  function updateSuggestions(input: HTMLInputElement) {
    const value = input.value;
    currentInputValue = value;
    currentNodeId = input.dataset.id || '';

    const cursorPos = input.selectionStart || 0;
    const textBeforeCursor = value.substring(0, cursorPos);

    // Check if we're in the middle of typing a token (starting with '{')
    const tokenStartPos = textBeforeCursor.lastIndexOf('{');
    if (
      tokenStartPos >= 0 &&
      textBeforeCursor.indexOf('}', tokenStartPos) === -1
    ) {
      // We have an opening brace without a closing one
      const partialToken = textBeforeCursor
        .substring(tokenStartPos)
        .toLowerCase();

      // Filter available tokens based on the partial input
      suggestedTokens = availableTokens.filter(
        (token) =>
          token.token.toLowerCase().includes(partialToken) ||
          token.name.toLowerCase().includes(partialToken.substring(1))
      );

      showSuggestions = suggestedTokens.length > 0;
    } else {
      showSuggestions = false;
    }
  }

  // Function to insert a token at cursor position
  function insertToken(input: HTMLInputElement, token: string) {
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const beforeCursor = input.value.substring(0, start);
    const afterCursor = input.value.substring(end);

    // If we're in the middle of typing a token, replace just that part
    const tokenStartPos = beforeCursor.lastIndexOf('{');
    let newValue = '';

    if (tokenStartPos >= 0 && !beforeCursor.includes('}', tokenStartPos)) {
      // Replace the partial token
      newValue = beforeCursor.substring(0, tokenStartPos) + token + afterCursor;
      input.value = newValue;

      // Position cursor after the inserted token
      const newCursorPos = tokenStartPos + token.length;
      input.selectionStart = newCursorPos;
      input.selectionEnd = newCursorPos;
    } else {
      // Normal insertion
      newValue = beforeCursor + token + afterCursor;
      input.value = newValue;

      // Position cursor after the inserted token
      input.selectionStart = start + token.length;
      input.selectionEnd = start + token.length;
    }

    // Update the model - node ID is stored in the data-id attribute
    const nodeId = input.dataset.id;
    if (nodeId) {
      pathStructure = updateNodeInTree(pathStructure, nodeId, (node) => ({
        ...node,
        name: input.value,
      }));
    }

    // Use setTimeout to ensure we maintain focus after the token insertion
    setTimeout(() => {
      // Focus the input and make sure it stays in edit mode
      if (input) {
        input.focus();
        showSuggestions = false;
      }
    }, 0);
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
  function buildPathFromNodes(nodes: PathItem[]): string {
    let paths: string = '';
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
        paths = path.join('/');
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
        paths += path.join('/') + '/';
      }
    }

    return paths;
  }

  // Cache for path previews to reduce rebuilds
  let pathPreviewsCache: string = '';
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

  // Generate the full path preview with memoization to prevent excessive recalculation
  function getMemoizedPaths(nodes: PathItem[]): string {
    const structureJson = JSON.stringify(nodes);
    if (structureJson !== lastPathStructure) {
      pathPreviewsCache = buildPathFromNodes(nodes);
      lastPathStructure = structureJson;
    }
    return pathPreviewsCache;
  }

  function closeModal() {
    console.log('close modal outsie');
    modalOpen = false;
  }

  async function handleAddCompsToRenderQueue() {
    // find all file nodes in selected preset
    if (!selectedExportPreset) {
      return;
    }
    const fileNodes = findNodesByType(selectedExportPreset.path, 'file');
    const outputModules = fileNodes.map((node) => ({
      outputModuleName: node.outputModule,
      outputModuleFilePath: node.path,
    }));

    console.log('fileNodes', fileNodes);
    const comps = JSON.parse(await evalES('getSelectedCompsForRender()'))
      .comps as CompRenderData[];

    //for all comps add to render queue  with all files node option
    for (const comp of comps) {
      //   for (const fileNode of fileNodes) {
      //     const options = {
      //       rootFolder: rootFolder,
      //       presetsName: fileNode.outputModule,
      //       previewString: fileNode.path,
      //       appId: appId,
      //       version: version,
      //       selectedTask: '',
      //     };
      //     console.log('options', options);
      //     await evalES(`addToRenderQueue(${JSON.stringify(options)})`, false);
      //   }
      const options = {
        rootFolder: rootFolder,
        outputModules: outputModules,
        appId: appId,
        version: version,
        selectedTask: '',
      };
      console.log('options', options);
      await addToRenderQueue(comp, options);
    }
  }

  // Reactive variables for UI updates
  $: pathPreviews = selectedNode ? selectedNode.path : '';
  $: selectedNode = selectedItemId
    ? findNodeById(pathStructure, selectedItemId)
    : null;

  $: console.log('selectedNode', selectedNode);
</script>

<div class="export-path-builder">
  <div class="header">
    <div class="actions">
      <label for="root-folder">Root Folder:</label>
      <SelectFolderWeb
        onChange={setRootFolder}
        bind:value={rootFolder}
        label="Set Root Folder"
      />
    </div>
    <div style="display: flex; align-items: center; gap: 8px;">
      <label for="export-preset">Presets:</label>
      <MenuSelect
        items={exportPresetsSelectItems}
        bind:value={selectedExportPresetMenuItem}
        onChange={handleOnChangeExportPreset}
      />
      <button
        on:click={() => {
          modalOpen = true;
        }}
        class="outline"
        title="edit"
      >
        <Plus />
      </button>
      <button
        on:click={() => {
          showBuildPreset = !showBuildPreset;
        }}
      >
        <Pencil />
      </button>
      <button
        on:click={() => {
          showBuildPreset = true;
        }}
        class="outline"
        title="Delete"
      >
        <Trash />
      </button>
    </div>
    <div class="flex-row-end">
      <label for="increment">Version Number: </label>
      <input type="number" placeholder="Version" bind:value={version} />
    </div>
    <div class="preview">
      <div class="preview-header">Preview:</div>
      <div class="preview-path">
        {pathPreviews}
        <!-- {#each pathPreviews as path}
          <div class="path-item-preview">{path}</div>
        {/each} -->
      </div>
    </div>
    <div class="flex-row-end action-row">
      <button
        title={'Add to Render Queue'}
        class="active"
        on:click={handleAddCompsToRenderQueue}
        disabled={!rootFolder}>Add To Render Queue</button
      >
    </div>
  </div>
  <div class="preset-builder">
    <div class="flex-row-end action-row"></div>
    {#if showBuildPreset}
      <div class="flex-row-between action-row">
        <p style="margin: 4px;">Export Builder</p>
        <button class="outline" title="Save" on:click={saveExporter}>
          <Save />
        </button>
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
                <button
                  class="outline"
                  on:click={() => addFile(selectedNode.id)}
                >
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
                use:floatingRef
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
                        use:floatingRef
                        id="item-name"
                        type="text"
                        placeholder="Enter name type tokens"
                        value={node.name}
                        data-id={node.id}
                        on:blur={(e) => {
                          // Only save on blur if we're not clicking on a suggestion
                          const relatedTarget = e.relatedTarget;
                          if (
                            !relatedTarget ||
                            !relatedTarget.classList.contains('suggestion-btn')
                          ) {
                            saveItem(node.id, e);
                          }
                          isEditing = false;
                        }}
                        on:keydown={(e) => {
                          if (e.key === 'Enter') {
                            if (showSuggestions && suggestedTokens.length > 0) {
                              // Insert the first suggested token
                              insertToken(e.target, suggestedTokens[0].token);
                              e.preventDefault();
                            } else {
                              saveItem(node.id, e);
                            }
                          } else if (e.key === 'Escape') {
                            showSuggestions = false;
                          } else {
                            updateSuggestions(e.target);
                          }
                        }}
                        on:input={(e) => updateSuggestions(e.target)}
                        on:focus={(e) => {
                          activeElement = e.target;
                          updateSuggestions(e.target);
                          isEditing = true;
                        }}
                      />
                    {:else}
                      <div
                        class="item-info"
                        on:dblclick={() => editItem(node.id)}
                      >
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
    {/if}
  </div>
  <!-- Move dropdowns outside the normal flow to ensure they are shown properly -->
  <div
    class="dropdown-container"
    style="position: absolute; top: 100%; left: 0; width: 100%;"
    use:floatingContent
  >
    <!-- Token suggestion dropdown for autocomplete -->
    {#if showSuggestions}
      <div use:floatingContent>
        <div class="suggestions-content">
          {#each suggestedTokens as token}
            <button
              class="suggestion-btn"
              on:mousedown|preventDefault={(e) => {
                // Prevent blur and focus loss on mousedown
                e.preventDefault();
                insertToken(activeElement, token.token);
              }}
            >
              <strong>{token.token}</strong> - {token.name}
            </button>
          {/each}
        </div>
      </div>
    {:else if isEditing}
      <!-- Regular token dropdown when input is focused but no suggestions -->
      <div id="token-dropdown" use:floatingContent>
        <div class="dropdown-content">
          {#each availableTokens as token}
            <button
              class="token-btn"
              on:mousedown|preventDefault={(e) => {
                // Prevent blur and focus loss on mousedown
                e.preventDefault();
                insertToken(activeElement, token.token);
              }}
            >
              {token.name}
              {token.token}
            </button>
          {/each}
        </div>
      </div>
    {/if}
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

{#if modalOpen}
  <ModalSettings onClose={closeModal}>
    <div id="modal-content">
      <div class="flex-row-start">
        <label for="name">Preset name</label>
        <input
          type="text"
          id="name"
          name="name"
          bind:value={presetName}
          class={`${validPresetName ? 'box-error' : ''}`}
        />
      </div>
      <div class="flex-row-end">
        <button
          class="active"
          on:click={() => {
            addExporter(presetName);
            modalOpen = false;
            showBuildPreset = true;
          }}
          disabled={!presetName || validPresetName}
        >
          Save Preset
        </button>
      </div>
    </div>
  </ModalSettings>
{/if}

<style lang="scss">
  @use '../../variables.scss' as *;
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
    align-content: center;
    align-items: center;
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

  .token-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 100;
    display: none;
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
    width: 24px;
    text-align: center;
    margin-right: 5px;
  }

  .item-content {
    flex: 1;
    position: relative;
    display: flex;
    z-index: 500; /* Add z-index to ensure content stays above other elements */
  }

  .item-name {
    font-family: monospace;
    text-align: left;
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
    position: relative; /* Changed from absolute */
    width: 100%;
    z-index: 1000; /* High z-index */
    display: block; /* Always visible when needed */
  }

  .token-tag {
    display: inline-block;
    padding: 2px 2px;
    border-radius: 3px;
    background-color: $dark;
    color: #e0e0e0;
    font-family: monospace;
    font-size: 11px;
    height: 16px;
  }

  /* Always show token dropdown when input is focused */
  .item-content input:focus ~ .token-dropdown {
    display: block !important;
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
    position: absolute !important;
    top: 100% !important;
    left: 0 !important;
    width: 100% !important;
    z-index: 2000 !important; /* Even higher z-index */
    pointer-events: auto !important; /* Ensure clicks are captured */
  }

  /* Autocomplete suggestions styling */
  .suggestions-dropdown {
    position: relative; /* Changed from absolute */
    width: 100%;
    display: block; /* Always visible when active */
    z-index: 1500; /* High z-index */
  }

  .suggestions-content {
    background-color: $extra-dark; /* Slightly blue tint to make it stand out */
    border: 1px solid $active;
    border-radius: 3px;
    padding: 5px;
    display: flex;
    flex-direction: column;
    gap: 3px;
    max-height: 160px;
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 80, 0.4);
    margin-top: 2px;
  }

  .suggestion-btn {
    border: none;
    color: #e0e0e0;
    padding: 6px 8px;
    border-radius: 3px;
    text-align: left;
    cursor: pointer;
    transition: background-color 0.2s;
    font-size: 12px;
    display: flex;
    justify-content: space-between;
  }

  .suggestion-btn:hover {
    background-color: #5a5a5a;
  }

  .suggestion-btn strong {
    color: $highlight;
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
    padding: 2px;
    font-size: 11px;
    border-radius: 3px;
    display: flex;
    flex-direction: row;
    align-items: top;
    margin-bottom: 4px;
  }

  .preview-path {
    margin-left: 4px;
    font-family: monospace;
    word-break: break-all;
    max-height: 150px;
    overflow-y: auto;
    text-align: initial;
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

  #token-dropdown {
    width: max-content;
    position: absolute;
    top: 0;
    left: 0;
    background: #222;
    color: white;
    font-weight: bold;
    padding: 5px;
    border-radius: 4px;
    font-size: 90%;
    z-index: 1000;
  }

  .floating {
    background: red;
    color: white;
    font-weight: bold;
    padding: 5px;
    border-radius: 4px;
    font-size: 90%;
    z-index: 1000;
  }

  .box-error {
    border: 1px solid #ed553b;
  }
</style>
