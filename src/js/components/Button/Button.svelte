<script lang="ts">
  import { fade } from "svelte/transition";
  export let label: string = "";
  export let onClick: Function = () => {};
  export let buttonClass: string = "";
  export let disabled = false;
  export let outline = false;
  export let icon = false;
  const handleOnClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const getClass = () => {
    if (outline) {
      return "outline";
    } else if (icon) {
      return "icon-only";
    }
    return "";
  };
</script>

<button class={getClass()} on:click|preventDefault={handleOnClick} {disabled}>
  {#if label}
    {label}
  {:else}
    <div class="slot-icon">
      <slot class="icon" name="icon" />
    </div>
  {/if}
</button>

<style lang="scss">
  @import "../../variables.scss";

  svg :global {
    height: 100%;
  }

  .outline {
    background-color: transparent;
    border: 1px solid $active;
  }
  .icon-only {
    border: 0;
    background-color: transparent;
  }
  .slot-icon {
    height: 18px;
    width: 18px;
    display: flex;
    color: $font;
  }
  :hover {
    color: $active;
  }
</style>
