<script lang="ts">
  import { evalES } from "../../lib/utils/bolt";

  const testEval = async () => {
    let res = await evalES(`collectSequenceClips()`, false);
    console.log(res);
  };
</script>

<div>
  This is Project tab

  <button on:click={testEval}> TEST</button>
</div>
