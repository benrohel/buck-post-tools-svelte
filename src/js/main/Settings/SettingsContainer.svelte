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
  import { trackerType } from '../../stores/settings-store';

  const trackerOptions = ['coda', 'aquarium'];
  let selectedProjectName: string = '';

  const handleSelectProject = (e: any) => {
    if ($codaTrackerInfos) {
      const proj = $codaTrackerInfos.find((p) => p.name === e.target.value);
      if (proj) {
        selectedCodaProject.set(proj);
      }
    }
    console.log('selected coda project', $selectedCodaProject);
  };

  const setCodaTable = async () => {
    if ($selectedCodaProject) {
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

  $: console.log($trackerType);
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
    <p>Coda Project:</p>
    <select bind:value={selectedProjectName} on:change={handleSelectProject}>
      {#if $codaTrackerInfos != null}
        {#each $codaTrackerInfos as projectInfo}
          <option value={projectInfo.name}>{projectInfo.name}</option>
        {/each}
      {/if}
    </select>
    <button
      class="icon active"
      on:click={setCodaTable}
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
