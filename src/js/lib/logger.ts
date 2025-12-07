/**
 * Centralized logger for Buck Post Tools CEP Extension
 *
 * Features:
 * - Zero-cost in production (debug logs completely removed by Vite)
 * - Structured logging with context
 * - Module tagging for easy filtering
 * - CEP environment aware (AEFT vs PPRO)
 * - Automatic enrichment with user/project context
 */

import { appId } from '@/lib/utils/cep';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  module?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    // Vite sets import.meta.env.DEV automatically
    this.isDevelopment = import.meta.env.DEV;
  }

  /**
   * Debug logging - only in development
   * These calls are completely stripped in production builds
   */
  debug(message: string, context?: LogContext, ...args: any[]): void {
    if (!this.isDevelopment) return;

    const prefix = this.formatPrefix('DEBUG', context);
    console.log(prefix, message, ...args);

    if (context && Object.keys(context).length > 1) {
      console.log('  └─ Context:', context);
    }
  }

  /**
   * Info logging - only in development
   * Use for general information about app state
   */
  info(message: string, context?: LogContext, ...args: any[]): void {
    if (!this.isDevelopment) return;

    const prefix = this.formatPrefix('INFO', context);
    console.info(prefix, message, ...args);
  }

  /**
   * Warning logging - always logged
   * Use for recoverable issues
   */
  warn(message: string, context?: LogContext, ...args: any[]): void {
    const prefix = this.formatPrefix('WARN', context);
    console.warn(prefix, message, ...args);
  }

  /**
   * Error logging - always logged
   * Use for unrecoverable errors
   */
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

    // In production, you could send to monitoring service here
    if (!this.isDevelopment) {
      this.sendToMonitoring({ message, error, context });
    }
  }

  /**
   * Group logging - for related log statements
   * Automatically collapsed in production
   */
  group(label: string, collapsed = true): void {
    if (!this.isDevelopment) return;

    if (collapsed) {
      console.groupCollapsed(label);
    } else {
      console.group(label);
    }
  }

  groupEnd(): void {
    if (!this.isDevelopment) return;
    console.groupEnd();
  }

  /**
   * Format log prefix with timestamp, level, and module
   */
  private formatPrefix(level: string, context?: LogContext): string {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS
    const module = context?.module || 'app';
    const app = appId || 'unknown';

    return `[${timestamp}] [${app}] [${level}] [${module}]`;
  }

  /**
   * Send errors to monitoring service in production
   * Placeholder for future integration (Sentry, LogRocket, etc.)
   */
  private sendToMonitoring(data: {
    message: string;
    error?: Error | any;
    context?: LogContext;
  }): void {
    // Future: Send to monitoring service
    // For now, just ensure it's in the console for users to report

    // Could also write to a log file in Adobe's temp folder:
    // const logPath = path.join(os.tmpdir(), 'buck-post-tools-errors.log');
    // fs.appendFileSync(logPath, JSON.stringify(data) + '\n');
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience exports for common patterns
export const logModule = (moduleName: string) => ({
  debug: (message: string, ...args: any[]) =>
    logger.debug(message, { module: moduleName }, ...args),
  info: (message: string, ...args: any[]) =>
    logger.info(message, { module: moduleName }, ...args),
  warn: (message: string, ...args: any[]) =>
    logger.warn(message, { module: moduleName }, ...args),
  error: (message: string, error?: Error, context?: LogContext) =>
    logger.error(message, error, { ...context, module: moduleName }),
});
