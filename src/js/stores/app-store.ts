import { writable } from 'svelte/store';
export const appId = writable<string | null>(null);