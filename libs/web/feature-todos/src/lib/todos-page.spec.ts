import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApiPaths } from '@fullstack/util';
import { TodosPage } from './todos-page';

describe('TodosPage', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodosPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  it('renders the loaded todos', async () => {
    const fixture = TestBed.createComponent(TodosPage);
    fixture.detectChanges();
    http.expectOne(ApiPaths.todos).flush([
      {
        id: 1,
        title: 'Ship it',
        completed: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Ship it');
    expect(el.querySelector('.summary')?.textContent).toContain(
      '1 of 1 remaining',
    );
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
