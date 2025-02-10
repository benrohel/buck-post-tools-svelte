<script lang="ts">
  import { fade } from 'svelte/transition';
  import { clickOutside } from './ClickOutside';
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import Button from '../Button/Button.svelte';

  export let position: 'bottom-left' | 'bottom-right' | 'center' =
    'bottom-left';
  export let label = 'Actions';
  export let disabled = false;

  let isMenuVisible = writable(false);
  let selectedValue = writable('');
  setContext('selected', selectedValue);
  setContext('visible', isMenuVisible);

  $: menuPosition = (): string => {
    switch (position) {
      case 'bottom-left': {
        return 'left:0';
      }
      case 'bottom-right':
        return 'right:0';
      case 'center':
        return 'transform:translateX(-25%)';
      default:
        return '';
    }
  };

  const toggleMenu = () => {
    $isMenuVisible = !$isMenuVisible;
  };

  const handleClickOutside = () => {
    $isMenuVisible = false;
  };
</script>

<div class="dropdown" use:clickOutside on:click_outside={handleClickOutside}>
  <Button {label} {disabled} onClick={toggleMenu} outline />
  {#if $isMenuVisible}
    <ul
      class="options"
      style={`${menuPosition()}`}
      in:fade={{ delay: 0, duration: 200 }}
      out:fade={{ delay: 0, duration: 200 }}
    >
      <slot />
    </ul>
  {/if}
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  .dropdown {
    border-radius: 4px;
    position: relative;
  }

  .options {
    position: absolute;
    padding: 0;
    top: 12px;
    background-color: $darker;
    z-index: 1000;
    border-radius: 4px;
  }
</style>
