import { fs, path, os } from '../../lib/cep/node';
import { type SelectToolItem } from 'src/js/global';
const SHARED_FOLDER = '/buck/globalprefs/SHARED';
// /System/Volumes/Data/buck/globalprefs/SHARED/AFTER_EFFECTS/scripts/nuke-to-ae-tracker.1.0.0.jsx

export interface Script {
  name: string;
  filepath: string;
}

export const getScriptsList = (appId: string): Script[] => {
  let scriptsFolder = '';
  if (appId === 'AEFT') {
    scriptsFolder = path.join(SHARED_FOLDER, 'AFTER_EFFECTS', 'scripts');
  } else if (appId === 'PPRO') {
    scriptsFolder = path.join(SHARED_FOLDER, 'PREMIERE', 'scripts');
  }

  if (!fs.existsSync(scriptsFolder)) {
    return [];
  }

  const scriptFiles = fs
    .readdirSync(scriptsFolder)
    .filter((file) => !file.startsWith('.'))
    .filter((file) => file.endsWith('.jsx'))
    .map((file) => {
      const name = file.replace('.jsx', '');
      return {
        name: name,
        filepath: path.join(scriptsFolder, file),
      };
    });
  return scriptFiles;
};

export const installTool = (toolFilePath: string, appId: string) => {
  let scriptsFolder = '';
  if (appId === 'AEFT') {
    scriptsFolder = path.join(SHARED_FOLDER, 'AFTER_EFFECTS', 'scripts');
  } else if (appId === 'PPRO') {
    scriptsFolder = path.join(SHARED_FOLDER, 'PREMIERE', 'scripts');
  }

  fs.copyFileSync(toolFilePath, toolFilePath);
};

export const getLocalScripts = (
  appId: string,
  appVersion: string
): Script[] => {
  let scriptsFolder = '';
  const regVersion = new RegExp(/(\d+)\.(\d+)\.(\d+)/);
  const versionMatch = appVersion.match(regVersion);
  if (!versionMatch) {
    return [];
  }
  const [_, major, minor, micro] = versionMatch;

  if (os.platform() === 'win32') {
    scriptsFolder = path.join(
      'Applications',
      `Adobe After Effects ${major}`,
      'Scripts'
    );
  } else if (os.platform() === 'darwin') {
    scriptsFolder = path.join(
      '/Applications',
      `Adobe After Effects 20${major}`,
      'Scripts'
    );
  } else if (os.platform() === 'linux') {
    // scriptsFolder = path.join(SHARED_FOLDER, 'AFTER_EFFECTS', 'scripts');
  }

  console.log(scriptsFolder);
  if (!fs.existsSync(scriptsFolder)) {
    return [];
  }

  const localScripts = fs
    .readdirSync(scriptsFolder)
    .filter((file) => !file.startsWith('.'))
    .filter((file) => file.endsWith('.jsx'))
    .map((file) => {
      const name = file.replace('.jsx', '');
      return {
        name: name,
        filepath: path.join(scriptsFolder, file),
      };
    });
  return localScripts;
};
