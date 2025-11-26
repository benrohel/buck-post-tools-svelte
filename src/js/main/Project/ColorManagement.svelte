<script lang="ts">
  import { onMount } from 'svelte';
  import { evalFile, evalES } from '../../lib/utils/bolt';
  import { fs } from '../../lib/cep/node';
  import { v4 as uuidv4 } from 'uuid';
  import { Tooltip } from '@svelte-plugins/tooltips';
  import { notifications } from '../../stores/notifications-store';
  import path from 'path';
  import { buck5Server } from '../../stores/server-store';
  import {
    getProjectSettingsTemplate,
    setProjectSettingsTemplate,
    type ProjectSettings,
  } from '../../api/files/files';
  import { appStore } from '../../stores/app-store';
  import {
    ArrowDownToLine,
    ArrowUpToLine,
    Blend,
    RefreshCw,
  } from 'lucide-svelte';
  import ModalConfirm from '../../components/Modal/ModalConfirm.svelte';
  let gap = 2;

  let confirmupdateColorTemplate = false;

  let projectSettingsTemplate: ProjectSettings | null = null;
  let projectColorSettings: ProjectSettings | null = null;
  let showConfirmDialog = false; // Controls confirmation dialog visibility

  const handleGetProjectSettings = async () => {
    const projectFile = await evalES('getProjectFile()');
    const template = await getProjectSettingsTemplate(projectFile);
    const colorSettings = await evalES('getProjectSettings()');

    if (template) {
      projectSettingsTemplate = template;
    }
    if (colorSettings) {
      projectColorSettings = JSON.parse(colorSettings);
    }
  };

  const checkColorSettingsMatch = async () => {
    if (projectColorSettings && projectSettingsTemplate) {
      return Object.keys(projectColorSettings).every(
        (key) => projectColorSettings[key] === projectSettingsTemplate[key]
      );
    }
    return false;
  };

  const handleSetProjectSettings = async () => {
    await evalES(
      `setProjectSettings(${JSON.stringify(projectSettingsTemplate)})`
    );
    await handleGetProjectSettings();
    checkColorSettingsMatch().then((match) => {
      if (match) {
        notifications.success('Color settings successfully synced', 2000);
      } else {
        notifications.error('Error syncing Color settings', 2000);
      }
    });
  };

  $: getClass = (property: keyof ProjectSettings) => {
    return projectColorSettings[property] === projectSettingsTemplate[property]
      ? 'setting-row success'
      : 'setting-row error';
  };

  const handleSetTemplateSettings = async () => {
    if (projectColorSettings) {
      const projectFile = await evalES('getProjectFile()');
      const template = await setProjectSettingsTemplate(
        projectFile,
        projectColorSettings
      );
      console.log('template', template);
      await handleGetProjectSettings();
      showConfirmDialog = false;
    }
  };

  const handleConfirm = async (value: boolean) => {
    console.log('handleConfirm', value);
    if (value) {
      await handleSetTemplateSettings();
      await handleGetProjectSettings();
      checkColorSettingsMatch().then((match) => {
        if (match) {
          notifications.success(
            'Template Color settings successfully updated',
            2000
          );
        } else {
          notifications.error('Error updating Template Color settings', 2000);
        }
      });
      showConfirmDialog = false;
    }
  };

  onMount(() => {
    handleGetProjectSettings();
  });
</script>

{#if showConfirmDialog}
  <ModalConfirm
    question="Are you sure you want to update the template color settings?"
    value={confirmupdateColorTemplate}
    onClose={() => (showConfirmDialog = false)}
    onConfirm={handleConfirm}
  />
{/if}

{#if $buck5Server}
  <div
    style="display:flex; flex-direction:row; text-align:center; align-items:center;justify-content:space-between; margin:4px"
  >
    <div>
      <Tooltip
        action={$appStore.showTooltips ? 'hover' : 'none'}
        content="<b> Load Project Color Management Settings and Template</b>"
        position="right"
        delay={1000}
      >
        <button class="icon active" on:click={handleGetProjectSettings}>
          <RefreshCw />
        </button>
      </Tooltip>
    </div>
    <div
      style="display:flex; flex-direction:row; text-align:center; align-items:center; gap:8px; justify-content:flex-end"
    >
      <Tooltip
        action={$appStore.showTooltips ? 'hover' : 'none'}
        content="<b> Apply Color Management Settings to project.</b>"
        position="left"
        delay={1000}
      >
        <button class="icon active" on:click={handleSetProjectSettings}>
          <ArrowDownToLine />
        </button>
      </Tooltip>
      <Tooltip
        action={$appStore.showTooltips ? 'hover' : 'none'}
        content="<b>Set current color settings as a Template Color Management Settings.</b>"
        position="left"
        delay={1000}
      >
        <button class="icon active" on:click={() => (showConfirmDialog = true)}>
          <ArrowUpToLine />
        </button>
      </Tooltip>
    </div>
  </div>

  <div style="display:flex; flex-direction:column; gap:4px; margin-top:4px">
    <div id="color-management-grid" class="header-row">
      <div>Setting Name</div>
      <div>Template settings</div>
      <div>Project Settings</div>
      <div>Synced</div>
    </div>
    {#if projectColorSettings && projectSettingsTemplate}
      <div class="setting-row">
        <div>Bits Per Channel</div>
        <div>{projectSettingsTemplate?.bitsPerChannel}</div>
        <div>{projectColorSettings?.bitsPerChannel}</div>
        <Blend
          color={getClass('bitsPerChannel') === 'setting-row success'
            ? '#3caea3'
            : '#ed553b'}
        />
      </div>
      <div class="setting-row">
        <div>Working Color Space</div>
        <div>{projectSettingsTemplate?.workingSpace}</div>
        <div>{projectColorSettings?.workingSpace}</div>
        <Blend
          color={getClass('workingSpace') === 'setting-row success'
            ? '#3caea3'
            : '#ed553b'}
        />
      </div>
      <div class="setting-row">
        <div>Working Gamma</div>
        <div>{projectSettingsTemplate?.workingGamma}</div>
        <div>{projectColorSettings?.workingGamma}</div>
        <Blend
          color={getClass('workingGamma') === 'setting-row success'
            ? '#3caea3'
            : '#ed553b'}
        />
      </div>
      <div class="setting-row">
        <div>Compensate For Scene Referred Profiles</div>
        <div>{projectSettingsTemplate?.compensateForSceneReferredProfiles}</div>
        <div>{projectColorSettings?.compensateForSceneReferredProfiles}</div>
        <Blend
          color={getClass('compensateForSceneReferredProfiles') ===
          'setting-row success'
            ? '#3caea3'
            : '#ed553b'}
        />
      </div>
      <div class="setting-row">
        <div>Linearize Working Space</div>
        <div>{projectSettingsTemplate?.linearizeWorkingSpace}</div>
        <div>{projectColorSettings?.linearizeWorkingSpace}</div>
        <Blend
          color={getClass('linearizeWorkingSpace') === 'setting-row success'
            ? '#3caea3'
            : '#ed553b'}
        />
      </div>
      <div class="setting-row">
        <div>Blend Colors</div>
        <div>{projectSettingsTemplate?.linearBlending}</div>
        <div>{projectColorSettings?.linearBlending}</div>
        <Blend
          color={getClass('linearBlending') === 'setting-row success'
            ? '#3caea3'
            : '#ed553b'}
        />
      </div>
    {/if}
  </div>
{:else}
  <div>
    You need to be connected to Buck server to use this feature, and have a
    template file in "/Production/Common/Meta/aeft/project-settings.json"
  </div>
{/if}

<style lang="scss">
  @use '../../variables.scss' as *;

  #color-management-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 20px;
    gap: 4px;
    width: 100%;
  }

  .setting-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    padding: 2px;
    gap: 4px;
    width: 100%;
    align-items: center;
  }
  .setting-row:nth-child(odd) {
    background-color: $darker;
  }

  .header-row {
    background-color: $extra-dark;
    align-items: center;
  }

  .synced {
    color: #3caea3;
  }
</style>
