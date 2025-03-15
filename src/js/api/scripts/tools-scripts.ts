import { fs, path ,os} from '../../lib/cep/node';
import { type SelectToolItem } from 'src/js/global';
const SHARED_FOLDER = '/buck/globalprefs/SHARED';
// /System/Volumes/Data/buck/globalprefs/SHARED/AFTER_EFFECTS/scripts/nuke-to-ae-tracker.1.0.0.jsx


interface Script {
  name: string;
  filepath: string;
}

export const getScriptsList = (appId:string) : Script[]=> {
  let scriptsFolder="";
  if (appId === 'AEFT') {
    scriptsFolder = path.join(SHARED_FOLDER, 'AFTER_EFFECTS', 'scripts');
  } else if (appId === 'PPRO') {
   scriptsFolder = path.join(SHARED_FOLDER, 'PREMIERE', 'scripts');
};

if(!fs.existsSync(scriptsFolder)){
  return [];
}

const scriptFiles = fs.readdirSync(scriptsFolder)
.filter((file) => !file.startsWith("."))
.filter((file) => file.endsWith('.jsx'))
.map((file) => {
  const name = file.replace('.jsx', '');
  return {
    name: name,
    filepath: path.join(scriptsFolder, file)
  }
});
return scriptFiles
}

export const installTool = (toolFilePath: string, appId:string) => {
  let scriptsFolder="";
  if (appId === 'AEFT') {
    scriptsFolder = path.join(SHARED_FOLDER, 'AFTER_EFFECTS', 'scripts');
  } else if (appId === 'PPRO') {
   scriptsFolder = path.join(SHARED_FOLDER, 'PREMIERE', 'scripts');
};

 
  fs.copyFileSync(toolFilePath, toolFilePath);
}