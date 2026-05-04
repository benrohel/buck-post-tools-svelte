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

interface LatestBuck5AssetLibrarySettings {
  libraryName: string;
  assetName: string;
  taskName: string;
  extensionName: string;
}

export interface AppStore {
  showTooltips: boolean;
  defaultToBuck5ShotLibrary: boolean;
  latestBuck5LibrarySettings: LatestBuck5LibrarySettings;
  latestBuck5AssetLibrarySettings: LatestBuck5AssetLibrarySettings;
  appId: 'AEFT' | 'PPRO';
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
  latestBuck5AssetLibrarySettings: {
    libraryName: '',
    assetName: '',
    taskName: '',
    extensionName: '',
  },
  appId: 'AEFT',
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
