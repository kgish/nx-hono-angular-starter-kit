import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ApiPaths } from '@fullstack/util';
import { AuthStore } from '@fullstack/web/data-access';
import { Notifier } from '@fullstack/web/notifications';
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
  let notifySuccess: ReturnType<typeof vi.spyOn>;

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
    notifySuccess = vi
      .spyOn(TestBed.inject(Notifier), 'success')
      .mockImplementation(() => undefined);
    TestBed.inject(TranslateService).setTranslation('en', {
      auth: {
        signIn: 'Sign in',
        signOut: 'Sign out',
        signOutConfirm: {
          heading: 'Sign out',
          message: 'You are about to be signed out. Are you sure?',
          cancel: 'Cancel',
          confirm: 'Yes',
        },
      },
    });
    // jsdom has <dialog> but not its methods; toggling `open` is enough here.
    HTMLDialogElement.prototype.showModal = function () {
      this.open = true;
    };
    HTMLDialogElement.prototype.close = function () {
      this.open = false;
    };
  });

  afterEach(() => {
    http.verify();
    // Remove the stubs again: delete restores jsdom's (missing) originals.
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>)
      .showModal;
    delete (HTMLDialogElement.prototype as Partial<HTMLDialogElement>).close;
  });

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

  const renderSignedIn = async () => {
    await signedIn();
    const fixture = TestBed.createComponent(UserMenu);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const dialog = el.querySelector('dialog') as HTMLDialogElement;
    return { fixture, el, dialog };
  };

  it('shows the user and asks before signing out', async () => {
    const { fixture, el, dialog } = await renderSignedIn();
    expect(el.querySelector('.name')?.textContent?.trim()).toBe('Demo User');
    expect(dialog.open).toBe(false);

    el.querySelector<HTMLButtonElement>('.user-menu button')?.click();
    await fixture.whenStable();

    expect(dialog.open).toBe(true);
    expect(dialog.querySelector('p')?.textContent?.trim()).toBe(
      'You are about to be signed out. Are you sure?',
    );
  });

  it('stays signed in when the sign-out is cancelled', async () => {
    const { fixture, el, dialog } = await renderSignedIn();

    el.querySelector<HTMLButtonElement>('.user-menu button')?.click();
    dialog.querySelector<HTMLButtonElement>('.cancel')?.click();
    await fixture.whenStable();

    // No sign-out request: http.verify() in afterEach would catch one.
    expect(dialog.open).toBe(false);
    expect(el.querySelector('.name')?.textContent?.trim()).toBe('Demo User');
    expect(notifySuccess).not.toHaveBeenCalled();
  });

  it('signs out to the login page and says so once confirmed', async () => {
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigateByUrl')
      .mockResolvedValue(true);
    const { fixture, el, dialog } = await renderSignedIn();

    el.querySelector<HTMLButtonElement>('.user-menu button')?.click();
    dialog.querySelector<HTMLButtonElement>('.confirm-yes')?.click();
    http.expectOne(ApiPaths.signOut).flush({ success: true });
    await fixture.whenStable();

    expect(dialog.open).toBe(false);
    expect(notifySuccess).toHaveBeenCalledWith('auth.signedOut');
    expect(navigate).toHaveBeenCalledWith('/login');
    expect(el.querySelector('.name')).toBeNull();
    expect(el.querySelector('a.sign-in')).toBeTruthy();
  });
});
