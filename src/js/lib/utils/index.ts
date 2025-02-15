import { evalES } from '../../lib/utils/bolt';
import { fs, path, os, child_process } from '../cep/node';
import upath from 'upath';
import { platform } from 'os';
const { exec } = child_process;

export const openFile = async (filepath: string) => {
  filepath = resolveHome(filepath);
  if (os.platform() === 'darwin') {
    const cmd = `open "${filepath}"`;
    exec(cmd);
  } else if (os.platform() === 'win32') {
    const cmd = `start  ${filepath}`;
    exec(cmd);
  }
};

export const GetFolder = async (message: string): Promise<string> => {
  const res: string = await evalES(`openFolderDialog(${message})`);
  return res;
};

export const fileExists = (filepath: string) => {
  console.log(filepath);
  try {
    if (fs.existsSync(filepath)) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const removeFile = (filepath: string) => {
  fs.unlinkSync(filepath);
};

export const resolveHome = (filepath: string): string => {
  if (filepath[0] === '~') {
    if (process.env.HOME) {
      return path.join(process.env.HOME, filepath.slice(1));
    }
  }
  return filepath;
};

export const cleanUpWorkFiles = async (workFiles: Array<string>) => {
  workFiles.forEach((f) => {
    f = resolveHome(f);
    removeFile(f);
  });
  let deleteSucces = false;

  workFiles.forEach((f) => {
    if (fs.existsSync(f)) {
      deleteSucces = false;
    }
  });
  return deleteSucces;
};

export const checkFolderLength = async (
  folderString: string,
  regSearch: RegExp
): Promise<number> => {
  folderString = resolveHome(folderString);
  const files = fs.readdirSync(folderString);
  const pngFiles = await files.filter((item: string) => {
    return item.match(regSearch);
  });
  return pngFiles.length;
};

export const asyncForEach = async function (
  array: Array<any>,
  callback: Function
) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
  return true;
};

export const pad = function (num: string, size: number) {
  var s = num + '';
  while (s.length < size) s = '0' + s;
  return s;
};

export const openUrl = (url: string) => {
  let openCmd = `open "${url}"`;

  if (process.platform == 'win32') {
    openCmd = `start "${url}"`;
  }

  exec(openCmd, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
  });
};

export const recursiveMkDir = (dir: string) => {
  if (fs.existsSync(dir)) {
    return true;
  }
  const dirname = path.dirname(dir);
  recursiveMkDir(dirname);
  fs.mkdirSync(dir);
};

export const getFsPath = (filepath: string): string => {
  if (os.platform() === 'win32') {
    return path.normalize(filepath);
  } else {
    return filepath;
  }
};

/** Dispatch event on click outside of node */
export const clickOutside = (node: any) => {
  const handleClick = (event: any) => {
    if (node && !node.contains(event.target) && !event.defaultPrevented) {
      node.dispatchEvent(new CustomEvent('click_outside', node));
    }
  };

  document.addEventListener('click', handleClick, true);

  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
    },
  };
};
