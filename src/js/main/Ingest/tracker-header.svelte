<script lang="ts">
  import { onMount } from "svelte";
  import {
    projects,
    currentProject,
    edits,
    currentEdit,
  } from "../../stores/aquarium-store";

  import { listActiveProjects } from "buck5-javascript-client";
  import { RefreshCcw } from "svelte-lucide";

  let selectedProject: any = null;

  const handleSelectProject = () => {
    currentProject.set(selectedProject);
  };

  onMount(async () => {
    refresh();
  });

  const refresh = async () => {
    const projs = await listActiveProjects();
    projects.set(projs);
    currentProject.set(selectedProject);
  };
</script>

<div style="display:flex; flex-direction:row">
  {#if $projects}
    <div class="select-wrapper" style="flex-grow:1;margin-right:2px;">
      <select bind:value={selectedProject} on:change={handleSelectProject}>
        {#each $projects as project, id}
          <option value={project}>
            {project.data.name}
          </option>
        {/each}
      </select>
    </div>
  {/if}
  <button class="icon" on:click={refresh}>
    <RefreshCcw size={20} />
  </button>
</div>

<style lang="scss">
</style>
