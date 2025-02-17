<script lang="ts">
  import { GetActiveSequence, GetSequencedClips } from "../../api/edit";
  import { openUrl } from "../../lib/utils/utils";
  import ClipCard from "../../components/ClipCard/ClipCard.svelte";
  import AquariumLogo from "../../assets/aquarium-logo.svg";
  import { Shots } from "../../api/buck5/buck5-api";
  import { sessionProject, storedProject } from "../../stores/local-storage";
  import {
    GetSystemFileVersionsWithShotName,
    GetFileVersion,
  } from "../../api/files/files";

  import { evalES } from "../../lib/utils/bolt";
  import {
    Download,
    Check,
    RefreshCw,
    ArrowUpDown,
    ExternalLink,
  } from "svelte-lucide";
  import { onMount, getContext } from "svelte";
  import MenuSelect from "../../components/MultiSelect/MenuSelect.svelte";

  const appId = getContext("appId");

  const ingestModes = [{ label: "Version Up", value: "versionup" }];

  $: sequenceClips = [] as any[];
  $: clips = [] as any[];

  const getPProClips = async () => {
    sequenceClips = [];
    const seq = await GetActiveSequence();
    const pproClips = await GetSequencedClips(seq.id);
    const systemClips = pproClips
      .filter((clip) => clip.filepath !== "")
      .filter((clip) => clip.selected)
      .map((clip) => {
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

    sequenceClips = [...systemClips];
  };

  const getAeClips = async () => {
    const selectedClips = JSON.parse(
      await evalES(`getSelectedClips()`, false)
    ) as any[];
    const systemClips = selectedClips
      .map((clip) => {
        return {
          ...clip,
          shotName: clip.name.split("_")[0],
        };
      })
      .map((clip) => {
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
    sequenceClips = [...systemClips];
  };

  const getClips = async () => {
    switch (appId) {
      case "PPRO":
        await getPProClips();
        break;
      case "AEFT":
        await getAeClips();
        break;
      default:
        break;
    }
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
            column: "Edit Version",
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
        shot_version: "v01",
      };
      const c = clips.find((c) => {
        return c.shot._key === clip.shotKey;
      });
    });
  };

  const refreshShots = async () => {
    const shots = await Shots(storedProject);
    console.log("client-shots", shots);
  };

  const openTracker = () => {
    if ($sessionProject) {
      openUrl(`http://buck.aquarium.app/${$sessionProject}`);
    }
  };
</script>

<MenuSelect items={ingestModes} value={ingestModes[0]} onChange={() => {}} />
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

  <div>
    <div
      style="display:flex; flex-direction:row; justify-content:flex-end;margin-left:4px;gap:4px"
    >
      <button class="icon active" on:click={handleReplaceAll}>
        <ArrowUpDown size="20" />
      </button>
      <button class="icon active" on:click={handleImportAll}>
        <Download />
      </button>
    </div>
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
  @use "../../variables.scss" as *;

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
