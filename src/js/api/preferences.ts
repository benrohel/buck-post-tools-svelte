import { fs, path, os } from '../lib/cep/node';
import pkg from '../../../package.json';
import { Exporter } from './exporter';
import { defaultExportPresets } from './exporter/exporters-default';

export declare interface ExportNamePreset {
  name: string;
  template: string;
}

export declare interface UserPreferences {
  exportNamePresets: ExportNamePreset[];
  latestOutputPath: string;
  latestAeOutputModule: string;
  latestPproRenderPreset: string;
}

// Get the path to the user's home directory
const homeDir = os.homedir();
// Get the os-specific path to the preferences file. user AppData for windows  and Library/Application support for Mac
const preferencesRoot =
  os.platform() === 'win32'
    ? 'AppData\\Roaming'
    : 'Library/Application Support';
export const preferencesDir = path.join(homeDir, preferencesRoot, pkg.name);
const preferencesPath = path.join(preferencesDir, 'preferences.json');




/**
 * Reads the user's preferences from disk.
 * @returns the user's preferences. If the file does not exist, this method will throw an error.
 * @throws if the file does not exist or could not be read.
 */
export const getPreferences = async (): Promise<UserPreferences> => {
  try {
    if (!fs.existsSync(preferencesPath)) {
      fs.mkdirSync(path.dirname(preferencesPath), { recursive: true });
      fs.writeFileSync(preferencesPath, '{}', 'utf-8');
      return {
        exportNamePresets: [],
        latestOutputPath: '',
        latestAeOutputModule: '',
        latestPproRenderPreset: '',
      };
    }
    return JSON.parse(fs.readFileSync(preferencesPath, 'utf-8'));
  } catch (e) {
    console.error('Failed to read preferences', e);
    throw e;
  }
};

/**
 * Gets a preference by key.
 * @param key the key of the preference to get.
 * @returns the value of the preference, or undefined if the preference does not exist.
export const getPreferenceByKey = async (key: keyof UserPreferences) => {
  const preferences = await getPreferences();
  return preferences[key];
};
    */
export const getPreferenceByKey = async (key: keyof UserPreferences) => {
  const preferences = await getPreferences();
  return preferences[key];
};
/**
 * Writes the given preferences to the user's preferences file.
 * @param preferences the preferences to write. Should be an object with
 * the same shape as the preferences returned by {@link getPreferences}.
 * @throws if the preferences cannot be written.
 */
export const setPreferences = async (preferences: any) => {
  if (!fs.existsSync(preferencesPath)) {
    fs.mkdirSync(path.dirname(preferencesPath), { recursive: true });
  }
  try {
    fs.writeFileSync(
      preferencesPath,
      JSON.stringify(preferences, null, 2),
      'utf-8'
    );
  } catch (e) {
    console.error('Failed to write preferences', e);
    throw e;
  }
};

export const setPreferenceByKey = async (
  key: keyof UserPreferences,
  value: any
) => {
  const preferences = await getPreferences();
  preferences[key] = value;
  await setPreferences(preferences);
};

export const getExporterPresets = async (
  appId: 'AEFT' | 'PPRO'
): Promise<Exporter[]> => {
  try {
    const exportPresetsPath = path.join(
      preferencesDir,
      `exportPresets-${appId.toLowerCase()}.json`
    );
    if (!fs.existsSync(exportPresetsPath)) {
      fs.mkdirSync(path.dirname(exportPresetsPath), { recursive: true });
      fs.writeFileSync(
        exportPresetsPath,
        JSON.stringify(defaultExportPresets),
        'utf-8'
      );
      return defaultExportPresets;
    }
    return JSON.parse(fs.readFileSync(exportPresetsPath, 'utf-8'));
  } catch (e) {
    console.error('Failed to read preferences', e);
    throw e;
  }
};

export const setExporterPresets = async (
  appId: 'AEFT' | 'PPRO',
  exportPresets: Exporter[]
) => {
  const exportPresetsPath = path.join(
    preferencesDir,
    `exportPresets-${appId}.json`
  );
  if (!fs.existsSync(exportPresetsPath)) {
    fs.mkdirSync(path.dirname(exportPresetsPath), { recursive: true });
  }
  try {
    fs.writeFileSync(
      exportPresetsPath,
      JSON.stringify(exportPresets, null, 2),
      'utf-8'
    );
    return true;
  } catch (e) {
    console.error('Failed to write preferences', e);
    throw e;
  }
};

interface ShotHistory {
  shotName: string;
  versions: string[];
}

interface History {
  [key: string]: ShotHistory[];
}

export const getShotsHistory = async () => {
  const historyFile = path.join(preferencesDir, 'shots-history.json');
  if (!fs.existsSync(historyFile)) {
    fs.mkdirSync(path.dirname(historyFile), { recursive: true });
    fs.writeFileSync(historyFile, '[]', 'utf-8');
    return [];
  }
  return JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
};

export const setShotsHistory = async (shotsProjectHistory: any) => {
  const historyFile = path.join(preferencesDir, 'shots-history.json');
  if (!fs.existsSync(historyFile)) {
    fs.mkdirSync(path.dirname(historyFile), { recursive: true });
  }
  try {
    fs.writeFileSync(historyFile, JSON.stringify(shotsProjectHistory, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Failed to write preferences', e);
    throw e;
  }
};


