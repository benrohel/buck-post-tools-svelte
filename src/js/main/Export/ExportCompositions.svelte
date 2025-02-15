<script lang="ts">
  import { ChevronDown, ChevronUp, PlusSquare } from "svelte-lucide";
  import SelectFolder from "../../components/SelectFolder/SelectFolder.svelte";
  import { evalES } from "../../lib/utils/bolt";
  import {
    exportPresets,
    selectedExportPreset,
  } from "../../stores/local-storage";
  import { sequenceOutputFolder } from "../../stores/local-storage";
  import { ArrowLeftRight, ListPlus } from "lucide-svelte";
  import { onMount } from "svelte";
  import { fs, path } from "../../lib/cep/node";

  $: presetList = () => {
    if ($exportPresets) {
      return $exportPresets.split(",");
    } else {
      return [];
    }
  };

  const tokenList = [
    {
      value: "compName",
      label: "Comp Name",
    },
    {
      value: "projectVersion",
      label: "Project Version",
    },
    {
      value: "version",
      label: "Version",
    },
    {
      label: "frameNumber",
      value: "frameNumber",
    },
    {
      value: "/",
      label: "folder",
    },
  ];

  let activePreset = $selectedExportPreset;
  let activeRenderSetting = "";
  let showBuildPreset = false;
  let prefix = "";
  let suffix = "";
  //@ts-ignore
  $: tokens = [];
  let selectedToken = "";
  let version = 0;
  let renderSettingsList: string[] = [];

  $: getPreviewString = () => {
    if (showBuildPreset) {
      const tempString = `${tokens.join("_")}`;
      return tempString.replace(/_\/_/g, "/");
    } else {
      if ($selectedExportPreset) {
        return $selectedExportPreset.replace(/_\/_/g, "/");
      }
      return "";
    }
  };

  $: previewString = getPreviewString();
  $: console.log("tokens", tokens);
  $: console.log("previewString", previewString);

  const handlePresetChange = (e: any) => {
    selectedExportPreset.set(e.target.value);
  };

  const handleRenderSettingChange = (e: any) => {
    activeRenderSetting = e.target.value;
  };

  const removeToken = (token: number) => {
    tokens = tokens.filter((t, i) => i !== token);
  };

  const handleAddToken = (e: any) => {
    tokens = [...tokens, e.target.value];
  };

  const savePreset = () => {
    if (!$exportPresets) {
      exportPresets.set(previewString);
      return;
    } else {
      exportPresets.set($exportPresets + "," + previewString);
      return;
    }
  };
  const handleSetOutputFolder = async (value: string) => {
    sequenceOutputFolder.set(value);
  };

  interface CompRenderData {
    compName: string;
    nodeId: number;
    projectName: string;
    projectVersion: string;
  }
  const buildRenderPath = (compData: CompRenderData) => {
    const projectVersionString = compData.projectVersion.padStart(3, "0");
    const dataString = previewString
      .replace(/projectName/g, compData.projectName)
      .replace(/compName/g, compData.compName)
      .replace(/projectVersion/g, projectVersionString)
      .replace(/version/g, `v${version.toString().padStart(3, "0")}`)
      .replace(/frameNumber/g, "[####]");

    return `${$sequenceOutputFolder}/${dataString}`;
  };

  const addToRenderQueue = async (comp: CompRenderData) => {
    const renderPath = buildRenderPath(comp);
    const options = {
      compId: comp.nodeId,
      filepath: renderPath,
      presetNAme: activeRenderSetting,
    };

    fs.existsSync(path.dirname(renderPath)) ||
      fs.mkdirSync(renderPath, { recursive: true });

    await evalES(`addToRenderQueue(${JSON.stringify(options)})`, false);
  };

  const addCompsToRenderQueue = async () => {
    const comps = JSON.parse(await evalES("getSelectedCompsForRender()"))
      .comps as CompRenderData[];

    comps.forEach((element: any) => {
      addToRenderQueue(element);
    });
  };

  const handleAddWordToken = (e: Event) => {
    tokens = [...tokens, prefix];
  };

  onMount(async () => {
    const renderSettings = JSON.parse(
      await evalES("getOutputModulesTemplates()")
    );
    renderSettingsList = renderSettings.filter(
      (p: string) => !p.startsWith("_")
    );
    // renderSettingsList = renderSettings.filter(
    //   (p: string) => !p.startsWith('_')
    // );
    activeRenderSetting = renderSettings[0];
  });
</script>

<div>
  <SelectFolder
    defaultFolder={$sequenceOutputFolder}
    onChange={handleSetOutputFolder}
    label="Select Output Folder"
  />
  {#if $exportPresets}
    <div
      style="display:flex; flex-direction:row; justify-content: space-between;"
    >
      <p>Select Name Preset</p>
      <div class="select-wrapper">
        <select
          bind:value={activePreset}
          on:change={handlePresetChange}
          placeholder="Select Preset"
        >
          <option value="" disabled selected>Select Name Preset</option>
          {#each presetList() as preset, id}
            <option value={preset}>
              {preset}
            </option>
          {/each}
        </select>
      </div>
    </div>
  {/if}
  <div
    style="display:flex; flex-direction:row; justify-content: space-between;"
  >
    <p>Select Output Module</p>
    <div class="select-wrapper">
      <select
        bind:value={activeRenderSetting}
        on:change={handleRenderSettingChange}
        placeholder="Select Preset"
      >
        <option value="" disabled selected>Select Render Settings</option>
        {#each renderSettingsList as preset, id}
          <option value={preset}>
            {preset}
          </option>
        {/each}
      </select>
    </div>
  </div>
  <div class="flex-row-end action-row">
    <p>Build Export Name Preset</p>
    <button
      class="outline"
      on:click={() => {
        showBuildPreset = !showBuildPreset;
      }}
    >
      {#if showBuildPreset}
        <ChevronUp size={16} />
      {:else}
        <ChevronDown size={16} />
      {/if}
    </button>
  </div>
</div>

<div class="autocomplete">
  {#if showBuildPreset}
    <div id="template-builder">
      <div
        class="row"
        style="display:flex; flex-direction:justify-content:space-between; width:100%"
      >
        <div style="display: flex; flex-direction:row;">
          <input type="text" placeholder="Custom String" bind:value={prefix} />
          <button on:click={handleAddWordToken}>
            <PlusSquare size="16" />
          </button>
        </div>
        <div class="select-wrapper" style="flex-grow:1;">
          <select bind:value={selectedToken} on:change={handleAddToken}>
            <option value="" disabled selected>Select Token</option>
            {#each tokenList as token, id}
              <option value={token.value}>
                {token.label}
              </option>
            {/each}
          </select>
        </div>
      </div>
      <div id="token-list">
        {#each tokens as token, id}
          <div class="token">
            {token}
            <span class="token-remove" on:click={() => removeToken(id)}>×</span>
          </div>
        {/each}
      </div>
      <div
        class="flex-row-end action-row"
        style="position:absolute; bottom:4px; right:4px;"
      >
        <button on:click={savePreset}>
          <ListPlus size={16} />
        </button>
      </div>
    </div>
  {/if}
</div>
<div class="row">
  <label for="increment">Version Number</label>
  <input type="number" placeholder="Version" bind:value={version} />
</div>
<div class="row-preview">
  <label for="prefix">Preview</label>
  <p>
    {previewString}
  </p>
</div>
<div class="flex-row-end action-row">
  <button
    class="active"
    on:click={addCompsToRenderQueue}
    disabled={!sequenceOutputFolder}>Add To Render Queue</button
  >
</div>

<style lang="scss">
  @use "../../variables.scss" as *;

  #template-builder {
    display: flex;
    width: 100%;
    height: 80px;
    flex-direction: column;
    background-color: $extra-dark;
    border: 1px solid $dimmed-font-color;
    padding: 8px;
    position: relative;
  }

  #token-list {
    display: flex;
    flex-direction: row;
  }
  .token {
    display: inline-block;
    font-size: x-small;
    padding: 4px;
    border-radius: 5px;
    margin: 4px;
    background-color: $darker;
  }
  .token-remove {
    cursor: pointer;
    margin-left: 5px;
  }

  .autocomplete {
    width: 100%;
    display: flex;
  }

  .autocomplete-input {
    border: 1px solid $dimmed-font-color;
    border-radius: 2px;
  }

  .autocomplete-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    background-color: $extra-dark;
    border: 1px solid $dimmed-font-color;
    padding: 5px;
    width: 200px;
    z-index: 1;
  }

  .autocomplete-suggestion {
    padding: 5px;
    cursor: pointer;
  }

  .autocomplete-suggestion:hover {
    background-color: green;
  }

  .autocomplete-suggestion.active {
    background-color: $darker;
    color: $active;
  }
</style>
