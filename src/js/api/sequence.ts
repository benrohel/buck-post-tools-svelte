import upath from 'upath';
import { evalES } from '../lib/utils/bolt';
import { ClipType, setItemTimecodes } from './clip';

export declare interface Sequence {
  name: string;
  nodeId: string;
  framerate: number;
  startTime: number;
  timebase: string;
  clips?: Array<ClipType>;
}

export declare interface ConnectedSourceSequence {
  sourceSequence: Sequence;
  connectedSequences: Array<Sequence>;
  clips: Array<ClipType>;
  handles: number;
}

export const GetSequence = async (nodeId: string = ''): Promise<Sequence> => {
  const res = await evalES(`GetSequence("${nodeId}")`, false);
  return new Promise((resolve, reject) => {
    const sequence = JSON.parse(res).sequence as Sequence;
    if (sequence) {
      resolve(sequence);
    } else {
      reject('Error Loading Sequence');
    }
  });
};

export const GetSelectedSequences = async (): Promise<Array<Sequence>> => {
  const res = await evalES(`getSelectedSequencesForNode(true)`, false);

  return new Promise((resolve, reject) => {
    const sequences = JSON.parse(res).sequences as Array<Sequence>;
    if (sequences) {
      resolve(sequences);
    } else {
      reject('Error Loading Sequence');
    }
  });
};

export const GetSequences = async (): Promise<Sequence[]> => {
  const res = await evalES(`getAllSequences(true)`, false);

  return new Promise((resolve, reject) => {
    const sequences = JSON.parse(res).sequences as Array<Sequence>;
    if (sequences) {
      resolve(sequences);
    } else {
      reject('Error Loading Sequence');
    }
  });
};

export const GetSequencedClips = async (
  sequence: Sequence,
  trackName: string = ''
): Promise<Array<ClipType>> => {
  return new Promise((resolve, reject) => {
    evalES(`getAllTracksClipsForNode("${sequence.nodeId}")`, false).then(
      (res: any) => {
        if (!res) {
          reject('no clips');
        }
        const aeResult = JSON.parse(res);
        const aeClips = aeResult.clips as Array<ClipType>;
        const allPromises = aeClips.map((c) => {
          return setItemTimecodes(c);
        });

        Promise.all(allPromises).then((values) => {
          if (trackName) {
            const trackClips = values.filter((c: any) => {
              return c.track == trackName;
            });
            resolve(trackClips);
          }
          resolve(values);
        });
      }
    );
  });
};

interface TimeMarker extends Marker {
  startTicks: number;
  endTicks: number;
  startSeconds: number;
  endSeconds: number;
}

export const GetMarkersThumbnails = async (
  nodeId: string = '',
  outputFolder: string = '',
  colorIndices: Array<number> = [0, 1, 2, 3, 4, 5, 6, 7]
): Promise<boolean> => {
  const seq = await GetSequence(nodeId);
  const markers = await GetSequenceMarkers(nodeId);
  if (!outputFolder) {
    await evalES("alert('no output folder')");
    return;
  }

  if (colorIndices.length == 0) {
    colorIndices = [0, 1, 2, 3, 4, 5, 6, 7];
  }

  if (markers) {
    console.log(markers);
    console.log('color indices', colorIndices);
    markers
      .filter((m) => colorIndices.includes(m.colorIndex))
      .forEach((marker) => {
        console.log(marker);
        const frameNumber = Math.round(marker.startSeconds * seq.framerate);
        const outputPath = upath.join(
          outputFolder,
          `${seq.name}_${
            marker.name ? marker.name + '_' : ''
          }${frameNumber}.png`
        );
        evalES(
          `exportClipThumbnail("${marker.startTicks}","${outputPath}")`,
          false
        ).then((res) => {
          console.log(res);
        });
      });
  }

  return new Promise((resolve, reject) => {
    resolve(true);
  });
};

declare interface Marker {
  name: string;
  startTicks: number;
  endTicks: number;
  startSeconds: number;
  endSeconds: number;
  colorIndex: number;
  type: string;
  comments: string;
}

export const GetSequenceMarkers = async (nodeId: string = '') => {
  const markersResult = await evalES(`GetSequenceMarkers("${nodeId}")`, false);

  if (markersResult) {
    const markers = JSON.parse(markersResult).markers as Array<Marker>;
    return markers;
  }
};

// export const exportSequenceCSV = async (shots: Array<ClipType>): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     if (type == 'NY GOOGLE SHEET') {
//       nySsequenceCsv(shots).then((res) => {
//         resolve(res);
//       });
//     } else {
//       laSequenceCsv(shots).then((res) => {
//         resolve(res);
//       });
//     }
//   });
// };

export const AddGaps = (gap: number, trackName: string) => {
  const options = {
    gap: gap,
    trackName: trackName,
  };
  evalES(`addGap(${JSON.stringify(options)})`, false).then((res: any) =>
    console.log(res)
  );
};

export const CopySequenceSettings = (
  fromSequenceId: string,
  toSequencesId: string[]
) => {
  const options = {
    from: fromSequenceId,
    to: toSequencesId,
  };
  evalES(`copySequenceSettings(${JSON.stringify(options)})`, false).then(() =>
    console.log('Done copy settings')
  );
};

declare interface ClipSourceType {
  nodeId: string;
  inPoint: number;
  outPoint: number;
  start: number;
  end: number;
}
declare interface BuildSourceSequenceOptions {
  uuid: string;
  name: string;
  presetPath: string;
  handles: string;
  clips: ClipSourceType[];
  sequenceString: string;
  gap: number;
}
export const BuildSourceSequence = (
  options: BuildSourceSequenceOptions
): Promise<string> => {
  return new Promise((resolve, reject) => {
    evalES(`buildSourceSequence(${JSON.stringify(options)})`, false).then(
      (res: any) => {
        const sequenceId = JSON.parse(res) as string;
        sequenceId
          ? resolve(sequenceId)
          : reject("Couldn't build Source Sequence.");
      }
    );
  });
};

// const laSequenceCsv = async (shots: Array<ClipType>): Promise<string> => {
//   const fields = [
//     'Shot Name',
//     'Thumbnail ',
//     'ThumbnaillUrl',
//     'Src Timecode',
//     'Src In',
//     'Src Out',
//     'Dst In',
//     'Dst Out',
//     'Dst Duration',
//     'Framerate',
//     'COMP #',
//     'EDIT #',
//     'Status',
//     'Notes',
//     'Clip Media',
//   ];
//   const opts = { fields };
//   let tbURLString = '=IMAGE(INDIRECT(ADDRESS(ROW(),COLUMN()+1)))';

//   const shotMap = shots.map((shot: ClipType, index) => {
//     let version = 'v00';
//     let versionMatch = shot.filepath.match(/v\d+/);

//     if (versionMatch && versionMatch.length > 0) {
//       version = versionMatch[0];
//     }
//     return {
//       'Shot Name': shot.shotName,
//       Thumbnail: tbURLString,
//       ThumbnaillUrl: shot.thumbnailUrl,
//       'Src Timecode': shot.mediaStart?.toString(),
//       'Src In': shot.tcInPoint?.frameCount - shot.mediaStart?.frameCount,
//       'Src Out': shot.tcOutPoint?.frameCount - shot.mediaStart?.frameCount,
//       'Dst In': shot.tcStart?.frameCount,
//       'Dst Out': shot.tcEnd?.frameCount,
//       'Dst Duration': shot.duration,
//       Framerate: shot.tcInPoint?.frameRate,
//       'COMP #': 'v00',
//       'EDIT #': version,
//       Status: 'PENDING',
//       Notes: '',
//       'Clip Media': shot.filepath,
//     };
//   });

//   const data = { shots: shotMap };

//   return new Promise((resolve, reject) => {
//     try {
//       // const csv = parse(data.shots, opts);
//       const csv = Papa.unparse(data.shots);
//       console.log(csv);
//       resolve(csv);
//     } catch (err) {
//       console.error(err);
//       reject('Could not build csv');
//     }
//   });
// };

// const nySsequenceCsv = async (shots: Array<ClipType>): Promise<string> => {
//   const fields = NY_FIELDS;
//   const opts = { fields };

//   const shotMap = shots.map((shot: ClipType, index) => {
//     const inFrame = shot.tcInPoint?.valueOf();
//     const outFrame = shot.tcOutPoint?.valueOf();
//     const framerange = `${inFrame}-${outFrame}`;
//     return {
//       THUMBNAIL: '=IMAGE(INDIRECT(ADDRESS(ROW(),COLUMN()+1)))',
//       THUMBNAIL_URL: shot.thumbnailUrl,
//       NAME: shot.shotName,
//       DESCRIPTION: '',
//       'FRAME RANGE': framerange,
//       design: '',
//       'ARTIST D': '',
//       'STATUS D': '',
//       'NOTES D': '',
//       animation: '',
//       'ARTIST A': '',

//       'STATUS A': '',
//       'IMPORTED A': '',
//       'NOTES A': '',
//       lighting: '',
//       'ARTIST L': '',
//       'STATUS L': '',
//       'CACHE # L': '',
//       'IMPORTED L': '',
//       'NOTES L': '',
//       comp: '',
//       'ARTIST C': '',
//       'STATUS C': '',
//       'COMP #': '',
//       'EDIT #': '',
//       'IMPORTED C': '',
//       'NOTES C': '',
//     };
//   });

//   const data = { shots: shotMap };

//   return new Promise((resolve, reject) => {
//     try {
//       const csv = parse(data.shots, opts);
//       resolve(csv);
//     } catch (err) {
//       console.error(err);
//       reject('Could not build csv');
//     }
//   });
// };
