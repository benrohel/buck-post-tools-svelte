import { evalES } from '../lib/utils/bolt';
import Timecode, { TIMECODE } from 'smpte-timecode';
import { createTimecode, getFramerate, getTimecodeInTicks } from './timecode';
//@ts-ignore
import { xmlToJson } from './xml2json';

declare interface Marker {
  colorIndex: number;
  comments: string;
  end: number;
  name?: string;
  start: number;
  type: string;
}
export declare interface ClipType {
  clipFramerate: number;
  mediaStart: Timecode.TimecodeInstance;
  mediaEnd: Timecode.TimecodeInstance;
  tcInPoint: Timecode.TimecodeInstance;
  tcOutPoint: Timecode.TimecodeInstance;
  inPoint: number;
  outPoint: number;
  nodeId: string;
  clipName: string;
  shotName: string;
  filepath: string;
  track?: string;
  trackIndex: number;
  sequenceName: string;
  sequenceNodeId: string;
  sequenceStart: number;
  sequenceFramerate: number;
  tcSequenceStart?: Timecode.TimecodeInstance;
  start: number;
  end: number;
  tcStart: Timecode.TimecodeInstance;
  tcEnd: Timecode.TimecodeInstance;
  event?: number;
  duration?: number;
  thumbnailUrl?: string;
  markers?: Array<Marker>;
  speed?: number;
  slectred?: boolean;
}

export const setItemTimecodes = async (
  clip: ClipType,
  handles: string = '0'
): Promise<ClipType> => {
  const res = await evalES(`getItemMetadata("${clip.nodeId}")`, false);
  const aeResult = JSON.parse(res);
  const dom = new DOMParser().parseFromString(aeResult.metadata, 'text/xml');
  const jsonMetadata = xmlToJson(dom);
  const columnsMetadata = await evalES(
    `getItemColumnsMetadata("${clip.nodeId}")`,
    false
  );
  console.log(JSON.parse(columnsMetadata));
  const mediaType =
    jsonMetadata['x:xmpmeta']['rdf:RDF']['rdf:Description'][
      'premierePrivateProjectMetaData:Column.Intrinsic.MediaType'
    ];
  const mediaStart =
    jsonMetadata['x:xmpmeta']['rdf:RDF']['rdf:Description'][
      'premierePrivateProjectMetaData:Column.Intrinsic.MediaStart'
    ];
  const mediaEnd =
    jsonMetadata['x:xmpmeta']['rdf:RDF']['rdf:Description'][
      'premierePrivateProjectMetaData:Column.Intrinsic.MediaEnd'
    ];
  const framerateString = jsonMetadata['x:xmpmeta']['rdf:RDF'][
    'rdf:Description'
  ]['premierePrivateProjectMetaData:Column.Intrinsic.MediaTimebase'] as string;

  let framerate = getFramerate(
    parseFloat(parseFloat(framerateString).toFixed(2))
  );
  if (mediaType === 'Still Image') {
    framerate = getFramerate(clip.sequenceFramerate);
  }
  const tcMediaStart = createTimecode(mediaStart, framerate);
  const tcMediaEnd = createTimecode(mediaEnd, framerate);
  const tcInPoint = createTimecode(mediaStart, framerate);
  tcInPoint.add(clip.inPoint * tcInPoint.frameRate - parseInt(handles));
  const tcOutPoint = createTimecode(mediaStart, framerate);
  tcOutPoint.add(clip.outPoint * tcOutPoint.frameRate + parseInt(handles));
  const tcStart = createTimecode(clip.start * framerate, framerate);
  const tcEnd = createTimecode(clip.end * framerate, framerate);
  const tcSequenceStart = createTimecode(
    clip.sequenceStart * framerate,
    framerate
  );
  const duration = tcOutPoint.frameCount - tcInPoint.frameCount;
  return {
    ...clip,
    mediaStart: tcMediaStart,
    mediaEnd: tcMediaEnd,
    clipFramerate: framerate,
    tcInPoint: tcInPoint,
    tcOutPoint: tcOutPoint,
    duration: duration,
    tcStart: tcStart,
    tcEnd: tcEnd,
    tcSequenceStart: tcSequenceStart,
  };
};
