import { writable } from 'svelte/store';

export const trackerType = writable<'coda' | 'aquarium'>('coda');
export const activeProjectKey = writable<string | null>(null);
