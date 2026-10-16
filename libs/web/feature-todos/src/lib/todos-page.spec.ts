import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiPaths } from '@fullstack/util';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { TodosPage } from './todos-page';

const todo = {
  id: 1,
  title: 'Ship it',
  completed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('TodosPage', () => {
  let http: HttpTestingController;
  let translate: TranslateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodosPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService({ lang: 'en', fallbackLang: 'en' }),
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', {
      todos: {
        summary: '{{remaining}} of {{total}} remaining',
        errors: { titleRequired: 'Title is required' },
      },
    });
    translate.setTranslation('nl', {
      todos: { summary: '{{remaining}} van {{total}} nog te doen' },
    });
  });

  it('renders the loaded todos', async () => {
    const fixture = TestBed.createComponent(TodosPage);
    fixture.detectChanges();
    http.expectOne(ApiPaths.todos).flush([todo]);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Ship it');
    expect(el.querySelector('.summary')?.textContent).toContain(
      '1 of 1 remaining',
    );
  });

  it('follows the active language', async () => {
    const fixture = TestBed.createComponent(TodosPage);
    fixture.detectChanges();
    http.expectOne(ApiPaths.todos).flush([todo]);
    await fixture.whenStable();

    translate.use('nl');
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.summary')
        ?.textContent,
    ).toContain('1 van 1 nog te doen');
  });

  it('validates the title with the shared schema before calling the API', async () => {
    const fixture = TestBed.createComponent(TodosPage);
    fixture.detectChanges();
    http.expectOne(ApiPaths.todos).flush([]);
    await fixture.whenStable();

    const form = (fixture.nativeElement as HTMLElement).querySelector(
      'form',
    ) as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.field-error')
        ?.textContent,
    ).toContain('Title is required');
    http.expectNone({ method: 'POST', url: ApiPaths.todos });
  });
});
