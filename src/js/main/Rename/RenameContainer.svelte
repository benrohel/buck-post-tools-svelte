<script lang="ts">
  import { onMount } from "svelte";

  const renameModes = [
    { value: "replace", label: "Find and Replace" },
    { value: "sequential", label: "Sequential Rename" },
    { value: "revert", label: "Revert to filename" },
    { value: "relink", label: "Rename and Relink" },
  ];

  $: selectedMode = renameModes[0].value ?? null;

  const handleRenameMode = (s: any) => {
    selectedMode = s.target.value;
    console.log(selectedMode);
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

<style lang="scss">
</style>
