interface CompInfo {
  name: string;
  id: number;
}

export const listAllComps = (): string => {
  const items = app.project.items;
  const compNames: CompInfo[] = [];
  for (let i = 1; i <= items.length; i++) {
    if (items[i] instanceof CompItem) {
      compNames.push({ name: items[i].name, id: items[i].id });
    }
  }
  return JSON.stringify(compNames);
};

export function getAndSetEssentialProperties(saveToFile: boolean) {
  if (
    !app.project ||
    !app.project.activeItem ||
    !(app.project.activeItem instanceof CompItem)
  ) {
    alert('Please select a composition.');
    return [];
  }

  var comp = app.project.activeItem;
  var essentialPropertiesArray = [];

  app.beginUndoGroup('Get and Set Essential Properties');

  for (var i = 1; i <= comp.numLayers; i++) {
    var layer = comp.layer(i);

    // Check if layer has Essential Properties
    if (layer.essentialProperty) {
      for (var j = 1; j <= layer.numProperties; j++) {
        var prop = layer.property(j);

        if (prop.name === 'Essential Properties') {
          // Dive into the Essential Properties group
          for (var k = 1; k <= prop.numProperties; k++) {
            var essential = prop.property(k);

            var propInfo = {
              name: essential.name,
              value: getPropertyValue(essential),
              type: getPropertyType(essential),
              layerName: layer.name,
              layerIndex: i,
              compositionName: comp.name,
            };

            essentialPropertiesArray.push(propInfo);
          }
        }
      }
    }
  }

  app.endUndoGroup();

  if (saveToFile && essentialPropertiesArray.length > 0) {
    saveToCSVFile(essentialPropertiesArray, comp.name);
  }

  return essentialPropertiesArray;
}

function getPropertyValue(property) {
  try {
    if (property.propertyValueType === PropertyValueType.NO_VALUE) {
      return null;
    }

    var value = property.value;

    // Handle TextDocument properties
    if (property.propertyValueType === PropertyValueType.TEXT_DOCUMENT) {
      var textValue = value.text;
      // Replace line breaks and carriage returns with escaped versions
      textValue = textValue.replace(/\r\n/g, '\\n'); // Windows line endings
      textValue = textValue.replace(/\r/g, '\\n'); // Mac line endings
      textValue = textValue.replace(/\n/g, '\\n'); // Unix line endings
      return textValue;
    }

    // Handle arrays (like position, scale, color)
    if (value instanceof Array) {
      return '[' + value.join(', ') + ']';
    }

    return value;
  } catch (e) {
    return null;
  }
}

function getPropertyType(property: Property) {
  if (property.propertyValueType === PropertyValueType.NO_VALUE) {
    return 'no_value';
  } else if (
    property.propertyValueType === PropertyValueType.ThreeD_SPATIAL ||
    property.propertyValueType === PropertyValueType.TwoD_SPATIAL
  ) {
    return 'spatial';
  } else if (
    property.propertyValueType === PropertyValueType.ThreeD ||
    property.propertyValueType === PropertyValueType.TwoD
  ) {
    return 'dimensional';
  } else if (property.propertyValueType === PropertyValueType.OneD) {
    return 'number';
  } else if (property.propertyValueType === PropertyValueType.COLOR) {
    return 'color';
  } else if (property.propertyValueType === PropertyValueType.CUSTOM_VALUE) {
    return 'custom';
  } else if (property.propertyValueType === PropertyValueType.MARKER) {
    return 'marker';
  } else if (property.propertyValueType === PropertyValueType.LAYER_INDEX) {
    return 'layerIndex';
  } else if (property.propertyValueType === PropertyValueType.MASK_INDEX) {
    return 'maskIndex';
  } else if (property.propertyValueType === PropertyValueType.SHAPE) {
    return 'shape';
  } else if (property.propertyValueType === PropertyValueType.TEXT_DOCUMENT) {
    return 'textDocument';
  } else {
    return 'unknown';
  }
}

function saveToCSVFile(propertiesArray: any[], compName: string) {
  try {
    var file = File.saveDialog('Save Essential Properties as CSV', '*.csv');
    if (file) {
      file.open('w');

      // Write CSV header
      file.writeln(
        'Property Name,Type,Value,Layer Name,Layer Index,Composition Name'
      );

      // Write data rows
      for (var i = 0; i < propertiesArray.length; i++) {
        var prop = propertiesArray[i];
        var csvRow = [
          escapeCsvValue(prop.name || 'Unknown'),
          escapeCsvValue(prop.type || 'Unknown'),
          escapeCsvValue(
            prop.value !== null && prop.value !== undefined
              ? prop.value.toString()
              : 'N/A'
          ),
          escapeCsvValue(prop.layerName || 'Unknown'),
          (prop.layerIndex || 0).toString(),
          escapeCsvValue(prop.compositionName || 'Unknown'),
        ].join(',');

        file.writeln(csvRow);
      }

      file.close();
      alert('Essential properties saved to CSV: ' + file.fsName);
    }
  } catch (e: any) {
    alert('Error saving CSV file: ' + e.toString());
  }
}

function escapeCsvValue(value: any) {
  if (value === null || value === undefined) {
    return 'N/A';
  }

  var stringValue = value.toString();

  // If the value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (
    stringValue.indexOf(',') !== -1 ||
    stringValue.indexOf('"') !== -1 ||
    stringValue.indexOf('\n') !== -1
  ) {
    stringValue = '"' + stringValue.replace(/"/g, '""') + '"';
  }

  return stringValue;
}

export function updateEssentialPropertiesFromCSV(compositionName: string, csvFile: string) {
  if (!app.project) {
    alert('No project open.');
    return false;
  }

  // Find the composition by name
  var targetComp = null;
  for (var i = 1; i <= app.project.numItems; i++) {
    var item = app.project.item(i);
    if (item instanceof CompItem && item.name === compositionName) {
      targetComp = item;
      break;
    }
  }

  if (!targetComp) {
    alert('Composition "' + compositionName + '" not found in project.');
    return false;
  }

  // Read and parse CSV file
  var csvData = parseCSVFile(csvFile);
  if (!csvData || csvData.length === 0) {
    alert('Failed to read CSV file or file is empty.');
    return false;
  }

  app.beginUndoGroup('Update Essential Properties from CSV');

  var updatedCount = 0;
  var errorCount = 0;

  try {
    for (var i = 0; i < csvData.length; i++) {
      var row = csvData[i];

      if (updateSingleProperty(targetComp, row)) {
        updatedCount++;
      } else {
        errorCount++;
      }
    }

    app.endUndoGroup();
    alert(
      'Updated ' +
      updatedCount +
      ' properties successfully. ' +
      errorCount +
      ' errors occurred.'
    );
    return true;
  } catch (e) {
    app.endUndoGroup();
    alert('Error updating properties: ' + e.toString());
    return false;
  }
}

function parseCSVFile(csvFile: File) {
  try {
    if (!csvFile || !csvFile.exists) {
      return null;
    }

    csvFile.open('r');
    var content = csvFile.read();
    csvFile.close();

    var lines = content.split('\n');
    var data = [];

    // Skip header row (index 0)
    for (var i = 1; i < lines.length; i++) {
      var line = lines[i].replace(/\r/g, ''); // Remove carriage returns
      if (line.length > 0) {
        var row = parseCSVLine(line);
        if (row.length >= 6) {
          data.push({
            propertyName: row[0],
            type: row[1],
            value: row[2],
            layerName: row[3],
            layerIndex: parseInt(row[4]),
            compositionName: row[5],
          });
        }
      }
    }

    return data;
  } catch (e) {
    alert('Error parsing CSV: ' + e.toString());
    return null;
  }
}

function parseCSVLine(line: string) {
  var result: string[] = [];
  var current = '';
  var inQuotes = false;

  for (var i = 0; i < line.length; i++) {
    var character = line.charAt(i);

    if (character === '"') {
      if (inQuotes && i + 1 < line.length && line.charAt(i + 1) === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (character === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += character;
    }
  }

  result.push(current);
  return result;
}

function updateSingleProperty(comp, rowData) {
  try {
    // Find layer by name first, fall back to index if needed
    var targetLayer = null;

    // Try to find by name first
    for (var i = 1; i <= comp.numLayers; i++) {
      var layer = comp.layer(i);
      if (layer.name === rowData.layerName) {
        targetLayer = layer;
        break;
      }
    }

    // If not found by name, try by index
    if (
      !targetLayer &&
      rowData.layerIndex > 0 &&
      rowData.layerIndex <= comp.numLayers
    ) {
      targetLayer = comp.layer(rowData.layerIndex);
    }

    if (!targetLayer) {
      $.writeln(
        'Layer not found: ' +
        rowData.layerName +
        ' (Index: ' +
        rowData.layerIndex +
        ')'
      );
      return false;
    }

    // Check if layer has Essential Properties
    if (!targetLayer.essentialProperty) {
      $.writeln('Layer "' + targetLayer.name + '" has no Essential Properties');
      return false;
    }

    // Find Essential Properties group
    for (var j = 1; j <= targetLayer.numProperties; j++) {
      var prop = targetLayer.property(j);

      if (prop.name === 'Essential Properties') {
        // Find the specific essential property by name
        for (var k = 1; k <= prop.numProperties; k++) {
          var essential = prop.property(k);

          if (essential.name === rowData.propertyName) {
            return setPropertyValue(essential, rowData.value, rowData.type);
          }
        }
      }
    }

    $.writeln(
      'Essential property not found: ' +
      rowData.propertyName +
      ' on layer ' +
      rowData.layerName
    );
    return false;
  } catch (e: any) {
    $.writeln('Error updating property: ' + e.toString());
    return false;
  }
}

function setPropertyValue(property: Property, valueString: string, propertyType: string) {
  try {
    if (
      valueString === 'N/A' ||
      valueString === null ||
      valueString === undefined
    ) {
      return true; // Skip null values
    }

    // Handle different property types
    if (propertyType === 'no_value') {
      return true; // Can't set no_value properties
    }

    if (propertyType === 'textDocument') {
      var textDoc = property.value;
      // Convert escaped newlines back to actual newlines
      var unescapedText = valueString.replace(/\\n/g, '\n');
      textDoc.text = unescapedText;
      property.setValue(textDoc);
      return true;
    }

    // Handle array values (like [1, 2, 3])
    if (
      valueString.charAt(0) === '[' &&
      valueString.charAt(valueString.length - 1) === ']'
    ) {
      var arrayContent = valueString.substring(1, valueString.length - 1);
      var arrayValues = arrayContent.split(',');
      var parsedArray = [];

      for (var i = 0; i < arrayValues.length; i++) {
        var trimmed = arrayValues[i].replace(/^\s+|\s+$/g, ''); // Trim whitespace
        parsedArray.push(parseFloat(trimmed));
      }

      property.setValue(parsedArray);
      return true;
    }

    // Handle single numeric values
    var numericValue = parseFloat(valueString);
    if (!isNaN(numericValue)) {
      property.setValue(numericValue);
      return true;
    }

    // Handle string values
    property.setValue(valueString);
    return true;
  } catch (e: any) {
    $.writeln('Error setting value for ' + property.name + ': ' + e.toString());
    return false;
  }
}

// Example usage:
// var essentialProperties = getAndSetEssentialProperties(false); // Don't save to file
// var essentialProperties = getAndSetEssentialProperties(true);  // Save to file

// To update from CSV:
// var csvFile = File.openDialog('Select CSV file', '*.csv');
// if (csvFile) {
//   updateEssentialPropertiesFromCSV('Experiences_30s_DevTest', csvFile);
// }

// var essentialProperties = getAndSetEssentialProperties(true);
// alert('Found ' + essentialProperties.length + ' essential properties.');
