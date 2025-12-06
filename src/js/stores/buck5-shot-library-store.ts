import { writable } from 'svelte/store';
import { type PathItem } from '@/api/exporter';

interface MenuOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface Buck5ShotLibraryStore {
  pathStructure: PathItem[];
  shotNames: MenuOption[];
  sequenceNames: MenuOption[];
  taskNames: MenuOption[];
  existingMediaFiles: string[];
  lastUpdated: Date | null;
  isLoaded: boolean;
}

export const defaultBuck5ShotLibraryStore: Buck5ShotLibraryStore = {
  pathStructure: [],
  shotNames: [],
  sequenceNames: [],
  taskNames: [],
  existingMediaFiles: [],
  lastUpdated: null,
  isLoaded: false,
};

export const buck5ShotLibraryStore = writable<Buck5ShotLibraryStore>(defaultBuck5ShotLibraryStore);