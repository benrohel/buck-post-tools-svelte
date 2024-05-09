import { derived, writable } from "svelte/store";
import { GetEdits, GetClips } from "../api/buck5/buck5-api";
export const projects = writable<any[]>([]);
export const currentProject = writable<any>(null);

export const edits = derived(currentProject, async ($currentProject) => {
  let ed = await GetEdits($currentProject._key);
  console.log("edits", ed);
  return ed;
});
export const currentEdit = writable<any>({});

export const editClips = derived(currentEdit, async ($currentEdit) => {
  let edClips = await GetClips($currentEdit._key);
  console.log("edClips", edClips);
  return edClips;
});
export const shots = writable<any[]>([]);

export const statuses = writable<any[]>([]);
