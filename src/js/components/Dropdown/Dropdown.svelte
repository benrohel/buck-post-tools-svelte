<script lang="ts">
  // ═══════════════════════════════════════════════════════════
  // 1. SVELTE IMPORTS
  // ═══════════════════════════════════════════════════════════
  import { onMount, setContext } from 'svelte';
  import { fade } from 'svelte/transition';
  import { writable } from 'svelte/store';

  // ═══════════════════════════════════════════════════════════
  // 2. THIRD-PARTY IMPORTS
  // ═══════════════════════════════════════════════════════════
  import { ChevronDown } from 'lucide-svelte';

  // ═══════════════════════════════════════════════════════════
  // 5. API/UTILITY IMPORTS
  // ═══════════════════════════════════════════════════════════
  import { clickOutside } from './ClickOutside';

  // ═══════════════════════════════════════════════════════════
  // 8. TYPE DEFINITIONS
  // ═══════════════════════════════════════════════════════════
  import type { OptionSelectCallback } from '@/types/callbacks';

  // ═══════════════════════════════════════════════════════════
  // 9. PROPS
  // ═══════════════════════════════════════════════════════════
  export let label = '';
  export let placeholder = 'Make Selection';
  export let defaultValue: string | number | null = null;
  export let disabled = false;
  export let onSelected: OptionSelectCallback<string | number | null>;
  export let selectedValue = writable(null);

  // ═══════════════════════════════════════════════════════════
  // 10. CONTEXT
  // ═══════════════════════════════════════════════════════════
  let isMenuVisible = writable(false);
  setContext('selected', selectedValue);
  setContext('visible', isMenuVisible);

  // ═══════════════════════════════════════════════════════════
  // 13. FUNCTIONS
  // ═══════════════════════════════════════════════════════════
  const toggleMenu = () => {
    $isMenuVisible = !$isMenuVisible;
  };

  const handleClickOutside = () => {
    // $isMenuVisible = false;
  };

  selectedValue.subscribe((value) => {
    if (value) {
      onSelected(value);
    }
  });

  // ═══════════════════════════════════════════════════════════
  // 14. LIFECYCLE HOOKS
  // ═══════════════════════════════════════════════════════════
  onMount(() => {
    $isMenuVisible = false;
    if (defaultValue) {
      selectedValue.set(defaultValue);
    }
  });
</script>

{#if label}
  <div style="align-self:start; height:20px;">
    <label for="prefix" style="height:20px;line-height:20px;">{label}: </label>
  </div>
{/if}
<div
  class={disabled ? 'dropdown disabled' : 'dropdown'}
  use:clickOutside
  on:click_outside={handleClickOutside}
>
  <div class="dropdown-menu" on:click={toggleMenu}>
    <p id="dropdown-label">{placeholder}</p>
    <button class="icon-only">
      <ChevronDown size="16" strokeWidth={2} />
    </button>
  </div>

  {#if $isMenuVisible}
    <div class="options">
      <slot />
    </div>
  {/if}
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  .dropdown {
    position: relative;
    display: inline-block;
  }

  .disabled {
    pointer-events: none;
    opacity: 0.5;
  }

  .dropdown-menu {
    cursor: pointer;
    width: auto;
    max-height: 20px;
    background-color: $extra-dark;
    border: 1px solid $dimmed-font-color;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    border-radius: 4px;
    margin-left: 2px;
    z-index: 1000;
  }

  #dropdown-label {
    margin-left: 8px;
    color: $font;
  }

  .options {
    position: absolute;
    background-color: $extra-dark;
    z-index: 2;
    width: auto;
    border: 1px solid $dimmed-font-color;
    border-radius: 4px;
  }
</style>
