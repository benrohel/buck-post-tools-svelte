<script lang="ts">
  import { onMount } from 'svelte';
  import { SquareCode, ChevronDown, ChevronUp } from 'lucide-svelte';
  import { evalES, evalFile } from '@/lib/utils/bolt';
  import { fs, os } from '@/lib/cep/node';
  import { CommonSharedFile } from '@/api/scripts/tools-scripts';
  import AeLogo from '@/../assets/ae-logo.svg';
  import { notifications } from '@/stores/notifications-store';
  import { logModule } from '@/lib/logger';

  const log = logModule('asset-card');

  export let aepFile: CommonSharedFile;

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
    log.debug('Asset file info requested', aepFile);
  };

  const handleImport = () => {
    let filepath = aepFile.path;
    if (os.platform() === 'win32') {
      filepath = aepFile.path.replace(/\\/g, '\\\\');
    }

    const options = {
      filepath: filepath,
      isSequence: false,
    };

    evalES(`importMediaFile(${JSON.stringify(options)})`, false).then((res) => {
      if (res) {
        notifications.success(`Successfully imported ${aepFile.name}`, 3000);
      } else {
        notifications.error(`Failed to import ${aepFile.name}`, 3000);
      }
    });
  };

  onMount(() => {
    offline = !fs.existsSync(aepFile.path);
  });
</script>

<div
  class={!selected ? 'clip-card' : 'clip-card selected'}
  on:keydown={handleOpenToolInfo}
>
  <div class="tool-card-container">
    {#if aepFile}
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
            on:click={handleImport}
            disabled={offline}
          >
            <img src={AeLogo} alt="AE Logo" />
          </button>
          <div id="shot-label" class="clip-name-header noselect">
            {aepFile.name}
          </div>
        </div>
      </div>
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
