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
import { RegisterPage } from './register-page';

const user = {
  id: 'u2',
  name: 'Ada',
  email: 'ada@example.org',
  emailVerified: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('RegisterPage', () => {
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;
  let notifySuccess: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
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
        passwordHint: 'At least {{min}} characters',
        errors: {
          name: { required: 'Name is required' },
          password: {
            tooShort: 'Password must be at least {{min}} characters',
          },
          emailTaken: 'An account with this email address already exists',
        },
      },
    });
  });

  afterEach(() => http.verify());

  const render = async () => {
    const fixture = TestBed.createComponent(RegisterPage);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const type = (id: string, value: string) => {
      const input = el.querySelector(`#${id}`) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const fill = (password: string) => {
      type('register-name', ' Ada ');
      type('register-email', 'ada@example.org');
      type('register-password', password);
    };
    const submit = () =>
      el
        .querySelector('form')
        ?.dispatchEvent(new Event('submit', { cancelable: true }));
    const text = (selector: string) =>
      el.querySelector(selector)?.textContent?.trim();
    return { fixture, fill, submit, text };
  };

  it('enforces the shared password rules before calling the API', async () => {
    const { fixture, fill, submit, text } = await render();
    expect(text('#register-password-hint')).toBe('At least 8 characters');

    fill('short');
    submit();
    await fixture.whenStable();

    expect(text('#register-password-error')).toBe(
      'Password must be at least 8 characters',
    );
    http.expectNone(ApiPaths.signUp);
  });

  it('requires a name', async () => {
    const { fixture, submit, text } = await render();
    submit();
    await fixture.whenStable();
    expect(text('#register-name-error')).toBe('Name is required');
  });

  it('creates the account, says so and opens the todos', async () => {
    const { fixture, fill, submit } = await render();
    fill('correct horse');
    submit();

    const request = await vi.waitFor(() => http.expectOne(ApiPaths.signUp));
    expect(request.request.body).toEqual({
      name: 'Ada',
      email: 'ada@example.org',
      password: 'correct horse',
    });
    request.flush({ token: 't', user });
    await fixture.whenStable();

    expect(notifySuccess).toHaveBeenCalledWith('auth.accountCreated');
    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('says when the email address is taken', async () => {
    const { fixture, fill, submit, text } = await render();
    fill('correct horse');
    submit();

    const request = await vi.waitFor(() => http.expectOne(ApiPaths.signUp));
    request.flush(
      { code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL' },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    await fixture.whenStable();

    expect(text('[role="alert"]')).toBe(
      'An account with this email address already exists',
    );
    expect(notifySuccess).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
