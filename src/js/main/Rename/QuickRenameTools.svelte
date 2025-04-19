<script lang="ts">
  import { evalES } from '../../lib/utils/bolt';
  import { Tooltip } from '@svelte-plugins/tooltips';
  import { ArrowUp10, Undo2 } from 'lucide-svelte';

  const handleRevertToFilename = async () => {
    await evalES('renameToFile()');
  };
  const handleVersionUpComps = async () => {
    await evalES('versionUpNames()');
  };
</script>

<div class="dynamic-grid">
  <div class="flex-row-start action-row">
    <Tooltip action="hover" content="Version Up" position="right" delay={1000}>
      <button class="active big" on:click={handleVersionUpComps}
        ><ArrowUp10 size={16} strokeWidth={1} /></button
      >
    </Tooltip>
  </div>
  <div class="flex-row-start action-row">
    <Tooltip
      action="hover"
      content="Revert To Filename"
      position="right"
      delay={1000}
    >
      <button class="active big" on:click={handleRevertToFilename}
        ><Undo2 size={16} strokeWidth={1} /></button
      >
    </Tooltip>
  </div>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;
  .lucide {
    height: 16px;
    stroke-width: 16px;
  }

  .dynamic-grid {
    margin-top: 2px;
    display: flex;
    flex-direction: row;
    gap: 2px;
    // display: grid;
    // grid-template-rows: 40px;
    // grid-auto-rows: 40px;
    // grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    // gap: 10px;
  }
</style>
