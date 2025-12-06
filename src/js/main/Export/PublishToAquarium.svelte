<script lang="ts">
  import { onMount } from 'svelte';
  import {
    Projects,
    GetFootageLibrary,
    PostFootageAsset,
    ListAssetsFromLibrary,
  } from '@/api/buck5/buck5-api';
  import { XmemlParser } from '@/api/fcp-xml-to-csv';
  import { GetActiveSequence } from '@/api/edit';
  import { preferencesDir } from '@/api/preferences';
  import { PROJECT_ROOT } from '@/api/files/files';
  import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';
  import AquariumProjectMenu from '@/components/MultiSelect/AquariumProjectMenu.svelte';
  import { fs, path } from '@/lib/cep/node';
  import { evalES } from '@/lib/utils/bolt';

  let projects: any[] = [];
  $: projectItems = projects.map((p: any) => ({
    value: p._key,
    label: p.data.name,
  }));
  let projectName = '';
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
    if (!selectedProject) {
      console.log('Please select a project');
      return;
    }
    const sequence = await GetActiveSequence();
    const library = await GetFootageLibrary(selectedProject.value);
    const parser = new XmemlParser();

    const xml = await exportSequenceXml(sequence);
    const json = await parser.convertXmlToJSON(xml);
    console.log(json);

    const existingAssets = await ListAssetsFromLibrary(library._key);

    // const newAssets = json.filter((item: any) =>
    //   assets.find((asset: any) => asset.data.name === item.name),
    // );

    // const publishJobs = json.map((item: any) =>
    //   PostFootageAsset(library._key, item),
    // );
    // Promise.all(publishJobs).then((res) => {
    //   console.log('Footage Assets Published to Aquarium', res);
    // });
  };

  const getProjectNameFromPath = async () => {
    const projectFile = await evalES('getProjectFile()', false);
    if (!projectFile) {
      console.log('No project file found');
      return;
    }

    const projectPath = await PROJECT_ROOT(projectFile);
    const projectName = path.basename(projectPath);
    return projectName;
  };

  const setDefaultProject = async () => {
    projectName = await getProjectNameFromPath();
    if (projects.find((p: any) => p.data.name === projectName)) {
      selectedProject = { value: projectName, label: projectName };
    } else {
      selectedProject = projectItems[0];
    }
  };

  onMount(async () => {
    projects = await Projects();
    setDefaultProject();
  });
</script>

<div class="folder-select" style="display:flex; flex-direction:row; gap:4px; ">
  <AquariumProjectMenu />
</div>

<div class="flex-row-end action-row">
  <button class="active" on:click={handleSubmitExport}
    >Add To Footage Library</button
  >
</div>
