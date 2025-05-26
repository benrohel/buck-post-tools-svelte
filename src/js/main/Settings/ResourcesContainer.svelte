<script lang="ts">
  import { evalES, openLinkInBrowser } from '../../lib/utils/bolt';
  import { getAeOutputModulesAEP } from '../../api/files/files';
  import { localAppStore } from '../../stores/local-storage';
  import Toggle from '../../components/Toggle/Toggle.svelte';
  import { type AppStore, appStore } from '../../stores/app-store';
  import { notifications } from '../../stores/notifications-store';
  import MenuSelect from '../../components/MultiSelect/MenuSelect.svelte';
  import { onMount } from 'svelte';
  import { appId } from '../../lib/utils/cep';

  interface Resource {
    label: string;
    value: string;
    author?: string;
  }
  let scriptResources: Resource[] = [
    {
      label: 'After Effects Scripting Guide',
      value: 'https://ae-scripting.docsforadobe.dev/',
      author: 'Adobe',
    },
    {
      label: 'Adobe Extendscript Guide',
      value: 'https://extendscript.docsforadobe.dev',
      author: 'Adobe',
    },
  ];

  let expressionResources: Resource[] = [
    {
      label: 'After Effects Expressions Guide',
      value: 'https://ae-expressions.docsforadobe.dev',
      author: 'Adobe',
    },
    {
      label: 'AE Reference',
      author: 'Chris Zachary',
      value: 'https://aereference.com/expressions',
    },
    {
      label: 'AE Expressions Library',
      author: 'PlainlyVideos',
      value: 'https://www.plainlyvideos.com/after-effects-expressions-library',
    },
    {
      label: 'Motion Scripts',
      author: 'Dan Ebberts',
      value: 'https://www.motionscript.com',
    },
    {
      label: "Everything About Expressions You Didn't Know",
      author: 'Zack Lovatt',
      value:
        'https://www.schoolofmotion.com/blog/everything-expressions-you-didnt-know-part-4',
    },
  ];

  let pproTemplates: Resource[] = [
    {
      label: 'BUCK Slates Template',
      value:
        'https://docs.google.com/spreadsheets/d/1apX8NK8WqJgtCGLNmiFLdlvYzkX6R2h3buaP_Z_FhVg/edit?gid=1932920728#gid=1932920728',
    },
  ];

  let stockResources: Resource[] = [
    {
      label: 'Artlist',
      value: 'https://artlist.io',
      author: 'Artlist',
    },
  ];

  const openLink = (value: string) => {
    console.log(value);
    openLinkInBrowser(value);
  };
  onMount(() => {});
</script>

<div class="container">
  <div
    style="display:flex; flex-direction:row; align-items:center; justify-content:center;"
  >
    <h2>Resources</h2>
  </div>

  {#if appId === 'AEFT'}
    <div class="settings-container">
      <div class="settings-header">
        <h3>Scripting</h3>
      </div>
      {#each scriptResources as resource}
        <div class="flex-row-between setting-row">
          <label for="show-tooltips"
            >{resource.label} <span>by {resource.author}</span></label
          >
          <button class="active" on:click={() => openLink(resource.value)}
            >Open Link</button
          >
        </div>
      {/each}
    </div>
    <div class="settings-container">
      <div class="settings-header">
        <h3>Expressions</h3>
      </div>
      {#each expressionResources as resource}
        <div class="flex-row-between setting-row">
          <label for="show-tooltips"
            >{resource.label} <span>by {resource.author}</span></label
          >
          <button class="active" on:click={() => openLink(resource.value)}
            >Open Link</button
          >
        </div>
      {/each}
    </div>
  {:else if appId === 'PPRO'}
    <div class="settings-container">
      <div class="settings-header">
        <h3>Templates</h3>
      </div>
      {#each pproTemplates as template}
        <div class="flex-row-between setting-row">
          <label for="show-tooltips"
            >{template.label}
            <span>{template.author ? 'by ' + template.author : ''}</span></label
          >
          <button class="active" on:click={() => openLink(template.value)}
            >Open Link</button
          >
        </div>
      {/each}
    </div>
    <div class="settings-container">
      <div class="settings-header">
        <h3>Stock</h3>
      </div>
      {#each stockResources as resource}
        <div class="flex-row-between setting-row">
          <label for="show-tooltips"
            >{resource.label} <span>by {resource.author}</span></label
          >
          <button class="active" on:click={() => openLink(resource.value)}
            >Open Link</button
          >
        </div>
      {/each}
    </div>
  {/if}
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

  span {
    color: $dimmed-font-color-light;
  }
</style>
