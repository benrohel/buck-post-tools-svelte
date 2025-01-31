import { padLeft } from './ppro-utils';
const isQEEnabled = app.enableQE();

declare var JSON: any;
declare const qe: undefined | any;

//// UTILS
const ensureDir = (filePath: string) => {
  var destFile = new File(filePath);
  var destFolder = destFile.parent;
  if (!destFolder.exists) destFolder.create();
};

const updateEventPanel = (message: string) => {
  app.setSDKEventMessage(message, 'info');
  //app.setSDKEventMessage('Here is a warning.', 'warning');
  //app.setSDKEventMessage('Here is an error.', 'error');  // Very annoying; use sparingly.
};

const getSep = () => {
  if (Folder.fs === 'Macintosh') {
    return '/';
  } else {
    return '\\';
  }
};

const findInArray = (element: any, array: any[]) => {
  for (var i = 0; i < array.length; i++) {
    if (array[i].match(element)) {
      return true;
    }
  }
  return false;
};

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

export const getItemMetadata = (nodeId: string) => {
  const item = getItemFromNodeId(app.project.rootItem, nodeId);
  return JSON.stringify({ metadata: item.getProjectMetadata() });
};

export const getItemColumnsMetadata = (nodeId: string) => {
  const item = getItemFromNodeId(app.project.rootItem, nodeId);
  return item.getProjectColumnsMetadata();
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

declare interface BinInput {
  name: string;
  children: Array<BinInput>;
}
declare interface CreateBinInput {
  bins: Array<BinInput>;
  parent: ProjectItem;
}

// export const createBins = (options: CreateBinInput) => {
//   const bins = options.bins;
//   alert(String(bins.length));
//   let parent = options.parent ?? app.project.rootItem;
//   for (var i = 0; i < bins.length; i++) {
//     createBins({ bins: options.bins[i].children, parent: parent });
//     let newParent = parent.createBin(bins[i].name);
//     parent = newParent;
//   }
// };

export const createBins = (options: CreateBinInput) => {
  const bins = options.bins;
  let parent = options.parent ?? app.project.rootItem;

  for (var i = 0; i < bins.length; i++) {
    // Create the current bin as a child of the parent
    let newParent = parent.createBin(bins[i].name);

    // If the current bin has children, call createBins recursively
    if (bins[i].children) {
      createBins({ bins: bins[i].children, parent: newParent });
    }
  }
};

export const GetSequence = (nodeId: string = '') => {
  let sequence;

  if (nodeId) {
    sequence = getSequenceFromNodeId(nodeId) as Sequence;
  } else {
    sequence = app.project.activeSequence;
  }
  var seqTimeStart = new Time();
  seqTimeStart.ticks = sequence.zeroPoint;
  return JSON.stringify({
    sequence: {
      name: sequence.name,
      nodeId: sequence.projectItem.nodeId,
      framerate: timeDisplayToFrameRate(sequence.videoDisplayFormat),
      startTime: seqTimeStart.seconds,
      timebase: sequence.timebase,
    },
  });
};

export const GetSequences = () => {
  const sequences = getSelectedSequences;
};

export const GetSequenceMarkers = (nodeId: string) => {
  const seq = getSequenceFromNodeId(nodeId);
  try {
    const markers = seq!.markers;
    let listMarkers = [];
    var marker = markers.getFirstMarker();
    var count = markers.numMarkers;
    let currentMarker = markers.getFirstMarker();
    if (!currentMarker) {
      alert('The Sequence has no marker.');
      return false;
    }
    var firstMarker = {
      name: currentMarker.name,
      startTicks: currentMarker.start.ticks,
      endTicks: currentMarker.end.ticks,
      startSeconds: currentMarker.start.seconds,
      endSeconds: currentMarker.end.seconds,
      comments: currentMarker.comments,
      type: currentMarker.type,
      colorIndex: marker.getColorByIndex(),
    };
    listMarkers.push(firstMarker);
    for (var m = 1; m < count; m++) {
      currentMarker = markers.getNextMarker(currentMarker);
      var newMarker = {
        name: currentMarker.name,
        startTicks: currentMarker.start.ticks,
        endTicks: currentMarker.end.ticks,
        startSeconds: currentMarker.start.seconds,
        endSeconds: currentMarker.end.seconds,
        comments: currentMarker.comments,
        type: currentMarker.type,
        colorIndex: currentMarker.getColorByIndex(),
      };
      listMarkers.push(newMarker);
    }

    return JSON.stringify({ markers: listMarkers });
  } catch (e: any) {
    return alert(e);
  }
};

export const getSelectedSequencesForNode = (selectedSequences: boolean) => {
  let sequences = [app.project.activeSequence];
  if (selectedSequences) {
    sequences = getSelectedSequences();
  }
  let resultSequences = [];
  for (var i = 0; i < sequences.length; i++) {
    var seq = sequences[i];
    var seqTimeStart = new Time();
    seqTimeStart.ticks = seq.zeroPoint;
    var seqObject = {
      nodeId: seq.projectItem.nodeId,
      name: seq.name,
      startTime: seqTimeStart.seconds,
      framerate: timeDisplayToFrameRate(seq.videoDisplayFormat),
    };
    resultSequences.push(seqObject);
  }

  return JSON.stringify({ sequences: resultSequences });
};

declare interface copySequenceSettingsProps {
  from: string;
  to: Array<string>;
}
export const copySequenceSettings = (options: copySequenceSettingsProps) => {
  const fromSequence = getSequenceFromNodeId(options.from);
  let toSequences = [];

  if (!fromSequence) {
    return;
  }

  for (var i = 0; i < options.to.length; i++) {
    const toSeq = getSequenceFromNodeId(options.to[i]);
    toSequences.push(toSeq);
  }

  const fromSettings = fromSequence.getSettings();

  for (var j = 0; j < toSequences.length; j++) {
    toSequences[j]!.setSettings(fromSettings);
  }
};
declare interface ThumbnailOptions {
  timeInSeconds: number;
  filepath: string;
}

const markerMatch = (markerColor: any, selectedColors: Array<string>) => {
  var markerColors = [
    'Green',
    'Red',
    'Purple',
    'Orange',
    'Yellow',
    'White',
    'Blue',
    'Cyan',
  ];
  var currentColor = markerColors[markerColor.getColorByIndex()];
  if (findInArray(currentColor, selectedColors)) {
    return true;
  }
  return false;
};

export const exportSequenceThumbnails = (markers: Array<ThumbnailOptions>) => {
  app.enableQE();
  let exportedPaths = [];
  var activeSequence = qe.project.getActiveSequence(); // note:

  for (var m = 0; m < markers.length; m++) {
    var outputFile = new File(markers[m].filepath);
    var tickTime = new Time();
    tickTime.seconds = markers[m].timeInSeconds;
    app.project.activeSequence.setPlayerPosition(tickTime.ticks);
    activeSequence.exportFramePNG(tickTime.ticks, outputFile.fsName);
    exportedPaths.push(outputFile.fsName);
  }
  return JSON.stringify({ paths: exportedPaths });
};

declare interface exportFramesForMarkersOptions {
  colors: Array<string>;
}

export const exportFramesForMarkers = (
  options: exportFramesForMarkersOptions
) => {
  var activeSequence = app.project.activeSequence;
  if (activeSequence) {
    var markers = activeSequence.markers;
    var markerCount = markers.numMarkers;
    if (markerCount) {
      var previousMarker;
      var currentMarker;

      for (var i = 0; i < markerCount; i++) {
        if (i === 0) {
          currentMarker = markers.getFirstMarker();
        } else {
          currentMarker = markers.getNextMarker(currentMarker!);
        }
        if (currentMarker && markerMatch(currentMarker, options.colors)) {
          activeSequence.setPlayerPosition(currentMarker.start.ticks);
          previousMarker = currentMarker;
          exportCurrentFrameAsPNG('toto');
        }
      }
      return true;
    } else {
      updateEventPanel('No markers applied to ' + activeSequence.name + '.');
      return false;
    }
  } else {
    updateEventPanel('No active sequence.');
    return false;
  }
};

const exportCurrentFrameAsPNG = (outputFileName: string) => {
  app.enableQE();
  var activeSequence = qe.project.GetActiveSequence() as Sequence;
  // note: make sure a sequence is active in PPro UI
  if (activeSequence) {
    var time = activeSequence.CTI.timecode; // CTI = Current Time Indicator.
    activeSequence.exportFramePNG(time, outputFileName);
  } else {
    updateEventPanel('No active sequence.');
  }
};

export const exportShotToPNG = (shot: any) => {
  var seq = app.project.activeSequence;
  seq.setPlayerPosition(shot.start.ticks);
  exportCurrentFrameAsPNG(shot.name);
};

export const exportClipThumbnail = (ticks: string, outputPath: string) => {
  app.enableQE();
  var outputFile = new File(outputPath);

  var qeSeq = qe.project.getActiveSequence() as Sequence;
  var seq = app.project.activeSequence;
  seq.setPlayerPosition(ticks);

  if (seq) {
    ensureDir(outputFile.absoluteURI);
    var time = qeSeq.CTI.timecode;
    qeSeq.exportFramePNG(time, outputFile.fsName);

    return outputPath;
  } else {
    updateEventPanel('No active sequence.');
  }
};

export const exportStills = (destination: string) => {
  var clips = getAlltracksSelectedClips();
  for (var c = 0; c < clips.length; c++) {
    exportShotToPNG(clips[c]);
  }
  return true;
};

//  function exportCurrentFrameAsPNG (presetPath) {
//   var seq = app.project.activeSequence;
//   if (seq) {
//     var currentSeqSettings	= app.project.activeSequence.getSettings();
//     if (currentSeqSettings){
//       var currentTime	= seq.getPlayerPosition();
//       if (currentTime){
//         var oldInPoint 			= seq.getInPointAsTime();
//         var oldOutPoint 		= seq.getOutPointAsTime();
//         var offsetTime 			= currentTime.seconds + 0.033;  // Todo: Add fancy timecode math, to get one frame, given current sequence timebase

//         seq.setInPoint(currentTime.seconds);
//         seq.setOutPoint(offsetTime);

//         // Create a file name, based on timecode of frame.
//         var timeAsText				= currentTime.getFormatted(currentSeqSettings.videoFrameRate, app.project.activeSequence.videoDisplayFormat);
//         var removeThese 			= /:|;/ig; 				// Why? Because Windows chokes on colons in file names.
//         var tidyTime 				= timeAsText.replace(removeThese, '_');
//         var outputPathInToOut 		= new File("~/Desktop/output/in_to_out");
//         var outputFileNameInToOut	= outputPathInToOut.fsName + $._PPP_.getSep() + seq.name + '___' + tidyTime  + '___' + ".png";

//         var removeUponCompletion 	= 1;
//         var startQueueImmediately 	= false;
//         var jobID_InToOut 			= app.encoder.encodeSequence(	seq,
//                                       outputFileNameInToOut,
//                                       presetPath,
//                                       app.encoder.ENCODE_IN_TO_OUT,
//                                       removeUponCompletion,
//                                       startQueueImmediately);

//         // put in and out points back where we found them.

//         seq.setInPoint(oldInPoint.seconds);
//         seq.setOutPoint(oldOutPoint.seconds);
//       }
//     }
//   }
// },

declare interface NewSequenceOptions {
  sequenceName: string;
  presetPath: string;
  uuid?: string;
}

const getSequenceFromName = (id: string): Sequence => {
  const sequences = app.project.sequences;
  for (var s = 0; s < sequences.numSequences; s++) {
    if (sequences[s].name === id) {
      return sequences[s];
    }
  }
  return null;
};

export const newSequenceFromPreset = ({
  sequenceName,
  presetPath,
  uuid,
}: NewSequenceOptions) => {
  app.enableQE();
  var presetFile = new File(presetPath);
  qe.project.newSequence(uuid, presetFile.fsName);
  const newSeq = getSequenceFromName(uuid!);
  newSeq.projectItem.name = sequenceName;
  return newSeq.projectItem.nodeId;
};

declare interface InsertSequenceOptions {
  toInsert: string;
  inSequence: string;
}

export const InsertSequence = ({
  toInsert,
  inSequence,
}: InsertSequenceOptions) => {
  try {
    const sequenceItemToInsert = getSequenceFromNodeId(toInsert);

    const destSequence = getSequenceFromNodeId(inSequence);
    if (sequenceItemToInsert && destSequence) {
      var targetVTrack = destSequence.videoTracks[0];
      if (targetVTrack) {
        // If there are already clips in this track, append this one to the end. Otherwise, insert at start time.
        if (targetVTrack.clips.numItems > 0) {
          var lastClip = targetVTrack.clips[targetVTrack.clips.numItems - 1];
          if (lastClip) {
            targetVTrack.insertClip(
              sequenceItemToInsert.projectItem,
              lastClip.end.seconds
            );
          }
        } else {
          var timeAtZero = new Time();
          timeAtZero.seconds = 0;
          targetVTrack.insertClip(
            sequenceItemToInsert.projectItem,
            timeAtZero.ticks
          );
        }
      }
    }
  } catch (e) {
    alert('error building sequences');
  }
};
