<script lang="ts">
  // import { loggedIn } from '../stores/aquarium-store';
  import { onMount } from 'svelte';
  import { getAuthAuthenticated, client } from 'buck-client';
  import { Recycle } from 'svelte-lucide';
  import { connectToDaemon } from './backend';
  import { Authenticated } from '../api/buck5/buck5-api';

  export let authenticated: boolean = false;
  const refreshPage = () => {
    window.location.reload();
  };

  onMount(async () => {});
</script>

<div class="footer">
  <div style="margin-left:8px">©BUCK 2025</div>
  <div style="display:flex; flex-direction:row; align-items:center">
    <button
      class="icon"
      style="margin-right:8px; cursor:pointer; background-color:transparent"
      on:click={refreshPage}
    >
      <Recycle color={authenticated ? 'green' : 'red'} />
    </button>
  </div>
</div>

<style lang="scss">
  @import '../../js/variables.scss';
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
    margin-bottom: 2px;
    bottom: 0;
  }
</style>
