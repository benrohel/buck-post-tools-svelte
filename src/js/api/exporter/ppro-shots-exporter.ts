import { fs } from '@/lib/cep/node';
import upath from 'upath';

declare interface SequenceExporterPrefs {
  encoderPreset?: string;
  region?: number;
  sequenceOutputFolder?: string;
  version?: number;
  startExport?: boolean;
}

declare interface StillsExporterPrefs {
  stillsOutputFolder: string;
}

declare interface ShotsExporterPrefs {
  exporterPreset?: string;
  shotsOutputFolder?: string;
  version?: number;
  startExport?: boolean;
  shotExporters?: Array<ShotExport>;
}

declare interface ShotExport {
  template: string;
  encoderPreset: string;
  handles: number;
}

export const getAmePresets = async () => {};
