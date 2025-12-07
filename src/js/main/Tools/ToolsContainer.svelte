<script lang="ts">
  import { onMount } from 'svelte';
  import { appStore, appVersion } from '@/stores/app-store';
  import {
    getLocalScripts,
    getBuckScripts,
    getProjectScripts,
    type Script,
    getProjectCommonFiles,
    type CommonSharedFile,
  } from '@/api/scripts/tools-scripts';
  import ToolCard from '@/components/ClipCard/ToolCard.svelte';
  import AssetCard from '@/components/ClipCard/AssetCard.svelte';

  interface ToolData {
    name: string;
    version: string;
    description: string;
    filename: string;
    filepath: string;
    author?: string;
    icon?: string;
    apps?: string[];
  }

  interface ToolItem {
    [key: string]: ToolData;
  }
  import toolList from './tools.json';
  import { evalES } from '@/lib/utils/bolt';
  import { logModule } from '@/lib/logger';

  const log = logModule('tools-container');
  const appId = $appStore.appId;

  log.debug('Loading local scripts', { appId, appVersion: $appVersion });

  let localScripts = [] as Script[];
  $: buckScripts = getBuckScripts(appId);
  $: commonFiles = [] as CommonSharedFile[];
  $: projectScripts = [] as Script[];

  interface SelectToolItem {
    value: string;
    label: string;
    component: any;
    apps: string[];
  }

  onMount(async () => {
    localScripts = await getLocalScripts(
      appId,
      $appVersion,
      $appStore.userScriptsFolder
    );
    buckScripts = getBuckScripts(appId);
    const projectPath = (await evalES(`getProjectFile()`, false)) as string;
    log.debug('Project path resolved', { projectPath });
    projectScripts = await getProjectScripts(appId, projectPath);
    log.debug(
      'Project scripts loaded',
      {
        scriptCount: projectScripts.length,
      },
      projectScripts
    );

    commonFiles = await getProjectCommonFiles(appId, projectPath);
  });
</script>

<div class="tools-container">
  <section class="tools-section">
    <div class="settings-header">
      <h3>Project Common</h3>
    </div>
    <div class="tools-section">
      <div class="tools-list">
        {#each commonFiles as aepFile}
          <AssetCard {aepFile} />
        {/each}
      </div>
    </div>
  </section>
  <section class="tools-section">
    <div class="settings-header">
      <h3>Scripts</h3>
    </div>
    <div class="tools-section">
      <h4>Buck</h4>
      <div class="tools-list">
        {#each buckScripts as script}
          <ToolCard scriptTool={script} />
        {/each}
      </div>
    </div>
    {#if projectScripts.length > 0}
      <div class="tools-section">
        <h4>Project</h4>
        <div class="tools-list grid-layout">
          {#each projectScripts as script}
            <ToolCard scriptTool={script} />
          {/each}
        </div>
      </div>
    {/if}
    <div class="tools-section">
      <h4>Local</h4>
      <div class="tools-list grid-layout">
        {#each localScripts as script}
          <ToolCard scriptTool={script} />
        {/each}
      </div>
    </div>
  </section>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  section {
    border-bottom: 1px solid $dark;
    border-radius: 4px;
    width: 100%;
    padding: 8px;
  }

  .tools-section {
    display: flex;
    flex-direction: column;
    gap: 2px;
    align-self: flex-start;
    justify-items: start;
    margin-left: 8px;
  }

  .tools-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    overflow-y: scroll;
    overflow-x: hidden;
    height: calc(100vh - 60px);
  }
  .tools-section {
    display: flex;
    flex-direction: column;
    gap: 2px;
    align-self: flex-start;
    justify-items: start;
    margin-left: 8px;
  }
  h3 {
    color: $font;
    margin-top: 12px;
    margin-bottom: 4px;
    font-size: 14px;
    text-align: center;
  }

  h4 {
    margin: 4px;
  }

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
  .tools-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-left: 8px;
  }
  .grid-layout {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: 28px;
    gap: 4px;
    width: 100%;
  }

  @media (max-width: 600px) {
    .grid-layout {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (max-width: 400px) {
    .grid-layout {
      grid-template-columns: repeat(1, 1fr);
    }
  }
</style>
