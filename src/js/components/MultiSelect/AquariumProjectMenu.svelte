<script lang="ts">
  import { onMount } from 'svelte';
  import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';
  import { sessionProject } from '@/stores/local-storage';
  import { Projects, Tasks } from '@/api/buck5/buck5-api';
  import { path } from '@/lib/cep/node';
  import { evalES } from '@/lib/utils/bolt';
  import { PROJECT_ROOT } from '@/api/files/files';
  import type * as BUCK5 from '@/api/buck5';
  import type { Option } from '@/types/models';
  import {
    projects as storedProjects,
    activeProject,
  } from '@/stores/aquarium-store';

  import { logModule } from '@/lib/logger';
  const log = logModule('aquarium-project-menu');

  let projects: BUCK5.Item[] = [];
  let projectName = '';
  let selectedProject: Option<string> = { value: '', label: '' };

  $: projectItems = projects.map(
    (p: BUCK5.Item): Option<string> => ({
      value: p._key,
      label: p.data.name,
    }),
  );

  const setSelectedProject = (event: Option<string> | null) => {
    if (event) {
      selectedProject = event;
      const proj =
        $storedProjects.find((p: BUCK5.Item) => p._key === event.value) ?? null;
      activeProject.set(proj);
      sessionProject.set(event.value);
    }
  };

  const getProjectNameFromPath = async () => {
    const projectFile = (await evalES('getProjectFile()', false)) as string;
    if (!projectFile) {
      log.warn('No project file found');
      return;
    }
    const projectPath = (await PROJECT_ROOT(projectFile)) as string;
    const projectName = path.basename(projectPath);
    return projectName;
  };

  const setDefaultProject = async () => {
    const projectNameResult = await getProjectNameFromPath();
    if (!projectNameResult) {
      return;
    }
    projectName = projectNameResult;

    const matchingProject =
      $storedProjects.find((p: BUCK5.Item) => p.data.name === projectName) ??
      null;
    if (matchingProject) {
      selectedProject = {
        value: matchingProject._key,
        label: matchingProject.data.name,
      };
      activeProject.set(matchingProject);
      sessionProject.set(matchingProject._key);
      return;
    }

    if (projectItems.length > 0) {
      selectedProject = projectItems[0];
      setSelectedProject(projectItems[0]);
    }
  };

  onMount(async () => {
    let loadedProjects = await Projects();
    storedProjects.set(loadedProjects);
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
