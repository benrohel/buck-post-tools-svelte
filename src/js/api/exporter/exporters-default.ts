import { type Exporter } from './exporter';
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
                    name: '{shot}_{version}.{ext}',
                    path: '{shot}/render/comp/{shot}_{version}.{ext}',
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
    previewPath:
      '{shot}/sequence/{task}/{app}/render/{shot}_{task}_{version}.{ext}',
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
                            name: '{shot}_{task}_{version}.{ext}',
                            path: '{shot}/sequence/{task}/{app}/render/{shot}_{task}_{version}.{ext}',
                            outputModule: 'BUCK | Prores 422hq',
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
