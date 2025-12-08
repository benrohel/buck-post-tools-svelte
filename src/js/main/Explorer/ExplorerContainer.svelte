<script lang="ts">
  import { onMount } from 'svelte';

  import ShotExplorer from './ShotExplorer.svelte';
  import Bookmarks from './Bookmarks.svelte';
  import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';

  import { appStore } from '@/stores/app-store';

  import type { SelectToolItem } from '@/types/models';

  const toolList: SelectToolItem[] = [
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

  let selectedMode: SelectToolItem = toolList[0];

  $: filteredToolList = toolList.filter((tool) => tool.apps.includes($appStore.appId));

  const handleOnMenuChange = (value: SelectToolItem) => (selectedMode = value);

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
