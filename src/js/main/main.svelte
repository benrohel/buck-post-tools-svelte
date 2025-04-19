<script lang="ts">
  import { getContext, onMount, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { evalES, subscribeBackgroundColor } from '../lib/utils/bolt';
  import '../index.scss';
  import Tabs from '../components/Tabs/Tabs.svelte';
  import { getAuthAuthenticated, client } from 'buck-client';
  import {
    ArrowDownUp,
    PencilRuler,
    WrapText,
    ArrowRightFromLine,
    Code,
  } from 'lucide-svelte';
  import { connectToDaemon } from './backend';
  import ProjectContainer from './Project/ProjectContainer.svelte';
  import RenameContainer from './Rename/RenameContainer.svelte';
  import IngestContainer from './Ingest/IngestContainer.svelte';
  import ExportContainer from './Export/ExportContainer.svelte';
  import ToolsContainer from './Tools/ToolsContainer.svelte';
  import Footer from './Footer.svelte';
  import Toast from '../components/Toast/Toast.svelte';
  import {
    appStore,
    defaultAppStore,
    appVersion,
    type AppStore,
  } from '../stores/app-store';
  import { localAppStore, lastFolderSearch } from '../stores/local-storage';

  import { appId } from '../lib/utils/cep';

  let backgroundColor: string = '#333333';

  let items = [
    {
      label: 'Starter',
      value: 1,
      component: ProjectContainer,
      icon: PencilRuler,
    },
    {
      label: 'Renaming Tools',
      value: 2,
      component: RenameContainer,
      icon: WrapText,
    },
    {
      label: 'Version Manamgment',
      value: 3,
      component: IngestContainer,
      icon: ArrowDownUp,
    },
    {
      label: 'Export',
      value: 4,
      component: ExportContainer,
      icon: ArrowRightFromLine,
    },
    {
      label: 'Scripts',
      value: 5,
      component: ToolsContainer,
      icon: Code,
    },
  ];

  let authenticated = false;
  $: console.log('$localAppStore', $localAppStore);
  if (!$localAppStore) {
    appStore.set(defaultAppStore);
    setContext('app-store', defaultAppStore);
  } else {
    appStore.set($localAppStore);
    setContext('app-store', $localAppStore);
  }

  onMount(async () => {
    if (window.cep) {
      // subscribeBackgroundColor((c: string) => (backgroundColor = c));
      await connectToDaemon();
      appVersion.set(await evalES(`appVersion()`));
      if (client) {
        authenticated = (await getAuthAuthenticated()).data.user ? true : false;
      }
    }
    console.log('$localAppStore', $localAppStore);
    console.log('$appVersion', $appVersion);
  });
</script>

<div class="app" style="background-color: {backgroundColor};">
  <Tabs {items} />
  <Toast />
  <Footer {authenticated} />
</div>

<style>
</style>
