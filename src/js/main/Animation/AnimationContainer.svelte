<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { Play, Pause } from 'lucide-svelte';

  // Types
  interface EasingFunction {
    (x: number): number;
  }

  interface EasingData {
    category: string;
    type: string;
    description: string;
  }

  interface EasingItem {
    name: string;
    func: EasingFunction;
    category: string;
    type: string;
    description: string;
  }

  // Easing Functions Library
  const easingFunctions: Record<string, EasingFunction> = {
    linear: (x: number) => x,

    easeInQuad: (x: number) => x * x,
    easeOutQuad: (x: number) => 1 - (1 - x) * (1 - x),
    easeInOutQuad: (x: number) =>
      x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2,

    easeInCubic: (x: number) => x * x * x,
    easeOutCubic: (x: number) => 1 - Math.pow(1 - x, 3),
    easeInOutCubic: (x: number) =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,

    easeInQuart: (x: number) => x * x * x * x,
    easeOutQuart: (x: number) => 1 - Math.pow(1 - x, 4),
    easeInOutQuart: (x: number) =>
      x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2,

    easeInQuint: (x: number) => x * x * x * x * x,
    easeOutQuint: (x: number) => 1 - Math.pow(1 - x, 5),
    easeInOutQuint: (x: number) =>
      x < 0.5 ? 16 * x * x * x * x * x : 1 - Math.pow(-2 * x + 2, 5) / 2,

    easeInSine: (x: number) => 1 - Math.cos((x * Math.PI) / 2),
    easeOutSine: (x: number) => Math.sin((x * Math.PI) / 2),
    easeInOutSine: (x: number) => -(Math.cos(Math.PI * x) - 1) / 2,

    easeInExpo: (x: number) => (x === 0 ? 0 : Math.pow(2, 10 * (x - 1))),
    easeOutExpo: (x: number) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    easeInOutExpo: (x: number) => {
      if (x === 0) return 0;
      if (x === 1) return 1;
      return x < 0.5
        ? Math.pow(2, 20 * x - 10) / 2
        : (2 - Math.pow(2, -20 * x + 10)) / 2;
    },

    easeInCirc: (x: number) => 1 - Math.sqrt(1 - Math.pow(x, 2)),
    easeOutCirc: (x: number) => Math.sqrt(1 - Math.pow(x - 1, 2)),
    easeInOutCirc: (x: number) =>
      x < 0.5
        ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
        : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2,

    easeInBack: (x: number) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return c3 * x * x * x - c1 * x * x;
    },
    easeOutBack: (x: number) => {
      const c1 = 1.70158;
      const c3 = c1 + 1;
      return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    },
    easeInOutBack: (x: number) => {
      const c1 = 1.70158;
      const c2 = c1 * 1.525;
      return x < 0.5
        ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
        : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
    },

    easeInElastic: (x: number) => {
      const c4 = (2 * Math.PI) / 3;
      if (x === 0) return 0;
      if (x === 1) return 1;
      return -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
    },
    easeOutElastic: (x: number) => {
      const c4 = (2 * Math.PI) / 3;
      if (x === 0) return 0;
      if (x === 1) return 1;
      return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    },
    easeInOutElastic: (x: number) => {
      const c5 = (2 * Math.PI) / 4.5;
      if (x === 0) return 0;
      if (x === 1) return 1;
      return x < 0.5
        ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
        : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 +
            1;
    },

    easeInBounce: (x: number) => 1 - easingFunctions.easeOutBounce(1 - x),
    easeOutBounce: (x: number) => {
      const n1 = 7.5625;
      const d1 = 2.75;
      if (x < 1 / d1) {
        return n1 * x * x;
      } else if (x < 2 / d1) {
        return n1 * (x -= 1.5 / d1) * x + 0.75;
      } else if (x < 2.5 / d1) {
        return n1 * (x -= 2.25 / d1) * x + 0.9375;
      } else {
        return n1 * (x -= 2.625 / d1) * x + 0.984375;
      }
    },
    easeInOutBounce: (x: number) =>
      x < 0.5
        ? (1 - easingFunctions.easeOutBounce(1 - 2 * x)) / 2
        : (1 + easingFunctions.easeOutBounce(2 * x - 1)) / 2,
  };

  // Easing data with categories and descriptions
  const easingData: Record<string, EasingData> = {
    linear: {
      category: 'linear',
      type: 'LINEAR',
      description: 'Constant speed throughout',
    },

    easeInQuad: {
      category: 'quad',
      type: 'QUAD',
      description: 'Slow start, accelerating',
    },
    easeOutQuad: {
      category: 'quad',
      type: 'QUAD',
      description: 'Fast start, decelerating',
    },
    easeInOutQuad: {
      category: 'quad',
      type: 'QUAD',
      description: 'Slow start and end',
    },

    easeInCubic: {
      category: 'cubic',
      type: 'CUBIC',
      description: 'Gradual acceleration',
    },
    easeOutCubic: {
      category: 'cubic',
      type: 'CUBIC',
      description: 'Gradual deceleration',
    },
    easeInOutCubic: {
      category: 'cubic',
      type: 'CUBIC',
      description: 'Smooth acceleration and deceleration',
    },

    easeInQuart: {
      category: 'quart',
      type: 'QUART',
      description: 'Strong acceleration',
    },
    easeOutQuart: {
      category: 'quart',
      type: 'QUART',
      description: 'Strong deceleration',
    },
    easeInOutQuart: {
      category: 'quart',
      type: 'QUART',
      description: 'Strong ease in and out',
    },

    easeInQuint: {
      category: 'quint',
      type: 'QUINT',
      description: 'Very strong acceleration',
    },
    easeOutQuint: {
      category: 'quint',
      type: 'QUINT',
      description: 'Very strong deceleration',
    },
    easeInOutQuint: {
      category: 'quint',
      type: 'QUINT',
      description: 'Very strong ease in and out',
    },

    easeInSine: {
      category: 'sine',
      type: 'SINE',
      description: 'Gentle acceleration',
    },
    easeOutSine: {
      category: 'sine',
      type: 'SINE',
      description: 'Gentle deceleration',
    },
    easeInOutSine: {
      category: 'sine',
      type: 'SINE',
      description: 'Very gentle ease in and out',
    },

    easeInExpo: {
      category: 'expo',
      type: 'EXPO',
      description: 'Exponential acceleration',
    },
    easeOutExpo: {
      category: 'expo',
      type: 'EXPO',
      description: 'Exponential deceleration',
    },
    easeInOutExpo: {
      category: 'expo',
      type: 'EXPO',
      description: 'Exponential ease in and out',
    },

    easeInCirc: {
      category: 'circ',
      type: 'CIRC',
      description: 'Circular acceleration',
    },
    easeOutCirc: {
      category: 'circ',
      type: 'CIRC',
      description: 'Circular deceleration',
    },
    easeInOutCirc: {
      category: 'circ',
      type: 'CIRC',
      description: 'Circular ease in and out',
    },

    easeInBack: {
      category: 'back',
      type: 'BACK',
      description: 'Backs up before moving forward',
    },
    easeOutBack: {
      category: 'back',
      type: 'BACK',
      description: 'Overshoots then settles',
    },
    easeInOutBack: {
      category: 'back',
      type: 'BACK',
      description: 'Backs up and overshoots',
    },

    easeInElastic: {
      category: 'elastic',
      type: 'ELASTIC',
      description: 'Elastic wind-up effect',
    },
    easeOutElastic: {
      category: 'elastic',
      type: 'ELASTIC',
      description: 'Elastic spring-back effect',
    },
    easeInOutElastic: {
      category: 'elastic',
      type: 'ELASTIC',
      description: 'Elastic wind-up and spring-back',
    },

    easeInBounce: {
      category: 'bounce',
      type: 'BOUNCE',
      description: 'Bouncing acceleration',
    },
    easeOutBounce: {
      category: 'bounce',
      type: 'BOUNCE',
      description: 'Bouncing deceleration',
    },
    easeInOutBounce: {
      category: 'bounce',
      type: 'BOUNCE',
      description: 'Bouncing ease in and out',
    },
  };

  // Categories for filtering
  const categories: string[] = [
    'all',
    'quad',
    'cubic',
    'quart',
    'quint',
    'sine',
    'expo',
    'circ',
    'back',
    'elastic',
    'bounce',
  ];

  // Reactive state
  let filterText: string = '';
  let currentCategory: string = 'all';
  let showFavoritesOnly: boolean = false;
  let selectedEasing: EasingItem | null = null;
  let animationDuration: number = 1.5;
  let favorites: Set<string> = new Set();
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
    const matchesFavorites = !showFavoritesOnly || favorites.has(easing.name);

    return matchesFilter && matchesCategory && matchesFavorites;
  });

  // Load favorites from localStorage
  onMount(() => {
    const savedFavorites = localStorage.getItem('easingFavorites');
    if (savedFavorites) {
      favorites = new Set(JSON.parse(savedFavorites));
    }

    // Select default easing
    const defaultEasing = easingList.find((e) => e.name === 'easeInOutQuad');
    if (defaultEasing) {
      selectEasing(defaultEasing);
    }
  });

  // Save favorites to localStorage
  $: if (favorites) {
    localStorage.setItem('easingFavorites', JSON.stringify([...favorites]));
  }

  // Create canvas for easing curve preview - Fixed action
  function createEasingCanvas(
    canvas: HTMLCanvasElement,
    easingFunc: EasingFunction
  ) {
    // Wait for next tick to ensure canvas is mounted
    tick().then(() => {
      if (!canvas || typeof canvas.getContext !== 'function') return;

      canvas.width = 40;
      canvas.height = 40;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, 40, 40);

      // Draw grid
      ctx.strokeStyle = '#464647';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= 40; i += 10) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 40);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(40, i);
        ctx.stroke();
      }

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
        return 40 - ((value - minY + padding) / (range + 2 * padding)) * 40;
      };

      for (let i = 0; i <= 100; i++) {
        const point = points[i];
        const x = point.x * 38 + 1;
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
    const duration = 2000;

    function animate(currentTime: number): void {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = (elapsed % duration) / duration;

      const easedProgress = easingFunc(progress);
      const left = 2 + easedProgress * 28;

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
    if (favorites.has(easingName)) {
      favorites.delete(easingName);
    } else {
      favorites.add(easingName);
    }
    favorites = favorites; // Trigger reactivity
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
  <button
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
  </button>
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
    <div class="preview-section-header" on:click={() => isPreviewCollapsed = !isPreviewCollapsed}>
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
        <button
          class="action-btn star-favorite"
          class:active={favorites.has(easing.name)}
          on:click|stopPropagation={() => toggleFavorite(easing.name)}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path
              d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z"
            />
          </svg>
        </button>
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
    height: 60px;
    background: #3c3c3c;
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
    height: calc(100vh - 310px);
  }

  .easing-item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
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
    background: $active;
  }

  .easing-thumbnail {
    width: 40px;
    height: 40px;
    background: #3c3c3c;
    border-radius: 3px;
    margin-right: 12px;
    position: relative;
    overflow: hidden;
    border: 1px solid #464647;
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
    opacity: 0;
    transition: opacity 0.2s ease;
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
