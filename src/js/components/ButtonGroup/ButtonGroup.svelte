<script lang="ts">
  import { onMount } from 'svelte';
  interface ButtonGroupItem {
    value: any;
    label: string;
  }

  export let items: ButtonGroupItem[] = [];
  export let onSelectionChange: Function;

  let selected = 0;

  onMount(() => {
    selected = 0;
  });
</script>

<div class="button-group">
  {#each items as item, index}
    <div class="button-group-item">
      <input
        type="radio"
        name="scoops"
        value={index}
        bind:group={selected}
        on:change={() => onSelectionChange(item)}
      />
      <div class="button-group-label">
        {item.label}
      </div>
    </div>
  {/each}
</div>

<style lang="scss">
  @import '../../variables.scss';

  *,
  *:before,
  *:after {
    box-sizing: border-box;
  }

  .button-group {
    display: flex;
    box-sizing: border-box;
    margin-bottom: 4px;
  }

  .button-group-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-right: 8px;
  }

  .button-group-label {
    margin-left: 8px;
  }

  input[type='radio'] {
    appearance: none;
    background-color: $extra-dark;
    margin: 0;
    font: inherit;
    color: currentColor;
    width: 12px;
    height: 12px;
    cursor: pointer;
    min-width: 12px;
    min-height: 12px;
    max-width: 12px;
    max-height: 12px;
    border: 1px solid $border-dimmed;
    border-radius: 50%;
  }

  input[type='radio']:checked {
    background-color: $active;
    transform: scale(1);
  }

  .active {
    background-color: $active;
    border: 1px solid $highlight;
  }
</style>
