<script lang="ts">
  import { onMount, getContext } from 'svelte';
  import { evalES } from '../../lib/utils/bolt';
  import { getPresetFile } from '../../api/SQPreset';
  import { v4 as uuidv4 } from 'uuid';
  import { fs, path } from '../../lib/cep/node';

  const appId = getContext('appId');

  const resolutions = [
    { label: '2880x2880', value: '2880x2880' },
    { label: '1920x1080', value: '1920x1080' },
    { label: '1080x1920', value: '1080x1920' },
    { label: '1920x1920', value: '1920x1920' },
    { label: '1080x1080', value: '1080x1080' },
    { label: '1350x1080', value: '1350x1080' },
  ];

  const templates = [
    { label: 'Shot', value: 'Shot' },
    { label: 'Edit', value: 'Edit' },
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
  let duration = 240;
  let template = templates[0].value;

  $: aeTemplatePath = `/buck/globalprefs/SHARED/AFTER_EFFECTS/templates/default${template}Template.aep`;

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
      const pproOptions = { bins: template };

      const aeOptions = {
        presetPath: aeTemplatePath,
        width: parseInt(option.width),
        height: parseInt(option.height),
        framerate: parseFloat(option.framerate),
        duration: duration,
        name: sequenceName,
      };

      switch (appId) {
        case 'AEFT':
          await evalES(
            `newSequenceFromPreset(${JSON.stringify(aeOptions)})`,
            false
          );
          break;
        case 'PPRO':
          await evalES(`createBins(${JSON.stringify(pproOptions)})`, false);
          await evalES(
            `newSequenceFromPreset(${JSON.stringify(sequenceOptions)})`,
            false
          );
          fs.unlinkSync(sqp);
          break;
        default:
          break;
      }
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

  const handleTemplateChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    template = target.value;
  };

  const handleSequenceNameChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    sequenceName = target.value;
  };

  const handleDurationChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    duration = parseInt(target.value);
  };
  $: console.log(framerate, resolution, sequenceName);

  onMount(async () => {});
</script>

<div style="display:flex; flex-direction:column; text-align:center">
  {#if appId === 'AEFT'}
    <div class="flex-row-start">
      <label for="prefix">Template: </label>
      <div class="select-wrapper">
        <select bind:value={template} on:change={handleTemplateChange}>
          {#each templates as template}
            <option value={template.value}>
              {template.label}
            </option>
          {/each}
        </select>
      </div>
    </div>
  {/if}
  {#if template === 'Shot' || appId === 'PPRO'}
    <div class="flex-row-start">
      <label for="prefix">Resolution: </label>
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
  {/if}
  {#if template === 'Shot' && appId === 'AEFT'}
    <div class="flex-row-start">
      <label for="duration">Duration (in frames): </label>
      <input
        type="number"
        placeholder="240"
        bind:value={duration}
        on:change={handleDurationChange}
      />
    </div>
  {/if}
  {#if appId === 'PPRO' || template}
    <div class="flex-row-start">
      <label for="sequenceName">Composition Name: </label>
      <input
        type="text"
        placeholder="master"
        bind:value={sequenceName}
        on:change={handleSequenceNameChange}
      />
    </div>
  {/if}
  <div class="flex-row-start">
    <label for="sequenceName"
      >{appId === 'AEFT' ? 'Composition ' : 'Sequence '}Name:
    </label>
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
