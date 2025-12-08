import { writable, Writable } from 'svelte/store';
import type * as BUCK5 from '@/api/buck5/index.d';
import { defaultAppStore, type AppStore } from '@/stores/app-store';
import { logModule } from '@/lib/logger';

const log = logModule('local-storage');

/**
 * Helper to safely load and parse data from localStorage
 * @param key - localStorage key
 * @returns Parsed value or null if not found/invalid
 */
const safeLoad = <T = any>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return null;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    log.error(`Failed to load ${key} from localStorage`, error as Error, {
      key,
    });
    return null;
  }
};

/**
 * Create a writable store that persists to localStorage
 * @param key - localStorage key
 * @param initialValue - Default value if localStorage is empty
 * @returns Writable store synced with localStorage
 */
export function createLocalStore<T>(key: string, initialValue: T): Writable<T> {
  // Load initial value from localStorage
  const storedValue = safeLoad<T>(key);
  const store = writable<T>(storedValue ?? initialValue);

  // Subscribe to changes and update localStorage
  store.subscribe((value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      log.error(`Failed to save ${key} to localStorage`, error as Error, {
        key,
      });
    }
  });

  return store;
}

// ============================================================================
// Persisted Stores
// ============================================================================

export const userSession = createLocalStore<BUCK5.UserData | null>(
  'user',
  null
);

export const storedProject = safeLoad<string>('localProject');

export const sessionProject = createLocalStore<string>(
  'localProject',
  storedProject ?? ''
);

export const trackerType = createLocalStore<string>('trackertype', '');

export const codaDoc = createLocalStore<string>('codadoc', '');

export const codaTable = createLocalStore<string>('codatable', '');

export const stillOutputFolder = createLocalStore<string>('stillfolder', '');

export const sequenceOutputFolder = createLocalStore<string>(
  'sequencefolder',
  ''
);

export const exportPresets = createLocalStore<string>('aeexportpresets', '');

export const selectedExportPreset = createLocalStore<any>(
  'selectedExportPresets',
  null
);

export const lastFolderSearch = createLocalStore<string>(
  'lastfoldersearch',
  ''
);

export const lastFolderExport = createLocalStore<string>(
  'lastfolderexport',
  ''
);

export const storedExportSettings = createLocalStore<string>(
  'exportsettings',
  ''
);

export const storedExportRootFolder = createLocalStore<string>(
  'exportrootfolder',
  ''
);

export const localAppStore = createLocalStore<AppStore>(
  'localappstore',
  defaultAppStore
);
