export const appVersion = () => {
  return app.version;
};

export const selectFolder = (
  msg: string = 'Select a Folder'
): string | false => {
  const folder = Folder.selectDialog(msg);
  // alert(file.fsName);
  if (folder.exists) {
    return JSON.stringify({ fsName: folder.fsName, absoluteURI: folder.absoluteURI });
  }
  return false;
};

export const padStart = (str: string, paddingValue: string) => {
  return String(paddingValue + str).slice(-paddingValue.length);
};

export const forEachLayer = (
  comp: CompItem,
  callback: (item: Layer, index: number) => void
) => {
  const len = comp.numLayers;
  for (let i = 1; i < len + 1; i++) {
    callback(comp.layers[i], i);
  }
};

export const compFromFootage = (item: FootageItem): CompItem => {
  return app.project.items.addComp(
    item.name,
    item.width,
    item.height,
    item.pixelAspect,
    item.duration,
    item.frameRate
  );
};

export const getProjectDir = () => {
  app.project.file;
  if (app.project.file !== null) {
    //@ts-ignore
    return app.project.file.parent.absoluteURI;
  } else {
    return '';
  }
};

export const getActiveComp = () => {
  if (app.project.activeItem instanceof CompItem === false) {
    app.activeViewer?.setActive();
  }
  return app.project.activeItem as CompItem;
};

// Metadata helpers

export const setAeMetadata = (propName: string, propValue: any) => {
  if (ExternalObject.AdobeXMPScript === undefined) {
    ExternalObject.AdobeXMPScript = new ExternalObject('lib:AdobeXMPScript');
  }
  if (!app.project || !ExternalObject.AdobeXMPScript || !XMPMeta) return;
  const prefix = 'xmp:';
  const uri = XMPMeta.getNamespaceURI(prefix);
  const newPropName = prefix + propName;
  let metadata = new XMPMeta(app.project.xmpPacket);
  metadata.setProperty(uri, newPropName, propValue.toString());
  app.project.xmpPacket = metadata.serialize();
};

export const getAeMetadata = (propName: string) => {
  if (ExternalObject.AdobeXMPScript === undefined) {
    ExternalObject.AdobeXMPScript = new ExternalObject('lib:AdobeXMPScript');
  }
  if (!app.project || !ExternalObject.AdobeXMPScript || !XMPMeta) return;
  const prefix = 'xmp:';
  const uri = XMPMeta.getNamespaceURI(prefix);
  const newPropName = prefix + propName;
  const metadata = new XMPMeta(app.project.xmpPacket);
  return metadata.getProperty(uri, newPropName);
};

export const findCompByName = (name: string) => {
  const items = app.project.items;
  for (var i = 1; i <= items.length; i++) {
    var currentItem = items[i];
    if (currentItem.name === name) {
      return currentItem as CompItem;
    }
  }
  return null;
};

export interface ICompRenderData {
  compName: string;
  nodeId: number;
  projectName: string;
  projectVersion: number;
}

export const getSelectedCompsForRender = () => {
  var comps = [];
  var selection = app.project.selection;
  if (selection.length === 0) {
    alert('No compositions selected');
    return null;
  }
  for (var i = 0; i < selection.length; i++) {
    var comp = selection[i];
    if (comp instanceof CompItem) {
      comps.push({
        compName: comp.name,
        nodeId: comp.id,
        projectName: app.project.file?.displayName.split('.')[0] ?? '',
        projectVersion:
          app.project.file?.displayName.match(/_v(\d+)/)?.[1] ?? 0,
      });
    }
  }
  return JSON.stringify({ comps: comps } as { comps: ICompRenderData[] });
};

export const findFolderByName = (name: string) => {
  const items = app.project.items;
  for (var i = 1; i <= items.length; i++) {
    var currentItem = items[i];
    if (currentItem.name === name && currentItem instanceof FolderItem) {
      return currentItem as FolderItem;
    }
  }
  return null;
};

export const getOutputModulesTemplates = () => {
  var comp = app.project.items.addComp('tempComp', 1920, 1080, 1, 1, 24);
  var rq = app.project.renderQueue;
  var rqItems = rq.items;
  var tempRqItem = rqItems.add(comp);
  var templates = tempRqItem.outputModule(1).templates;
  tempRqItem.remove();
  comp.remove();
  return JSON.stringify(templates);
};

export const getTokens = () => {
  let projectName = '',
    projectVersion = 0,
    compName = '';
  const projectFile = app.project.file;
  if (projectFile === null) {
    alert('Please save your project before using this script');
  }
  projectName = projectFile?.displayName ?? ('' as string);
  const versionRegex = /_v(\d+)/;
  const versionMatch = projectName.match(versionRegex);
  if (versionMatch === null) {
    projectVersion = 0;
  } else {
    projectVersion = parseInt(versionMatch[1]);
  }

  return JSON.stringify({
    projectName: projectName,
    projectVersion: projectVersion,
    compName: app.project.activeItem?.name ?? ('' as string),
  });
};

export const getToken = (token: string, comp: CompItem) => {
  switch (token) {
    case 'projectVersion':
      return app.project.file?.displayName.match(/_v(\d+)/)?.[1] ?? 0;
    case 'projectName':
      return app.project.file?.displayName.split('.')[0] ?? '';
    case 'compName':
      return comp.name;
    case 'frameNumber':
      return '[.####]';
    case '/':
      return '/';
    default:
      return '';
  }
};

export const getProjectFile = () => {
  if (app.project && app.project.file === null) {
    return null;
  }
  return app.project.file;
};

// Function to import a project, scan render queue items, and save output modules as templates
export const importProjectAndSaveOutputModules = (projectFilePath: string) => {
  app.beginUndoGroup('Import and Save Output Modules');
  // Store current project to reopen later if needed
  var currentProject = app.project;
  var currentProjectFile = app.project.file;
  var reopenCurrentProject = true;

  // If there's an open project with unsaved changes, ask before closing
  // @ts-ignore
  if (currentProject && app.project.dirty) {
    reopenCurrentProject = confirm(
      'Current project has unsaved changes. Save it before proceeding?'
    );
    if (reopenCurrentProject) {
      currentProject.save();
    }
  }

  // Try to import the specified project
  var projectFile = new File(projectFilePath);
  if (!projectFile.exists) {
    alert('Project file does not exist: ' + projectFilePath);
    return false;
  }

  //function to loop through existing templaters and check if a template with the same name exists

  try {
    // Open the specified project
    app.open(projectFile);
    // Array to store template names we've saved to avoid duplicates
    var savedTemplates: string[] = [];
    var newTemplates: string[] = [];
    // Process all render queue items

    const checkTemplateExists = (templateName: string) => {
      for (let i = 1; i <= savedTemplates.length; i++) {
        if (savedTemplates[i] === templateName) {
          return true;
        }
      }
      return false;
    };

    for (var i = 1; i <= app.project.renderQueue.numItems; i++) {
      var renderItem = app.project.renderQueue.item(i);
      if (i === 1) {
        savedTemplates = renderItem.outputModule(1).templates;
      }

      // Check if this render queue item has output modules
      if (renderItem.numOutputModules > 0) {
        // Process each output module for this render queue item
        for (var j = 1; j <= renderItem.numOutputModules; j++) {
          var outputModule = renderItem.outputModule(j);

          try {
            // Generate a template name based on project and comp
            var templateName = outputModule.name;

            if (!checkTemplateExists(templateName)) {
              outputModule.saveAsTemplate(templateName);
              savedTemplates.push(templateName);
              newTemplates.push(templateName);
            }

            // Save the output module settings as a template
          } catch (e: any) {
            alert(
              'Error saving output module ' +
              j +
              ' from item ' +
              i +
              ': ' +
              e.toString()
            );
          }
        }
      }
    }

    alert('Successfully saved ' + newTemplates.length + ' output modules.');

    // Close the imported project
    app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);

    // Reopen the original project if needed
    if (reopenCurrentProject && currentProjectFile) {
      app.open(currentProjectFile);
    }

    app.endUndoGroup();
    return true;
  } catch (e: any) {
    app.endUndoGroup();
    alert('Error processing project: ' + e.toString());
    return false;
  }
};

declare interface ProjectSettings {
  bitsPerChannel: number;
  compensateForSceneReferredProfiles: boolean;
  workingSpace: string;
  workingGamma: 2.2 | 2.4;
  linearizeWorkingSpace: boolean;
  linearBlending: boolean;
}

export const getProjectSettings = () => {
  var project = app.project;
  var projectSettings = {
    bitsPerChannel: project.bitsPerChannel,
    compensateForSceneReferredProfiles:
      project.compensateForSceneReferredProfiles,
    workingSpace: project.workingSpace,
    workingGamma: project.workingGamma,
    linearizeWorkingSpace: project.linearizeWorkingSpace,
    linearBlending: project.linearBlending,
  };
  return JSON.stringify(projectSettings);
};

export const setProjectSettings = (projectSettings: ProjectSettings) => {
  var project = app.project;
  project.bitsPerChannel = projectSettings.bitsPerChannel;
  project.workingGamma = projectSettings.workingGamma;
  project.workingSpace = projectSettings.workingSpace;
  project.compensateForSceneReferredProfiles =
    projectSettings.compensateForSceneReferredProfiles;
  project.linearizeWorkingSpace = projectSettings.linearizeWorkingSpace;
  project.linearBlending = projectSettings.linearBlending;
  if (
    project.bitsPerChannel === projectSettings.bitsPerChannel &&
    project.workingGamma === projectSettings.workingGamma &&
    project.workingSpace === projectSettings.workingSpace &&
    project.compensateForSceneReferredProfiles ===
    projectSettings.compensateForSceneReferredProfiles &&
    project.linearizeWorkingSpace === projectSettings.linearizeWorkingSpace &&
    project.linearBlending === projectSettings.linearBlending
  ) {
    return true;
  } else {
    return false;
  }
};


export const openExistingFolder = (folderPath: string) => {
  var startFolder = new Folder(folderPath);
  var selectedFolder = startFolder.selectDlg("Select a folder");
  return selectedFolder.absoluteURI;
};