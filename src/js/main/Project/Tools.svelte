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
  let gap = 2;

  let projectSettingsTemplate: ProjectSettings | null = null;

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

    if (template) {
      projectSettingsTemplate = template;
    }
  };

  const handleSetProjectSettings = async () => {
    const projectFile = await evalES('getProjectFile()');
    const template = await setProjectSettingsTemplate(
      projectFile,
      projectSettingsTemplate,
    );
    console.log('template', template);
  };

  const handleLoadProjectSettings = async () => {
    const projectSettings = await evalES('getProjectSettings()');

    console.log(projectSettings);
  };

  const handleApplyProjectSettings = async () => {
    const projectSettings = await evalES(
      `setProjectSettings(${JSON.stringify(projectSettingsTemplate)})`,
    );
    console.log(projectSettings);
  };
</script>

<div style="display:flex; flex-direction:row; text-align:center">Tools</div>
<!-- <div class="flex-row-end">
  <button class="active" on:click={handleExecuteScript}>Execute Script</button>
</div> -->

<div>
  <button class="active" on:click={handleGetProjectSettings}
    >Get Project Settings Template</button
  >
  <button class="active" on:click={handleSetProjectSettings}
    >Set Project Settings Template</button
  >
</div>
<div>
  <button class="active" on:click={handleLoadProjectSettings}
    >Load AE Project Settings</button
  >
  <button class="active" on:click={handleApplyProjectSettings}
    >Apply Project Settings</button
  >
</div>

<style lang="scss">
</style>
