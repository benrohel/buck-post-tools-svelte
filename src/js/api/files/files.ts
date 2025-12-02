
import { fs, os, path } from '../../lib/cep/node';
const { fdir } = require('fdir');

export function* readAllFiles(dir: string): Generator<string> {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    if (file.isDirectory()) {
      yield* readAllFiles(path.join(dir, file.name));
    } else {
      yield path.join(dir, file.name);
    }
  }
}

export const GetSystemFileVersionsWithShotName = async (
  filepath: string,
  shotName: string
): Promise<Array<any>> => {
  const versionRegex = /_v(\d+)/i;

  // Get file extension
  const ext = path.extname(filepath);
  const filename = path.basename(filepath);

  // Extract the base name without version (from both filename and folder)
  // For: /path/to/CR010_Intro_comp_v009/CR010_Intro_comp_ProRes_v009.mov
  // We want: CR010_Intro_comp_ProRes
  const baseFilename = filename.replace(versionRegex, '').replace(ext, '');

  // Smarter search root logic - limit to reasonable scope (max 3 levels up)
  let searchRoot = path.dirname(filepath);
  const maxLevelsUp = 3;

  for (let level = 0; level < maxLevelsUp && searchRoot !== path.dirname(searchRoot); level++) {
    const parentDir = path.dirname(searchRoot);
    if (!path.basename(searchRoot).includes('_v')) {
      break;
    }
    searchRoot = parentDir;
  }

  try {
    // Use fdir for fast, filtered file traversal
    const entries = await new fdir()
      .withFullPaths()
      .exclude((dirName: string) =>
        dirName.includes('temp') ||
        dirName.startsWith('.') ||
        dirName.includes('cache') ||
        dirName.includes('node_modules')
      )
      .filter((filePath: string) => {
        // Quick extension check first
        if (path.extname(filePath) !== ext) return false;

        const currentFilename = path.basename(filePath);
        const currentBaseFilename = currentFilename.replace(versionRegex, '').replace(ext, '');

        // Must match base filename
        return currentBaseFilename === baseFilename;
      })
      .crawl(searchRoot)
      .withPromise();

    // Additional validation for path structure similarity
    const versions = entries.filter((file: string) => {
      const relativeOriginal = path.relative(searchRoot, filepath);
      const relativeCurrent = path.relative(searchRoot, file);

      // Remove version numbers from both relative paths for comparison
      const cleanOriginal = relativeOriginal.replace(/_v\d+/g, '');
      const cleanCurrent = relativeCurrent.replace(/_v\d+/g, '');

      return cleanOriginal === cleanCurrent;
    });

    const versionsMapped = versions.map((v: string) => {
      // Try to extract version from filename first, then from folder path
      let versionNumber = '';
      const filenameMatch = path.basename(v).match(versionRegex);

      if (filenameMatch) {
        versionNumber = filenameMatch[1];
      } else {
        // Look for version in any part of the path
        const pathMatch = v.match(/_v(\d+)/);
        if (pathMatch) {
          versionNumber = pathMatch[1];
        }
      }

      const version = versionNumber ? `v${versionNumber}` : '';
      const displayName = version || 'unknown';

      return {
        filepath: v,
        version: version,
        name: baseFilename,
        displayName: displayName,
      };
    });

    // Sort by version number (descending)
    versionsMapped.sort((a: any, b: any) => {
      const versionA = parseInt(a.version.replace('v', ''), 10) || 0;
      const versionB = parseInt(b.version.replace('v', ''), 10) || 0;
      return versionB - versionA;
    });

    return versionsMapped.length > 0 ? versionsMapped : [{
      filepath: filepath,
      version: 'current',
      name: baseFilename,
      displayName: 'current'
    }];
  } catch (e) {
    console.log('Error finding versions:', e);
    return [{
      filepath: filepath,
      version: 'current',
      name: baseFilename,
      displayName: 'current'
    }];
  }
};

export const GetSystemFileVersions = (
  filepath: string,
  shotName: string
): Array<any> => {
  const versionRegex = /(\w+)_(v\w+|v\d+)(.)/i;
  const dir = path.dirname(filepath);
  const versions = fs.readdirSync(dir);
  const shotVersions = versions.filter((v) => {
    return path.basename(v.toLowerCase()).match(shotName.toLowerCase());
  });

  const versionsMapped = shotVersions.map((v) => {
    const match = v.match(versionRegex);
    const version = match ? match[2] : null;
    const name = match ? match[1] : null;
    const variation = name
      ? name.toLowerCase().replace(shotName.toLowerCase(), '').replace('_', '')
      : null;
    const displayName = match ? `${variation} | ${version}` : null;
    return {
      filepath: path.join(dir, v),
      version: version,
      name: name,
      displayName: displayName,
    };
  });
  return versionsMapped;
};

//regex to match the version number in a filename before the extension

export const GetFileVersion = (filepath: string) => {
  const versionRegex = /_(v\d+)/i;
  const match = path.basename(filepath.toLowerCase()).match(versionRegex);
  return match ? match[1] : null;
};

export const GetRenamedFiles = async (
  filepath: string,
  rootFolder: string,
  from: string,
  to: string
) => {
  let renamedFile = path.basename(filepath).replace(from, to);
  renamedFile = renamedFile.replaceAll(/v\d+/g, '');
  let renamedFiles: string[] = [];

  for (const file of readAllFiles(rootFolder)) {
    let trimmedFileName = path.basename(file).replaceAll(/v\d+/g, '');
    if (trimmedFileName.match(renamedFile)) {
      renamedFiles.push(file);
    }
  }
  return renamedFiles;
};

export const FindFileWithoutVersion = (filepath: string): string | null => {
  const versionRegex = /_(v\d+)/i;
  const dir = path.dirname(filepath);
  const filename = path.basename(filepath);
  const baseName = filename.replace(versionRegex, '');
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (file.startsWith(baseName)) {
      return path.join(dir, file);
    }
  }

  return null;
};

export const collectFilesByExtensions = (
  dir: string,
  extensions: string[]
): Record<string, { file: string; frameRange: string }[]> => {
  const result: Record<string, { file: string; frameRange: string }[]> = {};

  function collectFiles(currentDir: string) {
    const files = fs.readdirSync(currentDir, { withFileTypes: true });
    const imageSequenceRegex = /(\d+)\.(jpg|jpeg|png|exr)$/i;

    for (const file of files) {
      if (file.name.startsWith('.')) {
        continue; // Skip files starting with "."
      }
      const fullPath = path.join(currentDir, file.name);

      if (file.isDirectory()) {
        collectFiles(fullPath);
      } else {
        const ext = path.extname(file.name).toLowerCase();
        if (extensions.includes(ext)) {
          if (!result[currentDir]) {
            result[currentDir] = [];
          }

          const match = file.name.match(imageSequenceRegex);

          if (match) {
            const baseName = file.name.match(/^(.*?)\./)[1];
            const existingSequence = result[currentDir].find((item) =>
              path.basename(item.file).startsWith(baseName)
            );

            if (existingSequence) {
              const frameNumber = parseInt(match[1], 10);
              const frameRange = existingSequence.frameRange.split('-');
              const startFrame = parseInt(frameRange[0], 10);
              const endFrame = parseInt(frameRange[1], 10);

              existingSequence.frameRange = `${Math.min(
                startFrame,
                frameNumber
              )}-${Math.max(endFrame, frameNumber)}`;
            } else {
              result[currentDir].push({
                file: fullPath,
                frameRange: `${match[1]}-${match[1]}`,
              });
            }
          } else {
            result[currentDir].push({
              file: fullPath,
              frameRange: '',
            });
          }
        }
      }
    }
  }

  collectFiles(dir);
  return result;
};

export const groupFilesBySubFolders = (
  rootFolder: string,
  collectedFiles: Record<string, { file: string; frameRange: string }[]>
): Record<string, any> => {
  const groupedResult: Record<string, any> = {};

  function addToGroup(
    group: Record<string, any>,
    relativePath: string[],
    files: { file: string; frameRange: string }[]
  ) {
    const [current, ...rest] = relativePath;

    if (!group[current]) {
      group[current] = rest.length === 0 ? files : {};
    }

    if (rest.length > 0) {
      addToGroup(group[current], rest, files);
    }
  }

  for (const [folder, files] of Object.entries(collectedFiles)) {
    const relativePath = path.relative(rootFolder, folder).split(path.sep);
    addToGroup(groupedResult, relativePath, files);
  }

  return groupedResult;
};

const extensions = [
  '.jpg',
  '.png',
  '.jpeg',
  '.tiff',
  '.exr',
  '.dpx',
  '.mov',
  'mp4',
  '.psd',
];
export const GetFilesLibrary = (dir: string): Array<any> => {
  const productionRegex = /^(.*?)Production/;
  if (!fs.existsSync(dir)) return [];
  const posixRoot = path.posix.normalize(dir);
  const rootFolder = posixRoot.match(productionRegex)[0];
  const shotsFolder = path.join(rootFolder, 'shots');
  const assetsFolder = path.join(rootFolder, 'Assets');

  const flatShots = collectFilesByExtensions(shotsFolder, extensions);
  // const shots = groupFilesBySubFolders(rootFolder, flatShots);
  const flatAssets = collectFilesByExtensions(assetsFolder, extensions);

  // Convert the shots and assets objects to arrays
  const shotsArray = Object.entries(flatShots)
    .map(([, value]) => value)
    .flat();
  const assetsArray = Object.entries(flatAssets)
    .map(([, value]) => value)
    .flat();
  return [...shotsArray, ...assetsArray];
};

export const getAeOutputModulesAEP = () => {
  const templateFilePath = path.join(
    __dirname,
    'assets',
    'aeTemplates',
    'buckOutputModules.aep'
  );

  return os.platform() === 'win32'
    ? templateFilePath.replace(/\\/g, '\\\\')
    : templateFilePath;
};

export const SHARED_FOLDER = () => {
  const platformRoot =
    os.platform() === 'win32' ? '\\\\buck' : '/System/Volumes/Data/buck';

  return path.join(platformRoot, 'globalprefs', 'SHARED');
};

export const PRODUCTION_ROOT = (projectPath: string) => {
  const productionRegex = /^(.*?)Production/;
  const productionDir = projectPath.match(productionRegex)[0];
  if (!fs.existsSync(productionDir)) return null;
  // const posixRoot = path.posix.normalize(productionDir);
  const rootFolder = productionDir.match(productionRegex)[0];
  return rootFolder;
};

export const PROJECT_ROOT = (projectPath: string) => {
  const current = projectPath.split(/\/work\/current/);
  const projectFolders = current[1].split('/');
  return path.posix.join(current[0], 'work', 'current', projectFolders[1]);
};


export const PROJECT_AEFT_META_FOLDER = (projectPath: string) => {
  const productionFolder = PRODUCTION_ROOT(projectPath);
  if (!productionFolder) return null;
  return path.join(productionFolder, 'Common', 'Meta', 'aeft');
};

export declare interface ProjectSettings {
  bitsPerChannel: number;
  compensateForSceneReferredProfiles: boolean;

  workingSpace: string;
  workingGamma: 2.2 | 2.4;
  linearizeWorkingSpace: boolean;
  linearBlending: boolean;
  [key: string]: any;
}

export const getProjectSettingsTemplate = (projectPath: string) => {
  const productionFolder = PRODUCTION_ROOT(projectPath);
  if (!productionFolder) return null;
  const projectSettingsPath = path.join(
    PROJECT_AEFT_META_FOLDER(projectPath),
    'project-settings.json'
  );
  if (!fs.existsSync(projectSettingsPath)) {
    return null;
  }
  const projectSettings = JSON.parse(
    fs.readFileSync(projectSettingsPath, 'utf8')
  );
  return projectSettings;
};

export const setProjectSettingsTemplate = (
  projectPath: string,
  projectSettings: ProjectSettings
) => {
  const productionFolder = PRODUCTION_ROOT(projectPath);
  if (!productionFolder) return false;
  const projectSettingsPath = path.join(
    PROJECT_AEFT_META_FOLDER(projectPath),
    'project-settings.json'
  );
  if (!fs.existsSync(path.dirname(projectSettingsPath))) {
    return false;
  }
  fs.writeFileSync(
    projectSettingsPath,
    JSON.stringify(projectSettings, null, 2)
  );
  return true;
};

export const PROJECT_SCRIPTS_FOLDER = (projectPath: string) => {
  const productionFolder = PROJECT_ROOT(projectPath);
  if (!productionFolder) return null;
  const scriptsFolder = path.join(productionFolder, 'Production', 'Common', 'Meta', 'aeft', 'scripts');
  if (!fs.existsSync(scriptsFolder)) return null;
  return scriptsFolder;
};

export const PROJECT_COMMON_AE_FOLDER = (projectPath: string) => {
  const projectRoot = PROJECT_ROOT(projectPath);
  if (!projectRoot) return null;
  const commonFolder = path.join(projectRoot, 'Production', 'Common', 'Work', 'AE');
  if (!fs.existsSync(commonFolder)) return null;
  return commonFolder;
};
