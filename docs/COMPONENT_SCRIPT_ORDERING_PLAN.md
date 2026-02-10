# Component Script Ordering Standardization Plan

**Status:** Ready for implementation
**Date:** 2025-12-07
**Components to standardize:** 68 Svelte files

---

## Standardized Import & Script Order

### 1. Third-party imports
```typescript
import { onMount } from 'svelte';
import { fly } from 'svelte/transition';
import { Download, CircleX } from 'lucide-svelte';
import { SyncLoader } from 'svelte-loading-spinners';
import { Tooltip } from '@svelte-plugins/tooltips';
```

### 2. Type imports
```typescript
import type { ClipMetadata } from '@/types/models';
import type { OnChange } from '@/types/callbacks';
```

### 3. Local component imports
```typescript
import Button from '@/components/Button/Button.svelte';
import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';
```

### 4. Store imports
```typescript
import { appStore } from '@/stores/app-store';
import { notifications } from '@/stores/notifications-store';
```

### 5. API/Utility imports
```typescript
import { GetSequence } from '@/api/sequence';
import { evalES } from '@/lib/utils/bolt';
import { logModule } from '@/lib/logger';
```

### 6. Logger setup (if used)
```typescript
const log = logModule('component-name');
```

### 7. Props (export let)
```typescript
export let clip: ClipMetadata;
export let onChange: OnChange<string> = () => {};
```

### 8. Local state (constants and variables)
```typescript
const stillExportModes = [
  { label: 'shots', value: 'shots' },
  { label: 'markers', value: 'markers' },
];

let isLoading = false;
let selectedId = '';
```

### 9. Reactive declarations
```typescript
$: isValid = clip.name.length > 0;
$: filteredItems = items.filter(item => item.visible);
```

### 10. Functions
```typescript
function handleClick() {
  // ...
}

const handleSubmit = async () => {
  // ...
};
```

### 11. Lifecycle hooks
```typescript
onMount(() => {
  // ...
});

onDestroy(() => {
  // ...
});
```

---

## Function Declaration Standard

### Recommendation: Use `const` with arrow functions

**Why?**
1. **Consistency with Svelte reactivity**: Arrow functions in `const` declarations match Svelte's reactive style (`$:`)
2. **Hoisting behavior**: `const` functions aren't hoisted, making code flow more predictable
3. **Lexical `this` binding**: Arrow functions inherit `this` from parent scope (safer in Svelte)
4. **Modern JavaScript**: Arrow functions are the modern standard
5. **Consistency**: Matches store patterns (`$store`), reactive declarations (`$:`), and lifecycle hooks

### Standard Pattern

```typescript
// ✅ PREFERRED: const + arrow function
const handleClick = () => {
  console.log('clicked');
};

const handleSubmit = async () => {
  await submitForm();
};

const calculateTotal = (items: Item[]) => {
  return items.reduce((sum, item) => sum + item.price, 0);
};
```

### Anti-Pattern

```typescript
// ❌ AVOID: function declaration
function handleClick() {
  console.log('clicked');
}

function handleSubmit() {
  // ...
}
```

### Exception: Nested helper functions

When you have a helper function used only within another function, `function` declarations are acceptable for clarity:

```typescript
const processData = () => {
  // Helper function used only within processData
  function validateItem(item: Item) {
    return item.name && item.price > 0;
  }

  return data.filter(validateItem);
};
```

---

## Before/After Example

### ExportStills.svelte - BEFORE

```typescript
<script lang="ts">
  import { onMount } from 'svelte';
  import { GetThumbnail } from '@/api/clip';
  import {
    GetMarkersThumbnails,
    GetSequence,
    GetSequencedClips,
  } from '@/api/sequence';

  import { notifications } from '@/stores/notifications-store';
  import { openFile } from '@/lib/utils/utils';
  import MarkerRow from '@/components/Markers/MarkersSelect.svelte';
  import type MarkerColor from '@/components/Markers/MarkersSelect.svelte';
  import SelectFolderWeb from '@/components/SelectFolder/SelectFolderWeb.svelte';
  import { appStore } from '@/stores/app-store';
  import { stillOutputFolder } from '@/stores/local-storage';
  import { logModule } from '@/lib/logger';

  const log = logModule('export-stills');

  const stillExportModes = [
    { label: 'shots', value: 'shots' },
    { label: 'markers', value: 'markers' },
  ];

  let markerColors: MarkerColor[] = [];
  let outputFolder = '';
  let selectedExportMode = '';
  let refTrack = 'shots';
  let done = false;

  function setOutputFolder(path: string) { ... }

  const handleOpenFolder = () => { ... };

  const handleMarkerChange = (m: any) => { ... };

  const handleExportMode = (s: any) => { ... };

  const handleSubmitExport = async () => { ... };

  $: focus = false;

  onMount(async () => { ... });
</script>
```

### ExportStills.svelte - AFTER

```typescript
<script lang="ts">
  import { onMount } from 'svelte';
  import type MarkerColor from '@/components/Markers/MarkersSelect.svelte';
  import MarkerRow from '@/components/Markers/MarkersSelect.svelte';
  import SelectFolderWeb from '@/components/SelectFolder/SelectFolderWeb.svelte';
  import { appStore } from '@/stores/app-store';
  import { notifications } from '@/stores/notifications-store';
  import { stillOutputFolder } from '@/stores/local-storage';
  import { GetThumbnail } from '@/api/clip';
  import { GetMarkersThumbnails, GetSequence, GetSequencedClips } from '@/api/sequence';
  import { openFile } from '@/lib/utils/utils';
  import { logModule } from '@/lib/logger';

  const log = logModule('export-stills');

  const stillExportModes = [
    { label: 'shots', value: 'shots' },
    { label: 'markers', value: 'markers' },
  ];

  let markerColors: MarkerColor[] = [];
  let outputFolder = '';
  let selectedExportMode = '';
  let refTrack = 'shots';
  let done = false;

  $: focus = false;

  const setOutputFolder = (path: string) => { ... };

  const handleOpenFolder = () => { ... };

  const handleMarkerChange = (m: any) => { ... };

  const handleExportMode = (s: any) => { ... };

  const handleSubmitExport = async () => { ... };

  onMount(async () => { ... });
</script>
```

**Key Changes:**
1. ✅ Grouped type imports separately
2. ✅ Grouped component imports together
3. ✅ Grouped store imports together
4. ✅ Grouped API imports together
5. ✅ Moved reactive declaration before functions
6. ✅ Changed `function setOutputFolder()` to `const setOutputFolder = ()`
7. ✅ Lifecycle at the end

---

## ExportSequenceXML.svelte - BEFORE

```typescript
<script lang="ts">
  import {
    localAppStore,
    lastFolderExport,
    storedExportRootFolder,
  } from '@/stores/local-storage';
  import { appStore } from '@/stores/app-store';
  import { GetActiveSequence } from '@/api/edit';
  import { GetSelectedSequences } from '@/api/sequence';
  import ButtonGroup from '@/components/ButtonGroup/ButtonGroup.svelte';
  import { evalES } from '@/lib/utils/bolt';
  import { FolderInput } from 'lucide-svelte';
  import { fs, path } from '@/lib/cep/node';
  import { notifications } from '@/stores/notifications-store';
  import { onMount } from 'svelte';
  import SelectFolderWeb from '@/components/SelectFolder/SelectFolderWeb.svelte';
  import type { Sequence } from '@/api/sequence';
  import { logModule } from '@/lib/logger';

  const log = logModule('export-sequence-xml');

  let suffix = '';
  let rootFolder = '';

  $: log.debug('Root folder updated', { rootFolder });

  function setRootFolder(path: string) { ... }

  const handleSequenceNameChange = (event: Event) => { ... };

  const exportSequenceXml = async (sequence: Sequence) => { ... };

  const handleSubmitExport = async () => { ... };

  onMount(() => { ... });
</script>
```

## ExportSequenceXML.svelte - AFTER

```typescript
<script lang="ts">
  import { onMount } from 'svelte';
  import { FolderInput } from 'lucide-svelte';
  import type { Sequence } from '@/api/sequence';
  import ButtonGroup from '@/components/ButtonGroup/ButtonGroup.svelte';
  import SelectFolderWeb from '@/components/SelectFolder/SelectFolderWeb.svelte';
  import { appStore } from '@/stores/app-store';
  import { notifications } from '@/stores/notifications-store';
  import { localAppStore, lastFolderExport, storedExportRootFolder } from '@/stores/local-storage';
  import { GetActiveSequence } from '@/api/edit';
  import { GetSelectedSequences } from '@/api/sequence';
  import { fs, path } from '@/lib/cep/node';
  import { evalES } from '@/lib/utils/bolt';
  import { logModule } from '@/lib/logger';

  const log = logModule('export-sequence-xml');

  let suffix = '';
  let rootFolder = '';

  $: log.debug('Root folder updated', { rootFolder });

  const setRootFolder = (path: string) => { ... };

  const handleSequenceNameChange = (event: Event) => { ... };

  const exportSequenceXml = async (sequence: Sequence) => { ... };

  const handleSubmitExport = async () => { ... };

  onMount(() => { ... });
</script>
```

**Key Changes:**
1. ✅ Third-party imports first (Svelte, lucide-svelte)
2. ✅ Type imports grouped
3. ✅ Component imports grouped
4. ✅ Store imports grouped
5. ✅ API imports grouped
6. ✅ Changed `function setRootFolder()` to `const setRootFolder = ()`

---

## Implementation Plan

### Step 1: Analysis & Categorization ✅
- [x] Identified 68 Svelte components
- [x] Analyzed import patterns
- [x] Created standardization rules
- [x] Documented function declaration standard

### Step 2: Simple Components (Low Risk)
**Batch 1** - Small components (<50 lines):
- Button, Toggle, Chip, Toast, ProgressBar
- SelectFolder, SelectFolderWeb
- DropdownItem, StatusList
- ModalConfirm, ModalSettings

**Actions:**
1. Reorder imports following 11-step pattern
2. Convert `function` declarations to `const` + arrow functions
3. Verify reactive declarations come before functions
4. Run `bun run build`
5. Commit: "Standardize script ordering in simple components"

### Step 3: Medium Components (Medium Risk)
**Batches 2-5** - Medium components (51-150 lines):
- ClipCard, BookMarkCard, ToolCard, AssetCard
- ExportStills, ExportSequenceXML, ExportSequenceCSV
- MarkerRow, FileBrowser, InputWithTokens
- ChatInput, CodeEditor

**Actions:**
1. Process in batches of 5-7 components
2. Reorder imports + convert functions
3. Run `bun run build` after each batch
4. Commit per batch: "Standardize script ordering in medium components (batch N)"

### Step 4: Complex Components (Higher Risk)
**Individual processing** - Large components (150+ lines):
- ShotExplorer (383 lines)
- ExportCompositions (166 lines)
- ClipCard (288 lines)
- BookMarkCard (complex logic)
- ToolsContainer
- ExplorerContainer
- FileBrowser (complex tree logic)

**Actions:**
1. **One component at a time**
2. Careful review of function dependencies
3. Test reactive statements don't break
4. Run `bun run build` after each
5. Commit individually: "Standardize script ordering in [ComponentName]"

### Step 5: Edge Cases
**Special handling needed:**
- Components with dynamic imports
- Components with conditional imports
- Components with side-effect imports
- Components with exported sub-components

### Step 6: Final Validation
1. Run full production build: `bun run build`
2. Run `bun run zxp` (if applicable)
3. Manual smoke test in Adobe extension
4. Update REFACTORING_PLAN.md
5. Final commit: "Complete component script ordering standardization"

---

## Edge Cases & Handling

### 1. Mixed Import Lines
```typescript
// BEFORE:
import { appStore, type AppStore } from '@/stores/app-store';

// AFTER: Split into separate imports
import type { AppStore } from '@/stores/app-store';
import { appStore } from '@/stores/app-store';
```

### 2. Type-Only Component Imports
```typescript
// Keep with type imports section
import type MarkerColor from '@/components/Markers/MarkersSelect.svelte';
import MarkerRow from '@/components/Markers/MarkersSelect.svelte';
```

### 3. Multiple Exports from Same Module
```typescript
// Keep together, can use multi-line for readability
import {
  GetMarkersThumbnails,
  GetSequence,
  GetSequencedClips,
} from '@/api/sequence';
```

### 4. Side-Effect Imports
```typescript
// Keep at top with third-party imports
import '@/styles/global.css';
import { onMount } from 'svelte';
```

### 5. Re-Exports
```typescript
// Keep with props section
export { default as SubComponent } from './SubComponent.svelte';
export let someProp: string;
```

---

## Risk Mitigation

1. **Incremental commits**: Each batch gets its own commit for easy rollback
2. **Build validation**: Build check after every batch
3. **No functional changes**: Only reordering and syntax changes, no logic modifications
4. **Manual review**: Spot check each batch for correctness
5. **Function conversion safety**: Arrow functions maintain same behavior in Svelte components

---

## Current Component Statistics

**Total Components**: 68 files

**Function Declaration Patterns Found:**
- `const functionName = () => {}`: ~45 instances
- `function functionName() {}`: ~23 instances

**Mixed patterns in same file:** 15+ components

**Complexity Distribution:**
- Simple (<50 lines): ~15 files
- Medium (51-150 lines): ~30 files
- Complex (150+ lines): ~23 files

---

## Success Criteria

- ✅ All 68 components follow 11-step script order
- ✅ All functions use `const` + arrow function pattern (except nested helpers)
- ✅ `bun run build` passes without errors
- ✅ No functional changes or regressions
- ✅ All imports properly grouped and ordered
- ✅ Consistent style across entire codebase

---

## Estimated Timeline

- **Simple Components** (15 files): 1 batch
- **Medium Components** (30 files): 5 batches (6 components each)
- **Complex Components** (23 files): 23 individual changes
- **Total commits**: ~30 separate commits for safety

---

**Ready to proceed**: Yes
**Next step**: Start with Step 2 - Simple Components Batch
