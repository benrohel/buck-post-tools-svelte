import { match } from 'assert';
import { fs, path } from '../../lib/cep/node';

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
  for (const file of readAllFiles(path.dirname(dir))) {
    const matchExt = path.extname(file) === `.${ext}`;
    const matchSuffix = matchRegex.exec(path.basename(file))?.groups;
    if (matchSuffix === undefined) continue;
    const { suffix } = matchSuffix;
    const targeteFolderStructure = file.split(/_v\d+/)[0];
    if (
      matchExt &&
      suffix === sourceSuffix &&
      targeteFolderStructure === sourceFolderStructure
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
    const variation = name
      ? name.toLowerCase().replace(shotName.toLowerCase(), '').replace('_', '')
      : null;
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
    if (file.startsWith(baseName)) {
      return path.join(dir, file);
    }
  }

  return null;
};
