import { GetActiveSequence, GetSequencedClips } from "@/api/edit";
import {
  GetSystemFileVersionsWithShotName,
  GetFileVersion,
} from "@/api/files/files";
import { logModule } from '@/lib/logger';

const log = logModule('timeline-clips');

export const getClips = async () => {
  let sequenceClips: any[] = [];
  const seq = await GetActiveSequence();
  const pproClips = await GetSequencedClips(seq.id);
  const systemClips = await Promise.all(pproClips.map(async (clip) => {
    const fileVersion = await GetSystemFileVersionsWithShotName(
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
  }));
  sequenceClips = systemClips;
  log.debug("Retrieved sequence clips", {
    sequenceId: seq.id,
    count: sequenceClips.length
  }, sequenceClips);
  return Promise.resolve(sequenceClips);
};
