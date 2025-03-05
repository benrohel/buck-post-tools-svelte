<script lang="ts">
  import { getContext } from 'svelte';
  import Versioner from './Versioner.svelte';
  import ShotLibrary from './ShotLibrary.svelte';
  import MenuSelect from '../../components/MultiSelect/MenuSelect.svelte';

  const appId = getContext('appId') as string;

  const ingestModes = [
    {
      value: 'versions',
      label: 'Versions Management',
      component: Versioner,
      apps: ['PPRO', 'AEFT'],
    },
    {
      value: 'shotlibrary',
      label: 'Shot Library',
      component: ShotLibrary,
      apps: ['PPRO'],
    },
  ];

  let selectedMode = ingestModes[0];
  let filteredIngestModes = ingestModes.filter((tool) =>
    tool.apps.includes(appId)
  );
  const handleOnMenuChange = (value: any) => (selectedMode = value);
</script>

<MenuSelect
  items={filteredIngestModes}
  bind:value={selectedMode}
  onChange={handleOnMenuChange}
/>

<svelte:component this={selectedMode.component} />
