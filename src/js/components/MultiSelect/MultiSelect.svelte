<script lang="ts">
  import { onMount } from 'svelte';
  import { ChevronDown } from 'svelte-lucide';
  import { clickOutside } from '../../lib/utils/index';
  interface MultiSelectOption {
    value: string;
    label: string;
    selected: boolean;
  }

  interface MultiSelectProp {
    options: MultiSelectOption[];
    filter: string;
    onSelectionChange: Function;
  }

  export let options: MultiSelectOption[] = [];
  export let showCheckbox = false;
  export let filter = '';
  export let onSelectionChange: Function;
  export let showFilter = false;
  export let title = 'Select an option';

  $: filteredOptions = getFilteredOptions();

  let expanded = true;
  let multiselect: HTMLDivElement;
  $: selectBox = document.getElementById('select-box') as HTMLDivElement;
  $: showingChekBox = showCheckbox;

  function toggleSelect(option: MultiSelectOption) {
    options = options.map((o) => {
      if (o.value === option.value) {
        return { ...o, selected: !o.selected };
      } else {
        return o;
      }
    });
    onSelectionChange(options);
  }

  function getFilteredOptions() {
    return options.filter((option) => {
      const label = option.label.toLowerCase();
      const filterValue = filter.toLowerCase();
      return label.includes(filterValue);
    });
  }

  function showCheckboxes() {
    var checkboxes = document.getElementById('checkboxes');
    if (!expanded) {
      checkboxes.style.display = 'block';
      expanded = true;
    } else {
      checkboxes.style.display = 'none';
      expanded = false;
    }
  }

  $: selectBoxWidth = () => {
    console.log(selectBox);
    if (!selectBox) return 300;
    return selectBox.clientWidth;
  };

  const handleClickOutside = () => {
    if (expanded) {
      showCheckboxes();
    }
    console.log('click outside');
  };

  onMount(() => {
    multiselect = document.getElementById('multiselect') as HTMLDivElement;
    selectBox = document.getElementById('select-box') as HTMLDivElement;
    filteredOptions = getFilteredOptions();
  });
</script>

<div style="display:flex; flex-direction:column">
  <div class="multiselect" bind:this={multiselect}>
    <div class="selectBox row-flex-start" on:click={showCheckboxes}>
      <div
        class="flex-row-start select-box"
        id="select-box"
        bind:this={selectBox}
      >
        <div>{title}</div>
        <div
          style="display:flex; flex-direction:row; align-items:center"
          class="icon-btn"
        >
          <ChevronDown size={16} strokeWidth={3} on:click={showCheckboxes} />
        </div>
      </div>
      {#if showFilter}
        <input type="text" placeholder="Filter options" bind:value={filter} />
      {/if}
    </div>
    <div
      id="checkboxes"
      style={`width: ${selectBoxWidth()}px`}
      use:clickOutside
      on:click_outside={handleClickOutside}
    >
      <ul>
        {#each filteredOptions as option}
          <li>
            {#if showingChekBox}
              <input
                type="checkbox"
                checked={option.selected}
                on:click={() => toggleSelect(option)}
              />
            {/if}
            <label for={option.value}>
              {option.label}
            </label>
          </li>
        {/each}
      </ul>
    </div>
  </div>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;
  .multiselect {
    position: relative;
    z-index: 1000;
  }
  .selectBox {
    position: relative;
    display: flex;
    width: 100%;
    flex-direction: row;
    gap: 4px;
  }
  .selectBox:hover {
    cursor: pointer;
  }

  #checkboxes {
    display: none;
    position: absolute;
    top: 24px;
    left: 0;
    width: 100%;
  }

  #checkboxes ul {
    list-style: none;
    background-color: $darker;
    padding-inline-start: 8px;
    border-radius: 2px;
    margin-block-start: 0%;
    border: 1px solid $dimmed-font-color;
  }
  #checkboxes li {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    justify-content: flex-start;
  }
  #checkboxes li:hover {
    cursor: pointer;
    background-color: $dimmed-font-color;
  }

  .select-box {
    flex-grow: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    justify-content: space-between;
    border: 1px solid $dimmed-font-color;
    border-radius: 4px;
    padding-left: 4px;
    background-color: $darkest;
    height: 20px;
  }

  .icon-btn {
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .icon-btn:focus {
    outline: none;
  }
  /* #checkboxes input[type='text'] {
    width: 100%;
    padding: 5px;
    border: 1px solid #ccc;
  } */

  // CHECKBOXES

  // .checkbox {
  //   box-sizing: border-box;
  //   border-radius: 0;
  //   background-color: #17181a;
  //   // border: 1px solid #8b8b8b;
  //   appearance: none;
  //   -webkit-appearance: none;
  //   outline: none;
  //   cursor: pointer;
  // }

  // .checkbox:checked {
  //   background-color: #1473e6;
  // }

  // .checkbox:disabled {
  //   background-color: #28282f;
  //   border: 1px solid #8b8b8b;
  //   cursor: not-allowed;
  // }

  input[type='checkbox'] {
    box-sizing: border-box;
    min-width: 12px;
    max-width: 12px;
    height: 12px;
    min-height: 12px;
    max-height: 12px;
    border-radius: 0;
    background-color: $darkest;
    appearance: none;
    -webkit-appearance: none;
    border: 1px solid $dimmed-font-color;
  }

  input[type='checkbox']:checked {
    background-color: #1473e6;
  }
</style>
