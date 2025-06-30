<script lang="ts">
  import { onMount } from 'svelte';
  import { appStore, appVersion } from '../../stores/app-store';
  import {
    getLocalScripts,
    getBuckScripts,
    getProjectScripts,
    type Script,
  } from '../../api/scripts/tools-scripts';
  import ToolCard from '../../components/ClipCard/ToolCard.svelte';

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
  import { evalES } from '../../lib/utils/bolt';

  const appId = $appStore.appId;

  console.log(getLocalScripts(appId, $appVersion));

  $: localScripts = getLocalScripts(
    appId,
    $appVersion,
    $appStore.userScriptsFolder,
  );
  $: buckScripts = getBuckScripts(appId);
  $: projectScripts = [];

  // $: buckToolArray = () => {
  //   return Object.keys(tools)
  //     .filter((t) => {
  //       return tools[t].apps.includes(appId);
  //     })
  //     .map((k) => {
  //       return { value: tools[k], label: k };
  //     });
  // };

  // $: console.log(buckToolArray());
  $: console.log('local scripts', localScripts);

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
      $appStore.userScriptsFolder,
    );
    buckScripts = getBuckScripts(appId);
    const projectPath = (await evalES(`getProjectFile()`, false)) as string;
    projectScripts = await getProjectScripts(appId, projectPath);
  });
</script>

<div class="tools-container">
  <div class="tools-section">
    <div class="settings-header">
      <h3>Buck Scripts</h3>
    </div>
    <div class="tools-list">
      {#each buckScripts as script}
        <ToolCard scriptTool={script} />
      {/each}
    </div>
  </div>
  {#if projectScripts.length > 0}
    <div class="tools-section">
      <div class="settings-header">
        <h3>Project Scripts</h3>
      </div>
      <div class="tools-list grid-layout">
        {#each projectScripts as script}
          <ToolCard scriptTool={script} />
        {/each}
      </div>
    </div>
  {/if}
  <div class="tools-section">
    <div class="settings-header">
      <h3>Local Scripts</h3>
    </div>
    <div class="tools-list grid-layout">
      {#each localScripts as script}
        <ToolCard scriptTool={script} />
      {/each}
    </div>
  </div>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

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
    gap: 8px;
    align-self: flex-start;
    justify-items: start;
  }
  h3 {
    color: $font;
    margin-top: 12px;
    margin-bottom: 4px;
    font-size: 14px;
    text-align: center;
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
