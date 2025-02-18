<script lang="ts">
  import { onMount, getContext } from 'svelte';
  import { evalES } from '../../lib/utils/bolt';
  import { getPresetFile } from '../../api/SQPreset';
  import { v4 as uuidv4 } from 'uuid';
  import { fs, path } from '../../lib/cep/node';
  import SelectFolder from '../../components/SelectFolder/SelectFolder.svelte';
  import Select from 'svelte-select';
  import { getProjectTemplate } from '../../api/buck-libray';
  import { buck5Server } from '../../stores/server-store';
  import te from 'date-fns/locale/te';
  import fr from 'date-fns/locale/fr';
  const appId: string = getContext('appId');

  const resolutions = [
    { label: '2880x2880', value: '2880x2880' },
    { label: '1920x1080', value: '1920x1080' },
    { label: '1080x1920', value: '1080x1920' },
    { label: '1920x1920', value: '1920x1920' },
    { label: '1080x1080', value: '1080x1080' },
    { label: '1350x1080', value: '1350x1080' },
  ];

  interface Template {
    label: string;
    value: string;
    apps: string[];
  }

  const templateList = [
    { label: 'Shot', value: 'Shot', apps: ['AEFT'] },
    { label: 'Edit', value: 'Edit', apps: ['AEFT', 'PPRO'] },
    { label: 'Conform', value: 'Conform', apps: ['PPRO'] },
  ];

  $: getTemplates = () => {
    if (appId) {
      return templateList.filter((t) => {
        return t.apps.includes(appId);
      });
    }
    return [templateList[0]];
  };

  $: templates = getTemplates();
  $: console.log(resolution);

  const framerates = ['23.976', '24', '25', '29.97', '30', '59.94'];

  let sequenceName = 'Master';
  let projectName = 'Master';
  let framerate = { label: '24', value: '24' };
  let resolution = resolutions[1];
  let duration = 240;
  let template = templateList[0];
  let rootFolder = '';

  $: console.log(
    'file template path:',
    getProjectTemplate(appId, template.value)
  );

  $: console.log(framerate);

  const handleSetOutputFolder = async (folderPath: string) => {
    if (folderPath) {
      rootFolder = folderPath;
    }
  };

  const handleStartProject = async () => {
    const [width, height] = resolution.value.split('x');
    const option = {
      width,
      height,
      framerate: framerate.value,
    };

    const templateFile = getProjectTemplate(appId, template.value);

    if (appId === 'PPRO') {
      const sqp = await getPresetFile(
        option.width,
        option.height,
        option.framerate
      );
      if (sqp) {
        const sequenceOptions = {
          sequenceName: sequenceName,
          templatePath: templateFile,
          presetPath: sqp,
          uuid: uuidv4(),
          projectFile: path.posix.join(rootFolder, `${projectName}.prproj`),
        };

        await evalES(
          `newSequenceFromPreset(${JSON.stringify(sequenceOptions)})`,
          false
        );
        fs.unlinkSync(sqp);
      }
    } else if (appId === 'AEFT') {
      const aeOptions = {
        presetPath: templateFile,
        width: parseInt(option.width),
        height: parseInt(option.height),
        framerate: parseFloat(option.framerate),
        duration: duration,
        name: sequenceName,
        projectFile: path.posix.join(
          rootFolder,
          `${projectName}.${appId === 'AEFT' ? 'aep' : 'pproj'}`
        ),
      };
      await evalES(
        `newSequenceFromPreset(${JSON.stringify(aeOptions)})`,
        false
      );
    }
  };

  const handleSequenceNameChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    sequenceName = target.value;
  };

  const handleProjectNameChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    projectName = target.value;
  };

  const handleDurationChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    duration = parseInt(target.value);
  };

  $: templateFocus = false;
  $: resolutionFocus = false;
  $: framerateFocus = false;
  $: console.log(framerate, resolution, sequenceName);

  onMount(async () => {
    if (appId === 'AEFT') {
      template = templateList[0];
    } else {
      template = templateList[1];
    }
  });
</script>

{#if !$buck5Server}
  <div>You need to be connected to Buck server to use this feature.</div>
{:else}
  <div style="display:flex; flex-direction:column; text-align:center">
    <SelectFolder
      defaultFolder={rootFolder}
      onChange={handleSetOutputFolder}
      message="Select Project Save Location"
      label="Select Project Save Location"
    />
    <div class="flex-row-start">
      <label for="projectName">Project Name: </label>
      <input
        type="text"
        placeholder="master"
        bind:value={projectName}
        style="flex-grow:1;"
        on:change={handleProjectNameChange}
      />
    </div>
    {#if appId === 'AEFT'}
      <div class="flex-row-start">
        <p class="select-label">Template:</p>
        <Select
          --width="auto"
          listOffset={2}
          label="label"
          itemId="value"
          items={templates}
          placeholder="Template"
          showChevron
          clearable={false}
          bind:value={template}
          bind:focused={templateFocus}
          bind:listOpen={templateFocus}
        />
      </div>
    {/if}
    {#if template.value === 'Shot' || appId === 'PPRO'}
      <div class="flex-row-start">
        <p class="select-label">Resolutions:</p>
        <Select
          --width="auto"
          listOffset={2}
          justValue={true}
          label="label"
          itemId="value"
          items={resolutions}
          placeholder="Template"
          showChevron
          clearable={false}
          bind:value={resolution}
          bind:focused={resolutionFocus}
          bind:listOpen={resolutionFocus}
        />
      </div>
      <div class="flex-row-start">
        <p class="select-label">Framerates:</p>
        <Select
          --width="auto"
          listOffset={2}
          justValue={true}
          items={framerates}
          placeholder="Framerate"
          showChevron
          clearable={false}
          bind:value={framerate}
          bind:focused={framerateFocus}
          bind:listOpen={framerateFocus}
        />
      </div>
    {/if}
    {#if template.value === 'Shot' && appId === 'AEFT'}
      <div class="flex-row-start">
        <label for="duration">Duration (in frames): </label>
        <input
          type="number"
          placeholder="240"
          bind:value={duration}
          on:change={handleDurationChange}
          style="max-width:60px;"
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
      <button
        class="active"
        on:click={handleStartProject}
        disabled={rootFolder.length < 10}>Start Project</button
      >
    </div>
  </div>
{/if}
