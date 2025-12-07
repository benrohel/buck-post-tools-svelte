# File Logging Implementation Plan

## Overview
Add persistent file logging to the Buck Post Tools logger, writing logs to the user's Library/Logs folder on Mac and AppData on Windows.

## Log File Location

### macOS
```
/Users/{username}/Library/Logs/Buck-Post-Tools/
  ├── buck-post-tools-{date}.log       # Daily rotating logs
  ├── buck-post-tools-error-{date}.log # Error-only logs
  └── buck-post-tools-latest.log       # Symlink to current log
```

### Windows
```
C:\Users\{username}\AppData\Local\Buck-Post-Tools\Logs\
  ├── buck-post-tools-{date}.log
  ├── buck-post-tools-error-{date}.log
  └── buck-post-tools-latest.log
```

## Implementation Requirements

### 1. Path Resolution
```typescript
import { fs, os, path } from '@/lib/cep/node';
import pkg from '../../../package.json';

private getLogDirectory(): string {
  const homeDir = os.homedir();

  if (os.platform() === 'darwin') {
    // macOS: ~/Library/Logs/Buck-Post-Tools
    return path.join(homeDir, 'Library', 'Logs', 'Buck-Post-Tools');
  } else if (os.platform() === 'win32') {
    // Windows: ~\AppData\Local\Buck-Post-Tools\Logs
    return path.join(homeDir, 'AppData', 'Local', 'Buck-Post-Tools', 'Logs');
  } else {
    // Linux fallback: ~/.local/share/Buck-Post-Tools/logs
    return path.join(homeDir, '.local', 'share', 'Buck-Post-Tools', 'logs');
  }
}

private getLogFilePath(type: 'general' | 'error' = 'general'): string {
  const logDir = this.getLogDirectory();
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const filename = type === 'error'
    ? `buck-post-tools-error-${date}.log`
    : `buck-post-tools-${date}.log`;

  // Ensure directory exists
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  return path.join(logDir, filename);
}
```

### 2. Log File Format

**Structured JSON Lines Format** (recommended for parsing):
```json
{"timestamp":"2025-12-06T22:30:45.123Z","level":"ERROR","app":"AEFT","module":"clip","message":"Failed to export clip","error":"Error: File not found","context":{"clipId":"abc123","outputPath":"/path/to/file"},"stack":"Error: File not found\n  at ..."}
```

**Human-Readable Format** (alternative):
```
[2025-12-06T22:30:45.123Z] [AEFT] [ERROR] [clip] Failed to export clip
  └─ Error: File not found
  └─ Context: {"clipId":"abc123","outputPath":"/path/to/file"}
  └─ Stack: Error: File not found
      at ...
```

### 3. Key Features to Implement

#### A. File Writing with Error Handling
```typescript
private writeToFile(logEntry: LogEntry): void {
  try {
    const logPath = this.getLogFilePath(
      logEntry.level === 'ERROR' ? 'error' : 'general'
    );

    // Format log entry
    const formattedEntry = this.formatLogEntry(logEntry);

    // Append to file (non-blocking if possible)
    fs.appendFileSync(logPath, formattedEntry + '\n', 'utf8');

  } catch (error) {
    // Fail silently or write to console only
    // Don't want file logging to break the app
    console.error('[LOGGER] Failed to write to log file:', error);
  }
}
```

#### B. Log Rotation (Daily)
- Create new log file each day
- Keep last N days (configurable, default 7)
- Clean up old logs on initialization

```typescript
private cleanupOldLogs(maxDays: number = 7): void {
  try {
    const logDir = this.getLogDirectory();
    if (!fs.existsSync(logDir)) return;

    const files = fs.readdirSync(logDir);
    const now = Date.now();
    const maxAge = maxDays * 24 * 60 * 60 * 1000; // days to ms

    files.forEach(file => {
      const filePath = path.join(logDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtime.getTime();

      if (age > maxAge) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (error) {
    console.error('[LOGGER] Failed to cleanup old logs:', error);
  }
}
```

#### C. Performance Considerations
```typescript
// Option 1: Synchronous (simpler, may block slightly)
fs.appendFileSync(logPath, entry, 'utf8');

// Option 2: Asynchronous (better, non-blocking)
fs.appendFile(logPath, entry, 'utf8', (err) => {
  if (err) console.error('[LOGGER] Async write failed:', err);
});

// Option 3: Buffered writes (most efficient for high volume)
private logBuffer: string[] = [];
private flushInterval: NodeJS.Timeout;

constructor() {
  // Flush buffer every 5 seconds
  this.flushInterval = setInterval(() => this.flushLogBuffer(), 5000);
}

private bufferLogEntry(entry: string): void {
  this.logBuffer.push(entry);

  // Flush if buffer gets too large
  if (this.logBuffer.length > 100) {
    this.flushLogBuffer();
  }
}

private flushLogBuffer(): void {
  if (this.logBuffer.length === 0) return;

  const entries = this.logBuffer.join('\n') + '\n';
  this.logBuffer = [];

  try {
    fs.appendFileSync(this.getLogFilePath(), entries, 'utf8');
  } catch (error) {
    console.error('[LOGGER] Failed to flush buffer:', error);
  }
}
```

#### D. Configuration Options
```typescript
export interface LoggerConfig {
  // File logging options
  enableFileLogging: boolean;         // Default: true in production, false in dev
  fileLogLevel: LogLevel;             // Minimum level to write to file (default: WARN)
  maxLogFileDays: number;             // Days to keep logs (default: 7)
  logFormat: 'json' | 'text';        // Format for log files (default: json)

  // Performance options
  bufferWrites: boolean;              // Use buffered writes (default: true)
  bufferFlushInterval: number;        // Flush interval in ms (default: 5000)
  maxBufferSize: number;              // Max entries before forced flush (default: 100)
}

// Usage
const logger = new Logger({
  enableFileLogging: !import.meta.env.DEV, // Only in production
  fileLogLevel: LogLevel.WARN,              // Only warnings and errors
  logFormat: 'json'                         // Structured logs
});
```

### 4. Modified Logger Methods

```typescript
error(message: string, error?: Error | any, context?: LogContext): void {
  const prefix = this.formatPrefix('ERROR', context);
  console.error(prefix, message);

  if (error) {
    console.error('  └─ Error:', error);
    if (error?.stack && this.isDevelopment) {
      console.error('  └─ Stack:', error.stack);
    }
  }

  if (context) {
    console.error('  └─ Context:', context);
  }

  // Write to file in production
  if (!this.isDevelopment && this.config.enableFileLogging) {
    this.writeToFile({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      app: appId,
      module: context?.module || 'app',
      message,
      error: error?.message || String(error),
      stack: error?.stack,
      context
    });
  }

  // Still send to monitoring service if configured
  if (!this.isDevelopment) {
    this.sendToMonitoring({ message, error, context });
  }
}
```

## Effort Estimate

### Time Required
- **Basic Implementation**: 2-3 hours
  - Path resolution for Mac/Windows
  - Basic file writing
  - JSON formatting

- **Full Implementation**: 4-6 hours
  - All basic features
  - Log rotation
  - Buffered writes
  - Configuration options
  - Error handling
  - Testing on both platforms

### Files to Modify
1. `src/js/lib/logger.ts` - Main changes
2. `src/js/lib/logger.example.ts` - Update with file logging examples
3. `docs/LOGGER_DECISION.md` - Document file logging feature
4. `package.json` - No changes needed (fs/os already available via CEP)

### Testing Requirements
- Test on macOS (verify ~/Library/Logs path)
- Test on Windows (verify AppData path)
- Test log rotation
- Test with high log volume (performance)
- Verify logs are readable
- Test error handling when directory is not writable

## Benefits

### 1. Production Debugging
- Users can share log files for support
- Errors captured even if console is not open
- Persistent history of issues

### 2. User Support
- Support team can request logs via menu: "Help → Export Logs"
- Logs include full context and stack traces
- Easier to diagnose intermittent issues

### 3. Monitoring
- Could build dashboard to aggregate logs
- Identify common error patterns
- Track performance issues

## Potential Issues & Solutions

### Issue 1: Disk Space
**Problem**: Log files could grow large over time
**Solution**:
- Daily rotation with 7-day retention (max ~7 files)
- Only log WARN and ERROR in production (not DEBUG/INFO)
- Compress old logs (optional)

### Issue 2: Performance
**Problem**: File I/O could slow down the app
**Solution**:
- Use buffered writes (batch multiple logs)
- Async writes where possible
- Write on separate "thread" (setInterval)

### Issue 3: Write Permissions
**Problem**: User may not have write permissions
**Solution**:
- Graceful fallback (fail silently)
- Try alternative paths if primary fails
- Log warning to console only

### Issue 4: Cross-Platform Testing
**Problem**: Different path separators and conventions
**Solution**:
- Use Node.js `path` module (handles platform differences)
- Test on both Mac and Windows
- Use `os.homedir()` and `os.platform()`

## Recommendation

### Phase 1 (Immediate) - Basic File Logging
Implement basic file logging with:
- ✅ Platform-specific log directories
- ✅ JSON format
- ✅ Error and Warning levels only
- ✅ Simple daily rotation (7 days)
- ✅ Synchronous writes (simpler)

**Estimated Time**: 2-3 hours

### Phase 2 (Future) - Advanced Features
Add when needed:
- Buffered writes for performance
- Configurable options
- Export logs menu item
- Log compression
- Remote log aggregation

## Example Implementation

See attached file: `logger-with-file-logging.ts.example`

## Questions to Consider

1. **What log level should be written to file?**
   - Recommendation: WARN and ERROR only in production
   - Keeps file size manageable
   - Captures actionable issues

2. **Should file logging be optional?**
   - Recommendation: Yes, with setting in preferences
   - Some users may not want logs
   - Privacy considerations

3. **How to expose logs to users?**
   - Menu item: "Help → Show Logs Folder"
   - Menu item: "Help → Export Logs to Zip"
   - Settings panel toggle

4. **Should we sanitize sensitive data?**
   - Recommendation: Yes
   - Strip file paths that include usernames
   - Redact email addresses
   - Remove auth tokens

---

**Status**: Proposal - Ready for Implementation
**Updated**: 2025-12-06
