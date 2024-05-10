import { child_process } from "../cep/node";
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
