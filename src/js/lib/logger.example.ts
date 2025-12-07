/**
 * Logger Usage Examples for Buck Post Tools CEP
 *
 * This file demonstrates how to use the centralized logger
 * to replace scattered console.log statements throughout the codebase.
 */

import { logger, logModule } from '@/lib/logger';

// ============================================================
// EXAMPLE 1: Basic logging with automatic module tagging
// ============================================================

// Before: Scattered console.log
export const oldGetClips = async () => {
  console.log('Getting clips...');
  const clips = await fetchClips();
  console.log('clips', clips);
  return clips;
};

// After: Using logger with module context
export const newGetClips = async () => {
  logger.debug('Getting clips...', { module: 'clip' });
  const clips = await fetchClips();
  logger.debug(
    'Retrieved clips',
    { module: 'clip', count: clips.length },
    clips
  );
  return clips;
};

// ============================================================
// EXAMPLE 2: Module-scoped logger (recommended pattern)
// ============================================================

// Create a module-scoped logger once at the top of your file
const log = logModule('exporter');

export const exportComposition = async (comp: any, options: any) => {
  log.debug('Starting export', { compName: comp.name, options });

  try {
    const result = await renderComp(comp, options);
    log.info('Export completed successfully', {
      compName: comp.name,
      outputPath: result.path,
    });
    return result;
  } catch (error) {
    log.error('Export failed', error as Error, {
      compName: comp.name,
      outputFolder: options.outputFolder,
    });
    throw error;
  }
};

// ============================================================
// EXAMPLE 3: Grouped logging for complex operations
// ============================================================

export const processSequence = async (sequenceId: string) => {
  const log = logModule('sequence');

  logger.group(`Processing sequence: ${sequenceId}`, true);

  log.debug('Fetching sequence data');
  const sequence = await getSequence(sequenceId);

  log.debug('Fetching clips', { clipCount: sequence.clips.length });
  const clips = await Promise.all(
    sequence.clips.map(async (clip) => {
      log.debug('Processing clip', { clipName: clip.name });
      return await processClip(clip);
    })
  );

  log.info('Sequence processing complete', {
    sequenceId,
    clipsProcessed: clips.length,
  });

  logger.groupEnd();

  return { sequence, clips };
};

// ============================================================
// EXAMPLE 4: Error handling with context
// ============================================================

export const loadProject = async (projectPath: string) => {
  const log = logModule('project');

  try {
    log.debug('Loading project', { projectPath });

    if (!fs.existsSync(projectPath)) {
      log.warn('Project path does not exist', { projectPath });
      return null;
    }

    const project = await parseProject(projectPath);
    log.info('Project loaded successfully', {
      projectName: project.name,
      version: project.version,
    });

    return project;
  } catch (error) {
    log.error('Failed to load project', error as Error, {
      projectPath,
      errorType: error instanceof SyntaxError ? 'parse' : 'unknown',
    });
    return null;
  }
};

// ============================================================
// EXAMPLE 5: Conditional logging based on data
// ============================================================

export const validateClips = (clips: any[]) => {
  const log = logModule('validation');

  log.debug('Validating clips', { count: clips.length });

  const invalid = clips.filter((clip) => !clip.filepath);

  if (invalid.length > 0) {
    log.warn(
      'Found invalid clips',
      {
        invalidCount: invalid.length,
        totalCount: clips.length,
      },
      invalid
    );
  } else {
    log.debug('All clips valid');
  }

  return invalid.length === 0;
};

// ============================================================
// MIGRATION PATTERNS
// ============================================================

// Pattern 1: Simple console.log
// Before: console.log('value', value);
// After:  logger.debug('value', { module: 'moduleName' }, value);

// Pattern 2: Console in try-catch
// Before:
//   try { ... } catch (e) { console.error('Failed', e); }
// After:
//   try { ... } catch (e) { logger.error('Failed', e, { module: 'moduleName' }); }

// Pattern 3: Debug dumps
// Before: console.log(JSON.stringify(data, null, 2));
// After:  logger.debug('Data dump', { module: 'moduleName' }, data);

// Pattern 4: Conditional logging
// Before: if (DEBUG) console.log('debug info');
// After:  logger.debug('debug info', { module: 'moduleName' });
//         // No need for if statement - automatically disabled in production!

// ============================================================
// WHAT HAPPENS IN PRODUCTION
// ============================================================

// Development mode (npm run dev):
// - All logger.debug() calls run and show in console
// - All logger.info() calls run and show in console
// - All logger.warn() calls run and show in console
// - All logger.error() calls run and show in console

// Production mode (npm run build / npm run zxp):
// - logger.debug() → COMPLETELY REMOVED by terser (zero runtime cost!)
// - logger.info() → COMPLETELY REMOVED by terser (zero runtime cost!)
// - logger.warn() → Runs and shows in console
// - logger.error() → Runs, shows in console, can send to monitoring

// Dummy functions for examples
declare function fetchClips(): Promise<any[]>;
declare function renderComp(comp: any, options: any): Promise<any>;
declare function getSequence(id: string): Promise<any>;
declare function processClip(clip: any): Promise<any>;
declare function parseProject(path: string): Promise<any>;
declare const fs: any;
