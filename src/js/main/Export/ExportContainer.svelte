<script lang="ts">
  import { onMount, getContext } from "svelte";
  import ExportShots from "./ExportShots.svelte";
  import ExportStills from "./ExportStills.svelte";
  import ExportSequenceXML from "./ExportSequenceXML.svelte";
  import ExportCompositions from "./ExportCompositions.svelte";
  import Dropdown from "../../components/Dropdown/Dropdown.svelte";
  import DropdownItem from "../../components/Dropdown/DropdownItem.svelte";
  const appId = getContext("appId") as string;

  const exportModes = [
    {
      value: "xml",
      label: "Sequence to Xml",
      component: ExportSequenceXML,
      apps: ["PPRO"],
    },
    {
      value: "still",
      label: "Stills",
      component: ExportStills,
      apps: ["PPRO"],
    },
    {
      value: "selectedComps",
      label: "Selected Comps",
      component: ExportCompositions,
      apps: ["AEFT"],
    },
    // { value: 'shots', label: 'Shots', component: ExportShots },
  ];

  $: filteredModes = exportModes.filter((m) => m.apps.includes(appId));
  let selectedExportMode = "";
  $: mode =
    exportModes.find((m) => m.value === selectedExportMode) ?? exportModes[0];

  const handleExportMode = (s: any) => {
    selectedExportMode = s;
  };

  onMount(async () => {
    selectedExportMode =
      appId === "PPRO" ? exportModes[0].value : "selectedComps";
  });
</script>

<div class="flex-row-end">
  <Dropdown
    defaultValue={filteredModes[0].value}
    placeholder={mode.label ?? "Select Tool"}
    onSelected={handleExportMode}
  >
    {#each filteredModes as mode, id}
      <DropdownItem value={mode.value}>
        {mode.label}
      </DropdownItem>
    {/each}
  </Dropdown>
</div>

<svelte:component this={mode.component} />
