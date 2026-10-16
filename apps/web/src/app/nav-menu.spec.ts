import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiPaths } from '@fullstack/util';
import { AuthStore } from '@fullstack/web/data-access';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { NavMenu } from './nav-menu';

const user = {
  id: 'u1',
  name: 'Demo User',
  email: 'demo@example.org',
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('NavMenu', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavMenu],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: '**', children: [] }]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(TranslateService).setTranslation('en', {
      nav: {
        menu: 'Menu',
        label: 'Main',
        todos: 'Todos',
        register: 'Create account',
      },
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

  const render = async () => {
    const fixture = TestBed.createComponent(NavMenu);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      toggle: el.querySelector('button.toggle') as HTMLButtonElement,
      drawer: el.querySelector('nav') as HTMLElement,
      links: () =>
        Array.from(el.querySelectorAll('nav a'), (a) => [
          a.textContent?.trim(),
          a.getAttribute('href'),
        ]),
    };
  };

  it('starts closed with a labelled toggle', async () => {
    const { toggle, drawer } = await render();
    expect(toggle.getAttribute('aria-label')).toBe('Menu');
    expect(toggle.getAttribute('aria-controls')).toBe(drawer.id);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(drawer.classList).not.toContain('open');
  });

  it('links to register when signed out', async () => {
    const { links } = await render();
    expect(links()).toEqual([['Create account', '/register']]);
  });

  it('links to the todos when signed in', async () => {
    await signedIn();
    const { links } = await render();
    expect(links()).toEqual([['Todos', '/']]);
  });

  it('opens and closes with the toggle', async () => {
    const { fixture, toggle, drawer } = await render();

    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(drawer.classList).toContain('open');

    toggle.click();
    await fixture.whenStable();
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(drawer.classList).not.toContain('open');
  });

  it('closes when a link is followed', async () => {
    const { fixture, toggle, drawer } = await render();
    toggle.click();
    await fixture.whenStable();

    drawer.querySelector('a')?.click();
    await fixture.whenStable();

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('closes on Escape and returns focus to the toggle', async () => {
    const { fixture, toggle, drawer } = await render();
    toggle.click();
    await fixture.whenStable();
    drawer.querySelector('a')?.focus();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle);
  });

  it('closes on a click outside it', async () => {
    const { fixture, toggle } = await render();
    toggle.click();
    await fixture.whenStable();

    document.body.click();
    await fixture.whenStable();

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});
