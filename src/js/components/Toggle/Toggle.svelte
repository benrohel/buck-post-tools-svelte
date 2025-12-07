<script lang="ts">
  import type { ToggleChangeCallback } from '@/types/callbacks';

  export let checked: boolean = false;
  export let id: string = '';
  export let label: string = '';
  export let disabled: boolean = false;
  export let onChange: ToggleChangeCallback = () => {};

  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    checked = target.checked;
    if (onChange) {
      onChange(checked);
    }
  }
</script>

<div class="toggle-container">
  {#if label}
    <label for={id} class:disabled>{label}</label>
  {/if}
  <label class="toggle" class:disabled>
    <input type="checkbox" {checked} {id} {disabled} on:change={handleChange} />
    <span class="slider"></span>
  </label>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  .toggle-container {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  label {
    color: $font;
    font-size: small;

    &.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .toggle {
    position: relative;
    display: inline-block;
    width: 30px;
    height: 16px;
    cursor: pointer;

    &.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: $darker;
    border: 1px solid $dimmed-font-color;
    transition: 0.3s;
    border-radius: 20px;
  }

  .slider:before {
    position: absolute;
    content: '';
    height: 12px;
    width: 12px;
    left: 2px;
    bottom: 1px;
    background-color: $font;
    transition: 0.3s;
    border-radius: 50%;
  }

  input:checked + .slider {
    background-color: $active;
  }

  input:checked + .slider:before {
    transform: translateX(12px);
    background-color: white;
  }

  input:disabled + .slider {
    opacity: 0.6;
    cursor: not-allowed;
  }
</style>
