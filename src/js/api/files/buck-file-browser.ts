const { fdir } = require('fdir');
import { path, fs } from '../../lib/cep/node';
import { type PathItem } from '../exporter';
interface HSFile {
  path: string;
  modified: Date;
  name: string;
  version: number;
}

export const getFilteredFilesBuck3 = async (rootPath: string, filter: string[]): Promise<HSFile[]> => {
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
export const getShotFilesBuck3 = async (rootPath: string, buck5: boolean = true, prefix: string = "production") => {

  let productionRoot = path.join(rootPath, 'Production');

  if (buck5) {
    productionRoot = path.join(rootPath, 'Production', 'shots');
  }

  const targetExtensions = ['.mov', '.mp4'];

  const isInShotsRenderPattern = buck5 ? 'shots' : prefix;


  const entries = await new fdir()
    .withFullPaths()
    .exclude((dirName: string) => dirName.includes('temp') || dirName.startsWith('.'))
    .filter((filePath: string) => {
      const ext = path.extname(filePath).toLowerCase();
      const isTargetFile = targetExtensions.includes(ext);
      const isInShotsRender = filePath.toLowerCase().includes('shots') && filePath.toLowerCase().includes('/render/');
      const isRootVideo = !filePath.includes('/') && targetExtensions.includes(ext);
      const isBuck3Prefix = filePath.toLowerCase().match(new RegExp(`production/${prefix}`, 'i'));

      if (buck5) {
        return isTargetFile && (isInShotsRender || isRootVideo);
      } else {
        return isTargetFile && isBuck3Prefix !== null;
      }
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

function parseHierarchy(filePath: string, buck5: boolean = true): ParsedFileInfo | null {
  const normalizedPath = path.normalize(filePath);
  const parts = normalizedPath.split(path.sep);


  // Find the "Shots" folder (case-insensitive)
  const shotsIndex = parts.findIndex(p => p.toLowerCase() === 'production');
  if (shotsIndex === -1 || parts.length < shotsIndex + 4) {
    return null; // Not enough levels after "Shots" to extract hierarchy
  }

  const sequence = buck5 ? parts[shotsIndex + 1] : "";
  const shot = buck5 ? parts[shotsIndex + 2] : parts[shotsIndex + 1];
  const task = buck5 ? parts[shotsIndex + 3] : parts[shotsIndex + 2];
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

function buildPathTreeFromParsedFiles(files: ParsedFileInfo[], buck5: boolean = true): PathItem[] {
  const root: PathItem[] = [];
  const idMap = new Map<string, PathItem>();

  for (const file of files) {
    const { sequence, shot, task, path: fullPath, name } = file;

    // Build hierarchy: Shots → Sequence → Shot → Task → File
    let pathSegments = ['Shots', sequence, shot, task];

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

export const getShotFilesTreeBuck3 = async (rootPath: string, isBuck5: boolean = true, prefix: string = "") => {
  const files = await getShotFilesBuck3(rootPath, isBuck5, prefix);

  const tree = buildPathTreeFromParsedFiles(files, isBuck5);

  return tree;
};

export const collectFolderNamesByLevelBuck3 = (tree: PathItem[], isBuck5: boolean = true): string[][] => {

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
  console.log('filters', filters);
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
        .filter(child => child !== null)
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
    .filter(node => node !== null);

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

    // Keep only the last file (latest version)
    const latestFile = files.length > 0 ? [files[files.length - 1]] : [];

    // Recursively process folders
    const processedFolders = folders.map(folder => processNode(folder));

    return {
      ...node,
      children: [...processedFolders, ...latestFile]
    };
  }

  return data.map(node => processNode(node));
}