import type { Auth } from './auth';

export const DEMO_USER = {
  name: 'Demo User',
  email: 'demo@example.org',
  password: 'demo',
} as const;

/**
 * Creates the demo account unless it exists. Its password is shorter than
 * PASSWORD_MIN_LENGTH, which the sign-up endpoint enforces, so the account is
 * written through better-auth's internal adapter the way sign-up would.
 *
 * @returns whether the account was created
 */
export async function seedDemoUser(auth: Auth): Promise<boolean> {
  const { internalAdapter, password } = await auth.$context;
  if (await internalAdapter.findUserByEmail(DEMO_USER.email)) return false;

  const user = await internalAdapter.createUser(
    { name: DEMO_USER.name, email: DEMO_USER.email, emailVerified: true },
    { method: 'email-password' },
  );
  await internalAdapter.linkAccount({
    userId: user.id,
    providerId: 'credential',
    accountId: user.id,
    password: await password.hash(DEMO_USER.password),
  });
  return true;
}
