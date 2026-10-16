import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { languageInterceptor } from './language-interceptor';
import { LanguageStore } from './language-store';

describe('languageInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([languageInterceptor])),
        provideHttpClientTesting(),
        provideTranslateService({ fallbackLang: 'en' }),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('sends the active language to the API', async () => {
    await TestBed.inject(LanguageStore).use('nl');
    const done = firstValueFrom(http.get('/api/todos'));
    const request = backend.expectOne('/api/todos');
    expect(request.request.headers.get('Accept-Language')).toBe('nl');
    request.flush([]);
    await done;
  });

  it('leaves other requests alone', async () => {
    const done = firstValueFrom(http.get('/i18n/en.json'));
    const request = backend.expectOne('/i18n/en.json');
    expect(request.request.headers.has('Accept-Language')).toBe(false);
    request.flush({});
    await done;
  });
});
