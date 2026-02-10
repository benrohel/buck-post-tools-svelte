<script lang="ts">
  import { getContext } from 'svelte';
  import Versioner from './Versioner.svelte';
  import ShotLibrary from './ShotLibrary.svelte';
  import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';
  import { appStore } from '@/stores/app-store';
  import type { SelectToolItem } from '@/types/models';

  const ingestModes: SelectToolItem[] = [
    {
      value: 'versions',
      label: 'Versions Management',
      component: Versioner,
      apps: ['PPRO', 'AEFT'],
    },
    // {
    //   value: 'shotlibrary',
    //   label: 'Shot Library',
    //   component: ShotLibrary,
    //   apps: ['PPRO'],
    // },
  ];

  let selectedMode: SelectToolItem = ingestModes[0];

  $: filteredIngestModes = ingestModes.filter((tool) =>
    tool.apps.includes($appStore.appId),
  );

  const handleOnMenuChange = (value: SelectToolItem) => (selectedMode = value);
</script>

<MenuSelect
  items={filteredIngestModes}
  bind:value={selectedMode}
  onChange={handleOnMenuChange}
/>

<svelte:component this={selectedMode.component} />
