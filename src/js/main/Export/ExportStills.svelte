<script lang="ts">
  import { onMount } from 'svelte';
  import { GetThumbnail } from '@/api/clip';
  import {
    GetMarkersThumbnails,
    GetSequence,
    GetSequencedClips,
  } from '@/api/sequence';

  import { notifications } from '@/stores/notifications-store';
  import { openFile } from '@/lib/utils/utils';
  import MarkerRow from '@/components/Markers/MarkersSelect.svelte';
  import type MarkerColor from '@/components/Markers/MarkersSelect.svelte';
  import SelectFolderWeb from '@/components/SelectFolder/SelectFolderWeb.svelte';
  import { appStore } from '@/stores/app-store';
  import { stillOutputFolder } from '@/stores/local-storage';
  const stillExportModes = [
    {
      label: 'shots',
      value: 'shots',
    },
    { label: 'markers', value: 'markers' },
  ];

  let markerColors: MarkerColor[] = [];
  let outputFolder = '';
  let selectedExportMode = '';
  let refTrack = 'shots';
  let done = false;

  function setOutputFolder(path: string) {
    if ($appStore.rememberLastExportPath) {
      stillOutputFolder.set(path);
    }
    outputFolder = path;
  }

  const handleOpenFolder = () => {
    openFile(outputFolder);
  };

  const handleMarkerChange = (m: any) => {
    markerColors = m;
    console.log(markerColors);
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
        sequenceClips.forEach((clip) => {
          GetThumbnail(clip, outputFolder).then((res) => {
            console.log(res);
          });
        });
        done = true;
        notifications.success('Stills Export Done', 2000);
      }
    } else if (selectedExportMode === 'markers') {
      await GetMarkersThumbnails(
        seq.nodeId,
        outputFolder,
        markerColors.filter((m) => m.selected).map((m) => m.colorIndex)
      ).then(() => {
        console.log('done');
      });
      done = true;
      notifications.success('Stills Export Done', 2000);
    }
  };
  $: focus = false;

  onMount(async () => {
    selectedExportMode = stillExportModes[0].value;
    outputFolder = $stillOutputFolder ?? '';
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
  <SelectFolderWeb
    onChange={setOutputFolder}
    bind:value={outputFolder}
    label="Set Destination Folder"
  />
</div>
<div class="flex-row-end action-row">
  <button
    class="active"
    on:click={handleSubmitExport}
    disabled={$stillOutputFolder && $stillOutputFolder.length === 0}
    >Export Stills</button
  >
</div>

<style lang="scss">
</style>
