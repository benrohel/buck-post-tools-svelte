import { writable } from "svelte/store";

export const currentProject = writable(null);
export const statuses = writable<any[]>([]);
