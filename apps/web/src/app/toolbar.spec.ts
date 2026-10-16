import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Toolbar } from './toolbar';

describe('Toolbar', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Toolbar],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
      ],
    }).compileComponents();
  });

  it('puts the menu and title first, then account and language', async () => {
    const fixture = TestBed.createComponent(Toolbar);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    const start = el.querySelector('header .start');
    expect(start?.querySelector('app-nav-menu')).toBeTruthy();
    const title = start?.querySelector('a.title');
    expect(title?.textContent?.trim()).toBe('Nx Hono Angular Starter Kit');
    expect(title?.getAttribute('href')).toBe('/');

    const end = el.querySelector('header .end');
    expect(end?.querySelector('app-user-menu')).toBeTruthy();
    expect(end?.querySelector('app-language-switcher')).toBeTruthy();
  });
});
