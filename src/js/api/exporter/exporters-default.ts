import { type Exporter } from './exporter';
export const aeDefaultExportPresets: Exporter[] = [
  {
    name: 'Buck Legacy',
    previewPath: '{shot}/render/comp/{shot}_{version}.{ext}',
    description:
      'This can be used for Buck Legacy folder structure. The root folder should be the Production folder.',
    relativePath: false,
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
                    name: '{shot}_comp_{version}.{ext}',
                    path: '{shot}/render/comp/{shot}_comp_{version}.{ext}',
                    isEditing: false,
                    parentId: 'buck-legacy-render-comp',
                    outputModule: 'BUCK | Prores 422hq',
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
    name: 'Buck 5 Shot Default',
    previewPath: '{shot}/{task}/{app}/render/{shot}_{task}_{version}.{ext}',
    description:
      'The root folder should be a sequence folder inside production/shots',
    relativePath: false,
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
            name: '{task}',
            path: '{shot}/{task}',
            isEditing: false,
            expanded: true,
            parentId: 'buck-5-default-shot',
            children: [
              {
                id: 'buck-5-default-sequence-task',
                type: 'folder',
                name: '{app}',
                path: '{shot}/{task}/{app}',
                isEditing: false,
                parentId: 'buck-5-default-sequence',
                children: [
                  {
                    id: 'buck-5-default-sequence-task-app',
                    type: 'folder',
                    name: 'render',
                    path: '{shot}/{task}/{app}/render',
                    isEditing: false,
                    parentId: 'buck-5-default-sequence-task',
                    children: [
                      {
                        id: 's1pn8xlc',
                        type: 'file',
                        name: '{shot}_{task}_{version}.{ext}',
                        isEditing: false,
                        path: '{shot}/{task}/{app}/render/{shot}_{task}_{version}.{ext}',
                        outputModule: 'BUCK | Prores 422hq',
                        parentId: 'buck-5-default-sequence-task-app',
                        children: [],
                      },
                    ],
                    expanded: true,
                  },
                ],
                expanded: true,
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

export const pproDefaultExportPresets: Exporter[] = [
  {
    name: 'Buck Legacy',
    previewPath: '{shot}/render/comp/{shot}_{version}.{ext}',
    description:
      'This can be used for Buck Legacy folder structure. The root folder should be the Production folder.',
    relativePath: false,
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
                    name: '{shot}_comp_{version}.{ext}',
                    path: '{shot}/render/comp/{shot}_comp_{version}.{ext}',
                    isEditing: false,
                    parentId: 'buck-legacy-render-comp',
                    outputModule: 'BUCK_Prores422HQ.epr',
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
    name: 'Buck 5 Shot Default',
    previewPath: '{shot}/{task}/{app}/render/{shot}_{task}_{version}.{ext}',
    description:
      'The root folder should be a sequence folder inside production/shots',
    relativePath: false,
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
            name: '{task}',
            path: '{shot}/{task}',
            isEditing: false,
            expanded: true,
            parentId: 'buck-5-default-shot',
            children: [
              {
                id: 'buck-5-default-sequence-task',
                type: 'folder',
                name: '{app}',
                path: '{shot}/{task}/{app}',
                isEditing: false,
                parentId: 'buck-5-default-sequence',
                children: [
                  {
                    id: 'buck-5-default-sequence-task-app',
                    type: 'folder',
                    name: 'render',
                    path: '{shot}/{task}/{app}/render',
                    isEditing: false,
                    parentId: 'buck-5-default-sequence-task',
                    children: [
                      {
                        id: 's1pn8xlc',
                        type: 'file',
                        name: '{shot}_{task}_{version}.{ext}',
                        isEditing: false,
                        path: '{shot}/{task}/{app}/render/{shot}_{task}_{version}.{ext}',
                        outputModule: 'BUCK_Prores422HQ',
                        parentId: 'buck-5-default-sequence-task-app',
                        children: [],
                      },
                    ],
                    expanded: true,
                  },
                ],
                expanded: true,
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
