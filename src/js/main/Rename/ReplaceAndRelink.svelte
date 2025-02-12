<script lang="ts">
  import {
    ArrowLeftRight,
    FolderSearch,
    RefreshCw,
    ListRestart,
  } from "lucide-svelte";
  import { evalES } from "../../lib/utils/bolt";
  import { GetRenamedFiles } from "../../api/files/files";
  import { GetSystemFileVersionsWithShotName } from "../../api/files/files";
  import { GetActiveSequence, GetSequencedClips } from "../../api/edit";
  import ClipCardReplace from "../../components/ClipCard/ClipCardReplace.svelte";
  import { fs } from "../../lib/cep/node";
  import { onMount, getContext } from "svelte";

  const appId = getContext("appId");
  let find = "";
  let replace = "";
  $: sequenceClips = [] as any[];
  let rootFolder = "";

  const getAeClips = async () => {
    const selectedClips = JSON.parse(await evalES(`getSelectedClips()`, false));
    console.log("selectedClips", selectedClips);
    const systemClips = selectedClips.map((clip: any) => {
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
    console.log("sequenceClips", sequenceClips);
  };

  const getPProClips = async () => {
    const seq = await GetActiveSequence();
    const pproClips = await GetSequencedClips(seq.id);
    const systemClips = pproClips
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
    console.log("sequenceClips", sequenceClips);
  };

  const getClips = async () => {
    switch (appId) {
      case "AEFT":
        await getAeClips();
        break;
      case "PPRO":
        await getPProClips();
        break;
      default:
        break;
    }
  };

  const resetList = () => {
    getClips();
    searchFiles();
  };

  const handleFindAndReplace = async () => {
    const options = {
      scope: "project",
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
    console.log("replace clip", clip, selectedVersion);
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
    console.log("replace all");
    sequenceClips.forEach((clip: any) => {
      handleReplaceClip(clip, clip.selectedVersion);
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
        replace
      );

      file.replacements = res.reverse();
      file.selectedVersion = file.replacements[0];
    }
    sequenceClips = [...currentFiles];
    console.log("res", sequenceClips);
  };

  const handleSetOutputFolder = async () => {
    const folderPath = await evalES(
      `openFolderDialog("Select New Root Folder.")`
    );
    if (folderPath) {
      rootFolder = folderPath;
      searchFiles();
    }
  };

  $: console.log("sequenceClips", sequenceClips);

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
  <div class="flex-row-start">
    <button on:click={handleSetOutputFolder}>
      <FolderSearch size="16" />
    </button>
    <p>{rootFolder}</p>
  </div>
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
  }
</style>
