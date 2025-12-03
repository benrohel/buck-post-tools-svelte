<script lang="ts">
  import {
    ChevronDown,
    ChevronRight,
    Folder,
    Download,
    Eye,
    Film,
  } from 'lucide-svelte';
  import { type PathItem } from '../../api/exporter';
  import path from 'path';
  import { createEventDispatcher } from 'svelte';

  export let rootFolder: string = '';
  export let items: PathItem[] = [];
  export let existingFiles: string[] = [];
  export let showFileActions: boolean = true;
  export let allowMultiSelect: boolean = true;
  export let height: string = 'calc(100vh - 168px)';

  const dispatch = createEventDispatcher<{
    loadFolder: { folderId: string; folderPath: string };
    openFile: { fileId: string; filePath: string };
    importFile: { fileId: string; filePath: string };
    importFiles: { fileIds: string[]; filePaths: string[] };
    selectionChange: { selectedIds: Set<string> };
  }>();

  let selectedItemIds: Set<string> = new Set();
  let lastClickedId: string | null = null;

  // Function to handle item selection with multi-select support (files only)
  function handleItemClick(itemId: string, event: MouseEvent) {
    const clickedNode = findNodeById(items, itemId);

    if (!clickedNode) return;

    // Only handle selection for files, ignore folder clicks for selection
    if (clickedNode.type !== 'file') return;

    if (!allowMultiSelect) {
      selectedItemIds = new Set([itemId]);
      lastClickedId = itemId;
      dispatch('selectionChange', { selectedIds: selectedItemIds });
      return;
    }

    const flatItems = flattenTree(items).map((item) => item.node);

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

    dispatch('selectionChange', { selectedIds: selectedItemIds });
  }

  // Function to clear selection when clicking outside items
  function handleContainerClick() {
    selectedItemIds = new Set();
    lastClickedId = null;
    dispatch('selectionChange', { selectedIds: selectedItemIds });
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
      const { node, depth, path: nodePath } = item;

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
            path: [...nodePath, child.name],
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
  function buildPath(node: PathItem, allNodes: PathItem[]): string {
    if (node.parentId === null) {
      return node.name;
    }
    const parentNode = findNodeById(allNodes, node.parentId);
    if (!parentNode) {
      return node.name;
    }
    return `${buildPath(parentNode, allNodes)}/${node.name}`;
  }

  // Helper function to update a node in the tree by ID
  function updateNodeInTree(
    nodes: PathItem[],
    nodeId: string,
    updateFn: (node: PathItem) => PathItem,
  ): PathItem[] {
    return nodes.map((node) => {
      if (node.id === nodeId) {
        node.path = buildPath(node, nodes);
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

  // Function to toggle node expansion with lazy loading
  function toggleExpand(itemId: string) {
    const node = findNodeById(items, itemId);
    if (!node || node.type !== 'folder') return;

    // If folder is being expanded and has no children loaded, trigger load
    if (!node.expanded && (!node.children || node.children.length === 0)) {
      dispatch('loadFolder', { folderId: itemId, folderPath: node.path });
    }

    items = updateNodeInTree(items, itemId, (n) => ({
      ...n,
      expanded: !n.expanded,
    }));
  }

  function fileExistsInProject(node: PathItem): boolean {
    const basename = path.basename(node.path);
    return existingFiles.map((file) => path.basename(file)).includes(basename);
  }

  function handleOpenFile(itemId: string) {
    const node = findNodeById(items, itemId);
    if (node && node.type === 'file') {
      dispatch('openFile', { fileId: itemId, filePath: node.path });
    }
  }

  function handleImportFile(itemId: string) {
    const node = findNodeById(items, itemId);
    if (node && node.type === 'file') {
      dispatch('importFile', { fileId: itemId, filePath: node.path });
    }
  }

  function handleDoubleClick(itemId: string) {
    if (selectedItemIds.size > 1) {
      handleImportSelected();
    } else {
      handleImportFile(itemId);
    }
  }

  function handleImportSelected() {
    if (selectedItemIds.size === 0) return;

    const allItems = findNodesByType(items, 'file');
    const selectedFiles = allItems
      .filter((item) => selectedItemIds.has(item.id))
      .map((item) => ({ id: item.id, path: item.path }));

    if (selectedFiles.length > 0) {
      dispatch('importFiles', {
        fileIds: selectedFiles.map((f) => f.id),
        filePaths: selectedFiles.map((f) => f.path),
      });
    }
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

  // Export functions that parent components can use
  export function getSelectedItems(): PathItem[] {
    const allItems = findNodesByType(items, 'file');
    return allItems.filter((item) => selectedItemIds.has(item.id));
  }

  export function clearSelection() {
    selectedItemIds = new Set();
    lastClickedId = null;
  }
</script>

<div class="file-browser" style="height: {height};">
  <div class="tree-container" on:click={handleContainerClick}>
    <div class="tree-structure">
      {#each flattenTree(items) as { node, depth }}
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
                    handleDoubleClick(node.id);
                  }
                }}
                on:dblclick={() => handleDoubleClick(node.id)}
              >
                <span class="item-name">{node.name || '[empty]'}</span>
                {#if node.type === 'file' && showFileActions}
                  <div class="flex-row-end">
                    <button on:click={() => handleOpenFile(node.id)}
                      ><Eye size="16" color="white" /></button
                    >
                    <button on:click={() => handleImportFile(node.id)}
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
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:ital,wght@0,100..700;1,100..700&display=swap');

  .file-browser {
    display: flex;
    flex-direction: column;
  }

  .flex-row-end {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 2px;
    position: relative;
  }

  .tree-container {
    display: flex;
    flex-direction: column;
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

  .indent {
    display: inline-block;
    width: 20px;
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

  .item-info {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
