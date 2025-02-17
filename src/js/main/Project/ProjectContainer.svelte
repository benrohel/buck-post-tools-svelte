<script lang="ts">
  import { onMount } from "svelte";
  import { getContext } from "svelte";
  import ProjectStarter from "./ProjectStarter.svelte";
  import CopySequenceSettings from "./CopySequenceSettings.svelte";
  import AspectRatios from "./AspectRatios.svelte";

  import MenuSelect from "../../components/MultiSelect/MenuSelect.svelte";
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

  let selectedMode = toolList[0];
  let filteredToolList = toolList.filter((tool) => tool.apps.includes(appId));
  const handleOnMenuChange = (value: any) => (selectedMode = value);
</script>

<MenuSelect
  items={filteredToolList}
  bind:value={selectedMode}
  onChange={handleOnMenuChange}
/>

<svelte:component this={selectedMode.component} />
