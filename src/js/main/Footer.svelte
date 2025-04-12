<script lang="ts">
  import { Server, RefreshCw, Settings } from 'lucide-svelte';
  import { buck5Server } from '../stores/server-store';
  import pkg from '../../../package.json';
  import buckLogo from '../assets/BUCK_ICON_WHITE.svg';

  import SettingsContainer from './Settings/SettingsContainer.svelte';
  import ModalSettings from '../components/Modal/ModalSettings.svelte';

  export let authenticated: boolean = false;
  $: showSettings = false;

  const refreshPage = () => {
    window.location.reload();
  };

  const onClose = () => {
    console.log('Settings modal closed');
    showSettings = false;
  };
</script>

<div class="footer">
  <div style="display:flex; flex-direction:row; align-items:center; gap:4px">
    <div
      style={authenticated
        ? 'opacity:1;width:16px; height:16px;'
        : 'opacity:0.3;width:16px; height:16px'}
    >
      <img src={buckLogo} alt="Buck5 Logo" />
    </div>
    <div style={$buck5Server ? 'color:green' : 'color:red;'}>
      <Server strokeWidth={4} />
    </div>
  </div>
  <div id="buck-version" style="font-size:10px">BUCK 2025 {pkg.version}</div>
  <div style="display:flex; flex-direction:row; align-items:center; gap:4px">
    <button
      class="icon"
      style="margin-right:8px; cursor:pointer; background-color:transparent"
      on:click={() => (showSettings = !showSettings)}
    >
      <Settings color="white" />
    </button>
    <button
      class="icon"
      style="margin-right:8px; cursor:pointer; background-color:transparent"
      on:click={refreshPage}
    >
      <RefreshCw color="white" />
    </button>
  </div>
  {#if showSettings}
    <ModalSettings {onClose}>
      <SettingsContainer />
    </ModalSettings>
  {/if}
</div>

<style lang="scss">
  @use '../../js/variables.scss' as *;
  .footer {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    height: 20px;
    align-items: center;
    font-size: 10px;
    position: absolute;
    margin-bottom: 4px;
    bottom: 2px;
  }

  #buck-version {
    color: $font;
    opacity: 0.75;
  }
</style>
