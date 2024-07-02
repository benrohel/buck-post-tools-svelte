import { child_process, os, path } from "../cep/node";
const { exec } = child_process;

export const openUrl = (url: string) => {
  let openCmd = `open "${url}"`;

  if (process.platform == "win32") {
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

const resolveHome = (filepath: string) => {
  if (filepath[0] === "~") {
    if (process.env.HOME) {
      return path.join(process.env.HOME, filepath.slice(1));
    }
  }
  return filepath;
};

export const openFile = async (filepath: string) => {
  filepath = resolveHome(filepath);
  if (os.platform() === "darwin") {
    const cmd = `open "${filepath}"`;
    exec(cmd);
  } else if (os.platform() === "win32") {
    const cmd = `start  ${filepath}`;
    exec(cmd);
  }
};
