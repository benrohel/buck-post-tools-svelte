<script lang="ts">
  import { onMount } from 'svelte';
  import { openFile } from '../../lib/utils/utils';
  import { fly } from 'svelte/transition';
  import { Download, ArrowUpDown, Eye } from 'svelte-lucide';
  import { evalES } from '../../lib/utils/bolt';
  import { getShotById } from 'buck5-javascript-client';
  import { GetFileVersion } from '../../api/files/files';
  export let clip: any;
  export let id = 0;
  export let selected = false;
  export let onSelect: Function;
  export let onReplace: Function;
  export let onImport: Function;
  export let onChange: Function;

  let selectedVersion: any = {};
  let publishedVersion = '';
  let editVersion = '';

  export const BUCK_DAEMON_URL = 'http://127.0.0.1:8000';

  export const FileUrl = (tb: string) => {
    return `${BUCK_DAEMON_URL}${tb}`;
  };

  let tb: string = 'https://via.placeholder.com/71x40';

  const handleSelectTask = async () => {
    if (onSelect) {
      onSelect(clip);
    }
  };

  const handleSelectVersion = async () => {
    if (onChange) {
      onChange(clip, selectedVersion);
    }
  };

  const handleOnCommentClick = async (frame: number) => {
    evalES(`goToFrame(${frame})`, false);
  };

  const handleReplaceClip = () => {
    console.log('replace clip');
    editVersion = selectedVersion.version;
    onReplace(clip, selectedVersion);
  };

  const handleImportClip = () => {
    onImport(clip, selectedVersion);
  };

  const handleEditClipCLick = () => {
    const startFrame = clip.start * clip.sequenceFramerate;
    evalES(`goToFrame(${startFrame}, false)`).then((res) => {});
  };

  const handleOpenFile = () => {
    openFile(selectedVersion.filepath);
  };

  $: getSyncedColor = () => {
    if (isSynced()) {
      return 'color: #3caea3';
    } else {
      return 'color: #f6d55c';
    }
  };

  $: isSynced = () => {
    if (!clip.trackerClip) return false;
    const compVersion = clip.trackerClip['values']['Latest Comp'];
    const fileVersion = GetFileVersion(clip.filepath)?.split('v')[1];
    if (!fileVersion) return false;
    const timelineVersion = parseInt(fileVersion);
    initCard();
    return compVersion == timelineVersion;
  };

  $: initCard = () => {
    if (clip) {
      selectedVersion = clip.selectedVersion;
      publishedVersion = clip.trackerClip
        ? clip.trackerClip.values['Comp Version']
        : '';
    } else {
      publishedVersion = '';
    }
    console.log('init card', clip);
    editVersion = GetFileVersion(clip.filepath) ?? '';
  };

  $: editIsSelected = () => {
    if (selectedVersion) {
      editVersion == selectedVersion.version ?? '';
    }
    return editVersion == selectedVersion.version;
  };

  onMount(() => {
    initCard();
  });
</script>

<div
  class={!selected ? 'clip-card' : 'clip-card selected'}
  on:dblclick={handleEditClipCLick}
  on:keydown={handleSelectTask}
  transition:fly={{ y: 60, duration: 100, delay: id * 10 }}
>
  <div class="ingest-shot-row">
    {#if clip}
      <div style="display:flex; flex-direction:row ; align-items:center">
        <button class="icon" on:click={handleOpenFile}>
          <Eye />
        </button>
        <h4
          id="shot-label"
          class="clip-name-header noselect"
          style={getSyncedColor()}
        >
          {clip.shotName}
        </h4>
      </div>
      <h4>{publishedVersion ? publishedVersion : 'n/a'}</h4>
      <h4 class="edit-version" on:dblclick|preventDefault={handleEditClipCLick}>
        {editVersion}
      </h4>
      <div class="select-wrapper">
        {#if clip.versions && clip.versions.length > 0}
          <select bind:value={selectedVersion} on:change={handleSelectVersion}>
            {#each clip.versions as version, id}
              <option value={version}>
                {version.displayName}
              </option>
            {/each}
          </select>
        {/if}
      </div>

      <div
        style="display:flex; flex-direction:row; justify-content:flex-end;margin-left:2px;gap:2px"
      >
        <button
          class="icon active"
          on:click={handleReplaceClip}
          disabled={editIsSelected()}
        >
          <ArrowUpDown />
        </button>
        <button
          class="icon active"
          on:click={handleImportClip}
          disabled={editIsSelected()}
        >
          <Download />
        </button>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  @import '../../variables.scss';

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
    margin-left: 6px;
    cursor: pointer;
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
