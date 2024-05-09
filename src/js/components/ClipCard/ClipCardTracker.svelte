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
  import { Download, FolderOpen, RefreshCw } from "svelte-lucide";
  import { evalES } from "../../lib/utils/bolt";
  import { getShotById } from "buck5-javascript-client";
  import { GetFileVersion } from "../../api/files/files";
  export let clip: any;
  export let id = 0;
  export let useTracker = false;
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
      onChange(clip, editVersion);
    }
  };

  const handleOnCommentClick = async (frame: number) => {
    evalES(`goToFrame(${frame})`, false);
  };

  const GetShot = async () => {
    if (useTracker) {
      console.log("GetShot", clip.shotKey);
      if (clip.shotKey) {
        const shot = await getShotById(clip.shotKey);

        if (shot) {
          return shot;
        } else {
          throw new Error("No shot found");
        }
      }
    } else {
      return clip;
    }
  };

  let shotPromise = GetShot();

  const handleReplaceClip = () => {
    console.log("replace clip");
    console.log(editVersion);
    onReplace(clip, selectedVersion);

    PatchItem(clip.clipKey, {
      shot_version: editVersion,
    });
    // let importOptions = {
    //   nodeId: clip.nodeId,
    //   oldPath: clip.filepath,
    //   newPath: selectedVersion.filepath,
    //   isSequence: false,
    // };
    // evalES(`replaceMedia(${JSON.stringify(importOptions)})`).then((res) => {
    //   editVersion = selectedVersion.version;
    //   return res ? true : false;
    // });
  };

  const handleImportClip = () => {
    onImport(clip, selectedVersion);
  };

  $: getSyncedColor = () => {
    if (publishedVersion == editVersion) {
      return "color: #3caea3";
    } else {
      return "color: #f6d55c";
    }
  };

  const initCard = async () => {
    selectedVersion = clip.versions[0];
    // const versions = await ShotVersions(clip.shotKey);
    // publishedVersion = versions.pop()?.item.data.name;
    // editVersion = GetFileVersion(clip.filepath) ?? "";
  };

  onMount(async () => {
    await initCard();
  });
</script>

<div
  class={!selected ? "clip-card" : "clip-card selected"}
  style={openComments ? "height:100%" : ""}
  on:click={handleSelectTask}
  on:keydown={handleSelectTask}
  transition:fly={{ y: 60, duration: 250, delay: id * 40 }}
>
  <div class="ingest-shot-row">
    {#await shotPromise}
      <p>...loading</p>
    {:then shot}
      {#if shot}
        <div class="shot-tb">
          <div class="shot-tb" id={`${shot._key}`} />
          <!-- style={`background-image:url(${FileUrl(shot.data.thumbnail)});`} -->
        </div>
        <h4 id="shot-label" class="clip-name-header" style={getSyncedColor()}>
          {shot.data.name.toUpperCase()}
        </h4>
        <h4>{publishedVersion}</h4>
        <h4>{editVersion}</h4>
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
            <RefreshCw />
          </button>
          <button class="icon active" on:click={handleImportClip}>
            <Download />
          </button>
        </div>
      {/if}
    {/await}
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
    font-size: 12px;
    margin: 2px;
  }

  #shot-label {
    text-align: start;
    color: $active;
  }

  .shot-tb {
    background-size: 53px;
    max-width: 53px;
    max-height: 30px;
    width: 53px;
    height: 30px;
    border-radius: 4px;
    filter: brightness(0.9);
  }
</style>
