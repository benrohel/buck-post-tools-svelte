import { writable } from 'svelte/store';
import { appId } from '../lib/utils/cep';

export interface AppStore {
  showTooltips: boolean;
  appId: string;
  rememberLastFolderSearch: boolean;
  rememberLastExportPath: boolean;
}

export const defaultAppStore: AppStore = {
  showTooltips: false,
  appId: appId,
  rememberLastFolderSearch: true,
  rememberLastExportPath: true,
};

export const appStore = writable<AppStore>(defaultAppStore);
