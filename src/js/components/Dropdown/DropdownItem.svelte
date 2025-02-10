<script>
  import { getContext, createEventDispatcher, onMount } from 'svelte';
  import { slide } from 'svelte/transition';
  const dispatch = createEventDispatcher();
  export let value;
  export let id = 0;

  const selectValue = () => {
    dispatch('clicked', value);
    $selectedValue = value;
    $visible = false;
  };

  let selectedValue = getContext('selected');
  let visible = getContext('visible');
</script>

<div
  class="option"
  on:click={selectValue}
  on:keydown={selectValue}
  in:slide={{ delay: id * 50 }}
  out:slide={{ delay: id * 50 }}
>
  {#if $$slots['icon']}
    <div class="menu-item-icon">
      <slot name="icon" />
    </div>
  {/if}
  <slot />
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  .option {
    padding: 0.5rem;
    cursor: pointer;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    max-height: 20px;
    margin: 4px;
  }

  .option:hover {
    background: $active;
    border-radius: 2px;
    filter: brightness(1.2);
  }

  .menu-item-icon {
    height: 14px;
    width: 14px;
  }
</style>
