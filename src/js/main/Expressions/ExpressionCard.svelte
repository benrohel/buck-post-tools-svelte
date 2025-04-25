<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import Freezeframe from 'freezeframe';
  import buckLogo from '../../../assets/BUCK_ICON_WHITE.svg';
  import { fly } from 'svelte/transition';
  import markdownToTxt from 'markdown-to-txt';
  import { Star } from 'lucide-svelte';

  export let expression: ExpressionSnippet;
  export let id = 0;
  export let selected = false;
  export let onSelect: Function;
  export let onUpdate: Function;

  let open = false;
  const reg = new RegExp(/```/, 'g');
  let tb: string = '';
  let freeze: Freezeframe;
  let hasPreview = false;

  const handleSelectExpression = async () => {
    if (freeze) {
      selected ? freeze.stop() : freeze.start();
    }

    if (onSelect) {
      onSelect(expression);
    }
    open = !open;
  };

  const startAnim = () => {
    if (freeze) {
      freeze.start();
    }
  };

  const stopAnim = () => {
    if (freeze) {
      freeze.stop();
    }
  };

  const handleFavorite = () => {
    if (onUpdate) {
      onUpdate(expression.id);
    }
  };

  onMount(async () => {
    if (
      expression &&
      expression.values &&
      expression.values.Thumbnail &&
      expression.values.Thumbnail[0].url
    ) {
      hasPreview = true;
      tb = expression.values.Thumbnail[0].url;

      const imgEL = document.getElementById(`${expression.id}`);
      console.log('expression id', expression.values.Name, imgEL);
      if (imgEL) {
        freeze = new Freezeframe(imgEL, {
          trigger: 'hover',
        });
      }
    } else {
      tb = buckLogo;
      hasPreview = false;
    }
  });

  onDestroy(() => {
    if (freeze) {
      freeze.destroy();
    }
  });
</script>

<div
  class={!selected ? 'task-card' : 'task-card selected'}
  on:click={handleSelectExpression}
  transition:fly={{ y: 60, duration: 250, delay: id * 40 }}
>
  {#if expression}
    <div
      class="shot-tb"
      on:mouseover={startAnim}
      on:focus={() => {}}
      on:mouseleave={stopAnim}
    >
      <img
        id={expression.id}
        class={hasPreview
          ? 'expression-preview freezeframe'
          : 'expression-preview'}
        src={tb}
        alt="gif-preview"
        style={hasPreview ? '' : 'transform:scale(0.25'}
      />
    </div>

    <div class="expression-text">
      <div class="expression-title">
        <h4>
          {expression.values.Name}
        </h4>
        <h4 id="property-text" style="">
          {expression.values.Property
            ? expression.values.Property.replace(reg, '').toUpperCase()
            : 'ANY'}
        </h4>
      </div>
      <div class="expression-description">
        {markdownToTxt(expression.values.Description)}
      </div>
    </div>
    <div style={`color:#1473e6`} id="fav-icon" on:click={handleFavorite}>
      {#if expression.favorite}
        <Star fill="#1473e6" />
      {:else}
        <Star />
      {/if}
    </div>
  {/if}
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  :root {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }

  .expression-title {
    display: flex;
    gap: 8px;
    width: 90%;
    align-items: flex-start;
    text-align: left;
    margin-bottom: 4px;
  }
  .expression-text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .expression-preview {
    width: auto;
    height: 80px;
  }

  .task-container {
    display: grid;
    grid-template-columns: min-content 1fr;
    grid-template-rows: min-content;
    align-items: center;
    width: 100%;
    gap: 8px;
    // user-select: none;
    cursor: pointer;
  }

  .task-card {
    box-sizing: border-box;
    font-family: Helvetica;
    font-size: 11px;
    color: rgba(219, 219, 219, 0.75);
    text-align: center;
    display: grid;
    grid-template-columns: max-content max-content;
    grid-template-rows: min-content min-content;
    position: relative;

    height: 80px;
    gap: 8px;
    border-radius: 8px;
    background-color: $extra-dark;
    align-items: flex-start;
    transition: background-color(0.2s);
    overflow: hidden;
  }

  .selected {
    background-color: $dimmed-font-color;
  }
  .expression-text {
    padding-top: 4px;
    user-select: none;
  }
  .expression-text:hover {
    filter: brightness(1.2);
    cursor: pointer;
  }

  h4 {
    margin: 0px;
    font-size: 12px;
  }

  #shot-label {
    widows: 100%;
    font-weight: 100;
    text-align: start;
  }

  .shot-tb {
    background-size: 80px;
    max-width: 80px;
    max-height: 80px;
    width: 80px;
    height: 80px;
    border-radius: 4px;
    background-color: $extra-dark;
  }

  .expression-description {
    width: 70vw;
    overflow: scroll;
    overflow-wrap: break-word;
    text-align: start;
    color: $font;
  }

  img:hover {
    cursor: pointer;
  }

  #property-text {
    color: $dimmed-font-color;
  }

  #fav-icon {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 20px;
    height: 20px;
  }
  #fav-icon:hover {
    cursor: pointer;
  }
</style>
