<script lang="ts">
  import { ArrowLeftRight } from 'lucide-svelte';
  import { evalES } from '../../lib/utils/bolt';
  import { RenameContext } from './RenameContext';
  import { getContext } from 'svelte';

  let prefix = '';
  let suffix = '';

  const renameContext = getContext('rename') as RenameContext;

  const handlePrefixSuffix = async () => {
    const options = {
      scope: renameContext.getScope ?? 'project',
      prefix: prefix,
      suffix: suffix,
    };

    await evalES(`addPrefixOrSuffix(${JSON.stringify(options)})`, false).then(
      (res) => {
        console.log(res);
      },
    );
  };

  const handleSwapText = () => {
    let prevSuffix = suffix;
    suffix = prefix;
    prefix = prevSuffix;
  };
</script>

<div>
  <div class="row">
    <div class="row">
      <input type="text" placeholder="Prefix" bind:value={prefix} />
      <button on:click={handleSwapText} tabindex="-1">
        <ArrowLeftRight size="16" />
      </button>
      <input type="text" placeholder="Suffix" bind:value={suffix} />
    </div>
  </div>
  <div class="flex-row-end action-row">
    <button class="active" on:click={handlePrefixSuffix}>
      Add Prefix/Suffix
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
