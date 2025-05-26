<script lang="ts">
  import { onMount } from 'svelte';
  import {
    BuckSlateGenerator,
    type SlateData,
    type GenerationResult,
  } from '../../api/slates/slate-generator';
  import { Download, FileText, Images } from 'lucide-svelte';
  import { SyncLoader } from 'svelte-loading-spinners';
  import { Tooltip } from '@svelte-plugins/tooltips';
  import { appStore } from '../../stores/app-store';
  import { notifications } from '../../stores/notifications-store';
  import SelectFile from '../../components/SelectFolder/SelectFile.svelte';
  import Papa from 'papaparse';
  import { fs, path } from '../../lib/cep/node';
  import { evalES } from '../../lib/utils/bolt';
  import MenuSelect from '../../components/MultiSelect/MenuSelect.svelte';
  import FolderSelect from '../../components/SelectFolder/SelectFolderWeb.svelte';
  import { localAppStore } from '../../stores/local-storage';
  import buckLogo from '../../../assets/BUCK_WORDMARK_WHITE.png';
  // Component state
  let selectedPreset: { label: string; value: string } = {
    label: 'BUCK Preset',
    value: 'buck',
  };
  let csvFilePath = '';
  let csvData: any[] = [];
  let slateGenerator: BuckSlateGenerator;
  let generatedSlates: GenerationResult[] = [];
  let isLoading = false;
  let isGenerating = false;
  let hoveredSlate: any = null;
  let mousePosition = { x: 0, y: 0 };
  let rootFolder = '';

  // Preset options
  const presetOptions = [
    { label: 'BUCK Preset', value: 'buck' },
    { label: 'Simple Preset', value: 'simple' },
  ];

  // Initialize slate generator
  onMount(() => {
    slateGenerator = new BuckSlateGenerator();
    if ($appStore.lastSlateCSV) {
      csvFilePath = $appStore.lastSlateCSV;
      loadCSVDataFromFile(csvFilePath);
    }
    if ($appStore.lastSlateFolder) {
      rootFolder = $appStore.lastSlateFolder;
    }
  });

  // Handle CSV file selection
  const handleCSVFileChange = async (filepaths: string[]) => {
    const file = filepaths[0];

    if (file) {
      try {
        csvFilePath = file;
        await loadCSVDataFromFile(file);
        appStore.update((store) => ({
          ...store,
          lastSlateCSV: file,
        }));
        localAppStore.update((store) => ({
          ...store,
          lastSlateCSV: file,
        }));
      } catch (error) {
        console.error('Error processing CSV file:', error);
        notifications.error('Failed to process CSV file', 2000);
      }
    }
  };

  // Load and parse CSV data from file object
  const loadCSVDataFromFile = (file: string) => {
    try {
      isLoading = true;
      const csvContent = fs.readFileSync(file, 'utf-8');

      Papa.parse(csvContent, {
        header: true,
        complete: (results) => {
          csvData = results.data.filter((row) =>
            Object.values(row).some((val) => val !== '')
          );
          console.log('Loaded CSV data:', csvData);
          notifications.success(`Loaded ${csvData.length} rows from CSV`, 2000);
        },
        error: (error: any) => {
          console.error('CSV parsing error:', error);
          notifications.error('Failed to parse CSV file', 2000);
        },
      });
    } catch (error) {
      console.error('Error loading CSV:', error);
      notifications.error('Failed to load CSV file', 2000);
    } finally {
      isLoading = false;
    }
  };

  // Convert image to base64 data URL for CEP panel compatibility
  const imageToDataUrl = async (imagePath: string): Promise<string> => {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64 = imageBuffer.toString('base64');
      const ext = path.extname(imagePath).toLowerCase();

      let mimeType = 'image/png'; // default
      if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.gif') mimeType = 'image/gif';
      else if (ext === '.webp') mimeType = 'image/webp';

      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Error converting image to data URL:', error);
      throw error;
    }
  };

  // Process generated slates and convert to data URLs
  const processGeneratedSlates = async (slates: any[]) => {
    const processedSlates = [];

    for (const slate of slates) {
      try {
        const dataUrl = await imageToDataUrl(slate.path);
        processedSlates.push({
          ...slate,
          path: slate.path, // Keep original path
          previewUrl: dataUrl, // Add data URL for display
        });
      } catch (error) {
        console.error('Failed to process slate:', slate.path);
        // Keep original slate even if conversion fails
        processedSlates.push(slate);
      }
    }

    return processedSlates;
  };

  // Generate slates from CSV data
  const handleGenerateSlates = async () => {
    if (!csvData.length) {
      notifications.warning('Please select a CSV file first', 2000);
      return;
    }

    try {
      isGenerating = true;
      console.log('Generating slates with preset:', selectedPreset.value);

      const results = await slateGenerator.batchGenerateSlates(
        csvFilePath,
        selectedPreset.value,
        rootFolder,
        'image'
      );
      console.log('Generated slates:', results);
      generatedSlates = await processGeneratedSlates(results);

      notifications.success(
        `Generated ${results.length} slates successfully`,
        2000
      );
    } catch (error) {
      console.error('Error generating slates:', error);
      notifications.error('Failed to generate slates', 2000);
    } finally {
      isGenerating = false;
    }
  };

  const handleGenerateSlate = async (slate: SlateData) => {
    console.log(slate);
    if (!slate['{filename}']) {
      notifications.warning('Please select a slate first', 2000);
      return;
    }

    try {
      isGenerating = true;
      console.log('Generating slate with preset:', selectedPreset.value);
      const data: SlateData = {
        filename: slate['{filename}'],
        resolution: slate.resolution,
        masterSequence: slate.masterSequence,
      };
      const slateFilepath = `${rootFolder}/${slate['{filename}']
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')}.png`;

      const result = await slateGenerator.generateSlate(
        data,
        selectedPreset.value,
        slateFilepath
      );
      if (fs.existsSync(slateFilepath)) {
        notifications.success(
          `Generated ${slate['{filename}']} successfully`,
          2000
        );
      }
    } catch (error) {
      console.error('Error generating slate:', error);
      notifications.error('Failed to generate slate', 2000);
    } finally {
      isGenerating = false;
    }
  };

  // Clear generated slates
  const handleClearSlates = () => {
    generatedSlates = [];
    csvData = [];
    csvFilePath = '';
  };

  // Get file name from path
  const getFileName = (filePath: string) => {
    return filePath.split('/').pop() || filePath;
  };

  // Create data URL from file path for image preview (CEP compatible)
  const createFileUrl = (filePath: string) => {
    if (!filePath) return null;

    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.warn('File does not exist:', filePath);
        return null;
      }

      // Read file as binary data
      const fileData = fs.readFileSync(filePath);

      // Convert to base64
      const base64Data = fileData.toString('base64');

      // Determine MIME type based on file extension
      const ext = path.extname(filePath).toLowerCase();
      let mimeType = 'image/png'; // default

      switch (ext) {
        case '.jpg':
        case '.jpeg':
          mimeType = 'image/jpeg';
          break;
        case '.png':
          mimeType = 'image/png';
          break;
        case '.gif':
          mimeType = 'image/gif';
          break;
        case '.webp':
          mimeType = 'image/webp';
          break;
        case '.svg':
          mimeType = 'image/svg+xml';
          break;
      }

      // Create data URL
      return `data:${mimeType};base64,${base64Data}`;
    } catch (error) {
      console.error('Error creating data URL:', error);
      return null;
    }
  };

  // Handle image load errors
  const handleImageError = (event: Event, slate: any) => {
    console.error('Failed to load image:', slate.path);
    const target = event.target as HTMLImageElement;
    target.src = buckLogo;
  };

  const handleSetOutputFolder = async (folderPath: string) => {
    if (folderPath) {
      rootFolder = folderPath;
      appStore.update((store) => ({
        ...store,
        lastSlateFolder: folderPath,
      }));
      localAppStore.update((store) => ({
        ...store,
        lastSlateFolder: folderPath,
      }));
    }
  };

  const handleImportClip = (slate: any) => {
    let importOptions = {
      filePaths: [slate.path],
    };

    evalES(
      `importSlatesToSelectedBin(${JSON.stringify(importOptions.filePaths)})`
    ).then((res) => {
      res ? true : false;
    });
  };

  const handleImportSlates = () => {
    let importOptions = {
      filePaths: generatedSlates.map((slate) => slate.path),
    };

    evalES(
      `importSlatesToSelectedBin(${JSON.stringify(importOptions.filePaths)})`
    ).then((res) => {
      if (res) {
        notifications.success(
          `${importOptions.filePaths.length} Slates imported successfully`,
          2000
        );
      } else {
        notifications.error('Failed to import slates', 2000);
      }
    });
  };

  // Handle mouse movement for preview positioning
  const handleMouseMove = (event: MouseEvent) => {
    mousePosition = { x: event.clientX, y: event.clientY };
  };
</script>

<div class="slates-container">
  <!-- Header Controls -->
  <div class="slates-header">
    <div class="controls-row">
      <!-- Preset Selector -->
      <div class="control-group">
        <label for="preset-select">Preset:</label>
        <MenuSelect
          items={presetOptions.map((option) => ({
            label: option.label,
            value: option.value,
          }))}
          bind:value={selectedPreset}
          onChange={() => {}}
        />
      </div>

      <!-- CSV File Selector -->
      <div class="control-group" style="flex: 1;">
        <SelectFile
          label="CSV File"
          filter=".csv"
          value={csvFilePath}
          allowMultiples={false}
          onChange={handleCSVFileChange}
        />
      </div>

      <!-- Action Buttons -->
    </div>
    <div
      style="display:flex; flex-direction:row; align-items: center; justify-content: space-between; margin-bottom: 4px; gap:20px"
    >
      <label for="output-folder">Slate Folder:</label>
      <FolderSelect onChange={handleSetOutputFolder} value={rootFolder} />
      <div class="action-buttons">
        <Tooltip
          action={$appStore.showTooltips ? 'hover' : 'none'}
          content="Generate slates from CSV data"
          position="bottom"
          delay={1000}
        >
          <button
            class="icon active"
            on:click={handleGenerateSlates}
            disabled={!csvData.length || isGenerating}
          >
            {#if isGenerating}
              <SyncLoader color="#adadad" size="16" />
            {:else}
              <Images size="16" />
            {/if}
          </button>
        </Tooltip>
      </div>
    </div>

    <!-- Status Info -->
    <div class="status-row">
      <div class="status-info">
        {#if generatedSlates.length > 0}
          <span class="status-text">{generatedSlates.length} slates</span>
        {/if}
      </div>

      {#if isLoading}
        <div class="loading-indicator">
          <SyncLoader color="#adadad" size="20" />
          <span>Loading CSV...</span>
        </div>
      {/if}
    </div>
  </div>

  <!-- Slates Headers -->
  {#if isLoading}
    <div
      style="display:flex; flex-direction:row; justify-content:center; align-items:center; padding: 8px;"
    >
      <SyncLoader color="#adadad" size="28" />
    </div>
  {/if}

  <!-- Slates List -->
  <div
    class="ingest-shot-row"
    style="background-color: #161616; height:24px; padding-left: 4px; padding-right: 4px"
  >
    <div
      style="display:flex; flex-direction:row ; gap:4px; align-items:center; justify-self:start;"
    >
      <p class="clip-name-header">PREVIEW</p>
    </div>
    <p>NAME</p>
    <div
      style="display:flex; flex-direction:row; justify-content:flex-end; margin-right: 8px;"
    >
      <Tooltip
        action={$appStore.showTooltips ? 'hover' : 'none'}
        content="Import All Clips"
        position="left"
        delay={1000}
      >
        <button
          class="icon active"
          disabled={!generatedSlates.length}
          on:click={handleImportSlates}
        >
          <Download />
        </button>
      </Tooltip>
    </div>
  </div>
  <div class="slates-list-container">
    {#if generatedSlates.length > 0}
      <div class="slates-list">
        {#each generatedSlates as slate, index}
          <div class="slate-item">
            <div class="slate-preview">
              <div
                class="slate-thumbnail"
                on:mouseenter={() => (hoveredSlate = slate)}
                on:mouseleave={() => (hoveredSlate = null)}
                on:mousemove={handleMouseMove}
              >
                <img
                  src={createFileUrl(slate.path) ?? buckLogo}
                  alt="Slate preview"
                  on:error={(event) => handleImageError(event, slate)}
                  loading="lazy"
                />
              </div>
              <div class="slate-info">
                <div class="slate-name">{getFileName(slate.path)}</div>
                <!-- <div class="slate-path">{slate.path}</div> -->
              </div>
            </div>
            <div class="slate-actions">
              <button
                class="icon"
                on:click={() => handleImportClip(slate)}
                disabled={!slate.path}
              >
                <Download size="14" />
              </button>
            </div>
          </div>
        {/each}
      </div>
    {:else if csvData.length > 0 && !isGenerating}
      <div class="empty-state">
        <Images size="48" color="#666" />
        <h3>Ready to Generate {csvData.length} Slates</h3>
        <p>Click the generate button to create slates from your CSV data</p>
      </div>
    {:else}
      <div class="empty-state">
        <FileText size="48" color="#666" />
        <h3>No CSV File Selected</h3>
        <p>Select a CSV file to get started with slate generation</p>
      </div>
    {/if}
  </div>

  <!-- Hover Preview -->
  {#if hoveredSlate}
    <div
      class="hover-preview"
      style="left: {mousePosition.x + 20}px; top: {mousePosition.y - 150}px;"
    >
      <img
        src={hoveredSlate.previewUrl || createFileUrl(hoveredSlate.path)}
        alt="Slate preview"
        loading="lazy"
      />
    </div>
  {/if}
</div>

<style lang="scss">
  @use '../../variables.scss' as *;

  .slates-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    gap: 2px;
  }

  .controls-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .control-group {
    display: flex;
    align-items: center;
    gap: 8px;

    label {
      color: $font;
      font-size: 12px;
      white-space: nowrap;
    }

    select {
      background-color: #2a2a2a;
      border: 1px solid #444;
      color: $font;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;

      &:focus {
        outline: none;
        border-color: $active;
      }
    }
  }

  .ingest-shot-row {
    grid-template-columns: 2fr 8fr 1fr;
    padding: 0px;
  }

  .file-input {
    background-color: #2a2a2a;
    border: 1px solid #444;
    color: $font;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background-color: #333;
      border-color: $active;
    }

    &:focus {
      outline: none;
      border-color: $active;
    }

    &::file-selector-button {
      background-color: #444;
      border: none;
      color: $font;
      padding: 4px 8px;
      border-radius: 2px;
      margin-right: 8px;
      cursor: pointer;
      font-size: 11px;

      &:hover {
        background-color: #555;
      }
    }
  }

  .slate-preview {
    display: flex;
    gap: 4px;
    align-items: center;
    padding-right: 4px;
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }

  .status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .status-info {
    display: flex;
    gap: 16px;
  }

  .status-text {
    color: #888;
    font-size: 11px;
  }

  .loading-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #888;
    font-size: 11px;
  }

  .slates-list-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0 0px;
    max-height: calc(100vh - 180px);

    // &::-webkit-scrollbar {
    //   width: 8px;
    // }

    // &::-webkit-scrollbar-track {
    //   background: #1a1a1a;
    //   border-radius: 4px;
    // }

    // &::-webkit-scrollbar-thumb {
    //   background: #444;
    //   border-radius: 4px;

    //   &:hover {
    //     background: #555;
    //   }
    // }
  }

  .slates-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-height: min-content;
  }

  .slate-item {
    display: flex;
    height: 30px;
    gap: 4px;
    background-color: #1a1a1a;
    border: 1px solid #333;
    border-radius: 4px;
    overflow: hidden;
    transition: all 0.2s ease;
    align-items: center;
    padding-right: 4px;
    justify-content: space-between;

    &:hover {
      border-color: $active;
      transform: translateY(-2px);
    }
  }

  .slate-thumbnail {
    max-width: 80px;
    height: 30px;
    flex-shrink: 0;
    overflow: hidden;
    background-color: #000;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  }

  .slate-info {
    padding: 4px;
  }

  .slate-name {
    color: $font;
    font-size: x-small;
    margin: 0 0 4px 0;
    white-space: wrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .slate-path {
    color: #888;
    font-size: 11px;
    margin: 0 0 4px 0;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 300px;
    text-align: center;
    color: #666;

    h3 {
      margin: 16px 0 8px 0;
      font-size: 18px;
    }

    p {
      margin: 0;
      font-size: 14px;
      opacity: 0.8;
    }
  }

  p {
    margin: 2px;
  }

  .hover-preview {
    position: absolute;
    z-index: 1000;
    background-color: #1a1a1a;
    padding: 8px;
    border-radius: 4px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);

    img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  }

  .ingest-shot-row {
    padding: 2px;
    padding-right: 8px;
  }
</style>
