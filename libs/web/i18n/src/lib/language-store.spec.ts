import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { LANGUAGE_STORAGE_KEY, LanguageStore } from './language-store';

describe('LanguageStore', () => {
  let browserLanguages: string[];
  let store: LanguageStore;

  beforeEach(() => {
    localStorage.clear();
    browserLanguages = ['en-US'];
    vi.spyOn(navigator, 'languages', 'get').mockImplementation(
      () => browserLanguages,
    );
    TestBed.configureTestingModule({
      providers: [provideTranslateService({ fallbackLang: 'en' })],
    });
    store = TestBed.inject(LanguageStore);
  });

  afterEach(() => vi.restoreAllMocks());

  it('starts in the first supported browser language', async () => {
    browserLanguages = ['de-DE', 'nl-BE', 'en'];
    await store.init();
    expect(store.current()).toBe('nl');
    expect(document.documentElement.lang).toBe('nl');
  });

  it('falls back to English when no browser language is supported', async () => {
    browserLanguages = ['de-DE', 'fr'];
    await store.init();
    expect(store.current()).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('does not remember the detected language', async () => {
    browserLanguages = ['nl-NL'];
    await store.init();
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBeNull();
  });

  it('remembers the language the user switches to', async () => {
    await store.init();
    await store.use('nl');
    expect(store.current()).toBe('nl');
    expect(document.documentElement.lang).toBe('nl');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('nl');
  });

  it('restores the remembered language over the browser language', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'nl');
    browserLanguages = ['en-US'];
    await store.init();
    expect(store.current()).toBe('nl');
  });

  it('ignores a remembered language that is not supported', async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr');
    browserLanguages = ['nl-NL'];
    await store.init();
    expect(store.current()).toBe('nl');
  });
});
