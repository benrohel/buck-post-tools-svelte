<script lang="ts">
  import { GetActiveSequence, GetSequencedClips } from "../../api/edit";
  import { openUrl } from "../../lib/utils/utils";
  import ClipCard from "../../components/ClipCard/ClipCard.svelte";
  import { codaDoc, codaTable } from "../../stores/local-storage";
  import CodaLogo from "../../assets/coda-logo.svg";
  import "../../api/coda/coda";
  import { GetCodaTrackerData } from "../../api/tracker/tracker";
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
  import { onMount } from "svelte";

  $: sequenceClips = [] as any[];
  $: clips = [] as any[];

  let openSettings = false;
  $: codaUrl = "";
  $: codaTableId = "";

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
    if ($codaDoc && $codaTable) {
      try {
        const syncedClips = await GetCodaTrackerData(
          systemClips,
          $codaDoc,
          $codaTable
        );

        if (syncedClips.length > 0) {
          console.log("getting coda data");
          sequenceClips = syncedClips;
        }
      } catch (err) {
        console.log(err);
      }
    }
  };

  const handleClipSelect = (task: any) => {
    console.log(task);
  };

  const handleReplaceClip = (clip: any, selectedVersion: any) => {
    let importOptions = {
      nodeId: clip.nodeId,
      oldPath: clip.filepath,
      newPath: selectedVersion.filepath,
      isSequence: false,
    };
    evalES(`replaceMedia(${JSON.stringify(importOptions)})`).then((res) => {
      getClips();
    });
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
    console.log("replace all");
    sequenceClips.forEach((clip) => {
      handleReplaceClip(clip, clip.selectedVersion);
    });
  };
  const handleImportAll = () => {
    console.log("import all");
    sequenceClips.forEach((clip) => {
      handleImportClip(clip, clip.selectedVersion);
    });
  };

  const handleClipOnChange = (clip: any, version: any) => {
    console.log(version);
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

  $: isCodaUrl = () => {
    if (codaUrl.match("https://coda.io/d/")) {
      return true;
    } else {
      return false;
    }
  };

  const setCodaTable = async () => {
    codaDoc.set(codaUrl);
    codaTable.set(codaTableId);
    openSettings = false;
    await getClips();
  };

  $: isTableEmpty = () => {
    return codaTableId.length > 0;
  };

  const handleCodaSync = async () => {
    console.log("sync coda");
  };

  const openTracker = () => {
    if (codaUrl) {
      openUrl(codaUrl);
    }
  };

  const refreshIngest = async () => {
    if ($codaDoc) {
      console.log("codaDoc", $codaDoc);
      codaUrl = $codaDoc;
    }
    if ($codaTable) {
      codaTableId = $codaTable;
    }
    await getClips();
  };

  onMount(async () => {
    await refreshIngest();
  });
</script>

<div class="ingest-container">
  <div
    class="ingest-shot-row"
    style="background-color: #161616; margin-bottom:8px. height:20px"
  >
    <p class="clip-name-header">NAME</p>
    <p>PUBLISHED</p>
    <p>EDIT</p>
    <p>UPDATE TO</p>
    <div
      style="display:flex; flex-direction:row ; gap:2px; align-items:center; justify-self:end;"
    >
      <p style="justify-self:end; margin-right:4px">ACTIONS</p>
      <button class="icon active" style="margin-left:4px" on:click={getClips}>
        <RefreshCw />
      </button>
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
    <div id="coda-header">
      <div class="form-row">
        <button
          on:click={() => {
            openSettings = !openSettings;
          }}
        >
          <img src={CodaLogo} alt="Coda logo" height="20" />
        </button>
        {#if openSettings}
          <div id="coda-settings">
            <div class="coda-form">
              <input
                type="text"
                id="version"
                name="codadoc"
                placeholder="Coda Doc URL"
                bind:value={codaUrl}
              />
            </div>
            <div class="coda-form">
              <input
                type="text"
                id="version"
                name="codatable"
                placeholder="Table Name"
                bind:value={codaTableId}
              />
              <button
                class="icon active"
                on:click={setCodaTable}
                disabled={!isTableEmpty() && !isCodaUrl()}
              >
                <Check />
              </button>
            </div>
          </div>
        {/if}
      </div>
      <div
        style="display:flex; flex-direction:row; justify-content:flex-end;margin-left:2px;gap:2px"
      >
        <button
          class="icon active"
          on:click={handleCodaSync}
          disabled={!isTableEmpty() && !isCodaUrl()}
        >
          <RefreshCw />
        </button>
        <button
          class="icon active"
          on:click={openTracker}
          disabled={!isCodaUrl()}
        >
          <ExternalLink />
        </button>
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  @import "../../variables.scss";
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
</style>
