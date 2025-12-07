<script lang="ts">
  import { getContext, onMount, setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import { csi, evalES, subscribeBackgroundColor } from '@/lib/utils/bolt';
  import '@/index.scss';
  import Tabs from '@/components/Tabs/Tabs.svelte';
  import { getAuthAuthenticated, client } from 'buck-client';
  import {
    ArrowDownUp,
    PencilRuler,
    WrapText,
    ArrowRightFromLine,
    Code,
    Braces,
    Globe,
    Star,
    ToolCase,
    BookMarked,
  } from 'lucide-svelte';
  import { connectToDaemon } from './backend';
  import ProjectContainer from './Project/ProjectContainer.svelte';
  import RenameContext from './Rename/RenameContext.svelte';
  import IngestContainer from './Ingest/IngestContainer.svelte';
  import ExportContainer from './Export/ExportContainer.svelte';
  import ToolsContainer from './Tools/ToolsContainer.svelte';
  import ExplorerContainer from './Explorer/ExplorerContainer.svelte';
  import Footer from './Footer.svelte';
  import Toast from '@/components/Toast/Toast.svelte';
  import {
    appStore,
    defaultAppStore,
    appVersion,
    extensionVersion,
  } from '@/stores/app-store';
  import { localAppStore } from '@/stores/local-storage';
  import AeExpressionsContainer from './Expressions/AeExpressionsContainer.svelte';
  import { checkForUpdate, installFromLocalFilepath } from '@/api/buck-library';
  import ModalConfirm from '@/components/Modal/ModalConfirm.svelte';
  import { notifications } from '@/stores/notifications-store';
  import { logModule } from '@/lib/logger';

  const log = logModule('main');

  let backgroundColor: string = '#232323';
  let modalConfirmOpen = false;
  let latestVersion: { version: string; path: string } | null = null;

  $: appName = $appStore.appId === 'AEFT' ? 'After Effects' : 'Premiere Pro';

  let items = [
    {
      label: 'Explorer',
      value: 1,
      component: ExplorerContainer,
      icon: BookMarked,
      apps: ['AEFT', 'PPRO'],
    },
    {
      label: 'Starter',
      value: 2,
      component: ProjectContainer,
      icon: PencilRuler,
      apps: ['AEFT', 'PPRO'],
    },
    {
      label: 'Renaming Tools',
      value: 3,
      component: RenameContext,
      icon: WrapText,
      apps: ['AEFT', 'PPRO'],
    },
    {
      label: 'Version Manamgment',
      value: 4,
      component: IngestContainer,
      icon: ArrowDownUp,
      apps: ['AEFT', 'PPRO'],
    },
    {
      label: 'Export',
      value: 5,
      component: ExportContainer,
      icon: ArrowRightFromLine,
      apps: ['AEFT', 'PPRO'],
    },
    {
      label: 'Expressions',
      value: 6,
      component: AeExpressionsContainer,
      icon: Braces,
      apps: ['AEFT'],
    },
    {
      label: 'Tools',
      value: 7,
      component: ToolsContainer,
      icon: ToolCase,
      apps: ['AEFT'],
    },
  ];

  let appItems = items;

  let authenticated = false;
  // Reactive statement to log store changes
  $: log.debug(
    'Local app store updated',
    { hasStore: !!$localAppStore },
    $localAppStore
  );

  if (!$localAppStore) {
    appStore.set(defaultAppStore);
    setContext('app-store', defaultAppStore);
  } else {
    appStore.set($localAppStore);
    setContext('app-store', $localAppStore);
  }

  const handleUpdateExtension = async () => {
    const installed = await installFromLocalFilepath(latestVersion.path);
    if (!installed) {
      notifications.error('Extension update failed', 3000);
      return;
    }
    notifications.success(
      `Extension updated successfully. Please restart ${appName}`,
      3000
    );
    modalConfirmOpen = false;
  };

  onMount(async () => {
    if (window.cep) {
      // Initialize appId from csi FIRST, before any other CEP operations
      appStore.set({
        ...$appStore,
        appId: csi.getApplicationID(),
      });

      subscribeBackgroundColor((c: string) => (backgroundColor = c));

      // await connectToDaemon();
      appVersion.set(await evalES(`appVersion()`));
      appItems = items.filter((item) => item.apps.includes($appStore.appId));
      if (client) {
        // authenticated = (await getAuthAuthenticated()).data.user ? true : false;
      }
    }

    log.debug(
      'Component mounted',
      {
        hasLocalStore: !!$localAppStore,
        environment: import.meta.env.MODE,
      },
      { localAppStore: $localAppStore, env: import.meta.env }
    );

    if ($extensionVersion) {
      checkForUpdate($extensionVersion).then((v) => {
        if (!v) {
          log.debug('No extension update available', {
            currentVersion: $extensionVersion,
          });
          return;
        }
        latestVersion = {
          version: `${v.version.major}.${v.version.minor}.${v.version.micro}`,
          path: v.path,
        };
        modalConfirmOpen = true;
        log.debug(
          'Extension update available',
          {
            currentVersion: $extensionVersion,
            latestVersion: latestVersion.version,
          },
          v
        );
      });
    }
  });
</script>

<div class="app" style="background-color: {backgroundColor};">
  <Tabs items={appItems} />
  <Toast />
  <Footer {authenticated} />
  {#if modalConfirmOpen}
    <ModalConfirm
      question="A new version of the Buck Tools is available. Do you want to update to version {latestVersion?.version}?"
      onClose={() => (modalConfirmOpen = false)}
      onConfirm={handleUpdateExtension}
    />
  {/if}
</div>

<style>
</style>
