/**
 * Core data models for Buck Post Tools CEP
 *
 * This file contains all the primary data structures used throughout the application.
 * Import these types to replace `any` types in components and APIs.
 */

// ============================================================================
// Expression Types
// ============================================================================

/**
 * Expression snippet from Coda database
 * Used in After Effects expressions panel
 */
export interface ExpressionSnippet {
  /** Unique identifier */
  id: string;
  /** Expression data */
  values: ExpressionValues;
  /** Whether user has favorited this expression */
  favorite?: boolean;
}

/**
 * Values contained in an expression snippet
 */
export interface ExpressionValues {
  /** Display name of the expression */
  Name: string;
  /** The actual expression code */
  Expression: string;
  /** Variables used in the expression */
  Variables: string[];
  /** Creator of the expression */
  Creator: string;
  /** Description/documentation */
  Description: string;
  /** Property type this expression applies to */
  Property?: string;
}

// ============================================================================
// Clip and Media Types
// ============================================================================

/**
 * Metadata for a clip/media file
 * Used throughout the app for file tracking
 */
export interface ClipMetadata {
  /** Clip name */
  name: string;
  /** File path */
  path: string;
  /** Current version number */
  version?: number;
  /** Additional metadata */
  [key: string]: any;
}

/**
 * Version information for a file
 */
export interface VersionInfo {
  /** Version number */
  number: number;
  /** Version file path */
  path: string;
  /** Version name/label */
  name?: string;
  /** Date created */
  date?: string;
  /** Author */
  author?: string;
}

/**
 * Versioned file structure
 */
export interface VersionedFile {
  /** Base filename without version */
  baseName: string;
  /** File extension */
  extension: string;
  /** Version number */
  version: number;
  /** Full file path */
  fullPath: string;
}

// ============================================================================
// Export Types
// ============================================================================

/**
 * Export preset configuration
 */
export interface ExportPreset {
  /** Preset name */
  name: string;
  /** Path template with tokens */
  template: string;
}

/**
 * Path item in export tree structure
 */
export interface PathItem {
  /** Unique identifier */
  id: string;
  /** Item type */
  type: 'folder' | 'file';
  /** Full path */
  path: string;
  /** Display name */
  name: string;
  /** Whether item is being edited */
  isEditing?: boolean;
  /** Output module name (for files) */
  outputModule?: string;
  /** Child items (for folders) */
  children?: PathItem[];
  /** Whether folder is expanded */
  expanded?: boolean;
  /** Parent item ID */
  parentId?: string | null;
  /** Additional metadata */
  metadata?: {
    /** Is this an image sequence */
    isSequence?: boolean;
    /** Frame range [start, end] */
    frameRange?: [number, number];
    /** Total frame count */
    frameCount?: number;
    /** Frame numbers */
    frames?: number[];
    /** Sequence pattern */
    pattern?: string;
    /** Files in sequence */
    files?: string[];
    /** Allow additional properties */
    [key: string]: any;
  };
}

/**
 * Exporter configuration
 */
export interface Exporter {
  /** Exporter name */
  name: string;
  /** Preview path string */
  previewPath: string;
  /** Export path tree */
  path: PathItem[];
  /** Use relative paths */
  relativePath: boolean;
  /** Description */
  description?: string;
  /** Root export folder */
  rootFolder?: string;
  /** Latest version number */
  latestVersion?: number;
}

/**
 * Composition render data
 */
export interface CompRenderData {
  /** Composition name */
  compName: string;
  /** Node ID */
  nodeId: number;
  /** Project name */
  projectName: string;
  /** Project version */
  projectVersion: string;
}

/**
 * Export settings
 */
export interface ExportSettings {
  /** Root folder path */
  rootFolder: string;
  /** Selected preset */
  preset: string;
  /** Selected task */
  task: string;
  /** Version number */
  version: number;
  /** Additional settings */
  [key: string]: any;
}

// ============================================================================
// Project Types
// ============================================================================

/**
 * Project settings
 */
export interface ProjectSettings {
  /** Project name */
  name: string;
  /** Project path */
  path: string;
  /** Project version */
  version?: string;
  /** Additional settings */
  [key: string]: any;
}

/**
 * Project metadata
 */
export interface ProjectMetadata {
  /** Project name */
  name: string;
  /** Project file path */
  path: string;
  /** Created date */
  createdDate?: string;
  /** Modified date */
  modifiedDate?: string;
  /** File size in bytes */
  size?: number;
}

// ============================================================================
// Bookmark Types
// ============================================================================

/**
 * User bookmark for quick folder access
 */
export interface Bookmark {
  /** Bookmark display name */
  name: string;
  /** Folder path */
  path: string;
  /** Whether path is relative to project */
  isRelative: boolean;
}

/**
 * Bookmark group/category
 */
export interface BookmarkGroup {
  /** Group name */
  name: string;
  /** Bookmarks in this group */
  bookmarks: Bookmark[];
}

// ============================================================================
// File Browser Types
// ============================================================================

/**
 * File node in file browser tree
 */
export interface FileNode {
  /** File name */
  name: string;
  /** Full path */
  path: string;
  /** File size in bytes */
  size?: number;
  /** File extension */
  extension?: string;
  /** Is this an image sequence */
  isSequence?: boolean;
  /** Modified date */
  modifiedDate?: string;
}

/**
 * Directory node in file browser tree
 */
export interface DirectoryNode {
  /** Directory name */
  name: string;
  /** Full path */
  path: string;
  /** Child nodes */
  children?: FileSystemItem[];
  /** Whether expanded in UI */
  expanded?: boolean;
}

/**
 * Union type for file system items
 */
export type FileSystemItem = FileNode | DirectoryNode;

// ============================================================================
// Aquarium Types
// ============================================================================

/**
 * Aquarium project
 */
export interface AquariumProject {
  /** Project ID */
  id: string;
  /** Project name */
  name: string;
  /** Project code */
  code?: string;
  /** Description */
  description?: string;
}

/**
 * Aquarium asset
 */
export interface AquariumAsset {
  /** Asset ID */
  id: string;
  /** Asset name */
  name: string;
  /** Asset type */
  type: string;
  /** Parent project ID */
  projectId: string;
  /** Thumbnail URL */
  thumbnailUrl?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

// ============================================================================
// Tools Types
// ============================================================================

/**
 * User script tool
 */
export interface UserScript {
  /** Script name */
  name: string;
  /** Script file path */
  path: string;
  /** Description */
  description?: string;
  /** Icon name */
  icon?: string;
  /** Category */
  category?: string;
}

/**
 * Tool card data
 */
export interface ToolCard {
  /** Tool name */
  name: string;
  /** Tool description */
  description: string;
  /** Icon component or name */
  icon?: string;
  /** Click handler */
  onClick?: () => void;
}

// ============================================================================
// Sequence Types
// ============================================================================

/**
 * Sequence information
 */
export interface SequenceInfo {
  /** Sequence name */
  name: string;
  /** Frame width */
  width: number;
  /** Frame height */
  height: number;
  /** Frame rate */
  frameRate: number;
  /** Duration in frames */
  duration?: number;
}

/**
 * Sequence preset
 */
export interface SequencePreset {
  /** Preset name */
  name: string;
  /** Width in pixels */
  width: string;
  /** Height in pixels */
  height: string;
  /** Frame rate */
  framerate: string;
  /** Pixel aspect ratio */
  pixelAspectRatio?: string;
}

// ============================================================================
// Marker Types
// ============================================================================

/**
 * Timeline marker
 */
export interface Marker {
  /** Marker name/comment */
  name: string;
  /** Time in seconds */
  time: number;
  /** Duration in seconds */
  duration?: number;
  /** Marker type/color */
  type?: string;
}

// ============================================================================
// Color Management Types
// ============================================================================

/**
 * Color space information
 */
export interface ColorSpace {
  /** Color space name */
  name: string;
  /** Working space */
  workingSpace?: string;
  /** LUT file path */
  lutPath?: string;
}

// ============================================================================
// Buck5 Types
// ============================================================================

/**
 * Buck5 shot library settings
 */
export interface Buck5LibrarySettings {
  /** Sequence name */
  sequenceName: string;
  /** Shot name */
  shotName: string;
  /** Task name */
  taskName: string;
  /** Extension name */
  extensionName: string;
}

/**
 * Buck5 shot
 */
export interface Buck5Shot {
  /** Shot ID */
  id: string;
  /** Shot name */
  name: string;
  /** Shot code */
  code?: string;
  /** Sequence name */
  sequence?: string;
  /** Frame range */
  frameRange?: [number, number];
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Generic option for dropdowns/selects
 */
export interface Option<T = string> {
  /** Display label */
  label: string;
  /** Option value */
  value: T;
  /** Whether option is disabled */
  disabled?: boolean;
}

/**
 * Generic key-value pair
 */
export interface KeyValue<V = string> {
  key: string;
  value: V;
}

/**
 * Select tool item for tool/mode selection dropdowns
 * Used in containers like ExportContainer, ToolsContainer, etc.
 */
export interface SelectToolItem {
  /** Unique value identifier */
  value: string;
  /** Display label */
  label: string;
  /** Svelte component to render */
  component: any;
  /** Applicable apps (AEFT, PPRO) */
  apps: string[];
}
