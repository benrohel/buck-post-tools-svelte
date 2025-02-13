<script lang="ts">
  import { XCircle } from "svelte-lucide";
  export let label: string = "";
  export let color: string = "#232323";
  export let closable: boolean = false;
  export let outline: boolean = false;
  export let visible = true;

  let rootElement: HTMLElement;
  $: rootElement &&
    rootElement.style.setProperty("--chip-background", `${color}`);

  const close = () => {
    visible = false;
  };
</script>

<div
  class="chip"
  bind:this={rootElement}
  style={`display:${visible ? "flex" : "none"}`}
>
  <div id="chip-icon">
    <slot name="icon" />
  </div>
  <slot name="label" class="chip-label" />
  {#if closable}
    <div id="chip-icon" on:click={close}>
      <XCircle size={14} />
    </div>
  {/if}
</div>

<style lang="scss">
  @use "../../variables.scss" as *;
  :root {
    --chip-background: inherit;
  }
  .chip {
    color: $font;
    display: flex;
    flex-direction: row;
    gap: 4px;
    background-color: var(--chip-background);
    margin: 2px;
    text-align: center;
    min-height: 14px;
    max-height: 32px;
    border-radius: 2px;
    padding: 2px 4px;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
  }

  .chip :hover {
    opacity: 0.5;
  }

  .chip-label {
    padding: 2px;
    justify-self: flex-end;
  }

  #chip-icon {
    display: flex;
    height: auto;
    width: 14px;
  }
</style>
