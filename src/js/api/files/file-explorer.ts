import { path, fs } from '../../lib/cep/node';
import { type PathItem } from '../exporter';

/**
 * Common VFX image sequence extensions
 */
const IMAGE_SEQUENCE_EXTENSIONS = [
  '.exr',
  '.dpx',
  '.tif',
  '.tiff',
  '.png',
  '.jpg',
  '.jpeg',
  '.tga',
  '.cin',
];

/**
 * Interface for parsed sequence information
 */
interface SequenceInfo {
  baseName: string; // e.g., "shot_"
  padding: number; // e.g., 4 for "0001"
  extension: string; // e.g., ".exr"
  frames: number[]; // e.g., [1, 2, 3, 4, 5]
  firstFrame: number;
  lastFrame: number;
  pattern: string; // e.g., "shot_####.exr"
  files: string[]; // Array of actual filenames
}

/**
 * Parse a filename to detect if it's part of an image sequence
 * @param filename - The filename to parse
 * @returns Sequence info or null if not a sequence
 */
function parseSequenceFilename(filename: string): {
  baseName: string;
  frameNumber: number;
  padding: number;
  extension: string;
} | null {
  const ext = path.extname(filename).toLowerCase();

  // Check if it's a common sequence extension
  if (!IMAGE_SEQUENCE_EXTENSIONS.includes(ext)) {
    return null;
  }

  const nameWithoutExt = path.basename(filename, ext);

  // Match patterns like: shot_0001, render.1234, comp_v001_0050, etc.
  // Look for digits at the end of the filename
  const match = nameWithoutExt.match(/^(.+?)(\d+)$/);

  if (!match) {
    return null;
  }

  const baseName = match[1];
  const frameStr = match[2];
  const frameNumber = parseInt(frameStr, 10);
  const padding = frameStr.length;

  return {
    baseName,
    frameNumber,
    padding,
    extension: ext,
  };
}

/**
 * Group files into sequences
 * @param files - Array of filenames
 * @returns Map of sequence patterns to SequenceInfo
 */
function groupSequences(files: string[]): Map<string, SequenceInfo> {
  const sequences = new Map<string, SequenceInfo>();

  for (const file of files) {
    const parsed = parseSequenceFilename(file);

    if (!parsed) {
      continue;
    }

    const { baseName, frameNumber, padding, extension } = parsed;
    const key = `${baseName}|${padding}|${extension}`;

    if (!sequences.has(key)) {
      const paddingStr = '#'.repeat(padding);
      sequences.set(key, {
        baseName,
        padding,
        extension,
        frames: [],
        firstFrame: frameNumber,
        lastFrame: frameNumber,
        pattern: `${baseName}${paddingStr}${extension}`,
        files: [],
      });
    }

    const seq = sequences.get(key)!;
    seq.frames.push(frameNumber);
    seq.files.push(file);
    seq.firstFrame = Math.min(seq.firstFrame, frameNumber);
    seq.lastFrame = Math.max(seq.lastFrame, frameNumber);
  }

  // Filter out single-frame "sequences" (keep only if 2+ frames)
  const validSequences = new Map<string, SequenceInfo>();
  for (const [key, seq] of sequences.entries()) {
    if (seq.frames.length > 1) {
      // Sort frames
      seq.frames.sort((a, b) => a - b);
      validSequences.set(key, seq);
    }
  }

  return validSequences;
}

/**
 * Get the immediate children (files and folders) of a directory
 * @param dirPath - The directory path to read
 * @param parentId - The parent node ID for building the tree
 * @param groupSequences - Whether to group image sequences (default: true)
 * @returns Array of PathItem representing the children
 */
export async function getDirectoryChildren(
  dirPath: string,
  parentId: string | null = null,
  groupSequencesOption: boolean = true,
): Promise<PathItem[]> {
  try {
    // Check if directory exists
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      return [];
    }

    const entries = fs.readdirSync(dirPath);
    const folders: PathItem[] = [];
    const files: string[] = [];
    const fileItems: PathItem[] = [];

    // Separate folders from files
    for (const entry of entries) {
      // Skip hidden files and folders
      if (entry.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(dirPath, entry);
      let stats;

      try {
        stats = fs.statSync(fullPath);
      } catch (error) {
        // Skip files we can't access
        continue;
      }

      if (stats.isDirectory()) {
        const item: PathItem = {
          id: fullPath,
          type: 'folder',
          path: fullPath,
          name: entry,
          parentId: parentId,
          expanded: false,
          children: [],
        };
        folders.push(item);
      } else {
        files.push(entry);
      }
    }

    // Process files based on groupSequencesOption
    if (groupSequencesOption && files.length > 0) {
      const sequences = groupSequences(files);
      const sequenceFileSet = new Set<string>();

      // Add sequences as grouped items
      for (const [, seq] of sequences.entries()) {
        // Mark all files in this sequence
        seq.files.forEach((f) => sequenceFileSet.add(f));

        // Create a sequence item
        const sequenceName = `${seq.pattern} [${seq.firstFrame}-${seq.lastFrame}]`;
        const sequenceId = path.join(dirPath, seq.pattern);
        const sequenceItem: PathItem = {
          id: sequenceId,
          type: 'file',
          path: sequenceId,
          name: sequenceName,
          parentId: parentId,
          metadata: {
            isSequence: true,
            frameRange: [seq.firstFrame, seq.lastFrame],
            frameCount: seq.frames.length,
            frames: seq.frames,
            pattern: seq.pattern,
            files: seq.files.map((f) => path.join(dirPath, f)),
          },
        };
        fileItems.push(sequenceItem);
      }

      // Add non-sequence files
      for (const file of files) {
        if (!sequenceFileSet.has(file)) {
          const fullPath = path.join(dirPath, file);
          const item: PathItem = {
            id: fullPath,
            type: 'file',
            path: fullPath,
            name: file,
            parentId: parentId,
          };
          fileItems.push(item);
        }
      }
    } else {
      // No grouping - add all files individually
      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const item: PathItem = {
          id: fullPath,
          type: 'file',
          path: fullPath,
          name: file,
          parentId: parentId,
        };
        fileItems.push(item);
      }
    }

    // Sort folders and files alphabetically
    folders.sort((a, b) => a.name.localeCompare(b.name));
    fileItems.sort((a, b) => a.name.localeCompare(b.name));

    // Return folders first, then files
    return [...folders, ...fileItems];
  } catch (error) {
    console.error('Error reading directory:', dirPath, error);
    return [];
  }
}

/**
 * Get the initial root folder structure
 * @param rootPath - The root directory path
 * @param groupSequences - Whether to group image sequences (default: true)
 * @returns Array with single PathItem representing the root folder
 */
export async function getRootFolder(
  rootPath: string,
  groupSequencesOption: boolean = true,
): Promise<PathItem[]> {
  try {
    if (!fs.existsSync(rootPath)) {
      throw new Error(`Path does not exist: ${rootPath}`);
    }

    const stats = fs.statSync(rootPath);
    if (!stats.isDirectory()) {
      throw new Error(`Path is not a directory: ${rootPath}`);
    }

    const rootName = path.basename(rootPath);
    const rootItem: PathItem = {
      id: rootPath,
      type: 'folder',
      path: rootPath,
      name: rootName,
      parentId: null,
      expanded: true,
      children: await getDirectoryChildren(rootPath, rootPath, groupSequencesOption),
    };

    return [rootItem];
  } catch (error) {
    console.error('Error getting root folder:', error);
    return [];
  }
}

/**
 * Load children for a specific folder node
 * @param folderPath - The folder path to load children for
 * @param folderId - The folder ID (same as path)
 * @param groupSequences - Whether to group image sequences (default: true)
 * @returns Array of PathItem representing the children
 */
export async function loadFolderChildren(
  folderPath: string,
  folderId: string,
  groupSequencesOption: boolean = true,
): Promise<PathItem[]> {
  return await getDirectoryChildren(folderPath, folderId, groupSequencesOption);
}

/**
 * Update a node in the tree with new children
 * @param tree - The current tree structure
 * @param nodeId - The ID of the node to update
 * @param children - The new children to set
 * @returns Updated tree structure
 */
export function updateNodeChildren(
  tree: PathItem[],
  nodeId: string,
  children: PathItem[],
): PathItem[] {
  return tree.map((node) => {
    if (node.id === nodeId) {
      return {
        ...node,
        children: children,
        expanded: true,
      };
    } else if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: updateNodeChildren(node.children, nodeId, children),
      };
    }
    return node;
  });
}

/**
 * Check if a path exists and is accessible
 * @param filePath - The path to check
 * @returns True if path exists and is accessible
 */
export function pathExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Get file/folder metadata
 * @param filePath - The path to get metadata for
 * @returns Object with metadata or null if not accessible
 */
export function getPathMetadata(filePath: string): {
  isDirectory: boolean;
  size: number;
  modified: Date;
} | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const stats = fs.statSync(filePath);
    return {
      isDirectory: stats.isDirectory(),
      size: stats.size,
      modified: stats.mtime,
    };
  } catch (error) {
    console.error('Error getting path metadata:', error);
    return null;
  }
}
