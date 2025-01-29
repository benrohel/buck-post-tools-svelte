import { asyncDerived, asyncReadable } from '@square/svelte-store';
import { derived, writable } from 'svelte/store';
import {
  GetEdits,
  GetClips,
  Authenticated,
  Project,
} from '../api/buck5/buck5-api';
import { storedProject } from './local-storage';
export const projects = writable<any[]>([]);

export const currentProject = asyncReadable<any>(null, async () => {
  const proj = await Project(storedProject);
  if (proj) return proj;
});

export const loggedIn = asyncReadable<boolean>(
  null,
  async () => {
    const response = await Authenticated();

    console.log(response);
    return response ? true : false;
  },
  { reloadable: true }
);

export const edits = derived(currentProject, async ($currentProject) => {
  let ed = await GetEdits($currentProject._key);
  console.log('edits', ed);
  return ed;
});

export const currentEdit = writable<any>({});

export const editClips = derived(currentEdit, async ($currentEdit) => {
  let edClips = await GetClips($currentEdit._key);
  console.log('edClips', edClips);
  return edClips;
});
export const shots = writable<any[]>([]);

export const statuses = writable<any[]>([]);
