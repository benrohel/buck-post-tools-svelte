<script lang="ts">
  import Select from "svelte-select";
  export let items;
  export let value: any;
  export let placeholder = "Select Tool";
  export let onChange;

  $: focus = false;
  $: openable = () => {
    return items.length === 1 ? false : true;
  };
</script>

<div class="svelte-select-container">
  <Select
    itemId="value"
    justValue
    searchable={false}
    clearable={false}
    {items}
    {placeholder}
    showChevron={openable()}
    disabled={!openable()}
    on:change={() => {
      focus = false;
      onChange(value);
    }}
    bind:focused={focus}
    bind:listOpen={focus}
    bind:value
  />
</div>

<style lang="scss">
  .svelte-select-container {
    width: 100%;
  }
</style>
