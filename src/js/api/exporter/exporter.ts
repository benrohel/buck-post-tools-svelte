import { fs, path } from '@/lib/cep/node';
import { evalES } from '@/lib/utils/bolt';
import { logModule } from '@/lib/logger';
import { format } from 'path';

const log = logModule('exporter');
export interface CompRenderData {
  compName: string;
  nodeId: number;
  projectName: string;
  projectVersion: string;
}

interface IRenderWithTokensOptions {
  compId: number;
  filepath: string;
  presetName: string;
}

export interface PathItem {
  id: string;
  type: 'folder' | 'file';
  path: string;
  name: string;
  isEditing?: boolean;
  outputModule?: string;
  children?: PathItem[];
  expanded?: boolean;
  parentId?: string | null;
  metadata?: {
    isSequence?: boolean;
    frameRange?: [number, number];
    frameCount?: number;
    frames?: number[];
    pattern?: string;
    files?: string[];
    [key: string]: any;
  };
}

export interface Exporter {
  name: string;
  previewPath: string;
  path: PathItem[];
  relativePath: boolean;
  description?: string;
  rootFolder?: string;
  latestVersion?: number;
}
export const buildRenderPath = (
  compData: CompRenderData,
  appId: string,
  rootFolder: string,
  previewString: string,
  selectedTask: string,
  version: number,

) => {

  log.debug("buildRenderPath", { compData, appId, rootFolder, previewString, selectedTask, version });

  let projectVersionString = compData.projectVersion
    ? 'v' + compData.projectVersion.padStart(3, '0')
    : 'v001';

  let dataString = previewString;
  let frameString = previewString.match(/#{1,}/g);
  let numberOfFrames = frameString ? frameString[0].length : 4;

  switch (appId) {
    case 'AEFT':
      dataString = previewString
        .replace(/{projectName}/g, compData.projectName)
        .replace(/{projectVersion}/g, projectVersionString)
        .replace(/{projectName}/g, compData.projectName.replace(/_ \d+/, ''))
        .replace(/{sequence}/g, 'sequence')
        .replace(/{shot}/g, compData.compName)
        .replace(/{shot}/g, compData.compName)
        .replace(/{task}/g, selectedTask ?? '')
        .replace(/{version}/g, `v${version.toString().padStart(3, '0')}`)
        .replace(/{app}/, 'ae')
        .replace(/#{1,}/g, '')
        .replace(/\.{ext}/g, '');
      break;
    case 'PPRO':
      dataString = previewString
        .replace(/{projectName}/g, compData.projectName.replace(/_ \d+/, ''))
        .replace(/{sequence}/g, 'sequence')
        .replace(/{shot}/g, compData.compName)
        .replace(/{shot}/g, compData.compName)
        .replace(/{task}/g, selectedTask ?? '')
        .replace(/{app}/, 'ppro')
        .replace(/{projectVersion}/g, projectVersionString)
        .replace(/{version}/g, `v${version.toString().padStart(3, '0')}`)
        .replace(/frameNumber}/g, '#'.padStart(numberOfFrames, '#'))
        .replace(/\.{ext}/g, '');
      break;
  }


  if (dataString.includes(rootFolder)) {
    return dataString;
  }
  return path.join(rootFolder, dataString);
  // return dataString;
};

export interface IAddToRenderQueueOptions {
  rootFolder: string;
  outputModules: { outputModuleName: string; outputModuleFilePath: string }[];
  appId: string;
  version?: number;
  selectedTask?: string;
}
export const addToRenderQueue = async (
  comp: CompRenderData,
  options: IAddToRenderQueueOptions
) => {
  // Build the render paths for each output module
  log.debug('Adding composition to render queue', {
    compName: comp.compName,
    outputModuleCount: options.outputModules.length
  }, { comp, options });

  const outputOptions = options.outputModules.map((outputModule) => {
    const renderPath = buildRenderPath(
      comp,
      options.appId,
      options.rootFolder,
      outputModule.outputModuleFilePath,
      options.selectedTask ?? '',
      options.version ?? 1
    );
    return {
      outputModuleName: outputModule.outputModuleName,
      outputModuleFilePath: renderPath,
    };
  });

  // Create the output folders
  outputOptions.forEach((outputOption) => {
    const dirFolder = path.dirname(outputOption.outputModuleFilePath);
    log.debug('Creating output folder', { dirFolder });
    try {
      fs.existsSync(dirFolder) || fs.mkdirSync(dirFolder, { recursive: true });
    } catch (error) {
      log.error('Failed to create output folder', error as Error);
    }
  });

  const renderOptions = {
    compId: comp.nodeId,
    outputModules: outputOptions,
  };

  await evalES(`addToRenderQueue(${JSON.stringify(renderOptions)})`, false);
};

export const addCompsToRenderQueue = async (
  options: IAddToRenderQueueOptions
) => {
  const comps = JSON.parse(await evalES('getSelectedCompsForRender()'))
    .comps as CompRenderData[];

  comps.forEach((comp: CompRenderData) => {
    addToRenderQueue(comp, options);
  });
};
