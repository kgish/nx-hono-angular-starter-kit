import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
      ],
    }).compileComponents();
  });

  it('renders the header and the router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('header app-user-menu')).toBeTruthy();
    expect(el.querySelector('header app-language-switcher')).toBeTruthy();
    expect(el.querySelector('router-outlet')).toBeTruthy();
  });

  it('shows the page title in the active language', async () => {
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', { app: { title: 'Todos' } });
    translate.setTranslation('nl', { app: { title: 'Taken' } });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    expect(document.title).toBe('Todos');

    translate.use('nl');
    await fixture.whenStable();
    expect(document.title).toBe('Taken');
  });
});
