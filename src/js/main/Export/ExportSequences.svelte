<script lang="ts">
  import { onMount } from 'svelte';

  import Toggle from '@/components/Toggle/Toggle.svelte';
  import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';
  import SelectFolderWeb from '@/components/SelectFolder/SelectFolderWeb.svelte';

  import { appStore, appVersion } from '@/stores/app-store';
  import { localAppStore, lastFolderExport } from '@/stores/local-storage';
  import { notifications } from '@/stores/notifications-store';

  import { evalES } from '@/lib/utils/bolt';
  import { openFile } from '@/lib/utils/utils';
  import {
    USER_AME_PRESETS,
    BUCK_AME_PRESETS,
    type EPRFile,
    PRODUCTION_NAME,
  } from '@/api/files/files';

  import { logModule } from '@/lib/logger';
  const log = logModule('export-sequences');

  import type { Option } from '@/types/models';

  const regionOptions: Option<number>[] = [
    { value: 0, label: 'Entire Sequence' },
    { value: 1, label: 'In to Out' },
    { value: 2, label: 'Work Area' },
  ];

  let presetOptions: Option<string>[] = [];
  let selectedPreset: Option<string> | null = null;
  let selectedRegion: Option<number> | null = regionOptions[1];
  let startEncoding = false;
  let outputFolder = '';
  let done = false;
  let isExporting = false;

  const setOutputFolder = (path: string) => {
    if ($appStore.rememberLastExportPath) {
      lastFolderExport.set(path);
    }
    outputFolder = path;
    done = false;
  };

  const handlePresetChange = (value: Option<string> | null) => {
    selectedPreset = value;
  };

  const handleRegionChange = (value: Option<number> | null) => {
    selectedRegion = value;
  };

  const handleOpenFolder = () => {
    openFile(outputFolder);
  };

  const handleSubmitExport = async () => {
    if (!outputFolder) {
      notifications.error('No output folder selected', 3000);
      return;
    }
    if (!selectedPreset) {
      notifications.error('No preset selected', 3000);
      return;
    }

    isExporting = true;
    done = false;

    try {
      const res = await evalES(
        `exportActiveSequenceToAME("${outputFolder}", "${selectedPreset.value}", ${selectedRegion?.value ?? 1}, ${startEncoding})`,
        false,
      );

      const result = JSON.parse(res);
      if (result.success) {
        done = true;
        notifications.success(
          `Sequence "${result.sequenceName}" queued for export`,
          3000,
        );
      } else {
        notifications.error(result.error || 'Export failed', 3000);
      }
    } catch (e) {
      log.error('Export failed', e);
      notifications.error('Export failed', 3000);
    } finally {
      isExporting = false;
    }
  };

  const loadPresets = async () => {
    try {
      const presets: EPRFile[] = [];

      try {
        const buckPresets = await BUCK_AME_PRESETS();
        presets.push(...buckPresets);
      } catch (e) {
        log.debug('No shared AME presets found');
      }

      try {
        const userPresets = await USER_AME_PRESETS($appVersion);
        presets.push(...userPresets);
      } catch (e) {
        log.debug('No user AME presets found');
      }

      presetOptions = presets.map((p) => ({
        value: p.path,
        label: p.name.replace('.epr', ''),
      }));

      if (presetOptions.length > 0) {
        selectedPreset = presetOptions[0];
      }

      log.debug('Loaded AME presets', { count: presetOptions.length });
    } catch (e) {
      log.error('Failed to load AME presets', e);
      notifications.error('Failed to load AME presets', 3000);
    }
  };

  onMount(async () => {
    if ($localAppStore?.rememberLastExportPath) {
      outputFolder = $lastFolderExport ?? '';
    }

    const projectPath = await evalES('app.project.path', true);

    log.debug('ExportSequences', 'onMount', 'Loading presets', {
      projectPath,
      productionName: PRODUCTION_NAME(projectPath),
    });
    await loadPresets();
  });
</script>

<div class="export-sequences">
  <div class="flex-row-start">
    <label for="preset">Preset:</label>
    <div style="flex-grow: 1;">
      <MenuSelect
        items={presetOptions}
        value={selectedPreset}
        onChange={handlePresetChange}
      />
    </div>
  </div>

  <div class="flex-row-start">
    <label for="region">Render Region:</label>
    <div style="flex-grow: 1;">
      <MenuSelect
        items={regionOptions}
        value={selectedRegion}
        onChange={handleRegionChange}
      />
    </div>
  </div>

  <div class="flex-row-start">
    <Toggle bind:checked={startEncoding} />
    <span>Start Encoding</span>
  </div>

  <div
    class="folder-select"
    style="display:flex; flex-direction:row; gap:4px; margin-left:2px; margin-right:2px"
  >
    <SelectFolderWeb
      onChange={setOutputFolder}
      bind:value={outputFolder}
      label="Set Destination Folder"
    />
  </div>

  <div class="flex-row-end action-row">
    <button
      class="active"
      on:click={handleSubmitExport}
      disabled={!outputFolder || !selectedPreset || isExporting}
    >
      {isExporting ? 'Exporting...' : 'Export Sequence'}
    </button>
    {#if done}
      <button on:click={handleOpenFolder}>Open Folder</button>
    {/if}
  </div>
</div>
