<script lang="ts">
  import { ArrowLeftRight } from "lucide-svelte";
  import { evalES } from "../../lib/utils/bolt";
  let find = "";
  let replace = "";

  const handleFindAndReplace = async () => {
    const options = {
      scope: "project",
      from: find,
      to: replace,
    };
    console.log(options);
    let prevReplace = replace;
    await evalES(`findAndReplace(${JSON.stringify(options)})`).then((res) => {
      replace = find;
      find = prevReplace;
    });
  };
</script>

<div style="display:flex; flex-direction:row">
  <div class="row">
    <input type="text" placeholder="Find" bind:value={find} />
    <button on:click={handleFindAndReplace}>
      <ArrowLeftRight size="16" />
    </button>
    <input type="text" placeholder="Replace" bind:value={replace} />
  </div>
</div>

<style lang="scss">
  .row {
    width: 100%;
  }

  input {
    width: 100%;
  }
  button {
    width: 32px;
  }
</style>
