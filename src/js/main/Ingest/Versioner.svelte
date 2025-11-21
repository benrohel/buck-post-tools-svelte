<script lang="ts">
  import { GetActiveSequence, GetSequencedClips } from '../../api/edit';
  import { checkVideoFileUpdate } from '../../api/video/video';
  import { openUrl } from '../../lib/utils/utils';
  import ClipCard from '../../components/ClipCard/ClipCard.svelte';
  import { Shots } from '../../api/buck5/buck5-api';
  import { sessionProject, storedProject } from '../../stores/local-storage';
  import { showWarnings } from '../../stores/settings-store';
  import { getClips } from '../../api/clip';
  import {
    GetSystemFileVersionsWithShotName,
    GetFileVersion,
  } from '../../api/files/files';
  import { evalES } from '../../lib/utils/bolt';
  import {
    Download,
    RefreshCw,
    ArrowUpDown,
    ExternalLink,
    TriangleAlert,
  } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import { SyncLoader } from 'svelte-loading-spinners';
  import { notifications } from '../../stores/notifications-store';
  import { Tooltip } from '@svelte-plugins/tooltips';
  import ProgressBar from '../../components/ProgressBar/ProgressBar.svelte';
  import { type AppStore, appStore } from '../../stores/app-store';
  import type { Writable } from 'svelte/store';
  import { id } from 'date-fns/locale';
  import AquariumProjectMenu from '../../components/MultiSelect/AquariumProjectMenu.svelte';
  import { shots } from '../../stores/aquarium-store';
  import Toggle from '../../components/Toggle/Toggle.svelte';

  const ingestModes = [{ label: 'Version Up', value: 'versionup' }];
  let isLoading = false;
  $: isProcessing = false;
  $: processedCount = 5;
  $: totalCount = 10;
  $: progressPercentage = 0;

  let useAquarium = false;

  $: sequenceClips = [] as any[];

  let currentProject: any = null;

  const handleClipSelect = (task: any) => {
    console.log(task);
  };
  const handleReplaceClip = async (clip: any, selectedVersion: any) => {
    let importOptions = {
      nodeId: clip.nodeId,
      oldPath: clip.filepath,
      newPath: selectedVersion.filepath,
      isSequence: false,
    };

    const res = await evalES(`replaceMedia(${JSON.stringify(importOptions)})`);
    const updatedClip = JSON.parse(res);

    const clipVersion = GetFileVersion(clip.filepath);
    const data = {
      row: {
        cells: [
          {
            column: 'Edit Version',
            value: clipVersion,
          },
        ],
      },
    };

    sequenceClips = sequenceClips.map((c: any) => {
      if (c.nodeId === clip.nodeId) {
        return {
          ...c,
          selectedVersion: selectedVersion,
          filepath: updatedClip.filepath,
          clipName: updatedClip.clipName,
        };
      } else {
        return c;
      }
    });
    // await UpdateRow(clip.trackerClip.href, data);
  };

  const handleImportClip = (clip: any, selectedVersion: any) => {
    let importOptions = {
      filepath: selectedVersion.filepath,
      isSequence: false,
    };

    if (clip.fileseq) {
      importOptions.isSequence = true;
    }

    evalES(`importMediaFile(${JSON.stringify(importOptions)})`).then((res) => {
      res ? true : false;
    });
  };

  const handleReplaceAll = () => {
    sequenceClips.forEach((clip) => {
      handleReplaceClip(clip, clip.selectedVersion);
    });
    notifications.success('All clips have been successfully replaced', 2000);
  };
  const handleImportAll = () => {
    sequenceClips.forEach((clip) => {
      handleImportClip(clip, clip.selectedVersion);
    });
    notifications.success('All clips have been successfully imported', 2000);
  };

  const handleClipOnChange = async (clip: any, version: any) => {
    const foundClipIndex = sequenceClips.findIndex((c) => {
      return c.nodeId === clip.nodeId;
    });

    sequenceClips = sequenceClips.map((c: any) => {
      if (c.nodeId === clip.nodeId) {
        return {
          ...c,
          selectedVersion: version,
        };
      } else {
        return c;
      }
    });
  };

  const openTracker = () => {
    if ($sessionProject) {
      openUrl(`http://buck.aquarium.app/${$sessionProject}`);
    }
  };

  const handleShowWarnings = () => {
    $showWarnings = !$showWarnings;

    console.log('showWarnings', $showWarnings);
  };

  const findTrackerClip = async (clip: any) => {
    if ($sessionProject && $shots.length > 0) {
      const trackerClip = $shots.find((s) => {
        return s.data.name.match(clip.shotName.split('_')[0]);
      });
      return trackerClip;
    }
  };

  const handleReloadClips = async () => {
    isLoading = true;
    if (useAquarium && $sessionProject) {
      await Shots($sessionProject).then((res) => {
        console.log('shots', res);
        shots.set(res);
      });
    }

    getClips().then((clips) => {
      if (clips.length > 0) {
        if (useAquarium) {
          sequenceClips = clips.map((c: any) => {
            return {
              ...c,
              trackerClip: findTrackerClip(c),
            };
          });
        } else {
          sequenceClips = clips;
        }
        isLoading = false;
      } else {
        sequenceClips = [];
        isLoading = false;
      }
    });
  };

  const handleProjectChange = (project: any) => {
    currentProject = project;
  };

  const handleUseAquarium = () => {
    useAquarium = !useAquarium;
  };

  onMount(() => {
    handleReloadClips();
    if ($appStore.showVersionWarnings) {
      $showWarnings = true;
    } else {
      $showWarnings = false;
    }
  });
</script>

<div class="ingest-container">
  <!-- <div
    style="display:flex; flex-direction:row; gap:4px; align-items:center; justify-self:start; margin-bottom:4px; margin-top:4px; height:24px"
  >
    <Toggle
      label="Use Aquarium"
      bind:checked={useAquarium}
      on:change={handleUseAquarium}
    />
    {#if useAquarium}
      <AquariumProjectMenu />
    {/if}
  </div> -->
  <div
    class="ingest-shot-row"
    style="background-color: #161616; margin-bottom:8px. height:20px"
  >
    <div
      style="display:flex; flex-direction:row ; gap:4px; align-items:center; justify-self:start;"
    >
      <Tooltip
        action={$appStore.showTooltips ? 'hover' : 'none'}
        content="Reload Clips Selection"
        position="right"
        delay={1000}
      >
        <button
          class="icon"
          style="margin-left:4px"
          on:click={handleReloadClips}
        >
          <RefreshCw />
        </button>
      </Tooltip>
      <p class="clip-name-header">NAME</p>
    </div>
    <p>PUBLISHED</p>
    <p>EDIT</p>
    <p>UPDATE TO</p>
    <div
      style="display:flex; flex-direction:row ; gap:2px; align-items:center; justify-self:end;"
    >
      <p style="justify-self:end; margin-right:4px">ACTIONS</p>
    </div>
  </div>

  <div>
    <div
      style="display:flex; flex-direction:row; justify-content:space-between; align-items:center;"
    >
      <div>
        <Tooltip
          action={$appStore.showTooltips ? 'hover' : 'none'}
          content="<b> Show Warnings</b><p style=margin: 0px; >for clips with video mismatch such as frame range, resolution, etc.</p><p style=margin: 0px;> &#9888 Loading files will be significantly slower</p>"
          position="right"
          delay={1000}
        >
          <button
            class={$showWarnings ? 'icon error' : 'icon active'}
            on:click={handleShowWarnings}
          >
            <TriangleAlert color="#1d1d1e" />
          </button>
        </Tooltip>
      </div>
      {#if isProcessing}
        <div style="width: 60%">
          <ProgressBar
            current={processedCount}
            total={totalCount}
            percentage={progressPercentage}
            showLabel={true}
            showPercentage={false}
          />
        </div>
      {/if}
      {#if isLoading}
        <div
          style="display:flex; flex-direction:row; justify-content:center; align-items:center; padding: 8px;"
        >
          <SyncLoader color="#adadad" size="28" />
        </div>
      {/if}
      <div
        style="display:flex; flex-direction:row; justify-content:flex-end;margin-left:4px;gap:4px"
      >
        <Tooltip
          action={$appStore.showTooltips ? 'hover' : 'none'}
          content="Replace All Clips"
          position="left"
          delay={1000}
        >
          <button class="icon active" on:click={handleReplaceAll}>
            <ArrowUpDown size="20" />
          </button>
        </Tooltip>
        <Tooltip
          action={$appStore.showTooltips ? 'hover' : 'none'}
          content="Import All Clips"
          position="left"
          delay={1000}
        >
          <button class="icon active" on:click={handleImportAll}>
            <Download />
          </button>
        </Tooltip>
      </div>
    </div>

    <div class="card-list">
      {#each sequenceClips as clip, id (`${clip.nodeId}-${new Date().getTime()}`)}
        {#key id}
          <ClipCard
            {clip}
            onSelect={handleClipSelect}
            selected={false}
            onReplace={handleReplaceClip}
            onImport={handleImportClip}
            onChange={handleClipOnChange}
          />
        {/key}
      {/each}
    </div>
  </div>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  .ingest-container {
    display: flex;
    flex-direction: column;
  }

  p {
    margin: 2px;
  }

  .form-row {
    display: flex;
    flex-direction: row;
    gap: 2pxx;
    align-items: center;
    flex-grow: 1;
  }

  .coda-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    justify-self: flex-end;
    color: $font;
    width: 100%;
    gap: 8px;
    margin-bottom: 4px;
  }

  .card-list {
    position: relative;
    height: calc(100vh - 150px);
    overflow: auto;
  }
</style>
