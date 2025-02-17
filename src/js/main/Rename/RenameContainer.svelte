<script lang="ts">
  import { getContext } from "svelte";
  import FindAndReplace from "./FindAndReplace.svelte";
  import PrefixSuffix from "./PrefixAndSuffix.svelte";
  import SequentialRename from "./SequentialRename.svelte";
  import RevertToFilename from "./RevertToFilename.svelte";
  import ReplaceAndRelink from "./ReplaceAndRelink.svelte";

  import MenuSelect from "../../components/MultiSelect/MenuSelect.svelte";

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

  let selectedMode: any = renameModes[0];
  const handleOnMenuChange = (value: any) => (selectedMode = value);
</script>

<MenuSelect
  items={renameModes}
  bind:value={selectedMode}
  onChange={handleOnMenuChange}
/>

<svelte:component this={selectedMode.component} />
