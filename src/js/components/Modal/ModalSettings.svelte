<script lang="ts">
  // ═══════════════════════════════════════════════════════════
  // 2. THIRD-PARTY IMPORTS
  // ═══════════════════════════════════════════════════════════
  import { XCircle } from 'lucide-svelte';

  // ═══════════════════════════════════════════════════════════
  // 8. TYPE DEFINITIONS
  // ═══════════════════════════════════════════════════════════
  import type { OnClose } from '@/types/callbacks';

  // ═══════════════════════════════════════════════════════════
  // 9. PROPS
  // ═══════════════════════════════════════════════════════════
  export let onClose: OnClose = () => {};

  // ═══════════════════════════════════════════════════════════
  // 13. FUNCTIONS
  // ═══════════════════════════════════════════════════════════
  const handleOnClose = () => {
    if (onClose) {
      onClose();
    }
  };

  export const clickOutside = (node: any) => {
    const handleClick = (event: MouseEvent) => {
      if (
        node &&
        !node.contains(event.target as Node) &&
        !event.defaultPrevented
      ) {
        node.dispatchEvent(new CustomEvent('click_outside'));
      }
    };

    // Use setTimeout to delay adding the event listener
    // This prevents the modal from closing immediately when it's opened
    setTimeout(() => {
      document.addEventListener('click', handleClick, true);
    }, 50);

    return {
      destroy() {
        document.removeEventListener('click', handleClick, true);
      },
    };
  };
</script>

<div id="modal-overlay" on:click={handleOnClose}>
  <div
    id="topModal"
    use:clickOutside
    on:click_outside={handleOnClose}
    on:click|stopPropagation
  >
    <button id="close" on:click={handleOnClose}>
      <XCircle size={20} />
    </button>
    <slot />
  </div>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  #modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.65);
    z-index: 9998;
  }

  #topModal {
    z-index: 9999;
    border-radius: 4px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    border: 1px solid $dimmed-font-color;
    background: $darkest;
    display: flex;
    padding-top: 20px;
    align-items: flex-start;
  }

  #modal-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  #close {
    position: absolute;
    top: 9px;
    right: 9px;

    cursor: pointer;
    fill: #f44;
    transition: transform 0.3s;
  }

  #close:hover {
    transform: scale(1.2);
  }

  #preview-name {
    font-size: 12px;
    margin: 0;
    align-self: flex-start;
    margin-left: 4px;
  }
  button {
    background: transparent;
    border: none;
    outline: none;
    cursor: pointer;
  }
  .active {
    background-color: $active;
    width: 50%;
    margin: auto;
  }
  input {
    min-width: 50%;
  }
</style>
