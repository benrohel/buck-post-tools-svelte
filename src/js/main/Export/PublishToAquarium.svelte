<script lang="ts">
  import {
    localAppStore,
    lastFolderExport,
    storedExportRootFolder,
  } from '../../stores/local-storage';
  import { appStore } from '../../stores/app-store';
  import { Projects } from '../../api/buck5/buck5-api';
  import { GetSelectedSequences } from '../../api/sequence';
  import { fs, path } from '../../lib/cep/node';
  import { notifications } from '../../stores/notifications-store';
  import { onMount } from 'svelte';
  import SelectFolderWeb from '../../components/SelectFolder/SelectFolderWeb.svelte';
  import { GetThumbnail, type ClipType } from '../../api/clip';
  import MenuSelect from '../../components/MultiSelect/MenuSelect.svelte';
  import {
    exportSequenceCSV,
    GetSequencedClips,
    type Sequence,
  } from '../../api/sequence';
  import { recursiveMkDir } from '../../lib/utils/index';

  $: uploadThumbnails = false;
  let suffix = '';

  $: selectedProject = '';

  $: console.log(uploadThumbnails);

  const setSelectedProject = (event: Event) => {
    const target = event.target as HTMLInputElement;
    selectedProject = target.value;
  };

  const handleSubmitExport = async () => {
    console.log('submit export', uploadThumbnails);
  };

  onMount(() => {});
</script>

<div
  class="folder-select"
  style="display:flex; flex-direction:row; gap:4px; margin-left:2px; margin-right:2px"
>
  {#await Projects()}
    <p>Loading...</p>
  {:then value}
    <MenuSelect
      items={value.map((p) => p.data.name)}
      value={selectedProject}
      placeholder="Select Project"
      onChange={setSelectedProject}
    />
  {:catch error}
    <p>Error: {error.message}</p>
  {/await}
</div>

<div class="flex-row-end action-row">
  <button class="active" on:click={handleSubmitExport}>Export CutLists</button>
</div>
