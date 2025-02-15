<script lang="ts">
  import { Download, Upload } from 'svelte-lucide';
  import {
    GetSequence,
    GetSelectedSequences,
    CopySequenceSettings,
  } from '../../api/sequence';
  import type { Sequence } from '../../api/sequence';

  let fromSequence: Sequence | null = null;
  let toSequences: any[] = [];

  $: isReady = () => {
    return fromSequence != null && toSequences.length > 0;
  };

  const handleFromSequence = async () => {
    const seq = await GetSequence();
    if (seq) {
      fromSequence = seq;
    }
  };

  const handleToSequences = async () => {
    const seqs = await GetSelectedSequences();
    if (seqs) {
      toSequences = seqs;
    }
  };

  const handleApplySettings = () => {
    const targetSequences = toSequences.map((s) => {
      return s.nodeId;
    });
    if (fromSequence)
      CopySequenceSettings(fromSequence?.nodeId, targetSequences);
  };
</script>

<div>
  <div class="flex-row-start">
    <button on:click={handleFromSequence}>
      <Download size={16} />
    </button>
    <div>From: {fromSequence?.name ?? ''}</div>
  </div>
  <div class="flex-row-start">
    <button on:click={handleToSequences}>
      <Upload size={16} />
    </button>
    <div>To: {toSequences.map((s) => s.name).join(', ')}</div>
  </div>
  <div class="flex-row-end action-row">
    <button class="active" on:click={handleApplySettings} disabled={!isReady()}>
      Apply Settings
    </button>
  </div>
</div>
