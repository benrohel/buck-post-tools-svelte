<script lang="ts">
  import { evalES } from '../../lib/utils/bolt';

  const handleVersionUpComps = async () => {
    await evalES('versionUpNames()');
  };
</script>

<div class="flex-row-end action-row">
  <button class="active" on:click={handleVersionUpComps}>Version Up</button>
</div>
