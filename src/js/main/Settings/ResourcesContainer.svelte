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
  let resources = [
    { label: 'Claude AI', value: 'Claude AI' },
    { label: 'OpenAI', value: 'OpenAI' },
  ];

  onMount(() => {});
</script>

<div class="container">
  <div
    style="display:flex; flex-direction:row; align-items:center; justify-content:center;"
  >
    <h2>Resources</h2>
  </div>

  <!-- App Settings -->
  <div class="settings-container">
    <div class="settings-header">
      <h3>Scripting</h3>
    </div>
    <div class="flex-row-between setting-row">
      <label for="show-tooltips">Show Tooltips</label>
      <a href="https://ae-scripting.docsforadobe.dev/" target="_blank"
        >After Effects Scripting Guide</a
      >
    </div>
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
