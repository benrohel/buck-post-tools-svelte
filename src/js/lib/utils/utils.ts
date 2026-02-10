import { child_process, os, path } from '@/lib/cep/node';
import { logModule } from '@/lib/logger';

const { exec } = child_process;
const log = logModule('utils');

export const openUrl = (url: string) => {
  let openCmd = `open "${url}"`;

  if (process.platform == 'win32') {
    openCmd = `start "${url}"`;
  }

  exec(openCmd, (error, stdout, stderr) => {
    if (error) {
      log.error('Failed to open URL', error, { url, command: openCmd });
      return;
    }
    if (stderr) {
      log.warn('URL open command stderr', { stderr, url, command: openCmd });
      return;
    }
    log.debug('URL opened successfully', { stdout, url, command: openCmd });
  });
};

const resolveHome = (filepath: string) => {
  if (filepath[0] === '~') {
    if (process.env.HOME) {
      return path.join(process.env.HOME, filepath.slice(1));
    }
  }
  return filepath;
};

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

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

export const copyToClipboard = (text: string) => {

  if (os.platform() === 'darwin') {
    const { exec } = require("child_process");
    const escaped = text.replace(/'/g, "'\\''"); // Escape single quotes
    exec(`echo '${escaped}' | pbcopy`);

  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";  // Prevent scrolling
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}