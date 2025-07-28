<script lang="ts">
  import { evalES } from '../../lib/utils/bolt';
  import { getContext } from 'svelte';

  const handleVersionUpComps = async () => {
    const scope = getContext('rename').scope;
    await evalES(`versionUpNames(${scope})`);
  };
</script>

<div class="flex-row-end action-row">
  <button class="active" on:click={handleVersionUpComps}>Version Up</button>
</div>
