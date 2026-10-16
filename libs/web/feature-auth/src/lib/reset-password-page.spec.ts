import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ApiPaths } from '@fullstack/util';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { ResetPasswordPage } from './reset-password-page';

describe('ResetPasswordPage', () => {
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    TestBed.inject(TranslateService).setTranslation('en', {
      auth: {
        passwordHint: 'At least {{min}} characters',
        errors: {
          password: {
            tooShort: 'Password must be at least {{min}} characters',
          },
          invalidToken: 'This reset link is invalid or has expired.',
        },
      },
    });
  });

  afterEach(() => http.verify());

  /** Opens the page with the query parameters the link check redirects with. */
  const render = async (query: { token?: string; error?: string }) => {
    const fixture = TestBed.createComponent(ResetPasswordPage);
    for (const [name, value] of Object.entries(query)) {
      fixture.componentRef.setInput(name, value);
    }
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const submitPassword = (password: string) => {
      const input = el.querySelector('#new-password') as HTMLInputElement;
      input.value = password;
      input.dispatchEvent(new Event('input'));
      el.querySelector('form')?.dispatchEvent(
        new Event('submit', { cancelable: true }),
      );
    };
    const text = (selector: string) =>
      el.querySelector(selector)?.textContent?.trim();
    return { fixture, el, submitPassword, text };
  };

  it('explains an invalid or expired link', async () => {
    const { el, text } = await render({ error: 'INVALID_TOKEN' });
    expect(text('[role="alert"]')).toBe(
      'This reset link is invalid or has expired.',
    );
    expect(el.querySelector('form')).toBeNull();
    expect(el.querySelector('a[href="/forgot-password"]')).toBeTruthy();
  });

  it('needs a token', async () => {
    const { el } = await render({});
    expect(el.querySelector('form')).toBeNull();
  });

  it('enforces the shared password rules before calling the API', async () => {
    const { fixture, submitPassword, text } = await render({ token: 't' });
    expect(text('#new-password-hint')).toBe('At least 8 characters');

    submitPassword('short');
    await fixture.whenStable();

    expect(text('#new-password-error')).toBe(
      'Password must be at least 8 characters',
    );
    http.expectNone(ApiPaths.resetPassword);
  });

  it('saves the new password and sends the user to sign in', async () => {
    const { fixture, submitPassword } = await render({ token: 't' });
    submitPassword('battery staple');

    const request = await vi.waitFor(() =>
      http.expectOne(ApiPaths.resetPassword),
    );
    expect(request.request.body).toEqual({
      newPassword: 'battery staple',
      token: 't',
    });
    request.flush({ status: true });
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith(['/login'], {
      queryParams: { passwordReset: 'true' },
    });
  });

  it('switches to the invalid-link message when the token was spent', async () => {
    const { fixture, el, submitPassword, text } = await render({ token: 't' });
    submitPassword('battery staple');

    const request = await vi.waitFor(() =>
      http.expectOne(ApiPaths.resetPassword),
    );
    request.flush(
      { code: 'INVALID_TOKEN', message: 'Invalid token' },
      { status: 400, statusText: 'Bad Request' },
    );
    await fixture.whenStable();

    expect(text('[role="alert"]')).toBe(
      'This reset link is invalid or has expired.',
    );
    expect(el.querySelector('form')).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
  });
});
