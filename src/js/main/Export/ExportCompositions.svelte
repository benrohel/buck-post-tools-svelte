<script lang="ts">
  import { ChevronDown, ChevronUp, PlusSquare } from 'svelte-lucide';
  import SelectFolder from '../../components/SelectFolder/SelectFolder.svelte';
  import { evalES } from '../../lib/utils/bolt';
  import { sequenceOutputFolder } from '../../stores/local-storage';
  import { ListPlus } from 'lucide-svelte';
  import ModalSettings from '../../components/Modal/ModalSettings.svelte';
  import { onMount } from 'svelte';
  import { fs, path } from '../../lib/cep/node';
  import {
    setPreferenceByKey,
    getPreferenceByKey,
  } from '../../api/preferences';
  import type { ExportNamePreset } from '../../api/preferences';
  //@ts-ignore
  import { tooltip } from '../../components/Tooltip/tooltip.js';

  import Select from 'svelte-select';

  const tokenList = [
    {
      value: '{compName}',
      label: 'Comp Name',
    },
    {
      value: '{projectVersion}',
      label: 'Project Version',
    },
    {
      value: '{version}',
      label: 'Version',
    },
    {
      label: 'frameNumber',
      value: '{frameNumber}',
    },
    {
      value: '{task}',
      label: 'Task',
    },
    {
      value: '/',
      label: 'folder',
    },
  ];

  const tasks = [
    { label: '2d', value: '2d' },
    { label: 'Animation', value: 'Animation' },
    { label: 'Comp', value: 'Comp' },
  ];
  const buck5Tokens = [
    'shots',
    '/',
    '{sequence}',
    '/',
    '{compName}',
    '/',
    '{task}',
    '/',
    'ae',
    '/',
    'Render',
    '/',
    '{compName}',
    '{task}',
    '{version}',
  ];

  const buck3Tokens = [
    '{compName}',
    '/',
    'Render',
    '/',
    '{2d}',
    '/',
    '{compName}',
    '{2d}',
    '{version}',
  ];

  const defaultTemplates = [
    {
      name: 'Buck 5',
      template: buck5Tokens.join('_'),
    },
    {
      name: 'Buck 3',
      template: buck3Tokens.join('_'),
    },
  ];

  const presetList: () => Promise<ExportNamePreset[]> = async () => {
    const presets = (await getPreferenceByKey(
      'exportNamePresets'
    )) as ExportNamePreset[];
    if (presets) {
      return new Promise((resolve) => {
        resolve([...defaultTemplates, ...presets]);
      });
    } else {
      return new Promise((resolve) => {
        resolve(defaultTemplates);
      });
    }
  };

  let pStyle = `"width:auto;
  background-color:#1d1d1e;
  color:#adadad;
    overflow:auto;
    word-break:break-all;
    justify-content:left;
    text-align:start";`;

  let exportNamePresets = [] as ExportNamePreset[];
  let activePreset = {} as ExportNamePreset;
  let activeRenderSetting: any = {};
  let showBuildPreset = false;
  let presetName = '';
  let prefix = '';

  $: selectedTask = tasks[0];
  $: modalOpen = false;
  //@ts-ignore
  $: tokens = [];
  let version = 0;
  let renderSettingsList: string[] = [];

  $: getHtmlString = () => {
    let tempString = '';
    if (showBuildPreset) {
      tempString = `${tokens.join('_')}`;
      tempString.replace(/_{\/}_/g, '/');
    } else {
      if (activePreset && activePreset.template) {
        tempString = activePreset.template;
      }
    }
    const spanString = tempString
      .replace(/_\/_/g, '/')
      .replace(/{/g, '<span style="color:white">{')
      .replace(/}/g, '}</span>');
    return `<p style=${pStyle}>${spanString}</p>`;
  };

  $: htmlString = getHtmlString();

  $: getPreviewString = () => {
    let tempString = '';
    if (showBuildPreset) {
      tempString = `${tokens.join('_')}`;
      tempString.replace(/_{\/}_/g, '/');
    } else {
      if (activePreset && activePreset.template) {
        tempString = activePreset.template;
      }
    }
    const spanString = tempString.replace(/_\/_/g, '/');

    return spanString;
  };

  $: previewString = getPreviewString();

  const handlePresetChange = (e: any) => {
    activePreset = e.detail;
    console.log('activePreset', activePreset);
  };

  const handleTaskChange = (e: any) => {
    selectedTask = e.detail;
    console.log('task', selectedTask);
  };

  const handleRenderSettingChange = (e: any) => {
    activeRenderSetting = e.deatil;
  };

  const removeToken = (token: number) => {
    tokens = tokens.filter((t, i) => i !== token);
  };

  const handleAddToken = (e: any) => {
    tokens = [...tokens, e.detail.value];
  };

  const handleSavePreset = async () => {
    const namePresets = await getPreferenceByKey('exportNamePresets');
    const newPreset = { name: presetName, template: previewString };

    if (!namePresets) {
      setPreferenceByKey('exportNamePresets', [newPreset]);
      return;
    } else {
      const newPresets = [...namePresets, newPreset];

      setPreferenceByKey('exportNamePresets', newPresets);
      await presetList();
      activePreset = newPreset;
    }

    modalOpen = false;
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
    const projectVersionString = compData.projectVersion
      ? 'v' + compData.projectVersion.padStart(3, '0')
      : 'v001';
    const dataString = previewString
      .replace(/{projectName}/g, compData.projectName)
      .replace(/{sequence}/g, 'sequence')
      .replace(/{compName}/g, compData.compName)
      .replace(/{task}/g, selectedTask.value ?? '')
      .replace(/{projectVersion}/g, projectVersionString)
      .replace(/{version}/g, `v${version.toString().padStart(3, '0')}`)
      .replace(/{frameNumber}/g, '[####]');

    return path.posix.join($sequenceOutputFolder, dataString);
  };

  const addToRenderQueue = async (comp: CompRenderData) => {
    const renderPath = buildRenderPath(comp);
    console.log('renderPath', renderPath);
    const options = {
      compId: comp.nodeId,
      filepath: renderPath,
      presetName: activeRenderSetting.value,
    };

    fs.existsSync(path.dirname(renderPath)) ||
      fs.mkdirSync(renderPath, { recursive: true });

    await evalES(`addToRenderQueue(${JSON.stringify(options)})`, false);
  };

  const addCompsToRenderQueue = async () => {
    const comps = JSON.parse(await evalES('getSelectedCompsForRender()'))
      .comps as CompRenderData[];

    comps.forEach((element: any) => {
      addToRenderQueue(element);
    });
  };

  const handleAddWordToken = (e: Event) => {
    tokens = [...tokens, prefix];
  };

  const closeModal = () => {
    console.log('close modal outsie');
    modalOpen = false;
  };
  onMount(async () => {
    const renderSettings = JSON.parse(
      await evalES('getOutputModulesTemplates()')
    );
    renderSettingsList = renderSettings.filter(
      (p: string) => !p.startsWith('_')
    );

    activeRenderSetting = renderSettings[0];
    exportNamePresets = await presetList();
    activePreset = exportNamePresets[0];
  });
  let namePresetFocus = false;
  $: namePresetFilter = '';
  let renderPresetFocus = false;
  $: renderPresetFilter = '';
  let tokenSelectFocus = false;
  $: tokenFilter = '';
  let selectTaskFocus = false;
</script>

<div>
  <SelectFolder
    defaultFolder={$sequenceOutputFolder}
    onChange={handleSetOutputFolder}
    label="Select Output Folder"
  />
</div>
<div class="flex-row-between">
  <p class="select-label">Select Name Preset:</p>
  <Select
    --width="auto"
    listOffset={2}
    label="name"
    itemId="template"
    items={exportNamePresets}
    placeholder="Select Name Preset"
    showChevron
    clearable={false}
    bind:value={activePreset}
    bind:focused={namePresetFocus}
    bind:listOpen={namePresetFocus}
    bind:filterText={namePresetFilter}
    on:change={handlePresetChange}
  />
</div>
{#if activePreset.name === 'Buck 5'}
  <div class="flex-row-between">
    <p class="select-label">Select Task:</p>
    <Select
      --width="auto"
      listOffset={2}
      items={tasks}
      itemId="value"
      label="label"
      placeholder="Select Task"
      showChevron
      clearable={false}
      bind:value={selectedTask}
      bind:focused={selectTaskFocus}
      bind:listOpen={selectTaskFocus}
      on:change={handleTaskChange}
    />
  </div>
{/if}
<div class="flex-row-between">
  <p class="select-label">Select Output Module:</p>
  <Select
    --width="auto"
    listOffset={2}
    items={renderSettingsList}
    placeholder="Select Output Module"
    showChevron
    clearable={false}
    listAutoWidth={false}
    justValue
    bind:focused={renderPresetFocus}
    bind:listOpen={renderPresetFocus}
    bind:filterText={renderPresetFilter}
    bind:value={activeRenderSetting}
  />
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

<div class="autocomplete">
  {#if showBuildPreset}
    <div id="template-builder">
      <div
        class="row"
        style="display:flex; flex-direction:justify-content:space-between; width:100%;gap:20px; align-items: center;"
      >
        <div
          style="display: flex; flex-direction:row; align-items: center; gap:4px"
        >
          <input type="text" placeholder="Custom String" bind:value={prefix} />
          <button on:click={handleAddWordToken}>
            <PlusSquare size="16" />
          </button>
        </div>
        <Select
          --width="100%"
          listOffset={2}
          label="label"
          itemId="value"
          items={tokenList}
          placeholder="Select Token"
          showChevron
          clearable={false}
          bind:focused={tokenSelectFocus}
          bind:listOpen={tokenSelectFocus}
          bind:filterText={tokenFilter}
          on:change={handleAddToken}
        />
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
        <button
          on:click={() => {
            modalOpen = !modalOpen;
          }}
        >
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

  {@html htmlString}
</div>

<div class="flex-row-end action-row">
  <button
    title={'Add to Render Queue'}
    class="active"
    on:click={addCompsToRenderQueue}
    disabled={!$sequenceOutputFolder}>Add To Render Queue</button
  >
</div>
{#if modalOpen}
  <ModalSettings name="Save Preset" onClose={closeModal}>
    <div id="modal-content">
      <div class="flex-row-start">
        <label for="name">Preset name</label>
        <input type="text" id="name" name="name" bind:value={presetName} />
      </div>
      <div class="row-preview">
        <label for="prefix">Preview</label>
        <p>
          {previewString}
        </p>
      </div>
      <div class="flex-row-end">
        <button
          class="active"
          on:click={handleSavePreset}
          disabled={!presetName}
        >
          Save Preset
        </button>
      </div>
    </div>
  </ModalSettings>
{/if}

<style lang="scss">
  @use '../../variables.scss' as *;

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

  #modal-content {
    width: 100%;
    display: flex;
    flex-direction: column;
    // align-items: center;
    justify-items: flex-start;
    gap: 8px;
    padding: 8px;
  }

  .select-label {
    flex-grow: 1;
    width: 100%;
    text-align: justify;
  }

  .token {
    color: $active;
  }
</style>
