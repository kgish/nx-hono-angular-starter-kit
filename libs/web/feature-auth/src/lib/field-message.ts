import {
  type FieldState,
  StandardSchemaValidationError,
} from '@angular/forms/signals';
import type { z } from 'zod';

export interface FieldMessage {
  key: string;
  params?: Record<string, number>;
}

/**
 * The message for a field's first issue once the user is done with it, as a
 * translation key such as `auth.errors.email.invalid`. The shared Zod schema
 * owns the rules; the issue code only picks the message.
 */
export function fieldMessage(
  name: 'name' | 'email' | 'password',
  field: FieldState<string>,
): FieldMessage | null {
  const [error] = field.errors();
  if (!field.touched() || !error) return null;

  const base = `auth.errors.${name}`;
  const issue =
    error instanceof StandardSchemaValidationError
      ? (error.issue as z.core.$ZodIssue)
      : undefined;
  switch (issue?.code) {
    case 'too_small':
      return field.value() === ''
        ? { key: `${base}.required` }
        : { key: `${base}.tooShort`, params: { min: Number(issue.minimum) } };
    case 'too_big':
      return { key: `${base}.tooLong`, params: { max: Number(issue.maximum) } };
    default:
      return { key: `${base}.invalid` };
  }
}
