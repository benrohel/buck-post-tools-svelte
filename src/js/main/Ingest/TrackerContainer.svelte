<script lang="ts">
  import { GetActiveSequence, GetSequencedClips } from "../../api/edit";
  import { listProjectShots } from "buck5-javascript-client";

  import ClipCardTracker from "../../components/ClipCard/ClipCardTracker.svelte";
  import { GetSystemFileVersions } from "../../api/files/files";

  import {
    currentEdit,
    currentProject,
    edits,
    shots,
    editClips,
  } from "../../stores/aquarium-store";
  import { evalES } from "../../lib/utils/bolt";
  import {
    GetClips,
    GetShotForClip,
    PatchItem,
  } from "../../api/buck5/buck5-api";

  import TrackerHeader from "./tracker-header.svelte";

  import { Download, FolderOpen, RefreshCw } from "svelte-lucide";
  import { onMount } from "svelte";

  let useAquarium = false;

  $: sequenceClips = [] as any[];
  let selectedEdit: any = null;
  $: clips = [] as any[];

  const handleSelectEdit = async () => {
    currentEdit.set(selectedEdit);
    let newClips = await GetClips(selectedEdit._key);
    const clipsWithShotsPromises = await newClips.map((clip: any) =>
      GetShotForClip(clip)
    );
    clips = await Promise.all(clipsWithShotsPromises);

    let mergedClips = clips.map((clip: any) => {
      const shot = sequenceClips.find((sc) => {
        return sc.shotKey === clip.shot._key;
      });
      return {
        ...clip,
        shotKey: shot._key ?? "",
        clipKey: clip?._key ?? "",
      };
    });
    sequenceClips = mergedClips;
  };

  currentProject.subscribe(async (proj) => {
    if (proj) {
      const loadedShots = await listProjectShots(proj._key);
      shots.set(loadedShots);
    }
    const seq = await GetActiveSequence();
    const pproClips = await GetSequencedClips(seq.id);
    const systemClips = pproClips.map((clip) => {
      const fileVersion = GetSystemFileVersions(clip.filepath, clip.shotName);
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
      let shot = clip;
      if (useAquarium) {
        const shot = $shots.find((shot) => {
          return shot.data.name
            .toLowerCase()
            .match(clip.shotName.toLowerCase());
        });
      }

      let clipKey = null;

      if (shot) {
        const c = clips.find((clip) => {
          console.log(clip);
          if (!clip.shot) {
            return null;
          }
          return clip.shot._key === shot?._key;
        });
        clipKey = c?._key;
      }

      return {
        ...clip,
        shotKey: shot?._key ?? "",
        clipKey: clipKey ?? "",
        versions: fileVersion,
      };
    });

    console.log("mapped", systemClips);
    sequenceClips = systemClips;
  });

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
      return c._key === clip._key;
    });
    console.log("foundClipIndex", sequenceClips[foundClipIndex]);
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
      if (c) {
        PatchItem(c._key, {
          data: data,
        }).then((res) => {
          console.log("patched", res);
        });
      }
    });
  };
</script>

<div class="container-header"></div>
{#if useAquarium}
  <TrackerHeader />
{/if}
<div class="container">
  <div
    class="ingest-shot-row"
    style="background-color: #161616; margin-bottom:8px. height:20px"
  >
    <div style="width:53px"></div>
    <p class="clip-name-header">NAME</p>
    <p>PUBLISHED</p>
    <p>EDIT</p>
    <p>UPDATE TO</p>
    <p>ACTIONS</p>
  </div>
</div>
{#if sequenceClips.length === 0 && useAquarium}
  <p>selecet a project</p>
{:else}
  {#each sequenceClips as clip, id}
    <ClipCardTracker
      {clip}
      onSelect={handleClipSelect}
      selected={false}
      {id}
      onReplace={handleReplaceClip}
      onImport={handleImportClip}
      onChange={handleClipOnChange}
    />
  {/each}
  {#if useAquarium}
    <div
      style="display: flex; flex-direction:row; justify-content:space-between"
    >
      <div style="display: flex; gap:2px">
        <button
          style="justify-self:flex-start"
          class="active"
          on:click={handleUpdateEditClips}>Update Edit Tracker</button
        >
        <div class="select-wrapper">
          {#await $edits then edits}
            <select bind:value={selectedEdit} on:change={handleSelectEdit}>
              {#each edits as edit, id}
                <option value={edit}>
                  {edit.data.name}
                </option>
              {/each}
            </select>
          {/await}
        </div>
      </div>
      <button class="icon">
        <FolderOpen />
      </button>
    </div>
    <div
      style="display:flex; flex-direction:row; justify-content:flex-end;margin-left:2px;gap:2px"
    >
      <button class="icon active" on:click={handleReplaceAll}>
        <RefreshCw />
      </button>
      <button class="icon active" on:click={handleImportAll}>
        <Download />
      </button>
    </div>
  {/if}
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
