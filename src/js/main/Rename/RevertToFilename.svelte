<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowLeftRight } from 'lucide-svelte';
  import { evalES } from '../../lib/utils/bolt';
  import Button from '../../components/Button/Button.svelte';

  const handleRevertToFilename = async () => {
    await evalES('renameToFile()');
  };
</script>

<div class="flex-row-end action-row">
  <button class="active" on:click={handleRevertToFilename}
    >Revert To Filename</button
  >
</div>
