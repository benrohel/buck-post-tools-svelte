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

  .progress-label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    font-size: 12px;
    color: $font;
  }

  .process-count {
    font-weight: bold;
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

  // .animate {
  //   background-image: linear-gradient(
  //     -45deg,
  //     rgba(255, 255, 255, 0.2) 25%,
  //     transparent 25%,
  //     transparent 50%,
  //     rgba(255, 255, 255, 0.2) 50%,
  //     rgba(255, 255, 255, 0.2) 75%,
  //     transparent 75%,
  //     transparent
  //   );
  //   background-size: 30px 30px;
  //   animation: progress-animation 2s linear infinite;
  // }

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
  #myProgress {
    width: 100%;
    height: 50px;
    position: relative;
    margin-top: 5%;
  }

  span {
    position: absolute;
    left: 46%;
    top: 10%;
    font-size: 1.2rem;
  }

  #myBar {
    height: 30px;
    background-color: $active;
    border: 1px solid #333;
  }

  form {
    margin-top: 1%;
    width: 100%;
    text-align: center;
  }

  button {
    cursor: pointer;
    width: 100px;
    padding: 9.5px 0;
  }

  button:active {
    background-color: hsl(204, 58%, 55%);
    color: white;
  }

  @keyframes blink {
    to {
      opacity: 0;
    }
  }

  #complete-msg-cont {
    height: 50px;
    padding: 10px;
  }

  h3#complete-msg {
    margin: 0;
    text-align: center;
    animation: blink 0.5s ease-in-out 3;
  }
</style>
