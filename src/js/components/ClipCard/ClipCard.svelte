<script lang="ts">
  import type { ClipMetadata, VersionInfo } from '@/types/models';
  import type { ClipSelectCallback, OnChange2 } from '@/types/callbacks';
  import { onMount, getContext } from 'svelte';
  import { openFile } from '@/lib/utils/utils';
  import { fly } from 'svelte/transition';
  import { Download, ArrowUpDown, Eye } from 'lucide-svelte';
  import { evalES } from '@/lib/utils/bolt';
  import { GetFileVersion } from '@/api/files/files';
  import { checkVideoFileUpdate } from '@/api/video/video';
  import { appStore } from '@/stores/app-store';
  import { fs, path } from '@/lib/cep/node';
  import { Tooltip } from '@svelte-plugins/tooltips';
  import { appId } from '@/lib/utils/cep';
  export let clip: ClipMetadata;
  export let id = 0;
  export let selected = false;
  export let onSelect: ClipSelectCallback;
  export let onReplace: ClipSelectCallback;
  export let onImport: ClipSelectCallback;
  export let onChange: OnChange2<ClipMetadata, VersionInfo>;

  let selectedVersion: any = {};
  let publishedVersion = '';
  let editVersion = '';
  $: isVideoMatch = true;
  let videoDifferences: any[] = [];
  let isMissing = false;
  let showWarnings = $appStore.showVersionWarnings;

  export const BUCK_DAEMON_URL = 'http://127.0.0.1:8000';

  export const FileUrl = (tb: string) => {
    return `${BUCK_DAEMON_URL}${tb}`;
  };

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
    switch ($appStore.appId) {
      case 'PPRO':
        evalES(`goToFrame(${startFrame}, false)`).then((res) => {});
        break;
      case 'AEFT':
        evalES(`goToFrame(${clip.nodeId})`).then((res) => {});
        break;
    }
  };

  const handleOpenFile = () => {
    openFile(selectedVersion.filepath);
  };

  const handleCheckNewVersion = async () => {
    console.log('Checking new version');
    if (!clip.selectedVersion?.filepath) return;
    const result = await checkVideoFileUpdate(
      clip.filepath,
      clip.selectedVersion.filepath,
    );
    console.log(result);
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
    const fileVersion = clip.clipName?.split('_v')[1];
    if (!fileVersion) {
      return 'color: #f6d55c';
    }

    const timelineVersion = parseInt(fileVersion);
    if (selectedVersion.version == undefined) return 'color: #f6d55c';
    const intSelectedVersion = parseInt(
      selectedVersion.version?.match(/\d+/)[0],
    );
    const isSynced = intSelectedVersion == timelineVersion;
    let color = 'color: #f6d55c';
    if (isSynced) {
      color = 'color: #3caea3';
    }
    if (!isVideoMatch && showWarnings) {
      color = 'color: #ed553b';
    }
    return color;
  };

  $: initCard = async () => {
    if (appId === 'PPRO') {
      // const metadata = await evalES(`getPrMetadata(${clip.nodeId})`);
      // console.log(metadata);
    }

    if (!fs.existsSync(clip.filepath)) {
      isMissing = true;
    }
    if (clip) {
      selectedVersion = clip.selectedVersion;
      publishedVersion = clip.trackerClip
        ? clip.trackerClip.values['Comp Version']
        : '';

      if (!clip.shotName) {
        clip.shotName = path.basename(clip.filepath).split(/_v\d+/)[0];
      }
    } else {
      publishedVersion = '';
    }
    editVersion = GetFileVersion(clip.filepath) ?? '';
    if (showWarnings) {
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
    showWarnings = $appStore.showVersionWarnings;
    initCard();
  });
</script>

<Tooltip
  style={{ position: 'fixed !important' }}
  action={videoDifferences.length > 0 ? 'hover' : 'none'}
  content={`<b>Video differences detected:</b>${videoDifferences.map((diff) => `<p style="margin: 0px;">${diff.name}: ${diff.source} ≠ ${diff.destination}</p>`).join('')}`}
  position="bottom"
  delay={1000}
>
  <div
    class={!selected ? 'clip-card' : 'clip-card selected'}
    on:dblclick={handleEditClipCLick}
    on:keydown={handleSelectTask}
  >
    <div class="ingest-shot-row">
      {#if clip}
        <div style="display:flex; flex-direction:row ; align-items:center; ">
          <button class="icon" on:click={handleOpenFile}>
            <Eye />
          </button>
          <div>
            <h4
              id="shot-label"
              class="clip-name-header noselect"
              style={getSyncedColor()}
            >
              {#if !isVideoMatch && showWarnings}
                {clip.shotName}
              {:else}
                {clip.shotName}
              {/if}
            </h4>
          </div>
        </div>
        <h4>{publishedVersion ? publishedVersion : 'n/a'}</h4>
        <h4
          class="edit-version"
          on:dblclick|preventDefault={handleEditClipCLick}
        >
          {editVersion}
        </h4>
        <div class="select-wrapper">
          {#if clip.versions && clip.versions.length > 0}
            <select
              bind:value={selectedVersion}
              on:change={handleSelectVersion}
            >
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
              class={showWarnings && !isVideoMatch
                ? 'icon error'
                : 'icon active'}
              on:click={handleReplaceClip}
              disabled={editIsSelected() ||
                clip.filepath.match(/v\d+/) == null ||
                isMissing}
            >
              <ArrowUpDown />
            </button>
          </div>
          <button
            class="icon active"
            on:click={handleImportClip}
            disabled={editIsSelected() ||
              clip.filepath.match(/v\d+/) == null ||
              isMissing}
          >
            <Download />
          </button>
        </div>
      {/if}
    </div>
  </div>
</Tooltip>

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

  .tooltip-container {
    display: inline-block;
    position: relative;
    z-index: 1;
  }
</style>
