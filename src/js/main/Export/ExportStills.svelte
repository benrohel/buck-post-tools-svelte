<script lang="ts">
  import { onMount } from 'svelte';
  import { GetThumbnail } from '../../api/clip';
  import {
    GetSequenceThumbnails,
    GetSequence,
    GetSequencedClips,
  } from '../../api/sequence';
  import { notifications } from '../../stores/notifications-store';
  import { evalES, selectFolder } from '../../lib/utils/bolt';
  import { openFile } from '../../lib/utils/utils';
  import { FolderInput } from 'svelte-lucide';
  import MarkerRow from '../../components/Markers/MarkersSelect.svelte';
  const stillExportModes = [
    {
      label: 'shots',
      value: 'shots',
    },
    { label: 'markers', value: 'markers' },
  ];

  let markers = [];
  let outputFolder = '';
  let selectedExportMode = '';
  let refTrack = 'shots';
  let done = false;

  const handelSetOutputFolder = async () => {
    let folderPath = await evalES(`openFolderDialog("Select Output Folder")`);
    outputFolder = String(folderPath);
  };

  const handleOpenFolder = () => {
    openFile(outputFolder);
  };

  const handleMarkerChange = (m: any) => {
    markers = m;
    console.log(markers);
  };

  const handleExportMode = (s: any) => {
    selectedExportMode = s.target.value;
  };

  const handleSubmitExport = async () => {
    done = false;
    const seq = await GetSequence();

    if (selectedExportMode === 'shots') {
      if (seq) {
        const sequenceClips = await GetSequencedClips(seq, refTrack);
        console.log('sequenceClips', sequenceClips);
        sequenceClips.forEach((clip) => {
          GetThumbnail(clip, outputFolder).then((res) => {
            console.log(res);
          });
        });
        done = true;
        notifications.success('Stills Export Done', 2000);
      }
    } else if (selectedExportMode === 'markers') {
      GetSequenceThumbnails(seq.nodeId, outputFolder).then(() => {
        console.log('done');
      });
    }
  };

  onMount(async () => {
    selectedExportMode = stillExportModes[0].value;
  });
</script>

<div
  style="display:flex; flex-direction:row; gap:4px; justify-content:space-between;"
>
  <div style="display:flex; flex-direction:row; gap:4px; style=flex-grow: 1">
    <p>Export from:</p>
    <div class="select-wrapper" style="flex-grow: 1;">
      <select bind:value={selectedExportMode} on:change={handleExportMode}>
        {#each stillExportModes as mode, id}
          <option value={mode.value}>
            {mode.label}
          </option>
        {/each}
      </select>
    </div>
  </div>
  {#if selectedExportMode === 'markers'}
    <div class="row">
      <p>Filter:</p>
      <MarkerRow onChange={handleMarkerChange} />
    </div>
  {/if}
</div>
<div
  class="folder-select"
  style="display:flex; flex-direction:row; gap:4px; margin-left:2px; margin-right:2px"
>
  <button on:click={handelSetOutputFolder}>
    <FolderInput size="16" />
  </button>
  <input type="text" bind:value={outputFolder} class="folder-input" />
</div>
<div class="flex-row-end action-row">
  <button
    class="active"
    on:click={handleSubmitExport}
    disabled={outputFolder.length === 0}>Export Stills</button
  >
</div>

<style lang="scss">
  @import '../../variables.scss';
  .folder-select {
    flex-grow: 1;
    display: flex;
    flex-direction: row;
    gap: 4px;
    align-items: center;
  }

  .folder-input {
    justify-self: flex-start;
    flex-grow: 1;
  }
</style>
