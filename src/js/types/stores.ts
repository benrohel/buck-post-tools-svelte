/**
 * Store state type definitions for Buck Post Tools CEP
 *
 * This file contains type definitions for all Svelte stores used in the application.
 * Import these to properly type store subscriptions and updates.
 *
 * @example
 * ```typescript
 * import type { AppStore } from '@/types/stores';
 * import { appStore } from '@/stores/app-store';
 *
 * $: currentSettings: AppStore = $appStore;
 * ```
 */

import type { Bookmark, Buck5LibrarySettings, AquariumProject } from './models';

// ============================================================================
// App Store
// ============================================================================

/**
 * AI Service configuration
 */
export interface AiService {
  /** Service name */
  name: string;
  /** API key */
  apiKey: string;
}

/**
 * Main application store state
 * Contains global app settings and preferences
 */
export interface AppStore {
  /** Whether to show tooltips */
  showTooltips: boolean;
  /** Default to Buck5 shot library on load */
  defaultToBuck5ShotLibrary: boolean;
  /** Latest Buck5 library settings */
  latestBuck5LibrarySettings: Buck5LibrarySettings;
  /** Application ID (AEFT or PPRO) */
  appId: string;
  /** Remember last folder search location */
  rememberLastFolderSearch: boolean;
  /** Remember last export path */
  rememberLastExportPath: boolean;
  /** Remember last export preset */
  rememberLastExportPreset: boolean;
  /** Show version mismatch warnings */
  showVersionWarnings: boolean;
  /** Array of favorited expression IDs */
  favoriteExpressions: string[];
  /** AI service configuration */
  aiService: AiService;
  /** Developer mode enabled */
  devMode: boolean;
  /** User scripts folder path */
  userScriptsFolder: string;
}

// ============================================================================
// Aquarium Store
// ============================================================================

/**
 * Aquarium API project type
 */
export interface AquariumApiProject {
  /** Project key/ID */
  _key: string;
  /** Project name */
  name: string;
  /** Project code */
  code?: string;
  /** Additional properties */
  [key: string]: any;
}

/**
 * Aquarium edit
 */
export interface AquariumEdit {
  /** Edit key/ID */
  _key: string;
  /** Edit name */
  name: string;
  /** Parent project key */
  projectKey?: string;
  /** Additional properties */
  [key: string]: any;
}

/**
 * Aquarium clip
 */
export interface AquariumClip {
  /** Clip key/ID */
  _key: string;
  /** Clip name */
  name: string;
  /** Parent edit key */
  editKey?: string;
  /** Additional properties */
  [key: string]: any;
}

/**
 * Aquarium shot
 */
export interface AquariumShot {
  /** Shot key/ID */
  _key: string;
  /** Shot name */
  name: string;
  /** Shot code */
  code?: string;
  /** Sequence */
  sequence?: string;
  /** Status */
  status?: string;
  /** Additional properties */
  [key: string]: any;
}

/**
 * Aquarium status
 */
export interface AquariumStatus {
  /** Status key/ID */
  _key: string;
  /** Status name */
  name: string;
  /** Status color */
  color?: string;
  /** Additional properties */
  [key: string]: any;
}

/**
 * Aquarium store state
 */
export interface AquariumStoreState {
  /** Available projects */
  projects: AquariumApiProject[];
  /** Current selected project */
  currentProject: AquariumApiProject | null;
  /** Active project */
  activeProject: AquariumApiProject | null;
  /** Whether user is logged in */
  loggedIn: boolean;
  /** Available edits */
  edits: AquariumEdit[];
  /** Current selected edit */
  currentEdit: AquariumEdit | null;
  /** Clips in current edit */
  editClips: AquariumClip[];
  /** Available shots */
  shots: AquariumShot[];
  /** Available statuses */
  statuses: AquariumStatus[];
}

// ============================================================================
// Bookmark Store
// ============================================================================

/**
 * Bookmark store state
 * Just an array of bookmarks, but typed for consistency
 */
export type BookmarkStoreState = Bookmark[];

// ============================================================================
// Server Store
// ============================================================================

/**
 * Buck5 server connection state
 */
export type Buck5ServerState = boolean;

// ============================================================================
// Buck5 Shot Library Store
// ============================================================================

/**
 * Buck5 shot library item
 */
export interface Buck5LibraryItem {
  /** Item ID */
  id: string;
  /** Item name */
  name: string;
  /** Item type */
  type: 'sequence' | 'shot' | 'task' | 'extension';
  /** Parent ID */
  parentId?: string;
  /** Children items */
  children?: Buck5LibraryItem[];
  /** Additional metadata */
  [key: string]: any;
}

/**
 * Buck5 shot library store state
 */
export interface Buck5ShotLibraryStoreState {
  /** Library items tree */
  items: Buck5LibraryItem[];
  /** Selected sequence */
  selectedSequence: string | null;
  /** Selected shot */
  selectedShot: string | null;
  /** Selected task */
  selectedTask: string | null;
  /** Selected extension */
  selectedExtension: string | null;
  /** Whether library is loading */
  isLoading: boolean;
}

// ============================================================================
// Local Storage Store
// ============================================================================

/**
 * Persisted local storage state
 * Contains various localStorage-persisted values
 */
export interface LocalStorageState {
  /** Last selected folder path */
  lastFolderPath?: string;
  /** Last export path */
  lastExportPath?: string;
  /** Last export preset name */
  lastExportPreset?: string;
  /** Stored project key */
  storedProject?: string;
  /** App store (persisted) */
  appStore?: AppStore;
  /** Bookmarks (persisted) */
  bookmarks?: Bookmark[];
  /** Additional persisted data */
  [key: string]: any;
}

// ============================================================================
// Notifications Store
// ============================================================================

/**
 * Notification item
 */
export interface Notification {
  /** Unique ID */
  id: string;
  /** Notification message */
  message: string;
  /** Notification type */
  type: 'info' | 'success' | 'warning' | 'error';
  /** Duration in ms (0 = persistent) */
  duration?: number;
  /** Timestamp */
  timestamp: number;
}

/**
 * Notifications store state
 */
export type NotificationsStoreState = Notification[];

// ============================================================================
// Export Helper Types
// ============================================================================

/**
 * Generic store value type
 * Use this when you need to reference a store's value type
 *
 * @example
 * ```typescript
 * import { appStore } from '@/stores/app-store';
 * import type { StoreValue } from '@/types/stores';
 *
 * type AppStoreValue = StoreValue<typeof appStore>;
 * ```
 */
export type StoreValue<T> = T extends { subscribe: (fn: (value: infer U) => void) => any }
  ? U
  : never;
