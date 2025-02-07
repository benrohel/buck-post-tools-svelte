<script lang="ts">
  import { Settings } from 'svelte-lucide';

  const handleClick = () => {};
</script>

<div class="footer">
  <button class="icon active" on:click={handleClick}>
    <Settings />
  </button>
</div>

<style lang="scss">
  @import '../../variables.scss';
  div {
    color: $darker;
  }
  .footer {
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    justify-self: flex-end;
    height: 24px;
    background-color: $darker;
    color: $font;
    width: 100%;
  }
</style>
