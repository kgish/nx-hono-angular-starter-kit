import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  form,
  FormField,
  submit,
  validateStandardSchema,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { type SignIn, SignInSchema } from '@fullstack/schemas';
import { type AuthErrorCode, AuthStore } from '@fullstack/web/data-access';
import { TranslatePipe } from '@ngx-translate/core';
import { fieldMessage } from './field-message';

@Component({
  selector: 'lib-login-page',
  imports: [FormField, RouterLink, TranslatePipe],
  templateUrl: './login-page.html',
  styleUrl: './auth-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  /** Set by the reset page (`?passwordReset=true`) after a new password. */
  readonly passwordReset = input<string>();

  protected readonly model = signal<SignIn>({ email: '', password: '' });
  /** The same Zod schema the API contract is written in, run on the client. */
  protected readonly loginForm = form(this.model, (path) =>
    validateStandardSchema(path, SignInSchema),
  );
  protected readonly emailError = computed(() =>
    fieldMessage('email', this.loginForm.email()),
  );
  protected readonly passwordError = computed(() =>
    fieldMessage('password', this.loginForm.password()),
  );
  protected readonly error = signal<AuthErrorCode | null>(null);

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.loginForm, async () => {
      this.error.set(null);
      const result = await this.auth.signIn(SignInSchema.parse(this.model()));
      if (result.ok) await this.router.navigateByUrl('/');
      else this.error.set(result.error);
      return undefined;
    });
  }
}
