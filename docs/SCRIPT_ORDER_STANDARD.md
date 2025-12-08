# Component Script Ordering Standard

## Overview

This document defines the **mandatory** ordering for all Svelte component scripts in the Buck Post Tools project. Following this standard ensures:

- **Predictability**: Developers can quickly find what they need
- **Maintainability**: Consistent structure across all components
- **Debuggability**: Initialization order is clear and correct
- **Onboarding**: New developers understand the pattern immediately

## The 14-Section Order

All component `<script>` sections MUST follow this exact order:

```typescript
<script lang="ts">
  // ═══════════════════════════════════════════════════════════
  // 1. SVELTE IMPORTS (Framework core)
  // ═══════════════════════════════════════════════════════════
  import { onMount, createEventDispatcher, getContext } from 'svelte';
  import { writable } from 'svelte/store';

  // ═══════════════════════════════════════════════════════════
  // 2. THIRD-PARTY IMPORTS (External libraries)
  // ═══════════════════════════════════════════════════════════
  import { Save, X } from 'lucide-svelte';

  // ═══════════════════════════════════════════════════════════
  // 3. COMPONENT IMPORTS (UI building blocks)
  // ═══════════════════════════════════════════════════════════
  import Button from '@/components/Button/Button.svelte';
  import SelectFolder from '@/components/SelectFolder/SelectFolder.svelte';

  // ═══════════════════════════════════════════════════════════
  // 4. STORE IMPORTS (State management)
  // ═══════════════════════════════════════════════════════════
  import { appStore } from '@/stores/app-store';
  import { notifications } from '@/stores/notifications-store';

  // ═══════════════════════════════════════════════════════════
  // 5. API/UTILITY IMPORTS (Business logic)
  // ═══════════════════════════════════════════════════════════
  import { evalES, evalTS } from '@/lib/utils/bolt';
  import { path, fs } from '@/lib/cep/node';

  // ═══════════════════════════════════════════════════════════
  // 6. STYLESHEET IMPORT (Component styles)
  // ═══════════════════════════════════════════════════════════
  import './MyComponent.scss';

  // ═══════════════════════════════════════════════════════════
  // 7. LOGGER SETUP (Must be after all imports)
  // ═══════════════════════════════════════════════════════════
  import { logModule } from '@/lib/logger';
  const log = logModule('my-component');

  // ═══════════════════════════════════════════════════════════
  // 8. TYPE DEFINITIONS (Interfaces, types, enums)
  // ═══════════════════════════════════════════════════════════
  interface MyData {
    id: string;
    name: string;
  }

  type Status = 'idle' | 'processing' | 'complete';

  // ═══════════════════════════════════════════════════════════
  // 9. PROPS (Component public API - export let)
  // ═══════════════════════════════════════════════════════════
  export let title: string = 'Default Title';
  export let onSave: (data: MyData) => void = () => {};

  // ═══════════════════════════════════════════════════════════
  // 10. CONTEXT (If using Svelte context)
  // ═══════════════════════════════════════════════════════════
  const myContext = getContext('my-context');

  // ═══════════════════════════════════════════════════════════
  // 11. LOCAL STATE (Component internal state)
  // ═══════════════════════════════════════════════════════════
  let status: Status = 'idle';
  let data: MyData[] = [];
  let selectedId: string | null = null;

  // ═══════════════════════════════════════════════════════════
  // 12. REACTIVE DECLARATIONS ($:)
  // ═══════════════════════════════════════════════════════════
  $: isProcessing = status === 'processing';
  $: canSave = data.length > 0 && !isProcessing;
  $: selectedItem = data.find(item => item.id === selectedId);

  // ═══════════════════════════════════════════════════════════
  // 13. FUNCTIONS (Component methods - arrow functions)
  // ═══════════════════════════════════════════════════════════
  const handleSave = async () => {
    log.debug('Saving data', { count: data.length });
    status = 'processing';

    try {
      await onSave(selectedItem);
      status = 'complete';
    } catch (error) {
      log.error('Save failed', error);
      status = 'idle';
    }
  };

  const handleCancel = () => {
    log.debug('Operation cancelled');
    selectedId = null;
  };

  // ═══════════════════════════════════════════════════════════
  // 14. LIFECYCLE HOOKS (Last - initialization)
  // ═══════════════════════════════════════════════════════════
  onMount(() => {
    log.debug('Component mounted', { title });
    // Initialization logic here
  });
</script>
```

## Why This Order?

### 1. Svelte Imports First
Framework core must be available before anything else uses it.

### 2. Third-Party Before Internal
External dependencies are loaded before our own code can use them.

### 3. Components Before Stores
UI building blocks are available before state management needs them.

### 4. Stores Before APIs
State management is set up before business logic that depends on it.

### 5. Stylesheet Import Early
Styles load early for proper cascade and to avoid FOUC.

### 6. Logger After All Imports
Logger needs all dependencies loaded to function correctly.

### 7. Types Before Usage
TypeScript needs definitions before they're referenced.

### 8. Props Before State
Public API is defined before internal state that may depend on it.

### 9. Context After Props
Context may depend on props being defined.

### 10. State Before Reactive
Variables must exist before computations reference them.

### 11. Reactive Before Functions
Computed values are available for functions to use.

### 12. Functions Before Lifecycle
Methods must be defined before initialization code calls them.

### 13. Lifecycle Last
Initialization runs after everything is properly defined.

## Critical Rules

### ❌ NEVER Do This

```typescript
// BAD: Reactive logging causes infinite loops
$: log.debug('Value changed', { value });

// BAD: Accessing stores at module level
const appId = $appStore.appId; // May be undefined!

// BAD: Function declarations
function handleClick() { } // Use arrow functions

// BAD: Reactive block with assignments and logging
$: {
  log.debug('Reactive triggered'); // Creates infinite loop!
  value = computeValue();
}
```

### ✅ ALWAYS Do This

```typescript
// GOOD: One-time logging in lifecycle
onMount(() => {
  log.debug('Initial value', { value });
});

// GOOD: Accessing stores in onMount or functions
onMount(() => {
  const appId = $appStore.appId; // Safe, initialized
});

// GOOD: Arrow functions
const handleClick = () => { };

// GOOD: Reactive computation only, logging elsewhere
$: computedValue = computeValue();
```

## Component Initialization Pattern

For components that depend on CEP data (`$appStore.appId`), always initialize in `onMount`:

```typescript
<script lang="ts">
  import { onMount } from 'svelte';
  import { appStore } from '@/stores/app-store';
  import { logModule } from '@/lib/logger';

  const log = logModule('my-component');

  let data: string[] = [];
  let selectedItem: string | undefined = undefined;

  // ❌ DON'T: Reactive block runs before appId is set
  // $: {
  //   if ($appStore.appId) {
  //     selectedItem = data[0];
  //   }
  // }

  // ✅ DO: Initialize in onMount after appId is set
  onMount(() => {
    log.debug('Component mounted', { appId: $appStore.appId });

    if ($appStore.appId === 'AEFT') {
      data = ['Option 1', 'Option 2'];
      selectedItem = data[0];
    }
  });
</script>
```

## Quick Checklist

Before committing any component, verify:

- [ ] Script sections follow the 14-section order
- [ ] No reactive blocks with `log.debug()` calls
- [ ] No module-level store access (use `onMount` or functions)
- [ ] All functions use arrow syntax (`const fn = () => {}`)
- [ ] CEP-dependent initialization is in `onMount`
- [ ] Logger is initialized after all imports
- [ ] Stylesheet is imported before logger
- [ ] Types are defined before they're used
- [ ] Lifecycle hooks are last

## Migration Guide

When refactoring existing components:

1. **Identify**: Find all components violating the order
2. **Extract**: Pull out sections into the 14 categories
3. **Reorder**: Place sections in the correct order
4. **Fix**: Remove reactive logging, convert function declarations
5. **Test**: Verify component still works correctly
6. **Commit**: Each component refactor is one commit

## Exceptions

There are **NO exceptions** to this rule. Every component must follow this order, period.

If you think you need an exception, you probably need to:
- Refactor the component
- Split it into smaller components
- Move logic to a utility function
- Rethink your approach

## Enforcement

This standard is enforced through:
- Code reviews (reviewers check section order)
- Documentation (this file is the source of truth)
- Linting (future: automated checks)
- Team agreement (all devs commit to following it)

## Examples

See these components for reference implementations:
- `src/js/main/Export/ExportContainer.svelte` ✅ Correct order
- `docs/FRONTEND_PATTERNS.md` - Full examples with explanations
