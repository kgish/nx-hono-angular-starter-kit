import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  type CreateTodo,
  type Todo,
  TodoListSchema,
  TodoSchema,
  type UpdateTodo,
} from '@fullstack/schemas';
import { ApiPaths } from '@fullstack/util';
import { map, type Observable } from 'rxjs';

/** Thin HTTP client that validates every response against the shared Zod schemas. */
@Injectable({ providedIn: 'root' })
export class TodoApi {
  private readonly http = inject(HttpClient);

  list(): Observable<Todo[]> {
    return this.http
      .get(ApiPaths.todos)
      .pipe(map((body) => TodoListSchema.parse(body)));
  }

  create(input: CreateTodo): Observable<Todo> {
    return this.http
      .post(ApiPaths.todos, input)
      .pipe(map((body) => TodoSchema.parse(body)));
  }

  update(id: number, input: UpdateTodo): Observable<Todo> {
    return this.http
      .patch(ApiPaths.todo(id), input)
      .pipe(map((body) => TodoSchema.parse(body)));
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(ApiPaths.todo(id));
  }
}
