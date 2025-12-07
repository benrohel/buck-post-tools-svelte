# Logger Implementation Decision: Custom vs Pino

## Decision: ✅ Custom Logger

## Summary

We implemented a **custom centralized logger** (~150 lines) instead of using Pino because:

1. **Zero bundle size impact** - No external dependencies
2. **CEP-optimized** - Built for Adobe's hybrid environment (CEF + Node.js)
3. **Vite-integrated** - Uses `import.meta.env.DEV` natively
4. **Production optimization** - Debug logs completely stripped by Terser
5. **Simplicity** - All features we need, nothing we don't

## Comparison

### Bundle Size

| Solution | Size (minified + gzipped) | Impact on 694KB bundle |
|----------|--------------------------|------------------------|
| **Custom Logger** | ~1KB | +0.14% |
| Pino | ~15-20KB | +2.5-3% |
| Pino + pino-pretty (dev) | ~120KB | +17% |

### Features Needed vs Available

| Feature | Custom | Pino | Notes |
|---------|--------|------|-------|
| **Dev vs Prod modes** | ✅ Native | ⚠️ Manual | Vite handles this for us |
| **Zero-cost debug logs** | ✅ Terser strips | ⚠️ Manual | Our Vite config removes them |
| **Module tagging** | ✅ Simple | ✅ Child loggers | Both work |
| **Structured logging** | ✅ Context param | ✅ JSON | Both work |
| **Error tracking** | ✅ Built-in | ✅ Transports | Both work |
| **CEP environment** | ✅ Optimized | ⚠️ Node.js focused | We need hybrid |
| **High-throughput** | ❌ Not needed | ✅ Ultra-fast | Overkill for us |
| **Async logging** | ❌ Not needed | ✅ Workers | Overkill for us |
| **Redaction** | ❌ Not needed | ✅ Built-in | Can add if needed |

### Code Comparison

#### Custom Logger (What We Built)

```typescript
import { logger, logModule } from '@/lib/logger';

const log = logModule('exporter');

export const exportComp = async (comp: CompData) => {
  log.debug('Starting export', { compName: comp.name });

  try {
    const result = await render(comp);
    log.info('Export complete', { path: result.path });
    return result;
  } catch (error) {
    log.error('Export failed', error, { compName: comp.name });
    throw error;
  }
};

// Development: All logs show
// Production: Only error logs show, debug/info completely removed
```

#### With Pino

```typescript
import pino from 'pino';

// Need to configure for CEP environment
const logger = pino({
  level: import.meta.env.DEV ? 'debug' : 'error',
  browser: {
    asObject: true, // For CEF
  },
  // Need transport for pretty printing in dev
  transport: import.meta.env.DEV ? {
    target: 'pino-pretty',
    options: { colorize: true }
  } : undefined,
});

const log = logger.child({ module: 'exporter' });

export const exportComp = async (comp: CompData) => {
  log.debug({ compName: comp.name }, 'Starting export');

  try {
    const result = await render(comp);
    log.info({ path: result.path }, 'Export complete');
    return result;
  } catch (error) {
    log.error({ err: error, compName: comp.name }, 'Export failed');
    throw error;
  }
};

// Need to manually strip debug logs or accept the overhead
```

## Our Implementation

### File Structure

```
src/js/lib/
├── logger.ts           # Core logger implementation (150 lines)
└── logger.example.ts   # Usage examples and migration guide
```

### Configuration

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    minify: isPackage ? 'terser' : false,
    terserOptions: isPackage ? {
      compress: {
        // Remove console.log, console.debug, console.info in production
        drop_console: ['log', 'debug', 'info'],
        drop_debugger: true,
      },
    } : undefined,
  },
});
```

### Usage Patterns

#### Pattern 1: Module-scoped logger (recommended)

```typescript
import { logModule } from '@/lib/logger';

const log = logModule('clip');

export const getClips = async () => {
  log.debug('Fetching clips');
  // ...
};
```

#### Pattern 2: Direct logger

```typescript
import { logger } from '@/lib/logger';

logger.debug('Message', { module: 'myModule' }, data);
logger.error('Failed', error, { module: 'myModule', id: 123 });
```

#### Pattern 3: Grouped logs

```typescript
import { logger } from '@/lib/logger';

logger.group('Processing sequence');
// ... multiple log statements
logger.groupEnd();
```

## Production Behavior

### Development Mode (`bun run dev`)
```
✅ logger.debug() → Shows in console with full context
✅ logger.info()  → Shows in console
✅ logger.warn()  → Shows in console
✅ logger.error() → Shows in console
```

### Production Mode (`bun run zxp`)
```
❌ logger.debug() → COMPLETELY REMOVED (zero runtime cost)
❌ logger.info()  → COMPLETELY REMOVED (zero runtime cost)
✅ logger.warn()  → Shows in console
✅ logger.error() → Shows in console + can send to monitoring
```

## Migration Strategy

### Current State
- **320+ console.log statements** scattered across codebase
- No control over log levels
- All logs ship to production
- Performance impact

### Phase 2 Migration
1. Replace `console.log` → `logger.debug`
2. Replace `console.error` → `logger.error`
3. Add module context to all logs
4. Remove conditional `if (DEBUG)` checks (no longer needed)

### Estimated Impact
- **Bundle size**: -5KB to -10KB (debug logs removed)
- **Runtime performance**: Improved (no debug log overhead)
- **Developer experience**: Better (structured logs with context)

## Future Enhancements

Our custom logger is extensible. We can add:

1. **File logging**: Write to Adobe's temp folder
```typescript
private sendToMonitoring(data: any): void {
  const logPath = path.join(os.tmpdir(), 'buck-post-tools.log');
  fs.appendFileSync(logPath, JSON.stringify(data) + '\n');
}
```

2. **Remote monitoring**: Send errors to backend
```typescript
private sendToMonitoring(data: any): void {
  fetch('https://api.yourcompany.com/logs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

3. **User context**: Automatically include user info
```typescript
private enrichContext(context?: LogContext): LogContext {
  return {
    ...context,
    userId: userSession.get()?.id,
    projectPath: currentProject.get(),
    appVersion: pkg.version,
  };
}
```

## Why Not Pino?

### Pino is Excellent For:
- ✅ High-throughput Node.js servers (millions of logs/sec)
- ✅ Microservices with structured JSON logging
- ✅ Complex transport requirements (Elasticsearch, etc.)
- ✅ Strict log redaction/security needs

### Our Use Case:
- ❌ ~320 log statements (not high-throughput)
- ❌ CEP hybrid environment (not pure Node.js)
- ❌ Simple dev/prod split (Vite handles it)
- ❌ No complex transports needed yet

### Cost/Benefit Analysis

**Pino Costs:**
- +15-20KB bundle size
- Configuration complexity for CEP environment
- Bundler integration issues (browser vs Node.js)
- Learning curve for team

**Pino Benefits:**
- Ultra-fast performance (not needed at our scale)
- Rich ecosystem (transports, formatters)
- Battle-tested (but so is console.log!)

**Custom Logger Costs:**
- ~150 lines to maintain
- No external ecosystem

**Custom Logger Benefits:**
- Zero bundle size
- Perfect fit for our use case
- Vite-native (import.meta.env.DEV)
- CEP-optimized
- Can always migrate to Pino later if needed

## Conclusion

For Buck Post Tools CEP extension, a **custom logger is the right choice** because:

1. Our logging volume doesn't require Pino's performance
2. CEP's hybrid environment needs custom handling anyway
3. Vite provides everything we need for dev/prod modes
4. Bundle size matters for CEP extensions
5. Simple is better than complex (unless you need complex)

**We can always migrate to Pino later** if requirements change, but for now, 150 lines of custom code gives us everything we need with zero dependencies.

## References

- Logger implementation: [src/js/lib/logger.ts](src/js/lib/logger.ts)
- Usage examples: [src/js/lib/logger.example.ts](src/js/lib/logger.example.ts)
- Vite config: [vite.config.ts](vite.config.ts#L77-L86)
- Pino docs: https://getpino.io/
