<script lang="ts">
  import { ArrowLeftRight } from 'lucide-svelte';
  import { evalES } from '../../lib/utils/bolt';
  let find = '';
  let replace = '';

  const handleFindAndReplace = async () => {
    const options = {
      scope: 'project',
      from: find,
      to: replace,
    };
    console.log(options);

    await evalES(`findAndReplace(${JSON.stringify(options)})`).then((res) => {
      console.log(res);
    });
  };

  const handleSwapText = () => {
    let prevReplace = replace;
    replace = find;
    find = prevReplace;
  };
</script>

<div>
  <div class="row">
    <div class="row">
      <input type="text" placeholder="Find" bind:value={find} />
      <button on:click={handleSwapText}>
        <ArrowLeftRight size="16" />
      </button>
      <input type="text" placeholder="Replace" bind:value={replace} />
    </div>
  </div>
  <div class="flex-row-end action-row">
    <button class="active" on:click={handleFindAndReplace}>
      Replace Text
    </button>
  </div>
</div>

<style lang="scss">
  .row {
    width: 100%;
  }

  input {
    width: 100%;
  }
</style>
