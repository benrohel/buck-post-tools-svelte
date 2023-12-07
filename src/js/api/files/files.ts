import { fs, path } from "../../lib/cep/node";

export const GetFileVersions = (
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
    console.log(v);
    const match = v.match(versionRegex);
    return {
      filepath: path.join(dir, v),
      version: match ? match[2] : null,
      name: match ? match[1] : null,
    };
  });
  return versionsMapped;
};

//regex to match the version number in a filename before the extension
