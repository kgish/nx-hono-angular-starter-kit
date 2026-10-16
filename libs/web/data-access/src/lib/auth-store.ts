import { HttpErrorResponse } from '@angular/common/http';
import {
  computed,
  inject,
  Injectable,
  PendingTasks,
  signal,
} from '@angular/core';
import {
  AuthErrorSchema,
  type AuthUser,
  type ForgotPassword,
  type ResetPassword,
  type SignIn,
  type SignUp,
} from '@fullstack/schemas';
import { err, ok, type Result } from '@fullstack/util';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from './auth-api';

/** Why an auth request failed; pages map these to translated messages. */
export type AuthErrorCode =
  | 'invalidCredentials'
  | 'emailTaken'
  | 'invalidInput'
  | 'invalidToken'
  | 'tooManyRequests'
  | 'unreachable'
  | 'unknown';

/** Signal-based state for the signed-in user. */
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(AuthApi);
  private readonly pendingTasks = inject(PendingTasks);

  private readonly state = signal<{ user: AuthUser | null }>({ user: null });
  private sessionLoad: Promise<void> | undefined;

  readonly user = computed(() => this.state().user);
  readonly isAuthenticated = computed(() => this.user() !== null);

  /**
   * Asks the API who is signed in, once. Later calls wait for that same answer;
   * after a failed request the next call asks again.
   */
  loadSession(): Promise<void> {
    this.sessionLoad ??= this.run(() =>
      firstValueFrom(this.api.session()),
    ).then((result) => {
      if (result.ok) this.setUser(result.value);
      else this.sessionLoad = undefined;
    });
    return this.sessionLoad;
  }

  async signIn(input: SignIn): Promise<Result<AuthUser, AuthErrorCode>> {
    const result = await this.run(() => firstValueFrom(this.api.signIn(input)));
    if (result.ok) this.setUser(result.value);
    return result;
  }

  async signUp(input: SignUp): Promise<Result<AuthUser, AuthErrorCode>> {
    const result = await this.run(() => firstValueFrom(this.api.signUp(input)));
    if (result.ok) this.setUser(result.value);
    return result;
  }

  /** Forgets the user locally even if the request fails. */
  async signOut(): Promise<void> {
    await this.run(() => firstValueFrom(this.api.signOut()));
    this.setUser(null);
  }

  requestPasswordReset(
    input: ForgotPassword,
  ): Promise<Result<void, AuthErrorCode>> {
    return this.run(() => firstValueFrom(this.api.requestPasswordReset(input)));
  }

  /** Sets a new password; the API also signs out every existing session. */
  resetPassword(input: ResetPassword): Promise<Result<void, AuthErrorCode>> {
    return this.run(() => firstValueFrom(this.api.resetPassword(input)));
  }

  private setUser(user: AuthUser | null): void {
    this.state.set({ user });
    // A known answer needs no session request any more.
    this.sessionLoad = Promise.resolve();
  }

  /** Tracks the request as a pending task so whenStable() and SSR wait for it. */
  private async run<T>(
    action: () => Promise<T>,
  ): Promise<Result<T, AuthErrorCode>> {
    const done = this.pendingTasks.add();
    try {
      return ok(await action());
    } catch (error) {
      return err(toErrorCode(error));
    } finally {
      done();
    }
  }
}

function toErrorCode(error: unknown): AuthErrorCode {
  if (!(error instanceof HttpErrorResponse)) return 'unknown';
  if (error.status === 0) return 'unreachable';
  if (error.status === 429) return 'tooManyRequests';
  const body = AuthErrorSchema.safeParse(error.error);
  switch (body.success ? body.data.code : undefined) {
    case 'INVALID_EMAIL_OR_PASSWORD':
      return 'invalidCredentials';
    case 'USER_ALREADY_EXISTS':
    case 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL':
      return 'emailTaken';
    case 'INVALID_TOKEN':
      return 'invalidToken';
    case 'VALIDATION_FAILED':
    case 'INVALID_EMAIL':
    case 'INVALID_PASSWORD':
    case 'PASSWORD_TOO_SHORT':
    case 'PASSWORD_TOO_LONG':
      return 'invalidInput';
    default:
      return 'unknown';
  }
}
