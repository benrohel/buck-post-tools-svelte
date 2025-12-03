import { path, fs } from '../../lib/cep/node';
import { type PathItem } from '../exporter';

/**
 * Get the immediate children (files and folders) of a directory
 * @param dirPath - The directory path to read
 * @param parentId - The parent node ID for building the tree
 * @returns Array of PathItem representing the children
 */
export async function getDirectoryChildren(
  dirPath: string,
  parentId: string | null = null,
): Promise<PathItem[]> {
  try {
    // Check if directory exists
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
      return [];
    }

    const entries = fs.readdirSync(dirPath);
    const children: PathItem[] = [];

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

      const isDirectory = stats.isDirectory();
      const item: PathItem = {
        id: fullPath,
        type: isDirectory ? 'folder' : 'file',
        path: fullPath,
        name: entry,
        parentId: parentId,
        expanded: false,
      };

      // For folders, initialize empty children array
      if (isDirectory) {
        item.children = [];
      }

      children.push(item);
    }

    // Sort: folders first, then files, alphabetically
    return children.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'folder' ? -1 : 1;
    });
  } catch (error) {
    console.error('Error reading directory:', dirPath, error);
    return [];
  }
}

/**
 * Get the initial root folder structure
 * @param rootPath - The root directory path
 * @returns Array with single PathItem representing the root folder
 */
export async function getRootFolder(rootPath: string): Promise<PathItem[]> {
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
      children: await getDirectoryChildren(rootPath, rootPath),
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
 * @returns Array of PathItem representing the children
 */
export async function loadFolderChildren(
  folderPath: string,
  folderId: string,
): Promise<PathItem[]> {
  return await getDirectoryChildren(folderPath, folderId);
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
