<script lang="ts">
  import { Plus } from 'lucide-svelte';
  import BookMarkCard from '@/components/ClipCard/BookMarkCard.svelte';
  import SelectFolderWeb from '@/components/SelectFolder/SelectFolderWeb.svelte';
  import ButtonGroup from '@/components/ButtonGroup/ButtonGroup.svelte';
  import { createBookmarkStore } from '@/stores/bookmark-store';
  import { PROJECT_ROOT } from '@/api/files/files';
  import { evalES } from '@/lib/utils/bolt';
  import type { Option } from '@/types/models';

  const bookmarks = createBookmarkStore('bookmarks');
  let newName = '';
  let newPath = '';

  $: folderType = 'relative';
  const setPath = (path: string) => {
    newPath = path;
    newName = path.split('/').pop() ?? '';
  };

  const addBookmark = async () => {
    let savePath = newPath;
    if (folderType === 'relative') {
      const projectFile = await evalES(`getProjectFile()`, false);
      const projectRoot = projectFile ? PROJECT_ROOT(projectFile) : null;
      if (projectRoot && newPath.includes(projectRoot)) {
        savePath = newPath.slice(projectRoot.length);
      }
    }
    $bookmarks = [
      ...$bookmarks,
      { name: newName, path: savePath, isRelative: folderType === 'relative' },
    ];
    newName = '';
    newPath = '';
  };

  const removeBookmark = (index: number) => {
    $bookmarks = $bookmarks.filter((_, i) => i !== index);
  };

  const handleOnButtonGroupChange = (item: Option<string>) => {
    folderType = item.value;
  };
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
