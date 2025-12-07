import { writable, Writable } from 'svelte/store';
import { version } from '../../../package.json';

export const appVersion = writable('');
export const extensionVersion = writable(version);

interface AiService {
  name: string;
  apiKey: string;
}

interface LatestBuck5LibrarySettings {
  sequenceName: string;
  shotName: string;
  taskName: string;
  extensionName: string;
}

export interface AppStore {
  showTooltips: boolean;
  defaultToBuck5ShotLibrary: boolean;
  latestBuck5LibrarySettings: LatestBuck5LibrarySettings;
  appId: string;
  rememberLastFolderSearch: boolean;
  rememberLastExportPath: boolean;
  rememberLastExportPreset: boolean;
  showVersionWarnings: boolean;
  favoriteExpressions: string[];
  aiService: AiService;
  devMode: boolean;
  userScriptsFolder: string;
}

export const defaultAppStore: AppStore = {
  showTooltips: false,
  defaultToBuck5ShotLibrary: false,
  latestBuck5LibrarySettings: {
    sequenceName: '',
    shotName: '',
    taskName: '',
    extensionName: '',
  },
  appId: '',
  rememberLastFolderSearch: true,
  rememberLastExportPath: true,
  rememberLastExportPreset: true,
  showVersionWarnings: true,
  favoriteExpressions: [],
  aiService: {
    name: 'Claude AI',
    apiKey: '',
  },
  devMode: false,
  userScriptsFolder: '',
};

export const appStore = writable<AppStore>(defaultAppStore);
