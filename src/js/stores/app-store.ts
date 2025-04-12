import { writable } from 'svelte/store';
export const appId = writable<string | null>(null);
export const showTooltips = writable<boolean>(false);

