# Buck Post Tools CEP - Refactoring Plan

## Executive Summary

This is a mature Adobe CEP extension built with Svelte/TypeScript/Vite comprising 20,487 lines of code across 68 Svelte components and 8 main views. The architecture is solid, but there are significant consistency issues affecting maintainability.

---

## Key Findings

### 🔴 Critical Issues

| Issue | Scope | Impact |
|-------|-------|--------|
| Loose TypeScript typing | 50+ `any` types, 19 `@ts-ignore` | Hard refactoring, runtime bugs |
| `Function` type everywhere | 20+ callback props | No IDE support, no type safety |
| Scattered error handling | 48 try-catch blocks, 263 console.logs | Inconsistent UX, hidden failures |

### 🟡 Moderate Issues

| Issue | Scope | Impact |
|-------|-------|--------|
| Path aliases unused | All imports use `../../` | Painful refactoring |
| Inconsistent component structure | Varied script ordering | Harder to maintain patterns |
| Store patterns vary | 4 different approaches | Unpredictable state management |
| Orphaned CSS | ProgressBar, Chip, Toast | Dead code, maintenance burden |

---

## Specific Examples

### Type Safety Problems

```typescript
// ❌ Current (poor)
export let clip: any;
export let onChange: Function = () => {};

// ✅ Should be
export let clip: ClipMetadata;
export let onChange: (value: string) => void = () => {};
```

### Import Inconsistency

```typescript
// ❌ Current - relative paths everywhere
import { openFile } from '../../lib/utils/utils';

// ✅ Should be (tsconfig has aliases defined but unused)
import { openFile } from '@/lib/utils';
```

---

## Improvement Plan

### Phase 1: Type Safety Foundation (High Priority)

| Task | Files Affected | Effort | Status |
|------|---------------|--------|--------|
| Create `src/js/types/models.ts` with Clip, Version, Project interfaces | New file | Low | ⬜ Pending |
| Create `src/js/types/callbacks.ts` with typed callback signatures | New file | Low | ⬜ Pending |
| Replace `Function` types in components | ~20 components | Medium | ⬜ Pending |
| Replace `any` types with proper interfaces | ~50 locations | Medium | ⬜ Pending |
| Enable `strictNullChecks: true` in tsconfig | 1 file + fixes | Medium | ⬜ Pending |

#### Detailed Sub-tasks

**1. Create Core Type Definitions**

Create `src/js/types/models.ts`:

```typescript
// Clip and Version types
export interface ClipMetadata {
  name: string;
  path: string;
  version: number;
  // ... add other clip properties
}

export interface VersionInfo {
  number: number;
  date: string;
  author: string;
}

export interface ProjectSettings {
  name: string;
  path: string;
  // ... add other project properties
}

// Expression types
export interface ExpressionSnippet {
  id: string;
  values: ExpressionValues;
  favorite?: boolean;
}

export interface ExpressionValues {
  Name: string;
  Expression: string;
  Variables: string[];
  Creator: string;
  Description: string;
  Property?: string;
}

// Export types
export interface ExportPreset {
  name: string;
  template: string;
}

export interface Exporter {
  name: string;
  type: string;
  settings: Record<string, any>;
}
```

**2. Create Callback Type Helpers**

Create `src/js/types/callbacks.ts`:

```typescript
// Generic callback types
export type OnChange<T> = (value: T) => void;
export type OnSelect<T> = (item: T) => void;
export type OnClick = () => void;
export type OnUpdate<T> = (item: T) => void;
export type OnSubmit = (data: Record<string, any>) => void | Promise<void>;

// Specific callback types
export type ClipChangeCallback = OnChange<ClipMetadata>;
export type ExpressionSelectCallback = OnSelect<ExpressionSnippet>;
export type BookmarkUpdateCallback = OnUpdate<string>;
```

**3. Component Update Template**

Use this as a reference when updating components:

```typescript
// Before
export let clip: any;
export let onChange: Function = () => {};

// After
import type { ClipMetadata } from '@/types/models';
import type { ClipChangeCallback } from '@/types/callbacks';

export let clip: ClipMetadata;
export let onChange: ClipChangeCallback = () => {};
```

---

### Phase 2: Code Organization (Medium Priority)

| Task | Files Affected | Effort | Status |
|------|---------------|--------|--------|
| Enable and use path aliases (`@/components`, `@/api`, etc.) | All imports | Medium | ✅ **COMPLETED** |
| Create centralized `lib/logger.ts` | New + 339 console.log replacements | Medium | 🔄 **IN PROGRESS (100/339)** |
| Create `lib/error-handler.ts` wrapper | New + 48 try-catch refactors | Medium | ⬜ Pending |
| Remove orphaned CSS in ProgressBar, Chip, Toast | 3 components | Low | ⬜ Pending |

#### Detailed Sub-tasks

**1. Path Aliases** ✅ **COMPLETED**

- ✅ Updated `vite.config.ts` with path aliases
- ✅ Updated `tsconfig.json` with matching path aliases
- ✅ Updated `tsconfig-build.json` with `@/*` path
- ✅ Replaced relative imports in 73+ files
- ✅ Verified build passes

**2. Centralized Logger** 🔄 **IN PROGRESS (100/339 statements migrated)**

✅ **COMPLETED:**
- Created `src/js/lib/logger.ts` with custom zero-dependency logger
- Created `src/js/lib/logger.example.ts` with usage examples
- Configured Vite Terser to strip `console.log/debug/info` in production (vite.config.ts)
- Created `LOGGER_DECISION.md` documenting the decision to use custom logger vs Pino
- Created `LOGGER_MIGRATION_STATUS.md` tracking migration progress

**Migration Progress:**
- ✅ **Phase 1** (36 statements): Critical path files (clip.ts, exporter.ts, aquarium-store.ts, timeline-clips.ts, sequence.ts, buck-library.ts)
- ✅ **Phase 2** (8 statements): File browsers (buck-file-browser.ts, file-explorer.ts) + Buck5 API (buck5-api.ts)
- ✅ **Phase 3** (56 statements): Video processing (video.ts, fcp-xml-to-csv.ts - strategic CLI migration)
- ⬜ **Remaining** (~239 statements): Components and utility files

**Production Benefits:**
- Debug logs completely stripped from production builds via Terser
- Bundle size reduced (~10KB uncompressed, ~6KB gzipped)
- Structured logging with module tagging and context objects
- Error logs preserved for production debugging

Usage example:

```typescript
// Before
console.log('Fetching expressions...', data);

// After
import { logModule } from '@/lib/logger';
const log = logModule('expressions');
log.debug('Fetching expressions', { count: data.length }, data);
```

See [LOGGER_MIGRATION_STATUS.md](LOGGER_MIGRATION_STATUS.md) for detailed progress.

**3. Error Handler**

Create `src/js/lib/error-handler.ts`:

```typescript
import { apiLogger } from './logger';

export interface ErrorHandlerOptions {
  showToUser?: boolean;
  userMessage?: string;
  logError?: boolean;
  rethrow?: boolean;
}

/**
 * Centralized error handling wrapper
 */
export async function handleError<T>(
  operation: () => Promise<T>,
  context: string,
  options: ErrorHandlerOptions = {}
): Promise<T | null> {
  const {
    showToUser = true,
    userMessage,
    logError = true,
    rethrow = false
  } = options;

  try {
    return await operation();
  } catch (error) {
    if (logError) {
      apiLogger.error(`Error in ${context}`, error);
    }

    if (showToUser) {
      const message = userMessage || `An error occurred: ${context}`;
      // TODO: Replace with your toast/notification system
      console.error(message);
    }

    if (rethrow) {
      throw error;
    }

    return null;
  }
}

/**
 * Sync version of error handler
 */
export function handleErrorSync<T>(
  operation: () => T,
  context: string,
  options: ErrorHandlerOptions = {}
): T | null {
  const {
    showToUser = true,
    userMessage,
    logError = true,
    rethrow = false
  } = options;

  try {
    return operation();
  } catch (error) {
    if (logError) {
      apiLogger.error(`Error in ${context}`, error);
    }

    if (showToUser) {
      const message = userMessage || `An error occurred: ${context}`;
      console.error(message);
    }

    if (rethrow) {
      throw error;
    }

    return null;
  }
}
```

Usage example:

```typescript
// Before
try {
  const data = await fetchData();
  return data;
} catch (error) {
  console.error('Failed to fetch data', error);
  return null;
}

// After
import { handleError } from '@/lib/error-handler';

return await handleError(
  () => fetchData(),
  'fetching data',
  { userMessage: 'Failed to load data. Please try again.' }
);
```

**4. Remove Orphaned CSS**

Files to clean up:
- `src/js/components/ProgressBar/ProgressBar.svelte`
- `src/js/components/Chip/Chip.svelte`
- `src/js/components/Toast/Toast.svelte`

Remove unused CSS selectors identified by Svelte compiler warnings.

---

### Phase 3: Pattern Standardization (Lower Priority)

| Task | Files Affected | Effort | Status |
|------|---------------|--------|--------|
| Standardize component script ordering | 68 components | Medium | ⬜ Pending |
| Unify store creation pattern (factory approach) | 8 stores | Medium | ⬜ Pending |
| Extract duplicate file versioning logic | Multiple API files | Low | ⬜ Pending |
| Abstract localStorage persistence patterns | local-storage.ts | Low | ⬜ Pending |

#### Detailed Sub-tasks

**1. Component Script Ordering Standard**

Establish this order for all Svelte components:

```svelte
<script lang="ts">
  // 1. Type imports (from '@/types')
  import type { ClipMetadata } from '@/types/models';
  import type { OnChange } from '@/types/callbacks';

  // 2. Third-party imports
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';

  // 3. Local component imports
  import Button from '@/components/Button/Button.svelte';

  // 4. Store imports
  import { appStore } from '@/stores/app-store';

  // 5. API/Utility imports
  import { evalES } from '@/lib/utils/bolt';
  import { apiLogger } from '@/lib/logger';

  // 6. Props (export let)
  export let clip: ClipMetadata;
  export let onChange: OnChange<string> = () => {};

  // 7. Local state
  let isLoading = false;
  let selectedId = '';

  // 8. Reactive declarations ($:)
  $: isValid = clip.name.length > 0;

  // 9. Functions
  function handleClick() {
    // ...
  }

  // 10. Lifecycle
  onMount(() => {
    // ...
  });
</script>
```

**2. Unified Store Pattern**

Create a factory function in `src/js/stores/store-factory.ts`:

```typescript
import { writable, Writable } from 'svelte/store';
import type { Readable } from 'svelte/store';

export interface StoreOptions<T> {
  initialValue: T;
  persistKey?: string;
  onUpdate?: (value: T) => void;
}

export function createStore<T>(options: StoreOptions<T>): Writable<T> {
  const { initialValue, persistKey, onUpdate } = options;

  // Load from localStorage if persistKey provided
  let initial = initialValue;
  if (persistKey && typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(persistKey);
    if (stored) {
      try {
        initial = JSON.parse(stored);
      } catch (e) {
        console.warn(`Failed to parse stored value for ${persistKey}`);
      }
    }
  }

  const store = writable<T>(initial);

  // Subscribe to changes
  if (persistKey || onUpdate) {
    store.subscribe((value) => {
      if (persistKey && typeof localStorage !== 'undefined') {
        localStorage.setItem(persistKey, JSON.stringify(value));
      }
      if (onUpdate) {
        onUpdate(value);
      }
    });
  }

  return store;
}
```

**3. File Versioning Logic**

Extract duplicate versioning code into `src/js/lib/versioning.ts`:

```typescript
import { fs, path } from '@/lib/cep/node';

export interface VersionedFile {
  baseName: string;
  extension: string;
  version: number;
  fullPath: string;
}

/**
 * Parse version number from filename
 */
export function parseVersion(filename: string): VersionedFile {
  // Common patterns: file_v001.ext, file.v001.ext, file_001.ext
  const patterns = [
    /^(.+)_v(\d+)(\.\w+)$/,
    /^(.+)\.v(\d+)(\.\w+)$/,
    /^(.+)_(\d+)(\.\w+)$/,
  ];

  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match) {
      return {
        baseName: match[1],
        extension: match[3],
        version: parseInt(match[2], 10),
        fullPath: filename
      };
    }
  }

  // No version found
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  return {
    baseName: base,
    extension: ext,
    version: 0,
    fullPath: filename
  };
}

/**
 * Generate next version filename
 */
export function getNextVersion(
  currentPath: string,
  padding: number = 3
): string {
  const dir = path.dirname(currentPath);
  const filename = path.basename(currentPath);
  const parsed = parseVersion(filename);

  const nextVersion = parsed.version + 1;
  const versionStr = String(nextVersion).padStart(padding, '0');
  const newFilename = `${parsed.baseName}_v${versionStr}${parsed.extension}`;

  return path.join(dir, newFilename);
}
```

**4. localStorage Persistence Patterns**

Refactor `src/js/stores/local-storage.ts` to use a consistent pattern:

```typescript
import { writable } from 'svelte/store';
import type { Writable } from 'svelte/store';

/**
 * Creates a writable store that persists to localStorage
 */
export function persistedStore<T>(
  key: string,
  initialValue: T
): Writable<T> {
  // Check if we're in a browser environment
  const isBrowser = typeof localStorage !== 'undefined';

  // Load initial value from localStorage
  let stored = initialValue;
  if (isBrowser) {
    const item = localStorage.getItem(key);
    if (item) {
      try {
        stored = JSON.parse(item);
      } catch (e) {
        console.warn(`Failed to parse localStorage item: ${key}`);
      }
    }
  }

  const store = writable<T>(stored);

  // Subscribe to changes and persist
  if (isBrowser) {
    store.subscribe((value) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  }

  return store;
}
```

---

## Recommended Immediate Actions

### Quick Wins (Do First)

1. ✅ **Enable path aliases** (Phase 2, Task 1) - COMPLETED
2. 🔄 **Create centralized logger** (Phase 2, Task 2) - IN PROGRESS (100/339 migrated)
3. ⬜ Create callback type helpers (Phase 1, Task 2)
4. ⬜ Create error handler wrapper (Phase 2, Task 3)

### High-Impact Changes

5. Update 5-10 components as templates using new types
6. Replace `Function` types with typed callbacks in updated components
7. Replace `any` types with proper interfaces in updated components

### Gradual Rollout

8. Use new patterns for all new code going forward
9. Refactor existing components incrementally
10. Document patterns in `CLAUDE.md` for consistency

---

## Consistency Scorecard

| Aspect | Current | Target | Status |
|--------|---------|--------|--------|
| **Type Safety** | 🔴 40% | 🟢 95% | ⬜ In Progress |
| **Naming Conventions** | 🟡 85% | 🟢 100% | ⬜ Pending |
| **Component Structure** | 🟡 70% | 🟢 95% | ⬜ Pending |
| **Error Handling** | 🔴 30% | 🟢 90% | ⬜ Pending |
| **Import Consistency** | 🟠 60% | 🟢 100% | ✅ **COMPLETED** |

---

## Progress Tracking

### Completed ✅

- [x] Phase 2, Task 1: Path aliases enabled and used throughout codebase (73+ files)
- [x] Fixed `tsconfig-build.json` to include `@/*` path alias
- [x] Verified build passes with new import structure
- [x] Phase 2, Task 2 (Partial): Logger infrastructure complete
  - Custom logger implementation ([logger.ts](src/js/lib/logger.ts))
  - Production optimization configured (Terser strips debug logs)
  - Migration documentation created
  - 100 console statements migrated (29.5% complete)

### In Progress 🔄

- [ ] Phase 2, Task 2: Complete logger migration (239 statements remaining)
  - Focus on high-impact API files next
  - Components can be batch-migrated later
  - See [LOGGER_MIGRATION_STATUS.md](LOGGER_MIGRATION_STATUS.md) for details

### Pending ⬜

- [ ] Phase 1: Type Safety Foundation (all tasks)
- [ ] Phase 2, Task 3-4: Error handler, CSS cleanup
- [ ] Phase 3: All standardization tasks

---

## Notes

- **Incremental approach recommended**: Don't try to refactor everything at once
- **New code first**: Apply new patterns to new features, then gradually update existing code
- **Component templates**: Create 2-3 "gold standard" components as references
- **Document patterns**: Update `CLAUDE.md` with agreed-upon patterns as you establish them
- **Build verification**: Run `bun run build` after each major change phase

---

## Related Files

- `/CLAUDE.md` - Project development guidelines
- `/tsconfig.json` - TypeScript configuration with path aliases
- `/vite.config.ts` - Vite build configuration

---

**Last Updated**: December 6, 2024
**Status**: Phase 1 - Type Safety Foundation (Ready to Start)
**Next Action**: Create `src/js/types/models.ts` and `src/js/types/callbacks.ts`
