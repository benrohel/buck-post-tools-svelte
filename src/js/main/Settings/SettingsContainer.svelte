<script lang="ts">
  import {
    Download,
    Check,
    RefreshCw,
    ArrowUpDown,
    ExternalLink,
  } from 'svelte-lucide';
  import { sessionProject } from '../../stores/local-storage';
  import { openUrl } from '../../lib/utils/utils';
  import {
    codaTrackerInfos,
    selectedCodaProject,
  } from '../../stores/coda-store';
  import { Projects } from '../../api/buck5/buck5-api';
  import { projects } from '../../stores/aquarium-store';
  import { trackerType, activeProjectKey } from '../../stores/settings-store';
  import { onMount } from 'svelte';

  const trackerOptions = ['coda', 'aquarium'];
  let selectedProjectName: string = '';
  let selectedAquarieumProject: any = null;

  const handleSelectProject = (e: any) => {
    if ($trackerType === 'coda') {
      if ($codaTrackerInfos) {
        const proj = $codaTrackerInfos.find((p) => p.name === e.target.value);
        if (proj) {
          selectedCodaProject.set(proj);
        }
      }
      console.log('selected coda project', $selectedCodaProject);
    } else {
      const proj = $projects.find((p) => p._key === e.target.value);
      selectedAquarieumProject = proj;
      if (proj) {
        selectedProjectName = proj.data.name;
        activeProjectKey.set(proj._key);
      }
      console.log('selected project', selectedProjectName);
    }
  };

  const setActiveProject = async () => {
    if ($trackerType === 'aquarium') {
      sessionProject.set(JSON.stringify(selectedAquarieumProject));
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
  });

  $: console.log($trackerType);
  $: console.log($activeProjectKey);
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
      <select bind:value={selectedProjectName} on:change={handleSelectProject}>
        {#if $codaTrackerInfos != null}
          {#each $codaTrackerInfos as projectInfo}
            <option value={projectInfo.name}>{projectInfo.name}</option>
          {/each}
        {/if}
      </select>
    {/if}
    {#if $trackerType === 'aquarium'}
      <select bind:value={selectedProjectName} on:change={handleSelectProject}>
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
</style>
