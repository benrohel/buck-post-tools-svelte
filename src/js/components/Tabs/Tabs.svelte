<script lang="ts">
  interface TabItem {
    value: number;
    label: string;
    icon?: any;
    component?: any;
  }

  export let items: TabItem[] = [];
  export let activeTabValue: number = 1;

  const handleClick = (tabValue: number) => () => (activeTabValue = tabValue);
</script>

<ul>
  {#each items as item}
    <li class={activeTabValue === item.value ? 'active' : ''}>
      <span
        on:click={handleClick(item.value)}
        on:keypress={handleClick(item.value)}
      >
        {#if item.icon}
          <svelte:component this={item.icon} size="14" />
        {:else}
          {item.label}
        {/if}
      </span>
      <div class={activeTabValue === item.value ? 'stripe-active' : ''} />
    </li>
  {/each}
</ul>
<div style="margin-top:4px"></div>
{#each items as item}
  {#if activeTabValue == item.value}
    <div class="box">
      <svelte:component this={item.component} />
    </div>
  {/if}
{/each}

<style lang="scss">
  @import '../../variables.scss';
  .box {
    margin-bottom: 2px;
    border-radius: 0 0 2px 2px;
    border-top: 0;
  }
  ul {
    display: flex;
    flex-wrap: wrap;
    padding-left: 0;
    margin-top: 0;
    margin-bottom: 4px;
    list-style: none;
    border-bottom: 1px solid $darker;
    color: $font;
    font-size: 12px;
  }
  li {
    margin-bottom: -1px;
    position: relative;
  }

  span {
    border: 1px solid transparent;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    display: block;
    padding: 4px 4px;
    cursor: pointer;
  }

  li.active > span {
    color: $active;
  }

  .stripe-active {
    position: relative;
    bottom: 0;
    left: 0;
    width: 90%;
    height: 2px;
    min-height: 2px;
    min-width: 100%;
    background-color: $active;
  }
</style>
