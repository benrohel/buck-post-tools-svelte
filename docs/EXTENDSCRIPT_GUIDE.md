# ExtendScript Development Guide - Buck Post Tools CEP

## Table of Contents
1. [ExtendScript Overview](#extendscript-overview)
2. [Environment Constraints](#environment-constraints)
3. [Code Standards](#code-standards)
4. [After Effects API](#after-effects-api)
5. [Premiere Pro API](#premiere-pro-api)
6. [Type Safety](#type-safety)
7. [Common Patterns](#common-patterns)
8. [Testing](#testing)
9. [Debugging](#debugging)

## ExtendScript Overview

### What is ExtendScript?

ExtendScript is Adobe's scripting language based on **ECMAScript 3 (ES3)** from 1999. It's used to automate Adobe applications like After Effects and Premiere Pro.

**Key Characteristics:**
- **Very old JavaScript**: ES3 from 1999 (no modern features)
- **Synchronous**: No Promises, async/await, or callbacks
- **Adobe APIs**: Direct access to app.project, layers, sequences, etc.
- **File System**: Built-in File and Folder objects
- **Cross-platform**: Same code runs on Windows and macOS

### Architecture

```
┌─────────────────────────────────────────────┐
│  CEP Panel (Chromium)                       │
│  - Modern JavaScript/TypeScript             │
│  - Svelte UI                                │
│  - evalES() / evalTS() calls                │
└────────────┬────────────────────────────────┘
             │
             │ CSInterface bridge
             ▼
┌─────────────────────────────────────────────┐
│  ExtendScript Engine                        │
│  - ES3 JavaScript only                      │
│  - Adobe app APIs                           │
│  - Executes in app context                  │
└─────────────────────────────────────────────┘
```

### Directory Structure

```
src/jsx/
├── aeft/                    # After Effects specific
│   ├── aeft.ts              # Main AE functions (592 lines)
│   ├── aeft-utils.ts        # AE utilities
│   └── templater.ts         # Template system
│
├── ppro/                    # Premiere Pro specific
│   ├── ppro.ts              # Main PPRO functions (1170 lines)
│   └── ppro-utils.ts        # PPRO utilities
│
├── utils/                   # Shared utilities
│   ├── utils.ts             # Polyfills (forEach, map, filter)
│   └── samples.ts           # Sample code
│
├── lib/                     # Third-party libraries
│   └── json2.js             # JSON polyfill
│
├── index.ts                 # Entry point (app detection)
└── global.d.ts              # Global type definitions
```

## Environment Constraints

### What's NOT Available (ES3)

ExtendScript is **extremely limited** compared to modern JavaScript:

```typescript
// ❌ NOT SUPPORTED IN EXTENDSCRIPT

// Modern variable declarations
const myVar = 'value';              // Use: var myVar = 'value';
let myVar = 'value';                // Use: var myVar = 'value';

// Arrow functions
const add = (a, b) => a + b;        // Use: function add(a, b) { return a + b; }

// Template literals
var str = `Hello ${name}`;          // Use: 'Hello ' + name

// Array methods (need polyfills)
arr.forEach(item => {});            // Need polyfill from utils.ts
arr.map(item => item * 2);          // Need polyfill from utils.ts
arr.filter(item => item > 0);       // Need polyfill from utils.ts

// Object shorthand
var obj = { name };                 // Use: { name: name }

// Destructuring
var { name, age } = person;         // Use: var name = person.name;

// Spread operator
var arr2 = [...arr1];               // Use: arr1.slice()

// Classes
class MyClass {}                    // Use: function MyClass() {}

// Promises/async
async function foo() {}             // Not supported
await promise;                      // Not supported

// Modules
import { foo } from './bar';        // Build system handles this
export const myFunc = () => {};     // Build system handles this

// Modern APIs
JSON.parse / JSON.stringify         // Use json2.js polyfill
Object.keys                         // Use polyfill from utils.ts
Array.isArray                       // Use polyfill from utils.ts
```

### What IS Available (ES3 + Adobe APIs)

```typescript
// ✅ SUPPORTED IN EXTENDSCRIPT

// Basic variables
var myVar = 'value';
var myNum = 42;
var myBool = true;

// Function declarations
function myFunc(a, b) {
  return a + b;
}

// For loops
for (var i = 0; i < arr.length; i++) {
  var item = arr[i];
}

// While loops
while (condition) {
  // code
}

// Objects
var obj = {
  name: 'value',
  method: function() {}
};

// Arrays
var arr = [1, 2, 3];
arr.push(4);
arr.length;

// Try-catch
try {
  // code
} catch (e) {
  // error handling
}

// Adobe APIs (the main reason we use ExtendScript!)
app.project.activeSequence
app.project.selection
app.project.items[0]
```

## Code Standards

### Function Declaration Standard

**Always use function declarations in ExtendScript:**

```typescript
// ✅ CORRECT - Function declaration
export function findAndReplace(find: string, replace: string) {
  var clips = app.project.selection;
  for (var i = 0; i < clips.length; i++) {
    clips[i].name = clips[i].name.replace(find, replace);
  }
}

export function getActiveSequence() {
  return {
    name: app.project.activeSequence.name,
    duration: app.project.activeSequence.duration
  };
}

// ❌ WRONG - Arrow function (will fail!)
export const findAndReplace = (find, replace) => {
  // This syntax doesn't exist in ES3!
};
```

### Variable Declarations

```typescript
// ✅ CORRECT - Use var
function processItems() {
  var items = app.project.items;
  var count = items.length;
  var result = [];

  for (var i = 0; i < count; i++) {
    var item = items[i];
    result.push(item.name);
  }

  return result;
}

// ❌ WRONG - const/let don't exist
function processItems() {
  const items = app.project.items;  // Error!
  let count = items.length;         // Error!
}
```

### Loops

```typescript
// ✅ CORRECT - Traditional for loop
function processClips(clips) {
  for (var i = 0; i < clips.length; i++) {
    var clip = clips[i];
    clip.name = clip.name.toUpperCase();
  }
}

// ❌ WRONG - No forEach without polyfill
function processClips(clips) {
  clips.forEach(function(clip) {
    // forEach doesn't exist natively
  });
}

// ✅ WITH POLYFILL - Import from utils
import { forEach } from '../utils/utils';

function processClips(clips) {
  forEach(clips, function(clip) {
    clip.name = clip.name.toUpperCase();
  });
}
```

### String Concatenation

```typescript
// ✅ CORRECT - String concatenation
function formatMessage(name, count) {
  return 'User ' + name + ' has ' + count + ' items';
}

// ❌ WRONG - Template literals don't exist
function formatMessage(name, count) {
  return `User ${name} has ${count} items`;  // Error!
}
```

### Object Creation

```typescript
// ✅ CORRECT - Full property names
function createItem(name, value) {
  return {
    name: name,
    value: value,
    timestamp: new Date().getTime()
  };
}

// ❌ WRONG - No object shorthand
function createItem(name, value) {
  return {
    name,      // Error! Must be name: name
    value,     // Error! Must be value: value
  };
}
```

### Type Annotations

**Use TypeScript types even though they're stripped:**

```typescript
// ✅ GOOD - Types help development
export function getSequenceInfo(sequenceId: string): SequenceInfo {
  var seq = findSequenceById(sequenceId);
  return {
    name: seq.name,
    duration: seq.duration,
    frameRate: seq.frameRate
  };
}

// Types provide:
// - Autocomplete in IDE
// - Compile-time checking
// - Type-safe calls from frontend
// - Documentation
```

### Comments

```typescript
// JSDoc comments for exported functions
/**
 * Finds and replaces text in selected clips
 * @param {string} find - Text to find
 * @param {string} replace - Replacement text
 * @returns {number} Number of clips modified
 */
export function findAndReplace(find: string, replace: string): number {
  var clips = app.project.selection;
  var count = 0;

  for (var i = 0; i < clips.length; i++) {
    if (clips[i].name.indexOf(find) !== -1) {
      clips[i].name = clips[i].name.replace(find, replace);
      count++;
    }
  }

  return count;
}
```

## After Effects API

### Common Patterns

#### Access Active Composition

```typescript
export function getActiveComp() {
  var comp = app.project.activeItem;

  if (!(comp instanceof CompItem)) {
    throw new Error('No active composition');
  }

  return {
    name: comp.name,
    width: comp.width,
    height: comp.height,
    duration: comp.duration,
    frameRate: comp.frameRate
  };
}
```

#### Iterate Project Items

```typescript
export function getAllCompositions() {
  var comps = [];

  for (var i = 1; i <= app.project.numItems; i++) {
    var item = app.project.item(i);

    if (item instanceof CompItem) {
      comps.push({
        id: item.id,
        name: item.name,
        width: item.width,
        height: item.height
      });
    }
  }

  return comps;
}
```

#### Work with Layers

```typescript
export function renameSelectedLayers(prefix: string) {
  var comp = app.project.activeItem;

  if (!(comp instanceof CompItem)) {
    throw new Error('No active composition');
  }

  var selectedLayers = comp.selectedLayers;

  for (var i = 0; i < selectedLayers.length; i++) {
    var layer = selectedLayers[i];
    layer.name = prefix + '_' + layer.name;
  }

  return selectedLayers.length;
}
```

#### Create Folder

```typescript
export function createProjectFolder(folderName: string) {
  var folder = app.project.items.addFolder(folderName);
  return {
    id: folder.id,
    name: folder.name
  };
}
```

#### Import File

```typescript
export function importFile(filePath: string) {
  var importOptions = new ImportOptions(File(filePath));

  if (!importOptions.file.exists) {
    throw new Error('File does not exist: ' + filePath);
  }

  var item = app.project.importFile(importOptions);

  return {
    id: item.id,
    name: item.name,
    type: item.typeName
  };
}
```

### After Effects Undo Group Pattern

```typescript
export function batchRenameWithUndo(prefix: string) {
  // Wrap operations in undo group
  app.beginUndoGroup('Batch Rename');

  try {
    var comp = app.project.activeItem;
    var layers = comp.selectedLayers;

    for (var i = 0; i < layers.length; i++) {
      layers[i].name = prefix + '_' + layers[i].name;
    }

    app.endUndoGroup();
    return layers.length;
  } catch (e) {
    app.endUndoGroup();
    throw e;
  }
}
```

## Premiere Pro API

### Common Patterns

#### Access Active Sequence

```typescript
export function getActiveSequence() {
  var seq = app.project.activeSequence;

  if (!seq) {
    throw new Error('No active sequence');
  }

  return {
    name: seq.name,
    id: seq.sequenceID,
    frameRate: seq.framerate,
    videoTracks: seq.videoTracks.numTracks,
    audioTracks: seq.audioTracks.numTracks
  };
}
```

#### Get Selected Clips

```typescript
export function getSelectedClips() {
  var seq = app.project.activeSequence;

  if (!seq) {
    throw new Error('No active sequence');
  }

  var clips = [];
  var selection = seq.getSelection();

  for (var i = 0; i < selection.length; i++) {
    var clip = selection[i];

    clips.push({
      nodeId: clip.nodeId,
      name: clip.name,
      start: clip.start.seconds,
      end: clip.end.seconds,
      duration: (clip.end.seconds - clip.start.seconds)
    });
  }

  return clips;
}
```

#### Rename Clips in Timeline

```typescript
export function renameTimelineClips(find: string, replace: string) {
  var seq = app.project.activeSequence;

  if (!seq) {
    throw new Error('No active sequence');
  }

  var count = 0;

  // Iterate video tracks
  for (var v = 0; v < seq.videoTracks.numTracks; v++) {
    var track = seq.videoTracks[v];

    for (var c = 0; c < track.clips.numItems; c++) {
      var clip = track.clips[c];

      if (clip.name.indexOf(find) !== -1) {
        clip.name = clip.name.replace(find, replace);
        count++;
      }
    }
  }

  return count;
}
```

#### Export Sequence to XML

```typescript
export function exportSequenceXml(outputPath: string, sequenceId: string) {
  var seq = findSequenceById(sequenceId);

  if (!seq) {
    throw new Error('Sequence not found: ' + sequenceId);
  }

  var file = new File(outputPath);
  var success = seq.exportAsFinalCutProXML(file.fsName, 0);

  if (!success) {
    throw new Error('Export failed');
  }

  return {
    path: file.fsName,
    size: file.length
  };
}
```

#### Create Sequence

```typescript
export function createSequence(name: string, presetPath: string) {
  var preset = new File(presetPath);

  if (!preset.exists) {
    throw new Error('Preset file not found: ' + presetPath);
  }

  var seq = app.project.createNewSequenceFromClips(
    name,
    [],
    app.project.rootItem
  );

  return {
    id: seq.sequenceID,
    name: seq.name
  };
}
```

### Premiere Pro Time Objects

```typescript
export function getClipTimecode(clipNodeId: string) {
  var seq = app.project.activeSequence;
  var clip = findClipByNodeId(seq, clipNodeId);

  if (!clip) {
    throw new Error('Clip not found');
  }

  // Time objects have .seconds property
  var inPoint = clip.inPoint.seconds;
  var outPoint = clip.outPoint.seconds;
  var duration = outPoint - inPoint;

  // Convert to timecode string
  var framerate = seq.framerate;
  var frames = Math.floor(duration * framerate);

  return {
    inPoint: inPoint,
    outPoint: outPoint,
    duration: duration,
    frames: frames
  };
}
```

## Type Safety

### Defining Return Types

```typescript
// Define interfaces for return values
interface ClipInfo {
  nodeId: string;
  name: string;
  start: number;
  end: number;
}

export function getClipInfo(nodeId: string): ClipInfo {
  // Implementation
  return {
    nodeId: clip.nodeId,
    name: clip.name,
    start: clip.start.seconds,
    end: clip.end.seconds
  };
}
```

### Type-Safe Parameters

```typescript
// Use enums for limited options
type ExportFormat = 'xml' | 'csv' | 'txt';

export function exportSequence(
  format: ExportFormat,
  path: string,
  includeMetadata: boolean
) {
  // TypeScript ensures only valid formats
  if (format === 'xml') {
    exportAsXml(path, includeMetadata);
  } else if (format === 'csv') {
    exportAsCsv(path, includeMetadata);
  }
}
```

### Optional Parameters

```typescript
export function createFolder(
  name: string,
  parent?: any  // Optional parent folder
) {
  var parentItem = parent || app.project.rootItem;
  var folder = parentItem.createBin(name);

  return {
    name: folder.name,
    id: folder.nodeId
  };
}
```

## Common Patterns

### Error Handling

```typescript
export function safeOperation(param: string) {
  try {
    // Validate input
    if (!param || param.length === 0) {
      throw new Error('Invalid parameter');
    }

    // Check prerequisites
    if (!app.project.activeSequence) {
      throw new Error('No active sequence');
    }

    // Perform operation
    var result = performOperation(param);

    return {
      success: true,
      data: result
    };
  } catch (e) {
    // Return error info for CEP to handle
    return {
      success: false,
      error: e.message || String(e),
      stack: e.line ? 'Line ' + e.line : undefined
    };
  }
}
```

### Returning JSON

```typescript
// CEP expects JSON strings for complex data
export function getProjectStructure() {
  var structure = {
    name: app.project.name,
    path: app.project.path,
    items: []
  };

  for (var i = 1; i <= app.project.numItems; i++) {
    var item = app.project.item(i);
    structure.items.push({
      id: item.id,
      name: item.name,
      type: item.typeName
    });
  }

  // Return as JSON string
  return JSON.stringify(structure);
}
```

### File System Operations

```typescript
export function saveTextFile(path: string, content: string) {
  var file = new File(path);

  // Create parent directory if needed
  var folder = file.parent;
  if (!folder.exists) {
    folder.create();
  }

  // Write file
  file.encoding = 'UTF-8';
  file.open('w');
  file.write(content);
  file.close();

  return {
    path: file.fsName,
    size: file.length
  };
}
```

### Progress Callbacks (Premiere Pro)

```typescript
export function processClipsWithProgress(clips: string[]) {
  var total = clips.length;

  for (var i = 0; i < total; i++) {
    processClip(clips[i]);

    // Update progress (CEP can poll this)
    app.setSDKEventMessage(
      JSON.stringify({
        type: 'progress',
        current: i + 1,
        total: total
      }),
      'info'
    );
  }

  return total;
}
```

## Testing

### Manual Testing in ESTK

1. Open ExtendScript Toolkit (ESTK)
2. Select target application (After Effects/Premiere Pro)
3. Paste function code
4. Test with sample data

```typescript
// Test in ESTK
function testFindAndReplace() {
  var result = findAndReplace('old', 'new');
  $.writeln('Modified ' + result + ' clips');
}

testFindAndReplace();
```

### Testing from CEP

```typescript
// In frontend component
const testFunction = async () => {
  try {
    const result = await evalTS('findAndReplace', 'old', 'new');
    log.debug('Test result', result);
  } catch (error) {
    log.error('Test failed', error);
  }
};
```

## Debugging

### Alert Boxes

```typescript
export function debugInfo() {
  var seq = app.project.activeSequence;

  // Show alert for debugging
  alert('Sequence: ' + seq.name + '\nTracks: ' + seq.videoTracks.numTracks);
}
```

### Console Output

```typescript
// After Effects
$.writeln('Debug message: ' + value);

// Premiere Pro
app.setSDKEventMessage('Debug: ' + value, 'info');
```

### Error Messages to CEP

```typescript
export function operationWithDebug(param: string) {
  try {
    // Log to CEP console via return value
    return {
      success: true,
      debug: {
        param: param,
        activeSeq: app.project.activeSequence.name,
        timestamp: new Date().getTime()
      }
    };
  } catch (e) {
    return {
      success: false,
      error: e.message,
      debug: {
        line: e.line,
        fileName: e.fileName
      }
    };
  }
}
```

### Logging Pattern

```typescript
// Create logging function
function log(message: string, data?: any) {
  var logMsg = '[' + new Date().toISOString() + '] ' + message;

  if (data) {
    logMsg += ' | ' + JSON.stringify(data);
  }

  // After Effects
  $.writeln(logMsg);

  // Also return for CEP
  return logMsg;
}

export function trackedOperation(param: string) {
  log('Operation started', { param: param });

  try {
    var result = performOperation(param);
    log('Operation complete', { result: result });
    return result;
  } catch (e) {
    log('Operation failed', { error: e.message });
    throw e;
  }
}
```

---

## Quick Reference

### Do's and Don'ts

#### ✅ DO

- Use `function` declarations
- Use `var` for all variables
- Use traditional `for` loops
- Use string concatenation
- Use full object syntax `{ name: name }`
- Add TypeScript type annotations
- Return JSON strings for complex data
- Wrap operations in try-catch
- Use undo groups (After Effects)
- Validate inputs

#### ❌ DON'T

- Use arrow functions `() => {}`
- Use `const` or `let`
- Use array methods without polyfills
- Use template literals
- Use object shorthand
- Use async/await or Promises
- Use modern APIs without polyfills
- Forget error handling
- Modify without undo groups
- Trust input data

### Common Adobe APIs

#### After Effects
```typescript
app.project.activeItem          // Active composition
app.project.numItems            // Item count
app.project.item(index)         // Get item by index
app.project.importFile()        // Import file
comp.layers                     // Composition layers
comp.selectedLayers            // Selected layers
layer.property()                // Layer properties
app.beginUndoGroup()           // Start undo
```

#### Premiere Pro
```typescript
app.project.activeSequence      // Active sequence
app.project.rootItem            // Root bin
seq.videoTracks                 // Video tracks
seq.audioTracks                 // Audio tracks
seq.getSelection()              // Selected clips
track.clips                     // Clips in track
clip.projectItem                // Source item
seq.exportAsFinalCutProXML()   // Export XML
```

### Build Output

ExtendScript is compiled to:
- **Development**: `dist/cep/jsx/index.js`
- **Production**: `dist/cep/jsx/index.jsxbin` (optional binary)

The build system:
1. Transpiles TypeScript to ES3
2. Bundles into single file
3. Wraps in IIFE
4. Adds polyfills
5. Optionally compiles to binary
