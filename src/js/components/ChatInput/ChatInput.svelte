<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { ArrowUp, FileClock } from 'lucide-svelte';
  import { notifications } from '@/stores/notifications-store';
  import { localAppStore } from '@/stores/local-storage';

  let textarea: HTMLTextAreaElement | null = null;
  let keepHistory: boolean = false;
  export let inputValue: string = '';
  const dispatch = createEventDispatcher();
  // Auto-resize the textarea as content grows
  function adjustTextareaHeight() {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }

  $: console.log('keepHistory', keepHistory);
  function handleInput() {
    adjustTextareaHeight();
  }

  function handleKeydown(event: KeyboardEvent) {
    // Submit on Enter (without Shift)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submitMessage();
    }
  }

  function submitMessage() {
    if (inputValue.trim()) {
      // Dispatch event with message content
      dispatch('submit', inputValue);
      inputValue = '';

      // Reset textarea height
      if (textarea) {
        textarea.style.height = 'auto';
      }
    }
  }

  onMount(() => {
    adjustTextareaHeight();
  });
</script>

<div class="input-container">
  <div class="input-area">
    <textarea
      bind:this={textarea}
      bind:value={inputValue}
      on:input={handleInput}
      on:keydown={handleKeydown}
      class="textarea"
      placeholder={`Ask ${$localAppStore.aiService.name}`}
      rows="1"
    ></textarea>
  </div>

  <div class="button-row">
    <div class="send-controls">
      <div class="model-selector">{$localAppStore.aiService.name ?? ''}</div>
      <div class="send-button-container">
        <button
          class={keepHistory === true ? 'send-button active' : 'send-button'}
          on:click={() => {
            keepHistory = !keepHistory;
          }}
        >
          <FileClock />
        </button>
        <button
          class="send-button active"
          on:click={submitMessage}
          disabled={inputValue.trim() === '' ||
            !$localAppStore.aiService.apiKey}
        >
          <ArrowUp />
        </button>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  .input-container {
    background-color: $darkest;
    border-radius: 12px;
    width: 100%;
    padding: 8px 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    position: relative;
  }

  .input-area {
    display: flex;
    align-items: center;
  }

  .textarea {
    background-color: transparent;
    border: none;
    color: #cccccc;
    font-size: 14px;
    flex-grow: 1;
    resize: none;
    outline: none;
    padding: 8px 0;
    min-height: 24px;
    max-height: 200px;
    overflow-y: auto;
    font-family: inherit;
    width: 100%;
  }

  .textarea::placeholder {
    color: #777777;
  }

  .button-row {
    display: flex;
    margin-top: 10px;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
  }

  .tool-buttons {
    display: flex;
    gap: 8px;
  }

  .tool-button {
    width: 100%;
    height: 40px;
    border-radius: 8px;
    background-color: #333333;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #cccccc;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .tool-button:hover {
    background-color: #444444;
  }

  .send-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .model-selector {
    background-color: transparent;
    border: none;
    color: $font;
    font-size: 12px;
    opacity: 0.7;

    cursor: pointer;
    display: flex;
    align-items: center;
    border-radius: 8px;
  }

  .send-button {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  // .send-button:hover {
  //   background-color: #aa7744;
  // }

  .send-button-container {
    display: flex;
    gap: 8px;
  }
</style>
