<script lang="ts">
  import { onMount } from "svelte";
  import { getContext } from "svelte";
  import ProjectStarter from "./ProjectStarter.svelte";
  import CopySequenceSettings from "./CopySequenceSettings.svelte";
  import AspectRatios from "./AspectRatios.svelte";
  import Dropdown from "../../components/Dropdown/Dropdown.svelte";
  import DropdownItem from "../../components/Dropdown/DropdownItem.svelte";
  const appId = getContext("appId") as string;

  const toolList = [
    {
      label: "Start Project",
      value: "projectStarter",
      component: ProjectStarter,
      apps: ["AEFT", "PPRO"],
    },
    {
      label: "Sequence Settings",
      value: "sequenceSettings",
      component: CopySequenceSettings,
      apps: ["PPRO"],
    },
    {
      label: "Aspect Ratios",
      value: "aspectRatios",
      apps: ["PPRO"],
      component: AspectRatios,
    },
    // {
    //   label: 'Tools',
    //   value: 'tools',
    //   component: Tools,
    // },
  ];

  let selectedMode = "";

  let filteredToolList = toolList.filter((tool) => tool.apps.includes(appId));

  $: tool = toolList.find((m) => m.value === selectedMode) ?? toolList[0];

  const handleRenameMode = (s: any) => {
    selectedMode = s;
  };

  onMount(async () => {
    selectedMode = toolList[0].label;
  });
</script>

<div class="flex-row-end">
  <Dropdown
    placeholder={selectedMode ?? "Select Tool"}
    onSelected={handleRenameMode}
  >
    {#each filteredToolList as tool, id}
      <DropdownItem value={tool.label}>
        {tool.label}
      </DropdownItem>
    {/each}
  </Dropdown>
</div>

<!-- <div style="display:flex; flex-direction:row">
  <div class="select-wrapper" style="flex-grow:1;">
    <select bind:value={selectedMode} on:change={handleRenameMode}>
      {#each filteredToolList as tool, id}
        <option value={tool.value}>
          {tool.label}
        </option>
      {/each}
    </select>
  </div>
</div> -->

<svelte:component this={tool.component} />

<style lang="scss">
</style>
