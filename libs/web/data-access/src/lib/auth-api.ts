import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  AuthResultSchema,
  AuthSessionSchema,
  AuthStatusSchema,
  type AuthUser,
  type ForgotPassword,
  type ResetPassword,
  type SignIn,
  type SignUp,
} from '@fullstack/schemas';
import { ApiPaths } from '@fullstack/util';
import { Logger } from '@fullstack/web/logging';
import { map, type Observable } from 'rxjs';

/** The web page the link in the reset email leads to, with `?token=…`. */
export const RESET_PASSWORD_PATH = '/reset-password';

/**
 * HTTP client for the better-auth endpoints. The session lives in an HttpOnly
 * cookie that the browser sends along, so no token handling is needed here.
 */
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly logger = inject(Logger);
  private readonly http = inject(HttpClient);

  constructor() {
    this.logger.debug('AuthApi.constructor');
  }

  /** The signed-in user, or `null` without a valid session. */
  session(): Observable<AuthUser | null> {
    return this.http
      .get(ApiPaths.session)
      .pipe(map((body) => AuthSessionSchema.parse(body)?.user ?? null));
  }

  signIn(input: SignIn): Observable<AuthUser> {
    return this.http
      .post(ApiPaths.signIn, input)
      .pipe(map((body) => AuthResultSchema.parse(body).user));
  }

  /** Creates the account and signs it in. */
  signUp(input: SignUp): Observable<AuthUser> {
    return this.http
      .post(ApiPaths.signUp, input)
      .pipe(map((body) => AuthResultSchema.parse(body).user));
  }

  signOut(): Observable<void> {
    return this.http.post(ApiPaths.signOut, {}).pipe(map(() => undefined));
  }

  /**
   * Emails a reset link if the address has an account. The answer is the same
   * either way, so it does not reveal who has one.
   */
  requestPasswordReset(input: ForgotPassword): Observable<void> {
    return this.http
      .post(ApiPaths.requestPasswordReset, {
        ...input,
        redirectTo: RESET_PASSWORD_PATH,
      })
      .pipe(map((body) => void AuthStatusSchema.parse(body)));
  }

  /** Sets a new password with the token from the reset link. */
  resetPassword(input: ResetPassword): Observable<void> {
    return this.http
      .post(ApiPaths.resetPassword, input)
      .pipe(map((body) => void AuthStatusSchema.parse(body)));
  }
}
