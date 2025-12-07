# Components with Mixed Function Declaration Patterns

**Date:** 2025-12-07
**Purpose:** Manual standardization to `const` + arrow functions

---

## Components with MIXED Patterns (Priority)

These components have BOTH `function` declarations AND `const` arrow functions - they need standardization:

### Main/Export (5 files)
1. **[ExportSequenceCSV.svelte](../src/js/main/Export/ExportSequenceCSV.svelte)**
   - Has: `function setRootFolder()` (line 33)
   - Has: `const handleSequenceNameChange`, `const exportCsv`, `const handleSubmitExport`
   - **Action:** Convert `setRootFolder` to `const setRootFolder = ()`

2. **[ExportPathBuilder.svelte](../src/js/main/Export/ExportPathBuilder.svelte)** ⚠️ COMPLEX
   - Has: 27+ `function` declarations (lines 184-815)
   - Has: Multiple `const` arrow functions
   - **Action:** Convert all 27 functions to `const` + arrow functions
   - **Note:** Large file (900+ lines), many helper functions

3. **[ExportStills.svelte](../src/js/main/Export/ExportStills.svelte)**
   - Has: `function setOutputFolder()` (line 35)
   - Has: `const handleOpenFolder`, `const handleMarkerChange`, `const handleExportMode`, `const handleSubmitExport`
   - **Action:** Convert `setRootFolder` to `const setRootFolder = ()`

### Main/Explorer (2 files)
4. **[ShotExplorer.svelte](../src/js/main/Export/ShotExplorer.svelte)** ⚠️ COMPLEX
   - Has: 9 `function` declarations (lines 159-359)
   - Has: Multiple `const` arrow functions
   - **Action:** Convert all 9 functions to `const` + arrow
   - Functions: `applyStoredFilterSettings`, `filterByExtension`, `filterNodeRecursively`, `clearFilters`, `handleOpenFile`, `handleImportFile`, `handleImportFiles`, `handleSelectionChange`, `getAllFilesFromTree`

5. **[Bookmarks.svelte](../src/js/main/Explorer/Bookmarks.svelte)**
   - Has: 4 `function` declarations (lines 13-31)
   - Has: Some `const` arrow functions
   - **Action:** Convert all 4 functions to `const` + arrow
   - Functions: `setPath`, `addBookmark`, `removeBookmark`, `handleOnButtonGroupChange`

### Main/Ingest (1 file)
6. **[TreeNode.svelte](../src/js/main/Ingest/TreeNode.svelte)** ⚠️ COMPLEX
   - Has: 3 `function` declarations (lines 83-183)
   - Has: Multiple `const` arrow functions
   - **Action:** Convert all 3 functions to `const` + arrow
   - Functions: `buildFileTree`, `navigateToPath`, `handleBreadcrumbClick`, `handleDirectoryClick`

### Main/Project (2 files)
7. **[AspectRatios.svelte](../src/js/main/Project/AspectRatios.svelte)**
   - Has: 4 `function` declarations (lines 140-161)
   - Has: Multiple `const` arrow functions
   - **Action:** Convert all 4 functions to `const` + arrow
   - Functions: `clearSelectedPreset`, `handlePresetFilter`, `getSelectedPresets`, `getItemWidth`

8. **[Tools.svelte](../src/js/main/Project/Tools.svelte)**
   - Has: `function addGapsBetweenClips()` (line 12) ⚠️ NO `const` prefix!
   - **Action:** Add `const` + convert to arrow function
   - **Note:** This one is missing `const` entirely!

### Components/ClipCard (1 file)
9. **[BookMarkCard.svelte](../src/js/components/ClipCard/BookMarkCard.svelte)** ⚠️ COMPLEX
   - Has: 4 `function` declarations (lines 92-215)
   - Has: Multiple `const` arrow functions
   - **Action:** Convert all 4 functions to `const` + arrow
   - Functions: `handleRemove`, `handleOpenFileFromBrowser`, `findNodeById`, `handleRevealFile`

### Components/InputWithTokens (1 file)
10. **[InputWithTokens.svelte](../src/js/components/InputWithTokens/InputWithTokens.svelte)**
    - Has: 3 `function` declarations (lines 45-74)
    - Has: Multiple `const` arrow functions
    - **Action:** Convert all 3 functions to `const` + arrow
    - Functions: `addToken`, `removeToken`, `handleSuggestionClick`

### Components/MultiSelect (1 file)
11. **[MultiSelect.svelte](../src/js/components/MultiSelect/MultiSelect.svelte)**
    - Has: 3 `function` declarations (lines 41-61)
    - Has: Multiple `const` arrow functions
    - **Action:** Convert all 3 functions to `const` + arrow
    - Functions: `toggleSelect`, `getFilteredOptions`, `showCheckboxes`

### Components/Toggle (1 file)
12. **[Toggle.svelte](../src/js/components/Toggle/Toggle.svelte)**
    - Has: `function handleChange()` (line 10)
    - Has: No other functions
    - **Action:** Convert to `const handleChange = ()`

### Components/FileBrowser (1 file)
13. **[FileBrowser.svelte](../src/js/components/FileBrowser/FileBrowser.svelte)** ⚠️ VERY COMPLEX
    - Has: 18 `function` declarations (lines 59-349)
    - Has: Multiple `const` arrow functions
    - **Action:** Convert all 18 functions to `const` + arrow
    - Functions: `filterByExtension`, `filterNodeRecursively`, `handleItemClick`, `handleContainerClick`, `flattenTree`, `findNodeById`, `buildPath`, `updateNodeInTree`, `toggleExpand`, `handleSequenceToggle`, `fileExistsInProject`, `handleOpenFile`, `handleRevealFile`, `handleImportFile`, `handleDoubleClick`, `handleImportSelected`, `findNodesByType`

### Components/Tooltip (1 file)
14. **[Tooltip.svelte](../src/js/components/Tooltip/Tooltip.svelte)**
    - Has: 4 `function` declarations (lines 24-128)
    - Has: Some `const` arrow functions
    - **Action:** Convert all 4 functions to `const` + arrow
    - Functions: `calculatePosition`, `mouseOver`, `mouseMove`, `mouseLeave`

### Components/ChatInput (1 file)
15. **[ChatInput.svelte](../src/js/components/ChatInput/ChatInput.svelte)**
    - Has: 4 `function` declarations (lines 16-36)
    - Has: No other functions
    - **Action:** Convert all 4 functions to `const` + arrow
    - Functions: `adjustTextareaHeight`, `handleInput`, `handleKeydown`, `submitMessage`

---

## Summary Statistics

**Total Components with Mixed Patterns:** 15 files

**By Complexity:**
- ⚠️ **Very Complex** (100+ lines, 15+ functions): 1 file
  - FileBrowser.svelte (18 functions)

- ⚠️ **Complex** (50+ lines, 5+ functions): 4 files
  - ExportPathBuilder.svelte (27 functions)
  - ShotExplorer.svelte (9 functions)
  - TreeNode.svelte (3 functions)
  - BookMarkCard.svelte (4 functions)

- **Medium** (20-50 lines, 3-5 functions): 5 files
  - Bookmarks.svelte (4 functions)
  - AspectRatios.svelte (4 functions)
  - InputWithTokens.svelte (3 functions)
  - MultiSelect.svelte (3 functions)
  - Tooltip.svelte (4 functions)
  - ChatInput.svelte (4 functions)

- **Simple** (1-2 functions): 5 files
  - ExportSequenceCSV.svelte (1 function)
  - ExportStills.svelte (1 function)
  - Toggle.svelte (1 function)
  - Tools.svelte (1 function - missing `const`!)

---

## Recommended Order for Manual Work

### Phase 1: Quick Wins (5 files, ~10 minutes)
Start with simple files that have only 1-2 function conversions:

1. ✅ ~~ExportSequenceXML.svelte~~ (Already done by user)
2. **Toggle.svelte** - 1 function
3. **ExportSequenceCSV.svelte** - 1 function
4. **ExportStills.svelte** - 1 function
5. **Tools.svelte** - 1 function (needs `const` prefix!)

### Phase 2: Medium Components (6 files, ~30 minutes)
Files with 3-4 functions:

6. **MultiSelect.svelte** - 3 functions
7. **InputWithTokens.svelte** - 3 functions
8. **ChatInput.svelte** - 4 functions
9. **Bookmarks.svelte** - 4 functions
10. **AspectRatios.svelte** - 4 functions
11. **Tooltip.svelte** - 4 functions

### Phase 3: Complex Components (4 files, ~60 minutes)
Larger files with more functions, needs careful review:

12. **BookMarkCard.svelte** - 4 functions (complex logic)
13. **TreeNode.svelte** - 4 functions (file tree navigation)
14. **ShotExplorer.svelte** - 9 functions (filtering, file handling)
15. **ExportPathBuilder.svelte** - 27 functions (path building, tree operations)

### Phase 4: Very Complex (1 file, ~30 minutes)
The most complex component:

16. **FileBrowser.svelte** - 18 functions (tree operations, file handling, selection)

---

## Conversion Pattern

For each function, convert from:

```typescript
function handleClick() {
  // code
}
```

To:

```typescript
const handleClick = () => {
  // code
};
```

For async functions:

```typescript
function handleSubmit() {
  // code
}
```

To:

```typescript
const handleSubmit = async () => {
  // code
};
```

---

## Important Notes

1. **Tools.svelte** (line 12): Function is missing `const` entirely! Currently: `function addGapsBetweenClips(gap) {`

2. **Nested functions**: If you find a function inside another function, you can keep it as `function` declaration (for local helper functions)

3. **After each file**:
   - Save the file
   - Check for TypeScript errors in IDE
   - Quick visual check

4. **After each phase**:
   - Run `bun run build` to verify no errors
   - Commit changes: `git commit -m "Convert function declarations to const arrow functions (Phase N)"`

---

## Tracking Progress

Mark files as complete by adding ✅ next to them in the list above.

**Estimated Total Time:** ~2 hours for all 15 files
