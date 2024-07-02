import { writable } from "svelte/store";
import { asyncReadable, asyncDerived } from "@square/svelte-store";
import { selectedCodaProject } from "./coda-store";
import { GetCodaIdFromUrl } from "../api/coda/coda";
const storedUser = localStorage.getItem("user");
export const userSession = writable<UserData | null>(
  //@ts-ignore
  JSON.parse(storedUser ? localStorage.getItem("user") : null)
);
userSession.subscribe((value) => {
  if (value === null) {
    return;
  } else {
    localStorage.setItem("user", JSON.stringify(value));
  }
});

const storedProject = localStorage.getItem("localProject");
export const sessionProject = writable<string | null>(
  //@ts-ignore
  JSON.parse(storedProject ? localStorage.getItem("localProject") : null)
);
sessionProject.subscribe((value) => {
  if (value === "") {
    return;
  } else {
    localStorage.setItem("localProject", JSON.stringify(value));
  }
});

// Coda Doc
const storedDoc = localStorage.getItem("codadoc");
export const codaDoc = writable<string | null>(
  //@ts-ignore
  JSON.parse(storedDoc ? localStorage.getItem("codadoc") : null)
);
codaDoc.subscribe((value) => {
  if (value === "") {
    return;
  } else {
    localStorage.setItem("codadoc", JSON.stringify(value));
  }
});

// Coda Table
const storedCodaTable = localStorage.getItem("codatable");
export const codaTable = writable<string | null>(
  //@ts-ignore
  JSON.parse(storedCodaTable ? localStorage.getItem("codatable") : null)
);
codaTable.subscribe((value) => {
  if (value === "") {
    return;
  } else {
    localStorage.setItem("codatable", JSON.stringify(value));
  }
});

// export const codaId = asyncDerived(
//   selectedCodaProject,
//   async ($selectedCodaProject) => {
//     let id = "";
//     if ($selectedCodaProject) {
//       id = GetCodaIdFromUrl($selectedCodaProject?.docUrl);
//     }
//     return id;
//   }
// );
