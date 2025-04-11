<script lang="ts">
  import {
    ArrowLeftRight,
    FolderSearch,
    RefreshCw,
    ListRestart,
  } from 'lucide-svelte';
  import { evalES } from '../../lib/utils/bolt';
  import { GetRenamedFiles } from '../../api/files/files';
  import { GetSystemFileVersionsWithShotName } from '../../api/files/files';
  import { GetActiveSequence, GetSequencedClips } from '../../api/edit';
  import ClipCardReplace from '../../components/ClipCard/ClipCardReplace.svelte';
  import { fs } from '../../lib/cep/node';
  import SelectFolder from '../../components/SelectFolder/SelectFolder.svelte';
  import { onMount, getContext } from 'svelte';
  import FolderSelctWeb from '../../components/SelectFolder/SelectFolderWeb.svelte';
  import { getClips } from '../../api/clip';
  import { SyncLoader } from 'svelte-loading-spinners';
  import { notifications } from '../../stores/notifications-store';

  const appId = getContext('appId');
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
    console.log(options);
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
      searchFiles();
    }
  };

  $: console.log(rootFolder);

  onMount(async () => {
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
  <FolderSelctWeb bind:value={rootFolder} />
  <button on:click={searchFiles} style="justify-self:flex-end">
    <RefreshCw size="16" />
  </button>
</div>

<div>
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

  <div
    style="display: flex; flex-direction: row; align-items: center; justify-content: space-between"
  >
    <button on:click={resetList} style="justify-self:flex-start">
      <ListRestart size="16" />
    </button>
    {#if isLoading}
      <SyncLoader color="#adadad" size="20" />
    {/if}
    <button class="active" on:click={handleReplaceAll}> Relink Clips </button>
  </div>
</div>

<style lang="scss">
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
</style>
