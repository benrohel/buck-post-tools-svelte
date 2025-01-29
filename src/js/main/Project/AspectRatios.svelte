<script lang="ts">
  import { onMount } from 'svelte';
  import { evalES } from '../../lib/utils/bolt';
  import upath from 'upath';
  import { getSqTemplate, getPresetFile } from '../../api/SQPreset';
  import type { Sequence } from '../../api/sequence';
  import { ArrowRight } from 'svelte-lucide';
  import { v4 as uuidv4 } from 'uuid';
  import MultiSelect from '../../components/MultiSelect/MultiSelect.svelte';
  import { fs } from '../../lib/cep/node';
  interface Resolution {
    value: string;
    label: string;
    ratio: string;
    selected: boolean;
  }

  const videoResolutions = {
    resolutions: [
      {
        value: '2880x2880',
        label: '2880x2880',
        ratio: '1x1',
        selected: false,
      },
      {
        value: '1920x1080',
        label: '1920x1080',
        ratio: '16x9',
        selected: false,
      },
      {
        label: '1080x1920',
        value: '1080x1920',
        ratio: '9x16',
        selected: false,
      },
      {
        label: '1920x1920',
        value: '1920x1920',
        ratio: '1x1',
        selected: false,
      },
      {
        label: '1080x1080',
        value: '1080x1080',
        ratio: '1x1',
        selected: false,
      },
      {
        label: '1350x1080',
        value: '1350x1080',
        ratio: '4x5',
        selected: false,
      },
    ],
  };

  let filteredPresets: any[] = [];
  let selectedPresets: Resolution[] = [];
  let masterSequence: Sequence;
  let presetFilter: string = '';

  $: filteredPresets = videoResolutions.resolutions.filter((f) =>
    f.label.includes(presetFilter)
  );

  onMount(async () => {
    await getMasterSequence();
    const res = await GetResolutions();
    filteredPresets = res;
  });

  const GetResolutions = async () => {
    return videoResolutions.resolutions;
  };

  async function handleSetTemplate() {
    let folderPath = await evalES(`openFolderDialog("Select Output Folder")`);
    folderPath = upath.normalize(folderPath);
  }

  async function getMasterSequence() {
    let selectedSequences = true;
    const aeResult = await evalES(
      `getSelectedSequencesForNode(${selectedSequences})`,
      false
    );
    console.log(aeResult);
    const aeJson = JSON.parse(aeResult);
    masterSequence = aeJson.sequences[0];
  }

  const buildChildrenSequences = async () => {
    const promises = selectedPresets
      .filter((f) => f.selected)
      .map((res) => {
        return buildAspectRatiosSequence(res);
      });

    await Promise.all(promises);
  };

  const buildAspectRatiosSequence = async (resolution: Resolution) => {
    if (masterSequence?.framerate) {
      const width: string = resolution.value.split('x')[0];
      const height: string = resolution.value.split('x')[1];
      const option = {
        width,
        height,
        framerate: masterSequence.framerate.toString(),
      };

      const sqp = await getPresetFile(
        option.width,
        option.height,
        option.framerate
      );

      if (sqp) {
        const sequenceOptions = {
          sequenceName: `${masterSequence.name}_${resolution.value}`,
          presetPath: sqp,
          uuid: uuidv4(),
        };
        const seqId = await evalES(
          `newSequenceFromPreset(${JSON.stringify(sequenceOptions)})`,
          false
        );
        const insertOption = {
          toInsert: masterSequence.nodeId,
          inSequence: seqId,
        };
        await evalES(`InsertSequence(${JSON.stringify(insertOption)})`, false);
        fs.unlinkSync(sqp);
      }
    }
  };

  function clearSelectedPreset() {
    filteredPresets = filteredPresets.map((item) => ({
      ...item,
      selected: false,
    }));
  }

  const handleSelectionChange = (selection: any) => {
    console.log(selection);
    selectedPresets = selection;
  };

  function handlePresetFilter(e: Event) {
    clearSelectedPreset();
    presetFilter = (e.target as HTMLInputElement).value;
  }

  function getSelectedPresets(): Array<Resolution> {
    return filteredPresets.filter((f) => f.selected);
  }

  function getItemWidth(item: Resolution): string {
    const w = parseInt(item.value.split('x')[0]);
    const h = parseInt(item.value.split('x')[1]);
    const ar = w / h;
    const pixelWidth = 20 * ar;
    return `${pixelWidth}px`;
  }
</script>

<div class="settings">
  <div>
    <div class="flex-row-start">
      <button on:click={getMasterSequence}><ArrowRight size={16} /> </button>
      <p>Master Sequence:</p>
      <p>{masterSequence?.name}</p>
    </div>
    <MultiSelect
      options={filteredPresets}
      filter={presetFilter}
      onSelectionChange={handleSelectionChange}
      showCheckbox={true}
      title="Select New Resolutions"
    />
    <div
      style="margin-top:4px;background-color: #222222;  flex-direction: column; align-items: flex-start; padding-left: 2px"
    >
      {#each selectedPresets
        .filter((f) => f.selected)
        .sort() as item, index (index)}
        <div class="row">
          <li style="margin-left:2px">{item.label}</li>
          <div
            style="width: {getItemWidth(
              item
            )}; height: 20px; border: 1px solid grey; border-radius: 2px;margin-right: 2px;"
          />
        </div>
      {/each}
    </div>
  </div>
  <div class="flex-row-end">
    <button
      on:click={buildChildrenSequences}
      class="primary"
      disabled={filteredPresets.length === 0}>Create Aspect Ratios</button
    >
  </div>
</div>

<style>
  .settings {
    /* Add your styles here */
  }
  .row {
    /* Add your styles here */
  }
</style>
