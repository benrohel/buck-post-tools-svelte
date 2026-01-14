import { child_process, os } from '@/lib/cep/node';
const { execSync } = child_process;

export function getEnv(name: string, fallback = null) {
  const macCmd = `zsh -lic 'node -p "process.env.${name}"'`;
  const winCmd = `cmd.exe /c echo %${name}%`;
  let out = execSync(macCmd, { encoding: 'utf8' });

  if (os.platform() === 'win32') {
    out = execSync(winCmd, { encoding: 'utf8' });
  }
  return out.trimEnd() ?? fallback;
}
