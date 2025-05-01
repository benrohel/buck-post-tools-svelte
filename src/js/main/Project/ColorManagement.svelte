<script lang="ts">
  import { onMount } from 'svelte';
  import { evalFile, evalES } from '../../lib/utils/bolt';
  import { fs } from '../../lib/cep/node';
  import { v4 as uuidv4 } from 'uuid';
  import path from 'path';
  import {
    getProjectSettingsTemplate,
    setProjectSettingsTemplate,
    type ProjectSettings,
  } from '../../api/files/files';

  import { Blend } from 'lucide-svelte';
  let gap = 2;

  let projectSettingsTemplate: ProjectSettings | null = null;
  let projectColorSettings: ProjectSettings | null = null;

  // Premiere script to Eval Example
  //   const scriptString = (gap: number) => {
  //     return `// Add gaps between clips in the current timeline and fill with text of the next clip
  // function addGapsBetweenClips(gap) {
  //   app.enableQE();
  //   const newSeq = app.project.activeSequence;

  //   for (var t = 0; newSeq.videoTracks.numTracks; t++) {
  //     var currentTrack = newSeq.videoTracks[t];

  //     var numberOfClips = currentTrack.clips.numItems;
  //     var clips = currentTrack.clips;

  //     for (var c = numberOfClips - 1; c > 0; c--) {
  //       var newInTime = new Time();
  //       alert(String(newInTime.seconds));
  //       newInTime.seconds = gap * c;

  //       clips[c].move(newInTime);
  //     }
  //   }
  //   alert('Gaps added between clips.');
  // }

  // // Run the function
  // addGapsBetweenClips(${gap});`;
  //   };

  // const handleExecuteScript = async () => {
  //   const scripPath = path.join(__dirname, `${uuidv4()}.js`);
  //   fs.writeFileSync(scripPath, scriptString(gap), 'utf-8');
  //   const data = fs.readFileSync(scripPath, 'utf-8');
  //   await evalES(data, true);
  //   fs.unlinkSync(scripPath);
  // };

  $: console.log('template', projectSettingsTemplate);

  const handleGetProjectSettings = async () => {
    const projectFile = await evalES('getProjectFile()');
    const template = await getProjectSettingsTemplate(projectFile);
    const colorSettings = await evalES('getProjectSettings()');

    if (template) {
      projectSettingsTemplate = template;
    }
    if (colorSettings) {
      projectColorSettings = JSON.parse(colorSettings);
    }
  };

  const handleSetProjectSettings = async () => {
    const projectFile = await evalES('getProjectFile()');
    const template = await setProjectSettingsTemplate(
      projectFile,
      projectSettingsTemplate
    );
    console.log('template', template);
  };

  const handleLoadProjectSettings = async () => {
    const projectSettings = await evalES('getProjectSettings()');

    console.log(projectSettings);
  };

  const handleApplyProjectSettings = async () => {
    const projectSettings = await evalES(
      `setProjectSettings(${JSON.stringify(projectSettingsTemplate)})`
    );
    console.log(projectSettings);
  };

  const getClass = (property: keyof ProjectSettings) => {
    return projectColorSettings[property] === projectSettingsTemplate[property]
      ? 'setting-row success'
      : 'setting-row error';
  };
</script>

<div
  style="display:flex; flex-direction:row; text-align:center; align-items:center; gap:4px justify-content:flex-end"
>
  <button class="active" on:click={handleGetProjectSettings}
    >Get Project Settings Template</button
  >
  <button class="active" on:click={handleSetProjectSettings}
    >Set Project Settings Template</button
  >
</div>
<div
  style="display:flex; flex-direction:row; text-align:center; align-items:center; gap:4px justify-content:flex-end"
>
  <button class="active" on:click={handleLoadProjectSettings}
    >Load AE Project Settings</button
  >
  <button class="active" on:click={handleApplyProjectSettings}
    >Apply Project Settings</button
  >
</div>
<div style="display:flex; flex-direction:column; gap:4px; margin-top:4px">
  <div id="color-management-grid" class="header-row">
    <div>Setting Name</div>
    <div>Project Settings</div>
    <div>Template settings</div>
    <div>Sync</div>
  </div>
  {#if projectColorSettings && projectSettingsTemplate}
    <div class={getClass('bitsPerChannel')}>
      <div>Bits Per Channel</div>
      <div>{projectColorSettings?.bitsPerChannel}</div>
      <div>{projectSettingsTemplate?.bitsPerChannel}</div>
      <Blend
        color={getClass('bitsPerChannel') === 'setting-row success'
          ? '#3caea3'
          : '#ed553b'}
      />
    </div>
    <div class={getClass('workingSpace')}>
      <div>Working Color Space</div>
      <div>{projectColorSettings?.workingSpace}</div>
      <div>{projectSettingsTemplate?.workingSpace}</div>
      <Blend
        color={getClass('workingSpace') === 'setting-row success'
          ? '#3caea3'
          : '#ed553b'}
      />
    </div>
    <div class={getClass('workingGamma')}>
      <div>Working Gamma</div>
      <div>{projectColorSettings?.workingGamma}</div>
      <div>{projectSettingsTemplate?.workingGamma}</div>
      <Blend
        color={getClass('workingGamma') === 'setting-row success'
          ? '#3caea3'
          : '#ed553b'}
      />
    </div>
    <div class={getClass('compensateForSceneReferredProfiles')}>
      <div>Compensate For Scene Referred Profiles</div>
      <div>{projectColorSettings?.compensateForSceneReferredProfiles}</div>
      <div>{projectSettingsTemplate?.compensateForSceneReferredProfiles}</div>
      <Blend
        color={getClass('compensateForSceneReferredProfiles') ===
        'setting-row success'
          ? '#3caea3'
          : '#ed553b'}
      />
    </div>
    <div class={getClass('linearizeWorkingSpace')}>
      <div>Linearize Working Space</div>
      <div>{projectColorSettings?.linearizeWorkingSpace}</div>
      <div>{projectSettingsTemplate?.linearizeWorkingSpace}</div>
      <Blend
        color={getClass('linearizeWorkingSpace') === 'setting-row success'
          ? '#3caea3'
          : '#ed553b'}
      />
    </div>
    <div class={getClass('linearBlending')}>
      <div>Blend Colors</div>
      <div>{projectColorSettings?.linearBlending}</div>
      <div>{projectSettingsTemplate?.linearBlending}</div>
      <Blend
        color={getClass('linearBlending') === 'setting-row success'
          ? '#3caea3'
          : '#ed553b'}
      />
    </div>
  {/if}
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  #color-management-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 20px;
    gap: 4px;
    width: 100%;
  }

  .setting-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 26px;
    gap: 4px;
    width: 100%;
    align-items: center;
  }

  .header-row {
    background-color: $extra-dark;
    align-items: center;
  }
</style>
