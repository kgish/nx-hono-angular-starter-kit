import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ApiPaths } from '@fullstack/util';
import { AuthStore } from '@fullstack/web/data-access';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { UserMenu } from './user-menu';

const user = {
  id: 'u1',
  name: 'Demo User',
  email: 'demo@example.org',
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('UserMenu', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserMenu],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', children: [] }]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(TranslateService).setTranslation('en', {
      auth: { signIn: 'Sign in', signOut: 'Sign out' },
    });
  });

  afterEach(() => http.verify());

  const signedIn = async () => {
    const loaded = TestBed.inject(AuthStore).loadSession();
    http
      .expectOne(ApiPaths.session)
      .flush({ session: { expiresAt: user.updatedAt }, user });
    await loaded;
  };

  const signedOut = async () => {
    const loaded = TestBed.inject(AuthStore).loadSession();
    http.expectOne(ApiPaths.session).flush(null);
    await loaded;
  };

  it('is empty while the session is unknown', async () => {
    const fixture = TestBed.createComponent(UserMenu);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('');
  });

  it('links to the login page when signed out', async () => {
    await signedOut();
    const fixture = TestBed.createComponent(UserMenu);
    await fixture.whenStable();
    const link = (fixture.nativeElement as HTMLElement).querySelector('a');
    expect(link?.textContent?.trim()).toBe('Sign in');
    expect(link?.getAttribute('href')).toBe('/login');
  });

  it('leaves the sign-in link out on the login page', async () => {
    await signedOut();
    await TestBed.inject(Router).navigateByUrl('/login');
    const fixture = TestBed.createComponent(UserMenu);
    await fixture.whenStable();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('a'),
    ).toBeNull();
  });

  it('shows the user and signs out to the login page', async () => {
    await signedIn();
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockResolvedValue(true);
    const fixture = TestBed.createComponent(UserMenu);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.name')?.textContent?.trim()).toBe('Demo User');

    el.querySelector('button')?.click();
    http.expectOne(ApiPaths.signOut).flush({ success: true });
    await fixture.whenStable();

    expect(navigate).toHaveBeenCalledWith('/login');
    expect(el.querySelector('.name')).toBeNull();
    expect(el.querySelector('a.sign-in')).toBeTruthy();
  });
});
