<script lang="ts">
  import { evalES } from '../../lib/utils/bolt';
  import { notifications } from '../../stores/notifications-store';
  const handleRevertToFilename = async () => {
    await evalES('renameToFile()').then((res) => {
      if (res.startsWith('Error')) {
        notifications.error(res, 2000);
      } else {
        notifications.success(res, 2000);
      }
    });
  };
</script>

<div class="flex-row-end action-row">
  <button class="active" on:click={handleRevertToFilename}
    >Revert To Filename</button
  >
</div>
