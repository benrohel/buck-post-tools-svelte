import { writable, Writable } from 'svelte/store';
import { appId } from '../lib/utils/cep';
export const appVersion = writable('');


interface AiService {
  name: "Claude" | "ChatGPT";
  model: string;
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
    name: 'Claude',
    model: 'claude-3-7-sonnet-20250219',
    apiKey: '',
  },
  devMode: false,
};

export const appStore = writable<AppStore>(defaultAppStore);
