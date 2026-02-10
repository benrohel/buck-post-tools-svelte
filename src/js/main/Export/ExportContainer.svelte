<script lang="ts">
  import { onMount, getContext } from 'svelte';
  import ExportShots from './ExportShots.svelte';
  import ExportStills from './ExportStills.svelte';
  import ExportSequenceXML from './ExportSequenceXML.svelte';
  import ExportSequenceCSV from './ExportSequenceCSV.svelte';
  import ExportCompositions from './ExportCompositions.svelte';
  import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';
  import ExportPathBuilder from './ExportPathBuilder.svelte';
  import ExportPproPathBuilder from './ExportPproPathBuilder.svelte';
  import PublishToAquarium from './PublishToAquarium.svelte';
  import { appStore } from '@/stores/app-store';
  import { logModule } from '@/lib/logger';
  const log = logModule('export-container');

  import type { SelectToolItem } from '@/types/models';

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
    // {
    //   value: 'shots',
    //   label: 'Shots',
    //   component: ExportPproPathBuilder,
    //   apps: ['PPRO'],
    // },
  ];

  let filteredModes = exportModes.filter((m) =>
    m.apps.includes($appStore.appId),
  );

  // Initialize as undefined - will be set by reactive block
  let selectedExportMode: SelectToolItem | undefined = undefined;

  const handleOnChange = (value: SelectToolItem) => {
    log.debug('Export mode changing', {
      from: selectedExportMode?.value,
      to: value.value,
    });
    selectedExportMode = value;
    log.debug('Export mode changed', {
      mode: selectedExportMode.value,
      label: selectedExportMode.label,
    });
  };

  onMount(() => {
    log.debug('Export Container mounted', {
      appId: $appStore.appId,
      selectedMode: selectedExportMode?.value,
      filteredModesCount: filteredModes.length,
      hasComponent: !!selectedExportMode?.component,
      componentName: selectedExportMode?.component?.name,
    });
    if ($appStore.appId) {
      const defaultMode =
        $appStore.appId === 'PPRO' ? exportModes[0] : exportModes[4];

      // Only update if we don't have a valid selection or app changed
      if (
        !selectedExportMode ||
        !selectedExportMode.apps.includes($appStore.appId)
      ) {
        selectedExportMode = defaultMode;
      }
    }
  });
</script>

<MenuSelect
  items={filteredModes}
  bind:value={selectedExportMode}
  onChange={handleOnChange}
/>

{#if selectedExportMode && selectedExportMode.component}
  <div>
    <svelte:component this={selectedExportMode.component} />
  </div>
{:else}
  <div>No component selected or component is undefined</div>
  {JSON.stringify({
    hasMode: !!selectedExportMode,
    modeValue: selectedExportMode?.value,
    hasComponent: !!selectedExportMode?.component,
  })}
{/if}
