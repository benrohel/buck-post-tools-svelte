<script lang="ts">
  import { getContext, setContext } from 'svelte';
  import RenameContainer from './RenameContainer.svelte';
  import { RenameScope } from './RenameContext';
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
