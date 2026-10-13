import { zValidator } from '@hono/zod-validator';
import type { ApiError } from '@fullstack/schemas';
import type { ValidationTargets } from 'hono';
import type { ZodType } from 'zod';

/** zValidator that answers with the shared ApiError shape on invalid input. */
export const validate = <
  T extends ZodType,
  Target extends keyof ValidationTargets,
>(
  target: Target,
  schema: T,
) =>
  zValidator(target, schema, (result, c) => {
    if (!result.success) {
      const body: ApiError = {
        error: 'Validation failed',
        issues: result.error.issues.map((issue) => ({
          path: issue.path.map((p) => (typeof p === 'symbol' ? String(p) : p)),
          message: issue.message,
        })),
      };
      return c.json(body, 400);
    }
    return undefined;
  });
