import { writable } from 'svelte/store';
import type * as BUCK5 from '../api/buck5/index.d';
const storedUser = localStorage.getItem('user') ?? '';

export const userSession = writable<BUCK5.UserData | null>(
  //@ts-ignore
  JSON.parse(storedUser ? localStorage.getItem('user') : null)
);
userSession.subscribe((value) => {
  if (value === null) {
    return;
  } else {
    localStorage.setItem('user', JSON.stringify(value));
  }
});

// Session Project
export const storedProject = localStorage.getItem('localProject') ?? '';
export const sessionProject = writable<string | null>(
  //@ts-ignore
  storedProject ? localStorage.getItem('localProject') : ''
);

sessionProject.subscribe((value) => {
  if (value === '') {
    return;
  } else {
    localStorage.setItem('localProject', value);
  }
});

// TrackerType
export const storedTrackerType = localStorage.getItem('trackertype') ?? '';
export const trackerType = writable<string | null>(
  //@ts-ignore

  storedTrackerType ? localStorage.getItem('trackertype') : ''
);
trackerType.subscribe((value) => {
  console.log('trackerType', value);
  if (value === '') {
    return;
  } else {
    localStorage.setItem('trackertype', value);
  }
});

// Coda Doc
const storedDoc = localStorage.getItem('codadoc') ?? '';
export const codaDoc = writable<string | null>(
  //@ts-ignore
  JSON.parse(storedDoc ? localStorage.getItem('codadoc') : null)
);
codaDoc.subscribe((value) => {
  if (value === '') {
    return;
  } else {
    localStorage.setItem('codadoc', JSON.stringify(value));
  }
});

// Coda Table
const storedCodaTable = localStorage.getItem('codatable') ?? '';
export const codaTable = writable<string | null>(
  //@ts-ignore
  JSON.parse(storedCodaTable ? localStorage.getItem('codatable') : null)
);
codaTable.subscribe((value) => {
  if (value === '') {
    return;
  } else {
    localStorage.setItem('codatable', JSON.stringify(value));
  }
});

// StillOutput Folder
const storedStillOutputFolder = localStorage.getItem('stillfolder') ?? '';
export const StillOutputFolder = writable<string | null>(
  //@ts-ignore
  JSON.parse(
    storedStillOutputFolder ? localStorage.getItem('stillfolder') : null
  )
);
StillOutputFolder.subscribe((value) => {
  if (value === '') {
    return;
  } else {
    localStorage.setItem('stillfolder', JSON.stringify(value));
  }
});

// Sequence Output Folder
const storedSSequenceOutputFolder =
  localStorage.getItem('sequencefolder') ?? '';
export const sequenceOutputFolder = writable<string | null>(
  //@ts-ignore
  JSON.parse(
    storedSSequenceOutputFolder ? localStorage.getItem('sequencefolder') : null
  )
);
sequenceOutputFolder.subscribe((value) => {
  if (value === '') {
    return;
  } else {
    localStorage.setItem('sequencefolder', JSON.stringify(value));
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
