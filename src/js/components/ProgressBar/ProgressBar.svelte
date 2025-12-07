<script lang="ts">
  import { fade } from 'svelte/transition';

  // Props for the component
  export let percentage: number | null = null;
  export let current: number | null = null;
  export let total: number | null = null;
  export let name: string = '';
  export let showLabel: boolean = true;
  export let height: string = '6px';
  export let color: string = '#086ce7';
  export let backgroundColor: string = '#545454';
  export let animate: boolean = true;
  export let rounded: boolean = true;
  export let showPercentage: boolean = true;

  // Calculate the percentage if current and total are provided
  $: calculatedPercentage =
    percentage !== null
      ? Math.min(Math.max(percentage, 0), 100)
      : current !== null && total !== null && total > 0
        ? Math.min(Math.max(Math.round((current / total) * 100), 0), 100)
        : 0;

  // Format the display text
  $: displayText = name
    ? `${name}: ${calculatedPercentage}%`
    : `${calculatedPercentage}%`;

  // For process count display
  $: processText =
    current !== null && total !== null ? `${current}/${total}` : '';
</script>

<div class="progress-container">
  <div
    class="progress-bar-bg"
    style="height: {height}; background-color: {backgroundColor}; border-radius: {rounded
      ? '4px'
      : '0'};"
  >
    <div
      class="progress-bar"
      class:animate
      style="width: {calculatedPercentage}%; background-color: {color}; border-radius: {rounded
        ? '4px'
        : '0'};"
      in:fade={{ duration: 300 }}
    ></div>
  </div>
  {#if showPercentage}
    <div class="percentage-text">{calculatedPercentage}%</div>
  {/if}
  {#if showLabel}
    {#if current !== null && total !== null}
      <div class="percentage-text">
        {processText}
      </div>
    {/if}
  {/if}
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  .progress-container {
    width: 100%;
    margin: 8px 0;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .progress-bar-bg {
    width: 100%;
    background-color: #e0e0e0;
    overflow: hidden;
    position: relative;
  }

  .progress-bar {
    height: 100%;
    background-color: $active;
    transition: width 0.3s ease;
  }

  .percentage-text {
    text-align: right;
    font-size: 11px;
    margin-top: 2px;
    color: $font;
    position: relative;
  }

  @keyframes progress-animation {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 30px 0;
    }
  }
</style>
