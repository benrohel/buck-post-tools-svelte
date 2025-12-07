<script lang="ts">
  import { Projects } from '@/api/buck5/buck5-api';
  import { onMount } from 'svelte';
  import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';
  import { path } from '@/lib/cep/node';
  import { evalES } from '@/lib/utils/bolt';
  import { PROJECT_ROOT } from '@/api/files/files';
  import { sessionProject } from '@/stores/local-storage';

  let projects: any[] = [];
  $: projectItems = projects.map((p: any) => ({
    value: p._key,
    label: p.data.name,
  }));
  let projectName = '';
  $: selectedProject = { value: '', label: '' };

  const setSelectedProject = (event: any) => {
    selectedProject = event;
    sessionProject.set(event.value);
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
    let loadedProjects = await Projects();
    projects = loadedProjects;
    setDefaultProject();
  });
</script>

<div
  class="folder-select"
  style="display:flex; flex-direction:row; gap:4px; margin-left:2px; margin-right:2px"
>
  {#await Projects()}
    <p>Loading...</p>
  {:then projects}
    <MenuSelect
      items={projectItems}
      bind:value={selectedProject}
      placeholder="Select Project"
      onChange={setSelectedProject}
    />
  {:catch error}
    <p>Error: {error.message}</p>
  {/await}
</div>
