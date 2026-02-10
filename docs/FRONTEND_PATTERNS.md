# Frontend Patterns - Buck Post Tools CEP

## Table of Contents
1. [Component Architecture](#component-architecture)
2. [Script Ordering Standard](#script-ordering-standard)
3. [Function Patterns](#function-patterns)
4. [Import Organization](#import-organization)
5. [Props and Events](#props-and-events)
6. [Reactive Declarations](#reactive-declarations)
7. [Lifecycle Management](#lifecycle-management)
8. [Error Handling](#error-handling)
9. [Styling Patterns](#styling-patterns)

## Component Architecture

### Component Categories

**1. Container Components** (`src/js/main/`)
- Manage application state
- Coordinate child components
- Handle data fetching
- Named with "Container" suffix: `ExportContainer.svelte`

**2. Presentational Components** (`src/js/components/`)
- Pure UI components
- Receive data via props
- Emit events to parent
- Reusable across features

**3. Feature Components** (`src/js/main/[Feature]/`)
- Feature-specific logic
- May contain local state
- Coordinate with containers

### File Organization Example

```
src/js/main/Export/
├── ExportContainer.svelte       # Main container
├── ExportStills.svelte           # Feature component
├── ExportSequenceXML.svelte      # Feature component
├── ExportSequenceCSV.svelte      # Feature component
├── ExportPathBuilder.svelte      # Complex feature (900+ lines)
└── PublishToAquarium.svelte      # Feature component
```

## Script Ordering Standard

**This order is mandatory for all Svelte components:**

```svelte
<script lang="ts">
  // ═══════════════════════════════════════════════════════════
  // 1. SVELTE IMPORTS (First - Framework core)
  // ═══════════════════════════════════════════════════════════
  import { onMount, onDestroy, createEventDispatcher, getContext } from 'svelte';

  // ═══════════════════════════════════════════════════════════
  // 2. THIRD-PARTY LIBRARY IMPORTS
  // ═══════════════════════════════════════════════════════════
  import { ArrowLeftRight, Save, X } from 'lucide-svelte';

  // ═══════════════════════════════════════════════════════════
  // 3. COMPONENT IMPORTS (UI building blocks)
  // ═══════════════════════════════════════════════════════════
  import Button from '@/components/Button/Button.svelte';
  import Modal from '@/components/Modal/ModalConfirm.svelte';
  import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';

  // ═══════════════════════════════════════════════════════════
  // 4. STORE IMPORTS (State management)
  // ═══════════════════════════════════════════════════════════
  import { appStore } from '@/stores/app-store';
  import { notifications } from '@/stores/notifications-store';
  import { bookmarkStore } from '@/stores/bookmark-store';

  // ═══════════════════════════════════════════════════════════
  // 5. API/UTILITY IMPORTS (Business logic)
  // ═══════════════════════════════════════════════════════════
  import { evalES, evalTS } from '@/lib/utils/bolt';
  import { path, fs } from '@/lib/cep/node';

  // ═══════════════════════════════════════════════════════════
  // 6. STYLESHEET IMPORT (Component styles)
  // ═══════════════════════════════════════════════════════════
  import './ExportStills.scss';

  // ═══════════════════════════════════════════════════════════
  // 7. LOGGER SETUP (Must be after all imports)
  // ═══════════════════════════════════════════════════════════
  import { logModule } from '@/lib/logger';
  const log = logModule('export-stills');

  // ═══════════════════════════════════════════════════════════
  // 8. TYPE DEFINITIONS (Interfaces, types, enums)
  // ═══════════════════════════════════════════════════════════
  interface ExportOptions {
    format: 'png' | 'jpg';
    quality: number;
  }

  type ExportStatus = 'idle' | 'processing' | 'complete' | 'error';

  // ═══════════════════════════════════════════════════════════
  // 9. PROPS (Component public API - export let)
  // ═══════════════════════════════════════════════════════════
  export let title: string = 'Export Stills';
  export let defaultFormat: 'png' | 'jpg' = 'png';
  export let onComplete: () => void = () => {};

  // ═══════════════════════════════════════════════════════════
  // 10. CONTEXT (If using Svelte context)
  // ═══════════════════════════════════════════════════════════
  const exportContext = getContext('export');

  // ═══════════════════════════════════════════════════════════
  // 11. LOCAL STATE (Component internal state)
  // ═══════════════════════════════════════════════════════════
  let status: ExportStatus = 'idle';
  let progress = 0;
  let outputPath = '';
  let selectedFormat: 'png' | 'jpg' = defaultFormat;

  // ═══════════════════════════════════════════════════════════
  // 12. REACTIVE DECLARATIONS ($:)
  // ═══════════════════════════════════════════════════════════
  $: isProcessing = status === 'processing';
  $: canExport = outputPath.length > 0 && !isProcessing;
  $: log.debug('Status changed', { status, progress });

  // ═══════════════════════════════════════════════════════════
  // 13. FUNCTIONS (Component methods - arrow functions)
  // ═══════════════════════════════════════════════════════════
  const handleExport = async () => {
    log.debug('Export started', { format: selectedFormat, path: outputPath });
    status = 'processing';

    try {
      await evalTS('exportStills', { format: selectedFormat, path: outputPath });
      status = 'complete';
      notifications.success('Export complete');
      onComplete();
    } catch (error) {
      log.error('Export failed', error);
      status = 'error';
      notifications.error('Export failed');
    }
  };

  const handleFormatChange = (format: 'png' | 'jpg') => {
    selectedFormat = format;
    log.debug('Format changed', { format });
  };

  const handlePathSelect = (path: string) => {
    outputPath = path;
  };

  // ═══════════════════════════════════════════════════════════
  // 14. LIFECYCLE HOOKS (Last - initialization)
  // ═══════════════════════════════════════════════════════════
  onMount(() => {
    log.debug('Component mounted', { title, defaultFormat });
    // Load saved preferences
    if ($appStore.rememberLastExportPath) {
      outputPath = localStorage.getItem('lastExportPath') || '';
    }
  });

  onDestroy(() => {
    log.debug('Component destroyed');
    // Cleanup
  });
</script>

<!-- ═══════════════════════════════════════════════════════════ -->
<!-- MARKUP -->
<!-- ═══════════════════════════════════════════════════════════ -->
<div class="export-stills">
  <h2>{title}</h2>

  <div class="format-selector">
    <button
      class:active={selectedFormat === 'png'}
      on:click={() => handleFormatChange('png')}
    >
      PNG
    </button>
    <button
      class:active={selectedFormat === 'jpg'}
      on:click={() => handleFormatChange('jpg')}
    >
      JPG
    </button>
  </div>

  <Button onClick={handleExport} disabled={!canExport}>
    {isProcessing ? 'Exporting...' : 'Export'}
  </Button>
</div>
```

### Why This Order Matters

1. **Svelte imports first**: Framework core must be available
2. **Third-party libs**: External dependencies before internal
3. **Components before stores**: UI building blocks available
4. **Stores before APIs**: State management before business logic
5. **Stylesheet import**: Load styles early for proper cascade
6. **Logger after imports**: Needs all dependencies loaded
7. **Types before usage**: TypeScript needs definitions first
8. **Props before state**: Public API before internal state
9. **Context after props**: May depend on props
10. **State before reactive**: Variables before computations
11. **Functions before lifecycle**: Methods before initialization
12. **Lifecycle last**: Runs after everything is defined

## Function Patterns

### Arrow Functions (Frontend Standard)

**Always use arrow functions in Svelte components:**

```typescript
// ✅ CORRECT - Arrow function with const
const handleClick = () => {
  log.debug('Button clicked');
};

const handleSubmit = async () => {
  await saveData();
};

const processItems = (items: Item[]) => {
  return items.filter(item => item.visible);
};

// ❌ WRONG - Function declaration
function handleClick() {
  log.debug('Button clicked');
}
```

### Function Naming Conventions

```typescript
// Event handlers - prefix with "handle"
const handleClick = () => {};
const handleChange = (value: string) => {};
const handleSubmit = async () => {};

// Utility functions - descriptive verb
const filterVisibleItems = (items: Item[]) => {};
const calculateTotal = (values: number[]) => {};
const validateInput = (input: string) => boolean;

// Boolean functions - prefix with "is", "has", "can"
const isValid = () => boolean;
const hasPermission = () => boolean;
const canSubmit = () => boolean;
```

### Async Function Pattern

```typescript
const fetchData = async () => {
  log.debug('Fetching data');

  try {
    const result = await evalTS('getData');
    log.debug('Data fetched', { count: result.length });
    return result;
  } catch (error) {
    log.error('Failed to fetch data', error);
    notifications.error('Failed to load data');
    throw error;
  }
};
```

### Function Organization

Group related functions together:

```typescript
// ═══════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════
const handleSave = () => {};
const handleCancel = () => {};
const handleDelete = () => {};

// ═══════════════════════════════════════════════════════════
// DATA PROCESSING
// ═══════════════════════════════════════════════════════════
const filterItems = (items: Item[]) => {};
const sortItems = (items: Item[]) => {};
const transformData = (data: any) => {};

// ═══════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════
const validateForm = () => boolean;
const checkPermissions = () => boolean;
```

## Import Organization

### Import Grouping

```typescript
// Group 1: Svelte (framework core)
import { onMount, createEventDispatcher } from 'svelte';

// Group 2: Third-party (external dependencies)
import { Save, X } from 'lucide-svelte';

// Group 3: Components (internal UI)
import Button from '@/components/Button/Button.svelte';
import Modal from '@/components/Modal/ModalConfirm.svelte';

// Group 4: Stores (state management)
import { appStore } from '@/stores/app-store';
import { notifications } from '@/stores/notifications-store';

// Group 5: APIs/Utils (business logic)
import { evalES } from '@/lib/utils/bolt';
import { path } from '@/lib/cep/node';

// Group 6: Logger (after everything else)
import { logModule } from '@/lib/logger';
const log = logModule('component-name');

// Group 7: Types (can use type keyword)
import type { ClipMetadata } from '@/types/models';
import type { OnClick, OnChange } from '@/types/callbacks';
```

### Path Alias Usage

```typescript
// ✅ CORRECT - Use @ alias
import { evalES } from '@/lib/utils/bolt';
import Button from '@/components/Button/Button.svelte';

// ❌ WRONG - Relative paths
import { evalES } from '../../lib/utils/bolt';
import Button from '../components/Button/Button.svelte';
```

### Type-Only Imports

```typescript
// Use 'type' keyword for type-only imports
import type { ClipMetadata } from '@/types/models';
import type { OnClick } from '@/types/callbacks';

// Regular import for values
import { appStore } from '@/stores/app-store';
```

## Props and Events

### Props Pattern

```typescript
// Simple props with defaults
export let title: string = 'Default Title';
export let count: number = 0;
export let isVisible: boolean = true;

// Optional props (undefined allowed)
export let subtitle: string | undefined = undefined;
export let metadata: ClipMetadata | null = null;

// Array props
export let items: Item[] = [];

// Callback props (use type definitions)
import type { OnClick, OnChange } from '@/types/callbacks';

export let onClick: OnClick = () => {};
export let onChange: OnChange<string> = (value) => {};
export let onSelect: (item: Item) => void = () => {};

// Object props (define interface)
interface Config {
  theme: 'dark' | 'light';
  fontSize: number;
}

export let config: Config = {
  theme: 'dark',
  fontSize: 14
};
```

### Props Validation

```typescript
// Validate props in onMount
onMount(() => {
  if (!title) {
    log.warn('Title prop is empty');
  }

  if (items.length === 0) {
    log.debug('No items provided');
  }
});
```

### Event Dispatching

```typescript
import { createEventDispatcher } from 'svelte';

// Define event types
interface Events {
  select: { id: string; name: string };
  delete: { id: string };
  cancel: void; // No payload
}

const dispatch = createEventDispatcher<Events>();

// Dispatch events
const handleSelect = (id: string, name: string) => {
  log.debug('Item selected', { id, name });
  dispatch('select', { id, name });
};

const handleDelete = (id: string) => {
  dispatch('delete', { id });
};

const handleCancel = () => {
  dispatch('cancel');
};
```

### Event Handler Props

```typescript
// Parent component
<ChildComponent
  onSelect={(item) => {
    log.debug('Item selected', item);
    selectedItem = item;
  }}
  onCancel={() => {
    log.debug('Cancelled');
  }}
/>

// Child component
export let onSelect: (item: Item) => void = () => {};
export let onCancel: () => void = () => {};

const handleItemClick = (item: Item) => {
  onSelect(item);
};
```

## Reactive Declarations

### Basic Reactive Statements

```typescript
// Simple computation
$: total = items.reduce((sum, item) => sum + item.price, 0);

// Boolean flag
$: hasItems = items.length > 0;
$: canSubmit = form.name.length > 0 && form.email.length > 0;

// Derived from store
$: appName = $appStore.appId === 'AEFT' ? 'After Effects' : 'Premiere Pro';
$: isAfterEffects = $appStore.appId === 'AEFT';
```

### Reactive Blocks

```typescript
// Run code when dependency changes
$: {
  log.debug('Items changed', { count: items.length });
  updateDisplay();
}

// Multiple dependencies
$: {
  if (selectedMode && items.length > 0) {
    processItems();
  }
}
```

### Reactive with Side Effects

```typescript
// ⚠️ Use cautiously - can cause infinite loops
$: if (autoSave && formData.dirty) {
  saveForm();
}

// ✅ Better - use onMount or explicit functions
const handleFormChange = () => {
  if (autoSave) {
    saveForm();
  }
};
```

### Store Reactivity

```typescript
// Read store values
$: userName = $appStore.userName;
$: theme = $appStore.theme;

// Reactive computation from store
$: greeting = `Hello, ${$appStore.userName}!`;

// Multiple stores
$: canExport = $appStore.appId === 'PPRO' && $bookmarkStore.selected !== null;
```

## Lifecycle Management

### onMount Pattern

```typescript
onMount(() => {
  log.debug('Component mounted', {
    title,
    appId: $appStore.appId
  });

  // Load initial data
  loadData();

  // Set up event listeners
  const cleanup = setupListeners();

  // Return cleanup function
  return () => {
    log.debug('Cleaning up');
    cleanup();
  };
});
```

### onDestroy Pattern

```typescript
onDestroy(() => {
  log.debug('Component destroyed');

  // Clean up timers
  if (timer) {
    clearInterval(timer);
  }

  // Unsubscribe from events
  if (unsubscribe) {
    unsubscribe();
  }
});
```

### Async onMount

```typescript
onMount(async () => {
  log.debug('Component mounting');

  try {
    const data = await fetchData();
    items = data;
    log.debug('Data loaded', { count: data.length });
  } catch (error) {
    log.error('Failed to load data', error);
    notifications.error('Failed to load data');
  }

  // Cleanup still works with async
  return () => {
    log.debug('Cleaning up');
  };
});
```

## Error Handling

### Try-Catch Pattern

```typescript
const handleOperation = async () => {
  log.debug('Operation started');

  try {
    // Operation logic
    const result = await evalTS('performOperation', params);

    // Success
    log.debug('Operation complete', result);
    notifications.success('Operation complete');

    return result;
  } catch (error) {
    // Error handling
    log.error('Operation failed', error);
    notifications.error('Operation failed');

    // Optionally re-throw
    throw error;
  } finally {
    // Cleanup (always runs)
    isProcessing = false;
  }
};
```

### Error Boundaries

```typescript
// Component-level error handling
let errorMessage: string | null = null;

const handleAction = async () => {
  errorMessage = null;

  try {
    await performAction();
  } catch (error) {
    errorMessage = error.message || 'An error occurred';
    log.error('Action failed', error);
  }
};
```

```svelte
<!-- Display errors to user -->
{#if errorMessage}
  <div class="error-message">
    {errorMessage}
  </div>
{/if}
```

### Validation Errors

```typescript
const validateAndSubmit = () => {
  // Validate inputs
  if (!form.name) {
    notifications.error('Name is required');
    return;
  }

  if (!form.email.includes('@')) {
    notifications.error('Invalid email address');
    return;
  }

  // Proceed with submission
  submitForm();
};
```

## Styling Patterns

### Separate Stylesheet Files (Recommended)

**For framework portability and better organization, keep styles in separate files:**

```
src/js/main/Export/
├── ExportContainer.svelte
├── ExportContainer.scss        # ← Separate stylesheet
├── ExportStills.svelte
└── ExportStills.scss            # ← Separate stylesheet
```

**Component with external stylesheet:**

```svelte
<!-- ExportStills.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { evalTS } from '@/lib/utils/bolt';
  import { logModule } from '@/lib/logger';
  import './ExportStills.scss';  // Import stylesheet

  const log = logModule('export-stills');

  let isProcessing = false;
  let format: 'png' | 'jpg' = 'png';

  const handleExport = async () => {
    isProcessing = true;
    await evalTS('exportStills', { format });
    isProcessing = false;
  };
</script>

<div class="export-stills">
  <h2>Export Stills</h2>

  <div class="format-selector">
    <button
      class="format-btn"
      class:active={format === 'png'}
      on:click={() => (format = 'png')}
    >
      PNG
    </button>
    <button
      class="format-btn"
      class:active={format === 'jpg'}
      on:click={() => (format = 'jpg')}
    >
      JPG
    </button>
  </div>

  <button
    class="export-btn"
    class:processing={isProcessing}
    on:click={handleExport}
  >
    {isProcessing ? 'Exporting...' : 'Export'}
  </button>
</div>
```

**ExportStills.scss:**

```scss
@use '../../variables.scss' as *;

.export-stills {
  padding: $spacing-md;
  background: $color-bg-primary;

  h2 {
    margin: 0 0 $spacing-md 0;
    color: $color-text;
  }
}

.format-selector {
  display: flex;
  gap: $spacing-sm;
  margin-bottom: $spacing-md;
}

.format-btn {
  padding: $spacing-sm $spacing-md;
  background: $color-bg-secondary;
  border: 1px solid $color-border;
  color: $color-text;
  cursor: pointer;

  &:hover {
    background: lighten($color-bg-secondary, 5%);
  }

  &.active {
    background: $color-primary;
    border-color: $color-primary;
  }
}

.export-btn {
  padding: $spacing-sm $spacing-lg;
  background: $color-primary;
  border: none;
  color: white;
  cursor: pointer;

  &:hover {
    background: lighten($color-primary, 10%);
  }

  &.processing {
    opacity: 0.6;
    cursor: wait;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
```

### Why Separate Stylesheets?

**Benefits:**

1. **Framework Portability**: Easy migration to Solid, React, Vue, etc.
2. **Better Organization**: Clear separation of concerns
3. **Easier to Find**: Styles live next to components
4. **Better IDE Support**: Full SCSS intellisense
5. **Reusability**: Can share styles between components
6. **Testing**: Can test styles independently
7. **Hot Reload**: Style changes don't require component re-mount

**Framework Migration Example:**

```typescript
// Svelte component
import './ExportStills.scss';

// Can easily become Solid component
import './ExportStills.scss';

// Or React component
import './ExportStills.scss';

// Same stylesheet works for all!
```

### Using Variables

**Variables are defined in `src/js/variables.scss`:**

```scss
// Spacing
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 16px;
$spacing-lg: 24px;
$spacing-xl: 32px;

// Colors
$color-bg-primary: #232323;
$color-bg-secondary: #2a2a2a;
$color-text: #e0e0e0;
$color-text-muted: #999;
$color-border: #474747;
$color-primary: #086ce7;
$color-success: #3caea3;
$color-error: #d32f2f;
$color-warning: #f57c00;
```

**Import variables in your stylesheet:**

```scss
@use '../../variables.scss' as *;

.my-component {
  padding: $spacing-md;
  background: $color-bg-primary;
  color: $color-text;
}
```

### Conditional Classes (Svelte)

**Use Svelte's class directive for conditional styling:**

```svelte
<button
  class="btn"
  class:active={isActive}
  class:disabled={!canSubmit}
  class:loading={isLoading}
>
  Submit
</button>
```

**In your SCSS file:**

```scss
.btn {
  padding: $spacing-sm $spacing-md;
  background: $color-bg-secondary;
  border: 1px solid $color-border;

  &.active {
    background: $color-primary;
    border-color: $color-primary;
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.loading {
    opacity: 0.7;
    cursor: wait;
  }
}
```

### Dynamic Inline Styles (When Needed)

**Use inline styles only for truly dynamic values:**

```svelte
<!-- ✅ GOOD - Dynamic runtime values -->
<div style:color={userColor} style:font-size="{fontSize}px">
  Content
</div>

<!-- ❌ AVOID - Static styles belong in stylesheet -->
<div style="padding: 16px; background: #232323">
  Content
</div>
```

### Component Scoping Alternatives

Since styles are in separate files, they're not automatically scoped. Use clear naming conventions:

**BEM Naming Convention (Recommended):**

```scss
// ExportStills.scss
.export-stills {
  padding: $spacing-md;

  // Elements
  &__header {
    font-size: 18px;
    margin-bottom: $spacing-md;
  }

  &__format-selector {
    display: flex;
    gap: $spacing-sm;
  }

  &__format-btn {
    padding: $spacing-sm $spacing-md;

    // Modifiers
    &--active {
      background: $color-primary;
    }

    &--disabled {
      opacity: 0.5;
    }
  }
}
```

**Usage in component:**

```svelte
<div class="export-stills">
  <h2 class="export-stills__header">Export Stills</h2>

  <div class="export-stills__format-selector">
    <button
      class="export-stills__format-btn"
      class:export-stills__format-btn--active={format === 'png'}
    >
      PNG
    </button>
  </div>
</div>
```

**Or simpler prefix approach:**

```scss
// ExportStills.scss - Prefix all classes
.es-container {
  padding: $spacing-md;
}

.es-header {
  font-size: 18px;
}

.es-format-btn {
  padding: $spacing-sm;

  &.active {
    background: $color-primary;
  }
}
```

### Shared Styles

**Create shared style utilities:**

```scss
// src/js/styles/utilities.scss
@use '../variables.scss' as *;

// Flexbox utilities
.flex-row {
  display: flex;
  flex-direction: row;
}

.flex-column {
  display: flex;
  flex-direction: column;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

// Spacing utilities
.gap-sm { gap: $spacing-sm; }
.gap-md { gap: $spacing-md; }
.gap-lg { gap: $spacing-lg; }

// Common button styles
.btn-base {
  padding: $spacing-sm $spacing-md;
  border: 1px solid $color-border;
  cursor: pointer;
  background: $color-bg-secondary;
  color: $color-text;

  &:hover {
    background: lighten($color-bg-secondary, 5%);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-primary {
  @extend .btn-base;
  background: $color-primary;
  border-color: $color-primary;
  color: white;

  &:hover {
    background: lighten($color-primary, 10%);
  }
}
```

**Import utilities in components:**

```svelte
<script lang="ts">
  import '@/styles/utilities.scss';
  import './MyComponent.scss';
</script>

<div class="flex-column gap-md">
  <button class="btn-primary">Save</button>
</div>
```

### Global Styles

**For truly global styles, use `src/js/index.scss`:**

```scss
// index.scss - Global styles
@use './variables.scss' as *;

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: $color-bg-primary;
  color: $color-text;
}

// Only global, truly shared styles here
.action-row {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-sm;
  padding: $spacing-md 0;
}
```

---

## Complete Example

Here's a complete component following all patterns with separate stylesheet:

**ExportPanel.svelte:**

```svelte
<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';
  import { Save, X } from 'lucide-svelte';
  import Button from '@/components/Button/Button.svelte';
  import SelectFolder from '@/components/SelectFolder/SelectFolder.svelte';
  import { appStore } from '@/stores/app-store';
  import { notifications } from '@/stores/notifications-store';
  import { evalTS } from '@/lib/utils/bolt';
  import { logModule } from '@/lib/logger';
  import './ExportPanel.scss';

  const log = logModule('export-panel');

  interface ExportConfig {
    format: 'xml' | 'csv';
    includeMetadata: boolean;
  }

  interface Events {
    complete: { success: boolean; path: string };
    cancel: void;
  }

  const dispatch = createEventDispatcher<Events>();

  export let title: string = 'Export';
  export let defaultConfig: ExportConfig = {
    format: 'xml',
    includeMetadata: true
  };

  let config: ExportConfig = { ...defaultConfig };
  let outputPath = '';
  let isExporting = false;

  $: canExport = outputPath.length > 0 && !isExporting;
  $: log.debug('Config changed', config);

  const handleExport = async () => {
    log.debug('Export started', { config, path: outputPath });
    isExporting = true;

    try {
      await evalTS('exportData', { ...config, path: outputPath });
      log.debug('Export complete');
      notifications.success('Export successful');
      dispatch('complete', { success: true, path: outputPath });
    } catch (error) {
      log.error('Export failed', error);
      notifications.error('Export failed');
      dispatch('complete', { success: false, path: outputPath });
    } finally {
      isExporting = false;
    }
  };

  const handleCancel = () => {
    log.debug('Export cancelled');
    dispatch('cancel');
  };

  onMount(() => {
    log.debug('Component mounted', { title, appId: $appStore.appId });
  });
</script>

<div class="export-panel">
  <h2 class="export-panel__title">{title}</h2>

  <div class="export-panel__config">
    <label class="export-panel__radio">
      <input type="radio" bind:group={config.format} value="xml" />
      XML
    </label>
    <label class="export-panel__radio">
      <input type="radio" bind:group={config.format} value="csv" />
      CSV
    </label>
  </div>

  <SelectFolder
    folder={outputPath}
    onSelect={(path) => (outputPath = path)}
  />

  <div class="export-panel__actions">
    <Button onClick={handleExport} disabled={!canExport}>
      <Save />
      {isExporting ? 'Exporting...' : 'Export'}
    </Button>
    <Button onClick={handleCancel}>
      <X />
      Cancel
    </Button>
  </div>
</div>
```

**ExportPanel.scss:**

```scss
@use '../../variables.scss' as *;

.export-panel {
  padding: $spacing-md;
  background: $color-bg-primary;

  &__title {
    margin: 0 0 $spacing-md 0;
    font-size: 18px;
    color: $color-text;
  }

  &__config {
    display: flex;
    gap: $spacing-md;
    margin: $spacing-md 0;
  }

  &__radio {
    display: flex;
    align-items: center;
    gap: $spacing-xs;
    color: $color-text;
    cursor: pointer;

    input[type="radio"] {
      cursor: pointer;
    }
  }

  &__actions {
    display: flex;
    gap: $spacing-sm;
    justify-content: flex-end;
    margin-top: $spacing-md;
  }
}
```

---

## Quick Reference

### Script Order Checklist
- [ ] 1. Svelte imports
- [ ] 2. Third-party imports
- [ ] 3. Component imports
- [ ] 4. Store imports
- [ ] 5. API/Utils imports
- [ ] 6. Stylesheet import
- [ ] 7. Logger setup
- [ ] 8. Types
- [ ] 9. Props
- [ ] 10. Context
- [ ] 11. State
- [ ] 12. Reactive
- [ ] 13. Functions
- [ ] 14. Lifecycle

### Function Checklist
- [ ] Use arrow functions
- [ ] Use const declaration
- [ ] Descriptive names (handle*, is*, can*)
- [ ] Add logging
- [ ] Error handling

### Props Checklist
- [ ] Type all props
- [ ] Provide defaults
- [ ] Use type definitions for callbacks
- [ ] Document complex props

### Store Checklist
- [ ] Use $ prefix for store access
- [ ] Don't initialize from CEP at module level
- [ ] Use get() for non-reactive contexts

### Styling Checklist
- [ ] Create separate .scss file next to component
- [ ] Import stylesheet in component script
- [ ] Use BEM or prefix naming convention
- [ ] Import variables: `@use '../../variables.scss' as *;`
- [ ] Only use inline styles for dynamic values
- [ ] Use class directives for conditional classes
