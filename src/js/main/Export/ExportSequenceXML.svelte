<script lang="ts">
  import {
    localAppStore,
    lastFolderExport,
    storedExportRootFolder,
  } from '@/stores/local-storage';
  import { appStore } from '@/stores/app-store';
  import { GetActiveSequence } from '@/api/edit';
  import { GetSelectedSequences } from '@/api/sequence';
  import ButtonGroup from '@/components/ButtonGroup/ButtonGroup.svelte';
  import { evalES } from '@/lib/utils/bolt';
  import { FolderInput } from 'lucide-svelte';
  import { fs, path } from '@/lib/cep/node';
  import { notifications } from '@/stores/notifications-store';
  import { onMount } from 'svelte';
  import SelectFolderWeb from '@/components/SelectFolder/SelectFolderWeb.svelte';
  import type { Sequence } from '@/api/sequence';
  import { logModule } from '@/lib/logger';

  const log = logModule('export-sequence-xml');

  let suffix = '';
  let rootFolder = '';

  $: log.debug('Root folder updated', { rootFolder });

  const setRootFolder = (path: string) => {
    if ($appStore.rememberLastExportPath) {
      lastFolderExport.set(path);
    }

    rootFolder = path;
  };

  const handleSequenceNameChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    suffix = target.value;
  };

  const exportSequenceXml = async (sequence: Sequence) => {
    const filepath = path.join(
      rootFolder,
      suffix.length > 0
        ? `${sequence.name}_${suffix}.xml`
        : sequence.name + '.xml'
    );
    log.debug('Exporting sequence XML', {
      sequenceName: sequence.name,
      filepath,
    });
    if (!fs.existsSync(filepath)) {
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
    }
    return new Promise((resolve, reject) => {
      const result = evalES(
        `exportSequenceXml("${filepath}","${sequence.nodeId}")`,
        false
      );
      if (result) {
        resolve(result);
      } else {
        reject(new Error('Failed to export sequence'));
      }
    });
  };

  const handleSubmitExport = async () => {
    let toSequences: Sequence[] = [];

    toSequences = await GetSelectedSequences();

    if (toSequences.length === 0) {
      log.warn('No sequences selected for export');
      return;
    }

    const promises = toSequences.map((seq) => {
      exportSequenceXml(seq);
    });

    await Promise.all(promises);
    // notifications.success('Export Done', 2000);
  };

  onMount(() => {
    if ($localAppStore.rememberLastExportPath) {
      rootFolder = $lastFolderExport;
    }
  });
</script>

<div
  class="folder-select"
  style="display:flex; flex-direction:row; gap:4px; margin-left:2px; margin-right:2px"
>
  <label for="root-folder">Destination Folder:</label>
  <SelectFolderWeb
    onChange={setRootFolder}
    bind:value={rootFolder}
    label="Set Destination Folder"
  />
</div>
<div class="flex-row-start">
  <label for="suffix">Suffix: </label>
  <input
    type="text"
    placeholder="v000"
    bind:value={suffix}
    style="flex-grow:1;"
    on:change={handleSequenceNameChange}
  />
</div>
<div class="flex-row-end action-row">
  <button class="active" on:click={handleSubmitExport}
    >Export Sequence XML</button
  >
</div>
