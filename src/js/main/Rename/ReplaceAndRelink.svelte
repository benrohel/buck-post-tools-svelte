<script lang="ts">
  import {
    ArrowLeftRight,
    FolderSearch,
    RefreshCw,
    ListRestart,
  } from 'lucide-svelte';
  import { evalES } from '../../lib/utils/bolt';
  import { GetRenamedFiles } from '../../api/files/files';
  import ClipCardReplace from '../../components/ClipCard/ClipCardReplace.svelte';
  import { fs } from '../../lib/cep/node';
  import { onMount, getContext } from 'svelte';
  import FolderSelctWeb from '../../components/SelectFolder/SelectFolderWeb.svelte';
  import { getClips } from '../../api/clip';
  import { SyncLoader } from 'svelte-loading-spinners';
  import { notifications } from '../../stores/notifications-store';
  import { Tooltip } from '@svelte-plugins/tooltips';
  import { lastFolderSearch } from '../../stores/local-storage';
  import { type AppStore } from '../../stores/app-store';
  import type { Writable } from 'svelte/store';
  const appStore = getContext('app-store') as Writable<AppStore>;

  let find = '';
  let replace = '';
  $: sequenceClips = [] as any[];
  let rootFolder = '';
  let isLoading = false;

  const resetList = async () => {
    isLoading = true;
    sequenceClips = await getClips();
    await searchFiles();
    isLoading = false;
  };

  const handleFindAndReplace = async () => {
    const options = {
      scope: 'project',
      from: find,
      to: replace,
    };

    let prevReplace = replace;
    await evalES(`findAndReplace(${JSON.stringify(options)})`).then((res) => {
      replace = find;
      find = prevReplace;
    });
  };

  const handleReplaceClip = async (clip: any, selectedVersion: any) => {
    console.log('replace clip', clip, selectedVersion);
    let importOptions = {
      nodeId: clip.nodeId,
      oldPath: clip.filepath,
      newPath: selectedVersion,
      isSequence: false,
    };

    if (!fs.existsSync(selectedVersion)) {
      return;
    }
    const res = await evalES(`replaceMedia(${JSON.stringify(importOptions)})`);
    console.log('replace clip result: ', res);
    const updatedClip = JSON.parse(res);

    sequenceClips = sequenceClips.map((c: any) => {
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
  };

  const handleReplaceAll = async () => {
    console.log('replace all');
    for (const clip of sequenceClips) {
      await handleReplaceClip(clip, clip.selectedVersion);
    }
    notifications.success('All clips have been successfully replaced', 2000);
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

  const searchFiles = async () => {
    if (!rootFolder || !find || !replace) {
      return;
    }
    await getClips();
    const currentFiles = sequenceClips;

    for (let file of currentFiles) {
      const res = await GetRenamedFiles(
        file.filepath,
        rootFolder,
        find,
        replace,
      );

      file.replacements = res.reverse();
      file.selectedVersion = file.replacements[0];
    }
    sequenceClips = [...currentFiles];
    console.log('res', sequenceClips);
  };

  const handleSetOutputFolder = async (folderPath: string) => {
    if (folderPath) {
      rootFolder = folderPath;
      if ($appStore.rememberLastFolderSearch) {
        lastFolderSearch.set(folderPath);
      }
      searchFiles();
    }
  };

  $: () => {
    console.log('rootFolder', rootFolder);
    if ($appStore.rememberLastFolderSearch) {
      lastFolderSearch.set(rootFolder);
    }
  };

  onMount(async () => {
    if ($lastFolderSearch !== null && $appStore.rememberLastFolderSearch) {
      console.log('lastFolderSearch', $lastFolderSearch);
      rootFolder = $lastFolderSearch;
    }
    await getClips();
  });
</script>

<div style="display:flex; flex-direction:row">
  <div class="row">
    <input type="text" placeholder="Find" bind:value={find} />
    <button on:click={handleFindAndReplace} tabindex="-1">
      <ArrowLeftRight size="16" />
    </button>
    <input type="text" placeholder="Replace" bind:value={replace} />
  </div>
</div>

<div id="search-folder">
  <FolderSelctWeb bind:value={rootFolder} onChange={handleSetOutputFolder} />
  <Tooltip
    action={$appStore.showTooltips ? 'hover' : 'none'}
    content="Search clips in Folder"
    position="left"
    delay={1000}
  >
    <button on:click={searchFiles} style="justify-self:flex-end">
      <RefreshCw size="16" />
    </button>
  </Tooltip>
</div>
<div
  style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; margin-bottom: 4px;"
>
  <Tooltip
    action={$appStore.showTooltips ? 'hover' : 'none'}
    content="Reload Clips Selection"
    position="right"
    delay={1000}
  >
    <button on:click={resetList} style="justify-self:flex-start">
      <ListRestart size="16" />
    </button>
  </Tooltip>
  {#if isLoading}
    <SyncLoader color="#adadad" size="20" />
  {/if}

  <button title="Relink Clips" class="active" on:click={handleReplaceAll}>
    Relink Clips
  </button>
</div>
<div style=" height: calc(100vh - 180px); overflow:scroll">
  <div style="overflow: scroll">
    {#if sequenceClips && sequenceClips.length > 0}
      {#each sequenceClips as clip, id}
        <ClipCardReplace
          {clip}
          selected={false}
          {id}
          onChange={handleClipOnChange}
          selectedVersion={clip.selectedVersion}
        />
      {/each}
    {/if}
  </div>
</div>

<style lang="scss">
  .toto:hover {
    color: red;
  }

  .row {
    width: 100%;
  }

  input {
    width: 100%;
  }

  #search-folder {
    gap: 6px;
    display: flex;
    flex-direction: row;
    align-items: center;
    font-size: 10px;
    overflow-x: hidden;
    text-overflow: ellipsis;
    justify-content: space-between;
    margin-bottom: 4px;
  }

  // .tooltip {
  //   position: relative;
  //   display: inline-block;
  // }

  // .tooltip .tooltip-text {
  //   visibility: hidden;
  //   width: 120px;
  //   background-color: #555;
  //   color: #fff;
  //   text-align: center;
  //   border-radius: 6px;
  //   padding: 5px;
  //   position: absolute;
  //   z-index: 1;
  //   bottom: 125%;
  //   left: 50%;
  //   transform: translateX(-50%);
  //   opacity: 0;
  //   transition: opacity 0.3s;
  // }

  // .tooltip:hover .tooltip-text {
  //   visibility: visible;
  //   opacity: 1;
  // }
</style>
