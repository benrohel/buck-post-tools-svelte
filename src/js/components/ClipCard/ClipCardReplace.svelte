<script lang="ts">
  import { fs, path } from '../../lib/cep/node';
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
  export let onChange: Function;
  export let selectedVersion = '';

  const handleSelectVersion = async () => {
    if (onChange) {
      onChange(clip, selectedVersion);
    }
  };
  const handleEditClipCLick = () => {
    const startFrame = clip.start * clip.sequenceFramerate;
    evalES(`goToFrame(${startFrame}, false)`).then((res) => {});
  };

  $: getSyncedColor = () => {
    if (isSynced()) {
      return 'color: #3caea3';
    } else {
      return 'color: #f6d55c';
    }
  };

  $: isSynced = () => {
    return clip.replacements && fs.existsSync(selectedVersion);
  };

  $: initCard = () => {
    if (clip.replacements && clip.replacements.length > 0)
      selectedVersion = clip.replacements[0];
  };

  onMount(() => {
    initCard();
  });
</script>

<div
  class={!selected ? 'clip-card' : 'clip-card selected'}
  on:dblclick={handleEditClipCLick}
  transition:fly={{ y: 60, duration: 100, delay: id * 10 }}
>
  <div class="replace-shot-row">
    {#if clip}
      <div style="display:flex; flex-direction:row ; align-items:center">
        <h4
          id="shot-label"
          class="clip-name-header noselect"
          style={getSyncedColor()}
        >
          {clip.filepath ? path.basename(clip.filepath) : clip.shotName}
        </h4>
      </div>
      <div>
        <h4>|</h4>
      </div>
      <div style="justify-self: start; display:flex">
        {#if clip.replacements && clip.replacements.length > 0}
          <div class="select-wrapper">
            <select
              bind:value={selectedVersion}
              on:change={handleSelectVersion}
            >
              {#each clip.replacements as version, id}
                <option value={version}>
                  {path.basename(version)}
                </option>
              {/each}
            </select>
          </div>
        {/if}
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
    max-width: 80px;
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
    justify-self: start;
  }
</style>
