import { writable, type Writable } from 'svelte/store';
import { logModule } from '@/lib/logger';

const log = logModule('user-storage');

export function createLocalStore<T>(key: string, initialValue: T): Writable<T> {
  // Safely load from localStorage
  const safeLoad = (): T => {
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
  const store = writable<T>(safeLoad());

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

// Usage example:
export const userPreferences = createLocalStore('userPreferences', {
  theme: 'dark',
  notifications: true,
});
