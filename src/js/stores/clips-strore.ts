import { writable, derived } from "svelte/store";
import { appId } from "../lib/utils/cep";
import { evalES } from "../lib/utils/bolt";
import { GetSystemFileVersionsWithShotName } from "../api/files/files";
import { GetActiveSequence, GetSequencedClips } from "../api/edit";
import { asyncDerived, asyncReadable } from "@square/svelte-store";

const getAeClips = async () => {
  const selectedClips = JSON.parse(await evalES(`getSelectedClips()`, false));
  console.log('selectedClips', selectedClips);
  const systemClips = selectedClips.map((clip: any) => {
    const fileVersion = GetSystemFileVersionsWithShotName(
      clip.filepath,
      clip.shotName
    );
    fileVersion.sort((a, b) => {
      if (a.version > b.version) {
        return -1;
      } else if (a.version < b.version) {
        return 1;
      } else {
        return 0;
      }
    });

    return {
      ...clip,
      versions: fileVersion,
      selectedVersion: fileVersion[0],
    };
  });
  return  systemClips;
};

const getPProClips = async () => {
  const seq = await GetActiveSequence();
  const pproClips = await GetSequencedClips(seq.id);
  const systemClips = pproClips
    .filter((clip) => clip.selected)
    .map((clip) => {
      const fileVersion = GetSystemFileVersionsWithShotName(
        clip.filepath,
        clip.shotName
      );
      fileVersion.sort((a, b) => {
        if (a.version > b.version) {
          return -1;
        } else if (a.version < b.version) {
          return 1;
        } else {
          return 0;
        }
      });

      return {
        ...clip,
        versions: fileVersion,
        selectedVersion: fileVersion[0],
      };
    });
  return systemClips;
  
};

const getClips = async () => {
  let loadedClips =  [];
  switch (appId) {
    case 'AEFT':
      loadedClips = await getAeClips();
      break;
    case 'PPRO':
      loadedClips = await getPProClips();
      break;
    default:
      break;
  }
  return loadedClips;
};

export const clips = writable([]);
export const sequenceClips = asyncDerived([], getClips);