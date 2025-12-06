import { fs, path, os } from '@/lib/cep/node';
import { type SelectToolItem } from 'src/js/global';
import { SHARED_FOLDER, PRODUCTION_ROOT, PROJECT_SCRIPTS_FOLDER, PROJECT_COMMON_AE_FOLDER } from '@/api/files/files';
import { platform } from 'os';

// /System/Volumes/Data/buck/globalprefs/SHARED/AFTER_EFFECTS/scripts/nuke-to-ae-tracker.1.0.0.jsx

export interface Script {
  name: string;
  filename: string;
  filepath: string;
}
export const getBuckScripts = (appId: string): Script[] => {

  let scriptsFolder = '';
  if (appId === 'AEFT') {
    scriptsFolder = path.join(SHARED_FOLDER(), 'AFTER_EFFECTS', 'scripts');
  } else if (appId === 'PPRO') {
    scriptsFolder = path.join(SHARED_FOLDER(), 'PREMIERE', 'scripts');
  }

  // scriptsFolder = "/System/Volumes/Data/buck/globalprefs/SHARED/AFTER_EFFECTS/scripts"
  if (!fs.existsSync(scriptsFolder)) {
    console.log('Buck scripts folder not found');
    return [];
  }

  const folderFiles = fs.readdirSync(scriptsFolder);
  console.log('Buck scripts folder', folderFiles);

  const scriptFiles = fs
    .readdirSync(scriptsFolder)
    .filter((file) => !file.startsWith('.'))
    .filter((file) => file.endsWith('.jsx'))
    .map((file) => {
      const name = file.replace('.jsx', '');
      return {
        name: name,
        filepath: path.join(scriptsFolder, file),
        filename: file
      };
    });
  console.log('Buck scripts files', scriptFiles);
  return scriptFiles;
};

export const installTool = (toolFilePath: string, appId: string) => {
  let scriptsFolder = '';
  if (appId === 'AEFT') {
    scriptsFolder = path.join(SHARED_FOLDER(), 'AFTER_EFFECTS', 'scripts');
  } else if (appId === 'PPRO') {
    scriptsFolder = path.join(SHARED_FOLDER(), 'PREMIERE', 's          cripts');
  }

  fs.copyFileSync(toolFilePath, toolFilePath);
};

export const getLocalScripts = (
  appId: string,
  appVersion: string,
  userScriptsFolder?: string
): Script[] => {
  let scriptsFolder = '';
  const regVersion = new RegExp(/(\d+)\./);

  const versionMatch = appVersion.match(regVersion);
  if (!versionMatch) {
    return [];
  }
  const [_, major] = versionMatch;


  if (os.platform() === 'win32') {
    scriptsFolder = path.join(
      'C:\\Program Files\\Adobe',
      `Adobe After Effects 20${major}`,
      'Support Files',
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

  if (!fs.existsSync(scriptsFolder)) {
    return [];
  }

  const localScripts = fs
    .readdirSync(scriptsFolder)
    .filter((file) => !file.startsWith('.'))
    .filter((file) => file.endsWith('.jsx') || file.endsWith('.jsxbin'))
    .map((file) => {
      const name = file.replace(/\.(jsx|jsxbin)$/, '');
      return {
        name: name,
        filepath: path.join(scriptsFolder, file),
        filename: file
      };
    });

  let userScripts: Script[] = [];
  if (userScriptsFolder) {
    userScripts = fs
      .readdirSync(userScriptsFolder)
      .filter((file) => !file.startsWith('.'))
      .filter((file) => file.endsWith('.jsx') || file.endsWith('.jsxbin'))
      .map((file) => {
        const name = file.replace(/\.(jsx|jsxbin)$/, '');
        return {
          name: name,
          filepath: path.join(userScriptsFolder, file),
          filename: file
        };
      });
  }

  return [...localScripts, ...userScripts].sort((a: Script, b: Script) => a.name.localeCompare(b.name));
};

export const getProjectScripts = async (appId: string, projectPath: string): Promise<Script[]> => {
  try {
    let scriptsFolder = PROJECT_SCRIPTS_FOLDER(projectPath);
    console.log("project scripts Folder", scriptsFolder);
    if (!fs.existsSync(scriptsFolder)) {
      console.log('Project scripts folder not found');
      return [];
    }

    return fs
      .readdirSync(scriptsFolder)
      .filter((file) => !file.startsWith('.'))
      .filter((file) => file.endsWith('.jsx') || file.endsWith('.jsxbin'))
      .map((file) => {
        const name = file.replace(/\.(jsx|jsxbin)$/, '');
        return {
          name: name,
          filepath: path.join(scriptsFolder, file),
          filename: file
        };
      });
  } catch (e) {
    console.error('Error getting project scripts', e);
    return [];
  }
};


export interface CommonSharedFile {
  name: string;
  path: string;
}
export const getProjectCommonFiles = (appId: string, projectPath: string): CommonSharedFile[] => {
  console.log(appId, projectPath);
  let commonFolder = PROJECT_COMMON_AE_FOLDER(projectPath);
  console.log("common scripts folder", commonFolder);
  if (!fs.existsSync(commonFolder)) {
    console.log('Project scripts folder not found');
    return [];
  }

  return fs
    .readdirSync(commonFolder)
    .filter((file) => !file.startsWith('.'))
    .filter((file) => file.endsWith('.aep'))
    .map((file) => {
      const name = file.replace(/\.(aep)$/, '');
      return {
        name: name,
        path: path.join(commonFolder, file),
      };
    });
};
