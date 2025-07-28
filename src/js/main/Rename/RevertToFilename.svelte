<script lang="ts">
  import ButtonGroup from '../../components/ButtonGroup/ButtonGroup.svelte';
  import { evalES } from '../../lib/utils/bolt';
  import { notifications } from '../../stores/notifications-store';
  import { appId } from '../../lib/utils/cep';
  import { getContext } from 'svelte';

  const handleRevertToFilename = async () => {
    const scope = getContext('rename').scope;
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
