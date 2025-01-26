<script lang="ts">
  import { Recycle } from 'svelte-lucide';

  const refreshPage = () => {
    window.location.reload();
  };
</script>

<div class="footer">
  <div style="margin-left:8px">©BUCK 2025</div>
  <div style="display:flex; flex-direction:row; align-items:center">
    <!-- <div style="margin-right:8px;">
      <Icon name="buck-logo" size="12" />
    </div> -->
    <button
      class="icon"
      style="margin-right:8px; cursor:pointer"
      on:click={refreshPage}
      on:keydown={refreshPage}
    >
      <Recycle />
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
