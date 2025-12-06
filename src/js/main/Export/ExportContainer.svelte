<script lang="ts">
  import { onMount, getContext } from 'svelte';
  import ExportShots from './ExportShots.svelte';
  import ExportStills from './ExportStills.svelte';
  import ExportSequenceXML from './ExportSequenceXML.svelte';
  import ExportSequenceCSV from './ExportSequenceCSV.svelte';
  import ExportCompositions from './ExportCompositions.svelte';
  import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';
  import { appId } from '@/lib/utils/cep';
  import ExportPathBuilder from './ExportPathBuilder.svelte';
  import PublishToAquarium from './PublishToAquarium.svelte';

  interface SelectToolItem {
    value: string;
    label: string;
    component: any;
    apps: string[];
  }

  const exportModes: SelectToolItem[] = [
    {
      value: 'xml',
      label: 'Sequence to Xml',
      component: ExportSequenceXML,
      apps: ['PPRO'],
    },
    {
      value: 'csv',
      label: 'Sequence to CSV',
      component: ExportSequenceCSV,
      apps: ['PPRO'],
    },
    {
      value: 'aquarium',
      label: 'Publish to Aquarium',
      component: PublishToAquarium,
      apps: ['PPRO'],
    },
    {
      value: 'still',
      label: 'Stills',
      component: ExportStills,
      apps: ['PPRO'],
    },
    {
      value: 'selectedComps',
      label: 'Export Compositions',
      component: ExportPathBuilder,
      apps: ['AEFT'],
    },
  ];

  const handleOnChange = (value: SelectToolItem) => {
    selectedExportMode = value;
    console.log('selectedExportMode', selectedExportMode);
  };

  $: filteredModes = exportModes.filter((m) => m.apps.includes(appId));
  let selectedExportMode: SelectToolItem =
    appId === 'PPRO' ? exportModes[0] : exportModes[4];
</script>

<MenuSelect
  items={filteredModes}
  bind:value={selectedExportMode}
  onChange={handleOnChange}
/>

<svelte:component this={selectedExportMode.component} />
