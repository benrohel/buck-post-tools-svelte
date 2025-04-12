<script lang="ts">
  import { onMount } from 'svelte';
  import { showTooltips } from '../../stores/local-storage';
  export let title = '';
  export let position = 'bottom'; // top, right, bottom, left
  export let delay = 0; // delay in ms before showing tooltip
  export let width = 'auto'; // width of tooltip
  export let dark = false; // dark theme
  export let followCursor = false; // follow cursor or stay fixed to element
  export let show = false;

  let isHovered = false;
  let tooltipElement: HTMLElement;
  let wrapperElement: HTMLElement;
  let x = 0;
  let y = 0;
  let showTimeout: ReturnType<typeof setTimeout>;
  let mounted = false;

  onMount(() => {
    mounted = true;
  });

  function calculatePosition() {
    if (!wrapperElement || !tooltipElement || !mounted) return;

    const rect = wrapperElement.getBoundingClientRect();

    // Set initial position based on wrapper element
    switch (position) {
      case 'top':
        x = rect.left + rect.width / 2;
        y = rect.top - 5;
        break;
      case 'right':
        x = rect.right + 5;
        y = rect.top + rect.height / 2;
        break;
      case 'bottom':
        x = rect.left + rect.width / 2;
        y = rect.bottom + 5;
        break;
      case 'left':
        x = rect.left - 5;
        y = rect.top + rect.height / 2;
        break;
    }

    // Adjust position after tooltip is rendered and we know its size
    setTimeout(() => {
      if (!tooltipElement) return;

      const tooltipRect = tooltipElement.getBoundingClientRect();

      // Center the tooltip based on its width/height
      switch (position) {
        case 'top':
          x = rect.left + rect.width / 2 - tooltipRect.width / 2;
          y = rect.top - tooltipRect.height - 5;
          break;
        case 'right':
          x = rect.right + 5;
          y = rect.top + rect.height / 2 - tooltipRect.height / 2;
          break;
        case 'bottom':
          x = rect.left + rect.width / 2 - tooltipRect.width / 2;
          y = rect.bottom + 5;
          break;
        case 'left':
          x = rect.left - tooltipRect.width - 5;
          y = rect.top + rect.height / 2 - tooltipRect.height / 2;
          break;
      }

      // Adjust for page scroll
      x += window.scrollX;
      y += window.scrollY;

      // Ensure tooltip stays within viewport
      const rightEdge = window.innerWidth + window.scrollX;
      const bottomEdge = window.innerHeight + window.scrollY;

      if (x + tooltipRect.width > rightEdge) {
        x = rightEdge - tooltipRect.width - 5;
      }

      if (y + tooltipRect.height > bottomEdge) {
        y = bottomEdge - tooltipRect.height - 5;
      }

      if (x < window.scrollX) {
        x = window.scrollX + 5;
      }

      if (y < window.scrollY) {
        y = window.scrollY + 5;
      }

      // Force update
      tooltipElement.style.top = `${y}px`;
      tooltipElement.style.left = `${x}px`;
    }, 0);
  }

  function mouseOver(event: MouseEvent) {
    if (!mounted) return;

    clearTimeout(showTimeout);
    showTimeout = setTimeout(() => {
      isHovered = true;
      if (followCursor) {
        x = event.pageX + 10;
        y = event.pageY + 10;
      } else {
        // Set initial position immediately
        calculatePosition();
      }
    }, delay);
  }

  function mouseMove(event: MouseEvent) {
    if (followCursor && isHovered) {
      x = event.pageX + 10;
      y = event.pageY + 10;
    }
  }

  function mouseLeave() {
    clearTimeout(showTimeout);
    isHovered = false;
  }
</script>

<div
  bind:this={wrapperElement}
  on:mouseover={mouseOver}
  on:mouseleave={mouseLeave}
  on:mousemove={mouseMove}
  class="tooltip-wrapper"
>
  <slot />
</div>

{#if isHovered && ($showTooltips || show)}
  <div
    bind:this={tooltipElement}
    style="top: {y}px; left: {x}px; width: {width}; white-space: pre-line;"
    class="tooltip {dark ? 'dark' : ''}"
  >
    {title}
  </div>
{/if}

<style lang="scss">
  @use '../../variables.scss' as *;
  .tooltip-wrapper {
    display: inline-block;
    position: relative;
  }

  .tooltip {
    border: 1px solid #ddd;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    background: $darker;
    color: $font;
    border-radius: 4px;
    padding: 8px 8px;
    position: fixed;
    z-index: 9999;

    max-width: 350px;
    word-wrap: break-word;
    pointer-events: none;
    transition: opacity 0.15s;
  }

  .tooltip.dark {
    background: $darker;
    border-color: $error;
  }
</style>
