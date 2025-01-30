<script lang="ts">
  import { onMount } from 'svelte';
  import { evalFile, evalES } from '../../lib/utils/bolt';
  import { fs } from '../../lib/cep/node';
  import { v4 as uuidv4 } from 'uuid';
  import path from 'path';

  let gap = 2;

  const scriptString = (gap: number) => {
    return `// Add gaps between clips in the current timeline and fill with text of the next clip
function addGapsBetweenClips(gap) {
  app.enableQE();
  const newSeq = app.project.activeSequence;

  for (var t = 0; newSeq.videoTracks.numTracks; t++) {
    var currentTrack = newSeq.videoTracks[t];

    var numberOfClips = currentTrack.clips.numItems;
    var clips = currentTrack.clips;

    for (var c = numberOfClips - 1; c > 0; c--) {
      var newInTime = new Time();
      alert(String(newInTime.seconds));
      newInTime.seconds = gap * c;

      clips[c].move(newInTime);
    }
  }
  alert('Gaps added between clips.');
}

// Run the function
addGapsBetweenClips(${gap});`;
  };

  const handleExecuteScript = async () => {
    const scripPath = path.join(__dirname, `${uuidv4()}.js`);
    fs.writeFileSync(scripPath, scriptString(gap), 'utf-8');
    const data = fs.readFileSync(scripPath, 'utf-8');
    await evalES(data, true);
    fs.unlinkSync(scripPath);
  };
</script>

<div style="display:flex; flex-direction:row; text-align:center">Tools</div>
<div class="flex-row-end">
  <button class="active" on:click={handleExecuteScript}>Execute Script</button>
</div>

<style lang="scss">
</style>
