<script lang="ts">
  import { onMount } from 'svelte';
  import { evalES } from '../../lib/utils/bolt';
  import Button from '../../components/Button/Button.svelte';
  import { appId } from '../../lib/utils/cep';
  let prefix = 'SH';
  let start = '10';
  let increment = '10';
  let padding = '0000';

  $: getOutputName = () => {
    const pad = padding.length;
    console.log('pad', pad);
    const paddedStr = start.toString().padStart(pad, '0');
    return `${prefix}${paddedStr}`;
  };

  $: previewString = getOutputName();

  const handleRenameAction = async () => {
    const option = {
      prefix: prefix,
      startValue: parseInt(start),
      increment: parseInt(increment),
      padding: padding,
    };
    const optionString = JSON.stringify(option);
    await evalES(`renameShots(${optionString})`);
  };

  onMount(async () => {});
</script>

{#if appId === 'AEFT'}
  <div>scope = Composition</div>
{/if}
<div style="display:flex; flex-direction:column">
  <div class="row">
    <label for="prefix">Prefix</label>
    <input type="text" placeholder="prefix" bind:value={prefix} />
  </div>
  <div class="row">
    <label for="start">Start</label>
    <input type="number" placeholder="prefix" bind:value={start} />
  </div>
  <div class="row">
    <label for="increment">Increment</label>
    <input type="number" placeholder="increment" bind:value={increment} />
  </div>
  <div class="row">
    <label for="padding">Padding</label>
    <input type="text" placeholder="padding" bind:value={padding} />
  </div>
  <div class="row-preview">
    <label for="prefix">Preview</label>
    <p>
      {previewString}
    </p>
  </div>
  <div class="flex-row-end action-row">
    <button class="active" on:click={handleRenameAction}>Rename</button>
  </div>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;
  .row {
    width: 50%;
    gap: 8px;
  }

  label {
    font-size: 12px;
  }

  input {
    width: 100%;
  }

  p {
    background-color: $darker;
    color: $active;
    padding-left: 4px;
    padding-right: 4px;
  }
</style>
