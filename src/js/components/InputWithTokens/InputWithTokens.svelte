<script lang="ts">
  import { ArrowLeftRight, ListPlus } from "lucide-svelte";
  import {
    exportPresets,
    selectedExportPreset,
  } from "../../stores/local-storage";

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

  let showBuildPreset = false;
  let prefix = "";
  let suffix = "";
  let tokens: string[] = [];
  let selectedToken = "";
  let version = 0;

  const getPreviewString = () => {
    return `${prefix ? prefix + "_" : ""}${tokens.join("_")}${
      suffix ? "_" + suffix : ""
    }${version > 0 ? `_v${String(version).padStart(3, "0")}` : ""}`;
  };

  $: previewString = getPreviewString();

  function addToken(token: string) {
    tokens = [...tokens, token];
  }

  function removeToken(token: string) {
    tokens = tokens.filter((t) => t !== token);
  }

  //   function handleKeyDown(e) {
  //     if (e.key === "Enter") {
  //       addToken(inputValue);

  //     } else if (e.key === "ArrowDown") {
  //       activeSuggestion =
  //         (activeSuggestion + 1) %
  //         suggestions.filter((s) => s.startsWith(inputValue)).length;
  //     } else if (e.key === "ArrowUp") {
  //       activeSuggestion =
  //         (activeSuggestion -
  //           1 +
  //           suggestions.filter((s) => s.startsWith(inputValue)).length) %
  //         suggestions.filter((s) => s.startsWith(inputValue)).length;
  //     }
  //   }

  const handleAddToken = (e: any) => {
    tokens = [...tokens, e.target.value];
  };

  function handleSuggestionClick(suggestion: string) {
    addToken(suggestion);
  }

  const savePreset = () => {
    if (!$exportPresets) {
      exportPresets.set(previewString);
      return;
    } else {
      exportPresets.set($exportPresets + "," + previewString);
      return;
    }
  };
  $: console.log($exportPresets);
  $: console.log($selectedExportPreset);
</script>

<div class="autocomplete">
  {#if showBuildPreset}
    <div class="template-builder">
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
    </div>

    <div id="token-list">
      {#each tokens as token}
        <div class="token" on:click={() => addToken(token)}>
          {token}
          <span class="token-remove" on:click={() => removeToken(token)}>×</span
          >
        </div>
      {/each}
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
  <button on:click={savePreset}>
    <ListPlus size={16} />
  </button>
</div>

<style lang="scss">
  @use "../../variables.scss" as *;

  #template-builder {
    display: flex;
    margin-bottom: 5px;
    height: 60px;
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
