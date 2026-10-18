import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { VERSION } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LOG_LEVEL } from '@fullstack/web/logging';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
// The version lives in the root package.json, which belongs to no Nx project.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { version } from '../../../../package.json';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
        { provide: LOG_LEVEL, useValue: 'info' },
      ],
    }).compileComponents();
  });

  afterEach(() => vi.restoreAllMocks());

  it('renders the toolbar, the router outlet and the footer', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-toolbar')).toBeTruthy();
    expect(el.querySelector('router-outlet')).toBeTruthy();
    expect(el.querySelector('app-footer')).toBeTruthy();
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

  it('logs what it is running with when it starts', async () => {
    TestBed.inject(TranslateService).setTranslation('en', {
      app: { title: 'Todos' },
    });
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    expect(console.info).toHaveBeenCalledExactlyOnceWith('Todos started', {
      version,
      mode: 'development',
      logLevel: 'info',
      language: 'en',
      angular: VERSION.full,
      api: '/api',
    });
  });
});
