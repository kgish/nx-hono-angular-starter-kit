import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ApiPaths } from '@fullstack/util';
import { Notifier } from '@fullstack/web/notifications';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { LoginPage } from './login-page';

const user = {
  id: 'u1',
  name: 'Demo User',
  email: 'demo@example.org',
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('LoginPage', () => {
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;
  let notifySuccess: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    navigate = vi
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockResolvedValue(true);
    notifySuccess = vi
      .spyOn(TestBed.inject(Notifier), 'success')
      .mockImplementation(() => undefined);
    TestBed.inject(TranslateService).setTranslation('en', {
      auth: {
        login: { passwordReset: 'Your password has been changed.' },
        errors: {
          email: {
            required: 'Email is required',
            invalid: 'Enter a valid email address',
          },
          password: { required: 'Password is required' },
          invalidCredentials: 'Invalid email or password',
        },
      },
    });
  });

  afterEach(() => http.verify());

  const render = async () => {
    const fixture = TestBed.createComponent(LoginPage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const type = (id: string, value: string) => {
      const input = el.querySelector(`#${id}`) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const submit = () =>
      el
        .querySelector('form')
        ?.dispatchEvent(new Event('submit', { cancelable: true }));
    const text = (selector: string) =>
      el.querySelector(selector)?.textContent?.trim();
    return { fixture, type, submit, text };
  };

  it('confirms a password reset when coming from the reset page', async () => {
    const fixture = TestBed.createComponent(LoginPage);
    fixture.componentRef.setInput('passwordReset', 'true');
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('[role="status"]')
        ?.textContent?.trim(),
    ).toBe('Your password has been changed.');
  });

  it('requires an email address and a password before calling the API', async () => {
    const { fixture, submit, text } = await render();
    submit();
    await fixture.whenStable();

    expect(text('#login-email-error')).toBe('Email is required');
    expect(text('#login-password-error')).toBe('Password is required');
    http.expectNone(ApiPaths.signIn);
  });

  it('rejects an invalid email address', async () => {
    const { fixture, type, submit, text } = await render();
    type('login-email', 'demo');
    type('login-password', 'demo');
    submit();
    await fixture.whenStable();

    expect(text('#login-email-error')).toBe('Enter a valid email address');
    expect(
      fixture.nativeElement
        .querySelector('#login-email')
        .getAttribute('aria-invalid'),
    ).toBe('true');
    http.expectNone(ApiPaths.signIn);
  });

  it('signs in, says so and opens the todos', async () => {
    const { fixture, type, submit } = await render();
    type('login-email', ' demo@example.org ');
    type('login-password', 'demo');
    submit();

    const request = await vi.waitFor(() => http.expectOne(ApiPaths.signIn));
    expect(request.request.body).toEqual({
      email: 'demo@example.org',
      password: 'demo',
    });
    request.flush({ redirect: false, token: 't', user });
    await fixture.whenStable();

    expect(notifySuccess).toHaveBeenCalledWith('auth.signedIn');
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('shows why signing in failed', async () => {
    const { fixture, type, submit, text } = await render();
    type('login-email', 'demo@example.org');
    type('login-password', 'wrong');
    submit();

    const request = await vi.waitFor(() => http.expectOne(ApiPaths.signIn));
    request.flush(
      { code: 'INVALID_EMAIL_OR_PASSWORD' },
      { status: 401, statusText: 'Unauthorized' },
    );
    await fixture.whenStable();

    expect(text('[role="alert"]')).toBe('Invalid email or password');
    expect(notifySuccess).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
