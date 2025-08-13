<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { ArrowLeftRight } from 'lucide-svelte';
  import { evalES } from '../../lib/utils/bolt';
  import { RenameContext } from './RenameContext';

  let find = '';
  let replace = '';

  const renameContext = getContext('rename') as RenameContext;
  const handleFindAndReplace = async () => {
    const options = {
      scope: renameContext.getScope ?? 'project',
      from: find,
      to: replace,
    };

    console.log(options);

    await evalES(`findAndReplace(${JSON.stringify(options)})`, false).then(
      (res) => {
        console.log(res);
      },
    );
  };

  const handleSwapText = () => {
    let prevReplace = replace;
    replace = find;
    find = prevReplace;
  };

  onMount(() => {});
</script>

<div class="row">
  <input type="text" placeholder="Find" bind:value={find} />
  <button on:click={handleSwapText} tabindex="-1">
    <ArrowLeftRight size="16" />
  </button>
  <input type="text" placeholder="Replace" bind:value={replace} />
</div>

<div class="flex-row-end">
  <button class="active" on:click={handleFindAndReplace}> Replace Text </button>
</div>

<style lang="scss">
  .row {
    width: 100%;
  }

  input {
    width: 100%;
  }
</style>
