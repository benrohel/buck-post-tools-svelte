<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { Play, Pause, Star } from 'lucide-svelte';
  import {
    easingFunctions,
    easingData,
    EasingItem,
    categories,
    EasingFunction,
  } from './AnimationData';
  import { appStore } from '../../stores/app-store';
  import { localAppStore } from '../../stores/local-storage';

  // Reactive state
  let filterText: string = '';
  let currentCategory: string = 'all';
  let showFavoritesOnly: boolean = false;
  let selectedEasing: EasingItem | null = null;
  let animationDuration: number = 1.5;
  let footerMessage: string =
    'Click an easing function to apply to selected AE keyframes';

  // Demo animation state
  let demoBallElement: HTMLElement;
  let isAnimating: boolean = false;
  let animationId: number | null = null;
  let isPlaying: boolean = true;
  let isCodeCollapsed: boolean = true;
  let isPreviewCollapsed: boolean = true;

  // Convert easingFunctions object to array for easier iteration
  $: easingList = Object.entries(easingFunctions).map(
    ([name, func]): EasingItem => ({
      name,
      func,
      ...easingData[name],
    })
  );

  // Filter easing functions
  $: filteredEasings = easingList.filter((easing: EasingItem) => {
    const matchesFilter = easing.name
      .toLowerCase()
      .includes(filterText.toLowerCase());
    const matchesCategory =
      currentCategory === 'all' || easing.category === currentCategory;
    const matchesFavorites =
      !showFavoritesOnly ||
      $localAppStore.favoriteAnimations.includes(easing.name);

    return matchesFilter && matchesCategory && matchesFavorites;
  });

  // Load favorites from localStorage
  onMount(() => {
    const savedFavorites = $localAppStore.favoriteAnimations;
    if (savedFavorites) {
      $localAppStore.favoriteAnimations = savedFavorites;
    }

    // Select default easing
    const defaultEasing = easingList.find((e) => e.name === 'easeInOutQuad');
    if (defaultEasing) {
      selectEasing(defaultEasing);
    }
  });

  // Create canvas for easing curve preview - Fixed action
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
      // // Draw grid
      // ctx.strokeStyle = '#464647';
      // ctx.lineWidth = 0.5;
      // for (let i = 0; i <= 40; i += 10) {
      //   ctx.beginPath();
      //   ctx.moveTo(i, 0);
      //   ctx.lineTo(i, canvasSize);
      //   ctx.stroke();

      //   ctx.beginPath();
      //   ctx.moveTo(0, i);
      //   ctx.lineTo(canvasSize, i);
      //   ctx.stroke();
      // }

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

  // Animate preview dot
  function animatePreviewDot(
    dotElement: HTMLElement,
    easingFunc: EasingFunction
  ): void {
    if (!dotElement) return;

    let startTime: number | null = null;
    const duration = animationDuration * 1000;

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

  // Handle thumbnail hover
  function handleThumbnailHover(easing: EasingItem, isHovering: boolean): void {
    const dotElement = document.querySelector(
      `[data-dot="${easing.name}"]`
    ) as HTMLElement;
    if (dotElement) {
      dotElement.dataset.animating = isHovering.toString();
      if (isHovering) {
        animatePreviewDot(dotElement, easing.func);
      }
    }
  }

  // Toggle favorite
  function toggleFavorite(easingName: string): void {
    if ($appStore.favoriteAnimations.includes(easingName)) {
      $appStore.favoriteAnimations = $appStore.favoriteAnimations.filter(
        (exp) => exp !== easingName
      );
    } else {
      $appStore.favoriteAnimations.push(easingName);
    }
    $appStore.favoriteAnimations = $appStore.favoriteAnimations;
    localAppStore.set($appStore);
  }

  // Select easing function
  function selectEasing(easing: EasingItem): void {
    selectedEasing = easing;
    if (isPlaying) {
      startDemoAnimation();
    }
    applyEasingToAE(easing.name, easing.func);
  }

  // Toggle play/pause
  function togglePlayPause(): void {
    isPlaying = !isPlaying;
    if (isPlaying) {
      startDemoAnimation();
    } else {
      stopDemoAnimation();
    }
  }

  // Start demo animation
  function startDemoAnimation(): void {
    if (!selectedEasing || !demoBallElement || !isPlaying) return;

    stopDemoAnimation();
    isAnimating = true;

    let startTime: number | null = null;
    const duration = animationDuration * 1000;

    function animate(currentTime: number): void {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easedProgress = selectedEasing!.func(progress);
      const container = demoBallElement.parentElement as HTMLElement;
      const maxX = container.offsetWidth - 18;
      const x = 6 + easedProgress * (maxX - 6);

      demoBallElement.style.transform = `translateY(-50%) translateX(${x}px)`;

      if (progress < 1 && isAnimating) {
        animationId = requestAnimationFrame(animate);
      } else if (progress >= 1 && isAnimating && isPlaying) {
        setTimeout(() => {
          if (isAnimating && isPlaying) startDemoAnimation();
        }, 500);
      }
    }

    animationId = requestAnimationFrame(animate);
  }

  // Stop demo animation
  function stopDemoAnimation(): void {
    isAnimating = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  // Handle duration change
  function handleDurationChange(): void {
    if (selectedEasing && isPlaying) {
      startDemoAnimation();
    }
  }

  // Apply easing to After Effects
  function applyEasingToAE(
    easingName: string,
    easingFunc: EasingFunction
  ): void {
    console.log(`Applying ${easingName} to After Effects keyframes`);

    // CEP integration would go here
    footerMessage = `Applied ${easingName} to selected keyframes`;
    setTimeout(() => {
      footerMessage =
        'Click an easing function to apply to selected AE keyframes';
    }, 3000);
  }

  // Format function code with syntax highlighting
  function formatFunctionCode(name: string, func: EasingFunction): string {
    const funcString = func.toString();
    return `function ${name}(x: number): number {\n  ${funcString.replace('x =>', 'return')}\n}`;
  }
</script>

<!-- Toolbar -->
<div class="toolbar">
  <div class="filter-container">
    <span class="filter-label">Filter</span>
    <input
      type="text"
      class="filter-input"
      placeholder="Search easing functions..."
      bind:value={filterText}
    />
  </div>
  <div
    style={`color:#1473e6`}
    id="fav-icon"
    on:click={() => (showFavoritesOnly = !showFavoritesOnly)}
  >
    {#if showFavoritesOnly}
      <Star fill="#086ce7" />
    {:else}
      <Star />
    {/if}
  </div>
  <!-- <button
    class="star-btn"
    class:active={showFavoritesOnly}
    title="Show favorites only"
    on:click={() => (showFavoritesOnly = !showFavoritesOnly)}
  >
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path
        d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"
      />
    </svg>
  </button> -->
</div>

<!-- Category Tabs -->
<div class="category-tabs">
  {#each categories as category}
    <button
      class="category-tab"
      class:active={currentCategory === category}
      on:click={() => (currentCategory = category)}
    >
      {category.charAt(0).toUpperCase() + category.slice(1)}
    </button>
  {/each}
</div>

<!-- Preview Section -->
{#if selectedEasing}
  <div class="preview-section">
    <div
      class="preview-section-header"
      on:click={() => (isPreviewCollapsed = !isPreviewCollapsed)}
    >
      <div class="preview-title-left">
        <span>Live Preview</span>
        <button class="collapse-btn">
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="currentColor"
            class:rotated={isPreviewCollapsed}
          >
            <path
              d="M8.22 2.97a.75.75 0 0 1 1.06 0L15 8.69a.75.75 0 0 1-1.06 1.06L8 3.83 2.06 9.77a.75.75 0 0 1-1.06-1.06L8.22 2.97z"
            />
          </svg>
        </button>
      </div>
    </div>
    {#if !isPreviewCollapsed}
      <div class="preview-content">
        <div class="preview-controls">
          <div class="preview-header">
            <button class="play-pause-btn" on:click={togglePlayPause}>
              {#if isPlaying}
                <Pause />
              {:else}
                <Play />
              {/if}
            </button>
          </div>
          <div class="duration-control">
            <span>Duration:</span>
            <input
              type="range"
              class="duration-slider"
              min="0.5"
              max="3"
              step="0.1"
              bind:value={animationDuration}
              on:input={handleDurationChange}
            />
            <span>{animationDuration}s</span>
          </div>
        </div>
        <div class="preview-demo">
          <div class="demo-ball" bind:this={demoBallElement}></div>
        </div>
        <div class="code-preview-container">
          <div
            class="code-preview-header"
            on:click={() => (isCodeCollapsed = !isCodeCollapsed)}
          >
            <span>Code Preview</span>
            <button class="collapse-btn">
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="currentColor"
                class:rotated={isCodeCollapsed}
              >
                <path
                  d="M8.22 2.97a.75.75 0 0 1 1.06 0L15 8.69a.75.75 0 0 1-1.06 1.06L8 3.83 2.06 9.77a.75.75 0 0 1-1.06-1.06L8.22 2.97z"
                />
              </svg>
            </button>
          </div>
          {#if !isCodeCollapsed}
            <div class="code-preview">
              <pre>{formatFunctionCode(
                  selectedEasing.name,
                  selectedEasing.func
                )}</pre>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
{/if}

<!-- Easing List -->
<div class="easing-list">
  {#each filteredEasings as easing (easing.name)}
    <div
      class="easing-item"
      class:selected={selectedEasing?.name === easing.name}
      on:click={() => selectEasing(easing)}
      on:mouseenter={() => handleThumbnailHover(easing, true)}
      on:mouseleave={() => handleThumbnailHover(easing, false)}
    >
      <div class="easing-thumbnail">
        <canvas
          class="easing-preview-canvas"
          use:createEasingCanvas={easing.func}
        ></canvas>
        <div class="preview-dot" data-dot={easing.name}></div>
      </div>

      <div class="easing-info">
        <div class="easing-name">{easing.name}</div>
        <div class="easing-type">{easing.type}</div>
        <div class="easing-description">{easing.description}</div>
      </div>

      <div class="easing-actions">
        <!-- <button
          class="action-btn star-favorite"
          class:active={favorites.has(easing.name)}
          on:click|stopPropagation={() => toggleFavorite(easing.name)}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path
              d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"
            />
          </svg>
        </button> -->
        <div
          style={`color:#1473e6`}
          class:active={$localAppStore.favoriteAnimations.includes(easing.name)}
          id="fav-icon"
          on:click={() => toggleFavorite(easing.name)}
        >
          {#if $localAppStore.favoriteAnimations.includes(easing.name)}
            <Star fill="#1473e6" />
          {:else}
            <Star />
          {/if}
        </div>
      </div>
    </div>
  {/each}
</div>

<style lang="scss">
  @use '../../variables.scss' as *;
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: 'Segoe UI', system-ui, sans-serif;
    background: #1e1e1e;
    color: #cccccc;
    overflow-x: hidden;
    min-height: 100vh;
    font-size: 13px;
  }

  .toolbar {
    padding: 8px 16px;
    background: #252526;
    border-bottom: 1px solid #3e3e42;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .filter-container {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
  }

  .filter-label {
    font-size: 12px;
    color: #cccccc;
    min-width: 32px;
  }

  .filter-input {
    flex: 1;
    padding: 4px 8px;
    background: #3c3c3c;
    border: 1px solid #464647;
    border-radius: 2px;
    color: #cccccc;
    font-size: 12px;
    outline: none;
  }

  #fav-icon {
    width: 20px;
    height: 20px;
    align-self: center;
  }

  .filter-input:focus {
    border-color: $active;
  }

  .filter-input::placeholder {
    color: #6c6c6c;
  }

  .star-btn {
    color: #6c6c6c;
    cursor: pointer;
    transition: color 0.2s ease;
    background: none;
    border: none;
    display: flex;
    align-items: center;
  }

  .star-btn:hover,
  .star-btn.active {
    color: #007acc;
  }

  .category-tabs {
    display: flex;
    background: #2d2d30;
    border-bottom: 1px solid #3e3e42;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .category-tabs::-webkit-scrollbar {
    display: none;
  }

  .category-tab {
    padding: 4px 12px;
    background: transparent;
    border: none;
    color: #cccccc;
    cursor: pointer;
    border-bottom: 2px solid transparent;
    border-radius: 0;
    white-space: nowrap;
    transition: all 0.2s ease;
  }

  .category-tab:hover {
    // background: #3e3e42;
  }

  .category-tab.active {
    color: $active;
    border-bottom-color: $active;
  }

  .preview-section {
    background: #252526;
    border-bottom: 1px solid #3e3e42;
  }

  .preview-section-header {
    padding: 8px 16px;
    background: #2d2d30;
    border-bottom: 1px solid #3e3e42;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .preview-section-header:hover {
    background: $darker;
  }

  .preview-title-left {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #cccccc;
  }

  .preview-content {
    padding: 12px 16px;
  }

  .preview-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .preview-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .play-pause-btn {
    background: $active;
    border: none;
    border-radius: 2px;
    color: white;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }

  .play-pause-btn:hover {
    background: #005a9e;
  }

  .duration-control {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
  }

  .duration-slider {
    width: 80px;
    height: 4px;
    background: #3c3c3c;
    border-radius: 2px;
    outline: none;
    cursor: pointer;
    -webkit-appearance: none;
  }

  .duration-slider::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: $active;
    cursor: pointer;
  }

  .duration-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: $active;
    cursor: pointer;
    border: none;
  }

  .preview-demo {
    height: 20px;
    background: $dark;
    border-radius: 3px;
    border: 1px solid #464647;
    position: relative;
    overflow: hidden;
  }

  .demo-ball {
    width: 12px;
    height: 12px;
    background: $active;
    border-radius: 50%;
    position: absolute;
    top: 50%;
    left: 6px;
    transform: translateY(-50%);
    box-shadow: 0 0 8px rgba(0, 122, 204, 0.5);
  }

  .code-preview-container {
    margin-top: 8px;
    border: 1px solid #464647;
    border-radius: 3px;
    background: #1e1e1e;
  }

  .code-preview-header {
    padding: 6px 8px;
    background: #2d2d30;
    border-bottom: 1px solid #464647;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    font-size: 11px;
    color: #cccccc;
  }

  .code-preview-header:hover {
    background: $darker;
  }

  .collapse-btn {
    background: none;
    border: none;
    color: #cccccc;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
  }

  .collapse-btn svg.rotated {
    transform: rotate(180deg);
  }

  .code-preview {
    background: #1e1e1e;
    padding: 8px;
    font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    font-size: 10px;
    color: #d4d4d4;
    overflow-x: auto;
    max-height: 100px;
    overflow-y: auto;
  }

  .code-preview pre {
    margin: 0;
    white-space: pre-wrap;
  }

  .easing-list {
    flex: 1;
    overflow-y: scroll;
    height: calc(100vh - 160px);
  }

  .easing-item {
    display: flex;
    align-items: center;

    cursor: pointer;
    transition: background-color 0.2s ease;
    position: relative;
    background: $extra-dark;
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .easing-item:hover {
    background: $darker;
  }

  .easing-item.selected {
    background: $dimmed-font-color;
  }

  .easing-thumbnail {
    width: 80px;
    height: 80px;
    background: #3c3c3c;
    border-radius: 8px;
    margin-right: 12px;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
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
  }

  .easing-name {
    font-size: 13px;
    color: #cccccc;
    font-weight: 400;
    margin-bottom: 2px;
  }

  .easing-type {
    font-size: 11px;
    color: #6c6c6c;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .easing-description {
    font-size: 11px;
    color: #9c9c9c;
    margin-top: 2px;
    line-height: 1.3;
  }

  .easing-actions {
    display: flex;
    gap: 4px;
    transition: opacity 0.2s ease;
  }

  .easing-actions:hover {
    cursor: pointer;
  }

  .easing-item:hover .easing-actions {
    opacity: 1;
  }

  .action-btn {
    width: 20px;
    height: 20px;
    background: transparent;
    border: none;
    border-radius: 2px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #cccccc;
    transition: background-color 0.2s ease;
  }

  .action-btn:hover {
    background: $darker;
  }

  .star-favorite {
    color: #6c6c6c;
  }

  .star-favorite.active {
    color: $active;
  }

  .footer {
    background: $active;
    color: white;
    padding: 6px 16px;
    font-size: 11px;
    text-align: center;
    border-top: 1px solid $darker;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: $darker;
  }

  ::-webkit-scrollbar-thumb {
    background: $dark;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: $darker;
  }
</style>
