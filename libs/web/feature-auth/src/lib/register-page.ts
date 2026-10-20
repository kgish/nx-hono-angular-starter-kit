import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  form,
  FormField,
  submit,
  validateStandardSchema,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import {
  PASSWORD_MIN_LENGTH,
  type SignUp,
  SignUpSchema,
} from '@fullstack/schemas';
import { type AuthErrorCode, AuthStore } from '@fullstack/web/data-access';
import { Logger } from '@fullstack/web/logging';
import { Notifier } from '@fullstack/web/notifications';
import { TranslatePipe } from '@ngx-translate/core';
import { fieldMessage } from './field-message';

@Component({
  selector: 'lib-register-page',
  imports: [FormField, RouterLink, TranslatePipe],
  templateUrl: './register-page.html',
  styleUrl: './auth-page.scss',
})
export class RegisterPage implements OnInit {
  private readonly logger = inject(Logger);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly notifier = inject(Notifier);

  protected readonly passwordMinLength = PASSWORD_MIN_LENGTH;
  protected readonly model = signal<SignUp>({
    name: '',
    email: '',
    password: '',
  });
  protected readonly registerForm = form(this.model, (path) =>
    validateStandardSchema(path, SignUpSchema),
  );
  protected readonly nameError = computed(() =>
    fieldMessage('name', this.registerForm.name()),
  );
  protected readonly emailError = computed(() =>
    fieldMessage('email', this.registerForm.email()),
  );
  protected readonly passwordError = computed(() =>
    fieldMessage('password', this.registerForm.password()),
  );
  protected readonly error = signal<AuthErrorCode | null>(null);

  ngOnInit(): void {
    this.logger.debug('RegisterPage.ngOnInit');
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.registerForm, async () => {
      this.error.set(null);
      // Signing up also signs the new account in.
      const result = await this.auth.signUp(SignUpSchema.parse(this.model()));
      if (result.ok) {
        this.notifier.success('auth.accountCreated');
        await this.router.navigateByUrl('/');
      } else {
        this.error.set(result.error);
      }
      return undefined;
    });
  }
}
