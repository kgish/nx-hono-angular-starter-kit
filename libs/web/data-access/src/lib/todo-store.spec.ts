import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { Todo } from '@fullstack/schemas';
import { ApiPaths } from '@fullstack/util';
import { TodoStore } from './todo-store';

const todo = (id: number, completed = false): Todo => ({
  id,
  title: `Todo ${id}`,
  completed,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('TodoStore', () => {
  let store: TodoStore;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(TodoStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads todos and counts the remaining ones', async () => {
    const done = store.load();
    http.expectOne(ApiPaths.todos).flush([todo(1), todo(2, true)]);
    await done;
    expect(store.todos()).toHaveLength(2);
    expect(store.remaining()).toBe(1);
  });

  it('drops the previous list while loading, as it may be another user’s', async () => {
    const first = store.load();
    http.expectOne(ApiPaths.todos).flush([todo(1)]);
    await first;

    const second = store.load();
    expect(store.todos()).toEqual([]);
    http.expectOne(ApiPaths.todos).flush([todo(2)]);
    await second;
    expect(store.todos().map((t) => t.id)).toEqual([2]);
  });

  it('surfaces the API validation message', async () => {
    const done = store.add('');
    http.expectOne(ApiPaths.todos).flush(
      {
        error: 'Validation failed',
        issues: [{ path: ['title'], message: 'Title is required' }],
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await done;
    expect(store.error()).toBe('Title is required');
  });

  it('rejects responses that do not match the shared schema', async () => {
    const done = store.load();
    http.expectOne(ApiPaths.todos).flush([{ id: 'nope' }]);
    await done;
    expect(store.error()).toBeTruthy();
    expect(store.todos()).toEqual([]);
  });
});
