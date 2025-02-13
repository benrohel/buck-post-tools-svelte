<script lang="ts">
  import { onMount, getContext } from "svelte";
  import ExportShots from "./ExportShots.svelte";
  import ExportStills from "./ExportStills.svelte";
  import ExportSequenceXML from "./ExportSequenceXML.svelte";
  import ExportCompositions from "./ExportCompositions.svelte";

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
      value: "activeComp",
      label: "Active Comp",
      component: ExportCompositions,
      apps: ["AEFT"],
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
    selectedExportMode = s.target.value;
  };

  onMount(async () => {
    selectedExportMode = appId === "PPRO" ? exportModes[0].value : "activeComp";
  });
</script>

<div class="row">
  <div class="select-wrapper" style="flex-grow:1;">
    <select bind:value={selectedExportMode} on:change={handleExportMode}>
      {#each filteredModes as mode, id}
        <option value={mode.value}>
          {mode.label}
        </option>
      {/each}
    </select>
  </div>
</div>
<svelte:component this={mode.component} />
