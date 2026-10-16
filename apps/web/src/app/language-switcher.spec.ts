import { TestBed } from '@angular/core/testing';
import { LANGUAGE_STORAGE_KEY, LanguageStore } from '@fullstack/web/i18n';
import { provideTranslateService } from '@ngx-translate/core';
import { LanguageSwitcher } from './language-switcher';

describe('LanguageSwitcher', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LanguageSwitcher],
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    }).compileComponents();
  });

  const buttons = (el: HTMLElement) => [...el.querySelectorAll('button')];

  it('offers every language and marks the active one', async () => {
    const fixture = TestBed.createComponent(LanguageSwitcher);
    await fixture.whenStable();
    const [en, nl] = buttons(fixture.nativeElement);
    expect(en.textContent?.trim()).toBe('EN');
    expect(nl.textContent?.trim()).toBe('NL');
    expect(en.getAttribute('aria-pressed')).toBe('true');
    expect(nl.getAttribute('aria-pressed')).toBe('false');
  });

  it('switches the language and remembers it', async () => {
    const fixture = TestBed.createComponent(LanguageSwitcher);
    await fixture.whenStable();
    const [en, nl] = buttons(fixture.nativeElement);

    nl.click();
    await fixture.whenStable();

    expect(TestBed.inject(LanguageStore).current()).toBe('nl');
    expect(nl.getAttribute('aria-pressed')).toBe('true');
    expect(en.getAttribute('aria-pressed')).toBe('false');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('nl');
  });
});
