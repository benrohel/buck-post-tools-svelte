import { writable } from 'svelte/store';
import { appId } from '../lib/utils/cep';


export interface AppStore {
  showTooltips: boolean;
  appId: string;
  rememberLastFolderSearch: boolean;
}

export const defaultAppStore: AppStore = {
  showTooltips: false,
  appId: appId,
  rememberLastFolderSearch: true,
};

export const appStore = writable<AppStore>(defaultAppStore);