import { writable, Writable } from 'svelte/store';
import { appId } from '../lib/utils/cep';
export const appVersion = writable('');

interface AiService {
  name: string;
  apiKey: string;
}

export interface AppStore {
  showTooltips: boolean;
  appId: string;
  rememberLastFolderSearch: boolean;
  rememberLastExportPath: boolean;
  rememberLastExportPreset: boolean;
  lastSlateFolder: string;
  lastSlateCSV: string;
  showVersionWarnings: boolean;
  favoriteExpressions: string[];
  aiService: AiService;
  devMode: boolean;
}

export const defaultAppStore: AppStore = {
  showTooltips: false,
  appId: appId,
  rememberLastFolderSearch: true,
  rememberLastExportPath: true,
  rememberLastExportPreset: true,
  lastSlateFolder: '',
  lastSlateCSV: '',
  showVersionWarnings: true,
  favoriteExpressions: [],
  aiService: {
    name: 'Claude AI',
    apiKey: '',
  },
  devMode: false,
};

export const appStore = writable<AppStore>(defaultAppStore);
