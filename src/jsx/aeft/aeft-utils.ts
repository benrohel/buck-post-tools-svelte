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
    return "";
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
    ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript");
  }
  if (!app.project || !ExternalObject.AdobeXMPScript || !XMPMeta) return;
  const prefix = "xmp:";
  const uri = XMPMeta.getNamespaceURI(prefix);
  const newPropName = prefix + propName;
  let metadata = new XMPMeta(app.project.xmpPacket);
  metadata.setProperty(uri, newPropName, propValue.toString());
  app.project.xmpPacket = metadata.serialize();
};

export const getAeMetadata = (propName: string) => {
  if (ExternalObject.AdobeXMPScript === undefined) {
    ExternalObject.AdobeXMPScript = new ExternalObject("lib:AdobeXMPScript");
  }
  if (!app.project || !ExternalObject.AdobeXMPScript || !XMPMeta) return;
  const prefix = "xmp:";
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
  var comp = app.project.items.addComp("tempComp", 1920, 1080, 1, 1, 24);
  var rq = app.project.renderQueue;
  var rqItems = rq.items;
  var tempRqItem = rqItems.add(comp);
  var templates = tempRqItem.outputModule(1).templates;
  tempRqItem.remove();
  comp.remove();
  return JSON.stringify(templates);
};
