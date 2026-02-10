# Type Definitions

This directory contains all TypeScript type definitions for Buck Post Tools CEP.

## Files

- **`models.ts`** - Core data models (clips, expressions, exports, projects, etc.)
- **`callbacks.ts`** - Typed callback functions for component props
- **`stores.ts`** - Svelte store state types
- **`api.ts`** - API request/response types
- **`index.ts`** - Central export point for all types

## Usage

### Importing Types

```typescript
// Import from index for convenience
import type { ClipMetadata, OnChange, AppStore } from '@/types';

// Or import from specific modules
import type { ClipMetadata } from '@/types/models';
import type { OnChange } from '@/types/callbacks';
import type { AppStore } from '@/types/stores';
```

### Using Types in Components

#### Replace `any` with proper types

```typescript
// ❌ Before
export let clip: any;
export let onChange: Function = () => {};

// ✅ After
import type { ClipMetadata, OnChange } from '@/types';

export let clip: ClipMetadata;
export let onChange: OnChange<ClipMetadata> = () => {};
```

#### Typing callbacks

```typescript
import type { OnSelect, ExpressionSnippet } from '@/types';

export let onSelect: OnSelect<ExpressionSnippet>;

const handleSelect = (expression: ExpressionSnippet) => {
  if (onSelect) {
    onSelect(expression);
  }
};
```

#### Typing stores

```typescript
import type { AppStore } from '@/types';
import { appStore } from '@/stores/app-store';

$: settings: AppStore = $appStore;
```

### Using Types in API Functions

```typescript
import type { ApiResponse, FileInfo } from '@/types';

export async function getFileInfo(path: string): Promise<ApiResponse<FileInfo>> {
  const response = await fetch(`/api/files/${path}`);
  return response.json();
}
```

### Creating Custom Types

If you need a type that doesn't exist yet:

1. **Add it to the appropriate file**:
   - Data models → `models.ts`
   - Callbacks → `callbacks.ts`
   - Store states → `stores.ts`
   - API types → `api.ts`

2. **Export it from `index.ts`**

3. **Document it with JSDoc**:
   ```typescript
   /**
    * Description of what this type represents
    * @example
    * ```typescript
    * const myVar: MyType = { ... };
    * ```
    */
   export interface MyType {
     /** Property description */
     property: string;
   }
   ```

## Type Guidelines

### Do's ✅

- **Use explicit types** instead of `any` or `Function`
- **Import types** with `import type` for better tree-shaking
- **Document types** with JSDoc comments
- **Use generic types** where appropriate (e.g., `OnChange<T>`)
- **Group related types** together in the same file

### Don'ts ❌

- **Don't use `any`** without documenting why it's necessary
- **Don't use `Function`** - use typed callbacks instead
- **Don't duplicate types** - reuse existing types
- **Don't import types without the `type` keyword** unless necessary
- **Don't create types inline** - add them to this directory

## Examples

### Component with Typed Props

```typescript
<script lang="ts">
  import type {
    ClipMetadata,
    OnSelect,
    OnChange,
    VersionInfo
  } from '@/types';

  export let clip: ClipMetadata;
  export let selected: boolean = false;
  export let onSelect: OnSelect<ClipMetadata>;
  export let onChange: OnChange<{ clip: ClipMetadata; version: VersionInfo }>;

  const handleClick = () => {
    if (onSelect) {
      onSelect(clip);
    }
  };
</script>
```

### API Function with Types

```typescript
import type {
  ApiResponse,
  ExpressionSnippet,
  CodaResponse
} from '@/types';

export async function GetExpressions(
  docId: string,
  tableId: string
): Promise<ExpressionSnippet[]> {
  const response = await fetch(`/api/coda/${docId}/${tableId}`);
  const data: CodaResponse<ExpressionSnippet> = await response.json();
  return data.items;
}
```

### Store with Types

```typescript
import { writable } from 'svelte/store';
import type { AppStore } from '@/types/stores';

export const defaultAppStore: AppStore = {
  showTooltips: false,
  defaultToBuck5ShotLibrary: false,
  // ... other properties
};

export const appStore = writable<AppStore>(defaultAppStore);
```

## Type Safety Checklist

When creating or updating components:

- [ ] All props have explicit types (no `any` or `Function`)
- [ ] Callback props use types from `@/types/callbacks`
- [ ] Data props use types from `@/types/models`
- [ ] Store subscriptions are properly typed
- [ ] API calls return typed responses
- [ ] No TypeScript errors in the file
- [ ] IDE autocomplete works for all typed values

## Migrating Existing Code

1. **Identify the issue**: Find `any` or `Function` types
2. **Determine the type**: Look at how the value is used
3. **Find or create the type**: Check `@/types` or create new type
4. **Replace**: Update the code with proper types
5. **Test**: Verify autocomplete and no errors

## References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Svelte TypeScript](https://svelte.dev/docs/typescript)
- [Phase 1 Type Safety Plan](../../../PHASE_1_TYPE_SAFETY_PLAN.md)
