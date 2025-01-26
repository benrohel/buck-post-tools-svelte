<script lang="ts">
  import { onMount } from 'svelte';
  import ExportShots from './ExportShots.svelte';
  import ExportStills from './ExportStills.svelte';
  import ExportSequence from './ExportSequence.svelte';

  const exportModes = [
    { value: 'sequence', label: 'Sequence', component: ExportSequence },
    { value: 'still', label: 'Stills', component: ExportStills },
    { value: 'shots', label: 'Shots', component: ExportShots },
  ];

  let selectedExportMode = '';
  $: mode =
    exportModes.find((m) => m.value === selectedExportMode) ?? exportModes[0];

  const handleExportMode = (s: any) => {
    selectedExportMode = s.target.value;
  };

  onMount(async () => {
    selectedExportMode = exportModes[0].value;
  });
</script>

<div style="display:flex; flex-direction:row">
  <div class="select-wrapper" style="flex-grow:1;">
    <select bind:value={selectedExportMode} on:change={handleExportMode}>
      {#each exportModes as mode, id}
        <option value={mode.value}>
          {mode.label}
        </option>
      {/each}
    </select>
  </div>
</div>
<svelte:component this={mode.component} />

<style lang="scss">
</style>
