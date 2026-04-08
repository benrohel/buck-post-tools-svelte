<script lang="ts">
  import { onMount, getContext } from 'svelte';

  import {
    ArrowLeftRight,
    FolderSearch,
    RefreshCw,
    ListRestart,
  } from 'lucide-svelte';
  import { SyncLoader } from 'svelte-loading-spinners';
  import { Tooltip } from '@svelte-plugins/tooltips';

  import ClipCardReplace from '@/components/ClipCard/ClipCardReplace.svelte';
  import FolderSelctWeb from '@/components/SelectFolder/SelectFolderWeb.svelte';
  import ProgressBar from '@/components/ProgressBar/ProgressBar.svelte';

  import { notifications } from '@/stores/notifications-store';
  import { lastFolderSearch } from '@/stores/local-storage';
  import { appStore } from '@/stores/app-store';

  import { evalES } from '@/lib/utils/bolt';
  import { GetRenamedFiles } from '@/api/files/files';
  import { fs } from '@/lib/cep/node';
  import { getClips } from '@/api/clip';

  import { logModule } from '@/lib/logger';
  const log = logModule('replace-and-relink');

  let find = '';
  let replace = '';
  let sequenceClips = [] as any[];
  let rootFolder = '';
  let isLoading = false;
  let isProcessing = false;
  let processedCount = 0;
  let totalCount = 0;

  $: progressPercentage =
    totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;

  $: if (rootFolder && $appStore.rememberLastFolderSearch) {
    log.debug('Root folder updated', { rootFolder });
    lastFolderSearch.set(rootFolder);
  }

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
    log.debug('Replace clip', {
      clipName: clip.clipName,
      nodeId: clip.nodeId,
      selectedVersion,
    });
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
    log.debug('Replace clip result', { result: res });
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

  const handleReplaceAll = () => {
    // Only process clips that have a selectedVersion
    const clipsToProcess = sequenceClips.filter((clip) => clip.selectedVersion);
    isProcessing = true;
    processedCount = 0;
    totalCount = clipsToProcess.length;

    if (clipsToProcess.length === 0) {
      notifications.warning('No clips selected for replacement', 2000);
      isProcessing = false;
      return;
    }
    // Process first clip and set up chain
    processNextClip(clipsToProcess, 0);
  };

  // Process clips one at a time, updating progress as we go
  const processNextClip = async (clips: any[], index: number) => {
    // If we've processed all clips, we're done
    if (index >= clips.length) {
      notifications.success('All clips have been successfully replaced', 2000);
      isProcessing = false;
      return;
    }

    const clip = clips[index];

    try {
      // Process this clip
      await handleReplaceClip(clip, clip.selectedVersion);

      // Update progress
      processedCount++;

      // Process next clip
      processNextClip(clips, index + 1);
    } catch (error) {
      log.error(`Error processing clip ${clip.clipName}`, error as Error, {
        clipName: clip.clipName,
      });
      notifications.error(`Failed to replace clip ${clip.clipName}`, 2000);
      isProcessing = false;
    }
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
    log.debug('Searching files', { rootFolder, find, replace });
    if (!rootFolder || !find || !replace) {
      return;
    }
    isLoading = true;
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
    log.debug(
      'Search files complete',
      {
        clipCount: sequenceClips.length,
        hasReplacements: sequenceClips.some((c) => c.replacements?.length > 0),
      },
      sequenceClips,
    );
    isLoading = false;
  };

  const handleSetOutputFolder = async (folderPath: string) => {
    if (folderPath && typeof folderPath === 'string') {
      rootFolder = folderPath;
      if ($appStore.rememberLastFolderSearch) {
        lastFolderSearch.set(folderPath);
      }
      searchFiles();
    }
  };

  onMount(async () => {
    if ($lastFolderSearch !== null && $appStore.rememberLastFolderSearch) {
      log.debug('Restored last folder search', {
        lastFolderSearch: $lastFolderSearch,
      });
      rootFolder = $lastFolderSearch;
    }
    await getClips();
  });
</script>

<div class="row">
  <input type="text" placeholder="Find" bind:value={find} />
  <input type="text" placeholder="Replace" bind:value={replace} />
</div>

<div>
  <FolderSelctWeb onChange={handleSetOutputFolder} bind:value={rootFolder} />
</div>

<div class="flex-row-end">
  <Tooltip
    action="hover"
    content="Refresh Clips"
    position="bottom"
    delay={1000}
  >
    <button on:click={resetList}>
      <RefreshCw size="16" />
    </button>
  </Tooltip>
  <Tooltip
    action="hover"
    content="Search Rename"
    position="bottom"
    delay={1000}
  >
    <button on:click={searchFiles}>
      <FolderSearch size="16" />
    </button>
  </Tooltip>
  <Tooltip
    action="hover"
    content="Replace project clip names"
    position="bottom"
    delay={1000}
  >
    <button on:click={handleFindAndReplace}>
      <ArrowLeftRight size="16" />
    </button>
  </Tooltip>
  <Tooltip action="hover" content="Replace All" position="bottom" delay={1000}>
    <button on:click={handleReplaceAll}>
      <ListRestart size="16" />
    </button>
  </Tooltip>
</div>

{#if isProcessing}
  <ProgressBar percentage={progressPercentage} />
  <div class="progress-text">
    Processing {processedCount} of {totalCount} clips...
  </div>
{/if}

{#if isLoading}
  <div class="loading">
    <SyncLoader size="60" color="#FF3E00" unit="px" duration="1s" />
  </div>
{/if}

<div class="clip-list">
  {#each sequenceClips as clip, i}
    <ClipCardReplace {clip} id={i} onChange={handleClipOnChange} />
  {/each}
</div>

<style lang="scss">
  .toto:hover {
    color: red;
  }

  .row {
    width: 100%;
  }

  .clip-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 8px;
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 16px;
  }

  .progress-text {
    text-align: center;
    margin-top: 8px;
    font-size: 12px;
    color: #999;
  }
</style>
