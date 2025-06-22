// BUCK Slate Generator using FFmpeg for Adobe CEP Panel
import { fs, path, child_process, os } from '../../lib/cep/node';
import Papa from 'papaparse';
import { getUserFontsFolder, getExtensionFolder } from '../files/files';
import { ffmpegPath } from '../video/video';
// Type definitions
interface SlateData {
  masterSequence?: string;
  filename?: string;
  resolution?: string;
  [key: string]: string | undefined;
}

interface Resolution {
  width: number;
  height: number;
}

interface PresetConfig {
  width: number;
  height: number;
  backgroundColor: string;
  labelColor: string;
  valueColor: string;
  fontSize: number;
  lineHeight: number;
  leftMargin: number;
  topMargin: number;
  labelValueSpacing: number;
  safeAreaPercentage: number;
  logoBottomMargin: number;
  fontPath: string;
  logoPath?: string;
  logoWidth?: number;
  logoHeight?: number;
}

interface GenerationResult {
  success: boolean;
  path?: string;
  error?: string;
  filename?: string;
}

type OutputFormat = 'image' | 'video';

class BuckSlateGenerator {
  private ffmpegPath: string;
  private presets: Record<string, PresetConfig>;
  private resolutions: Record<string, Resolution>;

  constructor() {
    this.ffmpegPath = ffmpegPath;

    // Preset configurations
    this.presets = {
      buck: {
        width: 1920,
        height: 1080,
        backgroundColor: '#000000',
        labelColor: '#808080', // Gray for labels
        valueColor: '#FFFFFF', // White for values
        fontSize: 30,
        lineHeight: 40,
        leftMargin: 0,
        topMargin: 0,
        labelValueSpacing: 250, // Space between label and value
        safeAreaPercentage: 0.9,
        logoBottomMargin: 100,
        logoHeight: 100, // Scale logo to 50px tall
        fontPath: getUserFontsFolder() + '/mabry-regular.otf',
        logoPath: getExtensionFolder() + '/assets/BUCK_WORDMARK_GREY.png',
      },
      simple: {
        width: 1920,
        height: 1080,
        backgroundColor: '#000000',
        labelColor: '#FFFFFF',
        valueColor: '#FFFFFF',
        fontSize: 60,
        lineHeight: 90,
        leftMargin: 100,
        topMargin: 100,
        labelValueSpacing: 0, // Labels and values on same line
        safeAreaPercentage: 0.9,
        logoBottomMargin: 100,
        fontPath: 'Arial.ttf',
      },
    };

    // Common broadcast resolutions
    this.resolutions = {
      '1920x1080': { width: 1920, height: 1080 },
      '1280x720': { width: 1280, height: 720 },
      '3840x2160': { width: 3840, height: 2160 },
      '4096x2160': { width: 4096, height: 2160 },
      HD: { width: 1920, height: 1080 },
      '4K': { width: 3840, height: 2160 },
      UHD: { width: 3840, height: 2160 },
    };
  }

  // Parse CSV file using PapaParse
  async parseCSV(csvPath: string): Promise<SlateData[]> {
    return new Promise((resolve, reject) => {
      const fileContent = fs.readFileSync(csvPath, 'utf8');

      Papa.parse<SlateData>(fileContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(
              new Error(`CSV parsing errors: ${JSON.stringify(results.errors)}`)
            );
          } else {
            resolve(results.data);
          }
        },
        error: (error: Error) => {
          reject(error);
        },
      });
    });
  }

  // Get resolution from string
  private getResolution(resolutionStr?: string): Resolution {
    if (!resolutionStr) {
      return this.resolutions['1920x1080']; // Default
    }

    // Check if it's a predefined resolution
    if (this.resolutions[resolutionStr]) {
      return this.resolutions[resolutionStr];
    }

    // Try to parse custom resolution (e.g., "1920x1080")
    const match = resolutionStr.match(/(\d+)x(\d+)/);
    if (match) {
      return {
        width: parseInt(match[1]),
        height: parseInt(match[2]),
      };
    }

    // Default fallback
    return this.resolutions['1920x1080'];
  }

  // Clean filename for output
  private cleanFilename(filename?: string): string {
    if (!filename) {
      return 'slate';
    }

    // Remove special characters and append _slate
    const cleaned = filename
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    return `${cleaned}_slate`;
  }

  // Generate slate using FFmpeg
  async generateSlate(
    data: SlateData,
    preset: string,
    outputPath: string
  ): Promise<void> {
    const config = this.presets[preset];
    const resolution = this.getResolution(data.resolution || '1920x1080');
    const safeWidth = resolution.width * config.safeAreaPercentage;
    const safeHeight = resolution.height * config.safeAreaPercentage;

    // Calculate positions based on resolution
    const leftMargin = (resolution.width - safeWidth) / 2 + config.leftMargin;
    const topMargin = (resolution.height - safeHeight) / 2 + config.topMargin;
    const fontSize = Math.floor(config.fontSize * (resolution.width / 1920)); // Scale font size
    const lineHeight = Math.floor(
      config.lineHeight * (resolution.height / 1080)
    );

    // Build FFmpeg command
    let filterComplex = `color=c=${config.backgroundColor}:s=${resolution.width}x${resolution.height}:d=5`;

    // Get display fields (exclude metadata fields)
    const displayFields = this.getDisplayFields(data);
    let yPosition = topMargin;

    // Add each field as label: value
    displayFields.forEach((field, index) => {
      const value = data[field];
      if (value) {
        if (config.labelValueSpacing > 0) {
          // Separate label and value positions (BUCK style)
          filterComplex += `,drawtext=text='${this.escapeText(
            field
          )}':fontcolor=${
            config.labelColor
          }:fontsize=${fontSize}:x=${leftMargin}:y=${yPosition}:fontfile=${
            config.fontPath
          }`;

          // Handle text wrapping for values
          const availableWidth =
            resolution.width -
            (leftMargin + config.labelValueSpacing) -
            leftMargin;
          const wrappedLines = this.wrapText(value, availableWidth, fontSize);

          wrappedLines.forEach((line, lineIndex) => {
            const lineY = yPosition + lineIndex * lineHeight;
            filterComplex += `,drawtext=text='${this.escapeText(
              line
            )}':fontcolor=${config.valueColor}:fontsize=${fontSize}:x=${
              leftMargin + config.labelValueSpacing
            }:y=${lineY}:fontfile=${config.fontPath}`;
          });

          yPosition += lineHeight * wrappedLines.length;
        } else {
          // Combined label: value on same line (Simple style)
          const combinedText = field + ': ' + value;
          const availableWidth = resolution.width - leftMargin * 2;
          const wrappedLines = this.wrapText(
            combinedText,
            availableWidth,
            fontSize
          );

          wrappedLines.forEach((line, lineIndex) => {
            const lineY = yPosition + lineIndex * lineHeight;
            filterComplex += `,drawtext=text='${this.escapeText(
              line
            )}':fontcolor=${
              config.valueColor
            }:fontsize=${fontSize}:x=${leftMargin}:y=${lineY}:fontfile=${
              config.fontPath
            }`;
          });

          yPosition += lineHeight * wrappedLines.length;
        }
      }
    });

    console.log('Config:', config);

    // Add logo if path is provided
    if (config.logoPath && fs.existsSync(config.logoPath)) {
      console.log('Adding logo:', config.logoPath);
      const logoY = resolution.height - config.logoBottomMargin - 100;

      // Build logo filter with optional scaling
      let logoFilter = `movie=${config.logoPath}`;
      if (config.logoWidth || config.logoHeight) {
        const width = config.logoWidth || -1; // -1 maintains aspect ratio
        const height = config.logoHeight || -1;
        logoFilter += `,scale=${width}:${height}`;
      }
      logoFilter += '[logo]';

      filterComplex += `[0:v];${logoFilter};[0:v][logo]overlay=x=${leftMargin}:y=${logoY}`;
    }

    const command = `"${this.ffmpegPath}" -y -f lavfi -i "${filterComplex}" -frames:v 1 "${outputPath}"`;

    await this.executeFFmpeg(command);
  }

  // Generate video slate with fade-in animation
  async generateVideoSlate(
    data: SlateData,
    preset: string,
    outputPath: string,
    duration: number = 5
  ): Promise<void> {
    const config = this.presets[preset];
    const resolution = this.getResolution(data.resolution);
    const safeWidth = resolution.width * config.safeAreaPercentage;
    const safeHeight = resolution.height * config.safeAreaPercentage;

    const leftMargin = (resolution.width - safeWidth) / 2 + config.leftMargin;
    const topMargin = (resolution.height - safeHeight) / 2 + config.topMargin;
    const fontSize = Math.floor(config.fontSize * (resolution.width / 1920));
    const lineHeight = Math.floor(
      config.lineHeight * (resolution.height / 1080)
    );

    let filterComplex = `color=c=${config.backgroundColor}:s=${resolution.width}x${resolution.height}:d=${duration}`;

    const displayFields = this.getDisplayFields(data);
    let yPosition = topMargin;

    // Add each field with staggered fade-in
    displayFields.forEach((field, index) => {
      const value = data[field];
      if (value) {
        const fadeDelay = index * 0.1; // Stagger fade-ins

        if (config.labelValueSpacing > 0) {
          // Separate label and value (BUCK style)
          filterComplex += `,drawtext=text='${this.escapeText(
            field
          )}':fontcolor=${
            config.labelColor
          }:fontsize=${fontSize}:x=${leftMargin}:y=${yPosition}:fontfile=${
            config.fontPath
          }:alpha='if(lt(t,${fadeDelay}),0,if(lt(t,${
            fadeDelay + 0.3
          }),(t-${fadeDelay})/0.3,1))'`;
          filterComplex += `,drawtext=text='${this.escapeText(
            value
          )}':fontcolor=${config.valueColor}:fontsize=${fontSize}:x=${
            leftMargin + config.labelValueSpacing
          }:y=${yPosition}:fontfile=${
            config.fontPath
          }:alpha='if(lt(t,${fadeDelay}),0,if(lt(t,${
            fadeDelay + 0.3
          }),(t-${fadeDelay})/0.3,1))'`;
        } else {
          // Combined label: value (Simple style)
          filterComplex += `,drawtext=text='${this.escapeText(
            field + ': ' + value
          )}':fontcolor=${
            config.valueColor
          }:fontsize=${fontSize}:x=${leftMargin}:y=${yPosition}:fontfile=${
            config.fontPath
          }:alpha='if(lt(t,${fadeDelay}),0,if(lt(t,${
            fadeDelay + 0.3
          }),(t-${fadeDelay})/0.3,1))'`;
        }

        yPosition += lineHeight;
      }
    });

    // Add logo with fade
    if (config.logoPath && fs.existsSync(config.logoPath)) {
      console.log('Adding logo:', config.logoPath);
      const logoY = resolution.height - config.logoBottomMargin - 100;
      const expandedLogoPath = config.logoPath;
      filterComplex += `[0:v];movie=${expandedLogoPath}[logo];[0:v][logo]overlay=x=${leftMargin}:y=${logoY}:enable='gte(t,0.5)'`;
    }

    const command = `${this.ffmpegPath} -y -f lavfi -i "${filterComplex}" -c:v libx264 -pix_fmt yuv420p -preset fast "${outputPath}"`;

    await this.executeFFmpeg(command);
  }

  // Get display fields in the order they appear in the data
  private getDisplayFields(data: SlateData): string[] {
    // Get all fields from the data object, preserving the order from CSV headers
    const allFields = Object.keys(data);

    // Filter out system fields that shouldn't be displayed on the slate
    const systemFields = ['masterSequence', 'filename', 'resolution'];

    return allFields.filter(
      (field) =>
        !systemFields.includes(field) &&
        !field.startsWith('{') &&
        !field.endsWith('}') &&
        data[field] !== undefined &&
        data[field] !== null &&
        data[field] !== ''
    );
  }

  // Execute FFmpeg command with support for long filter complex
  private async executeFFmpeg(
    command: string
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      console.log('Executing FFmpeg command length:', command.length);

      // Check if command is too long (> 8000 chars as a safe limit)
      if (command.length > 8000) {
        console.log('Command too long, using temp file approach');
        // Extract filter complex and write to temp file
        const filterMatch = command.match(/-f lavfi -i "(.+?)"/);
        if (filterMatch) {
          const filterComplex = filterMatch[1];
          const tempDir = path.join(process.cwd(), 'temp');

          // Create temp directory if it doesn't exist
          if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
          }

          const tempFile = path.join(tempDir, `filter_${Date.now()}.txt`);
          fs.writeFileSync(tempFile, filterComplex);

          // Create new command using filter_complex_script
          const outputMatch = command.match(/"([^"]+)"$/);
          const outputPath = outputMatch ? outputMatch[1] : 'output.png';

          const newCommand = `${this.ffmpegPath} -y -filter_complex_script "${tempFile}" -frames:v 1 "${outputPath}"`;
          console.log('Executing with temp file:', newCommand);

          child_process.exec(
            newCommand,
            { timeout: 30000 },
            (error, stdout, stderr) => {
              // Clean up temp file
              try {
                fs.unlinkSync(tempFile);
              } catch (e) {
                console.warn('Could not delete temp file:', tempFile);
              }

              if (error) {
                console.error('FFmpeg error:', error.message);
                console.error('FFmpeg stderr:', stderr);
                reject(error);
                return;
              }
              console.log('FFmpeg completed successfully');
              resolve({ stdout, stderr });
            }
          );
        } else {
          reject(new Error('Could not parse filter complex from command'));
        }
      } else {
        // Command is short enough, execute normally
        console.log(
          'Executing normal command:',
          command.substring(0, 100) + '...'
        );
        child_process.exec(
          command,
          { timeout: 30000 },
          (error, stdout, stderr) => {
            if (error) {
              console.error('FFmpeg error:', error.message);
              console.error('FFmpeg stderr:', stderr);
              reject(error);
              return;
            }
            console.log('FFmpeg completed successfully');
            resolve({ stdout, stderr });
          }
        );
      }
    });
  }

  // Escape text for FFmpeg
  private escapeText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/:/g, '\\:')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r');
  }

  // Expand tilde path
  private expandPath(path: string): string {
    return path.replace(/^~/, process.env.HOME || '');
  }

  // Set logo path for a specific preset
  setLogoPath(preset: string, logoPath: string): void {
    if (fs.existsSync(this.expandPath(logoPath))) {
      this.presets[preset].logoPath = logoPath;
    } else {
      throw new Error(`Logo file not found: ${logoPath}`);
    }
  }

  // Batch process CSV to generate slates
  async batchGenerateSlates(
    csvPath: string,
    preset: string,
    outputDir: string,
    format: OutputFormat = 'image',
    onProgress?: (current: number, total: number, filename: string) => void
  ): Promise<GenerationResult[]> {
    const data = await this.parseCSV(csvPath);
    const results: GenerationResult[] = [];

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      // Auto-populate Date field with today's date if it exists but is empty
      if ('Date' in row && (!row.Date || row.Date.trim() === '')) {
        row.Date = this.getTodaysDate();
      }

      const cleanedFilename = this.cleanFilename(row['{filename}']);
      const extension = format === 'video' ? '.mp4' : '.png';
      const outputPath = path.join(outputDir, cleanedFilename + extension);

      try {
        if (format === 'video') {
          await this.generateVideoSlate(row, preset, outputPath);
        } else {
          await this.generateSlate(row, preset, outputPath);
        }
        results.push({
          success: true,
          path: outputPath,
          filename: cleanedFilename + extension,
        });
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : String(error),
          filename: cleanedFilename + extension,
        });
      }

      // Call progress callback if provided
      if (onProgress) {
        onProgress(i + 1, data.length, cleanedFilename);
      }
    }

    return results;
  }

  // Wrap text to fit within specified width
  private wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    // Approximate character width based on font size (rough estimation)
    const avgCharWidth = fontSize * 0.6;
    const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;

      if (testLine.length <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Single word is too long, force break it
          lines.push(word);
        }
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [text];
  }

  // Get today's date in MM.DD.YYYY format
  private getTodaysDate(): string {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    return `${month}.${day}.${year}`;
  }
}

export { BuckSlateGenerator, type SlateData, type GenerationResult };
