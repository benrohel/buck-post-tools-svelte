<script lang="ts">
  import { onMount, getContext } from 'svelte';
  import ExportShots from './ExportShots.svelte';
  import ExportStills from './ExportStills.svelte';
  import ExportSequenceXML from './ExportSequenceXML.svelte';
  import ExportSequenceCSV from './ExportSequenceCSV.svelte';
  import ExportCompositions from './ExportCompositions.svelte';
  import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';
  import ExportPathBuilder from './ExportPathBuilder.svelte';
  // import ExportPproPathBuilder from './ExportPproPathBuilder.svelte';
  import ExportSequences from './ExportSequences.svelte';
  import PublishToAquarium from './PublishToAquarium.svelte';
  import { appStore } from '@/stores/app-store';
  import { logModule } from '@/lib/logger';
  const log = logModule('export-container');

  import type { Option, SelectToolItem } from '@/types/models';

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
      value: 'sequences',
      label: 'Export Sequences',
      component: ExportSequences,
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

  $: exportModeOptions = filteredModes.map(
    (m): Option<string> => ({ value: m.value, label: m.label }),
  );

  let selectedExportModeOption: Option<string> | null = null;
  $: selectedExportMode =
    filteredModes.find((m) => m.value === selectedExportModeOption?.value) ??
    null;

  const handleOnChange = (value: Option<any> | null) => {
    if (!value) {
      return;
    }
    log.debug('Export mode changing', {
      from: selectedExportMode?.value,
      to: value.value,
    });
    selectedExportModeOption = value as Option<string>;
    log.debug('Export mode changed', {
      mode: selectedExportMode?.value,
      label: selectedExportMode?.label,
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
      const defaultMode = filteredModes[0];

      // Only update if we don't have a valid selection or app changed
      if (
        !selectedExportMode ||
        !selectedExportMode.apps.includes($appStore.appId)
      ) {
        selectedExportModeOption = {
          value: defaultMode.value,
          label: defaultMode.label,
        };
      }
    }
  });
</script>

<MenuSelect
  items={exportModeOptions}
  bind:value={selectedExportModeOption}
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
