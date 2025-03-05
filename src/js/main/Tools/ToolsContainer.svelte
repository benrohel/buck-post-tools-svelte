<script lang="ts">
  import { getContext } from 'svelte';
  import MenuSelect from '../../components/MultiSelect/MenuSelect.svelte';
  import NukeToAe from './NukeToAE.svelte';

  interface SelectToolItem {
    value: string;
    label: string;
    component: any;
    apps: string[];
  }

  const appId = getContext('appId') as string;

  const renameModes = [
    {
      value: 'nukeToAe',
      label: 'Import Nuke Corner Pin',
      apps: ['AEFT'],
      component: NukeToAe,
    },
  ];

  $: filteredModes = renameModes.filter((m) => m.apps.includes(appId));
  let selectedMode: SelectToolItem =
    appId === 'PPRO' ? renameModes[0] : renameModes[0];
  const handleOnMenuChange = (value: any) => (selectedMode = value);
</script>

<MenuSelect
  items={filteredModes}
  bind:value={selectedMode}
  onChange={handleOnMenuChange}
/>

<svelte:component this={selectedMode.component} />
