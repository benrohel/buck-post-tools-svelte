<script lang="ts">
  import { GetActiveSequence, GetSequencedClips } from '../../api/edit';
  import { openUrl } from '../../lib/utils/utils';
  import ClipCard from '../../components/ClipCard/ClipCard.svelte';
  import { trackerType } from '../../stores/settings-store'; //trackerType
  import { codaDoc } from '../../stores/local-storage';
  import CodaLogo from '../../assets/coda-logo.svg';
  import AquariumLogo from '../../assets/aquarium-logo.svg';
  import '../../api/coda/coda';
  import { GetCodaTrackerData } from '../../api/tracker/tracker';
  import { UpdateRow, UpsertRows, GetCodaIdFromUrl } from '../../api/coda/coda';
  import { Shots } from '../../api/buck5/buck5-api';
  import { notifications } from '../../stores/notifications-store';
  import {
    codaTrackerInfos,
    selectedCodaProject,
  } from '../../stores/coda-store';
  import { currentProject } from '../../stores/aquarium-store';
  import { sessionProject, storedProject } from '../../stores/local-storage';
  import { activeProjectKey } from '../../stores/settings-store';
  import {
    GetSystemFileVersionsWithShotName,
    GetFileVersion,
  } from '../../api/files/files';

  import { evalES } from '../../lib/utils/bolt';
  import {
    Download,
    Check,
    RefreshCw,
    ArrowUpDown,
    ExternalLink,
  } from 'svelte-lucide';
  import { onMount } from 'svelte';

  $: sequenceClips = [] as any[];
  $: clips = [] as any[];

  let openSettings = false;
  let selectedProjectName: string = '';

  $: trackerLogo = () => {
    return AquariumLogo;
  };

  const getClips = async () => {
    sequenceClips = [];
    const seq = await GetActiveSequence();
    const pproClips = await GetSequencedClips(seq.id);
    const systemClips = pproClips.map((clip) => {
      const fileVersion = GetSystemFileVersionsWithShotName(
        clip.filepath,
        clip.shotName
      );
      fileVersion.sort((a, b) => {
        if (a.version > b.version) {
          return -1;
        } else if (a.version < b.version) {
          return 1;
        } else {
          return 0;
        }
      });

      return {
        ...clip,
        versions: fileVersion,
        selectedVersion: fileVersion[0],
      };
    });

    sequenceClips = systemClips;

    if ($selectedCodaProject) {
      try {
        const docId = GetCodaIdFromUrl($selectedCodaProject.docUrl);
        const syncedClips = await GetCodaTrackerData(
          systemClips,
          docId,
          $selectedCodaProject.tableName
        );
        if (syncedClips.length > 0) {
          console.log('getting coda data');
          sequenceClips = syncedClips;
        }
      } catch (err) {
        console.log(err);
      }
    } else {
      console.log('no coda project selected');
    }
    console.log('sequenceClips', sequenceClips);
  };

  const handleSelectProject = (e: any) => {
    if ($codaTrackerInfos) {
      const proj = $codaTrackerInfos.find((p) => p.name === e.target.value);
      if (proj) {
        selectedCodaProject.set(proj);
      }
    }
    console.log('selected coda project', $selectedCodaProject);
  };

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

    sequenceClips = sequenceClips.map((c) => {
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
    console.log('replace all');
    sequenceClips.forEach((clip) => {
      handleReplaceClip(clip, clip.selectedVersion);
    });
  };
  const handleImportAll = () => {
    console.log('import all');
    sequenceClips.forEach((clip) => {
      handleImportClip(clip, clip.selectedVersion);
    });
  };

  const handleClipOnChange = async (clip: any, version: any) => {
    const foundClipIndex = sequenceClips.findIndex((c) => {
      return c.nodeId === clip.nodeId;
    });

    sequenceClips[foundClipIndex] = {
      ...clip,
      selectedVersion: version,
    };
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

  $: isCodaUrl = () => {
    if ($selectedCodaProject) {
      return true;
    } else {
      return false;
    }
  };

  const refreshShots = async () => {
    const shots = await Shots(storedProject);
  };

  const setCodaTable = async () => {
    if ($selectedCodaProject) {
      sessionProject.set(JSON.stringify($selectedCodaProject));
      openSettings = false;
      await getClips();
    }
  };

  const openTracker = () => {
    if ($sessionProject) {
      openUrl(`http://buck.aquarium.app/${$sessionProject}`);
    }
  };

  const refreshIngest = async () => {
    await getClips();
  };

  onMount(async () => {
    if ($sessionProject) {
      selectedCodaProject.set(JSON.parse($sessionProject));
    } else {
      if ($codaTrackerInfos && $codaTrackerInfos.length > 0) {
        selectedProjectName = $codaTrackerInfos[0].name;
      }
    }
    await refreshIngest();
    await codaTrackerInfos.load();
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
      <button class="icon" style="margin-left:4px" on:click={getClips}>
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

  {#if sequenceClips.length === 0}
    <p>selecet a project</p>
  {:else}
    <div>
      <div
        style="display:flex; flex-direction:row; justify-content:flex-end;margin-left:2px;gap:2px"
      >
        <button class="icon active" on:click={handleReplaceAll}>
          <ArrowUpDown />
        </button>
        <button class="icon active" on:click={handleImportAll}>
          <Download />
        </button>
      </div>
      <div id="card-list">
        {#each sequenceClips as clip, id}
          <ClipCard
            {clip}
            onSelect={handleClipSelect}
            selected={false}
            {id}
            onReplace={handleReplaceClip}
            onImport={handleImportClip}
            onChange={handleClipOnChange}
          />
        {/each}
      </div>
    </div>
    <div id="coda-header">
      <div class="form-row">
        <button
          style="margin:4px; width:auto"
          on:click={() => {
            openSettings = !openSettings;
          }}
        >
          <img src={trackerLogo()} alt="Coda logo" height="20" />
        </button>
        {#if openSettings}
          <div id="coda-settings">
            <div class="coda-form">
              <select
                bind:value={selectedProjectName}
                on:change={handleSelectProject}
              >
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
              <!-- {GetCodaIdFromUrl($selectedCodaProject.docUrl)} -->
            </div>
          </div>
        {/if}
      </div>
      <div
        style="display:flex; flex-direction:row; justify-content:flex-end;margin-left:2px;gap:2px"
      >
        <button
          class="icon active"
          on:click={refreshShots}
          disabled={storedProject == null ? true : false}
        >
          <RefreshCw />
        </button>
        <button
          class="icon active"
          on:click={openTracker}
          disabled={$sessionProject == null}
        >
          <ExternalLink />
        </button>
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  @import '../../variables.scss';
  .container {
    display: flex;
    flex-direction: row;
    overflow: hidden;
    align-items: center;
    align-content: center;
  }

  .ingest-container {
    display: flex;
    flex-direction: column;
  }
  .column-header {
    align-self: center;
    justify-self: center;
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
  label {
    align-self: flex-start;
    justify-self: flex-start;
    color: $dimmed-font-color;
  }

  .btn {
    margin-top: 8px;
    width: 100%;
  }

  input {
    width: 100%;
    border: 1px solid $dimmed-font-color;
  }
  #coda-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    justify-self: flex-end;
    // height: 30px;
    background-color: $darker;
    color: $font;
    width: 100%;
    gap: 8px;
    margin-bottom: 2px;
  }

  .coda-form {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    justify-self: flex-end;
    height: 30px;
    background-color: $darker;
    color: $font;
    width: 100%;
    gap: 8px;
    margin-bottom: 2px;
  }

  #coda-settings {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    justify-self: flex-end;
    height: 30px;
    background-color: $darker;
    color: $font;
    width: 100%;
    gap: 8px;
    margin-bottom: 2px;
  }

  #card-list {
    overflow: scroll;
    height: calc(100vh - 160px);
  }
</style>
