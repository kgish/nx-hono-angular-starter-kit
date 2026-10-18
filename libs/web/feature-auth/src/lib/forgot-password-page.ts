import { Component, computed, inject, signal } from '@angular/core';
import {
  form,
  FormField,
  submit,
  validateStandardSchema,
} from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { type ForgotPassword, ForgotPasswordSchema } from '@fullstack/schemas';
import { type AuthErrorCode, AuthStore } from '@fullstack/web/data-access';
import { TranslatePipe } from '@ngx-translate/core';
import { fieldMessage } from './field-message';

/** Asks the API to email a reset link to the given address. */
@Component({
  selector: 'lib-forgot-password-page',
  imports: [FormField, RouterLink, TranslatePipe],
  templateUrl: './forgot-password-page.html',
  styleUrl: './auth-page.scss',
})
export class ForgotPasswordPage {
  private readonly auth = inject(AuthStore);

  protected readonly model = signal<ForgotPassword>({ email: '' });
  protected readonly resetForm = form(this.model, (path) =>
    validateStandardSchema(path, ForgotPasswordSchema),
  );
  protected readonly emailError = computed(() =>
    fieldMessage('email', this.resetForm.email()),
  );
  protected readonly error = signal<AuthErrorCode | null>(null);
  /** The address the link went to, once the request is accepted. */
  protected readonly sentTo = signal<string | null>(null);

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.resetForm, async () => {
      this.error.set(null);
      const input = ForgotPasswordSchema.parse(this.model());
      const result = await this.auth.requestPasswordReset(input);
      if (result.ok) this.sentTo.set(input.email);
      else this.error.set(result.error);
      return undefined;
    });
  }
}
