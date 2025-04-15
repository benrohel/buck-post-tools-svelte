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
  <div class="flex-row-start">
    <Toggle
      label="Show tooltips"
      checked={$appStore.showTooltips}
      id="show-tooltips"
      onChange={() => handleChange('showTooltips', !$appStore.showTooltips)}
    />
  </div>
  <div class="flex-row-start">
    <Toggle
      label="Remember Rename Relink last search folder"
      checked={$appStore.rememberLastFolderSearch}
      id="remember-last-folder-search"
      onChange={() =>
        handleChange(
          'rememberLastFolderSearch',
          !$appStore.rememberLastFolderSearch,
        )}
    />
  </div>
  <div class="flex-row-end action-row">
    <button class="active" on:click={saveSettings}>Save Settings</button>
  </div>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  .container {
    padding: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 300px;
    max-width: 400px;
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

  .select-label {
    color: $font;
    font-size: small;
    margin: 0;
  }
</style>
