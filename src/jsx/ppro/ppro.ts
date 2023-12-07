import {
  helloVoid,
  helloError,
  helloStr,
  helloNum,
  helloArrayStr,
  helloObj,
} from "../utils/samples";
export { helloError, helloStr, helloNum, helloArrayStr, helloObj, helloVoid };

export const qeDomFunction = () => {
  if (typeof qe === "undefined") {
    app.enableQE();
  }
  if (qe) {
    qe.name;
    qe.project.getVideoEffectByName("test");
  }
};
const timeDisplayToFrameRate = (td: number): number => {
  switch (td) {
    case 100:
      return 24;
    case 101:
      return 25;
    case 102:
      return 29.97;
    case 103:
      return 29.97;
    case 104:
      return 30;
    case 105:
      return 50;
    case 106:
      return 59.94;
    case 107:
      return 59.94;
    case 108:
      return 60;
    case 109:
      return 0;
    case 110:
      return 23.976;
    default:
      return 0;
  }
};

export const getActiveSequence = () => {
  const seq = app.project.activeSequence;
  if (seq) {
    var seqTimeStart = new Time();
    seqTimeStart.ticks = seq.zeroPoint;
    var seqObject = {
      id: seq.projectItem.nodeId,
      name: seq.name,
      startTime: seqTimeStart.seconds,
      framerate: timeDisplayToFrameRate(seq.videoDisplayFormat),
    };
    return JSON.stringify(seqObject);
  }
};

const getSequenceFromNodeId = (id: string): Sequence | null => {
  const sequences = app.project.sequences;
  for (var s = 0; s < sequences.numSequences; s++) {
    if (sequences[s].projectItem.nodeId === id) {
      return sequences[s];
    }
  }
  return null;
};

export function getAllSequenceClips(seq?: Sequence) {
  try {
    if (!seq) {
      var seq = app.project.activeSequence;
    }
    var selectedClips = [];
    var seqTimeStart = new Time();
    seqTimeStart.ticks = seq.zeroPoint;
    for (
      var trackIndex = 0;
      trackIndex < seq.videoTracks.numTracks;
      trackIndex++
    ) {
      var track = seq.videoTracks[trackIndex];
      var clips = track.clips;
      for (var clipIndex = 0; clipIndex < clips.numItems; clipIndex++) {
        var clip = {
          sequenceNodeId: seq.projectItem.nodeId,
          sequenceName: seq.projectItem.name,
          sequenceStart: seqTimeStart.seconds,
          sequenceFramerate: timeDisplayToFrameRate(seq.videoDisplayFormat),
          track: track.name.replace(" ", ""),
          trackIndex: trackIndex,
          timebase: seq.timebase,
          clip: clips[clipIndex],
          selected: clips[clipIndex].isSelected(),
        };
        selectedClips.push(clip);
      }
    }
    return selectedClips;
  } catch (e) {
    return [];
  }
}

export const getItemFromNodeId = (
  inBin: ProjectItem,
  withId: string
): ProjectItem => {
  var found = false;
  var foundItem;

  function recursiveSearch(bin: ProjectItem, id: string) {
    var items = bin.children;
    for (var i = 0; i < items.numItems; i++) {
      if (items[i].nodeId === id) {
        foundItem = items[i];
        found = true;
        break;
      } else if (items[i].type === 2 && items[i].nodeId != id) {
        if (found) {
          break;
        }
        recursiveSearch(items[i], id);
      }
    }
  }
  recursiveSearch(inBin, withId);
  return foundItem;
};

export const GetClipMarkers = (nodeId: string) => {
  const seq = getItemFromNodeId(app.project.rootItem, nodeId);
  try {
    const markers = seq.getMarkers();
    let listMarkers = [];
    var marker = markers.getFirstMarker();
    var count = markers.numMarkers;
    let currentMarker = markers.getFirstMarker();

    var firstMarker = {
      name: currentMarker.name,
      start: currentMarker.start.seconds,
      end: currentMarker.end.seconds,
      comments: currentMarker.comments,
      type: currentMarker.type,
      colorIndex: marker.getColorByIndex(),
    };
    listMarkers.push(firstMarker);
    for (var m = 1; m < count; m++) {
      currentMarker = markers.getNextMarker(currentMarker);
      var newMarker = {
        name: currentMarker.name,
        start: currentMarker.start.seconds,
        end: currentMarker.end.seconds,
        comments: currentMarker.comments,
        type: currentMarker.type,
        colorIndex: currentMarker.getColorByIndex(),
      };
      listMarkers.push(newMarker);
    }

    return listMarkers;
  } catch (e) {
    return "";
  }
};

export const getClipMarkers = (clip: ProjectItem) => {
  return GetClipMarkers(clip.nodeId);
};

export function getAllTracksClipsForNode(sequenceId: string) {
  const sequence = getSequenceFromNodeId(sequenceId);
  if (!sequence) {
    return null;
  }
  const tracksClips = getAllSequenceClips(sequence);
  let timelineClips = [];
  for (var i = 0; i < tracksClips.length; i++) {
    const clipMarkers = getClipMarkers(tracksClips[i].clip.projectItem);
    const speed = tracksClips[i].clip.getSpeed();
    var newClip = {
      track: tracksClips[i].track.replace(" ", ""),
      trackIndex: tracksClips[i].trackIndex,
      sequenceNodeId: tracksClips[i].sequenceNodeId,
      sequenceName: tracksClips[i].sequenceName,
      sequenceStart: tracksClips[i].sequenceStart,
      sequenceFramerate: tracksClips[i].sequenceFramerate,
      clipFramerate: tracksClips[i].sequenceFramerate,
      // clipFramerate: tracksClips[i].clip.projectItem.getFootageInterpretation().frameRate,
      duration: tracksClips[i].clip.duration.seconds,
      inPoint: tracksClips[i].clip.inPoint.seconds,
      outPoint: tracksClips[i].clip.outPoint.seconds,
      nodeId: tracksClips[i].clip.projectItem.nodeId,
      start: tracksClips[i].clip.start.seconds,
      end: tracksClips[i].clip.end.seconds,
      clipName: tracksClips[i].clip.projectItem.name,
      shotName: tracksClips[i].clip.name,
      filepath: tracksClips[i].clip.projectItem.getMediaPath(),
      markers: clipMarkers,
      speed: speed,
      selected: tracksClips[i].selected,
    };
    timelineClips.push(newClip);
  }
  return JSON.stringify({ clips: timelineClips });
}

interface IReplaceMediaOptions {
  nodeId: string;
  oldPath: string;
  newPath: string;
}
export const replaceMedia = function (options: IReplaceMediaOptions) {
  var currentClip = getItemFromNodeId(app.project.rootItem, options.nodeId);
  var pFile = new File(options.oldPath);
  var nFile = new File(options.newPath);

  if (
    currentClip.canChangeMediaPath() &&
    options.nodeId == currentClip.nodeId
  ) {
    currentClip.changeMediaPath(nFile.fsName, false);
    var nameSplit = nFile.absoluteURI.split("/");
    var newBasename = nameSplit[nameSplit.length - 1];
    currentClip.name = newBasename;
    return currentClip.name;
  }
};
