<script lang="ts">
  import { onMount, getContext } from "svelte";
  import ExportShots from "./ExportShots.svelte";
  import ExportStills from "./ExportStills.svelte";
  import ExportSequenceXML from "./ExportSequenceXML.svelte";
  import ExportCompositions from "./ExportCompositions.svelte";
  import Dropdown from "../../components/Dropdown/Dropdown.svelte";
  import DropdownItem from "../../components/Dropdown/DropdownItem.svelte";
  import Select from "svelte-select";
  import MenuSelect from "../../components/MultiSelect/MenuSelect.svelte";
  import filter from "svelte-select/filter";
  import fi from "date-fns/locale/fi";
  const appId = getContext("appId") as string;

  interface SelectToolItem {
    value: string;
    label: string;
    component: any;
    apps: string[];
  }

  const exportModes: SelectToolItem[] = [
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

  const handleOnChange = (value: SelectToolItem) => {
    selectedExportMode = value;
  };

  $: filteredModes = exportModes.filter((m) => m.apps.includes(appId));
  let selectedExportMode: SelectToolItem =
    appId === "PPRO" ? exportModes[0] : exportModes[2];
</script>

<MenuSelect
  items={filteredModes}
  bind:value={selectedExportMode}
  onChange={handleOnChange}
/>

<svelte:component this={selectedExportMode.component} />
