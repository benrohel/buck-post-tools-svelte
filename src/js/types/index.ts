/**
 * Type definitions index
 *
 * Central export point for all type definitions in Buck Post Tools CEP.
 * Import types from this file for convenience.
 *
 * @example
 * ```typescript
 * // Import specific types
 * import type { ClipMetadata, OnChange, AppStore } from '@/types';
 *
 * // Or import from specific modules
 * import type { ClipMetadata } from '@/types/models';
 * import type { OnChange } from '@/types/callbacks';
 * ```
 */

// Re-export all types from models
export type {
  // Expression types
  ExpressionSnippet,
  ExpressionValues,
  // Clip and media types
  ClipMetadata,
  VersionInfo,
  VersionedFile,
  // Export types
  ExportPreset,
  PathItem,
  Exporter,
  CompRenderData,
  ExportSettings,
  // Project types
  ProjectSettings,
  ProjectMetadata,
  // Bookmark types
  Bookmark,
  BookmarkGroup,
  // File browser types
  FileNode,
  DirectoryNode,
  FileSystemItem,
  // Aquarium types
  AquariumProject,
  AquariumAsset,
  // Tools types
  UserScript,
  ToolCard,
  // Sequence types
  SequenceInfo,
  SequencePreset,
  // Marker types
  Marker,
  // Color management types
  ColorSpace,
  // Buck5 types
  Buck5LibrarySettings,
  Buck5Shot,
  // Utility types
  Option,
  KeyValue,
} from './models';

// Re-export all types from callbacks
export type {
  // Generic callbacks
  OnChange,
  OnChangeAsync,
  OnSelect,
  OnUpdate,
  OnClick,
  OnClickAsync,
  OnClose,
  OnConfirm,
  OnCancel,
  OnSubmit,
  OnSubmitAsync,
  OnChange2,
  // DOM event handlers
  InputChangeHandler,
  ButtonClickHandler,
  KeyboardEventHandler,
  FileSelectHandler,
  DragEventHandler,
  // Domain-specific callbacks
  ClipSelectCallback,
  ClipChangeCallback,
  ClipReplaceCallback,
  ClipImportCallback,
  ExpressionSelectCallback,
  ExpressionUpdateCallback,
  BookmarkSelectCallback,
  BookmarkChangeCallback,
  PathItemSelectCallback,
  MarkerSelectCallback,
  OptionSelectCallback,
  MultiSelectChangeCallback,
  FolderSelectCallback,
  FileSelectCallback,
  VersionSelectCallback,
  CodeChangeCallback,
  ToggleChangeCallback,
  NumberChangeCallback,
  SelectionChangeCallback,
  // Render/export callbacks
  OnRenderStart,
  OnRenderComplete,
  OnRenderProgress,
  OnExportComplete,
  // Status/loading callbacks
  OnLoadingChange,
  OnError,
  OnSuccess,
  // Helper types
  OptionalCallback,
  CallbackWithReturn,
  AsyncCallback,
} from './callbacks';

// Re-export all types from stores
export type {
  // App store
  AiService,
  AppStore,
  // Aquarium store
  AquariumApiProject,
  AquariumEdit,
  AquariumClip,
  AquariumShot,
  AquariumStatus,
  AquariumStoreState,
  // Bookmark store
  BookmarkStoreState,
  // Server store
  Buck5ServerState,
  // Buck5 shot library store
  Buck5LibraryItem,
  Buck5ShotLibraryStoreState,
  // Local storage store
  LocalStorageState,
  // Notifications store
  Notification,
  NotificationsStoreState,
  // Helper types
  StoreValue,
} from './stores';

// Re-export all types from api
export type {
  // Generic API types
  ApiResponse,
  ApiError,
  PaginatedResponse,
  // Coda API types
  CodaResponse,
  CodaRow,
  CodaValue,
  CodaValueObject,
  CodaTable,
  // Buck5/Aquarium API types
  Buck5AuthResponse,
  Buck5ProjectResponse,
  Buck5EditResponse,
  Buck5ClipResponse,
  Buck5ShotLibraryResponse,
  Buck5Sequence,
  // File API types
  FileInfo,
  DirectoryListing,
  FileVersionResponse,
  FileVersionInfo,
  // Video API types
  VideoMetadata,
  VideoComparisonResult,
  VideoDifference,
  // Export API types
  RenderJobRequest,
  RenderSettings,
  RenderJobResponse,
  // Preferences API types
  UserPreferences,
  GetPreferencesResponse,
  SavePreferencesRequest,
  // Timeline API types
  TimelineClipInfo,
  TimelineInfo,
  // Helper types
  ApiRequestOptions,
  ApiEndpoint,
} from './api';
