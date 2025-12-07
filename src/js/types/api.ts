/**
 * API type definitions for Buck Post Tools CEP
 *
 * This file contains type definitions for API requests and responses.
 * Use these to properly type API calls and responses.
 *
 * @example
 * ```typescript
 * import type { ApiResponse, CodaResponse } from '@/types/api';
 *
 * async function fetchData(): Promise<ApiResponse<MyData>> {
 *   const response = await fetch(url);
 *   return response.json();
 * }
 * ```
 */

import type { ExpressionSnippet, AquariumProject, Buck5Shot } from './models';

// ============================================================================
// Generic API Response Types
// ============================================================================

/**
 * Standard API response wrapper
 * @template T The type of data returned
 */
export interface ApiResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data (if successful) */
  data?: T;
  /** Error message (if failed) */
  error?: string;
  /** Error code (if failed) */
  errorCode?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * API error details
 */
export interface ApiError {
  /** Error message */
  message: string;
  /** Error code */
  code?: string;
  /** HTTP status code */
  statusCode?: number;
  /** Additional error details */
  details?: any;
  /** Stack trace (dev mode only) */
  stack?: string;
}

/**
 * Paginated API response
 * @template T The type of items in the page
 */
export interface PaginatedResponse<T> {
  /** Items in this page */
  items: T[];
  /** Total number of items */
  total: number;
  /** Current page number (0-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there's a next page */
  hasNext: boolean;
  /** Whether there's a previous page */
  hasPrevious: boolean;
}

// ============================================================================
// Coda API Types
// ============================================================================

/**
 * Coda API response wrapper
 * @template T The type of rows/items returned
 */
export interface CodaResponse<T> {
  /** Array of items */
  items: T[];
  /** Next page token */
  nextPageToken?: string;
  /** Next page URL */
  nextPageUrl?: string;
}

/**
 * Coda table row
 */
export interface CodaRow {
  /** Row ID */
  id: string;
  /** Row type */
  type: string;
  /** Row href/URL */
  href: string;
  /** Row name */
  name: string;
  /** Row index */
  index: number;
  /** Browser link */
  browserLink: string;
  /** Created date */
  createdAt: string;
  /** Updated date */
  updatedAt: string;
  /** Row values */
  values: Record<string, CodaValue>;
}

/**
 * Coda cell value
 */
export type CodaValue = string | number | boolean | CodaValueObject;

/**
 * Coda value object (for complex types)
 */
export interface CodaValueObject {
  /** Value type */
  type?: string;
  /** Actual value */
  value?: any;
  /** Display value */
  display?: string;
  /** Additional properties */
  [key: string]: any;
}

/**
 * Coda table info
 */
export interface CodaTable {
  /** Table ID */
  id: string;
  /** Table type */
  type: string;
  /** Table href/URL */
  href: string;
  /** Browser link */
  browserLink: string;
  /** Table name */
  name: string;
  /** Parent doc/section */
  parent: {
    id: string;
    type: string;
    href: string;
    name?: string;
  };
  /** Display column */
  displayColumn: {
    id: string;
    type: string;
    href: string;
  };
  /** Row count */
  rowCount: number;
  /** Sort order */
  sorts: any[];
  /** Created date */
  createdAt: string;
  /** Updated date */
  updatedAt: string;
}

// ============================================================================
// Buck5/Aquarium API Types
// ============================================================================

/**
 * Buck5 authentication response
 */
export interface Buck5AuthResponse {
  /** Whether authenticated */
  authenticated: boolean;
  /** User info */
  user?: {
    id: string;
    username: string;
    email?: string;
  };
  /** Auth token */
  token?: string;
}

/**
 * Buck5 project response
 */
export interface Buck5ProjectResponse {
  /** Project key */
  _key: string;
  /** Project ID */
  _id?: string;
  /** Project name */
  name: string;
  /** Project code */
  code?: string;
  /** Description */
  description?: string;
  /** Created date */
  created?: string;
  /** Updated date */
  updated?: string;
  /** Additional properties */
  [key: string]: any;
}

/**
 * Buck5 edit response
 */
export interface Buck5EditResponse {
  /** Edit key */
  _key: string;
  /** Edit ID */
  _id?: string;
  /** Edit name */
  name: string;
  /** Parent project key */
  projectKey: string;
  /** Additional properties */
  [key: string]: any;
}

/**
 * Buck5 clip response
 */
export interface Buck5ClipResponse {
  /** Clip key */
  _key: string;
  /** Clip ID */
  _id?: string;
  /** Clip name */
  name: string;
  /** Parent edit key */
  editKey: string;
  /** File path */
  path?: string;
  /** Additional properties */
  [key: string]: any;
}

/**
 * Buck5 shot library response
 */
export interface Buck5ShotLibraryResponse {
  /** Sequences */
  sequences: Buck5Sequence[];
}

/**
 * Buck5 sequence
 */
export interface Buck5Sequence {
  /** Sequence name */
  name: string;
  /** Sequence code */
  code?: string;
  /** Shots in sequence */
  shots: Buck5Shot[];
}

// ============================================================================
// File API Types
// ============================================================================

/**
 * File info response
 */
export interface FileInfo {
  /** File name */
  name: string;
  /** Full path */
  path: string;
  /** File size in bytes */
  size: number;
  /** File extension */
  extension: string;
  /** Created date */
  created: Date | string;
  /** Modified date */
  modified: Date | string;
  /** Whether file exists */
  exists: boolean;
  /** Is directory */
  isDirectory: boolean;
  /** Is file */
  isFile: boolean;
}

/**
 * Directory listing response
 */
export interface DirectoryListing {
  /** Directory path */
  path: string;
  /** Files in directory */
  files: FileInfo[];
  /** Subdirectories */
  directories: FileInfo[];
  /** Total items */
  total: number;
}

/**
 * File version response
 */
export interface FileVersionResponse {
  /** Base filename */
  baseName: string;
  /** Current version */
  currentVersion: number;
  /** All versions */
  versions: FileVersionInfo[];
  /** Latest version path */
  latestPath: string;
}

/**
 * File version info
 */
export interface FileVersionInfo {
  /** Version number */
  version: number;
  /** Version file path */
  path: string;
  /** File size */
  size: number;
  /** Modified date */
  modified: Date | string;
  /** Is current version */
  isCurrent: boolean;
}

// ============================================================================
// Video API Types
// ============================================================================

/**
 * Video file metadata
 */
export interface VideoMetadata {
  /** File path */
  path: string;
  /** Duration in seconds */
  duration: number;
  /** Frame rate */
  frameRate: number;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Codec */
  codec?: string;
  /** Bitrate */
  bitrate?: number;
  /** File size */
  size: number;
}

/**
 * Video comparison result
 */
export interface VideoComparisonResult {
  /** Whether videos match */
  matches: boolean;
  /** Differences found */
  differences: VideoDifference[];
  /** Comparison timestamp */
  comparedAt: string;
}

/**
 * Video difference
 */
export interface VideoDifference {
  /** Property that differs */
  property: string;
  /** Expected value */
  expected: any;
  /** Actual value */
  actual: any;
  /** Difference description */
  description?: string;
}

// ============================================================================
// Export API Types
// ============================================================================

/**
 * Render job request
 */
export interface RenderJobRequest {
  /** Composition ID */
  compId: number;
  /** Output path */
  outputPath: string;
  /** Output module preset */
  preset: string;
  /** Render settings */
  settings?: RenderSettings;
}

/**
 * Render settings
 */
export interface RenderSettings {
  /** Frame range start */
  startFrame?: number;
  /** Frame range end */
  endFrame?: number;
  /** Quality setting */
  quality?: number;
  /** Use multiprocessing */
  multiprocessing?: boolean;
  /** Additional settings */
  [key: string]: any;
}

/**
 * Render job response
 */
export interface RenderJobResponse {
  /** Job ID */
  jobId: string;
  /** Job status */
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  /** Progress (0-100) */
  progress: number;
  /** Error message if failed */
  error?: string;
  /** Output file path */
  outputPath?: string;
}

// ============================================================================
// Preferences API Types
// ============================================================================

/**
 * User preferences
 */
export interface UserPreferences {
  /** Preference key */
  key: string;
  /** Preference value */
  value: any;
  /** Last updated */
  updated?: string;
}

/**
 * Get preferences response
 */
export interface GetPreferencesResponse {
  /** Preferences map */
  preferences: Record<string, any>;
  /** User ID */
  userId?: string;
}

/**
 * Save preferences request
 */
export interface SavePreferencesRequest {
  /** Preferences to save */
  preferences: Record<string, any>;
  /** Merge with existing (vs replace) */
  merge?: boolean;
}

// ============================================================================
// Timeline API Types
// ============================================================================

/**
 * Timeline clip info
 */
export interface TimelineClipInfo {
  /** Clip ID */
  id: number;
  /** Clip name */
  name: string;
  /** Start time in seconds */
  startTime: number;
  /** Duration in seconds */
  duration: number;
  /** In point */
  inPoint: number;
  /** Out point */
  outPoint: number;
  /** Source file path */
  sourceFile?: string;
  /** Track index */
  trackIndex?: number;
}

/**
 * Timeline info
 */
export interface TimelineInfo {
  /** Timeline name */
  name: string;
  /** Duration */
  duration: number;
  /** Frame rate */
  frameRate: number;
  /** Clips in timeline */
  clips: TimelineClipInfo[];
  /** Markers */
  markers?: any[];
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * API request options
 */
export interface ApiRequestOptions {
  /** Request method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: any;
  /** Request timeout in ms */
  timeout?: number;
  /** Retry attempts */
  retries?: number;
}

/**
 * API endpoint configuration
 */
export interface ApiEndpoint {
  /** Base URL */
  baseUrl: string;
  /** API version */
  version?: string;
  /** Authentication token */
  token?: string;
  /** Default headers */
  headers?: Record<string, string>;
}
