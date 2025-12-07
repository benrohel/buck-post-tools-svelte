# Communication Bridge - JS ↔ JSX

## Table of Contents
1. [Overview](#overview)
2. [The bolt.ts Bridge](#the-boltts-bridge)
3. [evalES - Basic Evaluation](#evales---basic-evaluation)
4. [evalTS - Type-Safe Calls](#evalts---type-safe-calls)
5. [Shared Namespace](#shared-namespace)
6. [Return Value Patterns](#return-value-patterns)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

## Overview

The Buck Post Tools extension operates in two separate JavaScript environments that need to communicate:

```
┌─────────────────────────────────────────────┐
│  CEP Panel (Frontend)                       │
│  ├─ Chromium Browser (Chrome 74)            │
│  ├─ Modern ES2020+ JavaScript               │
│  ├─ Svelte Components                       │
│  ├─ Node.js APIs (via CEP)                  │
│  └─ DOM APIs                                │
└────────────┬────────────────────────────────┘
             │
             │  Communication Bridge
             │  (CSInterface + bolt.ts)
             │
┌────────────▼────────────────────────────────┐
│  ExtendScript (Backend)                     │
│  ├─ ES3 JavaScript (1999)                   │
│  ├─ After Effects / Premiere Pro APIs       │
│  ├─ File System (File/Folder objects)       │
│  └─ No modern features                      │
└─────────────────────────────────────────────┘
```

**The Problem:**
- CEP panel can't directly call Adobe app functions
- ExtendScript can't directly update the UI
- Data must be serialized across the boundary

**The Solution:**
- `bolt.ts` provides bridge functions (`evalES`, `evalTS`)
- CSInterface handles communication
- JSON for data serialization
- Shared namespace for function access

## The bolt.ts Bridge

Location: `src/js/lib/utils/bolt.ts`

### Core Components

```typescript
import CSInterface from '@/lib/cep/csinterface';
import { ns } from '@/../shared/shared';

// CSInterface instance - handles CEP communication
export const csi = new CSInterface();

// Shared namespace (from cep.config.ts)
// ns = "co.buck-tools.cep"
```

### The Bridge Functions

```typescript
/**
 * evalES - Basic ExtendScript evaluation
 * Returns raw string result
 */
export const evalES = (
  script: string,
  isGlobal = false
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const pre = isGlobal ? '' : `var host = typeof $ !== 'undefined' ? $ : window; host["${ns}"].`;
    const fullString = pre + script;

    csi.evalScript(
      'try{' + fullString + '}catch(e){alert(e);}',
      (res: string) => {
        resolve(res);
      }
    );
  });
};

/**
 * evalTS - Type-safe ExtendScript evaluation
 * Full type checking and structured error handling
 */
export const evalTS = <
  Key extends string & keyof Scripts,
  Func extends Function & Scripts[Key]
>(
  functionName: Key,
  ...args: ArgTypes<Func>
): Promise<ReturnType<Func>> => {
  return new Promise((resolve, reject) => {
    const formattedArgs = args
      .map((arg) => JSON.stringify(arg))
      .join(',');

    csi.evalScript(
      `try{
        var host = typeof $ !== 'undefined' ? $ : window;
        var res = host["${ns}"].${functionName}(${formattedArgs});
        JSON.stringify(res);
      }catch(e){
        e.fileName = new File(e.fileName).fsName;
        JSON.stringify(e);
      }`,
      (res: string) => {
        try {
          if (res === 'undefined') return resolve(undefined);

          const parsed = JSON.parse(res);

          if (parsed.name === 'ReferenceError') {
            reject(parsed);
          } else {
            resolve(parsed);
          }
        } catch (error) {
          reject(res);
        }
      }
    );
  });
};
```

## evalES - Basic Evaluation

### When to Use

Use `evalES` for:
- Simple operations with no return value
- Quick testing
- Legacy code
- When you don't need type safety

### Basic Usage

```typescript
import { evalES } from '@/lib/utils/bolt';

// Simple function call
await evalES(`findAndReplace("old", "new")`);

// With parameters (manual string building)
const find = 'shot';
const replace = 'clip';
await evalES(`findAndReplace("${find}", "${replace}")`);

// No namespace scoping (global evaluation)
await evalES(`alert("Hello from ExtendScript")`, true);
```

### Passing Data

```typescript
// ⚠️ Manual JSON serialization needed
const options = {
  format: 'xml',
  includeMetadata: true
};

await evalES(`exportSequence(${JSON.stringify(options)})`);
```

### Return Values

```typescript
// Returns string - needs manual parsing
const result = await evalES(`getActiveSequenceName()`);
console.log(result); // "My Sequence"

// Complex data needs JSON parsing
const data = await evalES(`getProjectStructure()`);
const parsed = JSON.parse(data);
console.log(parsed.items);
```

### Example Component

```svelte
<script lang="ts">
  import { evalES } from '@/lib/utils/bolt';
  import { notifications } from '@/stores/notifications-store';

  let find = '';
  let replace = '';

  const handleFindReplace = async () => {
    try {
      // Call ExtendScript function
      await evalES(`findAndReplace("${find}", "${replace}")`);
      notifications.success('Rename complete');
    } catch (error) {
      notifications.error('Rename failed');
    }
  };
</script>

<div>
  <input bind:value={find} placeholder="Find" />
  <input bind:value={replace} placeholder="Replace" />
  <button on:click={handleFindReplace}>Replace</button>
</div>
```

## evalTS - Type-Safe Calls

### When to Use

Use `evalTS` for:
- All new code (preferred)
- Complex data structures
- When you want autocomplete
- When you want compile-time type checking
- When you want better error messages

### Setup

1. **Define ExtendScript function:**

```typescript
// src/jsx/ppro/ppro.ts
export interface SequenceInfo {
  name: string;
  id: string;
  duration: number;
  frameRate: number;
}

export function getActiveSequence(): SequenceInfo {
  var seq = app.project.activeSequence;

  if (!seq) {
    throw new Error('No active sequence');
  }

  return {
    name: seq.name,
    id: seq.sequenceID,
    duration: seq.duration,
    frameRate: seq.framerate
  };
}
```

2. **Call from CEP panel:**

```typescript
// Frontend component
import { evalTS } from '@/lib/utils/bolt';

const loadSequence = async () => {
  try {
    // Type-safe call with autocomplete!
    const sequence = await evalTS('getActiveSequence');

    // TypeScript knows the return type
    console.log(sequence.name);      // ✅ Autocomplete works
    console.log(sequence.frameRate); // ✅ Autocomplete works
    console.log(sequence.invalid);   // ❌ Type error

  } catch (error) {
    console.error('Failed to load sequence', error);
  }
};
```

### With Parameters

```typescript
// ExtendScript
export interface RenameOptions {
  find: string;
  replace: string;
  caseSensitive: boolean;
}

export function findAndReplace(options: RenameOptions): number {
  var count = 0;
  // Implementation
  return count;
}

// Frontend
const result = await evalTS('findAndReplace', {
  find: 'old',
  replace: 'new',
  caseSensitive: false
});

console.log(`Renamed ${result} clips`);
```

### Complex Example

```svelte
<script lang="ts">
  import { evalTS } from '@/lib/utils/bolt';
  import { logModule } from '@/lib/logger';
  import { notifications } from '@/stores/notifications-store';

  const log = logModule('export-sequence');

  interface ExportOptions {
    format: 'xml' | 'csv';
    path: string;
    includeMetadata: boolean;
  }

  interface ExportResult {
    success: boolean;
    path: string;
    size: number;
  }

  let exportPath = '';
  let format: 'xml' | 'csv' = 'xml';
  let includeMetadata = true;

  const handleExport = async () => {
    log.debug('Export started', { format, path: exportPath });

    try {
      // Type-safe call with full intellisense
      const result: ExportResult = await evalTS('exportSequence', {
        format,
        path: exportPath,
        includeMetadata
      });

      log.debug('Export complete', result);
      notifications.success(`Exported to ${result.path}`);

    } catch (error) {
      log.error('Export failed', error);
      notifications.error('Export failed');
    }
  };
</script>
```

## Shared Namespace

### How It Works

**1. Configuration** (`cep.config.ts`):
```typescript
export default {
  id: 'co.buck-tools.cep',
  // ...
};
```

**2. Shared constant** (`src/shared/shared.ts`):
```typescript
import config from '../../cep.config';
export const ns = config.id; // "co.buck-tools.cep"
```

**3. ExtendScript initialization** (`src/jsx/index.ts`):
```typescript
import { ns } from "../shared/shared";
import * as aeft from "./aeft/aeft";
import * as ppro from "./ppro/ppro";

const host = typeof $ !== "undefined" ? $ : window;

// Assign functions to namespace based on app
switch (BridgeTalk.appName) {
  case "aftereffects":
  case "aftereffectsbeta":
    host[ns] = aeft;
    break;

  case "premierepro":
  case "premiereprobeta":
    app.enableQE(); // Enable QE DOM
    host[ns] = ppro;
    break;
}
```

**4. Frontend access** (`bolt.ts`):
```typescript
// Calls become:
// host["co.buck-tools.cep"].functionName()

evalES(`findAndReplace("old", "new")`);
// Becomes: host["co.buck-tools.cep"].findAndReplace("old", "new")

evalTS('getActiveSequence');
// Becomes: host["co.buck-tools.cep"].getActiveSequence()
```

### Why Namespace?

- **Avoid conflicts**: Won't collide with other scripts
- **Organized**: All functions under one object
- **App detection**: Different functions for different apps
- **Type safety**: TypeScript can verify function names

## Return Value Patterns

### Simple Values

```typescript
// ExtendScript
export function getProjectName(): string {
  return app.project.name;
}

// Frontend
const name = await evalTS('getProjectName');
console.log(name); // "My Project"
```

### Objects

```typescript
// ExtendScript
export interface ClipInfo {
  name: string;
  duration: number;
}

export function getClipInfo(nodeId: string): ClipInfo {
  var clip = findClip(nodeId);
  return {
    name: clip.name,
    duration: clip.duration
  };
}

// Frontend
const clip = await evalTS('getClipInfo', 'clip-123');
console.log(clip.name, clip.duration);
```

### Arrays

```typescript
// ExtendScript
export interface Sequence {
  id: string;
  name: string;
}

export function getAllSequences(): Sequence[] {
  var sequences = [];

  for (var i = 0; i < app.project.sequences.numSequences; i++) {
    var seq = app.project.sequences[i];
    sequences.push({
      id: seq.sequenceID,
      name: seq.name
    });
  }

  return sequences;
}

// Frontend
const sequences = await evalTS('getAllSequences');
sequences.forEach(seq => console.log(seq.name));
```

### Success/Error Results

```typescript
// ExtendScript
export interface OperationResult {
  success: boolean;
  message: string;
  data?: any;
}

export function performOperation(param: string): OperationResult {
  try {
    var result = doWork(param);
    return {
      success: true,
      message: 'Operation complete',
      data: result
    };
  } catch (e) {
    return {
      success: false,
      message: e.message || String(e)
    };
  }
}

// Frontend
const result = await evalTS('performOperation', 'param');

if (result.success) {
  notifications.success(result.message);
  console.log(result.data);
} else {
  notifications.error(result.message);
}
```

### Large Data Sets

```typescript
// ExtendScript - Return as JSON string for large data
export function getProjectStructure(): string {
  var structure = {
    items: [],
    bins: []
  };

  // Build large structure...
  for (var i = 0; i < app.project.numItems; i++) {
    structure.items.push(/* ... */);
  }

  // Return as JSON string
  return JSON.stringify(structure);
}

// Frontend - Parse JSON
const jsonString = await evalES(`getProjectStructure()`);
const structure = JSON.parse(jsonString);
console.log(structure.items.length);
```

## Error Handling

### ExtendScript Side

```typescript
export function safeOperation(param: string) {
  try {
    // Validate input
    if (!param) {
      throw new Error('Parameter required');
    }

    // Check prerequisites
    if (!app.project.activeSequence) {
      throw new Error('No active sequence');
    }

    // Perform operation
    var result = doOperation(param);

    return {
      success: true,
      data: result
    };

  } catch (e) {
    // Return structured error
    return {
      success: false,
      error: e.message || String(e),
      stack: e.line ? 'Line ' + e.line : undefined
    };
  }
}
```

### Frontend Side

```typescript
const handleOperation = async (param: string) => {
  log.debug('Operation started', { param });

  try {
    const result = await evalTS('safeOperation', param);

    if (!result.success) {
      // ExtendScript caught error
      log.error('Operation failed', result.error);
      notifications.error(result.error);
      return;
    }

    // Success
    log.debug('Operation complete', result.data);
    notifications.success('Operation complete');

  } catch (error) {
    // evalTS threw error (JSON parse failed, etc.)
    log.error('Unexpected error', error);
    notifications.error('Unexpected error');
  }
};
```

### User-Friendly Error Messages

```typescript
// ExtendScript
export function userFriendlyOperation(param: string) {
  try {
    if (!param) {
      return {
        success: false,
        userMessage: 'Please provide a value',
        technicalError: 'Parameter is empty or undefined'
      };
    }

    if (!app.project.activeSequence) {
      return {
        success: false,
        userMessage: 'Please open a sequence first',
        technicalError: 'app.project.activeSequence is null'
      };
    }

    var result = doOperation(param);
    return {
      success: true,
      userMessage: 'Operation completed successfully',
      data: result
    };

  } catch (e) {
    return {
      success: false,
      userMessage: 'An error occurred. Please try again.',
      technicalError: e.message,
      stack: e.line
    };
  }
}

// Frontend
const result = await evalTS('userFriendlyOperation', param);

if (result.success) {
  notifications.success(result.userMessage);
} else {
  // Show user-friendly message
  notifications.error(result.userMessage);

  // Log technical details
  log.error('Operation failed', {
    technical: result.technicalError,
    stack: result.stack
  });
}
```

## Best Practices

### 1. Prefer evalTS Over evalES

```typescript
// ❌ AVOID - evalES
await evalES(`findAndReplace("${find}", "${replace}")`);

// ✅ PREFER - evalTS
await evalTS('findAndReplace', { find, replace });
```

**Why?**
- Type safety
- Autocomplete
- Compile-time checking
- Better error messages
- No string concatenation bugs

### 2. Define Clear Interfaces

```typescript
// ✅ GOOD - Clear interface
export interface ExportOptions {
  format: 'xml' | 'csv';
  path: string;
  includeMetadata: boolean;
  sequenceId?: string;
}

export function exportSequence(options: ExportOptions): ExportResult {
  // Implementation
}

// ❌ BAD - Unclear parameters
export function exportSequence(
  format: any,
  path: any,
  metadata: any,
  id: any
) {
  // Hard to use correctly
}
```

### 3. Always Handle Errors

```typescript
// ✅ GOOD - Comprehensive error handling
const handleExport = async () => {
  try {
    const result = await evalTS('exportSequence', options);

    if (!result.success) {
      log.error('Export failed', result.error);
      notifications.error(result.error);
      return;
    }

    notifications.success('Export complete');
  } catch (error) {
    log.error('Unexpected error', error);
    notifications.error('An unexpected error occurred');
  }
};

// ❌ BAD - No error handling
const handleExport = async () => {
  const result = await evalTS('exportSequence', options);
  notifications.success('Export complete');
};
```

### 4. Log Communication

```typescript
// ✅ GOOD - Log calls and results
const loadData = async () => {
  log.debug('Loading data');

  try {
    const data = await evalTS('getData');
    log.debug('Data loaded', { count: data.length });
    return data;
  } catch (error) {
    log.error('Failed to load data', error);
    throw error;
  }
};
```

### 5. Validate Input Before Calling

```typescript
// ✅ GOOD - Validate on frontend first
const handleExport = async () => {
  // Validate before expensive ExtendScript call
  if (!outputPath) {
    notifications.error('Please select an output path');
    return;
  }

  if (selectedItems.length === 0) {
    notifications.error('Please select items to export');
    return;
  }

  // Now call ExtendScript
  const result = await evalTS('exportItems', {
    items: selectedItems,
    path: outputPath
  });
};

// ❌ BAD - Let ExtendScript handle validation
const handleExport = async () => {
  // ExtendScript has to validate and send error back
  const result = await evalTS('exportItems', {
    items: selectedItems,
    path: outputPath
  });
};
```

### 6. Use TypeScript's Type Guards

```typescript
interface SuccessResult {
  success: true;
  data: any;
}

interface ErrorResult {
  success: false;
  error: string;
}

type Result = SuccessResult | ErrorResult;

const handleOperation = async () => {
  const result: Result = await evalTS('operation', param);

  // TypeScript knows the shape
  if (result.success) {
    console.log(result.data); // ✅ TypeScript knows data exists
  } else {
    console.error(result.error); // ✅ TypeScript knows error exists
  }
};
```

### 7. Document Expected Behavior

```typescript
/**
 * Exports the active sequence to XML format
 *
 * @param options - Export configuration
 * @param options.path - Absolute file path for output
 * @param options.includeMetadata - Whether to include clip metadata
 *
 * @returns Export result with file path and size
 *
 * @throws {Error} If no active sequence
 * @throws {Error} If path is invalid or not writable
 *
 * @example
 * ```typescript
 * const result = await evalTS('exportSequence', {
 *   path: '/Users/name/export.xml',
 *   includeMetadata: true
 * });
 * ```
 */
export function exportSequence(options: ExportOptions): ExportResult {
  // Implementation
}
```

---

## Quick Reference

### When to Use What

| Use Case | Tool | Example |
|----------|------|---------|
| New code | `evalTS` | `await evalTS('getData')` |
| Type safety needed | `evalTS` | `await evalTS('getClips', { id: '123' })` |
| Simple call, no return | `evalES` | `await evalES(`alert("Done")`)` |
| Testing | `evalES` | `await evalES(`$.writeln("Test")`, true)` |
| Legacy code | `evalES` | Existing code only |

### Communication Checklist

- [ ] Use `evalTS` for new code
- [ ] Define interfaces for parameters
- [ ] Define interfaces for return values
- [ ] Handle errors on both sides
- [ ] Log communication for debugging
- [ ] Validate input on frontend first
- [ ] Return structured results from JSX
- [ ] Use TypeScript type guards
- [ ] Document expected behavior
- [ ] Test error cases

### Common Patterns

```typescript
// Pattern 1: Simple data fetch
const data = await evalTS('getData');

// Pattern 2: With parameters
const result = await evalTS('processData', { id: '123' });

// Pattern 3: With error handling
try {
  const result = await evalTS('operation', params);
  if (result.success) {
    // Handle success
  } else {
    // Handle known error
  }
} catch (error) {
  // Handle unexpected error
}

// Pattern 4: With logging
log.debug('Operation starting', params);
const result = await evalTS('operation', params);
log.debug('Operation complete', result);
```
