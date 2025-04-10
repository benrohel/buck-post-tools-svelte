<script lang="ts">
  import { onMount, getContext } from 'svelte';
  import { openFile } from '../../lib/utils/utils';
  import { fly } from 'svelte/transition';
  import { Download, ArrowUpDown, Eye } from 'lucide-svelte';
  import { evalES } from '../../lib/utils/bolt';
  import { GetFileVersion } from '../../api/files/files';
  import { checkVideoFileUpdate } from '../../api/video/video';
  import { showWarnings } from '../../stores/settings-store';
  import Tooltip from '../Tooltip/Tooltip.svelte';
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
  $: isVideoMatch = false;
  let videoDifferences: any[] = [];

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
      handleCheckNewVersion();
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

  const handleCheckNewVersion = async () => {
    if (!clip.selectedVersion?.filepath) return;
    const result = await checkVideoFileUpdate(
      clip.filepath,
      clip.selectedVersion.filepath,
    );
    if (result.length > 0) {
      console.log(`Clip ${clip.shotName} is different: ${result}`);
      videoDifferences = result;
      isVideoMatch = false; // Set to false if there are differences
    } else {
      isVideoMatch = true;
      videoDifferences = [];
    }
  };

  $: getSyncedColor = (): string => {
    const fileVersion = GetFileVersion(clip.filepath)?.split('v')[1];
    if (!fileVersion) {
      return 'color: #f6d55c';
    }
    const timelineVersion = parseInt(fileVersion);
    if (selectedVersion.version == undefined) return 'color: #f6d55c';
    const intSelectedVersion = parseInt(
      selectedVersion.version?.match(/\d+/)[0],
    );
    let isSynced = intSelectedVersion == timelineVersion;
    let color = 'color: #f6d55c';
    if (isSynced) {
      color = 'color: #3caea3';
    }
    if (!isVideoMatch && $showWarnings) {
      color = 'color: #ed553b';
    }
    return color;
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
    if ($showWarnings) {
      handleCheckNewVersion();
    }
  };

  $: editIsSelected = () => {
    if (selectedVersion) {
      return editVersion == selectedVersion.version;
    } else {
      return false;
    }
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
      <div
        style="display:flex; flex-direction:row ; align-items:center; overflow: hidden"
      >
        <button class="icon" on:click={handleOpenFile}>
          <Eye />
        </button>
        <h4
          id="shot-label"
          class="clip-name-header noselect"
          style={getSyncedColor()}
        >
          {#if videoDifferences.length > 0 && $showWarnings}
            <Tooltip
              title={videoDifferences.length > 0
                ? `Video differences detected:\n${videoDifferences.map((diff) => `${diff.name}: ${diff.source} ≠ ${diff.destination}`).join('\n')}`
                : 'Replace with selected version'}
              position="top"
              dark={!isVideoMatch}
            >
              {clip.shotName}
            </Tooltip>
          {:else}
            {clip.shotName}
          {/if}
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
        <div class="tooltip-container">
          <button
            class={$showWarnings ? 'icon warning' : 'icon active'}
            on:click={handleReplaceClip}
            disabled={editIsSelected() || clip.filepath.match(/v\d+/) == null}
          >
            <ArrowUpDown />
          </button>
        </div>
        <button
          class="icon active"
          on:click={handleImportClip}
          disabled={editIsSelected() || clip.filepath.match(/v\d+/) == null}
        >
          <Download />
        </button>
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

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

  .edit-version {
    cursor: pointer;
  }

  .warning {
    background-color: #ed553b;
  }

  .tooltip-container {
    display: inline-block;
    position: relative;
  }
</style>
