/**
 * Callback type definitions for Buck Post Tools CEP
 *
 * This file contains typed callback signatures to replace generic `Function` types.
 * These provide better type safety and IDE autocomplete for component props.
 *
 * @example
 * ```typescript
 * import type { OnChange, OnSelect } from '@/types/callbacks';
 * import type { ClipMetadata } from '@/types/models';
 *
 * export let onChange: OnChange<ClipMetadata> = () => {};
 * export let onSelect: OnSelect<string> = () => {};
 * ```
 */

import type {
  ClipMetadata,
  ExpressionSnippet,
  Bookmark,
  PathItem,
  Marker,
  Option,
  VersionInfo,
} from './models';

// ============================================================================
// Generic Callback Types
// ============================================================================

/**
 * Generic change callback
 * @example
 * ```typescript
 * const onChange: OnChange<string> = (value) => {
 *   console.log('Changed to:', value);
 * };
 * ```
 */
export type OnChange<T> = (value: T) => void;

/**
 * Generic async change callback
 */
export type OnChangeAsync<T> = (value: T) => Promise<void>;

/**
 * Generic select callback
 * @example
 * ```typescript
 * const onSelect: OnSelect<ClipMetadata> = (clip) => {
 *   console.log('Selected:', clip.name);
 * };
 * ```
 */
export type OnSelect<T> = (item: T) => void;

/**
 * Generic update callback
 * @example
 * ```typescript
 * const onUpdate: OnUpdate<string> = (id) => {
 *   console.log('Updated:', id);
 * };
 * ```
 */
export type OnUpdate<T> = (item: T) => void;

/**
 * Simple click callback with no parameters
 * @example
 * ```typescript
 * const onClick: OnClick = () => {
 *   console.log('Clicked!');
 * };
 * ```
 */
export type OnClick = () => void;

/**
 * Async click callback
 */
export type OnClickAsync = () => Promise<void>;

/**
 * Close/dismiss callback (for modals, dropdowns, etc.)
 */
export type OnClose = () => void;

/**
 * Confirm callback (for confirmation dialogs)
 */
export type OnConfirm = () => void;

/**
 * Cancel callback
 */
export type OnCancel = () => void;

/**
 * Submit callback with data
 */
export type OnSubmit<T = Record<string, any>> = (data: T) => void;

/**
 * Async submit callback
 */
export type OnSubmitAsync<T = Record<string, any>> = (data: T) => Promise<void>;

/**
 * Generic callback with two parameters
 * @example
 * ```typescript
 * const onChange: OnChange2<ClipMetadata, VersionInfo> = (clip, version) => {
 *   console.log('Changed clip version');
 * };
 * ```
 */
export type OnChange2<T1, T2> = (param1: T1, param2: T2) => void;

// ============================================================================
// DOM Event Handlers
// ============================================================================

/**
 * Input change event handler
 * @example
 * ```typescript
 * const handleChange: InputChangeHandler = (event) => {
 *   const value = (event.target as HTMLInputElement).value;
 * };
 * ```
 */
export type InputChangeHandler = (event: Event) => void;

/**
 * Button click event handler
 */
export type ButtonClickHandler = (event: MouseEvent) => void;

/**
 * Keyboard event handler
 */
export type KeyboardEventHandler = (event: KeyboardEvent) => void;

/**
 * File input change handler
 */
export type FileSelectHandler = (files: FileList) => void;

/**
 * Drag event handler
 */
export type DragEventHandler = (event: DragEvent) => void;

// ============================================================================
// Domain-Specific Callback Types
// ============================================================================

/**
 * Clip selection callback
 * @example
 * ```typescript
 * const onSelectClip: ClipSelectCallback = (clip) => {
 *   console.log('Selected clip:', clip.name);
 * };
 * ```
 */
export type ClipSelectCallback = OnSelect<ClipMetadata>;

/**
 * Clip change callback with version
 */
export type ClipChangeCallback = OnChange2<ClipMetadata, VersionInfo>;

/**
 * Clip replace callback
 */
export type ClipReplaceCallback = OnSelect<ClipMetadata>;

/**
 * Clip import callback
 */
export type ClipImportCallback = OnSelect<ClipMetadata>;

/**
 * Expression selection callback
 */
export type ExpressionSelectCallback = OnSelect<ExpressionSnippet>;

/**
 * Expression update callback (for favoriting, etc.)
 */
export type ExpressionUpdateCallback = OnUpdate<string>;

/**
 * Bookmark selection callback
 */
export type BookmarkSelectCallback = OnSelect<Bookmark>;

/**
 * Bookmark change callback
 */
export type BookmarkChangeCallback = OnChange<Bookmark[]>;

/**
 * Path item selection callback (for export trees)
 */
export type PathItemSelectCallback = OnSelect<PathItem>;

/**
 * Marker selection callback
 */
export type MarkerSelectCallback = OnSelect<Marker>;

/**
 * Dropdown/select option change callback
 */
export type OptionSelectCallback<T = string> = OnSelect<Option<T>>;

/**
 * Multi-select change callback
 */
export type MultiSelectChangeCallback<T = string> = OnChange<T[]>;

/**
 * Folder selection callback
 */
export type FolderSelectCallback = OnChange<string>;

/**
 * File selection callback
 */
export type FileSelectCallback = OnChange<string>;

/**
 * Version selection callback
 */
export type VersionSelectCallback = OnSelect<VersionInfo>;

/**
 * Code/text change callback
 */
export type CodeChangeCallback = OnChange<string>;

/**
 * Toggle change callback
 */
export type ToggleChangeCallback = OnChange<boolean>;

/**
 * Number change callback
 */
export type NumberChangeCallback = OnChange<number>;

/**
 * Selection change callback for button groups
 */
export type SelectionChangeCallback<T = string> = OnChange<T>;

// ============================================================================
// Render/Export Callbacks
// ============================================================================

/**
 * Render start callback
 */
export type OnRenderStart = () => void;

/**
 * Render complete callback
 */
export type OnRenderComplete = (success: boolean) => void;

/**
 * Render progress callback
 */
export type OnRenderProgress = (progress: number) => void;

/**
 * Export complete callback
 */
export type OnExportComplete = (path: string) => void;

// ============================================================================
// Status/Loading Callbacks
// ============================================================================

/**
 * Loading state change callback
 */
export type OnLoadingChange = OnChange<boolean>;

/**
 * Error callback
 */
export type OnError = (error: Error | string) => void;

/**
 * Success callback
 */
export type OnSuccess<T = void> = (result: T) => void;

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Optional callback - can be undefined
 */
export type OptionalCallback<T extends (...args: any[]) => any> = T | undefined;

/**
 * Callback that returns a value
 */
export type CallbackWithReturn<TArgs extends any[], TReturn> = (
  ...args: TArgs
) => TReturn;

/**
 * Async callback
 */
export type AsyncCallback<TArgs extends any[] = []> = (
  ...args: TArgs
) => Promise<void>;
