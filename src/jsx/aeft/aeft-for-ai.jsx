/**
 * Composition Context Extractor
 * Extracts contextual information from the active composition
 * including animation and keyframe properties
 */

function getActiveCompContext() {
  var contextData = {
      timestamp: new Date().toString(),
      hasActiveComp: false,
      bitsPerChannel: app.project.bitsPerChannel
  };
  
  try {
      // Check if there is an active project
      if (!app.project) {
          return JSON.stringify(contextData);
      }
      
      // Check if there is an active composition
      var activeItem = app.project.activeItem;
      if (!activeItem || !(activeItem instanceof CompItem)) {
          return JSON.stringify(contextData);
      }
      
      // We have an active composition, extract its properties
      contextData.hasActiveComp = true;
      contextData.composition = {
          name: activeItem.name,
          width: activeItem.width,
          height: activeItem.height,
          pixelAspect: activeItem.pixelAspect,
          duration: activeItem.duration,
          frameRate: activeItem.frameRate,
          frameDuration: activeItem.frameDuration,
          displayStartTime: activeItem.displayStartTime,
          workAreaStart: activeItem.workAreaStart, 
          workAreaDuration: activeItem.workAreaDuration,
          totalLayers: activeItem.numLayers,
          selectedLayers: []
      };
      
      // Get project color depth
      contextData.bitsPerChannel = app.project.bitsPerChannel;
      
      // Extract basic information about layers
      contextData.composition.totalLayers = activeItem.numLayers;
      
      // Extract basic info about selected layers
      if (activeItem.selectedLayers.length > 0) {
          for (var i = 0; i < activeItem.selectedLayers.length; i++) {
              var layer = activeItem.selectedLayers[i];
              var layerInfo = {
                  index: layer.index,
                  name: layer.name,
                  type: getLayerType(layer),
                  selected: true,
                  hasParent: layer.parent !== null,
                  parentIndex: layer.parent ? layer.parent.index : null,
                  hasEffects: layer.effect && layer.effect.numProperties > 0,
                  hasMasks: layer.mask && layer.mask.numProperties > 0,
                  enabled: layer.enabled,
                  inPoint: layer.inPoint,
                  outPoint: layer.outPoint,
                  startTime: layer.startTime,
                  stretch: layer.stretch,
                  timeRemapEnabled: layer.timeRemapEnabled,
                  blendingMode: getBlendingModeName(layer.blendingMode),
                  trackMatteType: getTrackMatteTypeName(layer.trackMatteType),
                  preserveTransparency: layer.preserveTransparency,
                  shy: layer.shy,
                  solo: layer.solo,
                  locked: layer.locked,
                  motionBlur: layer.motionBlur,
                  threeDLayer: layer.threeDLayer,
                  transformProperties: {},
                  effects: [],
                  animatedProperties: []
              };
              
              // Extract transform properties
              if (layer.transform) {
                  layerInfo.transformProperties = getTransformProperties(layer.transform);
              }
              
              // Extract effect properties if they exist
              if (layer.effect && layer.effect.numProperties > 0) {
                  layerInfo.effects = getEffects(layer.effect);
              }
              
              // Get all animated properties for the layer
              layerInfo.animatedProperties = getAnimatedProperties(layer);
              
              // If the layer has selected properties, include them with keyframe details
              if (layer.selectedProperties && layer.selectedProperties.length > 0) {
                  layerInfo.selectedProperties = [];
                  for (var j = 0; j < layer.selectedProperties.length; j++) {
                      var prop = layer.selectedProperties[j];
                      var propInfo = {
                          name: prop.name,
                          matchName: prop.matchName,
                          propertyValueType: prop.propertyValueType,
                          expression: prop.expression,
                          hasExpression: prop.expressionEnabled,
                          value: formatPropertyValue(prop)
                      };
                      
                      // Add keyframe information if the property has keyframes
                      if (prop.numKeys > 0) {
                          propInfo.keyframes = getKeyframeInfo(prop);
                      }
                      
                      layerInfo.selectedProperties.push(propInfo);
                  }
              }
              
              contextData.composition.selectedLayers.push(layerInfo);
          }
      }
      
      // Add information about current time
      contextData.composition.currentTime = activeItem.time;
      
      return JSON.stringify(contextData, null, 2);
      
  } catch (error) {
      contextData.error = error.toString();
      return JSON.stringify(contextData);
  }
}

/**
* Helper function to determine layer type
*/
function getLayerType(layer) {
  if (layer instanceof TextLayer) return "text";
  if (layer instanceof ShapeLayer) return "shape";
  if (layer instanceof CameraLayer) return "camera";
  if (layer instanceof LightLayer) return "light";
  if (layer instanceof AVLayer) {
      if (layer.source instanceof CompItem) return "composition";
      if (layer.source instanceof FootageItem) {
          if (layer.source.mainSource instanceof SolidSource) return "solid";
          if (layer.source.file) {
              var fileExt = layer.source.file.name.split('.').pop().toLowerCase();
              if (["ai", "eps", "pdf"].indexOf(fileExt) !== -1) return "vector";
              if (["png", "jpg", "jpeg", "tif", "tiff", "gif", "psd"].indexOf(fileExt) !== -1) return "image";
              return "footage";
          }
      }
      return "avlayer";
  }
  return "unknown";
}

/**
* Helper function to format property values
*/
function formatPropertyValue(prop) {
  if (!prop.canSetValue) return null;
  
  try {
      var valueType = prop.propertyValueType;
      
      switch (valueType) {
          case PropertyValueType.ThreeD_SPATIAL:
          case PropertyValueType.ThreeD:
          case PropertyValueType.TwoD_SPATIAL:
          case PropertyValueType.TwoD:
              return prop.value.toString();
          case PropertyValueType.OneD:
          case PropertyValueType.COLOR:
          case PropertyValueType.CUSTOM_VALUE:
              return prop.value.toString();
          case PropertyValueType.MARKER:
              return "marker"; // Simplify marker representation
          case PropertyValueType.LAYER_INDEX:
              return prop.value;
          case PropertyValueType.MASK_INDEX:
              return prop.value;
          default:
              return prop.value.toString();
      }
  } catch (e) {
      return "Error getting value";
  }
}

/**
* Get the name of a blending mode from its numeric value
*/
function getBlendingModeName(blendingModeValue) {
  var modes = {
      1: "normal",
      2: "dissolve",
      3: "dancing dissolve",
      4: "add",
      5: "multiply",
      6: "screen",
      7: "overlay",
      8: "soft light",
      9: "hard light",
      10: "darken",
      11: "lighten",
      12: "classic color dodge",
      13: "classic color burn",
      14: "linear dodge",
      15: "linear burn",
      16: "vivid light",
      17: "linear light",
      18: "pin light",
      19: "hard mix",
      20: "difference",
      21: "exclusion",
      22: "hue",
      23: "saturation",
      24: "color",
      25: "luminosity",
      26: "stencil alpha",
      27: "stencil luma",
      28: "silhouette alpha",
      29: "silhouette luma",
      30: "alpha add",
      31: "luminescent premul"
  };
  
  return modes[blendingModeValue] || "unknown";
}

/**
* Get the name of a track matte type from its numeric value
*/
function getTrackMatteTypeName(trackMatteValue) {
  var types = {
      0: "none",
      1: "alpha matte",
      2: "inverted alpha matte",
      3: "luma matte",
      4: "inverted luma matte"
  };
  
  return types[trackMatteValue] || "unknown";
}

/**
* Get transform properties for a layer
*/
function getTransformProperties(transform) {
  var transformProps = {};
  
  // Extract common transform properties
  var properties = [
      "anchorPoint", "position", "scale", "rotation", "opacity", 
      "xPosition", "yPosition"
  ];
  
  // For 3D layers, add 3D-specific properties
  if (transform.property("Z Position")) {
      properties.push("zPosition", "xRotation", "yRotation", "zRotation", "orientationX", 
                      "orientationY", "orientationZ");
  }
  
  // Get info for each property
  for (var i = 0; i < properties.length; i++) {
      var propName = properties[i];
      try {
          var prop = transform.property(propName);
          if (prop) {
              transformProps[propName] = {
                  value: formatPropertyValue(prop),
                  numKeys: prop.numKeys,
                  expressionEnabled: prop.expressionEnabled
              };
              
              // If the property has keyframes, get keyframe info
              if (prop.numKeys > 0) {
                  transformProps[propName].keyframes = getKeyframeInfo(prop);
              }
          }
      } catch (e) {
          // Property might not exist for this layer type
      }
  }
  
  return transformProps;
}

/**
* Get effect properties for a layer
*/
function getEffects(effectsProperty) {
  var effects = [];
  
  for (var i = 1; i <= effectsProperty.numProperties; i++) {
      try {
          var effect = effectsProperty.property(i);
          var effectInfo = {
              name: effect.name,
              matchName: effect.matchName,
              enabled: effect.enabled,
              properties: []
          };
          
          // Get effect parameters
          for (var j = 1; j <= effect.numProperties; j++) {
              try {
                  var param = effect.property(j);
                  var paramInfo = {
                      name: param.name,
                      matchName: param.matchName,
                      value: formatPropertyValue(param),
                      numKeys: param.numKeys,
                      expressionEnabled: param.expressionEnabled
                  };
                  
                  // If parameter has keyframes, get keyframe info
                  if (param.numKeys > 0) {
                      paramInfo.keyframes = getKeyframeInfo(param);
                  }
                  
                  effectInfo.properties.push(paramInfo);
              } catch (e) {
                  // Skip properties that can't be accessed
              }
          }
          
          effects.push(effectInfo);
      } catch (e) {
          // Skip effects that can't be accessed
      }
  }
  
  return effects;
}

/**
* Get keyframe information for a property
*/
function getKeyframeInfo(prop) {
  var keyframes = [];
  
  // Skip if there are no keyframes
  if (!prop.numKeys) return keyframes;
  
  // Extract keyframe data
  for (var i = 1; i <= prop.numKeys; i++) {
      var keyTime = prop.keyTime(i);
      var keyValue = prop.keyValue(i);
      
      var keyInfo = {
          index: i,
          time: keyTime,
          value: keyValue.toString(),
          roving: false // default
      };
      
      // Get keyframe interpolation if applicable
      try {
          var inInterp = prop.keyInInterpolationType(i);
          var outInterp = prop.keyOutInterpolationType(i);
          
          keyInfo.inInterpolationType = getInterpolationTypeName(inInterp);
          keyInfo.outInterpolationType = getInterpolationTypeName(outInterp);
          
          // Get spatial tangent information (for spatial properties)
          if (prop.isSpatial) {
              try {
                  keyInfo.roving = prop.keyRoving(i);
                  
                  if (inInterp === KeyframeInterpolationType.BEZIER || 
                      outInterp === KeyframeInterpolationType.BEZIER) {
                      // Get spatial tangent data
                      keyInfo.inSpatialTangent = prop.keyInSpatialTangent(i).toString();
                      keyInfo.outSpatialTangent = prop.keyOutSpatialTangent(i).toString();
                  }
              } catch (e) {
                  // Some spatial info might not be available
              }
          }
          
          // Get temporal ease data
          if (inInterp === KeyframeInterpolationType.BEZIER || 
              outInterp === KeyframeInterpolationType.BEZIER) {
              
              try {
                  var inTempEase = prop.keyInTemporalEase(i);
                  var outTempEase = prop.keyOutTemporalEase(i);
                  
                  keyInfo.inTemporalEase = formatTemporalEase(inTempEase);
                  keyInfo.outTemporalEase = formatTemporalEase(outTempEase);
              } catch (e) {
                  // Temporal ease might not be available
              }
          }
      } catch (e) {
          // Interpolation data might not be available
      }
      
      keyframes.push(keyInfo);
  }
  
  return keyframes;
}

/**
* Format temporal ease values
*/
function formatTemporalEase(easeArray) {
  var result = [];
  for (var i = 0; i < easeArray.length; i++) {
      result.push({
          speed: easeArray[i].speed,
          influence: easeArray[i].influence
      });
  }
  return result;
}

/**
* Get interpolation type name from numeric value
*/
function getInterpolationTypeName(interpType) {
  var types = {
      1: "LINEAR",
      2: "BEZIER",
      3: "HOLD"
  };
  
  return types[interpType] || "unknown";
}

/**
* Find all animated properties in a layer
* (Properties with keyframes or expressions)
*/
function getAnimatedProperties(layer) {
  var animatedProps = [];
  
  // Helper function to recursively search for animated properties
  function findAnimatedProperties(propGroup, path) {
      for (var i = 1; i <= propGroup.numProperties; i++) {
          var prop = propGroup.property(i);
          var currentPath = path ? path + "." + prop.name : prop.name;
          
          // If this is a property group, search recursively
          if (prop.propertyType === PropertyType.PROPERTY_GROUP) {
              findAnimatedProperties(prop, currentPath);
          }
          // If this is a property that is animated (has keyframes or expression)
          else if (prop.propertyType === PropertyType.PROPERTY) {
              if (prop.numKeys > 0 || prop.expressionEnabled) {
                  var propInfo = {
                      name: prop.name,
                      matchName: prop.matchName,
                      path: currentPath,
                      expressionEnabled: prop.expressionEnabled,
                      numKeys: prop.numKeys
                  };
                  
                  // If the property has keyframes, get keyframe info
                  if (prop.numKeys > 0) {
                      propInfo.keyframes = getKeyframeInfo(prop);
                  }
                  
                  animatedProps.push(propInfo);
              }
          }
      }
  }
  
  // Start searching from the layer
  findAnimatedProperties(layer, "");
  
  return animatedProps;
}

// Execute and return the result
var report = getActiveCompContext();


varreportFile = new File("/Users/b.rohel/Desktop/aeft-for-ai.json");
reportFile.open('w');
reportFile.write(JSON.stringify(report));
reportFile.close();
