import { fs, path, os, child_process } from '../lib/cep/node';
import { DOMParser } from 'xmldom';
const { exec } = child_process;
const macPrefixes = ['buck', 'System/Volumes/Data/buck', 'Volumes'];


export const SHARED_FOLDER = () :string=> {
  const prefix = os.platform() === 'win32' ? '\\\\' : '/';
  console.log("SHARED_FOLDER prefix", prefix);
  if(os.platform() === 'win32') {
    const winSharedFolder = path.join(`${prefix}buck`, 'globalprefs', 'SHARED');
    console.log("winSharedFolder", winSharedFolder);
    // Check if the shared folder exists in the expected location
    if(fs.existsSync(winSharedFolder)) return winSharedFolder;
    return "";
  }
  else if(os.platform() === 'darwin') {
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
  const manifestPath = path.join(__dirname, 'CSXS','manifest.xml');
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
 
  const versionsFolder = path.join(SHARED_FOLDER(), 'PREMIERE','buck-tools');
  const versionFiles = fs.readdirSync(versionsFolder)
    .filter((f) => f.endsWith('.zxp'))
    .filter((f) => !f.startsWith('.'));
  const remoteVersions = versionFiles.map((v) =>{
    const version = extractVersion(path.join(versionsFolder, v));
    return {version, path: path.join(versionsFolder, v)};
  });

  console.log("remoteVersions", remoteVersions);
  const localVersion = getLocalVersion();
  console.log("localVersion", localVersion);
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

  let command = 'unzip';
  if(os.platform() === 'darwin') {
    command = `unzip -o "${zipPath}" -d "${panelPath}"`
  }else if(os.platform() === 'win32') {
    command = `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${panelPath}' -Force"`;
  }
  console.log("Running update unzip...");

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Unzip failed: ${error.message}`);
        return reject(error);
      }
      console.log("Unzip completed.");
      console.log(stdout);
      console.log(`New version installed successfully to ${panelPath}`);
      resolve(true);
    });
  });
}