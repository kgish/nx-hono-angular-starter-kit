import {
  Component,
  effect,
  inject,
  isDevMode,
  OnInit,
  VERSION,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { LanguageStore } from '@fullstack/web/i18n';
import { LOG_LEVEL, Logger } from '@fullstack/web/logging';
import { API_PREFIX } from '@fullstack/util';
import { translate } from '@ngx-translate/core';
// The version lives in the root package.json, which belongs to no Nx project.
// eslint-disable-next-line @nx/enforce-module-boundaries
import { version } from '../../../../package.json';
import { Footer } from './footer';
import { Toolbar } from './toolbar';

@Component({
  imports: [RouterOutlet, Toolbar, Footer],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly title = inject(Title);
  private readonly logger = inject(Logger);
  private readonly appTitle = translate('app.title');

  constructor() {
    // Keep the browser tab title in the active language.
    effect(() => this.title.setTitle(String(this.appTitle())));

    // The app initializers have run by now, so the language is loaded.
    this.logger.info(`${this.appTitle()} started`, {
      version,
      mode: isDevMode() ? 'development' : 'production',
      logLevel: inject(LOG_LEVEL),
      language: inject(LanguageStore).current(),
      angular: VERSION.full,
      api: API_PREFIX,
    });
  }

  ngOnInit(): void {
    this.logger.debug('App.ngOnInit');
  }
}
