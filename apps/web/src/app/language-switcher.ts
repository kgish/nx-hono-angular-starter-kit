import { UpperCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LANGUAGES, LanguageStore } from '@fullstack/web/i18n';
import { Notifier } from '@fullstack/web/notifications';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Buttons to switch the UI language. A switch is confirmed with a notification
 * in the new language.
 */
@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe, UpperCasePipe],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.scss',
})
export class LanguageSwitcher {
  protected readonly store = inject(LanguageStore);
  private readonly notifier = inject(Notifier);

  protected async switchTo(
    language: (typeof LANGUAGES)[number],
  ): Promise<void> {
    if (this.store.current() === language.code) return;
    await this.store.use(language.code);
    // The store keeps the previous language when the translations fail to load.
    if (this.store.current() === language.code) {
      this.notifier.info('app.languageChanged', { language: language.name });
    }
  }
}
