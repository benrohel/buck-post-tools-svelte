<script lang="ts">
  import { onMount } from "svelte";
  import FindAndReplace from "./FindAndReplace.svelte";
  import SequentialRename from "./SequentialRename.svelte";
  import RevertToFilename from "./RevertToFilename.svelte";
  import ReplaceAndRelink from "./ReplaceAndRelink .svelte";
  const renameModes = [
    { value: "replace", label: "Find and Replace", component: FindAndReplace },
    {
      value: "sequential",
      label: "Sequential Rename",
      component: SequentialRename,
    },
    {
      value: "revert",
      label: "Revert to filename",
      component: RevertToFilename,
    },
    {
      value: "relink",
      label: "Rename and Relink",
      component: ReplaceAndRelink,
    },
  ];

  let selectedMode = "";

  $: mode = renameModes.find((m) => m.value === selectedMode) ?? renameModes[0];

  const handleRenameMode = (s: any) => {
    selectedMode = s.target.value;
  };

  onMount(async () => {
    selectedMode = renameModes[0].value;
  });
</script>

<div style="display:flex; flex-direction:row">
  <div class="select-wrapper" style="flex-grow:1;margin-right:2px;">
    <select bind:value={selectedMode} on:change={handleRenameMode}>
      {#each renameModes as mode, id}
        <option value={mode.value}>
          {mode.label}
        </option>
      {/each}
    </select>
  </div>
</div>
<svelte:component this={mode.component} />

<style lang="scss">
</style>
