import { asyncDerived, asyncReadable } from '@square/svelte-store';
import { derived, writable } from 'svelte/store';
import {
  GetEdits,
  GetClips,
  Authenticated,
  Project,
} from '@/api/buck5/buck5-api';
import type * as BUCK5 from '@/api/buck5';
import { storedProject } from '@/stores/local-storage';

export const projects = writable<BUCK5.Item[]>([]);

export const currentProject = asyncReadable<BUCK5.Item | null>(
  null,
  async () => {
    if (!storedProject) return null;
    const proj = await Project(storedProject);
    return proj ?? null;
  }
);

export const activeProject = writable<BUCK5.Item | null>(null);

export const loggedIn = asyncReadable<boolean>(false, async () => {
  const response = await Authenticated();

  console.log(response);
  return response ? true : false;
});

export const edits = derived(currentProject, async ($currentProject) => {
  if (!$currentProject) return [];
  let ed = await GetEdits($currentProject._key);
  console.log('edits', ed);
  return ed;
});

export const currentEdit = writable<BUCK5.Item | null>(null);

export const editClips = derived(currentEdit, async ($currentEdit) => {
  if (!$currentEdit) return [];
  let edClips = await GetClips($currentEdit._key);
  console.log('edClips', edClips);
  return edClips;
});
export const shots = writable<BUCK5.Item[]>([]);

export const statuses = writable<BUCK5.Item[]>([]);
