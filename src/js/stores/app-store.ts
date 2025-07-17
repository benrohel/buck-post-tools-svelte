import { writable, Writable } from 'svelte/store';
import { appId } from '../lib/utils/cep';
import {version} from "../../../package.json"

export const appVersion = writable('');
export const extensionVersion = writable(version);

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
  showVersionWarnings: boolean;
  favoriteExpressions: string[];
  aiService: AiService;
  devMode: boolean;
  userScriptsFolder: string;
}

export const defaultAppStore: AppStore = {
  showTooltips: false,
  appId: appId,
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
