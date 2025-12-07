import { rename } from 'fs';
import { fs, path, os, child_process, zlib } from '@/lib/cep/node';
import { DOMParser } from 'xmldom';
import { preferencesDir } from './preferences';
import { execSync } from 'child_process';
import { logModule } from '@/lib/logger';

const { exec } = child_process;
const log = logModule('buck-library');
const macPrefixes = ['buck', 'System/Volumes/Data/buck', 'Volumes'];


export const SHARED_FOLDER = (): string => {
  const prefix = os.platform() === 'win32' ? '\\\\' : '/';
  log.debug('Resolving shared folder', { platform: os.platform(), prefix });
  if (os.platform() === 'win32') {
    const winSharedFolder = path.join(`${prefix}buck`, 'globalprefs', 'SHARED');
    log.debug('Windows shared folder', { path: winSharedFolder, exists: fs.existsSync(winSharedFolder) });
    // Check if the shared folder exists in the expected location
    if (fs.existsSync(winSharedFolder)) return winSharedFolder;
    return "";
  }
  else if (os.platform() === 'darwin') {
    for (const macPrefix of macPrefixes) {
      const macSharedFolder = path.join(`${prefix}${macPrefix}`, 'globalprefs', 'SHARED');
      if (fs.existsSync(macSharedFolder)) return macSharedFolder;
    }
    return "";
  }

  return "";
};

export const getProjectTemplate = (appId: string, templateName: string) => {
  let appName = 'AFTER_EFFECTS';
  let extensiom = '.aep';
  if (appId == 'PPRO') {
    appName = 'PREMIERE';
    extensiom = '.prproj';
  }
  return path.join(
    SHARED_FOLDER(),
    appName,
    'templates',
    `default${templateName}Template${extensiom}`
  );
};

const extractVersion = (filepath: string): { major: number, minor: number, micro: number } | null => {
  // Regular expression to match version pattern in the format x.y.z
  const versionRegex = /\.(\d+)\.(\d+)\.(\d+)\./;
  const match = filepath.match(versionRegex);

  if (match && match.length === 4) {
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      micro: parseInt(match[3], 10)
    };
  }

  return null;
}

const compareVersions = (
  a: { major: number, minor: number, micro: number },
  b: { major: number, minor: number, micro: number }
): number => {
  if (a.major !== b.major) {
    return a.major - b.major;
  }
  if (a.minor !== b.minor) {
    return a.minor - b.minor;
  }
  return a.micro - b.micro;
}


const getLocalVersion = () => {
  const manifestPath = path.join(__dirname, 'CSXS', 'manifest.xml');
  const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
  const doc = new DOMParser().parseFromString(manifestContent, 'text/xml');
  const extension = doc.getElementsByTagName('Extension')[0];
  if (!extension) {
    throw new Error('No <Extension> tag found in manifest.xml');
  }

  const version = extension.getAttribute('Version');
  if (!version) {
    throw new Error('No Version attribute found in <Extension>');
  }

  return parseLocalVersion(version);
}

const parseLocalVersion = (version: string): { major: number, minor: number, micro: number } | null => {
  const versionRegex = /(\d+)\.(\d+)\.(\d+)/;
  const match = version.match(versionRegex);

  if (match && match.length === 4) {
    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      micro: parseInt(match[3], 10)
    };
  }

  return null;
}



export const checkForUpdate = async (extensionVersion: string) => {

  const versionsFolder = path.join(SHARED_FOLDER(), 'PREMIERE', 'buck-tools');
  const versionFiles = fs.readdirSync(versionsFolder)
    .filter((f) => f.endsWith('.zxp'))
    .filter((f) => !f.startsWith('.'));
  const remoteVersions = versionFiles
    .map((v) => {
      const version = extractVersion(path.join(versionsFolder, v));
      return version ? { version, path: path.join(versionsFolder, v) } : null;
    })
    .filter((v): v is { version: { major: number; minor: number; micro: number }; path: string } => v !== null);

  log.debug('Checking for updates', {
    remoteVersionCount: remoteVersions.length,
    latestRemote: remoteVersions[remoteVersions.length - 1]?.version
  });
  const localVersion = getLocalVersion();
  log.debug('Local version', { version: localVersion });
  if (!localVersion) return null;
  const latestVersion = remoteVersions.sort((a, b) => {
    return compareVersions(a.version, b.version);
  }).pop();

  if (!latestVersion) return null;

  if (compareVersions(localVersion, latestVersion.version) >= 0) return null;

  return latestVersion;
}

export const installFromLocalFilepath = async (filepath: string) => {
  const zipPath = filepath; // local file path
  const panelPath = __dirname;
  return new Promise((resolve, reject) => {

    let command = 'unzip';
    if (os.platform() === 'darwin') {
      command = `unzip -o "${zipPath}" -d "${panelPath}"`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          log.error('Unzip failed', error, { zipPath, panelPath });
          reject(false);
        } else {
          log.debug('Unzip completed', { panelPath }, stdout);
          log.info('New version installed successfully', { panelPath });
          resolve(true);
        }
      });
    } else if (os.platform() === 'win32') {
      log.debug('Installing on Windows', { zipPath });
      const panelName = path.basename(zipPath);
      const tempZip = path.join(preferencesDir, panelName.replace('.zxp', '.zip'));
      if (!fs.existsSync(zipPath)) {
        log.error('File does not exist', new Error('File not found'), { zipPath });
        return reject(false);
      }
      fs.copyFileSync(zipPath, tempZip);
      if (!fs.existsSync(tempZip)) {
        log.error('Failed to copy file', new Error('Copy failed'), { from: zipPath, to: tempZip });
        return reject(false);
      }
      log.debug('Temporary zip created', { tempZip });
      command = `powershell -Command "Expand-Archive -Path '${tempZip}' -DestinationPath '${panelPath}' -Force"`;
      exec(command, (error, stdout, stderr) => {
        if (error) {
          log.error('Unzip failed', error, { tempZip, panelPath });
          reject(false);
        }
        log.debug('Unzip completed');
        try {
          fs.unlink(tempZip, (err) => {
            if (err) log.warn('Failed to delete temp zip', { error: err, tempZip });
            else log.debug('Temp zip deleted', { tempZip });
          });
        } catch (err) {
          log.warn('Failed to delete temp zip', { error: err, tempZip });
        }
        log.info('New version installed successfully', { panelPath });
        resolve(true);
      });
    }
    log.debug('Running update unzip', { platform: os.platform() });


  });
}