import { padLeft } from './ppro-utils';

export const qeDomFunction = () => {
  if (typeof qe === 'undefined') {
    app.enableQE();
  }
  if (qe) {
    qe.name;
    qe.project.getVideoEffectByName('test');
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
const getProjectItemFromPath = (filepath: string) => {
  const clips = app.project.rootItem.findItemsMatchingMediaPath(filepath);
  return JSON.stringify({ clips: clips });
};

const mediaExists = (mediaPath: string): boolean => {
  const item = getProjectItemFromPath(mediaPath);
  return item ? true : false;
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

const getSelectedClipsInTrack = (track: Track) => {
  var clips = track.clips;
  var selectedClips = [];
  var clips = track.clips;
  for (var clipIndex = 0; clipIndex < clips.numItems; clipIndex++) {
    var clip = clips[clipIndex];
    if (clip.isSelected()) {
      selectedClips.push(clip);
    }
  }
  return selectedClips;
};

const getProjectSelection = () => {
  var viewIDs = app.getProjectViewIDs();
  var viewSelection = app.getProjectViewSelection(viewIDs[0]); // sample code optimized for a single open project
  return viewSelection;
};

const getAlltracksSelectedClips = () => {
  var seq = app.project.activeSequence;
  var selectedClips = [];
  for (
    var trackIndex = 0;
    trackIndex < seq.videoTracks.numTracks;
    trackIndex++
  ) {
    var track = seq.videoTracks[trackIndex];
    var clips = getSelectedClipsInTrack(track);
    for (var clipIndex = 0; clipIndex < clips.length; clipIndex++) {
      var clip = clips[clipIndex];
      selectedClips.push(clip);
    }
  }
  return selectedClips;
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
      seq = app.project.activeSequence;
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
          track: track.name.replace(' ', ''),
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
  var foundItem: ProjectItem | null = null;
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
  if (foundItem) {
    return foundItem;
  } else {
    return inBin;
  }
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
    return '';
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

    let shotName = tracksClips[i].clip.name;
    let match = shotName.match(/_v\d/);
    if (match) {
      shotName = shotName.split(match[0])[0];
    }

    var newClip = {
      track: tracksClips[i].track.replace(' ', ''),
      trackIndex: tracksClips[i].trackIndex,
      sequenceNodeId: tracksClips[i].sequenceNodeId,
      sequenceName: tracksClips[i].sequenceName,
      sequenceStart: tracksClips[i].sequenceStart,
      sequenceFramerate: tracksClips[i].sequenceFramerate,
      clipFramerate: tracksClips[i].sequenceFramerate,
      duration: tracksClips[i].clip.duration.seconds,
      inPoint: tracksClips[i].clip.inPoint.seconds,
      outPoint: tracksClips[i].clip.outPoint.seconds,
      nodeId: tracksClips[i].clip.projectItem.nodeId,
      start: tracksClips[i].clip.start.seconds,
      end: tracksClips[i].clip.end.seconds,
      clipName: tracksClips[i].clip.projectItem.name,
      shotName: shotName,
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
    var nameSplit = nFile.absoluteURI.split('/');
    var newBasename = nameSplit[nameSplit.length - 1];
    currentClip.name = newBasename;
    return JSON.stringify({ clipName: newBasename, filepath: nFile.fsName });
  }
};

interface IImportOptions {
  filepath: string;
  isSequence: boolean;
}
export const importMediaFile = (options: IImportOptions) => {
  const f = new File(options.filepath);
  mediaExists(options.filepath);
  app.project.importFiles(
    [f.fsName],
    true,
    app.project.rootItem,
    options.isSequence
  );
};

export const mapSequence = () => {
  const seq = app.project.activeSequence;
  alert(seq.projectItem.nodeId);
  return seq.projectItem.nodeId;
};

export const collectSequenceClips = (
  sequenceId: string,
  sequenceClips: string[]
) => {
  const seq = app.project.activeSequence;

  for (
    let trackIndex = 0;
    trackIndex < seq.videoTracks.numTracks;
    trackIndex++
  ) {
    let track = seq.videoTracks[trackIndex];
    let clips = track.clips;

    for (let clipIndex = 0; clipIndex < clips.numItems; clipIndex++) {
      let clip = clips[clipIndex];

      // Check if the clip is a sequence
      if (clip.projectItem.isSequence()) {
        sequenceClips.push(clip.projectItem.nodeId);
      }
    }
  }

  return JSON.stringify(sequenceClips);
};

export const goToFrame = (frame: number) => {
  var seq = app.project.activeSequence;
  var ticks = (parseInt(seq.timebase) * frame).toString();
  seq.setPlayerPosition(ticks);
};

export const findAndReplace = (options: any) => {
  var selectedClips = [];
  switch (options.scope) {
    case 'project':
      selectedClips = getProjectSelection();
      break;
    case 'timeline':
      selectedClips = getAlltracksSelectedClips();
      break;
    default:
      return;
  }

  for (var c = 0; c < selectedClips.length; c++) {
    const newName = selectedClips[c].name.replace(options.from, options.to);
    selectedClips[c].name = newName;
  }
};

export const renameShots = (options: any) => {
  var shots = getAlltracksSelectedClips();
  for (var s = 0; s < shots.length; s++) {
    var shotNumber = (options.startValue + s * options.increment).toString();
    var padString = padLeft(shotNumber, options.padding);
    var shotName = options.prefix + padString;
    shots[s].name = shotName;
  }
  return true;
};

const renameClipFromSource = (shot: any) => {
  if (shot.projectItem.canChangeMediaPath()) {
    var shotFile = new File(shot.projectItem.getMediaPath());
    var sourceName = shotFile.displayName;
    shot.projectItem.name = sourceName;
    shot.name = sourceName;
  }
};

export const renameToFile = () => {
  var clips = getAlltracksSelectedClips();
  for (var c = 0; c < clips.length; c++) {
    renameClipFromSource(clips[c]);
  }
  return true;
};

const getSequenceMedias = (seq: Sequence, medias: Array<any>) => {
  // var medias = [];
  var vTtracks = seq.videoTracks;
  var aTracks = seq.audioTracks;

  function findObjectByKey(array: any[], key: string, value: any) {
    for (var i = 0; i < array.length; i++) {
      if (array[i][key] === value) {
        return array[i];
      }
    }
    return null;
  }

  function normalizeTreePath(t: string) {
    const pName = app.project.name;
    t = t.replace(pName, '');
    t = t.replace(/\\\\/g, '');
    t = t.replace(/\\/g, '/');
    return t;
  }

  function sequenceById(id: string) {
    var sequences = app.project.sequences;
    var len = sequences.numSequences;
    for (var i = 0; i < len; i++) {
      var sequence = sequences[i];
      if (sequence.projectItem.nodeId === id) return sequence;
    }
  }

  function getMediaClips(tracks: any, mediasArray: any[]) {
    for (var t = 0; t < tracks.numTracks; t++) {
      var clips = tracks[t].clips;

      for (var c = 0; c < clips.numItems; c++) {
        var clip = clips[c];

        if (clip.projectItem.isSequence()) {
          const seqId = clip.projectItem.nodeId;
          const nestedSequence = sequenceById(seqId);

          if (!nestedSequence) continue;
          getSequenceMedias(nestedSequence, medias);
        }

        if (clip.projectItem.canChangeMediaPath()) {
          var newClip = {
            name: clip.projectItem.name,
            nodeId: clip.projectItem.nodeId,
            mediaPath: clip.projectItem.getMediaPath(),
            treePath: normalizeTreePath(clip.projectItem.treePath),
          };
          var exists = findObjectByKey(mediasArray, 'nodeId', newClip.nodeId);
          if (!exists) {
            mediasArray.push(newClip);
          }
        }
      }
    }
    return mediasArray;
  }

  medias = getMediaClips(vTtracks, medias);
  var allMedias = getMediaClips(aTracks, medias);

  return allMedias;
};

const getSelectedSequences = (): Array<Sequence> => {
  function isSequenceSelected(node: any, seqArray: any) {
    for (var i = 0; i < seqArray.numSequences; i++) {
      if (seqArray[i].projectItem.nodeId === node) {
        return seqArray[i];
      }
    }
    return null;
  }
  var sequences = [];
  var selection = getProjectSelection();
  if (!selection) {
    return [app.project.activeSequence];
  }
  var projectSequences = app.project.sequences;
  for (var c = 0; c < selection.length; c++) {
    var projSeq = isSequenceSelected(selection[c].nodeId, projectSequences);
    if (projSeq) {
      sequences.push(projSeq);
    }
  }
  if (sequences.length < 1) {
    sequences = [app.project.activeSequence];
  }
  return sequences;
};

export const getSequencesMedias = (
  scope: 'activeSequence' | 'selectedSequences' | 'project'
) => {
  let medias: any[] = [];
  switch (scope) {
    case 'activeSequence':
      medias = getSequenceMedias(app.project.activeSequence, []);
      break;
    case 'project':
      let seqs = app.project.sequences;
      for (let s = 0; s < seqs.numSequences; s++) {
        medias = medias.concat(getSequenceMedias(seqs[s], []));
      }
      break;
    case 'selectedSequences':
      var selectedSequences = getSelectedSequences();

      if (selectedSequences.length < 1) {
        return JSON.stringify({ medias: [], error: 'No Sequence Selected' });
      }
      selectedSequences =
        selectedSequences.length > 0
          ? selectedSequences
          : [app.project.activeSequence];
      for (var s = 0; s < selectedSequences.length; s++) {
        medias = medias.concat(getSequenceMedias(selectedSequences[s], []));
      }
      break;
    default:
      return JSON.stringify({
        medias: getSequenceMedias(app.project.activeSequence, []),
      });
  }
  //@ts-ignore
  const reducedMedias = removeDuplicates(medias);
  return JSON.stringify({ medias: reducedMedias });
};

export const openFolderDialog = (txt: string) => {
  var newOutput = Folder.selectDialog(txt);
  if (newOutput && newOutput.exists) {
    return newOutput.fsName;
  } else {
    return undefined;
  }
};
