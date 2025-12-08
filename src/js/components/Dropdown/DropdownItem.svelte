<script lang="ts">
  import { getContext, createEventDispatcher, onMount } from 'svelte';

  export let value;

  const selectedValue = getContext('selected');
  const visible = getContext('visible');

  const dispatch = createEventDispatcher();
  let id = 0;
  let selected = false;

  const selectValue = () => {
    dispatch('clicked', value);
    $selectedValue = value;
    $visible = false;
  };
</script>

<div class="option-container">
  <div class="option" on:click={selectValue} on:keydown={selectValue}>
    {#if $$slots['icon']}
      <div class="menu-item-icon">
        <slot name="icon" />
      </div>
    {/if}
    <slot />
  </div>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  .option {
    width: auto;
    cursor: pointer;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    height: 20px;
    max-height: 20px;
    margin-left: 4px;
    margin-right: 4px;
  }

  .option-container:hover {
    color: white;
    background-color: $darker;
  }
  .menu-item-icon {
    height: 14px;
    width: 14px;
  }
</style>
