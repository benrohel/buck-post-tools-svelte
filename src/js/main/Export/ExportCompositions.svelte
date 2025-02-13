<script lang="ts">
  import { ChevronDown, ChevronUp, FolderSearch } from "svelte-lucide";
  import SelectFolder from "../../components/SelectFolder/SelectFolder.svelte";
  import { evalES } from "../../lib/utils/bolt";
  import {
    exportPresets,
    selectedExportPreset,
  } from "../../stores/local-storage";
  import { ArrowLeftRight, ListPlus } from "lucide-svelte";
  import { onMount } from "svelte";

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
  let rootFolder = "";
  let showBuildPreset = false;
  let prefix = "";
  let suffix = "";
  $: tokens = [];
  let selectedToken = "";
  let version = 0;
  let renderSettingsList: string[] = [];

  $: getPreviewString = () => {
    if (showBuildPreset) {
      return `${prefix ? prefix + "_" : ""}${tokens.join("_")}${
        suffix ? "_" + suffix : ""
      }${version > 0 ? `_v${String(version).padStart(3, "0")}` : ""}`;
    } else {
      if ($selectedExportPreset) {
        return $selectedExportPreset;
      }
      return "";
    }
  };

  $: previewString = getPreviewString();
  $: console.log("tokens", tokens);

  const handlePresetChange = (e: any) => {
    selectedExportPreset.set(e.target.value);
  };

  const handleRenderSettingChange = (e: any) => {
    activeRenderSetting = e.target.value;
  };

  const addToken = (token: string) => {
    tokens = [...tokens, token];
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
    rootFolder = value;
  };

  const addToRenderQueue = async () => {
    const renderPath = `${rootFolder}/${previewString}`;
    await evalES(
      `addToRenderQueue("${renderPath}", "","${activeRenderSetting}")`
    );
  };

  onMount(async () => {
    const renderSettings = JSON.parse(
      await evalES("getOutputModulesTemplates()")
    );
    renderSettingsList = renderSettings;
    activeRenderSetting = renderSettings[0];
  });
</script>

<div>
  <SelectFolder
    defaultFolder={rootFolder}
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
    <div
      style="display:flex; flex-direction:row; justify-content: space-between;"
    >
      <p>Select Render Setting</p>
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
  {/if}
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
        <input type="text" placeholder="Prefix" bind:value={prefix} />
        <div class="select-wrapper" style="flex-grow:1;">
          <select bind:value={selectedToken} on:change={handleAddToken}>
            {#each tokenList as token, id}
              <option value={token.value}>
                {token.label}
              </option>
            {/each}
          </select>
        </div>
        <input type="text" placeholder="Suffix" bind:value={suffix} />
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
  <button class="active" on:click={addToRenderQueue} disabled={!rootFolder}
    >Add To Render Queue</button
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
