import { CEP_Config } from 'vite-cep-plugin';
import { version } from './package.json';

const config: CEP_Config = {
  version,
  id: 'co.buck-tools.cep',
  displayName: 'Buck Tools',
  symlink: 'local',
  port: 3000,
  servePort: 5000,
  startingDebugPort: 8860,
  extensionManifestVersion: 6.0,
  requiredRuntimeVersion: 11.0,
  hosts: [
    { name: 'PPRO', version: '[0.0,99.9]' },
    { name: 'AEFT', version: '[0.0,99.9]' },
  ],

  type: 'Panel',
  iconDarkNormal: './src/assets/light-icon.png',
  iconNormal: './src/assets/dark-icon.png',
  iconDarkNormalRollOver: './src/assets/light-icon.png',
  iconNormalRollOver: './src/assets/dark-icon.png',
  parameters: ['--v=0', '--enable-nodejs', '--mixed-context'],
  width: 500,
  height: 550,

  panels: [
    {
      mainPath: './main/index.html',
      name: 'main',
      panelDisplayName: 'Buck Tools',
      autoVisible: true,
      width: 600,
      height: 650,
    },
  ],
  build: {
    jsxBin: 'off',
    sourceMap: true,
  },
  zxp: {
    country: 'US',
    province: 'CA',
    org: 'MyCompany',
    password: 'mypassword',
    tsa: 'http://timestamp.digicert.com/',
    sourceMap: false,
    jsxBin: 'off',
  },
  installModules: [],
  copyAssets: [],
  copyZipAssets: [],
};
export default config;
