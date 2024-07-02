import { GetActiveSequence, GetSequencedClips } from "../api/edit";
import {
  GetSystemFileVersionsWithShotName,
  GetFileVersion,
} from "../api/files/files";

export const getClips = async () => {
  let sequenceClips = [];
  const seq = await GetActiveSequence();
  const pproClips = await GetSequencedClips(seq.id);
  const systemClips = pproClips.map((clip) => {
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
  sequenceClips = systemClips;
  console.log("sequenceClips", sequenceClips);
  return Promise.resolve(sequenceClips);
};
