import { z } from 'zod';

export const ApiErrorSchema = z.object({
  error: z.string(),
  issues: z
    .array(
      z.object({
        path: z.array(z.union([z.string(), z.number()])),
        message: z.string(),
      }),
    )
    .optional(),
});

export const HealthSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  database: z.enum(['up', 'down']),
  uptime: z.number().nonnegative(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type Health = z.infer<typeof HealthSchema>;
