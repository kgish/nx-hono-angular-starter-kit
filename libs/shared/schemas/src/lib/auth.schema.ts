import { z } from 'zod';

/** Password length rules; the API passes them to better-auth as well. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export const NAME_MAX_LENGTH = 100;

export const EmailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .pipe(z.email('Email is invalid'));

/** The rules for choosing a password, at sign-up and when resetting it. */
export const PasswordSchema = z
  .string()
  .min(
    PASSWORD_MIN_LENGTH,
    `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
  )
  .max(PASSWORD_MAX_LENGTH, 'Password is too long');

export const SignInSchema = z.object({
  email: EmailSchema,
  // Only presence is checked: the length rules apply when a password is chosen.
  password: z
    .string()
    .min(1, 'Password is required')
    .max(PASSWORD_MAX_LENGTH, 'Password is too long'),
});

export const SignUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(NAME_MAX_LENGTH, 'Name is too long'),
  email: EmailSchema,
  password: PasswordSchema,
});

export const ForgotPasswordSchema = z.object({ email: EmailSchema });

/** Body of `reset-password`; the token comes from the link in the email. */
export const ResetPasswordSchema = z.object({
  newPassword: PasswordSchema,
  token: z.string().min(1, 'Token is required'),
});

// Responses of the better-auth endpoints under ApiPaths.auth.

export const AuthUserSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  image: z.string().nullish(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

/** Body of a successful sign-in or sign-up. */
export const AuthResultSchema = z.object({ user: AuthUserSchema });

/** Body of `request-password-reset` and `reset-password` when they succeed. */
export const AuthStatusSchema = z.object({ status: z.literal(true) });

/** Body of `get-session`: `null` when nobody is signed in. */
export const AuthSessionSchema = z
  .object({
    session: z.object({ expiresAt: z.iso.datetime() }),
    user: AuthUserSchema,
  })
  .nullable();

/**
 * Error body of the better-auth endpoints. They answer with better-auth's own
 * shape (`code` is e.g. `INVALID_EMAIL_OR_PASSWORD`), not `ApiError`.
 */
export const AuthErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
});

export type SignIn = z.infer<typeof SignInSchema>;
export type SignUp = z.infer<typeof SignUpSchema>;
export type ForgotPassword = z.infer<typeof ForgotPasswordSchema>;
export type ResetPassword = z.infer<typeof ResetPasswordSchema>;
export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthSession = z.infer<typeof AuthSessionSchema>;
export type AuthErrorBody = z.infer<typeof AuthErrorSchema>;
