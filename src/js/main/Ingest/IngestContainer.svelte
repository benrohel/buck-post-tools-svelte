<script lang="ts">
  import Versioner from './Versioner.svelte';
  import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';
  import { appStore } from '@/stores/app-store';
  import type { Option, SelectToolItem } from '@/types/models';

  const ingestModes: SelectToolItem[] = [
    {
      value: 'versions',
      label: 'Versions Management',
      component: Versioner,
      apps: ['PPRO', 'AEFT'],
    },
  ];

  let selectedMode: SelectToolItem = ingestModes[0];

  $: filteredIngestModes = ingestModes.filter((tool) =>
    tool.apps.includes($appStore.appId),
  );

  const handleOnMenuChange = (value: Option<any> | null) => {
    if (!value) {
      return;
    }
    selectedMode =
      filteredIngestModes.find((mode) => mode.value === value.value) ??
      filteredIngestModes[0];
  };
</script>

<MenuSelect
  items={filteredIngestModes}
  bind:value={selectedMode}
  onChange={handleOnMenuChange}
/>

<svelte:component this={selectedMode.component} />
