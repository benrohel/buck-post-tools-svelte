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
    return app.project.file.parent;
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
  return JSON.stringify({ comps: comps });
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
