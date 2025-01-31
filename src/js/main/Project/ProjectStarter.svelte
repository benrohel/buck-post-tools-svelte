<script lang="ts">
  import { onMount } from 'svelte';
  import { evalES } from '../../lib/utils/bolt';
  import { getPresetFile } from '../../api/SQPreset';
  import { v4 as uuidv4 } from 'uuid';
  import { fs } from '../../lib/cep/node';
  import template from './project-template.json';

  const resolutions = [
    { label: '2880x2880', value: '2880x2880' },
    { label: '1920x1080', value: '1920x1080' },
    { label: '1080x1920', value: '1080x1920' },
    { label: '1920x1920', value: '1920x1920' },
    { label: '1080x1080', value: '1080x1080' },
    { label: '1350x1080', value: '1350x1080' },
  ];

  const framerates = [
    { label: '23.976', value: '23.976' },
    { label: '24', value: '24' },
    { label: '25', value: '25' },
    { label: '29.97', value: '29.97' },
    { label: '30', value: '30' },
    { label: '59.94', value: '59.94' },
  ];

  let sequenceName = 'Master';
  let framerate = '24';
  let resolution = '1920x1080';

  const handleStartProject = async () => {
    const [width, height] = resolution.split('x');
    const option = {
      width,
      height,
      framerate: framerate,
    };

    const sqp = await getPresetFile(
      option.width,
      option.height,
      option.framerate
    );

    if (sqp) {
      const sequenceOptions = {
        sequenceName: sequenceName,
        presetPath: sqp,
        uuid: uuidv4(),
      };
      const options = { bins: template };
      await evalES(`createBins(${JSON.stringify(options)})`, false);
      await evalES(
        `newSequenceFromPreset(${JSON.stringify(sequenceOptions)})`,
        false
      );
      fs.unlinkSync(sqp);
    }
  };

  const handleFramerateChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    framerate = target.value;
  };

  const handleResolutionChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    resolution = target.value;
  };

  const handleSequenceNameChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    sequenceName = target.value;
  };

  $: console.log(framerate, resolution, sequenceName);

  onMount(async () => {});
</script>

<div style="display:flex; flex-direction:column; text-align:center">
  <div class="flex-row-start">
    <label for="prefix">Master Resolution: </label>
    <div class="select-wrapper">
      <select bind:value={resolution} on:change={handleResolutionChange}>
        {#each resolutions as resolution}
          <option value={resolution.value}>
            {resolution.label}
          </option>
        {/each}
      </select>
    </div>
  </div>
  <div class="flex-row-start">
    <label for="prefix">Framerate: </label>
    <div class="select-wrapper">
      <select bind:value={framerate} on:change={handleFramerateChange}>
        {#each framerates as framerate}
          <option value={framerate.value}>
            {framerate.label}
          </option>
        {/each}
      </select>
    </div>
  </div>
  <div class="flex-row-start">
    <label for="sequenceName">Sequence Name: </label>
    <input
      type="text"
      placeholder="master"
      bind:value={sequenceName}
      style="flex-grow:1;"
      on:change={handleSequenceNameChange}
    />
  </div>

  <div class="flex-row-end">
    <button class="active" on:click={handleStartProject}>Start Project</button>
  </div>
</div>

<style lang="scss">
</style>
