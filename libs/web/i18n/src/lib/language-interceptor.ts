import type { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { API_PREFIX } from '@fullstack/util';
import { LanguageStore } from './language-store';

/**
 * Tells the API the active UI language as `Accept-Language`, so what it writes
 * for the user (such as the password-reset email) matches the screen.
 */
export const languageInterceptor: HttpInterceptorFn = (req, next) => {
  // Other requests include the translation files, which LanguageStore loads.
  if (!req.url.startsWith(API_PREFIX)) return next(req);
  const language = inject(LanguageStore).current();
  return next(req.clone({ setHeaders: { 'Accept-Language': language } }));
};
