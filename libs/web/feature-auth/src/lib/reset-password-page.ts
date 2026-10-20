import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import {
  form,
  FormField,
  submit,
  validateStandardSchema,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import {
  PASSWORD_MIN_LENGTH,
  PasswordSchema,
  ResetPasswordSchema,
} from '@fullstack/schemas';
import {
  type AuthErrorCode,
  AuthStore,
  LOGIN_PATH,
} from '@fullstack/web/data-access';
import { Logger } from '@fullstack/web/logging';
import { TranslatePipe } from '@ngx-translate/core';
import { fieldMessage } from './field-message';

/** Where the emailed reset link lands, after the API has checked its token. */
@Component({
  selector: 'lib-reset-password-page',
  imports: [FormField, RouterLink, TranslatePipe],
  templateUrl: './reset-password-page.html',
  styleUrl: './auth-page.scss',
})
export class ResetPasswordPage implements OnInit {
  private readonly logger = inject(Logger);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  /** Query parameters from the link check: `?token=…` or `?error=INVALID_TOKEN`. */
  readonly token = input<string>();
  readonly error = input<string>();

  protected readonly passwordMinLength = PASSWORD_MIN_LENGTH;
  protected readonly model = signal({ newPassword: '' });
  protected readonly resetForm = form(this.model, (path) =>
    validateStandardSchema(path.newPassword, PasswordSchema),
  );
  protected readonly passwordError = computed(() =>
    fieldMessage('password', this.resetForm.newPassword()),
  );
  protected readonly failure = signal<AuthErrorCode | null>(null);
  /** No usable token: missing, rejected by the link check, or spent meanwhile. */
  protected readonly linkInvalid = computed(
    () => !this.token() || !!this.error() || this.failure() === 'invalidToken',
  );

  ngOnInit(): void {
    this.logger.debug('ResetPasswordPage.ngOnInit');
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.resetForm, async () => {
      this.failure.set(null);
      const result = await this.auth.resetPassword(
        ResetPasswordSchema.parse({ ...this.model(), token: this.token() }),
      );
      if (result.ok) {
        await this.router.navigate([LOGIN_PATH], {
          queryParams: { passwordReset: 'true' },
        });
      } else {
        this.failure.set(result.error);
      }
      return undefined;
    });
  }
}
