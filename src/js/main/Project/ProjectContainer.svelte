<script lang="ts">
  import { onMount } from 'svelte';
  import ProjectStarter from './ProjectStarter.svelte';
  import CopySequenceSettings from './CopySequenceSettings.svelte';
  import AspectRatios from './AspectRatios.svelte';
  import Tools from './Tools.svelte';

  const toolList = [
    {
      label: 'Start Project',
      value: 'projectStarter',
      component: ProjectStarter,
    },
    {
      label: 'Sequence Settings',
      value: 'sequenceSettings',
      component: CopySequenceSettings,
    },
    {
      label: 'Aspect Ratios',
      value: 'aspectRatios',
      component: AspectRatios,
    },
    {
      label: 'Tools',
      value: 'tools',
      component: Tools,
    },
  ];

  let selectedMode = '';

  $: tool = toolList.find((m) => m.value === selectedMode) ?? toolList[0];

  const handleRenameMode = (s: any) => {
    selectedMode = s.target.value;
  };

  onMount(async () => {
    selectedMode = toolList[0].value;
  });
</script>

<div style="display:flex; flex-direction:row">
  <div class="select-wrapper" style="flex-grow:1;">
    <select bind:value={selectedMode} on:change={handleRenameMode}>
      {#each toolList as tool, id}
        <option value={tool.value}>
          {tool.label}
        </option>
      {/each}
    </select>
  </div>
</div>
<svelte:component this={tool.component} />

<style lang="scss">
</style>
