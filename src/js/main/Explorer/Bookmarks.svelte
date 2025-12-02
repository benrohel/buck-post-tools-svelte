<script lang="ts">
  import { onMount } from 'svelte';
  import BookMarkCard from '../../components/ClipCard/BookMarkCard.svelte';
  import { createBookmarkStore } from '../../stores/bookmark-store';
  import { Plus } from 'lucide-svelte';
  import SelectFolderWeb from '../../components/SelectFolder/SelectFolderWeb.svelte';
  import ButtonGroup from '../../components/ButtonGroup/ButtonGroup.svelte';
  const bookmarks = createBookmarkStore('bookmarks');

  let newName = '';
  let newPath = '';
  $: folderType = 'relative';

  function setPath(path: string) {
    newPath = path;
    newName = path.split('/').pop() ?? '';
  }

  function addBookmark() {
    $bookmarks = [
      ...$bookmarks,
      { name: newName, path: newPath, isRelative: folderType === 'relative' },
    ];
    newName = '';
    newPath = '';
  }

  function removeBookmark(index: number) {
    $bookmarks = $bookmarks.filter((_, i) => i !== index);
  }

  function handleOnButtonGroupChange(item: any) {
    folderType = item.value;
  }

</script>

<div style="display:flex; flex-direction:column; gap:8px">
  <div style="display:flex; flex-direction:row; align-items:center; gap:4px">
    <SelectFolderWeb
      onChange={setPath}
      bind:value={newPath}
      label="Choose New bookmark"
    />
  </div>
  <div style="display:flex; flex-direction:row; align-items:center; gap:8px">
    <input bind:value={newName} placeholder="Name" />

    <ButtonGroup
      items={[
        { label: 'Relative', value: 'relative' },
        { label: 'Absolute', value: 'absolute' },
      ]}
      onSelectionChange={handleOnButtonGroupChange}
    />
    <button class="icon active" on:click={addBookmark}>
      <Plus />
    </button>
  </div>
  <div class="bookmark-list">
    {#each $bookmarks as bookmark, index}
      <BookMarkCard {bookmark} onRemove={() => removeBookmark(index)} />
    {/each}
  </div>
</div>

<style lang="scss">
  .bookmark-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
</style>
