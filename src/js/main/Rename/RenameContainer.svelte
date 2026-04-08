<script lang="ts">
  import { getContext, setContext, onMount } from 'svelte';

  import FindAndReplace from './FindAndReplace.svelte';
  import PrefixSuffix from './PrefixAndSuffix.svelte';
  import SequentialRename from './SequentialRename.svelte';
  import RevertToFilename from './RevertToFilename.svelte';
  import ReplaceAndRelink from './ReplaceAndRelink.svelte';
  import VersionUp from './VersionUp.svelte';
  import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';
  import QuickRenameTools from './QuickRenameTools.svelte';
  import ButtonGroup from '@/components/ButtonGroup/ButtonGroup.svelte';

  import { appStore } from '@/stores/app-store';

  import { type RenameContext, renameContextKey } from './RenameContext';

  import type { RenameScope } from './RenameContext';

  import type { SelectToolItem, Option } from '@/types/models';

  const renameContext = getContext('rename') as RenameContext;

  const renameModes: SelectToolItem[] = [
    {
      value: 'replace',
      label: 'Find and Replace',
      component: FindAndReplace,
      apps: ['AEFT', 'PPRO'],
    },
    {
      value: 'prefix',
      label: 'Add Prefix or Suffix',
      component: PrefixSuffix,
      apps: ['AEFT', 'PPRO'],
    },
    {
      value: 'sequential',
      label: 'Sequential Rename',
      component: SequentialRename,
      apps: ['AEFT', 'PPRO'],
    },
    {
      value: 'versionUp',
      label: 'Version Up',
      component: VersionUp,
      apps: ['AEFT', 'PPRO'],
    },
    {
      value: 'revert',
      label: 'Revert to filename',
      component: RevertToFilename,
      apps: ['AEFT', 'PPRO'],
    },
    {
      value: 'relink',
      label: 'Rename and Relink --project items only',
      component: ReplaceAndRelink,
      apps: ['AEFT', 'PPRO'],
    },
  ];

  let selectedMode: SelectToolItem = renameModes[0];

  const handleOnMenuChange = (value: Option<any> | null) => {
    if (!value) {
      return;
    }
    selectedMode =
      renameModes.find((mode) => mode.value === value.value) ?? renameModes[0];
  };

  const handleScopeChange = (item: Option<string>) => {
    if (item.value === 'project' || item.value === 'timeline') {
      renameContext.setScope(item.value as RenameScope);
    }
  };

  onMount(() => {});
</script>

<div>
  <MenuSelect
    items={renameModes}
    bind:value={selectedMode}
    onChange={handleOnMenuChange}
  />

  <div class="scope-selector">
    {#if selectedMode.value !== 'relink'}
      <p>Scope:</p>
      <ButtonGroup
        items={[
          { value: 'project', label: 'Project' },
          {
            value: 'timeline',
            label: $appStore.appId === 'AEFT' ? 'Composition' : 'Sequence',
          },
        ]}
        onSelectionChange={handleScopeChange}
      />
    {/if}
  </div>

  <svelte:component this={selectedMode.component} />
</div>

<style lang="scss">
  .scope-selector {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: flex-start;
  }

  .scope-selector-item {
    display: flex;
    direction: row;
    gap: 10px;
    align-items: center;
  }
</style>
