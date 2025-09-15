<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import ProjectStarter from './ProjectStarter.svelte';
  import CopySequenceSettings from './CopySequenceSettings.svelte';
  import AspectRatios from './AspectRatios.svelte';
  import ColorManagement from './ColorManagement.svelte';
  import ShotExplorer from './ShotExplorer.svelte';
  import { appId } from '../../lib/utils/cep';
  import { appStore } from '../../stores/app-store';
  import MenuSelect from '../../components/MultiSelect/MenuSelect.svelte';

  const toolList = [
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
    {
      label: 'Shot Library',
      value: 'shotLibrary',
      component: ShotExplorer,
      apps: ['PPRO'],
    },
  ];

  let selectedMode = toolList[0];
  let filteredToolList = toolList.filter((tool) => tool.apps.includes(appId));
  const handleOnMenuChange = (value: any) => (selectedMode = value);

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
