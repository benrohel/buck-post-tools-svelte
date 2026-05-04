<script lang="ts">
  import { onMount } from 'svelte';

  import ShotExplorer from './ShotExplorer.svelte';
  import AssetExplorer from './AssetExplorer.svelte';
  import Bookmarks from './Bookmarks.svelte';
  import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';

  import { appStore } from '@/stores/app-store';

  import type { Option, SelectToolItem } from '@/types/models';

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
    {
      label: 'Asset Library',
      value: 'assetLibrary',
      component: AssetExplorer,
      apps: ['PPRO', 'AEFT'],
    },
  ];

  let selectedMode: SelectToolItem = toolList[0];

  $: filteredToolList = toolList.filter((tool) =>
    tool.apps.includes($appStore.appId),
  );

  const handleOnMenuChange = (value: Option<any> | null) => {
    if (!value) {
      return;
    }
    selectedMode =
      filteredToolList.find((mode) => mode.value === value.value) ??
      filteredToolList[0];
  };

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
