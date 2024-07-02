import { writable, derived } from "svelte/store";
import { asyncDerived, asyncReadable } from "@square/svelte-store";
import { GetProjectTrackerInfos } from "../api/coda/coda";

declare interface CodaTrackerInfos {
  docUrl: string;
  name: string;
  tableName: string;
  compVersion: string;
  editVersion: string;
}

export const codaTrackerInfos = asyncReadable<CodaTrackerInfos[] | null>(
  null,
  async () => {
    const response = await GetProjectTrackerInfos();
    console.log(response);
    return response;
  },
  { reloadable: true }
);

export const selectedCodaProject = writable<CodaTrackerInfos | null>(null);
