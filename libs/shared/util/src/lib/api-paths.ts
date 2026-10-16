/** Single source of truth for HTTP paths shared by the API and the web client. */
export const API_PREFIX = '/api';

/** Where the API mounts better-auth; the endpoints below are better-auth's. */
export const AUTH_PREFIX = `${API_PREFIX}/auth`;

export const ApiPaths = {
  health: `${API_PREFIX}/health`,
  todos: `${API_PREFIX}/todos`,
  todo: (id: number | string) => `${API_PREFIX}/todos/${id}`,
  signIn: `${AUTH_PREFIX}/sign-in/email`,
  signUp: `${AUTH_PREFIX}/sign-up/email`,
  signOut: `${AUTH_PREFIX}/sign-out`,
  session: `${AUTH_PREFIX}/get-session`,
  requestPasswordReset: `${AUTH_PREFIX}/request-password-reset`,
  resetPassword: `${AUTH_PREFIX}/reset-password`,
} as const;
