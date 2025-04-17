import { fs, path } from '../lib/cep/node';
import { evalES } from '../lib/utils/bolt';
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
  isEditing: boolean;
  outputModule?: string;
  children?: PathItem[];
  expanded?: boolean;
  parentId?: string | null;
}

export interface Exporter {
  name: string;
  previewPath: string;
  path: PathItem[];
  rootFolder?: string;
  latestVersion?: number;
}
export const buildRenderPath = (
  compData: CompRenderData,
  appId: string,
  rootFolder: string,
  previewString: string,
  selectedTask: string,
  version: number
) => {
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
        .replace(/{sequence}/g, 'sequence')
        .replace(/{shot}/g, compData.compName)
        .replace(/{task}/g, selectedTask ?? '')
        .replace(/{version}/g, `v${version.toString().padStart(3, '0')}`)
        .replace(/#{1,}/g, '')
        .replace(/\.{ext}/g, '');
      break;
    case 'PPRO':
      dataString = previewString
        .replace(/{projectName}/g, compData.projectName)
        .replace(/{sequence}/g, 'sequence')
        .replace(/{shot}/g, compData.compName)
        .replace(/{task}/g, selectedTask ?? '')
        .replace(/{projectVersion}/g, projectVersionString)
        .replace(/{version}/g, `v${version.toString().padStart(3, '0')}`)
        .replace(/frameNumber}/g, '#'.padStart(numberOfFrames, '#'))
        .replace(/\.{ext}/g, '');
      break;
  }

  return path.posix.join(rootFolder, dataString);
};

export interface IAddToRenderQueueOptions {
  rootFolder: string;
  presetName: string;
  previewString: string;
  appId: string;
  version?: number;
  selectedTask?: string;
}
export const addToRenderQueue = async (
  comp: CompRenderData,
  options: IAddToRenderQueueOptions
) => {
  const renderPath = buildRenderPath(
    comp,
    options.appId,
    options.rootFolder,
    options.previewString,
    options.selectedTask,
    options.version
  );
  console.log('renderPath', renderPath);
  const renderOptions = {
    compId: comp.nodeId,
    filepath: renderPath,
    presetName: options.presetName,
  };

  fs.existsSync(path.dirname(renderPath)) ||
    fs.mkdirSync(renderPath, { recursive: true });

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

export const defaultExportPresets: Exporter[] = [
  {
    name: 'Buck Legacy',
    previewPath: '{shot}/render/comp/{shot}_{version}.{ext}',
    path: [
      {
        id: 'buck-legacy-shot',
        type: 'folder',
        name: '{shot}',
        expanded: true,
        path: '{shot}',
        isEditing: false,
        parentId: null,
        children: [
          {
            id: 'buck-legacy-render',
            type: 'folder',
            name: 'Render',
            path: '{shot}/render',
            isEditing: false,
            expanded: true,
            parentId: 'buck-legacy-shot',
            children: [
              {
                id: 'buck-legacy-render-2d',
                type: 'folder',
                name: '2d',
                path: '{shot}/render/2d',
                isEditing: false,
                parentId: 'buck-legacy-render',
                children: [],
              },
              {
                id: 'buck-legacy-render-comp',
                type: 'folder',
                name: 'comp',
                path: '{shot}/render/comp',
                isEditing: false,
                parentId: 'buck-legacy-render',
                children: [
                  {
                    id: 'buck-legacy-render-comp-file',
                    type: 'file',
                    name: '{comp}_{version}.{ext}',
                    path: '{shot}/render/comp/{comp}_{version}.{ext}',
                    isEditing: false,
                    parentId: 'buck-legacy-render-comp',
                    outputModule: 'Prores 422HQ',
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: 'Buck 5 ShotDefault',
    previewPath:
      '{shot}/sequence/{task}/{app}/render/{comp}_{task}_{version}.{ext}',
    path: [
      {
        type: 'folder',
        name: '{shot}',
        path: '{shot}',
        expanded: true,
        children: [
          {
            id: 'buck-5-default-sequence',
            type: 'folder',
            name: '{sequence}',
            path: '{shot}/sequence',
            isEditing: false,
            expanded: true,
            parentId: 'buck-5-default-shot',
            children: [
              {
                id: 'buck-5-default-sequence-task',
                type: 'folder',
                name: '{task}',
                path: '{shot}/sequence/{task}',
                isEditing: false,
                parentId: 'buck-5-default-sequence',
                children: [
                  {
                    id: 'buck-5-default-sequence-task-app',
                    type: 'folder',
                    name: '{app}',
                    path: '{shot}/sequence/{task}/{app}',
                    isEditing: false,
                    parentId: 'buck-5-default-sequence-task',
                    children: [
                      {
                        id: 'buck-5-default-sequence-task-app-render',
                        type: 'folder',
                        name: 'render',
                        path: '{shot}/sequence/{task}/{app}/render',
                        isEditing: false,
                        parentId: 'buck-5-default-sequence-task-app',
                        children: [
                          {
                            id: 'buck-5-default-sequence-task-app-render-file',
                            type: 'file',
                            name: '{comp}_{task}_{version}.{ext}',
                            path: '{shot}/sequence/{task}/{app}/render/{comp}_{task}_{version}.{ext}',
                            outputModule: 'Prores 422HQ',
                            isEditing: false,
                            parentId: 'buck-5-default-sequence-task-app-render',
                            children: [],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        id: 'buck-5-default-shot',
        isEditing: false,
        parentId: null,
      },
    ],
  },
];
