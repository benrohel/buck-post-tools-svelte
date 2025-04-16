<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import ExportPathBuilder from './ExportPathBuilder.svelte';
  import { appStore } from '../../stores/app-store';
  import SelectFolderWeb from '../../components/SelectFolder/SelectFolderWeb.svelte';
  let projectName = '';
  let isExporting = false;
  let exportProgress = 0;
  let exportStatus = '';
  let appId = $appStore.appId;
  let exportTimer: number | null = null; // Track the timer ID

  interface ExportPreset {
    name: string;
    template: string;
  }

  interface ExportPresetConfig {
    baseFolder: string;
    exportPresets: ExportPreset[];
    saveToProjectFolder: boolean;
  }

  // Configuration for the export system
  let config: ExportPresetConfig = {
    baseFolder: '',
    exportPresets: [],
    saveToProjectFolder: true,
  };

  function handleSetOutputFolder(folderPath: string) {
    config.baseFolder = folderPath;
  }

  function startExport() {
    // First, clear any existing timer to prevent memory leaks
    if (exportTimer !== null) {
      clearInterval(exportTimer);
    }

    isExporting = true;
    exportProgress = 0;
    exportStatus = 'Preparing export...';

    // Mock export process
    exportTimer = window.setInterval(() => {
      exportProgress += 5;

      if (exportProgress < 30) {
        exportStatus = 'Creating output folders...';
      } else if (exportProgress < 60) {
        exportStatus = 'Processing compositions...';
      } else if (exportProgress < 90) {
        exportStatus = 'Rendering files...';
      } else {
        exportStatus = 'Finalizing export...';
      }

      if (exportProgress >= 100) {
        if (exportTimer !== null) {
          clearInterval(exportTimer);
          exportTimer = null;
        }
        isExporting = false;
        exportStatus = 'Export completed!';
        
        const statusTimer = setTimeout(() => {
          exportStatus = '';
        }, 3000);
        
        // Store the timeout ID as a property for cleanup
        (window as any)._exportStatusTimer = statusTimer;
      }
    }, 200);
  }
  
  // Clean up any timers when the component is destroyed
  onDestroy(() => {
    if (exportTimer !== null) {
      clearInterval(exportTimer);
    }
    
    // Clear any lingering status timeout
    if ((window as any)._exportStatusTimer) {
      clearTimeout((window as any)._exportStatusTimer);
    }
  });
</script>

<div class="export-app">
  <header>
    <h1>Export System</h1>
    <div class="app-info">
      <span class="host-app">{appId}</span>
      {#if projectName}
        <span class="project-name">| {projectName}</span>
      {/if}
    </div>
  </header>

  <main>
    <section class="base-folder">
      <h2>Base Export Folder</h2>
      <SelectFolderWeb onChange={handleSetOutputFolder} />

      <label class="checkbox-container">
        <input type="checkbox" bind:checked={config.saveToProjectFolder} />
        <span>Save in same folder as project</span>
      </label>
    </section>

    <section class="path-builder">
      <ExportPathBuilder />
    </section>

    <section class="export-options">
      <h2>Export Options</h2>

      {#if appId === 'AEFT'}
        <div class="option-group">
          <label>
            <span>Render Settings:</span>
            <select>
              <option>Best Settings</option>
              <option>Draft Settings</option>
              <option>Custom Settings</option>
            </select>
          </label>
        </div>
      {/if}

      {#if appId === 'PPRO'}
        <div class="option-group">
          <label>
            <span>Sequence Preset:</span>
            <select>
              <option>Match Sequence Settings</option>
              <option>H.264 - High Quality</option>
              <option>ProRes 422</option>
            </select>
          </label>
        </div>
      {/if}

      <div class="option-group">
        <label>
          <span>Export Scope:</span>
          <select>
            <option>Selected Items Only</option>
            <option>All Compositions</option>
            <option>Render Queue Items</option>
          </select>
        </label>
      </div>
    </section>
  </main>

  <footer>
    <div class="status">
      {#if exportStatus}
        <div class="status-message">{exportStatus}</div>
        {#if isExporting}
          <div class="progress-bar">
            <div class="progress" style="width: {exportProgress}%"></div>
          </div>
        {/if}
      {/if}
    </div>

    <div class="actions">
      <button class="secondary">Cancel</button>
      <button class="primary" on:click={startExport} disabled={isExporting}>
        {isExporting ? 'Exporting...' : 'Start Export'}
      </button>
    </div>
  </footer>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  .export-app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #2d2d2d;
    color: #e0e0e0;
  }

  /* Theme variations */
  .after-effects {
    --primary-color: #9999ff;
    --secondary-color: #6b6bce;
  }

  .premiere-pro {
    --primary-color: #9999ff;
    --secondary-color: #6b6bce;
  }

  header {
    background-color: #1a1a1a;
    padding: 10px 15px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #444;
  }

  header h1 {
    margin: 0;
    font-size: 18px;
  }

  .app-info {
    font-size: 14px;
    color: #aaa;
  }

  .host-app {
    font-weight: bold;
  }

  main {
    flex: 1;
    padding: 15px;
    overflow-y: auto;
  }

  section {
    margin-bottom: 20px;
    padding: 15px;
    background-color: #333;
    border-radius: 5px;
  }

  section h2 {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 16px;
    border-bottom: 1px solid #444;
    padding-bottom: 5px;
  }

  footer {
    background-color: #1a1a1a;
    padding: 10px 15px;
    border-top: 1px solid #444;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .folder-selector {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
  }

  .folder-selector input {
    flex: 1;
    background-color: #444;
    border: 1px solid #555;
    color: #e0e0e0;
    padding: 5px 10px;
    border-radius: 3px;
  }

  .checkbox-container {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 5px;
  }

  .option-group {
    margin-bottom: 10px;
  }

  .option-group label {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .option-group select {
    background-color: #444;
    border: 1px solid #555;
    color: #e0e0e0;
    padding: 5px 10px;
    border-radius: 3px;
    width: 200px;
  }

  button {
    background-color: #444;
    border: none;
    color: #e0e0e0;
    padding: 8px 15px;
    border-radius: 3px;
    cursor: pointer;
  }

  button:hover {
    background-color: #555;
  }

  button.primary {
    background-color: var(--primary-color, #9999ff);
    color: #000;
  }

  button.primary:hover {
    background-color: var(--secondary-color, #6b6bce);
  }

  button.secondary {
    background-color: #444;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .actions {
    display: flex;
    gap: 10px;
  }

  .status {
    flex: 1;
  }

  .status-message {
    font-size: 14px;
    margin-bottom: 5px;
  }

  .progress-bar {
    height: 5px;
    background-color: #444;
    border-radius: 2px;
    overflow: hidden;
    width: 200px;
  }

  .progress {
    height: 100%;
    background-color: var(--primary-color, #9999ff);
    transition: width 0.3s ease;
  }
</style>
