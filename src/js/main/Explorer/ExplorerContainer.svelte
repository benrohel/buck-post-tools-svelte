<script lang="ts">
  import { onMount } from 'svelte';
  import ShotExplorer from './ShotExplorer.svelte';
  import Bookmarks from './Bookmarks.svelte';
  import { appStore } from '@/stores/app-store';
  import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';

  const toolList = [
    {
      label: 'Bookmarks',
      value: 'bookmarks',
      component: Bookmarks,
      apps: ['AEFT', 'PPRO'],
    },
    {
      label: 'Shot Library',
      value: 'shotLibrary',
      component: ShotExplorer,
      apps: ['PPRO', 'AEFT'],
    },
  ];

  let selectedMode = toolList[0];

  $: filteredToolList = toolList.filter((tool) => tool.apps.includes($appStore.appId));

  const handleOnMenuChange = (value: any) => (selectedMode = value);

  onMount(() => {
    if ($appStore.defaultToBuck5ShotLibrary && $appStore.appId === 'PPRO') {
      selectedMode = toolList[4];
    } else {
      selectedMode = toolList[0];
    }
  });
</script>

<MenuSelect
  items={filteredToolList}
  bind:value={selectedMode}
  onChange={handleOnMenuChange}
/>

<svelte:component this={selectedMode.component} />
