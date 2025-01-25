<script lang="ts">
  import { onMount } from 'svelte';

  const toolList = [
    { label: 'Start Project', value: 'projectStarter' },
    { label: 'Sequence Settings', value: 'sequenceSettings' },
    { label: 'Snapshots', value: 'snapshot' },
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

<div style="display:flex; flex-direction:row; text-align:center">
  Project Starter
</div>

<style lang="scss">
</style>
