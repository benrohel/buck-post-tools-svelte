#!/usr/bin/env node

import { fs, path, os } from '@/lib/cep/node';
import { logModule } from '@/lib/logger';

const { parseStringPromise } = require('xml2js');
const log = logModule('fcp-xml-to-csv');
interface ClipData {
  event: number;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  shotDurationFrames: number;
  trackType: 'Video' | 'Audio';
  trackIndex: number;
  sourceFile: string;
  macFilepath: string;
  winFilepath: string;
  inPoint: number;
  outPoint: number;
  enabled: boolean;
  masterClipId: string;
  clipId: string;
  frameRate: number;
  timecodeStart: string;
  timecodeEnd: string;
  width?: number;
  height?: number;
  sampleRate?: number;
  audioChannels?: number;
  label?: string;
}

class XmemlParser {
  private clips: ClipData[] = [];
  private frameRate: number = 24; // Default frame rate
  private masterClips: Map<string, any> = new Map(); // Store master clip references
  private parsedSequences: any = null; // Store parsed sequences for reference lookup
  private eventCounter: number = 1; // Event counter starting from 1
  private processedVideoClips: Map<string, any> = new Map(); // Store processed video clips by master clip ID

  async convertXmemlToCSV(inputPath: string, outputPath?: string): Promise<void> {
    return this.convertToFCPXMLToCSV(inputPath, outputPath);
  }

  async convertXmlToJSON(inputPath: string): Promise<ClipData[]> {
    try {
      log.debug('Reading XMEML file for JSON conversion', { inputPath });

      // Read XMEML file
      const xmlContent = fs.readFileSync(inputPath, 'utf-8');
      log.debug('File read successfully', { size: xmlContent.length });

      // Parse XML with different settings
      log.debug('Parsing XML with xml2js');
      const parsedXML = await parseStringPromise(xmlContent, {
        explicitArray: false,
        mergeAttrs: true,
        explicitRoot: true,
        normalize: true,
        normalizeTags: true,
        trim: true
      });

      log.debug('XML parsed successfully');

      // Store parsed data for reference lookups
      this.parsedSequences = parsedXML;

      // Reset clips array and counters for fresh conversion
      this.clips = [];
      this.eventCounter = 1;
      this.processedVideoClips.clear();

      // Process sequences to extract clip data
      this.processSequences(parsedXML);

      log.debug('Clips extracted from XMEML', { totalClips: this.clips.length });

      return this.clips;

    } catch (error) {
      log.error('Failed to convert XMEML to JSON', error as Error, { inputPath });
      throw error;
    }
  }

  writeJSONFile(clips: ClipData[], outputPath: string): void {
    const jsonData = JSON.stringify(clips, null, 2);
    fs.writeFileSync(outputPath, jsonData, 'utf-8');
    log.debug('JSON file written', { outputPath, clipCount: clips.length });
  }

  groupClipsByName(clips: ClipData[]): Record<string, ClipData[]> {
    const grouped: Record<string, ClipData[]> = {};

    clips.forEach(clip => {
      if (!grouped[clip.name]) {
        grouped[clip.name] = [];
      }
      grouped[clip.name].push(clip);
    });

    // Sort each group by startTime for consistency
    Object.keys(grouped).forEach(name => {
      grouped[name].sort((a, b) => a.startTime - b.startTime);
    });

    log.debug('Clips grouped by name', { totalClips: clips.length, uniqueNames: Object.keys(grouped).length });
    return grouped;
  }



  async convertToFCPXMLToCSV(inputPath: string, outputPath?: string): Promise<void> {
    try {
      log.debug('Starting XMEML to CSV conversion', { inputPath });

      // Read XMEML file
      const xmlContent = fs.readFileSync(inputPath, 'utf-8');
      log.debug('File read successfully', { size: xmlContent.length });

      // Parse XML with different settings
      log.debug('Parsing XML with xml2js');
      const parsedXML = await parseStringPromise(xmlContent, {
        explicitArray: false, // Changed this
        mergeAttrs: true,    // Changed this
        explicitRoot: true,
        normalize: true,
        normalizeTags: true,
        trim: true
      });

      log.debug('XML parsed successfully', { rootKeys: Object.keys(parsedXML) });

      // Store parsed data for reference lookups
      this.parsedSequences = parsedXML;

      // Process sequences
      this.processSequences(parsedXML);

      log.debug('Sequence processing complete', { totalClips: this.clips.length });

      // Generate output path if not provided
      if (!outputPath) {
        const baseName = path.basename(inputPath, path.extname(inputPath));
        outputPath = path.join(path.dirname(inputPath), `${baseName}.csv`);
      }

      // Write CSV
      this.writeCSV(outputPath);

      console.log(`Successfully converted XMEML to CSV!`);
      console.log(`Input: ${inputPath}`);
      console.log(`Output: ${outputPath}`);
      console.log(`Processed ${this.clips.length} clips`);

    } catch (error) {
      log.error('XMEML to CSV conversion failed', error as Error, { inputPath });
      throw error;
    }
  }

  private processSequences(parsedXML: any): void {
    log.debug('Processing sequences', {
      structurePreview: JSON.stringify(parsedXML, null, 2).substring(0, 500)
    });

    const xmeml = parsedXML.xmeml;
    if (!xmeml) {
      log.debug('No xmeml root found', { availableKeys: Object.keys(parsedXML) });
      return;
    }

    // Handle both array and non-array formats
    const sequences = Array.isArray(xmeml.sequence) ? xmeml.sequence : [xmeml.sequence];
    if (!sequences || sequences.length === 0) {
      log.debug('No sequences found in xmeml', { xmemlKeys: Object.keys(xmeml) });
      return;
    }

    log.debug('Found sequences', { sequenceCount: sequences.length });

    sequences.forEach((sequence: any, index: number) => {
      if (!sequence) return;

      log.debug('Processing sequence', {
        sequenceIndex: index + 1,
        sequenceKeys: Object.keys(sequence)
      });

      // Get sequence frame rate
      if (sequence.rate && sequence.rate.timebase) {
        this.frameRate = parseInt(sequence.rate.timebase.toString());
        log.debug('Sequence frame rate detected', { frameRate: this.frameRate });
      }

      if (sequence.media) {
        this.processMedia(sequence.media);
      } else {
        log.debug('No media found in sequence', { sequenceIndex: index + 1 });
      }
    });
  }

  private processMedia(media: any): void {
    log.debug('Processing media tracks', { mediaKeys: Object.keys(media) });

    // First pass: Process only actual video tracks to store file information
    if (media.video && media.video.track) {
      const videoTracks = Array.isArray(media.video.track) ? media.video.track : [media.video.track];
      log.debug('Found video tracks', { count: videoTracks.length });

      videoTracks.forEach((track: any, trackIndex: number) => {
        // Check if this is actually an audio track by examining attributes
        const isAudioTrack = this.isAudioTrack(track);
        if (!isAudioTrack) {
          // Process only true video tracks first
          this.processTrack(track, 'Video', trackIndex + 1);
        }
      });
    }

    // Second pass: Process audio tracks (including those in video track structure)
    if (media.video && media.video.track) {
      const videoTracks = Array.isArray(media.video.track) ? media.video.track : [media.video.track];

      videoTracks.forEach((track: any, trackIndex: number) => {
        // Check if this is actually an audio track by examining attributes
        const isAudioTrack = this.isAudioTrack(track);
        if (isAudioTrack) {
          log.debug('Track identified as audio', { trackIndex: trackIndex + 1 });
          this.processTrack(track, 'Audio', trackIndex + 1);
        }
      });
    } else {
      log.debug('No video tracks found', {
        hasVideo: !!media.video,
        videoKeys: media.video ? Object.keys(media.video) : []
      });
    }

    // Process dedicated audio tracks (if they exist as separate structure)
    if (media.audio && media.audio.track) {
      const audioTracks = Array.isArray(media.audio.track) ? media.audio.track : [media.audio.track];
      log.debug('Found dedicated audio tracks', { count: audioTracks.length });

      audioTracks.forEach((track: any, trackIndex: number) => {
        this.processTrack(track, 'Audio', trackIndex + 1);
      });
    } else {
      log.debug('No dedicated audio tracks found', {
        hasAudio: !!media.audio,
        audioKeys: media.audio ? Object.keys(media.audio) : []
      });
    }
  }

  private isAudioTrack(track: any): boolean {
    // Check for audio-specific attributes in the track
    if (track.premiereTrackType === "Stereo" || track.premiereTrackType === "Mono") {
      return true;
    }

    // Check if track has audio-specific channel type
    if (track.clipitem && track.clipitem.premiereChannelType === "stereo") {
      return true;
    }

    // Check if clipitems have audio mediatype in sourcetrack
    if (track.clipitem) {
      const clipitems = Array.isArray(track.clipitem) ? track.clipitem : [track.clipitem];
      for (const clipitem of clipitems) {
        if (clipitem.sourcetrack && clipitem.sourcetrack.mediatype === "audio") {
          return true;
        }
      }
    }

    return false;
  }

  private processTrack(track: any, trackType: 'Video' | 'Audio', trackIndex: number): void {
    if (!track) {
      log.debug('Track is null/undefined', { trackType, trackIndex });
      return;
    }

    log.debug('Processing track', {
      trackType,
      trackIndex,
      trackKeys: Object.keys(track)
    });

    if (!track.clipitem) {
      log.debug('No clipitems in track', { trackType, trackIndex });
      return;
    }

    const clipitems = Array.isArray(track.clipitem) ? track.clipitem : [track.clipitem];
    log.debug('Found clipitems in track', {
      trackType,
      trackIndex,
      clipCount: clipitems.length
    });

    clipitems.forEach((clipitem: any, clipIndex: number) => {
      log.debug('Processing clipitem', { trackType, trackIndex, clipIndex: clipIndex + 1 });
      this.processClipItem(clipitem, trackType, trackIndex);
    });
  }

  private processClipItem(clipitem: any, trackType: 'Video' | 'Audio', trackIndex: number): void {
    try {
      if (!clipitem) {
        log.debug('Clipitem is null/undefined');
        return;
      }

      log.debug('Processing clipitem details', {
        clipitemKeys: Object.keys(clipitem),
        clipId: clipitem.id,
        clipName: clipitem.name
      });

      const startTime = this.framesToSeconds(parseInt(this.safeToString(clipitem.start) || '0'));
      const endTime = this.framesToSeconds(parseInt(this.safeToString(clipitem.end) || '0'));

      const inFrame = parseInt(this.safeToString(clipitem.in) || '0');
      const outFrame = parseInt(this.safeToString(clipitem.out) || '0');
      const shotDurationFrames = outFrame - inFrame;

      const clip: ClipData = {
        event: this.eventCounter++,
        name: this.safeToString(clipitem.name) || 'Unnamed Clip',
        startTime: parseFloat(startTime.toFixed(4)),
        endTime: parseFloat(endTime.toFixed(4)),
        duration: parseFloat((endTime - startTime).toFixed(4)), // Timeline duration, not source clip duration
        shotDurationFrames: shotDurationFrames,
        trackType,
        trackIndex,
        sourceFile: '',
        macFilepath: '',
        winFilepath: '',
        inPoint: parseFloat(this.framesToSeconds(inFrame).toFixed(4)),
        outPoint: parseFloat(this.framesToSeconds(outFrame).toFixed(4)),
        enabled: this.safeToString(clipitem.enabled) === 'TRUE',
        masterClipId: this.safeToString(clipitem.masterclipid) || '',
        clipId: this.safeToString(clipitem.id) || '',
        frameRate: this.frameRate,
        timecodeStart: '',
        timecodeEnd: '',
        label: ''
      };

      // Extract file information
      if (clipitem.file) {
        const file = clipitem.file;
        const pathurl = this.safeToString(file.pathurl) || '';
        clip.sourceFile = pathurl;
        clip.macFilepath = this.convertToMacFilepath(pathurl);
        clip.winFilepath = this.convertToWinFilepath(pathurl);

        // Extract timecode
        if (file.timecode && file.timecode.string) {
          clip.timecodeStart = this.safeToString(file.timecode.string) || '';

          // Calculate timecode end - add source file duration to timecode start
          if (file.duration) {
            const sourceDurationSeconds = this.framesToSeconds(parseInt(this.safeToString(file.duration) || '0'));
            clip.timecodeEnd = this.calculateTimecodeEnd(clip.timecodeStart, sourceDurationSeconds, clip.frameRate);
          }
        }

        // Extract media characteristics
        if (file.media) {
          this.extractMediaInfo(file.media, clip, trackType);
        }
      }

      // Extract label information
      if (clipitem.labels && clipitem.labels.label2) {
        clip.label = this.safeToString(clipitem.labels.label2) || '';
      }

      log.debug('Clip processed successfully', {
        clipName: clip.name,
        startTime: clip.startTime,
        endTime: clip.endTime,
        trackType
      });

      // Store video clips for reference by audio clips
      if (trackType === 'Video' && clip.masterClipId && clipitem.file) {
        log.debug('Storing video clip for master clip reference', {
          masterClipId: clip.masterClipId
        });

        // Extract audio info from the video clip's media data
        let audioSampleRate: number | undefined = undefined;
        let audioChannels: number | undefined = undefined;

        if (clipitem.file.media && clipitem.file.media.audio) {
          const audioMedia = clipitem.file.media.audio;
          if (audioMedia.samplecharacteristics && audioMedia.samplecharacteristics.samplerate) {
            audioSampleRate = parseInt(this.safeToString(audioMedia.samplecharacteristics.samplerate));
          }
          if (audioMedia.channelcount) {
            audioChannels = parseInt(this.safeToString(audioMedia.channelcount));
          }
        }

        this.processedVideoClips.set(clip.masterClipId, {
          file: clipitem.file,
          sourceFile: clip.sourceFile,
          macFilepath: clip.macFilepath,
          winFilepath: clip.winFilepath,
          shotDurationFrames: clip.shotDurationFrames,
          timecodeStart: clip.timecodeStart,
          timecodeEnd: clip.timecodeEnd,
          sampleRate: audioSampleRate,
          audioChannels: audioChannels
        });
        log.debug('Video clip data stored', {
          sourceFile: clip.sourceFile,
          masterClipId: clip.masterClipId,
          sampleRate: audioSampleRate,
          audioChannels: audioChannels
        });
      }

      // Handle audio clips that don't have direct file references
      // This must be done AFTER video clips are stored
      if (trackType === 'Audio' && !clip.sourceFile) {
        this.extractFileInfoFromReferences(clipitem, clip, trackType);
      }

      this.clips.push(clip);

    } catch (error) {
      log.warn('Failed to process clip', {
        clipId: clipitem?.id || 'unknown',
        error: String(error)
      });
      log.error('Clip processing error details', error as Error, {
        clipId: clipitem?.id
      });
    }
  }

  private extractMediaInfo(media: any, clip: ClipData, trackType: 'Video' | 'Audio'): void {
    if (!media) return;

    // Extract video info only for video tracks
    if (trackType === 'Video' && media.video && media.video.samplecharacteristics) {
      const videoChars = media.video.samplecharacteristics;
      if (videoChars.width) {
        clip.width = parseInt(this.safeToString(videoChars.width));
      }
      if (videoChars.height) {
        clip.height = parseInt(this.safeToString(videoChars.height));
      }
      if (videoChars.rate && videoChars.rate.timebase) {
        clip.frameRate = parseInt(this.safeToString(videoChars.rate.timebase));
      }
    }

    // Extract audio info only for audio tracks
    if (trackType === 'Audio' && media.audio) {
      if (media.audio.samplecharacteristics) {
        const audioChars = media.audio.samplecharacteristics;
        if (audioChars.samplerate) {
          clip.sampleRate = parseInt(this.safeToString(audioChars.samplerate));
        }
      }
      if (media.audio.channelcount) {
        clip.audioChannels = parseInt(this.safeToString(media.audio.channelcount));
      }
    }
  }

  private extractFileInfoFromReferences(clipitem: any, clip: ClipData, trackType: 'Video' | 'Audio'): void {
    // For audio clips that don't have direct file references, 
    // try to find the file info from the master clip or linked video clip

    // First, try to find linked video clip that has the file info
    if (clipitem.link) {
      const links = Array.isArray(clipitem.link) ? clipitem.link : [clipitem.link];

      for (const link of links) {
        if (link.mediatype === 'video' && link.linkclipref) {
          // Find the linked video clip and extract its file info
          const linkedClip = this.findClipById(link.linkclipref);
          if (linkedClip && linkedClip.file) {
            const pathurl = this.safeToString(linkedClip.file.pathurl) || '';
            clip.sourceFile = pathurl;
            clip.macFilepath = this.convertToMacFilepath(pathurl);
            clip.winFilepath = this.convertToWinFilepath(pathurl);

            if (linkedClip.file.timecode && linkedClip.file.timecode.string) {
              clip.timecodeStart = this.safeToString(linkedClip.file.timecode.string) || '';

              // Calculate timecode end for audio clips too
              if (linkedClip.file.duration) {
                const sourceDurationSeconds = this.framesToSeconds(parseInt(this.safeToString(linkedClip.file.duration) || '0'));
                clip.timecodeEnd = this.calculateTimecodeEnd(clip.timecodeStart, sourceDurationSeconds, clip.frameRate);
              }
            }

            if (linkedClip.file.media) {
              this.extractMediaInfo(linkedClip.file.media, clip, trackType);
            }
            break;
          }
        }
      }
    }

    // Alternative approach: try to find file info from stored video clips by matching master clip IDs
    if (!clip.sourceFile && clip.masterClipId) {
      log.debug('Looking for stored video clip by master clip ID', {
        masterClipId: clip.masterClipId,
        availableIds: Array.from(this.processedVideoClips.keys())
      });
      const storedVideoClip = this.processedVideoClips.get(clip.masterClipId);
      if (storedVideoClip) {
        log.debug('Found stored video clip', {
          masterClipId: clip.masterClipId,
          sourceFile: storedVideoClip.sourceFile,
          sampleRate: storedVideoClip.sampleRate,
          audioChannels: storedVideoClip.audioChannels
        });
        clip.sourceFile = storedVideoClip.sourceFile;
        clip.macFilepath = storedVideoClip.macFilepath;
        clip.winFilepath = storedVideoClip.winFilepath;
        clip.shotDurationFrames = storedVideoClip.shotDurationFrames;
        clip.timecodeStart = storedVideoClip.timecodeStart;
        clip.timecodeEnd = storedVideoClip.timecodeEnd;

        // For audio tracks, copy the audio information
        if (trackType === 'Audio') {
          clip.sampleRate = storedVideoClip.sampleRate;
          clip.audioChannels = storedVideoClip.audioChannels;
          log.debug('Applied audio info to audio clip', {
            sampleRate: clip.sampleRate,
            channels: clip.audioChannels
          });
        }
      } else {
        log.debug('No stored video clip found for master clip ID', {
          masterClipId: clip.masterClipId
        });
      }
    }

    // If still no file info, try using the master clip name as source file
    if (!clip.sourceFile && clip.name) {
      clip.sourceFile = clip.name;
    }
  }

  private findClipById(clipId: string): any {
    // Search through all parsed sequences to find a clip by ID
    if (!this.parsedSequences) return null;

    const xmeml = this.parsedSequences.xmeml;
    if (!xmeml) return null;

    const sequences = Array.isArray(xmeml.sequence) ? xmeml.sequence : [xmeml.sequence];

    for (const sequence of sequences) {
      if (!sequence || !sequence.media || !sequence.media.video) continue;

      const videoTracks = Array.isArray(sequence.media.video.track) ?
        sequence.media.video.track : [sequence.media.video.track];

      for (const track of videoTracks) {
        if (!track || !track.clipitem) continue;

        const clipitems = Array.isArray(track.clipitem) ? track.clipitem : [track.clipitem];

        for (const clipitem of clipitems) {
          if (clipitem.id === clipId) {
            return clipitem;
          }
        }
      }
    }

    return null;
  }

  private findClipByMasterClipId(masterClipId: string, trackType: 'Video' | 'Audio'): any {
    // Search through all parsed sequences to find a clip by master clip ID and track type
    if (!this.parsedSequences) return null;

    const xmeml = this.parsedSequences.xmeml;
    if (!xmeml) return null;

    const sequences = Array.isArray(xmeml.sequence) ? xmeml.sequence : [xmeml.sequence];

    for (const sequence of sequences) {
      if (!sequence || !sequence.media || !sequence.media.video) continue;

      const videoTracks = Array.isArray(sequence.media.video.track) ?
        sequence.media.video.track : [sequence.media.video.track];

      for (const track of videoTracks) {
        if (!track || !track.clipitem) continue;

        // Check if this is an audio track based on attributes
        const isAudioTrack = this.isAudioTrack(track);
        if ((trackType === 'Audio' && !isAudioTrack) || (trackType === 'Video' && isAudioTrack)) {
          continue; // Skip if track type doesn't match what we're looking for
        }

        const clipitems = Array.isArray(track.clipitem) ? track.clipitem : [track.clipitem];

        for (const clipitem of clipitems) {
          if (clipitem.masterclipid === masterClipId) {
            return clipitem;
          }
        }
      }
    }

    return null;
  }

  private safeToString(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'object' && value.toString) {
      return value.toString();
    }
    return String(value);
  }

  private framesToSeconds(frames: number): number {
    return frames / this.frameRate;
  }

  private secondsToTimecode(seconds: number, frameRate: number = this.frameRate): string {
    const totalFrames = Math.round(seconds * frameRate);

    const hours = Math.floor(totalFrames / (frameRate * 3600));
    const minutes = Math.floor((totalFrames % (frameRate * 3600)) / (frameRate * 60));
    const secs = Math.floor((totalFrames % (frameRate * 60)) / frameRate);
    const frames = totalFrames % frameRate;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  }

  private calculateTimecodeEnd(timecodeStart: string, durationSeconds: number, frameRate: number): string {
    if (!timecodeStart) return '';

    // Parse timecode start (HH:MM:SS:FF)
    const parts = timecodeStart.split(':');
    if (parts.length !== 4) return '';

    const startHours = parseInt(parts[0]);
    const startMinutes = parseInt(parts[1]);
    const startSeconds = parseInt(parts[2]);
    const startFrames = parseInt(parts[3]);

    // Convert start timecode to total frames
    const startTotalFrames = (startHours * 3600 + startMinutes * 60 + startSeconds) * frameRate + startFrames;

    // Add duration in frames
    const durationFrames = Math.round(durationSeconds * frameRate);
    const endTotalFrames = startTotalFrames + durationFrames - 1; // Subtract 1 to get last frame, not frame after

    // Convert back to timecode
    const endHours = Math.floor(endTotalFrames / (frameRate * 3600));
    const endMinutes = Math.floor((endTotalFrames % (frameRate * 3600)) / (frameRate * 60));
    const endSecs = Math.floor((endTotalFrames % (frameRate * 60)) / frameRate);
    const endFrames = endTotalFrames % frameRate;

    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:${endSecs.toString().padStart(2, '0')}:${endFrames.toString().padStart(2, '0')}`;
  }

  private extractFileName(pathurl: string): string {
    if (!pathurl) return '';

    // Remove file://localhost prefix and decode URI
    const cleanPath = pathurl.replace(/^file:\/\/localhost\//, '/').replace(/^file:\/\//, '');

    try {
      const decodedPath = decodeURIComponent(cleanPath);
      return path.basename(decodedPath);
    } catch (error) {
      return path.basename(cleanPath);
    }
  }

  private convertToMacFilepath(pathurl: string): string {
    if (!pathurl) return '';

    // Remove file://localhost/System/Volumes/Data prefix
    let cleanPath = pathurl.replace(/^file:\/\/localhost\/System\/Volumes\/Data/, '');

    // If it doesn't start with /, add it
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }

    try {
      return decodeURIComponent(cleanPath);
    } catch (error) {
      return cleanPath;
    }
  }

  private convertToWinFilepath(pathurl: string): string {
    if (!pathurl) return '';

    // First get the Mac filepath
    const macPath = this.convertToMacFilepath(pathurl);

    // Convert to Windows path: replace / with \\ 
    let winPath = macPath.replace(/\//g, '\\');

    // For Windows UNC paths, we want to keep the leading \\ 
    // So if it starts with \, make sure it starts with \\
    if (winPath.startsWith('\\') && !winPath.startsWith('\\\\')) {
      winPath = '\\' + winPath;
    }

    return winPath;
  }

  private writeCSV(outputPath: string): void {
    const headers = [
      'Event',
      'Clip Name',
      'Start Time (s)',
      'End Time (s)',
      'Duration (s)',
      'Duration Timecode',
      'Shot Duration (f)',
      'Track Type',
      'Track Index',
      'Source File',
      'MAC filepath',
      'WIN filepath',
      'In Point (s)',
      'Out Point (s)',
      'Enabled',
      'Master Clip ID',
      'Clip ID',
      'Frame Rate',
      'Timecode Start',
      'Timecode End',
      'Width',
      'Height',
      'Sample Rate',
      'Audio Channels',
      'Label'
    ];

    const csvRows = [headers.join(',')];

    this.clips.forEach(clip => {
      const row = [
        clip.event.toString(),
        this.escapeCsvField(clip.name),
        clip.startTime.toFixed(3),
        clip.endTime.toFixed(3),
        clip.duration.toFixed(3),
        this.secondsToTimecode(clip.duration, clip.frameRate),
        clip.shotDurationFrames.toString(),
        clip.trackType,
        clip.trackIndex.toString(),
        this.escapeCsvField(clip.sourceFile),
        this.escapeCsvField(clip.macFilepath),
        this.escapeCsvField(clip.winFilepath),
        clip.inPoint.toFixed(4),
        clip.outPoint.toFixed(4),
        clip.enabled.toString(),
        this.escapeCsvField(clip.masterClipId),
        this.escapeCsvField(clip.clipId),
        clip.frameRate.toString(),
        this.escapeCsvField(clip.timecodeStart),
        this.escapeCsvField(clip.timecodeEnd),
        clip.width?.toString() || '',
        clip.height?.toString() || '',
        clip.sampleRate?.toString() || '',
        clip.audioChannels?.toString() || '',
        this.escapeCsvField(clip.label || '')
      ];
      csvRows.push(row.join(','));
    });

    fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf-8');
  }

  private escapeCsvField(field: string): string {
    if (typeof field !== 'string') {
      field = String(field);
    }

    // Escape fields containing commas, quotes, or newlines
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }

    return field;
  }
}

// CLI interface
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node xmeml-converter.js <input.xml> [output] [--json] [--group]');
    console.log('');
    console.log('Convert Final Cut Pro Legacy XML (XMEML) files to CSV or JSON format');
    console.log('');
    console.log('Arguments:');
    console.log('  input.xml      Path to input XMEML file');
    console.log('  output         Optional path to output file');
    console.log('                 (defaults to same name as input with .csv/.json extension)');
    console.log('');
    console.log('Options:');
    console.log('  --json         Output as JSON instead of CSV');
    console.log('  --group        Group JSON items by clip name (only works with --json)');
    console.log('');
    console.log('Examples:');
    console.log('  node xmeml-converter.js input.xml                     # Output to input.csv');
    console.log('  node xmeml-converter.js input.xml output.csv          # Output to output.csv');
    console.log('  node xmeml-converter.js input.xml --json              # Output to input.json');
    console.log('  node xmeml-converter.js input.xml --json --group      # Output grouped JSON');
    console.log('  node xmeml-converter.js input.xml output.json --json --group  # Output grouped JSON to file');
    console.log('');
    console.log('Note: This converter supports Legacy Final Cut Pro XML (XMEML) format,');
    console.log('      not the newer Final Cut Pro X XML (FCPXML) format.');
    process.exit(1);
  }

  const inputPath = args[0];
  const isJsonOutput = args.includes('--json');
  const shouldGroup = args.includes('--group');
  let outputPath = args.find(arg => arg !== inputPath && !arg.startsWith('--'));

  // Validate arguments
  if (shouldGroup && !isJsonOutput) {
    console.error('Error: --group option can only be used with --json');
    process.exit(1);
  }

  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file "${inputPath}" does not exist`);
    process.exit(1);
  }

  // Generate output path if not provided
  if (!outputPath) {
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const extension = isJsonOutput ? '.json' : '.csv';
    outputPath = path.join(path.dirname(inputPath), `${baseName}${extension}`);
  }

  try {
    const parser = new XmemlParser();

    if (isJsonOutput) {
      const clips = await parser.convertXmlToJSON(inputPath);

      if (shouldGroup) {
        const groupedClips = parser.groupClipsByName(clips);
        const jsonData = JSON.stringify(groupedClips, null, 2);
        fs.writeFileSync(outputPath, jsonData, 'utf-8');
        console.log(`Successfully converted XMEML to grouped JSON!`);
        console.log(`Input: ${inputPath}`);
        console.log(`Output: ${outputPath}`);
        console.log(`Processed ${clips.length} clips into ${Object.keys(groupedClips).length} groups`);
      } else {
        parser.writeJSONFile(clips, outputPath);
        console.log(`Successfully converted XMEML to JSON!`);
        console.log(`Input: ${inputPath}`);
        console.log(`Output: ${outputPath}`);
        console.log(`Processed ${clips.length} clips`);
      }
    } else {
      await parser.convertToFCPXMLToCSV(inputPath, outputPath);
    }
  } catch (error) {
    console.error('Conversion failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { XmemlParser, type ClipData };