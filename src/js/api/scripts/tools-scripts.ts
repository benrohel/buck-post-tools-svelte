import { fs, path } from '../../lib/cep/node';

const SHARED_FOLDER = '/Volumes/GlobalPrefs/SHARED';

export const getScriptsList = () => {
  const scriptsFolder = path.join(SHARED_FOLDER, 'PREMIERE', 'scripts');
  const scripts = fs.readdirSync(scriptsFolder);
  return scripts;
};
