<script lang="ts">
  import { onMount } from "svelte";
  import {
    GetActiveSequence,
    projectShots,
    GetSequencedClips,
  } from "../../api/edit";
  import { listProjectShots } from "buck5-javascript-client";
  import ClipCard from "../../components/ClipCard/ClipCard.svelte";
  import { GetFileVersions } from "../../api/files/files";

  let sequenceClips: any[] = [];

  onMount(async () => {
    const shots = await listProjectShots("493209227");
    console.log(shots);
    const seq = await GetActiveSequence();
    const clips = await GetSequencedClips(seq.id);
    const mappedClips = clips.map((clip) => {
      const fileVersion = GetFileVersions(clip.filepath, clip.shotName);

      const shot = shots.find((shot) => {
        return shot.data.name.toLowerCase().match(clip.shotName.toLowerCase());
      });
      return { ...clip, shotKey: shot?._key, versions: fileVersion };
    });

    console.log(mappedClips);
    sequenceClips = mappedClips;
  });

  const handleClipSelect = (task: any) => {
    console.log(task);
  };
</script>

<div class="container">
  <div
    class="ingest-shot-row"
    style="background-color: #161616; margin-bottom:8px"
  >
    <div style="width:53px"></div>
    <p class="clip-name-header">NAME</p>
    <p>COMP</p>
    <p>EDIT</p>
    <p>UPDATE TO</p>
    <p>ACTIONS</p>
  </div>
</div>
{#each sequenceClips as clip, id}
  <ClipCard {clip} onSelect={handleClipSelect} selected={false} {id} />
{/each}

<style lang="scss">
  @import "../../variables.scss";
  .container {
    display: flex;
    flex-direction: row;
    overflow: hidden;
    align-items: center;
    align-content: center;
  }

  .column-header {
    align-self: center;
    justify-self: center;
  }
  p {
    margin: 2px;
  }
</style>
