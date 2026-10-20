import { InjectionToken, Injectable, inject, isDevMode } from '@angular/core';

/** Severity of a log message, from least to most severe. `off` silences all. */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'off';

const SEVERITY: Readonly<Record<LogLevel, number>> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  off: 4,
};

/**
 * The least severe level that is written. Defaults to `debug` in dev mode and
 * `info` in production; provide it to change that.
 */
export const LOG_LEVEL = new InjectionToken<LogLevel>('LOG_LEVEL', {
  providedIn: 'root',
  factory: () => (isDevMode() ? 'debug' : 'info'),
});

/**
 * Writes messages to the browser console, dropping those below `LOG_LEVEL`.
 * Use it instead of calling `console.*` directly.
 */
@Injectable({ providedIn: 'root' })
export class Logger {
  private readonly level = inject(LOG_LEVEL);

  constructor() {
    this.debug('Logger.constructor');
  }

  debug(message: string, ...data: unknown[]): void {
    this.write('debug', message, data);
  }

  info(message: string, ...data: unknown[]): void {
    this.write('info', message, data);
  }

  warn(message: string, ...data: unknown[]): void {
    this.write('warn', message, data);
  }

  error(message: string, ...data: unknown[]): void {
    this.write('error', message, data);
  }

  private write(
    level: Exclude<LogLevel, 'off'>,
    message: string,
    data: unknown[],
  ): void {
    if (SEVERITY[level] < SEVERITY[this.level]) return;
    console[level](message, ...data);
  }
}
