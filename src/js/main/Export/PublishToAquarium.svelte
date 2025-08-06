<script lang="ts">
  import {
    Projects,
    GetFootageLibrary,
    PostFootageAsset,
    ListAssetsFromLibrary,
  } from '../../api/buck5/buck5-api';
  import { onMount } from 'svelte';
  import MenuSelect from '../../components/MultiSelect/MenuSelect.svelte';
  import { XmemlParser } from '../../api/fcp-xml-to-csv';
  import { fs, path } from '../../lib/cep/node';
  import { evalES } from '../../lib/utils/bolt';
  import { GetActiveSequence } from '../../api/edit';
  import { preferencesDir } from '../../api/preferences';

  let projects = [];
  $: selectedProject = { value: '', label: '' };

  const setSelectedProject = (event: any) => {
    console.log(event);
    selectedProject = event;
  };

  const exportSequenceXml = async (sequence: any): Promise<string> => {
    const filepath = path.join(preferencesDir, `${sequence.name}.xml`);

    if (!fs.existsSync(filepath)) {
      fs.mkdirSync(path.dirname(filepath), { recursive: true });
    }
    return new Promise((resolve, reject) => {
      const result = evalES(
        `exportSequenceXml("${filepath}","${sequence.id}")`,
        false,
      );
      if (result) {
        resolve(result);
      } else {
        reject(new Error('Failed to export sequence'));
      }
    });
  };

  const handleSubmitExport = async () => {
    if (!selectedProject) {
      console.log('Please select a project');
      return;
    }
    const sequence = await GetActiveSequence();
    const library = await GetFootageLibrary(selectedProject.value);
    const parser = new XmemlParser();

    const xml = await exportSequenceXml(sequence);
    const json = await parser.convertXmlToJSON(xml);

    const existingAssets = await ListAssetsFromLibrary(library._key);

    // const newAssets = json.filter((item: any) =>
    //   assets.find((asset: any) => asset.data.name === item.name),
    // );

    const publishJobs = json.map((item: any) =>
      PostFootageAsset(library._key, item),
    );
    Promise.all(publishJobs).then((res) => {
      console.log('Footage Assets Published to Aquarium', res);
    });
  };

  onMount(async () => {});
</script>

<div
  class="folder-select"
  style="display:flex; flex-direction:row; gap:4px; margin-left:2px; margin-right:2px"
>
  {#await Projects()}
    <p>Loading...</p>
  {:then projects}
    <MenuSelect
      items={projects.map((p) => ({ value: p._key, label: p.data.name }))}
      bind:value={selectedProject}
      placeholder="Select Project"
      onChange={setSelectedProject}
    />
  {:catch error}
    <p>Error: {error.message}</p>
  {/await}
</div>

<div class="flex-row-end action-row">
  <button class="active" on:click={handleSubmitExport}
    >Add To Footage Library</button
  >
</div>
