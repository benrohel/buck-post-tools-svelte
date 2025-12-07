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
  import { appStore } from '@/stores/app-store';
  import ButtonGroup from '@/components/ButtonGroup/ButtonGroup.svelte';

  import { type RenameContext, renameContextKey} from './RenameContext';

  const renameContext = getContext('rename') as RenameContext;

  const renameModes = [
    { value: 'replace', label: 'Find and Replace', component: FindAndReplace },
    {
      value: 'prefix',
      label: 'Add Prefix or Suffix',
      component: PrefixSuffix,
    },
    {
      value: 'sequential',
      label: 'Sequential Rename',
      component: SequentialRename,
    },
    {
      value: 'versionUp',
      label: 'Version Up',
      component: VersionUp,
    },
    {
      value: 'revert',
      label: 'Revert to filename',
      component: RevertToFilename,
    },
    {
      value: 'relink',
      label: 'Rename and Relink --project items only',
      component: ReplaceAndRelink,
    },
  ];

  let selectedMode: any = renameModes[0];
  const handleOnMenuChange = (value: any) => (selectedMode = value);

  const handleScopeChange = (item: any) => {
    renameContext.getScope = item.value;
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
