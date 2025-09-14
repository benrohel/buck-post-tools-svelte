<script lang="ts">
  import { evalES } from '../../lib/utils/bolt';
  import { onMount } from 'svelte';
  import MenuSelect from '../../components/MultiSelect/MenuSelect.svelte';

  import { RefreshCw } from 'lucide-svelte';

  let filter = '';
  let comps: any[] = [];
  let selectedCompId = 0;

  $: compsMenuItems = comps
    .filter((comp) => {
      return comp.name.toLowerCase().includes(filter.trim().toLowerCase());
    })
    .map((comp) => ({
      value: comp.id,
      label: comp.name,
    }));

  $: selectedComp = comps.find((comp) => comp.id === selectedCompId) ?? null;

  const handleOnChange = (e: any) => {
    selectedCompId = e.target.value;
  };

  const loadComps = async () => {
    comps = JSON.parse(await evalES('listAllComps()'));
    console.log(comps);
  };

  onMount(async () => {
    await loadComps();
  });

  $: console.log(selectedComp);
</script>

<div class="templates-container">
  <button class="icon" style="margin-left:4px" on:click={loadComps}>
    <RefreshCw />
  </button>
  <div class="row">
    <input type="text" placeholder="Filter" bind:value={filter} />
  </div>
  <div>
    {#if compsMenuItems.length > 0}
      <select value={selectedComp} on:change={handleOnChange}>
        {#each compsMenuItems as comp}
          <option value={comp.value}>{comp.label}</option>
        {/each}
      </select>
    {/if}
  </div>
</div>

<style lang="scss">
</style>
