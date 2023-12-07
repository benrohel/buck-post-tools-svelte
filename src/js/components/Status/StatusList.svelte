<script lang="ts">
  import Chip from "../Chip/Chip.svelte";
  import Dropdown from "../Dropdown/Dropdown.svelte";
  import DropdownItem from "../Dropdown/DropdownItem.svelte";
  import { statuses } from "../../stores/aquarium-store";

  export let onSelect: Function = () => {};
  export let disabled = true;
  const onStatusSelect = (e: any) => {
    console.log(e);
    if (onSelect) {
      onSelect(e);
    }
  };
</script>

{#if $statuses}
  {#each $statuses as status, id}
    <div class="task-list">
      <Dropdown label="Set Status" position="bottom-right" {disabled}>
        <DropdownItem
          value={status.status}
          on:clicked={() => {
            onStatusSelect(status);
          }}
          ><Chip color={status.color}>
            <span slot="label"> {status.status.toUpperCase()} </span>
          </Chip>
        </DropdownItem>
      </Dropdown>
    </div>
  {/each}
{/if}

<style lang="scss">
  .task-list {
    display: flex;
  }
  option {
    padding: 0;
  }
</style>
