<script lang="ts">
  import { getContext } from 'svelte';

  import { evalES } from '@/lib/utils/bolt';
  import { RenameContext } from './RenameContext';

  const renameContext = getContext('rename') as RenameContext;

  const handleVersionUpComps = async () => {
    const scope = renameContext.getScope ?? 'project';
    await evalES(`versionUpNames("${scope}")`);
  };
</script>

<div class="flex-row-end action-row">
  <button class="active" on:click={handleVersionUpComps}>Version Up</button>
</div>
