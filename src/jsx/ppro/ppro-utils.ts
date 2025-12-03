// ProjectItem Helpers

export const forEachChild = (
  item: ProjectItem,
  callback: (item: ProjectItem) => void
) => {
  const len = item.children.numItems;
  for (let i = 0; i < len; i++) {
    callback(item.children[i]);
  }
};

export const deleteItem = (item: ProjectItem) => {
  if (item.type === 2 /* BIN */) {
    item.deleteBin();
  } else {
    const tmpBin = app.project.rootItem.createBin('tmp');
    item.moveBin(tmpBin);
    tmpBin.deleteBin();
  }
};

export const getChildByName = (item: ProjectItem, name: string) => {
  for (let i = 0; i < item.children.numItems; i++) {
    const child = item.children[i];
    if (child.name === name) {
      return child;
    }
  }
};

export const getParentItem = (item: ProjectItem) => {
  const dir = item.treePath.split('\\');
  if (dir.length < 2) {
    return app.project.rootItem;
  }
  let current = app.project.rootItem;
  for (let i = 2; i < dir.length - 1; i++) {
    const name = dir[i];
    const next = getChildByName(current, name);
    if (next) {
      current = next;
    }
  }
  return current;
};

export const findItemByPath = (
  item: ProjectItem,
  path: string
): ProjectItem | undefined => {
  const len = item.children.numItems;
  for (let i = 0; i < len; i++) {
    const child = item.children[i];
    if (child.children && child.children.numItems > 0) {
      const res = findItemByPath(child, path);
      if (res) {
        return res;
      }
    } else if (child.getMediaPath() === path) {
      return child;
    }
  }
};

// Sequence Helpers

export const getSequenceLengthInFrames = (seq: Sequence) => {
  const settings = seq.getSettings();
  const end = seq.end;
  const fps = settings.videoFrameRate.ticks;
  const frames = parseInt(end) / parseInt(fps);
  return frames;
};

export const forEachVideoTrack = (
  sequence: Sequence,
  callback: (track: Track, index: number) => void,
  reverse?: boolean
) => {
  const num = sequence.videoTracks.numTracks;
  if (reverse) {
    for (let i = num - 1; i > -1; i--) {
      callback(sequence.videoTracks[i], i);
    }
  } else {
    for (let i = 0; i < num; i++) {
      callback(sequence.videoTracks[i], i);
    }
  }
};

export const forEachAudioTrack = (
  sequence: Sequence,
  callback: (track: Track, index: number) => void,
  reverse?: boolean
) => {
  const num = sequence.audioTracks.numTracks;
  if (reverse) {
    for (let i = num - 1; i > -1; i--) {
      callback(sequence.audioTracks[i], i);
    }
  } else {
    for (let i = 0; i < num; i++) {
      callback(sequence.audioTracks[i], i);
    }
  }
};

export const forEachClip = (
  track: Track,
  callback: (clip: TrackItem, index: number) => void,
  reverse?: boolean
) => {
  const num = track.clips.numItems;
  if (reverse) {
    for (let i = num - 1; i > -1; i--) {
      callback(track.clips[i], i);
    }
  } else {
    for (let i = 0; i < num; i++) {
      callback(track.clips[i], i);
    }
  }
};

// Time Helpers

export const addTime = (a: Time, b: Time) => {
  const ticks = parseInt(a.ticks) + parseInt(b.ticks);
  let time = new Time();
  time.ticks = ticks.toString();
  return time;
};

export const subtractTime = (a: Time, b: Time) => {
  const ticks = parseInt(a.ticks) - parseInt(b.ticks);
  let time = new Time();
  time.ticks = ticks.toString();
  return time;
};
export const multiplyTime = (a: Time, factor: number) => {
  const ticks = parseInt(a.ticks) * factor;
  let time = new Time();
  time.ticks = ticks.toString();
  return time;
};
export const divideTime = (a: Time, factor: number) => {
  const ticks = parseInt(a.ticks) / factor;
  let time = new Time();
  time.ticks = ticks.toString();
  return time;
};

// QE DOM Methods

export const qeGetClipAt = (track: Track, index: number) => {
  let curClipIndex = -1;
  for (let i = 0; i < track.numItems; i++) {
    const item = track.getItemAt(i);
    //@ts-ignore
    const type = item.type as 'Empty' | 'Clip';
    if (type === 'Clip') {
      curClipIndex++;
      if (curClipIndex === index) {
        return item;
      }
    }
  }
};



// Motion Graphics Template ( MOGRT ) Helpers

export const fillMogrtText = (
  clip: TrackItem,
  propName: string,
  text: string
) => {
  const mgt = clip.getMGTComponent();
  const prop = mgt.properties.getParamForDisplayName(propName);
  if (prop) {
    const valueStr = prop.getValue();
    let value = JSON.parse(valueStr) as any;
    value.textEditValue = text;
    prop.setValue(JSON.stringify(value), true);
  }
};

// Audio Conversions

export const dbToDec = (x: number) => Math.pow(10, (x - 15) / 20);

export const decToDb = (x: number) => 20 * Math.log(x) * Math.LOG10E + 15;

export const getProjectFile = () => {
  if (app.project && app.project.path === null) {
    return null;
  }
  return app.project.path;
};

/**
 * Collect all unique media file paths in the current project.
 * Works in ExtendScript (no Array#indexOf).
 * @returns {Array<string>}
 */
export function collectAllFilePaths() {
  var results: string[] = [];
  var seen = {}; // map for O(1) dedupe
  var isWindows = ($.os && $.os.toLowerCase().indexOf("windows") !== -1);

  function norm(p: string) {
    // Normalize for dedupe: case-insensitive on Windows
    return isWindows && p ? p.toLowerCase() : p;
  }

  function walk(parentItem: ProjectItem) {
    if (!parentItem || !parentItem.children) return;

    var childCount = parentItem.children.numItems;
    for (var i = 0; i < childCount; i++) {
      var child = parentItem.children[i];

      // Recurse into bins
      if (child && child.type === ProjectItemType.BIN) {
        walk(child);
        continue;
      }

      // Try to read media path for leaf items (clips, stills, audio, etc.)
      try {
        if (child && child.getMediaPath) {
          var p = child.getMediaPath();
          if (p && !seen[norm(p)]) {
            seen[norm(p)] = true;
            results.push(p); // keep original casing
          }
        }
      } catch (e) {
        // Items like synthetic clips/titles might throw or have no path—ignore
      }
    }
  }

  walk(app.project.rootItem);
  return JSON.stringify(results);
}


export const getProjectDir = () => {

  if (app.project.path !== null) {
    //@ts-ignore
    var projectFile = File(app.project.path);
    return projectFile.parent.absoluteURI;
  } else {
    return '';
  }
};
