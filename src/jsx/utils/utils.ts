export const forEach = <T>(
  arr: T[],
  callback: (item: T, i: number) => void
): void => {
  for (let i = 0; i < arr.length; i++) {
    callback(arr[i], i);
  }
};

export const map = <T>(
  arr: T[],
  callback: (item: T, i: number) => any
): T[] => {
  let res = [];
  for (let i = 0; i < arr.length; i++) {
    res.push(callback(arr[i], i));
  }
  return res;
};

export const filter = <T>(
  arr: T[],
  func: (item: T, i: number) => boolean
): T[] => {
  let res = [];
  for (let i = 0; i < arr.length; i++) {
    if (func(arr[i], i)) {
      res.push(arr[i]);
    }
  }
  return res;
};

export const includes = <T>(arr: T[], value: string | number) => {
  for (let i = 0; i < arr.length; i++) {
    const element = arr[i];
    if (element === value) {
      return true;
    }
  }
  return false;
};

export const indexOf = <T>(arr: T[], value: string | number) => {
  for (let i = 0; i < arr.length; i++) {
    const element = arr[i];
    if (element === value) {
      return i;
    }
  }
  return -1;
};

// Joins paths
export const join = (...args: string[]) => {
  const sep = $.os === 'Windows' ? '\\' : '/';
  const len = args.length;
  let res = args[0];
  for (let i = 1; i < len; i++) {
    res = res + sep + args[i];
  }
  return res;
};

export const padLeft = (str: string, paddingValue: string) => {
  return String(paddingValue + str).slice(-paddingValue.length);
};

// export const openFolderDialog = (txt: string) => {
//   var newOutput = Folder.selectDialog(txt);
//   if (newOutput && newOutput.exists) {
//     return newOutput.fsName;
//   } else {
//     return undefined;
//   }
// };

export const selectFolder = (
  msg: string = 'Select a Folder'
): string | false => {
  const folder = Folder.selectDialog(msg);
  if (folder.exists) {
    return folder.fsName;
  }
  return false;
};

/**
 * @param {String} str - The string to pad
 * @param {Number} targetLength - The length of the resulting string once the current string has been padded
 * @param {String} [padString=' '] - The string to pad the current string with (default is space)
 * @return {String} - A new string of the specified length with the pad string applied from the start
 */
export const padStart = (
  str: string,
  targetLength: number,
  padString: string = ' '
) => {
  // Convert inputs to strings if they aren't already
  str = String(str);
  padString = String(padString || ' ');

  // If the string is already longer than target length, return the string
  if (str.length >= targetLength) {
    return str;
  }

  // Calculate how much padding we need
  var padLength = targetLength - str.length;

  // Create the padding
  var padding = '';

  // Build the padding string
  // We need to handle cases where padString.length doesn't divide evenly into padLength
  var padRepeatCount = Math.ceil(padLength / padString.length);

  // Create the full padding by repeating the padString
  for (var i = 0; i < padRepeatCount; i++) {
    padding += padString;
  }

  // Trim the padding to the exact length needed
  padding = padding.slice(0, padLength);

  // Return the padded string
  return padding + str;
};
