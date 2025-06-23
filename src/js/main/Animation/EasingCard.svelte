<script lang="ts">
  import { tick } from 'svelte';
  import { fly } from 'svelte/transition';
  import { Star } from 'lucide-svelte';
  import type { EasingItem, EasingFunction } from './AnimationData';
  import { localAppStore } from '../../stores/local-storage';
  import { appStore } from '../../stores/app-store';

  export let easing: EasingItem;
  export let id = 0;
  export let selected = false;
  export let onSelect: (easing: EasingItem) => void;
  export let onHover: (easing: EasingItem, isHovering: boolean) => void;

  let dotElement: HTMLElement;

  // Create canvas for easing curve preview
  function createEasingCanvas(
    canvas: HTMLCanvasElement,
    easingFunc: EasingFunction
  ) {
    // Wait for next tick to ensure canvas is mounted
    const canvasSize = 80;
    tick().then(() => {
      if (!canvas || typeof canvas.getContext !== 'function') return;

      canvas.width = canvasSize;
      canvas.height = canvasSize;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvasSize, canvasSize);
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      // Draw easing curve with proper scaling
      ctx.strokeStyle = '#007acc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      // Sample points for curve
      const points: Array<{ x: number; y: number }> = [];
      for (let i = 0; i <= 100; i++) {
        const progress = i / 100;
        const easedProgress = easingFunc(progress);
        points.push({ x: progress, y: easedProgress });
      }

      // Find range for proper scaling
      const minY = Math.min(...points.map((p) => p.y));
      const maxY = Math.max(...points.map((p) => p.y));
      const range = maxY - minY;
      const padding = range * 0.1;

      const scaleY = (value: number): number => {
        if (range === 0) return 20;
        return (
          canvasSize -
          ((value - minY + padding) / (range + 2 * padding)) * canvasSize
        );
      };

      for (let i = 0; i <= 100; i++) {
        const point = points[i];
        const x = point.x * canvasSize + 1;
        const y = scaleY(point.y);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    });

    // Return cleanup function
    return {
      destroy() {
        // Cleanup if needed
      },
    };
  }

  const handleSelectEasing = () => {
    if (onSelect) {
      onSelect(easing);
    }
  };

  // Animate preview dot
  function animatePreviewDot(
    dotElement: HTMLElement,
    easingFunc: EasingFunction
  ): void {
    if (!dotElement) return;

    let startTime: number | null = null;
    const duration = 2000;

    function animate(currentTime: number): void {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = (elapsed % duration) / duration;

      const easedProgress = easingFunc(progress);
      const left = 2 + easedProgress * (80 - 2);

      dotElement.style.left = left + 'px';
      dotElement.style.top = '50%';
      dotElement.style.transform = 'translateY(-50%)';

      if (dotElement.dataset.animating === 'true') {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }

  const handleHoverStart = () => {
    if (dotElement) {
      dotElement.dataset.animating = 'true';
      animatePreviewDot(dotElement, easing.func);
    }
    if (onHover) {
      onHover(easing, true);
    }
  };

  const handleHoverEnd = () => {
    if (dotElement) {
      dotElement.dataset.animating = 'false';
    }
    if (onHover) {
      onHover(easing, false);
    }
  };

  const handleFavorite = (event: Event) => {
    event.stopPropagation();
    if ($appStore.favoriteAnimations.includes(easing.name)) {
      $appStore.favoriteAnimations = $appStore.favoriteAnimations.filter(
        (exp) => exp !== easing.name
      );
    } else {
      $appStore.favoriteAnimations.push(easing.name);
    }
    $appStore.favoriteAnimations = $appStore.favoriteAnimations;
    localAppStore.set($appStore);
  };
</script>

<div
  class={!selected ? 'easing-card' : 'easing-card selected'}
  on:click={handleSelectEasing}
  on:mouseenter={handleHoverStart}
  on:mouseleave={handleHoverEnd}
  transition:fly={{ y: 60, duration: 250, delay: id * 40 }}
>
  <div class="easing-thumbnail">
    <canvas class="easing-preview-canvas" use:createEasingCanvas={easing.func}
    ></canvas>
    <div class="preview-dot" data-dot={easing.name} bind:this={dotElement}></div>
  </div>

  <div class="easing-info">
    <div class="easing-title">
      <h4>{easing.name}</h4>
      <h4 class="easing-type">{easing.type}</h4>
    </div>
    <div class="easing-description">
      {easing.description}
    </div>
  </div>

  <div class="fav-icon" on:click={handleFavorite}>
    {#if $localAppStore.favoriteAnimations.includes(easing.name)}
      <Star fill="#1473e6" />
    {:else}
      <Star />
    {/if}
  </div>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  .easing-card {
    box-sizing: border-box;
    font-family: Helvetica;
    font-size: 11px;
    color: rgba(219, 219, 219, 0.75);
    display: flex;
    align-items: center;
    position: relative;
    height: 80px;
    gap: 12px;
    border-radius: 8px;
    background-color: $extra-dark;

    margin-bottom: 8px;
    cursor: pointer;
    transition: background-color 0.2s ease;
    overflow: hidden;
  }

  .easing-card:hover {
    background-color: $darker;
  }

  .easing-card.selected {
    background-color: $dimmed-font-color;
  }

  .easing-thumbnail {
    width: 80px;
    height: 80px;
    background: #3c3c3c;
    border-radius: 8px;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .easing-preview-canvas {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }

  .preview-dot {
    width: 6px;
    height: 6px;
    background: $active;
    border-radius: 50%;
    position: absolute;
    transition: none;
    box-shadow: 0 0 4px rgba(0, 122, 204, 0.5);
  }

  .easing-info {
    flex: 1;
    min-width: 0;
    padding-top: 4px;
    user-select: none;
  }

  .easing-info:hover {
    filter: brightness(1.2);
  }

  .easing-title {
    display: flex;
    gap: 8px;
    width: 90%;
    align-items: flex-start;
    text-align: left;
    margin-bottom: 4px;
  }

  .easing-title h4 {
    margin: 0;
    font-size: 13px;
    color: #cccccc;
    font-weight: 400;
  }

  .easing-type {
    font-size: 11px !important;
    color: $dimmed-font-color !important;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .easing-description {
    font-size: 11px;
    color: #9c9c9c;
    margin-top: 2px;
    line-height: 1.3;
    width: 70vw;
    overflow: hidden;
    overflow-wrap: break-word;
    text-align: start;
  }

  .fav-icon {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    color: #1473e6;
    transition: opacity 0.2s ease;
  }

  .fav-icon:hover {
    cursor: pointer;
  }
</style>
