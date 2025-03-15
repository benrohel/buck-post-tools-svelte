<script lang="ts">
  import { onMount } from 'svelte';
  import { openFile } from '../../lib/utils/utils';

  import { SquareCode, Eye, ChevronDown , ChevronUp} from 'lucide-svelte';
  import { evalFile } from '../../lib/utils/bolt';
  import is from 'date-fns/locale/is';

     interface ToolData {
  name: string;
  version: string;
  description: string;
  filepath: string;
  author?: string;
  icon?: string;
}

  export let scripTool: ToolData;
  let isMenuOpen = false;
  export let selected = false;


  const handleOpenFile = () => {

    // openFile(scripTool.filepath);
  };

  const handleMenuOpen = () => {
    isMenuOpen = !isMenuOpen;
  };

  const handleOpenToolInfo = () => {
    console.log(scripTool);
  };

  const handleLaunchTool = ()=>{
    evalFile(scripTool.filepath);
    console.log(scripTool);;
  }


  onMount(() => {
   
  });

</script>

<div
  class={!selected ? 'clip-card' : 'clip-card selected'}

  on:keydown={handleOpenToolInfo}
 
>
  <div class="tool-card-container">
    {#if scripTool}
    <div style="display:flex; flex-direction:row; justify-content:space-between">

      <div style="display:flex; flex-direction:row ; align-items:center; gap:4px">
        <!-- <button class="icon" on:click={handleOpenFile}>
          <Eye />
        </button> -->
        <button
        class="icon active"
        on:click={handleLaunchTool}
       
      >
      <SquareCode />
      </button>
        <h4
          id="shot-label"
          class="clip-name-header noselect"
         
        >
          {scripTool.name}
        </h4>
      </div>
      <button
        class="icon"
        
        on:click={handleMenuOpen}
      >
     {#if isMenuOpen}
      <ChevronUp />
      {:else}
      
      <ChevronDown />
     {/if}
      </button>
    </div>
    {#if isMenuOpen}
      
      <div
      style="display:flex; flex-direction:row;margin-left:2px;gap:2px"
      >
      <!-- <img src={scripTool.icon} alt="icon" style="width:20px;height:20px"/> -->
      <d class="tool-description">{scripTool.description}</d>
        
        
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
    padding: 4px;
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
    font-size: 12px;
    text-align: start;
    color: $active;
    margin-left: 6px;
    cursor: pointer;
  }

  .tool-description
  {
    font-size: 11px;
    margin: 2px;
    color: $font;
    text-align: left;
  }

  .edit-version {
    cursor: pointer;
  }
</style>
