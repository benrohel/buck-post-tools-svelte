import { getProjects } from 'buck-client';
import { evalES } from '../lib/utils/bolt';

export const GetProjectShots = async (key: string) => {
  const items = await getProjects(key);
  items.sort((a: any, b: any) => a.data.name.localeCompare(b.data.name));
  return items || [];
};

export const GetActiveSequence = async (): Promise<any> => {
  return new Promise((resolve, reject) => {
    evalES(`getActiveSequence()`, false).then((res) => {
      if (!res) {
        reject('no sequence');
      }
      const aeResult = JSON.parse(res);
      resolve(aeResult);
    });
  });
};

export const GetSequencedClips = async (
  sequenceId: string,
  trackName: string = ''
): Promise<Array<any>> => {
  const res = await evalES(`getAllTracksClipsForNode("${sequenceId}")`, false);
  return new Promise((resolve, reject) => {
    resolve(JSON.parse(res).clips);
  });
};
