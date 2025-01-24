import { writable } from "svelte/store";

export const trackerType = writable<"coda" | "aquarium">("coda");
