# localStorage Persistence Pattern - Refactoring Plan

**Status:** ⬜ Pending (Phase 3)
**Priority:** Low
**Last Updated:** December 8, 2024

## Current Implementation Analysis

### Existing Code: [local-storage.ts](../src/js/stores/local-storage.ts)

**Current Implementation Rating: 8/10** ✅

The current implementation is already quite solid with good patterns in place:

#### ✅ Strengths

1. **Type-safe Generic Implementation**
   - `createLocalStore<T>()` factory function with full TypeScript generics
   - All stores properly typed

2. **Automatic Persistence**
   - Store subscription automatically saves to localStorage
   - No manual save calls needed in components

3. **Error Handling with Logging**
   - `safeLoad<T>()` helper with try-catch
   - Integration with structured logger (`logModule`)
   - Graceful fallback to initial values

4. **Clear Documentation**
   - JSDoc comments on all functions and stores
   - Descriptive store names and purposes

5. **Consistent Pattern**
   - All 14 stores use the same `createLocalStore` pattern
   - No ad-hoc localStorage access scattered in components

#### Current Store Inventory (14 stores)

```typescript
// User & Project
userSession: BUCK5.UserData | null
sessionProject: string
storedProject: string (legacy, non-reactive)

// Tracker Integration
trackerType: string
codaDoc: string
codaTable: string

// Export Paths
stillOutputFolder: string (Premiere Pro)
sequenceOutputFolder: string
lastFolderSearch: string
lastFolderExport: string
storedExportRootFolder: string

// Export Settings
exportPresets: string
selectedExportPreset: any
storedExportSettings: string

// Application State
localAppStore: AppStore
```

## Proposed Enhancements

### Priority 1: High Value Additions

#### 1.1 Add `clearLocalStore` Helper

**Purpose:** Reset stores to initial values (logout, reset flows)

```typescript
/**
 * Clear a localStorage key and reset store to initial value
 * @param key - localStorage key
 * @param store - Store to reset
 * @param initialValue - Value to reset to
 */
export const clearLocalStore = <T>(
  key: string,
  store: Writable<T>,
  initialValue: T
): void => {
  try {
    localStorage.removeItem(key);
    store.set(initialValue);
    log.debug(`Cleared localStorage key: ${key}`, { key });
  } catch (error) {
    log.error(`Failed to clear ${key} from localStorage`, error as Error, { key });
  }
};
```

**Use Cases:**
- User logout (clear `userSession`)
- Reset to defaults functionality
- Testing/debugging

**Effort:** Low (30 minutes)

#### 1.2 Add `migrateStorageKey` Helper

**Purpose:** Handle version upgrades and key renames

```typescript
/**
 * Migrate data from old localStorage key to new key
 * @param oldKey - Old localStorage key
 * @param newKey - New localStorage key
 * @returns Success boolean
 */
export const migrateStorageKey = (oldKey: string, newKey: string): boolean => {
  try {
    const oldData = localStorage.getItem(oldKey);
    if (oldData) {
      localStorage.setItem(newKey, oldData);
      localStorage.removeItem(oldKey);
      log.debug(`Migrated storage key`, { from: oldKey, to: newKey });
      return true;
    }
    return false;
  } catch (error) {
    log.error(`Failed to migrate storage key`, error as Error, {
      from: oldKey,
      to: newKey
    });
    return false;
  }
};
```

**Use Cases:**
- Refactoring storage keys (e.g., `codadoc` → `coda_document_id`)
- Version upgrades with schema changes
- Backward compatibility during refactoring

**Effort:** Low (30 minutes)

### Priority 2: Medium Value Additions

#### 2.1 Extract `safeSave` Helper

**Purpose:** Reusable save function for one-off saves

```typescript
/**
 * Helper to safely save data to localStorage
 * @param key - localStorage key
 * @param value - Value to save
 * @returns Success boolean
 */
const safeSave = <T>(key: string, value: T): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    log.error(`Failed to save ${key} to localStorage`, error as Error, { key });
    return false;
  }
};
```

**Benefits:**
- Consistent error handling pattern
- Can be used by components that need manual saves
- Better code organization (DRY principle)

**Effort:** Low (20 minutes)

#### 2.2 Add `createSessionStore` Factory

**Purpose:** Temporary data that shouldn't persist across browser sessions

```typescript
/**
 * Create a writable store that persists to sessionStorage
 * @param key - sessionStorage key
 * @param initialValue - Default value if sessionStorage is empty
 * @returns Writable store synced with sessionStorage
 */
export function createSessionStore<T>(
  key: string,
  initialValue: T
): Writable<T> {
  // Load initial value from sessionStorage
  const storedValue = safeLoad<T>(key, true); // Pass flag for sessionStorage
  const store = writable<T>(storedValue ?? initialValue);

  // Subscribe to changes and update sessionStorage
  store.subscribe((value) => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      log.error(`Failed to save ${key} to sessionStorage`, error as Error, { key });
    }
  });

  return store;
}
```

**Use Cases:**
- Temporary UI state (modal open/close, active tab)
- Form draft data
- Non-sensitive session-only data

**Effort:** Medium (1 hour - requires updating `safeLoad` to support sessionStorage)

### Priority 3: Low Priority (Future Enhancements)

#### 3.1 Add `createValidatedLocalStore` Factory

**Purpose:** Runtime schema validation for complex data structures

```typescript
/**
 * Create a validated local store with schema checking
 * @param key - localStorage key
 * @param initialValue - Default value
 * @param validator - Validation function (type guard)
 * @returns Writable store with validation
 */
export function createValidatedLocalStore<T>(
  key: string,
  initialValue: T,
  validator: (value: any) => value is T
): Writable<T> {
  const storedValue = safeLoad<any>(key);
  const validValue = storedValue && validator(storedValue)
    ? storedValue
    : initialValue;

  const store = writable<T>(validValue);

  store.subscribe((value) => {
    if (validator(value)) {
      safeSave(key, value);
    } else {
      log.warn(`Invalid data not saved to ${key}`, { key, value });
    }
  });

  return store;
}
```

**Use Cases:**
- Complex data structures (e.g., `AppStore` with many nested properties)
- Preventing corrupt data from localStorage
- Schema migrations with version checks

**When to Implement:** Only if data corruption becomes an issue

**Effort:** Medium-High (2-3 hours - requires writing validators)

#### 3.2 Add `clearAllLocalStorage` Bulk Operation

**Purpose:** Clear all app stores at once

```typescript
/**
 * Clear all application localStorage keys
 * @param prefix - Optional key prefix filter (e.g., 'buck-')
 */
export const clearAllLocalStorage = (prefix?: string): void => {
  try {
    const appKeys = [
      'user', 'localProject', 'trackertype', 'codadoc', 'codatable',
      'stillfolder', 'sequencefolder', 'aeexportpresets',
      'selectedExportPresets', 'lastfoldersearch', 'lastfolderexport',
      'exportsettings', 'exportrootfolder', 'localappstore'
    ];

    const keys = Object.keys(localStorage);
    const keysToRemove = prefix
      ? keys.filter(k => k.startsWith(prefix))
      : appKeys;

    keysToRemove.forEach(key => localStorage.removeItem(key));
    log.debug(`Cleared ${keysToRemove.length} localStorage keys`, {
      count: keysToRemove.length
    });
  } catch (error) {
    log.error(`Failed to clear localStorage`, error as Error);
  }
};
```

**Use Cases:**
- Testing/debugging (reset all app state)
- User data cleanup on uninstall
- "Factory reset" feature

**When to Implement:** Only if needed for testing or user-facing feature

**Effort:** Low (30 minutes)

## Implementation Recommendations

### Recommended Approach: **Option A - Minimal Changes**

The current implementation is already quite good. Add only the high-value helpers:

1. ✅ Keep current `createLocalStore` pattern (it's working well)
2. ➕ Add `clearLocalStore` helper (useful for logout/reset)
3. ➕ Add `migrateStorageKey` helper (future-proofing for refactoring)
4. ➕ Extract `safeSave` for consistency
5. 📚 Update documentation with usage examples

**Total Effort:** ~2 hours
**Risk:** Very Low
**Value:** High (future-proofing without over-engineering)

### Alternative Options

#### Option B: Comprehensive Enhancement
- Implement all Priority 1-3 enhancements
- Add full test coverage
- Create detailed documentation
- **Effort:** 8-10 hours
- **Risk:** Medium (may add unnecessary complexity)
- **When to use:** If data corruption or complex state management becomes an issue

#### Option C: Extract to Separate Package
- Create `@buck/svelte-storage` package
- Make it reusable across projects
- Publish internally or to npm
- **Effort:** 16+ hours
- **Risk:** High (maintenance burden)
- **When to use:** If multiple projects need the same pattern

## Usage Examples

### Current Pattern (Already Working Well)

```typescript
// Creating a store
export const myStore = createLocalStore<string>('my-key', 'default-value');

// Using in component
import { myStore } from '@/stores/local-storage';

// Read
$: currentValue = $myStore;

// Write (automatically persists)
myStore.set('new-value');
```

### Proposed Pattern with New Helpers

```typescript
// Logout flow - clear user session
import { userSession, clearLocalStore } from '@/stores/local-storage';

const handleLogout = () => {
  clearLocalStore('user', userSession, null);
};

// Refactoring - migrate old key to new key
import { migrateStorageKey } from '@/stores/local-storage';

// Run once on app startup
migrateStorageKey('codadoc', 'coda_document_id');
```

## Breaking Changes

**None.** All proposed enhancements are additive. Existing code continues to work exactly as before.

## Testing Strategy

1. **Manual Testing**
   - Test `clearLocalStore` with user logout flow
   - Test `migrateStorageKey` with dummy data
   - Verify localStorage state in browser DevTools

2. **Unit Tests** (Optional, low priority)
   - Mock localStorage API
   - Test error handling paths
   - Verify JSON serialization/deserialization

3. **Integration Tests** (Optional, low priority)
   - Test store persistence across page refresh
   - Test migration scenarios

## Migration Path

### Phase 1: Add High-Value Helpers (Recommended)

1. Add `clearLocalStore` function to `local-storage.ts`
2. Add `migrateStorageKey` function to `local-storage.ts`
3. Extract `safeSave` helper (refactor existing code)
4. Update JSDoc documentation
5. Test in development

**Files Changed:** 1 file (`local-storage.ts`)
**Risk:** Very Low
**Estimated Time:** 2 hours

### Phase 2: Add Medium-Value Helpers (If Needed)

Only proceed if there's a clear use case:

1. Add `createSessionStore` factory
2. Update `safeLoad` to support sessionStorage
3. Create example usage in components
4. Document patterns in `FRONTEND_PATTERNS.md`

**Files Changed:** 2 files (`local-storage.ts`, `FRONTEND_PATTERNS.md`)
**Risk:** Low
**Estimated Time:** 2-3 hours

### Phase 3: Advanced Features (Future)

Only if data corruption or complex validation becomes necessary:

1. Add `createValidatedLocalStore` factory
2. Write validator functions for complex types
3. Add comprehensive test coverage
4. Document validation patterns

**Files Changed:** 3+ files (store file, validators, tests)
**Risk:** Medium
**Estimated Time:** 4-6 hours

## Decision: Wait or Proceed?

### ✅ Proceed Now (Recommended)
- Implement Priority 1 helpers (`clearLocalStore`, `migrateStorageKey`)
- Extract `safeSave` for consistency
- Low effort, high future value

### ⏸️ Wait Until Needed
- `createSessionStore` - only if temporary state becomes a problem
- `createValidatedLocalStore` - only if data corruption occurs
- `clearAllLocalStorage` - only if testing/reset feature needed

## Conclusion

**Current Implementation Score: 8/10** - Already very good!

**Recommendation:** Implement Priority 1 enhancements only (2 hours effort). The current pattern is clean and working well. Adding `clearLocalStore` and `migrateStorageKey` provides future-proofing without over-engineering.

**Next Steps:**
1. Review this plan
2. Decide on implementation approach
3. If approved, implement Priority 1 helpers
4. Update documentation
5. Test in development

---

**Related Documents:**
- [REFACTORING_PLAN.md](REFACTORING_PLAN.md) - Phase 3: Pattern Standardization
- [FRONTEND_PATTERNS.md](FRONTEND_PATTERNS.md) - Store patterns and best practices
- [local-storage.ts](../src/js/stores/local-storage.ts) - Current implementation
