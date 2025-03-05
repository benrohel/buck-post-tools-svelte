<script lang="ts">
  import { GetActiveSequence, GetSequencedClips } from '../../api/edit';
  import { openUrl } from '../../lib/utils/utils';
  import ClipCard from '../../components/ClipCard/ClipCard.svelte';
  import { Shots } from '../../api/buck5/buck5-api';
  import { sessionProject, storedProject } from '../../stores/local-storage';
  import { path } from '../../lib/cep/node';
  import {
    GetSystemFileVersionsWithShotName,
    GetFileVersion,
  } from '../../api/files/files';
  import { asyncDerived, asyncReadable } from '@square/svelte-store';
  import { evalES } from '../../lib/utils/bolt';
  import {
    Download,
    Check,
    RefreshCw,
    ArrowUpDown,
    ExternalLink,
  } from 'svelte-lucide';
  import { onMount, getContext } from 'svelte';
  import { GetFilesLibrary } from '../../api/files/files';
  import FileTable from './FileTable.svelte';
  import TreeNode from './TreeNode.svelte';

  const appId = getContext('appId');

  interface ClipEntry {
    file: string;
    frameRange: string;
  }

  $: sequenceClips = [] as any[];
  const clips = asyncReadable<ClipEntry[]>(null, async () => {
    return loadFiles();
  });
  $: filterName = '';

  $: console.log(clips);

  const getPProClips = async () => {
    sequenceClips = [];
    const seq = await GetActiveSequence();
    const pproClips = await GetSequencedClips(seq.id);
    const systemClips = pproClips
      .filter((clip) => clip.filepath !== '')
      .filter((clip) => clip.selected)
      .map((clip) => {
        const fileVersion = GetSystemFileVersionsWithShotName(
          clip.filepath,
          clip.shotName
        );
        fileVersion.sort((a, b) => {
          if (a.version > b.version) {
            return -1;
          } else if (a.version < b.version) {
            return 1;
          } else {
            return 0;
          }
        });
        return {
          ...clip,
          versions: fileVersion,
          selectedVersion: fileVersion[0],
        };
      });

    sequenceClips = [...systemClips];
  };

  const getAeClips = async () => {
    const selectedClips = JSON.parse(
      await evalES(`getSelectedClips()`, false)
    ) as any[];
    const systemClips = selectedClips
      .map((clip) => {
        return {
          ...clip,
          shotName: clip.name.split('_')[0],
        };
      })
      .map((clip) => {
        const fileVersion = GetSystemFileVersionsWithShotName(
          clip.filepath,
          clip.shotName
        );
        fileVersion.sort((a, b) => {
          if (a.version > b.version) {
            return -1;
          } else if (a.version < b.version) {
            return 1;
          } else {
            return 0;
          }
        });

        return {
          ...clip,
          versions: fileVersion,
          selectedVersion: fileVersion[0],
        };
      });
    sequenceClips = [...systemClips];
  };

  const handleClipSelect = (task: any) => {
    console.log(task);
  };

  const loadFiles = async () => {
    const projectFile = await evalES('getProjectFile()', false);
    const files = await GetFilesLibrary(projectFile);
    return files;
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

  const handleImportAll = () => {
    sequenceClips.forEach((clip) => {
      handleImportClip(clip, clip.selectedVersion);
    });
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

  const handleVersionChange = (event: any) => {
    const { file, version } = event.detail;
    handleClipOnChange(file, version);
  };

  const refreshShots = async () => {
    const shots = await Shots(storedProject);
    console.log('client-shots', shots);
  };
</script>

<div class="ingest-container">
  <div
    class="ingest-shot-row"
    style="background-color: #161616; margin-bottom:8px. height:20px"
  >
    <div
      style="display:flex; flex-direction:row ; gap:4px; align-items:center; justify-self:start;"
    >
      <button class="icon" style="margin-left:4px" on:click={loadFiles}>
        <RefreshCw />
      </button>
      <p class="clip-name-header">NAME</p>
    </div>
    <p>PUBLISHED</p>
    <p>EDIT</p>
    <p>UPDATE TO</p>
    <div
      style="display:flex; flex-direction:row ; gap:2px; align-items:center; justify-self:end;"
    >
      <p style="justify-self:end; margin-right:4px">ACTIONS</p>
    </div>
  </div>

  <div>
    <div
      style="display:flex; flex-direction:row; justify-content:flex-end;margin-left:4px;gap:4px"
    >
      <button class="icon active" on:click={handleImportAll}>
        <Download />
      </button>
    </div>

    <!-- <div>
      {#each clips as clip}
        <p>{path.basename(clip.file)}</p>
      {/each}
    </div> -->
    {#await clips.load()}
      <p>Loading...</p>
    {:then clips}
      <!-- <TreeNode {clips} on:versionChange={handleVersionChange} /> -->
      <FileTable {clips} on:versionChange={handleVersionChange} />
    {/await}

    <!-- <div id="card-list">
      {#each sequenceClips as clip, id}
        {#key clip.nodeId}
          <ClipCard
            {clip}
            onSelect={handleClipSelect}
            selected={false}
            {id}
            onReplace={handleReplaceClip}
            onImport={handleImportClip}
            onChange={handleClipOnChange}
          />
        {/key}
      {/each}
    </div> -->
  </div>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  .ingest-container {
    display: flex;
    flex-direction: column;
  }

  p {
    margin: 2px;
  }

  .form-row {
    display: flex;
    flex-direction: row;
    gap: 2pxx;
    align-items: center;
    flex-grow: 1;
  }

  #coda-header {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    justify-self: flex-end;
    color: $font;
    width: 100%;
    gap: 8px;
    margin-bottom: 4px;
  }

  #card-list {
    overflow: scroll;
    height: calc(100vh - 160px);
  }
</style>
