<script lang="ts">
  import Select from 'svelte-select';
  export let items;
  export let value: any;
  export let placeholder = 'Select Tool';
  export let onChange;
  export let options = {};
  $: focus = false;
  $: openable = () => {
    return items.length === 1 ? false : true;
  };
</script>

<div class="svelte-select-container">
  <Select
    {...options}
    itemId="value"
    justValue
    searchable={false}
    clearable={false}
    {items}
    {placeholder}
    showChevron={openable()}
    disabled={!openable()}
    class="foo"
    --list-position="fixed"
    on:change={() => {
      onChange(value);
      focus = false;
    }}
    bind:focused={focus}
    bind:listOpen={focus}
    bind:value
  />
</div>

<style lang="scss">
  .svelte-select-container {
    width: 100%;
    margin-bottom: 4px;

    :global(.foo) {
    }
  }
</style>
