<script lang="ts">
  import { onMount } from 'svelte';
  import { SquareCode, Eye, ChevronDown, ChevronUp } from 'lucide-svelte';
  import { evalFile } from '../../lib/utils/bolt';
  import { fs, os } from '../../lib/cep/node';
  import path from 'path';
  import { SHARED_FOLDER } from '../../api/files/files';
  interface ToolData {
    name: string;
    filename: string;
    filepath:string;
    version?: string;
    description?: string;
    author?: string;
    icon?: string;
  }


  export let scriptTool: ToolData;
  let isMenuOpen = false;
  export let selected = false;

  let offline = true;

  const handleOpenFile = () => {
    // openFile(scripTool.filepath);
  };

  const handleMenuOpen = () => {
    isMenuOpen = !isMenuOpen;
  };

  const handleOpenToolInfo = () => {
    console.log(scriptTool);
  };

  const handleLaunchTool = () => {
    let filepath = scriptTool.filepath;
    if(os.platform()==='win32'){
    filepath = scriptTool.filepath.replace(/\\/g, '\\\\');
    }
    console.log('filePath', filepath);
   evalFile(filepath);
    
  };

  onMount(() => {
    offline = !fs.existsSync(scriptTool.filepath);
  });
</script>

<div
  class={!selected ? 'clip-card' : 'clip-card selected'}
  on:keydown={handleOpenToolInfo}
>
  <div class="tool-card-container">
    {#if scriptTool}
      <div
        style="display:flex; flex-direction:row; justify-content:space-between"
      >
        <div
          style="display:flex; flex-direction:row ; align-items:center; gap:4px"
        >
          <!-- <button class="icon" on:click={handleOpenFile}>
          <Eye />
        </button> -->
          <button
            class="icon active"
            on:click={handleLaunchTool}
            disabled={offline}
          >
            <SquareCode />
          </button>
          <div id="shot-label" class="clip-name-header noselect">
            {scriptTool.name}
          </div>
        </div>
        {#if scriptTool.description}
          <div class="tool-card-action">
            <button class="icon" on:click={handleMenuOpen}>
              {#if isMenuOpen}
                <ChevronUp />
              {:else}
                <ChevronDown />
              {/if}
            </button>
          </div>
        {/if}
      </div>
      {#if isMenuOpen}
        <div style="display:flex; flex-direction:row;margin-left:2px;gap:2px">
          <!-- <img src={scripTool.icon} alt="icon" style="width:20px;height:20px"/> -->
          <d class="tool-description">{scriptTool.description}</d>
        </div>
      {/if}
    {/if}
  </div>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  .tool-card-container {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 2px;
    background-color: $extra-dark;
    border-radius: 4px;
    padding: 4px;
  }

  .selected {
    background-color: $highlight;
  }
  :hover {
    filter: brightness(1.1);
  }

  #shot-label {
    font-size: 11px;
    text-align: start;
    margin-left: 6px;
  }

  .tool-description {
    font-size: 11px;
    margin: 2px;
    color: $font;
    text-align: left;
  }

  .edit-version {
    cursor: pointer;
  }

  .tool-card-action {
    margin-left: 8px;
  }
</style>
