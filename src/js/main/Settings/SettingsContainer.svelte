<script lang="ts">
  import { Check, ExternalLink } from 'svelte-lucide';
  import { sessionProject, trackerType } from '../../stores/local-storage';
  import { openUrl } from '../../lib/utils/utils';
  import {
    codaTrackerInfos,
    selectedCodaProject,
  } from '../../stores/coda-store';
  import { Projects } from '../../api/buck5/buck5-api';
  import { projects } from '../../stores/aquarium-store';
  import { onMount } from 'svelte';

  const trackerOptions = ['coda', 'aquarium'];
  let selectedProjectName: string = '';
  let selectedAquariumProject: any = null;

  const handleSelectProject = (e: any) => {
    console.log('selected project', e.target.value);
    console.log('tracker type', $trackerType);
    if ($trackerType === 'coda') {
      if ($codaTrackerInfos) {
        const proj = $codaTrackerInfos.find((p) => p.name === e.target.value);
        if (proj) {
          selectedCodaProject.set(proj);
        }
      }
      console.log('selected coda project', $selectedCodaProject);
    } else {
      console.log('selected aquarium project', e.target.value);
      const proj = $projects.find((p) => p.data.name === e.target.value);
      console.log(proj);
      selectedAquariumProject = proj;
      if (proj) {
        selectedProjectName = proj.data.name;
        sessionProject.set(proj._key);
      }
      console.log('selected project after', selectedProjectName);
    }
  };

  const setActiveProject = () => {
    console.log('set active project');
    console.log('tracker type', $trackerType);
    console.log('selected aquarium project', selectedAquariumProject);
    if ($trackerType === 'aquarium') {
      sessionProject.set(selectedAquariumProject._key);
    } else if ($selectedCodaProject) {
      sessionProject.set(JSON.stringify($selectedCodaProject));
    }
  };

  const openTracker = () => {
    if ($selectedCodaProject) {
      openUrl($selectedCodaProject.docUrl);
    }
  };

  $: isCodaUrl = () => {
    if ($selectedCodaProject) {
      return true;
    } else {
      return false;
    }
  };

  onMount(async () => {
    const projs = await Projects();
    projects.set(projs);
    selectedProjectName = projs.find((p) => p._key === $sessionProject)?.data
      .name;
  });
  $: console.log($trackerType);
  $: console.log($sessionProject);
</script>

<div class="container">
  <div class="setting">
    <p>Tracker Type:</p>
    <select bind:value={$trackerType}>
      {#each trackerOptions as trackerOption}
        <option value={trackerOption}>{trackerOption}</option>
      {/each}
    </select>
  </div>
  <div class="setting">
    <p>Project:</p>
    {#if $trackerType === 'coda'}
      <select
        bind:value={selectedProjectName}
        on:change={handleSelectProject}
        class="select-overflow"
      >
        {#if $codaTrackerInfos != null}
          {#each $codaTrackerInfos as projectInfo}
            <option value={projectInfo.name}>{projectInfo.name}</option>
          {/each}
        {/if}
      </select>
    {/if}
    {#if $trackerType === 'aquarium'}
      <select
        bind:value={selectedProjectName}
        on:change={handleSelectProject}
        class="select-overflow"
      >
        {#if $projects != null}
          {#each $projects as project}
            <option value={project.data.name}>{project.data.name}</option>
          {/each}
        {/if}
      </select>
    {/if}
    <button
      class="icon active"
      on:click={setActiveProject}
      disabled={selectedProjectName.length > 0 ? false : true}
    >
      <Check />
    </button>
    <button class="icon active" on:click={openTracker} disabled={!isCodaUrl()}>
      <ExternalLink />
    </button>
  </div>
</div>

<style lang="scss">
  @import '../../variables.scss';

  .container {
    margin-top: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .setting {
    font-size: small;
    display: flex;
    flex-direction: row;
    align-items: center;

    gap: 8px;
    p {
      margin: 0;
    }
  }

  .select-overflow {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: 100%;
  }
</style>
