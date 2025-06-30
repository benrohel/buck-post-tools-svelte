<script lang="ts">
  import ButtonGroup from '../../components/ButtonGroup/ButtonGroup.svelte';
  import { evalES } from '../../lib/utils/bolt';
  import { notifications } from '../../stores/notifications-store';
  import { appId } from '../../lib/utils/cep';

  let scope = '';

  $: console.log(scope);
  const handleRevertToFilename = async () => {
    await evalES(`revertToFilename("${scope}")`);
  };

  const handleScopeChange = (item: any) => {
    scope = item.value;
  };
</script>

<div>
  {#if appId === 'AEFT'}
    <div class="flex-row-start setting-row">
      <h4>Scope:</h4>
      <ButtonGroup
        items={[
          { value: 'project', label: 'Project' },
          {
            value: 'composition',
            label: appId === 'AEFT' ? 'Composition' : 'Sequence',
          },
        ]}
        onSelectionChange={handleScopeChange}
      />
    </div>
  {/if}

  <div class="flex-row-end action-row">
    <button class="active" on:click={handleRevertToFilename}
      >Revert To Filename</button
    >
  </div>
</div>
