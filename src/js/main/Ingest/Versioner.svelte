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
    SearchCheck,
    TriangleAlert,
  } from 'lucide-svelte';
  import { getContext, onMount, setContext } from 'svelte';
  import { SyncLoader } from 'svelte-loading-spinners';

  const ingestModes = [{ label: 'Version Up', value: 'versionup' }];
  let isLoading = false;

  $: clips = [] as any[];
  $: sequenceClips = [] as any[];

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
  };
  const handleImportAll = () => {
    sequenceClips.forEach((clip) => {
      handleImportClip(clip, clip.selectedVersion);
    });
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

  const handleUpdateEditClips = async () => {
    if (!clips) {
      return;
    }
    const clipsToUpdates = sequenceClips.filter((clip) => {
      return clip.versions.length > 0;
    });
    clipsToUpdates.forEach((clip) => {
      const data = {
        shot_version: 'v01',
      };
      const c = clips.find((c) => {
        return c.shot._key === clip.shotKey;
      });
    });
  };

  const refreshShots = async () => {
    const shots = await Shots(storedProject);
    console.log('client-shots', shots);
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

  const handleReloadClips = async () => {
    sequenceClips = await getClips();
  };

  onMount(async () => {
    sequenceClips = await getClips();
  });
</script>

<div class="ingest-container">
  <div
    class="ingest-shot-row"
    style="background-color: #161616; margin-bottom:8px. height:20px"
  >
    <div
      style="display:flex; flex-direction:row ; gap:4px; align-items:center; justify-self:start;"
    >
      <button class="icon" style="margin-left:4px" on:click={handleReloadClips}>
        <RefreshCw />
      </button>
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
      style="display:flex; flex-direction:row; justify-content:flex-end;margin-left:4px;gap:4px"
    >
      <button
        class={$showWarnings ? 'icon error' : 'icon active'}
        on:click={handleShowWarnings}
      >
        <TriangleAlert color="#1d1d1e" />
      </button>
      <button class="icon active" on:click={handleReplaceAll}>
        <ArrowUpDown size="20" />
      </button>
      <button class="icon active" on:click={handleImportAll}>
        <Download />
      </button>
    </div>
    {#if isLoading}
      <div
        style="display:flex; flex-direction:row; justify-content:center; align-items:center; padding: 8px;"
      >
        <SyncLoader color="#adadad" size="28" />
      </div>
    {/if}
    <div id="card-list">
      {#each sequenceClips as clip, id}
        {#key clip.nodeId}
          <ClipCard
            {clip}
            onSelect={handleClipSelect}
            selected={false}
            {id}
            onReplace={handleReplaceClip}
            onImport={handleImportClip}
            onChange={handleClipOnChange}
          />
        {/key}
      {/each}
    </div>
  </div>
  <div id="coda-header">
    <div class="form-row"></div>
    <div
      style="display:flex; flex-direction:row; justify-content:flex-end;margin-left:2px;gap:2px"
    >
      <button
        class="icon"
        on:click={refreshShots}
        disabled={storedProject == null ? true : false}
      >
        <RefreshCw />
      </button>
      <button
        class="icon"
        on:click={openTracker}
        disabled={$sessionProject == null}
      >
        <ExternalLink />
      </button>
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

  #coda-header {
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

  #card-list {
    overflow: scroll;
    height: calc(100vh - 160px);
  }
</style>
