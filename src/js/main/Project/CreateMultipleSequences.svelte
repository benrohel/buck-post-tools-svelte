<script lang="ts">
  import { Download, Upload } from 'lucide-svelte';

  import { notifications } from '@/stores/notifications-store';

  import {
    GetSequence,
    GetSelectedSequences,
    CopySequenceSettings,
    type Sequence,
  } from '@/api/sequence';
  import { evalES } from '@/lib/utils/bolt';
  let startTimecode: string = '';
  let isValid = true;

  const TC_REGEX = /^\d{2}:\d{2}:\d{2}:\d{2}$/;

  function formatDigits(digits: string) {
    const d = digits.slice(0, 8);
    const parts: string[] = [];
    if (d.length > 0) parts.push(d.slice(0, 2));
    if (d.length > 2) parts.push(d.slice(2, 4));
    if (d.length > 4) parts.push(d.slice(4, 6));
    if (d.length > 6) parts.push(d.slice(6, 8));
    return parts.join(':');
  }

  function handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const raw = input.value.replace(/\D/g, ''); // strip non-digits
    const cursor = input.selectionStart ?? 0;

    const digitsBeforeCursor = input.value
      .slice(0, cursor)
      .replace(/\D/g, '').length;

    startTimecode = formatDigits(raw);
    isValid = startTimecode.length === 11 ? TC_REGEX.test(startTimecode) : true;

    // Restore cursor — compute position based on how many digits were before the caret
    requestAnimationFrame(() => {
      const colonsBefore = Math.min(3, Math.floor(digitsBeforeCursor / 2));
      const nextCursor = Math.min(
        startTimecode.length,
        digitsBeforeCursor + colonsBefore,
      );
      input.setSelectionRange(nextCursor, nextCursor);
    });
  }

  function handleBlur() {
    isValid = TC_REGEX.test(startTimecode);
  }

  const handleCreateSequences = async () => {
    const result = await evalES(
      `createSequencePerClip("${startTimecode}", "")`,
    );
    if (result.startsWith('ERROR:')) {
      notifications.error(result, 2000);
    } else {
      notifications.success(result, 2000);
    }
  };

  const handleStartTimecodeChange = () => {
    // TODO: Implement start timecode change logic
  };
</script>

<div>
  <div class="flex-row-start">
    <label for="start-timecode">Start Timecode: </label>
    <input
      type="text"
      placeholder="01:00:00:00"
      bind:value={startTimecode}
      on:input={handleInput}
      on:blur={handleBlur}
      maxlength="11"
      style="max-width: 100px;"
      class:invalid={!isValid}
    />

    {#if !isValid}
      <span class="error">Invalid timecode</span>
    {/if}
  </div>
  <div class="flex-row-end action-row">
    <button class="active" on:click={handleCreateSequences}>
      Create Sequences
    </button>
  </div>
</div>

<style>
  input.invalid {
    outline: 1px solid red;
  }
  .error {
    color: red;
    font-size: 0.75em;
  }
</style>
