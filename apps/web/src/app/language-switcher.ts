import { UpperCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LanguageStore } from '@fullstack/web/i18n';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe, UpperCasePipe],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.scss',
})
export class LanguageSwitcher {
  protected readonly store = inject(LanguageStore);
}
