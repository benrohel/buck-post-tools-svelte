<script lang="ts">
  import { XCircle } from 'lucide-svelte';
  export let question: string = '';
  export let onClose: Function = () => {};
  export let value: boolean = false;
  export let onConfirm: Function = () => {};

  const handleOnClose = () => {
    if (onClose) {
      onClose();
    }
  };

  export function clickOutside(node: any) {
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
  }
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
    <h3>{question}</h3>
    <div class="modal-actions">
      <button
        class="active"
        on:click={() => {
          value = true;
          onConfirm(value);
          handleOnClose();
        }}>Yes</button
      >
      <button
        class="active error"
        on:click={() => {
          value = false;
          onConfirm(value);
          handleOnClose();
        }}>No</button
      >
    </div>
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
    flex-direction: column;
    padding: 20px;
    align-items: center;
    gap: 20px;
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

  .modal-actions {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    gap: 10px;
  }

  .modal-actions button {
    width: 25%;
  }

  .error {
    background-color: $error;
  }
</style>
