import { match } from 'assert';
import { fs, os, path } from '../../lib/cep/node';
import { ca, fi } from 'date-fns/locale';
import { posix } from 'path';
import { setProjectSettings } from 'src/jsx/aeft/aeft-utils';

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

export const GetSystemFileVersionsWithShotName = (
  filepath: string,
  shotName: string
): Array<any> => {
  const versionRegex = /(\w+)_(v\w+|v\d+)(.)/i;
  const dir = path.dirname(filepath);
  // const versions = fs.readdirSync(dir);

  // regex to match the file extension
  const extRegex = /\.(\w+)$/i;
  const extMatch = filepath.match(extRegex);
  const ext = extMatch ? extMatch[1] : null;
  const sourceRegex = /(?<name>\w+)_v(?<version>\d+)(?<suffix>.+)/;
  const matchRegex = /(?<name>\w+)_v(?<version>\d+)(?<suffix>.+)/;
  let sourceSuffix = '';
  const sourceSuffixResult = matchRegex.exec(
    path.basename(path.basename(filepath))
  )?.groups;
  if (sourceSuffixResult) {
    sourceSuffix = sourceSuffixResult.suffix;
  }

  let versions: string[] = [];
  const sourceFolderStructure = filepath.split(/_v\d+/)[0];

  console.log('SOURCE FOLDER STRUCTURE', sourceFolderStructure);

  try {
    for (const file of readAllFiles(path.dirname(dir))) {
      const matchExt = path.extname(file) === `.${ext}`;
      const matchSuffix = matchRegex.exec(path.basename(file))?.groups;
      if (matchSuffix === undefined) continue;
      const { suffix } = matchSuffix;
      const targeteFolderStructure = file.split(/_v\d+/)[0];
      if (
        matchExt &&
        suffix === sourceSuffix &&
        targeteFolderStructure === sourceFolderStructure &&
        path
          .basename(file)
          .toLowerCase()
          .replace(/v\d+/g, '')
          .match(path.basename(filepath).toLowerCase().replace(/v\d+/g, ''))
      )
        versions.push(file);
    }

    // regex to match the file extension
    // const extRegex = /\.(\w+)$/i;
    // const extMatch = filepath.match(extRegex);
    // const ext = extMatch ? extMatch[1] : null;

    const versionsMapped = versions.map((v) => {
      const match = v.match(versionRegex);
      const version = match ? match[2] : '';
      const name = match ? match[1] : '';
      // let displayName =match && variation ? `${variation} | ${version}` : `${version}`;
      let displayName = `${version}`;

      return {
        filepath: v,
        version: version,
        name: name,
        displayName: displayName,
      };
    });
    return versionsMapped;
  } catch (e) {
    console.log(e);
    return [filepath];
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
  const dir = path.dirname(filepath);
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

  console.log('renamedFile', renamedFile);
  renamedFile = renamedFile.replaceAll(/v\d+/g, '');
  const files = fs.readdirSync(rootFolder);
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
    console.log('FILE', path.basename(file));

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
  const assets = groupFilesBySubFolders(rootFolder, flatAssets);

  // Convert the shots and assets objects to arrays
  const shotsArray = Object.entries(flatShots)
    .map(([key, value]) => value)
    .flat();
  const assetsArray = Object.entries(flatAssets)
    .map(([key, value]) => value)
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
  const productionFolder = PRODUCTION_ROOT(projectPath);
  if (!productionFolder) return null;
  const scriptsFolder = path.join(
    productionFolder,
    'Common',
    'Meta',
    'aeft',
    'scripts'
  );
  if (!fs.existsSync(scriptsFolder)) return null;
  return scriptsFolder;
};
