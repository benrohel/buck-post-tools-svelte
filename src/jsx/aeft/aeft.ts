import { Key } from 'lucide-svelte';
import { padStart, forEach } from '../utils/utils';
import { findCompByName } from './aeft-utils';
export {
  findCompByName,
  findFolderByName,
  getOutputModulesTemplates,
  getSelectedCompsForRender,
  getProjectFile,
  getProjectDir,
  selectFolder,
  appVersion,
  importProjectAndSaveOutputModules,
  getProjectSettings,
  setProjectSettings,
  openExistingFolder,
} from './aeft-utils';
export { getAndSetEssentialProperties, updateEssentialPropertiesFromCSV, listAllComps } from './templater';

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
  projectFile: string;
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
  app.project.save(new File(options.projectFile));
  return true;
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
    const newName = `${options.prefix ? options.prefix + '_' : ''}${selectedClips[c].name
      }${options.suffix ? '_' + options.suffix : ''}`;
    selectedClips[c].name = newName;
  }
};
interface RenameShotsOptions {
  prefix: string;
  startValue: number;
  increment: number;
  padding: number;
  scope: 'project' | 'timeline';
}
export const renameShots = (options: RenameShotsOptions) => {
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
  for (var s = 0; s < selectedClips.length; s++) {
    var shotNumber = (options.startValue + s * options.increment).toString();
    var padString = padStart(shotNumber, options.padding, '0');
    var shotName = options.prefix + padString;
    selectedClips[s].name = shotName;
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

var renameLayerToSource = (layer: any) => {
  if (layer && layer instanceof AVLayer) {
    var sourceFile = layer.source.file;
    if (!sourceFile) {
      return;
    } else {
      var sourceName = sourceFile.displayName;
      layer.name = sourceName;
    }
  } else {
    alert('Not a layer');
  }
};

export const revertToFilename = (scope: 'project' | 'timeline') => {
  app.beginUndoGroup('Revert To Filename');
  if (scope === 'timeline') {
    var sequence = app.project.activeItem;
    if (!(sequence instanceof CompItem)) {
      return false;
    }
    var layers = sequence.selectedLayers;
    if (layers.length === 0) {
      alert('No layers selected');
      return false;
    }
    for (var l = 0; l < layers.length; l++) {
      renameLayerToSource(layers[l]);
    }
  } else {
    var clips = app.project.selection;
    if (clips.length === 0) {
      alert('No clips selected');
      return false;
    }
    for (var c = 0; c < clips.length; c++) {
      renameClipFromSource(clips[c]);
    }
  }
  app.endUndoGroup();
  return true;
};

interface IImportOptions {
  filepath: string;
  isSequence: boolean;
}

export const importMediaFile = (options: IImportOptions) => {
  const f = new File(options.filepath);
  const importOptions = new ImportOptions();
  importOptions.file = f;
  if (options.isSequence) {
    importOptions.sequence = options.isSequence;
    importOptions.forceAlphabetical = true;
  }
  var importedItem = app.project.importFile(importOptions);
  return importedItem.id;
};

export const getSelectedClips = () => {
  var clipsSelection = app.project.selection;
  var clips: any = [];

  for (var c = 0; c < clipsSelection.length; c++) {
    var clip = clipsSelection[c];
    if (clip instanceof FootageItem) {
      clips.push({
        name: clip.name,
        filepath: clip.file?.fsName ?? '',
        nodeId: clip.id,
      });
    }
  }

  if (clips.length === 0) {
    alert('No clips selected');
    return null;
  }

  return JSON.stringify(clips);
};

interface IReplaceMediaOptions {
  nodeId: number;
  oldPath: string;
  newPath: string;
  isSequence: boolean;
}
export const replaceMedia = function (options: IReplaceMediaOptions) {
  var currentClip = getItemFromNodeId(options.nodeId);

  var nFile = new File(options.newPath);

  if (currentClip instanceof FootageItem && nFile.exists) {
    if (options.isSequence) {
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
  outputModules: { outputModuleName: string; outputModuleFilePath: string }[];
}
export const addToRenderQueue = (options: IRenderWithTokensOptions) => {
  app.beginUndoGroup('Add to Render Queue');
  var shotComp;
  var { compId, outputModules } = options;
  if (compId <= 0) {
    shotComp = app.project.activeItem;
  } else {
    shotComp = getItemFromNodeId(compId);
  }

  if (!(shotComp instanceof CompItem)) {
    alert('No comp selected');
    return false;
  }
  var rqItems = app.project.renderQueue.items;
  var rqItem = rqItems.add(shotComp);
  rqItem.timeSpanDuration = shotComp.workAreaDuration;
  var numModules = options.outputModules.length;
  // Loop to add output modules
  for (var i = 1; i < numModules; i++) {
    rqItem.outputModules.add();
  }
  for (var i = 0; i < rqItem.numOutputModules; i++) {
    var presetName = outputModules[i].outputModuleName;
    var presetPath = outputModules[i].outputModuleFilePath;

    var om = rqItem.outputModule(i + 1);

    // Apply the template
    try {
      om.applyTemplate(presetName);
      om.file = new File(presetPath);
    } catch (e: any) {
      alert(
        'Failed to apply template: ' +
        outputModules[i].outputModuleName +
        '\n' +
        e.toString()
      );
      break;
    }

    // Set the output file path (optional)
  }
  app.endUndoGroup();
  return true;
};

// Nuke Trackers

interface TrackerPoint {
  x: number[];
  y: number[];
}
interface Tracker {
  x: number[];
  y: number[];
  name: string;
  xpos: number;
  ypos: number;
}

interface TrackersData {
  [key: string]: Tracker;
}

const createNukeTracker = (name: string, pointsData: TrackerPoint) => {
  var comp = app.project.activeItem;
  if (!comp || !(comp instanceof CompItem)) {
    alert('Please select a composition');
    return;
  }

  var nullLayer = comp.layers.addNull();
  nullLayer.name = name;
  var numberOfFrames = pointsData.x.length;

  // Loop through the array and set a position keyframe on each frame
  for (var i = 0; i < numberOfFrames; i++) {
    var frame = i * comp.frameDuration;
    nullLayer
      .property('Position')
      // @ts-ignore
      .setValueAtTime(frame, [
        pointsData.x[i],
        comp.height - pointsData.y[i],
        0,
      ]);
  }
};

export const buildCornerPinFromNuke = (trackingData: TrackersData) => {
  var keys = ['to1', 'to2', 'to3', 'to4'];
  for (var i = 0; i < keys.length; i++) {
    var currentTracker = trackingData[keys[i]];
    createNukeTracker(keys[i], currentTracker);
  }
};

export const versionUpNames = (scope: 'project' | 'timeline') => {
  if (scope === 'project') {
    var selection = app.project.selection;
    if (selection.length === 0) {
      alert('No clips selected');
      return false;
    }

    for (var c = 0; c < selection.length; c++) {
      if (!(selection[c] instanceof CompItem)) {
        continue;
      }
      const currentVersion = selection[c].name.match(/_v(\d+)$/);
      if (!currentVersion) {
        alert(`No version token found in ${selection[c].name}`);
        return false;
      }
      const version = parseInt(currentVersion[1], 10);
      const versionString = padStart((version + 1).toString(), 3, '0');
      const newName = selection[c].name.replace(
        /_v(\d+)$/,
        `_v${versionString}`
      );
      selection[c].name = newName;
    }
    return true;
  } else {
    var sequence = app.project.activeItem;
    if (!(sequence instanceof CompItem)) {
      return false;
    }
    var layers = sequence.selectedLayers;
    if (layers.length === 0) {
      alert('No layers selected');
      return false;
    }
    for (var l = 0; l < layers.length; l++) {
      const currentVersion = layers[l].name.match(/_v(\d+)$/);
      if (!currentVersion) {
        alert(`No version token found in ${layers[l].name}`);
        return false;
      }
      const version = parseInt(currentVersion[1], 10);
      const versionString = padStart((version + 1).toString(), 3, '0');
      const newName = layers[l].name.replace(/_v(\d+)$/, `_v${versionString}`);
      layers[l].name = newName;
    }
    return true;
  }
};

export const goToFrame = (nodeId: number) => {
  const clip = getItemFromNodeId(nodeId);
  let clipLayer = null;
  if (clip) {
    var usedIn = clip.usedIn;
    if (usedIn) {
      var firstComp = usedIn[0];
      for (var l = 1; l <= firstComp.numLayers; l++) {
        clipLayer = firstComp.layer(l) as AVLayer;
        if (clipLayer.source.id === clip.id) {
          firstComp.openInViewer();
          firstComp.time = clipLayer.startTime;
        }
      }
    }
  }
  return true;
};

export const applyExpressionToSelectedProperty = (exp: string) => {
  app.beginUndoGroup('Apply BUCK Expression');
  var comp = app.project.activeItem as CompItem;
  var hasPropertSelect5ed = false;
  if (comp instanceof CompItem) {
    var layers = comp.layers;
    for (var l = 1; l <= layers.length; l++) {
      var currentLayer = comp.layer(l);
      var props = currentLayer.selectedProperties;
      if (props.length > 0) {
        hasPropertSelect5ed = true;
        for (var p = 0; p < props.length; p++) {
          var prop = currentLayer.selectedProperties[p] as Property;
          if (prop && prop.selected && prop.canSetExpression) {
            prop.expression = exp;
          }
        }
      }
    }
  } else {
    alert('A composition needs to be active');
  }
  if (!hasPropertSelect5ed) {
    alert('No property selected.');
  }
  app.endUndoGroup();
};

export const getSelectedExpression = () => {
  app.beginUndoGroup('Get Selected Expression');
  var comp = app.project.activeItem as CompItem;
  if (comp instanceof CompItem) {
    var layers = comp.layers;
    for (var l = 1; l <= layers.length; l++) {
      var currentLayer = comp.layer(l);
      var props = currentLayer.selectedProperties;
      if (props.length > 0) {
        for (var p = 0; p < props.length; p++) {
          var prop = currentLayer.selectedProperties[p] as Property;
          if (prop && prop.selected && prop.canSetExpression) {
            return prop.expression;
          }
        }
      }
    }
  } else {
    alert('A composition needs to be active');
  }
  app.endUndoGroup();
};

export const getSelectedProperty = () => {
  var comp = app.project.activeItem;
  if (comp instanceof CompItem) {
    var layers = comp.layers;
    for (var l = 1; l <= layers.length; l++) {
      var currentLayer = comp.layer(l);
      var props = currentLayer.selectedProperties;
      if (props.length > 0) {
        for (var p = 0; p < props.length; p++) {
          var prop = currentLayer.selectedProperties[p] as Property;
          if (prop && prop.selected && prop.canSetExpression) {
            return prop;
          }
        }
      }
    }
  } else {
    alert('A composition needs to be active');
  }
};

const traverseProperty = (nestedProp: any, path: string): string => {
  var parent = nestedProp.parentProperty;
  if (parent == null) {
    path = 'thisComp.layer("' + nestedProp.name + '")' + path;
    return path;
  } else {
    path = '("' + nestedProp.name + '")' + path;
    return traverseProperty(parent, path);
  }
};

export const getSelectedPropertyPath = () => {
  var prop = getSelectedProperty();
  return traverseProperty(prop, '');
};


/**
 * Collect all unique media file paths in the current project.
 * Works in ExtendScript (no Array#indexOf).
 * @returns {string} JSON stringified array of file paths
 */
export function collectAllFilePaths() {
  var results: string[] = [];
  var seen = {}; // map for O(1) dedupe
  var isWindows = ($.os && $.os.toLowerCase().indexOf("windows") !== -1);

  function norm(p: string) {
    // Normalize for dedupe: case-insensitive on Windows
    return isWindows && p ? p.toLowerCase() : p;
  }

  // After Effects uses app.project.items - a 1-indexed collection
  for (var i = 1; i <= app.project.items.length; i++) {
    var item = app.project.items[i];

    try {
      // Check if it's a FootageItem with a file
      if (item instanceof FootageItem && item.file) {
        var p = item.file.fsName; // Get file system path
        if (p && !seen[norm(p)]) {
          seen[norm(p)] = true;
          results.push(p); // keep original casing
        }
      }
      // Also check mainSource for some footage types
      else if (item instanceof FootageItem && item.mainSource && item.mainSource.file) {
        var p = item.mainSource.file.fsName;
        if (p && !seen[norm(p)]) {
          seen[norm(p)] = true;
          results.push(p);
        }
      }
    } catch (e) {
      // Solids, placeholders, or synthetic items might throw—ignore
    }
  }

  return JSON.stringify(results);
}