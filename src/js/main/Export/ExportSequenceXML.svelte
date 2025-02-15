<script lang="ts">
  import { sequenceOutputFolder } from '../../stores/local-storage';
  import { GetActiveSequence } from '../../api/edit';
  import { GetSelectedSequences } from '../../api/sequence';
  import ButtonGroup from '../../components/ButtonGroup/ButtonGroup.svelte';
  import { evalES } from '../../lib/utils/bolt';
  import { FolderInput } from 'svelte-lucide';
  import { fs, path } from '../../lib/cep/node';
  import { notifications } from '../../stores/notifications-store';

  let suffix = '';
  let selectedMode = 'active sequence';

  const handleSelectionChange = (item: any) => {
    selectedMode = item.value;
    console.log(selectedMode);
  };

  const handelSetOutputFolder = async () => {
    let folderPath = await evalES(`openFolderDialog("Select Output Folder")`);
    sequenceOutputFolder.set(String(folderPath));
  };

  const handleSequenceNameChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    suffix = target.value;
  };

  const exportSequenceXml = async (sequence: any) => {
    console.log(sequence);
    const filepath = path.join(
      $sequenceOutputFolder,
      suffix.length > 0
        ? `${sequence.name}_${suffix}.xml`
        : sequence.name + '.xml'
    );
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
    let toSequences: any[] = [];
    if (selectedMode === 'selected sequences') {
      toSequences = await GetSelectedSequences();
    } else {
      const sequence = await GetActiveSequence();
      toSequences = [sequence];
    }

    if (toSequences.length === 0) {
      console.log('Please select a sequence');
      return;
    }

    const promises = toSequences.map((seq) => {
      exportSequenceXml(seq);
    });

    await Promise.all(promises);
    notifications.success('Export Done', 2000);
  };
</script>

<ButtonGroup
  onSelectionChange={handleSelectionChange}
  items={[
    { value: 'active sequence', label: 'active sequence' },
    { value: 'selected sequences', label: 'selected sequences' },
  ]}
></ButtonGroup>
<div
  class="folder-select"
  style="display:flex; flex-direction:row; gap:4px; margin-left:2px; margin-right:2px"
>
  <button on:click={handelSetOutputFolder}>
    <FolderInput size="16" strokeWidth={1} />
  </button>
  <input type="text" bind:value={$sequenceOutputFolder} class="folder-input" />
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
