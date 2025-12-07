# Buck Post Tools CEP - Development Guide

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Development Setup](#development-setup)
4. [Code Standards](#code-standards)
5. [Working with Components](#working-with-components)
6. [State Management](#state-management)
7. [Logging](#logging)
8. [Type Safety](#type-safety)

## Project Overview

Buck Post Tools is an Adobe CEP (Common Extensibility Platform) extension built with:
- **Frontend**: Svelte + TypeScript + Vite
- **Backend**: ExtendScript (JSX) for Adobe app automation
- **Target Apps**: After Effects, Premiere Pro (primarily)
- **Build System**: Vite (frontend), Rollup (ExtendScript)

### Two Distinct Environments

This project operates in **two completely different JavaScript environments**:

1. **Frontend (CEP/Chromium)** - `src/js/`
   - Modern ES2020+ JavaScript/TypeScript
   - Svelte components
   - Node.js APIs (via CEP)
   - Chrome 74 browser APIs

2. **Backend (ExtendScript)** - `src/jsx/`
   - ES3 JavaScript (very limited)
   - No modern features (no arrow functions, let/const, etc.)
   - Adobe app APIs (After Effects DOM, Premiere Pro QE DOM)
   - No npm packages

**Critical**: Code in `src/js/` and `src/jsx/` cannot share dependencies or modern syntax!

## Architecture

### Directory Structure

```
buck-post-tools-svelte/
├── src/
│   ├── js/                 # Frontend (Svelte/TS)
│   │   ├── main/           # Main application views
│   │   ├── components/     # Reusable UI components
│   │   ├── stores/         # Svelte stores (state management)
│   │   ├── lib/            # Core utilities and CEP integration
│   │   ├── api/            # Business logic
│   │   ├── types/          # TypeScript type definitions
│   │   └── logger.ts       # Centralized logging
│   │
│   ├── jsx/                # ExtendScript (Adobe automation)
│   │   ├── aeft/           # After Effects scripts
│   │   ├── ppro/           # Premiere Pro scripts
│   │   ├── utils/          # JSX utilities (ES3 compatible)
│   │   └── index.ts        # JSX entry point
│   │
│   ├── shared/             # Shared constants (both environments)
│   ├── assets/             # Templates and static files
│   └── public/             # Public assets
│
├── dist/                   # Build output
├── docs/                   # Documentation
├── cep.config.ts           # CEP extension configuration
├── vite.config.ts          # Frontend build config
├── vite.es.config.ts       # ExtendScript build config
└── tsconfig.json           # TypeScript configuration
```

### Communication Flow

```
┌─────────────────────────────────────────────┐
│  Frontend (CEP Panel)                       │
│  - Svelte Components                        │
│  - User Interface                           │
│  - State Management                         │
└────────────┬────────────────────────────────┘
             │
             │ evalES() / evalTS()
             │ (via bolt.ts)
             ▼
┌─────────────────────────────────────────────┐
│  ExtendScript (Adobe App)                   │
│  - After Effects API                        │
│  - Premiere Pro API                         │
│  - File System Operations                   │
└─────────────────────────────────────────────┘
```

## Development Setup

### Prerequisites
- Node.js 18+
- Bun (package manager)
- Adobe After Effects or Premiere Pro

### Installation

```bash
# Install dependencies
bun install

# Create development symlink to Adobe extensions folder
bun run symlink

# Start development server
bun run dev
```

### Development Commands

```bash
bun run dev         # Start dev server with HMR
bun run watch       # Watch mode (TypeScript + build)
bun run build       # Production build
bun run zxp         # Package as ZXP extension
bun run symlink     # Create development symlinks
```

### Development Workflow

1. **Start dev server**: `bun run dev`
2. **Open Adobe app**: Launch After Effects or Premiere Pro
3. **Open panel**: Window → Extensions → Buck Tools
4. **Make changes**: Edit files in `src/js/` or `src/jsx/`
5. **Hot reload**: Frontend changes reload automatically
6. **JSX changes**: Panel reloads when ExtendScript changes

## Code Standards

### Frontend (src/js/) Standards

#### Component Script Ordering

**Always follow this order in Svelte components:**

```svelte
<script lang="ts">
  // 1. Svelte imports (first)
  import { onMount, getContext } from 'svelte';

  // 2. Third-party library imports
  import { ArrowLeftRight, Save } from 'lucide-svelte';

  // 3. Component imports
  import ButtonGroup from '@/components/ButtonGroup/ButtonGroup.svelte';
  import MenuSelect from '@/components/MultiSelect/MenuSelect.svelte';

  // 4. Store imports
  import { appStore } from '@/stores/app-store';
  import { notifications } from '@/stores/notifications-store';

  // 5. API/Utility imports
  import { evalES } from '@/lib/utils/bolt';
  import { logModule } from '@/lib/logger';

  // 6. Logger setup (always after imports)
  const log = logModule('component-name');

  // 7. Type definitions (interfaces/types used in this component)
  interface SelectItem {
    value: string;
    label: string;
  }

  // 8. Props (exported variables)
  export let title: string = 'Default Title';
  export let onSave: () => void = () => {};

  // 9. Context (if needed)
  const renameContext = getContext('rename');

  // 10. Local state variables
  let selectedMode = 'default';
  let isLoading = false;

  // 11. Reactive declarations ($:)
  $: filteredItems = items.filter(item => item.visible);
  $: log.debug('Mode changed', { mode: selectedMode });

  // 12. Functions (use arrow functions)
  const handleSave = async () => {
    log.debug('Saving data', { selectedMode });
    await evalES(`saveData("${selectedMode}")`);
    notifications.success('Saved successfully');
  };

  const handleCancel = () => {
    log.debug('Cancelled');
  };

  // 13. Lifecycle hooks (last)
  onMount(() => {
    log.debug('Component mounted');
    // Initialization code
  });
</script>

<!-- Markup -->
<div class="container">
  <h2>{title}</h2>
  <button on:click={handleSave}>Save</button>
</div>

<!-- Styles -->
<style lang="scss">
  @use '../../variables.scss' as *;

  .container {
    padding: $spacing-md;
  }
</style>
```

#### Function Declaration Standard

**Always use arrow functions in Svelte components:**

```typescript
// ✅ CORRECT - Arrow function with const
const handleClick = () => {
  console.log('clicked');
};

const handleSubmit = async () => {
  await saveData();
};

// ❌ WRONG - Function declaration
function handleClick() {
  console.log('clicked');
}
```

**Why?** Arrow functions:
- Are consistent with React/modern JS patterns
- Capture `this` lexically (important in Svelte)
- Clearer visual distinction from ExtendScript functions
- Easier to refactor and move around

#### Import Organization

**Group and order imports:**

```typescript
// 1. Svelte imports
import { onMount, createEventDispatcher } from 'svelte';

// 2. Third-party libraries
import { ArrowLeft, Save } from 'lucide-svelte';

// 3. Internal imports (using @ alias, grouped by type)
import Button from '@/components/Button/Button.svelte';
import { appStore } from '@/stores/app-store';
import { evalES } from '@/lib/utils/bolt';
import { logModule } from '@/lib/logger';
import type { ClipMetadata } from '@/types/models';
```

#### Naming Conventions

- **Components**: PascalCase - `ExportContainer.svelte`
- **Variables/Functions**: camelCase - `handleFindAndReplace`, `selectedMode`
- **Types/Interfaces**: PascalCase - `ClipMetadata`, `OnClick`
- **Stores**: camelCase - `appStore`, `bookmarkStore`
- **CSS Classes**: kebab-case - `action-row`, `button-group`
- **Logger Names**: kebab-case - `'export-container'`, `'rename-tool'`

### ExtendScript (src/jsx/) Standards

#### Function Declaration Standard

**Always use function declarations in ExtendScript:**

```typescript
// ✅ CORRECT - Function declaration
export function findAndReplace(find: string, replace: string) {
  var clips = app.project.selection;
  for (var i = 0; i < clips.length; i++) {
    clips[i].name = clips[i].name.replace(find, replace);
  }
}

// ❌ WRONG - Arrow function (not supported in ES3)
export const findAndReplace = (find, replace) => {
  // This will fail in ExtendScript!
};
```

#### ES3 Constraints

**ExtendScript only supports ES3 JavaScript:**

```typescript
// ❌ AVOID - Not supported in ExtendScript
const myVar = 'value';           // Use var instead
let myVar = 'value';             // Use var instead
const myFunc = () => {};         // Use function declarations
[1, 2, 3].forEach(item => {}); // Use for loops
const obj = { key };             // Use { key: key }
`Template ${string}`;            // Use concatenation

// ✅ USE - ES3 compatible
var myVar = 'value';
function myFunc() {}
for (var i = 0; i < array.length; i++) {}
var obj = { key: key };
'String ' + string;
```

#### Type Annotations

**Use TypeScript types even though they're stripped:**

```typescript
// ✅ CORRECT - Typed for development
export function getSequenceInfo(sequenceId: string): SequenceInfo {
  var seq = getSequenceById(sequenceId);
  return {
    name: seq.name,
    duration: seq.duration
  };
}

// Types help with:
// - IDE autocomplete
// - Compile-time checking
// - Documentation
// - Type-safe calls from frontend
```

## Working with Components

### Creating a New Component

1. **Create component file** in appropriate directory:
   - Main views: `src/js/main/[Feature]/ComponentName.svelte`
   - Reusable: `src/js/components/[Category]/ComponentName.svelte`

2. **Follow script ordering** (see Code Standards above)

3. **Use TypeScript** for props and state

4. **Add logger** for debugging

5. **Use stores** for shared state

**Example component:**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { Save } from 'lucide-svelte';
  import Button from '@/components/Button/Button.svelte';
  import { appStore } from '@/stores/app-store';
  import { notifications } from '@/stores/notifications-store';
  import { evalES } from '@/lib/utils/bolt';
  import { logModule } from '@/lib/logger';

  const log = logModule('my-component');

  export let title: string = '';
  export let onComplete: () => void = () => {};

  let isProcessing = false;

  const handleProcess = async () => {
    log.debug('Processing started', { title });
    isProcessing = true;

    try {
      await evalES(`processItems("${title}")`);
      notifications.success('Processing complete');
      onComplete();
    } catch (error) {
      log.error('Processing failed', error);
      notifications.error('Processing failed');
    } finally {
      isProcessing = false;
    }
  };

  onMount(() => {
    log.debug('Component mounted', { title, appId: $appStore.appId });
  });
</script>

<div class="my-component">
  <h3>{title}</h3>
  <Button onClick={handleProcess} disabled={isProcessing}>
    <Save />
    {isProcessing ? 'Processing...' : 'Process'}
  </Button>
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  .my-component {
    padding: $spacing-md;
    background: $color-bg-secondary;
  }
</style>
```

### Component Props Pattern

**Always type props explicitly:**

```typescript
// Simple props
export let title: string = '';
export let count: number = 0;
export let isVisible: boolean = true;

// Callback props (use types from callbacks.ts)
import type { OnClick, OnChange } from '@/types/callbacks';

export let onClick: OnClick = () => {};
export let onChange: OnChange<string> = (value) => {};

// Object props
interface Item {
  id: string;
  name: string;
}

export let items: Item[] = [];
export let selected: Item | null = null;
```

### Event Dispatching

**Use createEventDispatcher with types:**

```typescript
import { createEventDispatcher } from 'svelte';

interface Events {
  select: { id: string; name: string };
  cancel: void;
}

const dispatch = createEventDispatcher<Events>();

const handleSelect = (id: string, name: string) => {
  dispatch('select', { id, name });
};
```

## State Management

### Store Types

We use Svelte stores for state management. Three main patterns:

#### 1. Simple Writable Store

```typescript
// src/js/stores/my-store.ts
import { writable } from 'svelte/store';

export interface MyData {
  name: string;
  count: number;
}

export const myStore = writable<MyData>({
  name: '',
  count: 0
});
```

#### 2. Persistent Store (Local Storage)

```typescript
// src/js/stores/my-persistent-store.ts
import { createLocalStore } from './local-storage';

export interface Settings {
  theme: 'dark' | 'light';
  autoSave: boolean;
}

// Automatically saves to localStorage
export const settingsStore = createLocalStore<Settings>('app-settings', {
  theme: 'dark',
  autoSave: true
});
```

#### 3. Derived Store

```typescript
import { derived } from 'svelte/store';
import { appStore } from './app-store';

// Computed value from other stores
export const isAfterEffects = derived(
  appStore,
  $appStore => $appStore.appId === 'AEFT'
);
```

### Using Stores in Components

```svelte
<script lang="ts">
  import { appStore } from '@/stores/app-store';
  import { notifications } from '@/stores/notifications-store';

  // Read store value (reactive)
  $: appName = $appStore.appId === 'AEFT' ? 'After Effects' : 'Premiere Pro';

  // Update store
  const updateStore = () => {
    appStore.set({
      ...$appStore,
      appId: 'PPRO'
    });
  };

  // Partial update
  const updatePartial = () => {
    appStore.update(store => ({
      ...store,
      showTooltips: true
    }));
  };

  // Show notification
  notifications.success('Operation complete');
  notifications.error('Operation failed', 5000); // Custom duration
</script>

<div>
  <h2>Current App: {appName}</h2>
  <p>Show tooltips: {$appStore.showTooltips}</p>
</div>
```

### Store Initialization Pattern

**Critical**: Some stores depend on CEP environment being ready.

```typescript
// ❌ WRONG - Don't initialize from CEP at module level
import { csi } from '@/lib/utils/bolt';
export const appId = csi.getApplicationID(); // Circular dependency!

// ✅ CORRECT - Initialize in main.svelte after CEP is ready
// app-store.ts
export const appStore = writable<AppStore>({
  appId: '', // Empty initially
  // ... other properties
});

// main.svelte
onMount(() => {
  if (window.cep) {
    // Initialize AFTER CEP is ready
    appStore.set({
      ...$appStore,
      appId: csi.getApplicationID()
    });
  }
});
```

## Logging

### Logger Architecture

The logger is designed for **zero-cost in production**:
- Debug/info logs are completely stripped during build
- Warn/error logs always present
- Structured logging with context objects
- Module-based tagging

### Setting Up Logger

**In every component/module:**

```typescript
import { logModule } from '@/lib/logger';

const log = logModule('module-name'); // Use kebab-case
```

### Using Logger

```typescript
// Debug - Stripped in production
log.debug('Operation started', { userId: 123 }, additionalData);

// Info - Stripped in production
log.info('User action', { action: 'click', target: 'button' });

// Warning - Always logged
log.warn('Deprecated feature used', { feature: 'oldApi' });

// Error - Always logged
log.error('Operation failed', error, { context: 'data' });

// With context object
log.debug(
  'Processing items',
  { count: items.length, type: 'clips' },
  items
);
```

### Log Output Format

```
[HH:MM:SS] [AEFT|PPRO] [LEVEL] [module-name] Message
  └─ Context: { key: value }
  └─ Additional Data: [...]
```

### Logger Best Practices

1. **Use descriptive module names**: `'export-sequence'`, `'clip-card'`
2. **Log important state changes**: User actions, API calls, errors
3. **Use context objects**: Structured data for filtering
4. **Don't log sensitive data**: Passwords, API keys, personal info
5. **Use appropriate levels**:
   - `debug`: Detailed flow information
   - `info`: General informational messages
   - `warn`: Recoverable issues
   - `error`: Unrecoverable errors

### Logger Initialization

**The logger uses the store pattern to avoid circular dependencies:**

```typescript
// logger.ts
import { appStore } from '@/stores/app-store';
import { get } from 'svelte/store';

private formatPrefix(level: string, context?: LogContext): string {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const module = context?.module || 'app';
  const app = get(appStore).appId || 'unknown'; // Use store, not direct csi

  return `[${timestamp}] [${app}] [${level}] [${module}]`;
}
```

**This pattern**:
- Breaks circular dependencies (no `import { csi }` in logger)
- Ensures CEP is ready before accessing appId
- Shows "unknown" for logs before CEP initialization (rare edge case)

## Type Safety

### Path Aliases

Use path aliases for cleaner imports:

```typescript
// tsconfig.json
{
  "paths": {
    "@/*": ["./src/js/*"],          // Frontend code
    "@esTypes/*": ["./src/jsx/*"]   // ExtendScript types
  }
}

// Usage
import { ClipMetadata } from '@/types/models';
import { evalTS } from '@/lib/utils/bolt';
import type { Scripts } from '@esTypes/index';
```

### Type Definition Files

**Callback Types** (`src/js/types/callbacks.ts`):
```typescript
// Generic callbacks
export type OnClick = () => void;
export type OnChange<T> = (value: T) => void;
export type OnSelect<T> = (item: T) => void;

// Specific callbacks
export type ClipSelectCallback = (clip: ClipMetadata) => void;
export type InputChangeHandler = (event: Event) => void;
```

**Model Types** (`src/js/types/models.ts`):
```typescript
export interface ClipMetadata {
  id: string;
  name: string;
  duration: number;
  inPoint: number;
  outPoint: number;
}

export interface Bookmark {
  id: string;
  path: string;
  name: string;
  type: 'file' | 'folder';
}
```

### Type-Safe ExtendScript Calls

**Use `evalTS` for end-to-end type safety:**

```typescript
// Frontend (CEP)
import { evalTS } from '@/lib/utils/bolt';

// ✅ Type-safe call with autocomplete
const result = await evalTS('getActiveSequence');
// result is typed based on JSX return type

// ✅ Type-safe with parameters
const clips = await evalTS('findClips', { name: 'shot' });

// ExtendScript (JSX)
export const getActiveSequence = (): SequenceInfo => {
  return {
    name: app.project.activeSequence.name,
    duration: app.project.activeSequence.duration
  };
};

export const findClips = (options: { name: string }): ClipInfo[] => {
  // Implementation
  return clips;
};
```

### Type Inference

**Let TypeScript infer when possible:**

```typescript
// ✅ Good - Inferred from return type
const getUserName = () => $appStore.userName;

// ❌ Redundant - TypeScript already knows
const getUserName = (): string => $appStore.userName;

// ✅ Explicit when needed - Complex return type
const processData = (): ProcessResult => {
  // Complex logic
  return { success: true, data: [] };
};
```

---

## Additional Resources

- [FRONTEND_PATTERNS.md](./FRONTEND_PATTERNS.md) - Detailed frontend patterns
- [EXTENDSCRIPT_GUIDE.md](./EXTENDSCRIPT_GUIDE.md) - ExtendScript development
- [COMMUNICATION_BRIDGE.md](./COMMUNICATION_BRIDGE.md) - JS ↔ JSX communication
- [COMPONENT_SCRIPT_ORDERING_PLAN.md](./COMPONENT_SCRIPT_ORDERING_PLAN.md) - Component organization

## Getting Help

- Check existing components for patterns
- Use TypeScript autocomplete
- Check console logs in development
- Read JSDoc comments in utility functions
