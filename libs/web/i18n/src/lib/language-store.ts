import { computed, DOCUMENT, inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

/** Languages the UI is translated into, each named in its own language. */
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'nl', name: 'Nederlands' },
] as const;

export type Language = (typeof LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: Language = 'en';

/** localStorage key holding the language the user switched to. */
export const LANGUAGE_STORAGE_KEY = 'language';

/** The active UI language, backed by ngx-translate's `TranslateService`. */
@Injectable({ providedIn: 'root' })
export class LanguageStore {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);

  readonly languages = LANGUAGES;
  readonly current = computed<Language>(() => {
    const lang = this.translate.currentLang();
    return isLanguage(lang) ? lang : DEFAULT_LANGUAGE;
  });

  /**
   * Starts in the language the user last switched to, else the first supported
   * browser language, else English. Resolves once its translations are loaded.
   */
  async init(): Promise<void> {
    this.translate.addLangs(LANGUAGES.map((language) => language.code));
    const candidates = [this.readSaved(), ...this.browserLanguages()];
    await this.apply(candidates.find(isLanguage) ?? DEFAULT_LANGUAGE);
  }

  /** Switches the UI language and remembers it for the next visit. */
  async use(lang: Language): Promise<void> {
    this.save(lang);
    await this.apply(lang);
  }

  private async apply(lang: Language): Promise<void> {
    try {
      await firstValueFrom(this.translate.use(lang));
    } catch {
      // ngx-translate logs the cause and keeps the previous language.
    }
    this.document.documentElement.lang = this.current();
  }

  /** Primary subtags of the browser's preferred languages, e.g. `nl-BE` → `nl`. */
  private browserLanguages(): string[] {
    const navigator = this.document.defaultView?.navigator;
    const tags = navigator?.languages?.length
      ? navigator.languages
      : [navigator?.language ?? ''];
    return tags.map((tag) => tag.split('-')[0].toLowerCase());
  }

  // Storage access throws when the browser blocks it; the language then
  // still switches, it just is not remembered.
  private readSaved(): string | null {
    try {
      return (
        this.document.defaultView?.localStorage.getItem(LANGUAGE_STORAGE_KEY) ??
        null
      );
    } catch {
      return null;
    }
  }

  private save(lang: Language): void {
    try {
      this.document.defaultView?.localStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        lang,
      );
    } catch {
      // Not remembered.
    }
  }
}

function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((language) => language.code === value);
}
