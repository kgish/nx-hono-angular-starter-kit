import {
  AuthSessionSchema,
  PASSWORD_MIN_LENGTH,
  ResetPasswordSchema,
  SignInSchema,
  SignUpSchema,
} from './auth.schema';

const firstIssue = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0]?.message;

describe('auth schemas', () => {
  it('trims the email and accepts any non-empty password on sign-in', () => {
    expect(
      SignInSchema.parse({ email: ' demo@example.org ', password: 'demo' }),
    ).toEqual({ email: 'demo@example.org', password: 'demo' });
  });

  it('tells a missing email apart from an invalid one', () => {
    expect(
      firstIssue(SignInSchema.safeParse({ email: ' ', password: 'x' })),
    ).toBe('Email is required');
    expect(
      firstIssue(SignInSchema.safeParse({ email: 'demo', password: 'x' })),
    ).toBe('Email is invalid');
  });

  it('requires a password on sign-in', () => {
    expect(
      firstIssue(SignInSchema.safeParse({ email: 'a@b.nl', password: '' })),
    ).toBe('Password is required');
  });

  it('enforces the minimum password length on sign-up', () => {
    const user = { name: 'Ada', email: 'ada@example.org' };
    expect(
      SignUpSchema.safeParse({ ...user, password: 'x'.repeat(7) }).success,
    ).toBe(false);
    expect(
      SignUpSchema.safeParse({
        ...user,
        password: 'x'.repeat(PASSWORD_MIN_LENGTH),
      }).success,
    ).toBe(true);
  });

  it('requires a name on sign-up', () => {
    const result = SignUpSchema.safeParse({
      name: '  ',
      email: 'ada@example.org',
      password: 'long enough',
    });
    expect(result.error?.issues[0]?.path).toEqual(['name']);
  });

  it('applies the sign-up password rules to a reset', () => {
    expect(
      ResetPasswordSchema.safeParse({ newPassword: 'short', token: 't' })
        .success,
    ).toBe(false);
    expect(
      ResetPasswordSchema.safeParse({ newPassword: 'long enough', token: '' })
        .success,
    ).toBe(false);
    expect(
      ResetPasswordSchema.safeParse({ newPassword: 'long enough', token: 't' })
        .success,
    ).toBe(true);
  });

  it('parses an empty session as null', () => {
    expect(AuthSessionSchema.parse(null)).toBeNull();
  });
});
