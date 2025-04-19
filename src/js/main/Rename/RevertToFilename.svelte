<script lang="ts">
  import { evalES } from '../../lib/utils/bolt';

  const handleRevertToFilename = async () => {
    await evalES('renameToFile()');
  };
</script>

<div class="flex-row-end action-row">
  <button class="active" on:click={handleRevertToFilename}
    >Revert To Filename</button
  >
</div>
