<script lang="ts">
  import { showTooltips } from '../../stores/local-storage';
  import Toggle from '../../components/Toggle/Toggle.svelte';

  const handleChange = (value: boolean) => {
    showTooltips.set(value);
  };
</script>

<div class="container">
  <div
    style="display:flex; flex-direction:row; align-items:center; justify-content:center;"
  >
    <h2>Settings</h2>
  </div>

  <div class="flex-row-start">
    <Toggle
      label="Show tooltips"
      checked={$showTooltips}
      id="show-tooltips"
      onChange={handleChange}
    />
  </div>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  .container {
    padding: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 300px;
    max-width: 400px;
  }

  .setting {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    padding: 8px 16px;
  }

  h2 {
    color: $font;
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 18px;
    text-align: center;
  }

  .select-label {
    color: $font;
    font-size: small;
    margin: 0;
  }
</style>
