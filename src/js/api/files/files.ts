import { fs, path } from "../../lib/cep/node";

export const GetSystemFileVersionsWithShotName = (
  filepath: string,
  shotName: string
): Array<any> => {
  const versionRegex = /(\w+)_(v\w+|v\d+)(.)/i;
  const dir = path.dirname(filepath);
  const versions = fs.readdirSync(dir);

  // regex to match the file extension
  const extRegex = /\.(\w+)$/i;
  const extMatch = filepath.match(extRegex);
  const ext = extMatch ? extMatch[1] : null;

  const shotVersions = versions.filter((v) => {
    return (
      path.basename(v.toLowerCase()).match(shotName.toLowerCase()) &&
      path.extname(v) === `.${ext}`
    );
  });

  const versionsMapped = shotVersions.map((v) => {
    const match = v.match(versionRegex);
    const version = match ? match[2] : "";
    const name = match ? match[1] : "";
    const variation = name
      ? name.toLowerCase().replace(shotName.toLowerCase(), "").replace("_", "")
      : null;
    let displayName =
      match && variation ? `${variation} | ${version}` : `${version}`;

    return {
      filepath: path.join(dir, v),
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
      ? name.toLowerCase().replace(shotName.toLowerCase(), "").replace("_", "")
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
