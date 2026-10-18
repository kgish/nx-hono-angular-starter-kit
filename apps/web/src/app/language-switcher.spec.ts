import { TestBed } from '@angular/core/testing';
import { LANGUAGE_STORAGE_KEY, LanguageStore } from '@fullstack/web/i18n';
import { Notifier } from '@fullstack/web/notifications';
import { provideTranslateService } from '@ngx-translate/core';
import { LanguageSwitcher } from './language-switcher';

describe('LanguageSwitcher', () => {
  let notifyInfo: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LanguageSwitcher],
      providers: [provideTranslateService({ lang: 'en', fallbackLang: 'en' })],
    }).compileComponents();
    notifyInfo = vi
      .spyOn(TestBed.inject(Notifier), 'info')
      .mockImplementation(() => undefined);
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

  it('confirms the switch, naming the language in its own language', async () => {
    const fixture = TestBed.createComponent(LanguageSwitcher);
    await fixture.whenStable();
    const [en, nl] = buttons(fixture.nativeElement);

    nl.click();
    await fixture.whenStable();
    expect(notifyInfo).toHaveBeenLastCalledWith('app.languageChanged', {
      language: 'Nederlands',
    });

    en.click();
    await fixture.whenStable();
    expect(notifyInfo).toHaveBeenLastCalledWith('app.languageChanged', {
      language: 'English',
    });
  });

  it('does not notify when the active language is clicked', async () => {
    const fixture = TestBed.createComponent(LanguageSwitcher);
    await fixture.whenStable();
    const [en] = buttons(fixture.nativeElement);

    en.click();
    await fixture.whenStable();

    expect(notifyInfo).not.toHaveBeenCalled();
  });
});
