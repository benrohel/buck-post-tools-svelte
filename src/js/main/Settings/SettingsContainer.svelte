<script lang="ts">
  import { evalES } from '../../lib/utils/bolt';
  import { getAeOutputModulesAEP } from '../../api/files/files';
  import { localAppStore } from '../../stores/local-storage';
  import Toggle from '../../components/Toggle/Toggle.svelte';
  import { type AppStore, appStore } from '../../stores/app-store';
  import { notifications } from '../../stores/notifications-store';
  import MenuSelect from '../../components/MultiSelect/MenuSelect.svelte';
  import { onMount } from 'svelte';
  import { appId } from '../../lib/utils/cep';
  import SelectFolderWeb from '../../components/SelectFolder/SelectFolderWeb.svelte';
  let aiServices = [
    { label: 'Claude AI', value: 'Claude' },
    { label: 'OpenAI', value: 'ChatGPT' },
  ];

  let apiKey = '';
  let selectedService = aiServices[0];

  const handleChange = (key: keyof AppStore, value: boolean) => {
    appStore.update((s: AppStore) => ({ ...s, [key]: value }));
  };

  const handleServiceChange = () => {
    // Get the default model based on the selected service
    const model = selectedService.value === 'Claude' 
      ? 'claude-3-7-sonnet-20250219' 
      : 'gpt-4';
      
    appStore.update((s: AppStore) => ({
      ...s,
      aiService: { 
        apiKey, 
        name: selectedService.value as "Claude" | "ChatGPT", 
        model 
      },
    }));

    if (
      $localAppStore.aiService.name !== selectedService.value &&
      $localAppStore.aiService.apiKey !== null
    ) {
      apiKey = $localAppStore.aiService.apiKey;
    } else {
      apiKey = '';
    }
  };

  const handleUserScriptsFolderChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    appStore.update((s: AppStore) => ({
      ...s,
      userScriptsFolder: target.value,
    }));
  };

  const saveSettings = () => {
    // Get the default model based on the selected service
    const model = selectedService.value === 'Claude' 
      ? 'claude-3-7-sonnet-20250219' 
      : 'gpt-4';
      
    const aiService = { 
      apiKey, 
      name: selectedService.value as "Claude" | "ChatGPT", 
      model 
    };
    appStore.update((s: AppStore) => ({ ...s, aiService }));
    localAppStore.set($appStore);
    if ($localAppStore === $appStore) {
      notifications.success('Settings saved successfully', 2000);
    } else {
      notifications.error('Failed to save settings', 2000);
    }
  };

  const handleImportProjectAndSaveOutputModules = async () => {
    const aepFilepath = getAeOutputModulesAEP();
    await evalES(`importProjectAndSaveOutputModules("${aepFilepath}")`);
  };

  onMount(() => {
    apiKey = $appStore.aiService.apiKey;
    selectedService = {
      label: $appStore.aiService.name,
      value: $appStore.aiService.name,
    };
  });
</script>

<div class="container">
  <div
    style="display:flex; flex-direction:row; align-items:center; justify-content:center;"
  >
    <h2>Settings</h2>
  </div>
  {#if appId === 'AEFT'}
    <div class="flex-row-between setting-row">
      <label for="show-tooltips">Load Output Module Templates</label>
      <button
        class="active"
        on:click={() => handleImportProjectAndSaveOutputModules()}
      >
        Import
      </button>
    </div>
  {/if}
  <!-- App Settings -->
  <div class="settings-container">
    <div class="settings-header">
      <h3>App</h3>
    </div>
    <div class="flex-row-between setting-row">
      <label for="show-tooltips">Show Tooltips</label>
      <Toggle
        checked={$appStore.showTooltips}
        id="show-tooltips"
        onChange={() => handleChange('showTooltips', !$appStore.showTooltips)}
      />
    </div>
    <!-- Rename Settings -->
    <div class="settings-header">
      <h3>Rename</h3>
    </div>
    <div class="flex-row-between setting-row">
      <label for="remember-last-folder-search"
        >Remember Rename Relink last search folder</label
      >
      <Toggle
        checked={$appStore.rememberLastFolderSearch}
        id="remember-last-folder-search"
        onChange={() =>
          handleChange(
            'rememberLastFolderSearch',
            !$appStore.rememberLastFolderSearch,
          )}
      />
    </div>
    <!-- Version Management Settings -->
    <div class="settings-header">
      <h3>Version Management</h3>
    </div>
    <div class="flex-row-between setting-row">
      <label for="show-warnings">Default to show warnings</label>
      <Toggle
        checked={$appStore.showVersionWarnings}
        id="show-warnings"
        onChange={() =>
          handleChange('showVersionWarnings', !$appStore.showVersionWarnings)}
      />
    </div>
    <!-- Scripts Settings -->
    <div class="settings-header">
      <h3>Scripts</h3>
    </div>
    <div class="flex-row-between setting-row">
      <label for="show-warnings">User Scripts Folder</label>
      <SelectFolderWeb bind:value={$appStore.userScriptsFolder} />
    </div>
    <!-- Export Settings -->
    <div class="settings-header">
      <h3>Export</h3>
    </div>
    <div class="flex-row-between setting-row">
      <label for="remember-last-export-path"
        >Remember last export root folder</label
      >
      <Toggle
        checked={$appStore.rememberLastExportPath}
        id="remember-last-export-path"
        onChange={() =>
          handleChange(
            'rememberLastExportPath',
            !$appStore.rememberLastExportPath,
          )}
      />
    </div>
    {#if appId === 'AEFT'}
      <div class="flex-row-between setting-row">
        <label for="remember-last-export-preset"
          >Remember last export preset</label
        >
        <Toggle
          checked={$appStore.rememberLastExportPreset}
          id="remember-last-export-preset"
          onChange={() =>
            handleChange(
              'rememberLastExportPreset',
              !$appStore.rememberLastExportPreset,
            )}
        />
      </div>
    {/if}
  </div>

  <!-- {#if $appStore.devMode === true} -->
  <!-- Code Settings -->
  <div class="settings-header">
    <h3>Code</h3>
  </div>
  <div class="flex-row-between setting-row">
    <label style="flex: 1;" for="remember-last-export-path">AI Service</label>
    <div>
      <MenuSelect
        items={aiServices}
        bind:value={selectedService}
        onChange={handleServiceChange}
      />
    </div>
  </div>
  <div class="flex-row-between setting-row">
    <label style="flex-grow: 1;" for="remember-last-export-path">Api Key</label>
    <input type="text" bind:value={apiKey} style="width:80%" />
  </div>
  <!-- {/if} -->

  <div class="flex-row-end action-row">
    <button class="active" on:click={saveSettings}>Save Settings</button>
  </div>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  .settings-header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    color: $font;
    width: 100%;
    gap: 2px;
    margin-bottom: 0px;
    margin-left: 8px;
  }

  .settings-container {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    width: 100%;
    gap: 2px;
    margin-bottom: 8px;
  }

  .container {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    width: 100%;
  }

  .setting {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding: 8px 16px;
  }

  h2 {
    color: $font;
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 18px;
    text-align: center;
  }
  h3 {
    color: $font;
    margin-top: 12px;
    margin-bottom: 4px;

    text-align: center;
  }
  label {
    font-size: 12px;
  }

  .setting-row {
    background-color: $extra-dark;
    margin: 0px 0px 0px 0px;

    padding: 2px 8px;
  }
  .action-row {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    margin-top: 12px;
  }
</style>
