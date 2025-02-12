import { padLeft, openFolderDialog } from "../utils/utils";
export { openFolderDialog };

export const helloWorld = () => {
  alert("Hello from After Effects!");
  app.project.activeItem;
};

const getItemFromNodeId = (nodeId: number): Item | null => {
  const item = app.project.items;
  for (var i = 1; i <= app.project.numItems; i++) {
    var currentItem = item[i];
    if (currentItem.id === nodeId) {
      return currentItem;
    }
  }
  return null;
};
// Renamer
export const findAndReplace = (options: any) => {
  var selectedClips: any[] = [];

  switch (options.scope) {
    case "project":
      selectedClips = app.project.selection;
      break;
    case "timeline":
      var activeSequene = app.project.activeItem;
      if (activeSequene instanceof CompItem) {
        selectedClips = activeSequene.selectedLayers;
      }
      break;
    default:
      return;
  }
  for (var c = 0; c < selectedClips.length; c++) {
    const newName = selectedClips[c].name.replace(options.from, options.to);
    selectedClips[c].name = newName;
  }
};

export const addPrefixOrSuffix = (options: any) => {
  var selectedClips: any[] = [];

  switch (options.scope) {
    case "project":
      selectedClips = app.project.selection;
      break;
    case "timeline":
      var activeSequene = app.project.activeItem;
      if (activeSequene instanceof CompItem) {
        selectedClips = activeSequene.selectedLayers;
      }
      break;
    default:
      return;
  }
  for (var c = 0; c < selectedClips.length; c++) {
    const newName = `${options.prefix ? options.prefix + "_" : ""}${
      selectedClips[c].name
    }${options.suffix ? "_" + options.suffix : ""}`;
    selectedClips[c].name = newName;
  }
};

export const renameShots = (options: any) => {
  var sequence = app.project.activeItem;
  if (!(sequence instanceof CompItem)) {
    return false;
  }
  var shots = sequence.selectedLayers;
  for (var s = 0; s < shots.length; s++) {
    var shotNumber = (options.startValue + s * options.increment).toString();
    var padString = padLeft(shotNumber, options.padding);
    var shotName = options.prefix + padString;
    shots[s].name = shotName;
  }
  return true;
};

const renameClipFromSource = (shot: any) => {
  if (shot && shot instanceof FootageItem) {
    var sourceFile = shot.mainSource.file;
    if (!sourceFile) {
      return;
    } else {
      var sourceName = sourceFile.displayName;
      shot.name = sourceName;
    }
  } else {
    alert("Not a footage item");
  }
};

export const renameToFile = () => {
  var clips = app.project.selection;
  if (clips.length === 0) {
    alert("No clips selected");
    return false;
  }
  for (var c = 0; c < clips.length; c++) {
    renameClipFromSource(clips[c]);
  }
  return true;
};

export const getSelectedClips = () => {
  var clips = app.project.selection;
  if (clips.length === 0) {
    alert("No clips selected");
    return null;
  }

  clips = clips
    .filter((clip: any) => clip instanceof FootageItem)
    .map((clip: any) => {
      return {
        name: clip.name,
        filepath: clip.file.fsName,
        nodeId: clip.id,
      };
    });
  return JSON.stringify(clips);
};

interface IReplaceMediaOptions {
  nodeId: number;
  oldPath: string;
  newPath: string;
}
export const replaceMedia = function (options: IReplaceMediaOptions) {
  var currentClip = getItemFromNodeId(options.nodeId);

  var pFile = new File(options.oldPath);
  var nFile = new File(options.newPath);

  if (currentClip instanceof FootageItem && pFile.exists && nFile.exists) {
    if (pFile.fsName.match(/\.\d+|_\d+/)) {
      currentClip.replaceWithSequence(nFile, true);
    } else {
      currentClip.replace(nFile);
    }
    currentClip.name = nFile.displayName;
    return JSON.stringify({
      clipName: currentClip.name,
      filepath: nFile.fsName,
    });
  }
};
