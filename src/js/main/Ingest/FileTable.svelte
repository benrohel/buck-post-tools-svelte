<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { onMount } from 'svelte';
  import { path } from '@/lib/cep/node';
  import { logModule } from '@/lib/logger';

  const log = logModule('file-table');

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
  export let clips: ClipEntry[] = [];
  export let filterName = '';

  const dispatch = createEventDispatcher();
  let filteredFiles: FileEntry[] = [];

  $: files = [] as FileEntry[];

  $: filterFiles = () => {
    if (filterName === '') {
      return files;
    } else {
      return files.filter((file) =>
        file.filepath.toLowerCase().includes(filterName.toLowerCase()),
      );
    }
  };

  // $: initFiles = () => {
  //   files = clips.map((clip) => {
  //     return {
  //       name: path.basename(clip.file),
  //       filepath: clip.file,
  //       frameRange: clip.frameRange,
  //       versions: ['v001', 'v002', 'v003'],
  //     };
  //   });
  // };

  $: initFiles = () => {
    // First group all files by basename without version
    const groupedFiles = clips.reduce<Record<string, FileEntry>>(
      (acc, clip) => {
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
      },
      {} as Record<string, FileEntry>,
    );

    // Convert the grouped files object to an array
    files = Object.values(groupedFiles);
  };

  const handleVersionChange = (file: FileEntry, version: string) => {
    dispatch('versionChange', { file, version });
  };

  onMount(() => {
    initFiles();
  });
</script>

<div style="height: calc(100vh - 150px);overflow-y:hidden;">
  <input
    type="text"
    class="filter-input"
    placeholder="Filter by name"
    bind:value={filterName}
    on:input={filterFiles}
  />
  <div style="height: 100%; overflow-y: auto;">
    <table style="height: 100%; ">
      <thead>
        <tr>
          <th>Name</th>
          <th>Version</th>
        </tr>
      </thead>
      <tbody>
        {#each filterFiles() as file}
          <tr>
            <td>{file.name}</td>
            <td>
              <select
                on:change={(e) =>
                  handleVersionChange(file, e.currentTarget.value)}
              >
                {#each file.versions as version}
                  <option value={version}>{version}</option>
                {/each}
              </select>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    border: 1px solid #ddd;
    padding: 2px;
    height: 12px;
  }

  th {
    background-color: #f2f2f2;
  }

  .filter-input {
    margin-bottom: 10px;
    padding: 5px;
    width: 100%;
  }
</style>
