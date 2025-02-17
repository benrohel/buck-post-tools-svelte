import { writable } from "svelte/store";
import type * as BUCK5 from "../api/buck5/index.d";

const safeload = (key: string) => {
  try {
    if (localStorage.getItem(key) === null) {
      return null;
    }
    return JSON.parse(localStorage.getItem(key) ?? "");
  } catch (error) {
    console.error("Error loading data from localStorage:", error);
    return null;
  }
};

const storedUser = safeload("user");

export const userSession = writable<BUCK5.UserData | null>(
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

// Session Project
export const storedProject = safeload("localProject");
export const sessionProject = writable<string | null>(
  //@ts-ignore
  storedProject ? localStorage.getItem("localProject") : ""
);

sessionProject.subscribe((value) => {
  if (value === "") {
    return;
  } else {
    localStorage.setItem("localProject", value);
  }
});

// TrackerType
export const storedTrackerType = safeload("trackertype");
export const trackerType = writable<string | null>(
  //@ts-ignore

  storedTrackerType ? localStorage.getItem("trackertype") : ""
);
trackerType.subscribe((value) => {
  console.log("trackerType", value);
  if (value === "") {
    return;
  } else {
    localStorage.setItem("trackertype", value);
  }
});

// Coda Doc
const storedDoc = safeload("codadoc");
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
const storedCodaTable = safeload("codatable");
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

// StillOutput Folder
const storedStillOutputFolder = safeload("stillfolder");
export const stillOutputFolder = writable<string | null>(
  //@ts-ignore
  JSON.parse(
    storedStillOutputFolder ? localStorage.getItem("stillfolder") : null
  )
);
stillOutputFolder.subscribe((value) => {
  if (value === "") {
    return;
  } else {
    localStorage.setItem("stillfolder", JSON.stringify(value));
  }
});

// Sequence Output Folder
const storedSSequenceOutputFolder = safeload("sequencefolder");
export const sequenceOutputFolder = writable<string | null>(
  //@ts-ignore
  JSON.parse(
    storedSSequenceOutputFolder ? localStorage.getItem("sequencefolder") : null
  )
);
sequenceOutputFolder.subscribe((value) => {
  if (value === "") {
    return;
  } else {
    localStorage.setItem("sequencefolder", JSON.stringify(value));
  }
});

// Export Presets
const storedExportPresets = safeload("aeexportpresets");
export const exportPresets = writable<string | null>(
  //@ts-ignore
  JSON.parse(
    storedExportPresets ? localStorage.getItem("aeexportpresets") : null
  )
);
exportPresets.subscribe((value) => {
  if (value === "") {
    return "";
  } else {
    localStorage.setItem("aeexportpresets", JSON.stringify(value));
  }
});

// Selected Export Preset
const storedSelectedExportPreset = safeload("selectedExportPresets");
export const selectedExportPreset = writable<any | null>(
  //@ts-ignore
  JSON.parse(
    storedSelectedExportPreset
      ? localStorage.getItem("selectedExportPresets")
      : null
  )
);
selectedExportPreset.subscribe((value) => {
  if (value === "") {
    return {};
  } else {
    localStorage.setItem("selectedExportPresets", JSON.stringify(value));
  }
});
