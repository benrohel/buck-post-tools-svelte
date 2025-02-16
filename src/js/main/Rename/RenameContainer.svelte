<script lang="ts">
  import { onMount, getContext } from "svelte";
  import FindAndReplace from "./FindAndReplace.svelte";
  import PrefixSuffix from "./PrefixAndSuffix.svelte";
  import SequentialRename from "./SequentialRename.svelte";
  import RevertToFilename from "./RevertToFilename.svelte";
  import ReplaceAndRelink from "./ReplaceAndRelink.svelte";

  import Dropdown from "../../components/Dropdown/Dropdown.svelte";
  import DropdownItem from "../../components/Dropdown/DropdownItem.svelte";

  const appId = getContext("appId");

  const renameModes = [
    { value: "replace", label: "Find and Replace", component: FindAndReplace },
    {
      value: "prefix",
      label: "Add Prefix or Suffix",
      component: PrefixSuffix,
    },
    {
      value: "sequential",
      label: "Sequential Rename",
      component: SequentialRename,
    },
    {
      value: "revert",
      label: "Revert to filename",
      component: RevertToFilename,
    },
    {
      value: "relink",
      label: "Rename and Relink",
      component: ReplaceAndRelink,
    },
  ];

  let selectedMode: any = "";

  $: mode = renameModes.find((m) => m.value === selectedMode) ?? renameModes[0];

  const handleRenameMode = (s: any) => {
    selectedMode = s;
  };

  onMount(async () => {
    selectedMode = renameModes[0];
  });
</script>

<div class="flex-row-end">
  <Dropdown
    placeholder={mode.label ?? "Select Tool"}
    onSelected={handleRenameMode}
  >
    {#each renameModes as mode, id}
      <DropdownItem value={mode.value}>
        {mode.label}
      </DropdownItem>
    {/each}
  </Dropdown>
</div>

<svelte:component this={mode.component} />

<style lang="scss">
</style>
