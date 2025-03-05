<script lang="ts">
  import { evalES } from '../../lib/utils/bolt';
  import { parseNukeTrackerToJson } from '../../api/nuke-tracker';
  import Dropzone from 'svelte-file-dropzone';
  import ButtonGroup from '../../components/ButtonGroup/ButtonGroup.svelte';

  const trackOptions = [
    { label: 'Add Corner Pin Only', value: 'cornerPin' },
    { label: 'Add Nulls only', value: 'nullsOnly' },
    { label: 'Add Nulls and Connect', value: 'nullsConnect' },
  ];

  let selectedOption = 'nullsConnect';

  let nukeData: string = '';
  let addNulls = true;
  let files = {
    accepted: ['.txt'],
    rejected: [] as any[],
  };

  const handleOptionChange = (e: any) => {
    console.log('handleOptionChange', e.detail);
  };

  const readTextFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      nukeData = e.target.result as string;
    };
    reader.readAsText(file);
  };

  $: console.log('nukeData', nukeData);
  const handleFilesSelect = (e: any) => {
    const { acceptedFiles, fileRejections } = e.detail;
    files.accepted = [...files.accepted, ...acceptedFiles];
    files.rejected = [...files.rejected, ...fileRejections];
    readTextFile(acceptedFiles[0]);
  };

  const processTracker = async () => {
    console.log('processTracker', nukeData);
    const treackerJson = await parseNukeTrackerToJson(nukeData);
    const res = await evalES(
      `buildCornerPinFromNuke(${JSON.stringify(treackerJson)})`,
      false
    );
    console.log('treackerJson', treackerJson);
  };
</script>

<div class="nuke-container">
  <Dropzone
    on:drop={handleFilesSelect}
    multiple={false}
    containerStyles={'background-color:#161616'}
  />
  <textarea
    bind:value={nukeData}
    placeholder="Copy your Nuke CornerPin and Paste it in this textArea"
  />
</div>
<!-- <ButtonGroup
  items={trackOptions}
  onSelectionChange={handleOptionChange}
  selected={2}
/> -->

<div class="flex-row-end">
  <button class="active" on:click={processTracker}> Process </button>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  .nuke-container {
    padding: 4px;
    width: auto;
    max-height: 50vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  textarea {
    height: 50vh;
    background-color: $extra-dark;
    color: white;
  }

  .m-checkbox {
    width: 12px;
    height: 12px;
    min-height: 12px;
    background-color: #17181a;
    border-radius: 50%;
    vertical-align: middle;
    border: 1px solid #8b8b8b;
    appearance: none;
    -webkit-appearance: none;
    outline: none;
    cursor: pointer;
  }

  .m-checkbox:checked {
    background-color: #1473e6;
  }

  .m-checkbox:disabled {
    background-color: #28282f;
    border: 1px solid #8b8b8b;
    cursor: not-allowed;
  }
</style>
