import { padLeft, openFolderDialog, forEach } from '../utils/utils';
import {
  findCompByName,
  findFolderByName,
  getOutputModulesTemplates,
  getSelectedCompsForRender,
} from './aeft-utils';
export {
  openFolderDialog,
  getOutputModulesTemplates,
  getSelectedCompsForRender,
  findCompByName,
  findFolderByName,
};

export const helloWorld = () => {
  alert('Hello from After Effects!');
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

// Project

declare interface INewSequenceOptions {
  presetPath: string;
  width: number;
  height: number;
  framerate: number;
  duration: number;
  name: string;
}
export const newSequenceFromPreset = (options: INewSequenceOptions) => {
  var templateFile = new File(options.presetPath);
  if (!templateFile.exists) {
    alert(templateFile.fsName);
    alert('Template file not found');
    return null;
  }

  app.open(templateFile);
  var comp = findCompByName('compName');
  if (!comp) {
    return null;
  }

  comp.width = options.width;
  comp.height = options.height;
  comp.frameRate = options.framerate;
  comp.duration = options.duration / options.framerate;
  comp.name = options.name;

  // var newComp = app.project.items.addComp(
  //   options.name,
  //   options.width,
  //   options.height,
  //   1,
  //   options.duration / options.framerate,
  //   options.framerate
  // );

  var folder = findFolderByName('01_Master');
  // if (folder) {
  //   newComp.parentFolder = folder;
  // }

  return comp.id;
};

// Renamer
export const findAndReplace = (options: any) => {
  var selectedClips: any[] = [];

  switch (options.scope) {
    case 'project':
      selectedClips = app.project.selection;
      break;
    case 'timeline':
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
    case 'project':
      selectedClips = app.project.selection;
      break;
    case 'timeline':
      var activeSequene = app.project.activeItem;
      if (activeSequene instanceof CompItem) {
        selectedClips = activeSequene.selectedLayers;
      }
      break;
    default:
      return;
  }
  for (var c = 0; c < selectedClips.length; c++) {
    const newName = `${options.prefix ? options.prefix + '_' : ''}${
      selectedClips[c].name
    }${options.suffix ? '_' + options.suffix : ''}`;
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
    alert('Not a footage item');
  }
};

export const renameToFile = () => {
  var clips = app.project.selection;
  if (clips.length === 0) {
    alert('No clips selected');
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
    alert('No clips selected');
    return null;
  }

  clips = clips
    //@ts-ignore
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

export const getSelectedSequencesForNode = () => {
  var sequences = [];
  var selection = app.project.selection;
  if (selection.length === 0) {
    alert('No sequences selected');
    return null;
  }
  for (var i = 0; i < selection.length; i++) {
    var sequence = selection[i];
    if (sequence instanceof CompItem) {
      sequences.push({
        name: sequence.name,
        nodeId: sequence.id,
      });
    }
  }
  return JSON.stringify({ sequences: sequences });
};

//Export
interface IRenderWithTokensOptions {
  compId: number;
  filepath: string;
  presetName: string;
}
export const addToRenderQueue = (options: IRenderWithTokensOptions) => {
  var shotComp;
  var { compId, filepath, presetName } = options;
  if (compId <= 0) {
    shotComp = app.project.activeItem;
  } else {
    shotComp = getItemFromNodeId(compId);
  }

  if (!(shotComp instanceof CompItem)) {
    return false;
  }
  var rqItems = app.project.renderQueue.items;
  var newItem = rqItems.add(shotComp);

  newItem.timeSpanDuration = shotComp.workAreaDuration;

  var renderFile = new File(filepath);
  var om = newItem.outputModule(1);
  if (presetName) {
    om.applyTemplate(presetName);
  }
  om.file = renderFile;
};
