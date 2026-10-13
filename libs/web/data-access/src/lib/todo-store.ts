import { HttpErrorResponse } from '@angular/common/http';
import {
  computed,
  inject,
  Injectable,
  PendingTasks,
  signal,
} from '@angular/core';
import { ApiErrorSchema, type Todo, type UpdateTodo } from '@fullstack/schemas';
import { firstValueFrom } from 'rxjs';
import { TodoApi } from './todo-api';

/** Signal-based state for the todo list. */
@Injectable({ providedIn: 'root' })
export class TodoStore {
  private readonly api = inject(TodoApi);
  private readonly pendingTasks = inject(PendingTasks);

  private readonly state = signal<{
    todos: Todo[];
    loading: boolean;
    error: string | null;
  }>({
    todos: [],
    loading: false,
    error: null,
  });

  readonly todos = computed(() => this.state().todos);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  readonly remaining = computed(
    () => this.todos().filter((todo) => !todo.completed).length,
  );

  async load(): Promise<void> {
    await this.run(async () => {
      const todos = await firstValueFrom(this.api.list());
      this.state.update((s) => ({ ...s, todos }));
    });
  }

  async add(title: string): Promise<void> {
    await this.run(async () => {
      const todo = await firstValueFrom(this.api.create({ title }));
      this.state.update((s) => ({ ...s, todos: [...s.todos, todo] }));
    });
  }

  async toggle(todo: Todo): Promise<void> {
    await this.update(todo.id, { completed: !todo.completed });
  }

  async update(id: number, changes: UpdateTodo): Promise<void> {
    await this.run(async () => {
      const updated = await firstValueFrom(this.api.update(id, changes));
      this.state.update((s) => ({
        ...s,
        todos: s.todos.map((todo) => (todo.id === id ? updated : todo)),
      }));
    });
  }

  async remove(id: number): Promise<void> {
    await this.run(async () => {
      await firstValueFrom(this.api.remove(id));
      this.state.update((s) => ({
        ...s,
        todos: s.todos.filter((todo) => todo.id !== id),
      }));
    });
  }

  /** Tracks the request as a pending task so whenStable() and SSR wait for it. */
  private async run(action: () => Promise<void>): Promise<void> {
    const done = this.pendingTasks.add();
    this.state.update((s) => ({ ...s, loading: true, error: null }));
    try {
      await action();
    } catch (error) {
      this.state.update((s) => ({ ...s, error: toMessage(error) }));
    } finally {
      this.state.update((s) => ({ ...s, loading: false }));
      done();
    }
  }
}

function toMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = ApiErrorSchema.safeParse(error.error);
    if (body.success) return body.data.issues?.[0]?.message ?? body.data.error;
    return error.status === 0 ? 'Cannot reach the API' : error.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong';
}
