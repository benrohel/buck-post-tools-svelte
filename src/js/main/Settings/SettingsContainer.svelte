<script lang="ts">
  import { localAppStore } from '../../stores/local-storage';
  import Toggle from '../../components/Toggle/Toggle.svelte';
  import { type AppStore, appStore } from '../../stores/app-store';
  import { notifications } from '../../stores/notifications-store';

  const handleChange = (key: keyof AppStore, value: boolean) => {
    appStore.update((s: AppStore) => ({ ...s, [key]: value }));
  };

  const saveSettings = () => {
    localAppStore.set($appStore);
    if ($localAppStore === $appStore) {
      notifications.success('Settings saved successfully', 2000);
    } else {
      notifications.error('Failed to save settings', 2000);
    }
  };
</script>

<div class="container">
  <div
    style="display:flex; flex-direction:row; align-items:center; justify-content:center;"
  >
    <h2>Settings</h2>
  </div>
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
            !$appStore.rememberLastFolderSearch
          )}
      />
    </div>
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
            !$appStore.rememberLastExportPath
          )}
      />
    </div>
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
            !$appStore.rememberLastExportPreset
          )}
      />
    </div>
  </div>
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
</style>
