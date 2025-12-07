<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';
  import { path } from '@/lib/cep/node';

  interface FileEntry {
    name: string;
    filepath: string;
    frameRange: string;
    versions: string[];
  }

  interface ClipEntry {
    file: string;
    frameRange: string;
  }

  interface TreeNode {
    name: string;
    isDirectory: boolean;
    children: Record<string, TreeNode>;
    files: FileEntry[];
    expanded: boolean;
    path: string;
  }

  export let clips: ClipEntry[] = [];
  $: files = [] as FileEntry[];
  export let filterName = '';

  const dispatch = createEventDispatcher();
  let treeRoot: TreeNode;
  let currentPath = [];
  let currentFiles = [];
  let breadcrumbs = [];

  $: filterFiles = () => {
    if (filterName === '') {
      return currentFiles;
    } else {
      return currentFiles.filter(
        (file) =>
          file.name.toLowerCase().includes(filterName.toLowerCase()) ||
          file.filepath.toLowerCase().includes(filterName.toLowerCase())
      );
    }
  };

  $: initFiles = () => {
    // First group all files by basename without version
    const groupedFiles = clips.reduce((acc, clip) => {
      // Extract basename without version number
      const fullName = path.basename(clip.file);
      const versionMatch = fullName.match(/_v(\d+)/i);
      const version = versionMatch ? versionMatch[1].padStart(3, '0') : '000';
      const baseName = fullName.replace(/_v\d+/i, '');

      if (!acc[baseName]) {
        acc[baseName] = {
          name: baseName,
          filepath: clip.file, // Initial filepath from first occurrence
          frameRange: clip.frameRange,
          versions: [`v${version}`],
        };
      } else {
        // Add this version to the existing file entry
        acc[baseName].versions.push(`v${version}`);

        // Sort versions in descending order (newest first)
        acc[baseName].versions.sort((a, b) => b.localeCompare(a));
      }

      return acc;
    }, {});

    // Convert the grouped files object to an array
    files = Object.values(groupedFiles);

    // Build tree structure from files
    buildFileTree();
  };

  const buildFileTree = () => {
    // Reset tree
    treeRoot = {
      name: 'root',
      isDirectory: true,
      children: {},
      files: [],
      expanded: true,
      path: '',
    };

    files.forEach((file) => {
      // Get directory path without file name
      const dirPath = path
        .dirname(file.filepath)
        .replace(/^(.*?)Production/, '');

      // Split the path into segments
      const pathSegments = dirPath.split(path.sep);

      // Start at the root
      let currentNode = treeRoot;
      let currentPath = '';

      // Create or navigate the directory structure
      pathSegments.forEach((segment) => {
        // Skip empty segments
        if (!segment) return;

        currentPath = currentPath ? path.join(currentPath, segment) : segment;

        // Create node if it doesn't exist
        if (!currentNode.children[segment]) {
          currentNode.children[segment] = {
            name: segment,
            isDirectory: true,
            children: {},
            files: [],
            expanded: false,
            path: currentPath,
          };
        }

        // Move to next node
        currentNode = currentNode.children[segment];
      });

      // Add the file to the leaf node
      currentNode.files.push(file);
    });

    // Initialize with root directory view
    navigateToPath([]);
  };

  const navigateToPath = (pathSegments) => {
    currentPath = pathSegments;

    // Update breadcrumbs
    breadcrumbs = [
      { name: 'Home', path: [] },
      ...pathSegments.map((segment, index) => ({
        name: segment,
        path: pathSegments.slice(0, index + 1),
      })),
    ];

    // Find the node for the current path
    let node = treeRoot;
    for (const segment of pathSegments) {
      node = node.children[segment];
      if (!node) {
        currentFiles = [];
        return;
      }
    }

    // Get directories at this level
    const directories = Object.entries(node.children).map(
      ([name, childNode]) => ({
        name,
        isDirectory: true,
        path: [...pathSegments, name],
      })
    );

    // Get files at this level
    const files = node.files.map((file) => ({
      ...file,
      isDirectory: false,
    }));

    // Combine and sort (directories first, then files)
    currentFiles = [...directories, ...files];
  };

  const handleBreadcrumbClick = (path) => {
    navigateToPath(path);
  };

  const handleDirectoryClick = (path) => {
    navigateToPath(path);
  };

  const handleVersionChange = (file: FileEntry, version: string) => {
    dispatch('versionChange', { file, version });
  };

  onMount(() => {
    initFiles();
  });
</script>

<div>
  <input
    type="text"
    class="filter-input"
    placeholder="Filter by name"
    bind:value={filterName}
    on:input={() => filterFiles()}
  />

  <!-- Breadcrumbs -->
  <div class="breadcrumbs">
    {#each breadcrumbs as crumb, i}
      <span
        class="breadcrumb"
        on:click={() => handleBreadcrumbClick(crumb.path)}
      >
        {crumb.name}
      </span>
      {#if i < breadcrumbs.length - 1}
        <span class="separator">/</span>
      {/if}
    {/each}
  </div>

  <!-- File list -->
  <div class="file-list">
    {#each filterFiles() as item}
      {#if item.isDirectory}
        <div
          class="list-item directory"
          on:click={() => handleDirectoryClick(item.path)}
        >
          <span class="icon">📁</span>
          <span class="item-name">{item.name}</span>
        </div>
      {:else}
        <div class="list-item file">
          <span class="icon">📄</span>
          <span class="item-name">{item.name}</span>
          <select on:change={(e) => handleVersionChange(item, e.target.value)}>
            {#each item.versions as version}
              <option value={version}>{version}</option>
            {/each}
          </select>
        </div>
      {/if}
    {/each}
    {#if filterFiles().length === 0}
      <div class="empty-message">No files found</div>
    {/if}
  </div>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  .filter-input {
    margin-bottom: 10px;
    padding: 5px;
    width: 100%;
  }

  .breadcrumbs {
    display: flex;
    align-items: center;
    padding: 8px;
    background-color: #f5f5f5;
    border-radius: 4px;
    margin-bottom: 10px;
    flex-wrap: wrap;
  }

  .breadcrumb {
    cursor: pointer;
    color: $font;
    &:hover {
      text-decoration: underline;
    }
  }

  .separator {
    margin: 0 8px;
    color: #999;
  }

  .file-list {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 4px;
    max-height: calc(100vh - 200px);
    overflow-y: auto;
  }

  .list-item {
    display: flex;
    align-items: center;
    padding: 8px;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    &.directory {
      cursor: pointer;
      &:hover {
        background-color: #f5f5f5;
      }
    }
  }

  .icon {
    margin-right: 8px;
  }

  .item-name {
    flex-grow: 1;
  }

  .directory .item-name {
    font-weight: bold;
    color: $font;
  }

  select {
    padding: 2px;
    height: 24px;
  }

  .empty-message {
    padding: 16px;
    text-align: center;
    color: #999;
  }
</style>
