<script lang="ts">
  import { onMount } from 'svelte';

  import SelectFolderWeb from '@/components/SelectFolder/SelectFolderWeb.svelte';

  import {
    localAppStore,
    lastFolderExport,
    storedExportRootFolder,
  } from '@/stores/local-storage';
  import { appStore } from '@/stores/app-store';
  import { notifications } from '@/stores/notifications-store';

  import { GetSelectedSequences } from '@/api/sequence';
  import { fs, path } from '@/lib/cep/node';
  import { GetThumbnail, type ClipType } from '@/api/clip';
  import {
    exportSequenceCSV,
    GetSequencedClips,
    type Sequence,
  } from '@/api/sequence';
  import { recursiveMkDir } from '@/lib/utils/index';

  import { logModule } from '@/lib/logger';
  const log = logModule('export-sequence-csv');

  let uploadThumbnails = false;
  let suffix = '';
  let rootFolder = '';

  $: if (uploadThumbnails !== undefined) {
    log.debug('Upload thumbnails updated', { uploadThumbnails });
  }

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

  const exportCsv = async (seq: Sequence): Promise<string> => {
    const clips = await GetSequencedClips(seq);
    log.debug('Retrieved sequence clips', {
      sequenceName: seq.name,
      clipCount: clips.length,
    });

    let csv: string = '';

    const uploadedClip = async (c: ClipType): Promise<ClipType> => {
      if (!rootFolder) {
        notifications.error('No root folder selected', 2000);
        return c;
      }
      return new Promise(async (resolve, reject) => {
        const thumbnailPath = await GetThumbnail(c, rootFolder);
        log.debug('Generated thumbnail', {
          clipName: c.clipName,
          thumbnailPath,
        });
        const updatedClip = c;
        updatedClip.thumbnailUrl = thumbnailPath;
        resolve(updatedClip);
      });
    };

    if (uploadThumbnails) {
      const tbPromises = clips.map((c) => {
        return uploadedClip(c);
      });

      const clipsWithThumbnails = await Promise.all(tbPromises);
      csv = await exportSequenceCSV(clipsWithThumbnails);
    } else {
      csv = await exportSequenceCSV(clips);
    }

    const destinationFile = path.join(rootFolder, `${seq.name}.csv`);
    recursiveMkDir(rootFolder);
    fs.writeFileSync(destinationFile, csv);

    return destinationFile;
  };

  const handleSubmitExport = async () => {
    log.debug('Exporting CSV', { uploadThumbnails, rootFolder });
    const sequences = await GetSelectedSequences();
    const csvPromises = sequences.map((seq) => {
      return exportCsv(seq);
    });

    Promise.all(csvPromises).then((res) => {
      notifications.success('CSV Export(s) Done', 3000);
    });
  };

  const handleThumbnailsChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    uploadThumbnails = target.checked;
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
<div class="flex-row-start">
  <label for="upload-thumbs">Create Thumbnails:</label>
  <input
    type="checkbox"
    bind:value={uploadThumbnails}
    on:change={handleThumbnailsChange}
  />
</div>
<div class="flex-row-end action-row">
  <button class="active" on:click={handleSubmitExport}
    >Export Sequence CSV</button
  >
</div>
