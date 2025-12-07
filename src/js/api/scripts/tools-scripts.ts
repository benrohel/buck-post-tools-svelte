import { fs, path, os } from '@/lib/cep/node';
import { type SelectToolItem } from 'src/js/global';
import { SHARED_FOLDER, PRODUCTION_ROOT, PROJECT_SCRIPTS_FOLDER, PROJECT_COMMON_AE_FOLDER } from '@/api/files/files';
import { platform } from 'os';
import { logModule } from '@/lib/logger';

const log = logModule('tools-scripts');

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
    log.debug('Buck scripts folder not found', { scriptsFolder, appId });
    return [];
  }

  const folderFiles = fs.readdirSync(scriptsFolder);
  log.debug('Found Buck scripts folder contents', { scriptsFolder, fileCount: folderFiles.length }, folderFiles);

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
  log.debug('Loaded Buck scripts', { scriptsFolder, scriptCount: scriptFiles.length }, scriptFiles);
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
  const scriptsFolder = PROJECT_SCRIPTS_FOLDER(projectPath);

  try {
    log.debug('Looking for project scripts', { scriptsFolder, projectPath, appId });
    if (!scriptsFolder || !fs.existsSync(scriptsFolder)) {
      log.debug('Project scripts folder not found', { scriptsFolder, projectPath });
      return [];
    }

    const scripts = fs
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

    log.debug('Loaded project scripts', { scriptsFolder, scriptCount: scripts.length }, scripts);
    return scripts;
  } catch (e) {
    log.error('Failed to get project scripts', e as Error, { scriptsFolder, projectPath, appId });
    return [];
  }
};


export interface CommonSharedFile {
  name: string;
  path: string;
}
export const getProjectCommonFiles = (appId: string, projectPath: string): CommonSharedFile[] => {
  log.debug('Getting project common files', { appId, projectPath });
  const commonFolder = PROJECT_COMMON_AE_FOLDER(projectPath);
  log.debug('Common folder path', { commonFolder });

  if (!commonFolder || !fs.existsSync(commonFolder)) {
    log.debug('Project common folder not found', { commonFolder, projectPath });
    return [];
  }

  const files = fs
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

  log.debug('Loaded project common files', { commonFolder, fileCount: files.length }, files);
  return files;
};
