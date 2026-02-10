<script lang="ts">
  import { getContext } from 'svelte';

  import ButtonGroup from '@/components/ButtonGroup/ButtonGroup.svelte';

  import { notifications } from '@/stores/notifications-store';

  import { evalES } from '@/lib/utils/bolt';
  import { RenameContext } from './RenameContext';

  const renameContext = getContext('rename') as RenameContext;

  const handleRevertToFilename = async () => {
    const scope = renameContext.getScope ?? 'project';
    await evalES(`revertToFilename("${scope}")`);
  };
</script>

<div>
  <div class="flex-row-end action-row">
    <button class="active" on:click={handleRevertToFilename}
      >Revert To Filename</button
    >
  </div>
</div>
