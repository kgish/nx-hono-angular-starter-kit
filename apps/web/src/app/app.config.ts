import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  DEFAULT_LANGUAGE,
  languageInterceptor,
  LanguageStore,
} from '@fullstack/web/i18n';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([languageInterceptor])),
    provideRouter(appRoutes, withComponentInputBinding()),
    // Translations are served from apps/web/public/i18n/<lang>.json.
    provideTranslateService({
      fallbackLang: DEFAULT_LANGUAGE,
      loader: provideTranslateHttpLoader({ prefix: '/i18n/', suffix: '.json' }),
    }),
    // Load the starting language before the first render, so keys never flash.
    provideAppInitializer(() => inject(LanguageStore).init()),
  ],
};
