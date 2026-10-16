import {
  ForgotPasswordSchema,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  ResetPasswordSchema,
  SignUpSchema,
} from '@fullstack/schemas';
import { AUTH_PREFIX } from '@fullstack/util';
import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import type { ZodType } from 'zod';
import { emailLanguage, resetPasswordEmail } from './emails';
import type { Mailer } from './mailer';

/** How long a password-reset link works. */
const RESET_LINK_TTL_SECONDS = 60 * 60;

/**
 * better-auth checks emails and password lengths itself; these shared schemas
 * add the rest of the contract (e.g. a non-empty name) per endpoint.
 */
const BODY_SCHEMAS: Record<string, ZodType> = {
  '/sign-up/email': SignUpSchema,
  '/request-password-reset': ForgotPasswordSchema,
  '/reset-password': ResetPasswordSchema,
};

export interface AuthConfig {
  /** A better-auth adapter: Drizzle in `main.ts`, in-memory in tests. */
  database: BetterAuthOptions['database'];
  secret: string;
  /** Delivers the password-reset emails. */
  mailer: Mailer;
  baseURL?: string;
  trustedOrigins?: string[];
  /** Session cookie name prefix; better-auth defaults to `better-auth`. */
  cookiePrefix?: string;
}

/** Email/password authentication with better-auth, served under `AUTH_PREFIX`. */
export function createAuth({
  database,
  secret,
  mailer,
  baseURL,
  trustedOrigins,
  cookiePrefix,
}: AuthConfig) {
  return betterAuth({
    database,
    secret,
    baseURL,
    basePath: AUTH_PREFIX,
    trustedOrigins,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: PASSWORD_MIN_LENGTH,
      maxPasswordLength: PASSWORD_MAX_LENGTH,
      resetPasswordTokenExpiresIn: RESET_LINK_TTL_SECONDS,
      // A reset signs out every device, in case the old password leaked.
      revokeSessionsOnPasswordReset: true,
      // `url` opens better-auth's link check, which redirects to the web app's
      // reset page with the token (or `?error=INVALID_TOKEN`).
      sendResetPassword: async ({ user, url }, request) => {
        const language = emailLanguage(request?.headers.get('accept-language'));
        await mailer.send({
          to: user.email,
          ...resetPasswordEmail(language, {
            name: user.name,
            url,
            expiresInMinutes: RESET_LINK_TTL_SECONDS / 60,
          }),
        });
      },
    },
    advanced: {
      cookiePrefix,
      // Send emails after answering, so a reset request for an unknown address
      // takes as long as one for a real account. Failures are logged.
      backgroundTasks: { handler: (task) => void task },
    },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        const schema = BODY_SCHEMAS[ctx.path];
        if (!schema) return;
        const result = schema.safeParse(ctx.body);
        if (!result.success) {
          throw new APIError('BAD_REQUEST', {
            code: 'VALIDATION_FAILED',
            message: result.error.issues[0]?.message ?? 'Validation failed',
          });
        }
      }),
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
