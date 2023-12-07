<script lang="ts">
  import { onMount } from "svelte";
  import { Versions, Comments, Shot, Shot } from "../../api/buck5/buck5-api";
  import StatusLabel from "../Status/StatusList.svelte";
  import { fly } from "svelte/transition";
  import { flip } from "svelte/animate";
  import Comment from "./Comment.svelte";
  import { IoIosArrowDropup, IoIosArrowDropdown } from "svelte-icons/io";
  import { evalES } from "../../lib/utils/bolt";
  import { getShotById, getshotById } from "buck5-javascript-client";
  import { each } from "svelte/internal";
  import { versions } from "process";
  import { FaDownload, FaSyncAlt } from "svelte-icons/fa";
  export let clip: any;
  export let id = 0;
  export let selected = false;
  export let onSelect: Function;

  let selectedVersion = "";
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
  };

  const handleOnCommentClick = async (frame: number) => {
    evalES(`goToFrame(${frame})`, false);
  };

  const GetShot = async () => {
    if (clip.shotKey) {
      const shot = await getShotById(clip.shotKey);

      if (shot) {
        return shot;
      } else {
        throw new Error("No shot found");
      }
    }
  };
  let shotPromise = GetShot();

  const handleReplaceClip = () => {
    let importOptions = {
      nodeId: clip.nodeId,
      oldPath: clip.filepath,
      newPath: selectedVersion.filepath,
      isSequence: false,
    };
    evalES(`replaceMedia(${JSON.stringify(importOptions)})`).then((res) => {
      return res ? true : false;
    });
  };

  const handleImportClip = () => {
    handleUpdate(shot, "import");
  };

  onMount(async () => {
    if (clip) {
      selectedVersion = clip.versions[0];
      console.log(clip);
      // const versions = await Versions(clip._key);
      // console.log("versions", versions);
      // if (versions.length > 0) {
      //   const latest = versions[versions.length - 1];
      //   if (latest) {
      //     latestPublishedVersion = latest.data.name;
      //     const receivedComments = await Comments(latest._key);
      //     if (receivedComments) {
      //       comments = receivedComments.sort((a, b) => {
      //         if (a.data.frameIn > b.data.frameIn) {
      //           return 1;
      //         } else if (a.data.frameIn < b.data.frameIn) {
      //           return -1;
      //         } else if (!b.data.frameIn) {
      //           return -1;
      //         } else {
      //           return 1;
      //         }
      //       });
      //     }
      //   }
      // }
    }
  });
</script>

<div
  class={!selected ? "clip-card" : "clip-card selected"}
  style={openComments ? "height:100%" : ""}
  on:click={handleSelectTask}
  transition:fly={{ y: 60, duration: 250, delay: id * 40 }}
>
  <div class="ingest-shot-row">
    {#await shotPromise}
      <p>...loading</p>
    {:then shot}
      {#if shot}
        <div class="shot-tb">
          <div
            class="shot-tb"
            id={`${shot._key}`}
            style={`background-image:url(${FileUrl(shot.data.thumbnail)});`}
          />
        </div>
        <h4 id="shot-label" class="clip-name-header">
          {shot.data.name.toUpperCase()}
        </h4>
        <h4>v012</h4>
        <h4>v010</h4>
        <div class="select-wrapper">
          <select bind:value={selectedVersion} on:change={handleSelectVersion}>
            {#each clip.versions as version, id}
              <option value={version}>{version.version}</option>
            {/each}
          </select>
        </div>
        <div
          style="display:flex; flex-direction:row; justify-content:flex-end;margin-left:2px;gap:2px"
        >
          <button class="icon" on:click={handleReplaceClip}>
            <FaSyncAlt />
          </button>
          <button class="icon" on:click={handleImportClip}>
            <FaDownload />
          </button>
        </div>
      {/if}
    {/await}
  </div>
</div>

<!-- 
  {#if openComments && comments}
    <div class="comments-container">
      {#each comments as comment, id (id)}
        <div animate:flip={{ duration: (d) => 40 * Math.sqrt(d) }}>
          <Comment {comment} onCommentClick={handleOnCommentClick} />
        </div>
      {/each}
    </div>
  {/if}
<div style="display:flex; gap:4px; align-items:center">
  {#if comments}
    <div
      class="fav-icon"
      on:click={() => {
        openComments = !openComments;
      }}
    >
      {#if openComments}
        <div class="fav-icons">
          <IoIosArrowDropup slot="icon" />
        </div>
      {:else}
        <div class="fav-icons">
          <IoIosArrowDropdown slot="icon" />
        </div>
      {/if}
    </div>
  {/if}
</div> -->

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
