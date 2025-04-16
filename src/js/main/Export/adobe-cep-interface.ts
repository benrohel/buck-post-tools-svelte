/**
 * Adobe CEP Interface for Export System
 *
 * This file provides the interface between the Svelte frontend and Adobe CEP.
 * It handles communication with the host application (Premiere Pro or After Effects).
 */

// Types for path tokens
export type TokenType =
  | 'comp' // Composition/Sequence name
  | 'project_version' // Project version
  | 'version' // Item version
  | 'frame' // Frame number
  | 'task' // Task name
  | 'ext'; // File extension

// Path structure item
export interface PathItem {
  type: 'folder' | 'file';
  name: string;
  exporter?: string;
}

// Export preset
export interface ExportPreset {
  id: string;
  name: string;
  format: string;
  extension: string;
  settings: Record<string, any>;
}

// Configuration
export interface ExportConfig {
  baseFolder: string;
  pathStructure: PathItem[];
  exportPresets: ExportPreset[];
  saveToProjectFolder: boolean;
}

// Export item
export interface ExportItem {
  id: string;
  name: string;
  type: 'composition' | 'sequence';
  duration: number;
  framerate: number;
  resolution: {
    width: number;
    height: number;
  };
}

// Host application detection
export async function detectHostApplication(): Promise<
  'Premiere Pro' | 'After Effects' | 'Unknown'
> {
  try {
    // Actual implementation would use the CEP bridge
    // return await evalScript('$.getHostEnvironment().appName');

    // Mock implementation for development
    return new Promise((resolve) => {
      setTimeout(() => {
        // This would be replaced with actual CEP detection
        const mockApps = ['Premiere Pro', 'After Effects'];
        resolve(
          mockApps[Math.floor(Math.random() * mockApps.length)] as
            | 'Premiere Pro'
            | 'After Effects'
        );
      }, 100);
    });
  } catch (error) {
    console.error('Failed to detect host application:', error);
    return 'Unknown';
  }
}

// Get project information
export async function getProjectInfo() {
  try {
    // Actual implementation would use the CEP bridge
    // For After Effects: return await evalScript('app.project.file ? app.project.file.name : "Untitled Project"');
    // For Premiere Pro: return await evalScript('app.project.name');

    // Mock implementation for development
    return new Promise((resolve) => {
      setTimeout(() => {
        const hostApp = Math.random() > 0.5 ? 'After Effects' : 'Premiere Pro';
        const projectName =
          hostApp === 'After Effects' ? 'Project.aep' : 'Sequence.prproj';
        resolve({
          name: projectName,
          path: `/Users/username/Documents/${projectName}`,
          saved: true,
        });
      }, 100);
    });
  } catch (error) {
    console.error('Failed to get project information:', error);
    return {
      name: 'Unknown Project',
      path: '',
      saved: false,
    };
  }
}

// // Get exportable items from the project
// export async function getExportableItems(): Promise<ExportItem[]> {
//   try {
//     // Actual implementation would use the CEP bridge
//     // For After Effects: would get all compositions
