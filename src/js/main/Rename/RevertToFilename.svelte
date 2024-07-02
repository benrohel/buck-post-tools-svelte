<script lang="ts">
  import { onMount } from "svelte";
  import { ArrowLeftRight } from "lucide-svelte";
  import { evalES } from "../../lib/utils/bolt";
  import Button from "../../components/Button/Button.svelte";

  const handleRevertToFilename = async () => {
    await evalES("renameToFile()");
  };
</script>

<div class="row">
  <button class="active" on:click={handleRevertToFilename}
    >Revert To Filename</button
  >
</div>

<style lang="scss">
  .row {
    width: 100%;
    margin-right: 4px;
  }
</style>
