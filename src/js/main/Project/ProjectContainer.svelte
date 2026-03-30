<script lang="ts">
  import { getContext, onMount } from 'svelte';

  import ProjectStarter from './ProjectStarter.svelte';
  import CopySequenceSettings from './CopySequenceSettings.svelte';
  import CreateMultipleSequences from './CreateMultipleSequences.svelte';
  import AspectRatios from './AspectRatios.svelte';
  import ColorManagement from './ColorManagement.svelte';
  import ShotExplorer from '../Explorer/ShotExplorer.svelte';
  import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';

  import { appStore } from '@/stores/app-store';

  import { csi } from '@/lib/utils/bolt';

  import type { SelectToolItem } from '@/types/models';

  const appId = csi.getApplicationID();

  const toolList: SelectToolItem[] = [
    {
      label: 'Start Project',
      value: 'projectStarter',
      component: ProjectStarter,
      apps: ['AEFT', 'PPRO'],
    },
    {
      label: 'Sequence Settings',
      value: 'sequenceSettings',
      component: CopySequenceSettings,
      apps: ['PPRO'],
    },
    {
      label: 'Multiple Sequences',
      value: 'multipleSequences',
      component: CreateMultipleSequences,
      apps: ['PPRO'],
    },
    {
      label: 'Aspect Ratios',
      value: 'aspectRatios',
      apps: ['PPRO'],
      component: AspectRatios,
    },
    {
      label: 'Color Management',
      value: 'colorManagement',
      component: ColorManagement,
      apps: ['AEFT'],
    },
  ];

  let selectedMode: SelectToolItem = toolList[0];
  let filteredToolList = toolList.filter((tool) => tool.apps.includes(appId));

  const handleOnMenuChange = (value: SelectToolItem) => (selectedMode = value);

  onMount(() => {
    if ($appStore.defaultToBuck5ShotLibrary && appId === 'PPRO') {
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
