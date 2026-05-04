import { writable } from 'svelte/store';
import { type PathItem } from '@/api/exporter';

interface MenuOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface Buck5AssetLibraryStore {
  pathStructure: PathItem[];
  libraryNames: MenuOption[];
  assetNames: MenuOption[];
  taskNames: MenuOption[];
  existingMediaFiles: string[];
  lastUpdated: Date | null;
  isLoaded: boolean;
}

export const defaultBuck5AssetLibraryStore: Buck5AssetLibraryStore = {
  pathStructure: [],
  libraryNames: [],
  assetNames: [],
  taskNames: [],
  existingMediaFiles: [],
  lastUpdated: null,
  isLoaded: false,
};

export const buck5AssetLibraryStore = writable<Buck5AssetLibraryStore>(defaultBuck5AssetLibraryStore);
