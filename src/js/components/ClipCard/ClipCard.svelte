<script lang="ts">
  import { onMount } from "svelte";
  import {
    Versions,
    Comments,
    Shot,
    ShotVersions,
    PatchItem,
  } from "../../api/buck5/buck5-api";
  import { fly } from "svelte/transition";
  import { Download, ArrowUpDown, RefreshCw } from "svelte-lucide";
  import { evalES } from "../../lib/utils/bolt";
  import { getShotById } from "buck5-javascript-client";
  import { GetFileVersion } from "../../api/files/files";
  export let clip: any;
  export let id = 0;
  export let selected = false;
  export let onSelect: Function;
  export let onReplace: Function;
  export let onImport: Function;
  export let onChange: Function;

  let selectedVersion = "";
  let publishedVersion = "";
  let editVersion = "";
  let comments: any[];
  export const BUCK_DAEMON_URL = "http://127.0.0.1:8000";

  export const FileUrl = (tb: string) => {
    return `${BUCK_DAEMON_URL}${tb}`;
  };

  let tb: string = "https://via.placeholder.com/71x40";
  let latestPublishedVersion = "v000";
  $: openComments = false;

  const handleSelectTask = async () => {
    if (onSelect) {
      onSelect(clip);
    }
  };

  const handleSelectVersion = async () => {
    console.log(selectedVersion);

    if (onChange) {
      onChange(clip, selectedVersion);
    }
  };

  const handleOnCommentClick = async (frame: number) => {
    evalES(`goToFrame(${frame})`, false);
  };

  const handleReplaceClip = () => {
    console.log("replace clip");
    onReplace(clip, selectedVersion);
  };

  const handleImportClip = () => {
    onImport(clip, selectedVersion);
  };

  const handleEditClipCLick = () => {
    const startFrame = clip.start * clip.sequenceFramerate;
    console.log(startFrame);
    evalES(`goToFrame(${startFrame}, false)`).then((res) => {});
  };

  $: getSyncedColor = () => {
    if (isSynced()) {
      return "color: #3caea3";
    } else {
      return "color: #f6d55c";
    }
  };

  $: isSynced = () => {
    if (!clip.trackerClip) return false;
    const compVersion = clip.trackerClip["values"]["Latest Comp"];
    const fileVersion = GetFileVersion(clip.filepath)?.split("v")[1];
    if (!fileVersion) return false;
    const timelineVersion = parseInt(fileVersion);
    console.log(compVersion, timelineVersion);
    return compVersion == timelineVersion;
  };

  const initCard = () => {
    selectedVersion = clip.versions[0];
    editVersion = GetFileVersion(clip.filepath) ?? "";
    publishedVersion = clip.trackerClip
      ? clip.trackerClip.values["Comp Version"]
      : "";
  };

  onMount(() => {
    initCard();
  });
</script>

<div
  class={!selected ? "clip-card" : "clip-card selected"}
  style={openComments ? "height:100%" : ""}
  on:click={handleSelectTask}
  on:keydown={handleSelectTask}
  transition:fly={{ y: 60, duration: 100, delay: id * 10 }}
>
  <div class="ingest-shot-row">
    {#if clip}
      <h4 id="shot-label" class="clip-name-header" style={getSyncedColor()}>
        {clip.shotName}
      </h4>
      <h4>{publishedVersion ? publishedVersion : "n/a"}</h4>
      <h4 class="edit-version" on:dblclick|preventDefault={handleEditClipCLick}>
        {editVersion}
      </h4>
      <div class="select-wrapper">
        <select bind:value={selectedVersion} on:change={handleSelectVersion}>
          {#each clip.versions as version, id}
            <option value={version}>
              {version.displayName}
            </option>
          {/each}
        </select>
      </div>

      <div
        style="display:flex; flex-direction:row; justify-content:flex-end;margin-left:2px;gap:2px"
      >
        <button
          class="icon active"
          on:click={handleReplaceClip}
          disabled={publishedVersion == selectedVersion ?? false}
        >
          <ArrowUpDown />
        </button>
        <button class="icon active" on:click={handleImportClip}>
          <Download />
        </button>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  @import "../../variables.scss";

  .comments-container {
    display: flex;
    flex-direction: column;
  }
  .selected {
    background-color: $highlight;
  }
  :hover {
    filter: brightness(1.1);
  }

  h4 {
    font-size: 11px;
    margin: 2px;
  }

  #shot-label {
    text-align: start;
    color: $active;
    max-width: 80px;
    margin-left: 6px;
  }

  .shot-tb {
    background-size: 53px;
    max-width: 53px;
    max-height: 30px;
    width: 42px;
    height: 30px;
    border-radius: 4px;
    filter: br ightness(0.9);
  }

  .edit-version {
    cursor: pointer;
  }
</style>
