<script lang="ts">
  import { onMount } from 'svelte';
  import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';
  import { sessionProject } from '@/stores/local-storage';
  import { Tasks } from '@/api/buck5/buck5-api';
  import { path } from '@/lib/cep/node';
  import { evalES } from '@/lib/utils/bolt';
  import { PROJECT_ROOT } from '@/api/files/files';
  import type * as BUCK5 from '@/api/buck5';
  import type { Option } from '@/types/models';
  import { activeProject } from '@/stores/aquarium-store';

  import { logModule } from '@/lib/logger';
  const log = logModule('aquarium-project-menu');

  export let projectId: string = '';
  let tasks: BUCK5.Item[] = [];
  let selectedTask: Option<string> = { value: '', label: '' };

  $: effectiveProjectId = projectId || $activeProject?._id || '';

  $: taskItems = tasks.map(
    (t: BUCK5.Item): Option<string> => ({
      value: t._key,
      label: t.data.name,
    }),
  );

  const setSelecctedTask = (event: Option<string> | null) => {
    if (event) {
      selectedTask = event;
    }
  };

  const loadTasks = async () => {
    if (!effectiveProjectId) {
      tasks = [];
      return;
    }
    tasks = await Tasks(effectiveProjectId);
  };

  $: if (effectiveProjectId) {
    loadTasks();
  } else {
    tasks = [];
  }

  onMount(async () => {
    await loadTasks();
  });
</script>

<div
  class="folder-select"
  style="display:flex; flex-direction:row; gap:4px; margin-left:2px; margin-right:2px"
>
  {#if effectiveProjectId}
    <MenuSelect
      items={taskItems}
      bind:value={selectedTask}
      placeholder="Select Task"
      onChange={setSelecctedTask}
    />
  {:else}
    <p>Select a project</p>
  {/if}
</div>
