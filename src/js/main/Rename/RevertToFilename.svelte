<script lang="ts">
  import ButtonGroup from '@/components/ButtonGroup/ButtonGroup.svelte';
  import { evalES } from '@/lib/utils/bolt';
  import { notifications } from '@/stores/notifications-store';
  import { appId } from '@/lib/utils/cep';
  import { getContext } from 'svelte';
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
