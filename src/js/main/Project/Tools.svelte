<script lang="ts">
  import { onMount } from 'svelte';
  import { v4 as uuidv4 } from 'uuid';
  import path from 'path';
  import { evalFile, evalES } from '@/lib/utils/bolt';
  import { fs } from '@/lib/cep/node';
  import { addGapsBetweenClips } from '@/api/scripts/tools-scripts';

  let gap = 2;

  const handleExecuteScript = async () => {
    const scripPath = path.join(__dirname, `${uuidv4()}.js`);
    fs.writeFileSync(scripPath, addGapsBetweenClips(gap), 'utf-8');
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
