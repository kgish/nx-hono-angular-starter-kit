import type { HttpLoggerOptions, PinoLogger } from 'hono-pino';
import { pino, type Logger } from 'pino';
import { build as prettyStream } from 'pino-pretty';
import type { Env } from './env';

export type { Logger } from 'pino';

/** Hono variables set by the hono-pino middleware in `createApp`. */
export interface LoggerEnv {
  Variables: {
    /** Request-scoped: `assign()` adds fields to every later line of the request. */
    logger: PinoLogger;
  };
}

/** JSON lines, or readable coloured lines for a terminal (`LOG_PRETTY`). */
export function createLogger({
  LOG_LEVEL,
  LOG_PRETTY,
}: Pick<Env, 'LOG_LEVEL' | 'LOG_PRETTY'>): Logger {
  if (!LOG_PRETTY) return pino({ level: LOG_LEVEL });
  return pino(
    { level: LOG_LEVEL },
    prettyStream({
      // Written before process.exit(), e.g. after a fatal error.
      sync: true,
      translateTime: 'SYS:HH:MM:ss.l',
      singleLine: true,
      // Request lines read `GET /api/todos 200 3ms · Request completed`.
      messageFormat:
        '{if req.method}{req.method} {req.url} {res.status} {responseTime}ms · {end}{msg}',
      ignore: 'pid,hostname,reqId,req,res,responseTime',
    }),
  );
}

/**
 * One line per request, written when it completes. Headers are left out: they
 * carry the session cookie.
 */
export const httpLogOptions: HttpLoggerOptions = {
  onReqBindings: (c) => ({ req: { method: c.req.method, url: c.req.path } }),
  onResBindings: (c) => ({
    res: { status: c.res.status },
    ...(c.error && { err: c.error }),
  }),
  onResLevel: (c) => {
    if (c.error || c.res.status >= 500) return 'error';
    if (c.res.status >= 400) return 'warn';
    return 'info';
  },
};
