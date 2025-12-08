<script lang="ts">
  import { onMount } from 'svelte';

  import { ArrowRight } from 'lucide-svelte';
  import { v4 as uuidv4 } from 'uuid';
  import upath from 'upath';

  import MultiSelect from '@/components/MultiSelect/MultiSelect.svelte';

  import { evalES } from '@/lib/utils/bolt';
  import { getPresetFile } from '@/api/SQPreset';
  import { fs } from '@/lib/cep/node';
  import type { Sequence } from '@/api/sequence';

  import { logModule } from '@/lib/logger';
  const log = logModule('aspect-ratios');

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

  let filteredPresets: Resolution[] = [];
  let selectedPresets: Resolution[] = [];
  let masterSequence: Sequence;
  let presetFilter: string = '';

  $: filteredPresets = videoResolutions.resolutions.filter((f) =>
    f.label.includes(presetFilter)
  );

  const getMasterSequence = async () => {
    let selectedSequences = true;
    const aeResult = await evalES(
      `getSelectedSequencesForNode(${selectedSequences})`,
      false
    );
    const aeJson = JSON.parse(aeResult);
    masterSequence = aeJson.sequences[0];
  };

  const GetResolutions = async () => {
    return videoResolutions.resolutions;
  };

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
          `createNewSequenceFromSQP(${JSON.stringify(sequenceOptions)})`,
          false
        );
        log.debug('Created new sequence', {
          seqId,
          resolution: resolution.value,
        });
        const insertOption = {
          toInsert: masterSequence.nodeId,
          inSequence: seqId,
        };
        await evalES(`InsertSequence(${JSON.stringify(insertOption)})`, false);
        fs.unlinkSync(sqp);
      }
    }
  };

  const clearSelectedPreset = () => {
    filteredPresets = filteredPresets.map((item) => ({
      ...item,
      selected: false,
    }));
  };

  const handleSelectionChange = (selection: Resolution[]) => {
    log.debug(
      'Resolution selection changed',
      { count: selection.length },
      selection
    );
    selectedPresets = selection;
  };

  const handlePresetFilter = (e: Event) => {
    clearSelectedPreset();
    presetFilter = (e.target as HTMLInputElement).value;
  };

  const getSelectedPresets = (): Array<Resolution> => {
    return filteredPresets.filter((f) => f.selected);
  };

  const getItemWidth = (item: Resolution): string => {
    const w = parseInt(item.value.split('x')[0]);
    const h = parseInt(item.value.split('x')[1]);
    const ar = w / h;
    const pixelWidth = 20 * ar;
    return `${pixelWidth}px`;
  };

  onMount(async () => {
    await getMasterSequence();
    const res = await GetResolutions();
    filteredPresets = res;
  });
</script>

<div class="settings">
  <div>
    <div class="flex-row-start">
      <button on:click={getMasterSequence}><ArrowRight size={16} /> </button>
      <p>Master Sequence:</p>
      <p
        style="
        text-align:left;
        flex-grow:1;background-color: #161616; padding: 4px; border-radius: 4px"
      >
        {masterSequence?.name}
      </p>
    </div>
    <MultiSelect
      options={filteredPresets}
      filter={presetFilter}
      onSelectionChange={handleSelectionChange}
      showCheckbox={true}
      title="Select New Resolutions"
    />
    <div
      style="margin-top:4px;background-color: #161616;  flex-direction: column; align-items: flex-start; padding-left: 2px"
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
</style>
