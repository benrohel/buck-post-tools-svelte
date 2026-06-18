const { fdir } = require('fdir');
import { path, fs } from '@/lib/cep/node';
import { type PathItem } from '@/api/exporter';
import { logModule } from '@/lib/logger';
const log = logModule('buck5-file-browser');

interface HSFile {
  path: string;
  modified: Date;
  name: string;
  version: number;
}

export const getFilteredFiles = async (rootPath: string, filter: string[]): Promise<HSFile[]> => {
  const productionRoot = path.join(rootPath, 'Production');
  const fs = require('fs');

  const entries = await new fdir()
    .withFullPaths()
    .exclude((dirName: string) => dirName.includes('temp') || dirName.startsWith('.'))
    .filter((filePath: string) => {
      const fileName = path.basename(filePath);
      return filter.some(pattern => fileName.match(pattern.replace(/\*/g, '.*')));
    })
    .crawl(productionRoot)
    .withPromise();

  return entries
    .map((entry: string) => {
      const stats = fs.statSync(entry);
      return {
        path: entry,
        modified: stats.mtime,
        name: path.basename(entry),
        version: extractVersion(entry)
      };
    })
    .sort((a: any, b: any) => b.version - a.version); // example sort by version descending
};

export function extractVersion(filename: string) {
  const match = filename.match(/_v(\d{2,})/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * 
 * @param rootPath is the Project folder
 * @returns 
 */
export const getShotFiles = async (rootPath: string) => {
  const productionRoot = path.join(rootPath, 'Production', 'shots');
  const targetExtensions = ['.mov', '.mp4'];


  const entries = await new fdir()
    .withFullPaths()
    .exclude((dirName: string) => dirName.includes('temp') || dirName.startsWith('.'))
    .filter((filePath: string) => {
      const ext = path.extname(filePath).toLowerCase();
      const isTargetFile = targetExtensions.includes(ext);
      const isDotFile = path.basename(filePath).startsWith('.');
      const isInShotsRender = filePath.toLowerCase().includes('/shots/') && filePath.toLowerCase().includes('/render/');
      const isRootVideo = !filePath.includes('/') && targetExtensions.includes(ext);
      return isTargetFile && (isInShotsRender || isRootVideo) && !isDotFile;
    })
    .crawl(productionRoot)
    .withPromise();

  return entries
    .map((entry: string) => {
      const stats = fs.statSync(entry);
      const parsed = parseHierarchy(entry);

      return {
        ...parsed,
        path: entry,
        modified: stats.mtime,
        name: path.basename(entry)
      }
    })
    .filter((item: any) => item !== null)
    .sort((a: any, b: any) => (b.versionNumber || 0) - (a.versionNumber || 0)); // example sort by version descending
};




interface ParsedFileInfo {
  sequence: string;
  shot: string;
  task: string;
  version?: string;
  versionNumber?: number;
  path: string;
  name: string;
}

function parseHierarchy(filePath: string): ParsedFileInfo | null {
  const normalizedPath = path.normalize(filePath);
  const parts = normalizedPath.split(path.sep);

  // Find the "Shots" folder (case-insensitive)
  const shotsIndex = parts.findIndex(p => p.toLowerCase() === 'shots');
  if (shotsIndex === -1 || parts.length < shotsIndex + 4) {
    return null; // Not enough levels after "Shots" to extract hierarchy
  }

  const sequence = parts[shotsIndex + 1];
  const shot = parts[shotsIndex + 2];
  const task = parts[shotsIndex + 3];
  const name = path.basename(filePath);

  // Try to extract version from filename: _v###
  const versionMatch = name.match(/_v(\d{3})/i);
  const version = versionMatch ? `v${versionMatch[1]}` : undefined;
  const versionNumber = versionMatch ? parseInt(versionMatch[1], 10) : undefined;

  return {
    sequence,
    shot,
    task,
    version,
    versionNumber,
    path: filePath,
    name
  };
}

function buildPathTreeFromParsedFiles(files: ParsedFileInfo[]): PathItem[] {
  const root: PathItem[] = [];
  const idMap = new Map<string, PathItem>();

  for (const file of files) {
    const { sequence, shot, task, path: fullPath, name } = file;

    // Build hierarchy: Shots → Sequence → Shot → Task → [subfolders] → File
    const pathSegments = ['Shots', sequence, shot, task];

    // Extract subfolders between task and the file, excluding the last folder
    const normalizedPath = path.normalize(fullPath);
    const parts = normalizedPath.split(path.sep);
    const shotsIndex = parts.findIndex(p => p.toLowerCase() === 'shots');
    // After shots: [sequence, shot, task, ...subfolders, lastFolder, filename]
    // Include subfolders up to (but not including) the last folder before the file
    const subfolders = parts.slice(shotsIndex + 4, parts.length - 2);
    pathSegments.push(...subfolders);

    let currentPath = '';
    let parentId: string | null = null;
    let children = root;

    for (const segment of pathSegments) {
      currentPath = path.join(currentPath, segment);
      const id = currentPath;

      if (!idMap.has(id)) {
        const folderItem: PathItem = {
          id,
          type: 'folder',
          path: currentPath,
          name: segment,
          parentId,
          children: [],
          expanded: true
        };
        idMap.set(id, folderItem);
        children.push(folderItem);
      }

      const currentItem = idMap.get(id)!;
      children = currentItem.children!.sort((a, b) => a.name.localeCompare(b.name));
      parentId = currentItem.id;
    }

    // Now add the file under the current folder
    const fileId = fullPath;
    if (!idMap.has(fileId)) {
      const fileItem: PathItem = {
        id: fileId,
        type: 'file',
        path: fullPath,
        name: name,
        parentId,
      };
      idMap.set(fileId, fileItem);
      children.push(fileItem);
    }
  }

  return root;
}

export const getShotFilesTree = async (rootPath: string, isBuck5: boolean = true, prefix: string = "") => {
  const files = await getShotFiles(rootPath,);
  const tree = buildPathTreeFromParsedFiles(files);
  return tree;
};

/**
 * Get asset files from Production/assets/{Library}/{Asset}/{Task}/
 */
export const getAssetFiles = async (rootPath: string) => {
  const assetsRoot = path.join(rootPath, 'Production', 'Assets');
  const targetExtensions = ['.mov', '.mp4', '.png', '.exr', '.jpg'];

  const entries = await new fdir()
    .withFullPaths()
    .exclude((dirName: string) => dirName.includes('temp') || dirName.startsWith('.'))
    .filter((filePath: string) => {
      const ext = path.extname(filePath).toLowerCase();
      const isTargetFile = targetExtensions.includes(ext);
      const isDotFile = path.basename(filePath).startsWith('.');
      return isTargetFile && !isDotFile;
    })
    .crawl(assetsRoot)
    .withPromise();

  return entries
    .map((entry: string) => {
      const parsed = parseAssetHierarchy(entry);
      if (!parsed) return null;
      const stats = fs.statSync(entry);

      return {
        ...parsed,
        path: entry,
        modified: stats.mtime,
        name: path.basename(entry)
      }
    })
    .filter((item: any): item is ParsedAssetFileInfo & { modified: Date } => item !== null)
    .sort((a: ParsedAssetFileInfo, b: ParsedAssetFileInfo) => (b.versionNumber || 0) - (a.versionNumber || 0));
};

interface ParsedAssetFileInfo {
  library: string;
  asset: string;
  task: string;
  version?: string;
  versionNumber?: number;
  path: string;
  name: string;
}

function parseAssetHierarchy(filePath: string): ParsedAssetFileInfo | null {
  const normalizedPath = path.normalize(filePath);
  const parts = normalizedPath.split(path.sep);

  const assetsIndex = parts.findIndex(p => p.toLowerCase() === 'assets');
  if (assetsIndex === -1 || parts.length < assetsIndex + 4) {
    return null;
  }

  const library = parts[assetsIndex + 1];
  const asset = parts[assetsIndex + 2];
  const task = parts[assetsIndex + 3];
  const name = path.basename(filePath);

  const versionMatch = name.match(/_v(\d{3})/i);
  const version = versionMatch ? `v${versionMatch[1]}` : undefined;
  const versionNumber = versionMatch ? parseInt(versionMatch[1], 10) : undefined;

  return {
    library,
    asset,
    task,
    version,
    versionNumber,
    path: filePath,
    name
  };
}

function buildPathTreeFromParsedAssetFiles(files: ParsedAssetFileInfo[]): PathItem[] {
  const root: PathItem[] = [];
  const idMap = new Map<string, PathItem>();

  for (const file of files) {
    const { library, asset, task, path: fullPath, name } = file;

    const pathSegments = ['Assets', library, asset, task];
    let currentPath = '';
    let parentId: string | null = null;
    let children = root;

    for (const segment of pathSegments) {
      currentPath = path.join(currentPath, segment);
      const id = currentPath;

      if (!idMap.has(id)) {
        const folderItem: PathItem = {
          id,
          type: 'folder',
          path: currentPath,
          name: segment,
          parentId,
          children: [],
          expanded: true
        };
        idMap.set(id, folderItem);
        children.push(folderItem);
      }

      const currentItem = idMap.get(id)!;
      children = currentItem.children!.sort((a, b) => a.name.localeCompare(b.name));
      parentId = currentItem.id;
    }

    const fileId = fullPath;
    if (!idMap.has(fileId)) {
      const fileItem: PathItem = {
        id: fileId,
        type: 'file',
        path: fullPath,
        name: name,
        parentId,
      };
      idMap.set(fileId, fileItem);
      children.push(fileItem);
    }
  }

  return root;
}

export const getAssetFilesTree = async (rootPath: string) => {
  const files = await getAssetFiles(rootPath);
  log.debug('buck5-file-browser.ts', 'getAssetFilesTree', 'files', files);
  const tree = buildPathTreeFromParsedAssetFiles(files);
  return tree;
};

export const collectFolderNamesByLevel = (tree: PathItem[]): string[][] => {

  const levels: Map<number, Set<string>> = new Map();

  function traverse(node: PathItem, depth: number) {
    if (node.type === 'folder') {
      if (!levels.has(depth)) {
        levels.set(depth, new Set());
      }
      levels.get(depth)!.add(node.name);

      if (node.children) {
        for (const child of node.children) {
          traverse(child, depth + 1);
        }
      }
    }
  }

  for (const rootNode of tree) {
    traverse(rootNode, 0);
  }

  // Convert map to array of arrays
  const result: string[][] = [];
  for (const [depth, names] of [...levels.entries()].sort(([a], [b]) => a - b)) {
    result.push([...names]);
  }

  return result;
}

export type HierarchyFilters = {
  sequence?: string[];
  shot?: string[];
  task?: string[];
};



export const filterByDepth = (data: PathItem[], filters: any, onlyLatestVersions: boolean = false) => {

  function filterNode(node: PathItem, depth = 0): PathItem | null {
    // Apply filter for current depth if it exists
    const filter = filters[depth];
    if (filter && !filter(node)) {
      return null; // Node doesn't pass filter
    }

    // If node has children, recursively filter them
    if (node.children && node.children.length > 0) {
      const filteredChildren = node.children
        .map(child => filterNode(child, depth + 1))
        .filter((child): child is PathItem => child !== null)
        .sort((a: any, b: any) => a.path.localeCompare(b.path));

      // Return node with filtered children
      return {
        ...node,
        children: filteredChildren
      };
    }

    // Leaf node that passed filter
    return node;
  }

  const res = data
    .map(node => filterNode(node))
    .filter((node): node is PathItem => node !== null);

  if (onlyLatestVersions) {
    return filterLatestVersions(res);
  }
  return res;
}


export const filterLatestVersions = (data: PathItem[]) => {
  function processNode(node: PathItem): PathItem {
    if (!node.children || node.children.length === 0) {
      return node; // Leaf node, return as-is
    }

    // Separate files from folders
    const folders = node.children.filter(child => child.type === 'folder');
    const files = node.children.filter(child => child.type === 'file');

    // Group files by extension, keep only the latest version per extension
    const latestByExt = new Map<string, PathItem>();
    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase();
      const existing = latestByExt.get(ext);
      if (!existing || extractVersion(file.name) > extractVersion(existing.name)) {
        latestByExt.set(ext, file);
      }
    }
    const latestFile = Array.from(latestByExt.values());

    // Recursively process folders
    const processedFolders = folders.map(folder => processNode(folder));

    return {
      ...node,
      children: [...processedFolders, ...latestFile]
    };
  }

  return data.map(node => processNode(node));
}