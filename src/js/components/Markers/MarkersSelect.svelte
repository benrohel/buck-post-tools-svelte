<script lang="ts">
  import { XSquare } from 'lucide-svelte';

  interface MarkerColor {
    name: string;
    selected: boolean;
    color: string;
    colorIndex: number;
  }
  const sourceMarkers: MarkerColor[] = [
    { name: 'Green', selected: false, color: '#6B8826', colorIndex: 0 },
    { name: 'Red', selected: false, color: '#E5002D', colorIndex: 1 },
    { name: 'Purple', selected: false, color: '#B689B5', colorIndex: 2 },
    { name: 'Orange', selected: false, color: '#FA6600', colorIndex: 3 },
    { name: 'Yellow', selected: false, color: '#D99E00', colorIndex: 4 },
    { name: 'White', selected: false, color: '#FFF', colorIndex: 5 },
    { name: 'Blue', selected: false, color: '#148FFF', colorIndex: 6 },
    { name: 'Cyan', selected: false, color: '#00F4D5', colorIndex: 7 },
  ];

  export let onChange: Function;
  let markers = sourceMarkers;

  const toggleMarkerSelection = (marker: any) => {
    const updatedMarkers = markers.map((m) => {
      if (m.name != marker.name) {
        return m;
      } else {
        return { ...m, selected: !m.selected };
      }
    });
    markers = updatedMarkers;
    onChange(markers);
  };

  const clearSelection = () => {
    markers = markers.map((m) => {
      return { ...m, selected: false };
    });
    onChange(markers);
  };
</script>

<div class="markers-row">
  <div class="marker-item">
    <button
      on:click={() => clearSelection()}
      style="background-color: transparent; border:none;"
    >
      <XSquare size={20} />
    </button>
  </div>
  {#each markers as marker}
    <div class="marker-item">
      <button
        class={`marker-color ${marker.selected ? 'selected' : ''}`}
        style="background-color: {marker.color};"
        on:click={() => toggleMarkerSelection(marker)}
      />
    </div>
  {/each}
</div>

<style lang="scss">
  .markers-row {
    display: flex;
    flex-direction: row;
  }
  .marker-item {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-right: 2px;
  }
  .marker-color {
    width: 16px;
    height: 16px;
  }
  .selected {
    border: 1px solid white;
  }
</style>
