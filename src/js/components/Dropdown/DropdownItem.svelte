<script lang="ts">
  import { on } from "events";
  import { getContext, createEventDispatcher, onMount } from "svelte";
  const dispatch = createEventDispatcher();
  export let value;
  export let id = 0;
  export let selected = false;

  const selectValue = () => {
    dispatch("clicked", value);
    $selectedValue = value;
    $visible = false;
  };

  let selectedValue = getContext("selected");
  let visible = getContext("visible");
  let multiselect = getContext("multiselect") as Boolean;
</script>

<div class="option-container">
  <div class="option" on:click={selectValue} on:keydown={selectValue}>
    {#if $$slots["icon"]}
      <div class="menu-item-icon">
        <slot name="icon" />
      </div>
    {/if}
    <slot />
  </div>
</div>

<style lang="scss">
  @use "../../variables.scss" as *;

  .option {
    cursor: pointer;
    white-space: nowrap;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    height: 20px;
    max-height: 20px;
    margin-left: 8px;
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
