import { writable, Writable } from 'svelte/store';
import { PROJECT_ROOT } from "@/api/files/files"
import { logModule } from '@/lib/logger';

const log = logModule('bookmark-store');

export interface Bookmark {
  name: string;
  path: string;
  isRelative: boolean;
}


let initialBookmarks: Bookmark[] = [];


// export const bookmarkStore = writable<Bookmark[]>([]);
// bookmarkStore.subscribe((value) => {
//   if (value === null) {
//     return;
//   } else {
//     localStorage.setItem('bookmarks', JSON.stringify(value));
// }
// });

export function createBookmarkStore(key: string, initialValue = initialBookmarks): Writable<Bookmark[]> {
  // Safely load from localStorage
  const safeLoad = (): Bookmark[] => {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue === null) {
        return initialValue;
      }
      return JSON.parse(storedValue);
    } catch (error) {
      log.error(`Failed to load ${key} from localStorage`, error as Error, { key });
      return initialValue;
    }
  };

  // Create the store with stored value or initial value
  const store = writable<Bookmark[]>(safeLoad());

  // Subscribe to changes and update localStorage
  store.subscribe((value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      log.error(`Failed to save ${key} to localStorage`, error as Error, { key });
    }
  });

  return store;
}


function resolvePath(path: string, isRelative: boolean) {
  if (isRelative) {
    const projectRoot = PROJECT_ROOT;

    return path;
  } else {
    return path.replace('file://', '');
  }
}
