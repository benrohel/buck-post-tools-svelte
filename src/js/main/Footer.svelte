<script lang="ts">
  import { Recycle } from "svelte-lucide";
  import { Server, RefreshCw } from "lucide-svelte";
  import { buck5Server } from "../stores/server-store";
  import aquariumLogo from "../assets/aquarium-logo.svg";
  import buckLogo from "../assets/BUCK_ICON_WHITE.svg";
  export let authenticated: boolean = false;
  const refreshPage = () => {
    window.location.reload();
  };
</script>

<div class="footer">
  <div style="display:flex; flex-direction:row; align-items:center; gap:4px">
    <div style={authenticated ? "opacity:1" : "opacity:0.3"}>
      <img src={buckLogo} style="width:14px; height:14px" alt="Buck5 Logo" />
    </div>
    <div style={$buck5Server ? "opacity:1" : "opacity:0.3;"}>
      <Server />
    </div>
  </div>
  <div id="buck-version" style="font-size:10px">BUCK 2025 v1.0.0-beta</div>
  <button
    class="icon"
    style="margin-right:8px; cursor:pointer; background-color:transparent"
    on:click={refreshPage}
  >
    <RefreshCw />
  </button>
</div>

<style lang="scss">
  @use "../../js/variables.scss" as *;
  .footer {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    height: 12px;
    align-items: center;
    font-size: 10px;
    position: absolute;
    margin-bottom: 2px;
    bottom: 0;
  }

  #buck-version {
    color: $font;
    opacity: 0.75;
  }
</style>
