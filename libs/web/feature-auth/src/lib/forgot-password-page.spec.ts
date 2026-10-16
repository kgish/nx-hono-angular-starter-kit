import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiPaths } from '@fullstack/util';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { ForgotPasswordPage } from './forgot-password-page';

describe('ForgotPasswordPage', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(TranslateService).setTranslation('en', {
      auth: {
        forgotPassword: { sent: 'Link sent to {{email}}' },
        errors: {
          email: { invalid: 'Enter a valid email address' },
          unreachable: 'Cannot reach the server',
        },
      },
    });
  });

  afterEach(() => http.verify());

  /** Fills in the address and submits; resolves once the request is out. */
  const render = async (email: string) => {
    const fixture = TestBed.createComponent(ForgotPasswordPage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const input = el.querySelector('#reset-email') as HTMLInputElement;
    input.value = email;
    input.dispatchEvent(new Event('input'));
    el.querySelector('form')?.dispatchEvent(
      new Event('submit', { cancelable: true }),
    );
    return { fixture, el };
  };

  it('validates the email address before calling the API', async () => {
    const { fixture, el } = await render('not-an-email');
    await fixture.whenStable();
    expect(el.querySelector('#reset-email-error')?.textContent?.trim()).toBe(
      'Enter a valid email address',
    );
    expect(el.querySelector('[role="status"]')).toBeNull();
    http.expectNone(ApiPaths.requestPasswordReset);
  });

  it('asks the API for a reset link and confirms', async () => {
    const { fixture, el } = await render(' demo@example.org ');
    const request = await vi.waitFor(() =>
      http.expectOne(ApiPaths.requestPasswordReset),
    );
    expect(request.request.body).toEqual({
      email: 'demo@example.org',
      redirectTo: '/reset-password',
    });
    request.flush({ status: true, message: 'Check your email' });
    await fixture.whenStable();

    expect(el.querySelector('[role="status"]')?.textContent?.trim()).toBe(
      'Link sent to demo@example.org',
    );
    expect(el.querySelector('form')).toBeNull();
  });

  it('keeps the form when the request fails', async () => {
    const { fixture, el } = await render('demo@example.org');
    const request = await vi.waitFor(() =>
      http.expectOne(ApiPaths.requestPasswordReset),
    );
    request.error(new ProgressEvent('error'), { status: 0 });
    await fixture.whenStable();

    expect(el.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
      'Cannot reach the server',
    );
    expect(el.querySelector('form')).toBeTruthy();
  });
});
