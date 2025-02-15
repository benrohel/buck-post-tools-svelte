<script lang="ts">
  import { flip } from 'svelte/animate';
  import { fly } from 'svelte/transition';
  import { notifications } from '../../stores/notifications-store';
  export let themes = {
    error: 'ed553b',
    success: '#3cae5c',
    warning: '#fc7439',
    info: '#ef4426',
    default: '#aaaaaa',
  };
</script>

<div class="notifications">
  {#each $notifications as notification (notification.id)}
    <div
      animate:flip
      class="toast"
      style="background: {themes[notification.type]};"
      transition:fly={{ y: 30 }}
    >
      <div class="content">{notification.message}</div>
      {#if notification.icon}<i class={notification.icon} />{/if}
    </div>
  {/each}
</div>

<style>
  .notifications {
    position: fixed;
    bottom: 12px;
    left: 0;
    right: 0;
    margin: 0 auto;
    padding: 0;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    pointer-events: none;
    border-radius: 2px;
  }

  .toast {
    flex: 0 0 auto;
    margin-bottom: 2px;
    border-radius: 2px;
  }

  .content {
    padding: 8px;
    padding-left: 8px;
    padding-right: 8px;
    display: block;
    color: white;
    font-weight: 500;
  }
</style>
