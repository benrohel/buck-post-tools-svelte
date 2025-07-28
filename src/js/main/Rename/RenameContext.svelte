<script lang="ts">
  import { getContext, setContext } from 'svelte';
  import RenameContainer from './RenameContainer.svelte';
  type RenameScope = 'project' | 'timeline';

  let scope: RenameScope = 'project';

  const renameContext = {
    get scope() {
      return scope;
    },
    set scope(value: RenameScope) {
      scope = value;
    },
  };

  setContext('rename', renameContext);
</script>

<div>
  <RenameContainer />
</div>
