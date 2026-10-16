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
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(TranslateService).setTranslation('en', {
      auth: { signOut: 'Sign out' },
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

  it('is empty when signed out', async () => {
    const fixture = TestBed.createComponent(UserMenu);
    await fixture.whenStable();
    expect((fixture.nativeElement as HTMLElement).textContent?.trim()).toBe('');
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
  });
});
