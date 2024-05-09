<script lang="ts">
  import { GetActiveSequence, GetSequencedClips } from "../../api/edit";
  import ClipCard from "../../components/ClipCard/ClipCard.svelte";
  import { GetSystemFileVersionsWithShotName } from "../../api/files/files";
  import { evalES } from "../../lib/utils/bolt";
  import { Download, FolderOpen, RefreshCw } from "svelte-lucide";
  import { onMount } from "svelte";

  $: sequenceClips = [] as any[];
  $: clips = [] as any[];

  const getClips = async () => {
    // sequenceClips = [];
    const seq = await GetActiveSequence();
    const pproClips = await GetSequencedClips(seq.id);
    const systemClips = pproClips.map((clip) => {
      const fileVersion = GetSystemFileVersionsWithShotName(
        clip.filepath,
        clip.shotName
      );
      console.log("fileVersion", fileVersion);
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
      };
    });

    sequenceClips = systemClips;
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
    evalES(`replaceMedia(${JSON.stringify(importOptions)})`).then((res) => {});
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
  };
  const handleImportAll = () => {
    console.log("import all");
  };
  const handleClipOnChange = (clip: any, version: any) => {
    const foundClipIndex = sequenceClips.findIndex((c) => {
      return c.nodeId === clip.nodeId;
    });

    sequenceClips[foundClipIndex] = {
      ...clip,
      editVersion: version,
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

  onMount(async () => {
    await getClips();
  });
</script>

<div class="container-header"></div>

<div class="container">
  <div
    class="ingest-shot-row"
    style="background-color: #161616; margin-bottom:8px. height:20px"
  >
    <button class="icon active" on:click={getClips}>
      <RefreshCw />
    </button>

    <p class="clip-name-header">NAME</p>
    <p>PUBLISHED</p>
    <p>EDIT</p>
    <p>UPDATE TO</p>
    <p>ACTIONS</p>
  </div>
</div>
{#if sequenceClips.length === 0}
  <p>selecet a project</p>
{:else}
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
{/if}

<style lang="scss">
  @import "../../variables.scss";
  .container {
    display: flex;
    flex-direction: row;
    overflow: hidden;
    align-items: center;
    align-content: center;
  }

  .column-header {
    align-self: center;
    justify-self: center;
  }
  p {
    margin: 2px;
  }
</style>
