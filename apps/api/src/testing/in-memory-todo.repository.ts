import type { TodoRepository } from '@fullstack/api/db';
import type { CreateTodo, Todo, UpdateTodo } from '@fullstack/schemas';

export class InMemoryTodoRepository implements TodoRepository {
  private readonly todos = new Map<number, { userId: string; todo: Todo }>();
  private nextId = 1;

  async list(userId: string) {
    return [...this.todos.values()]
      .filter((entry) => entry.userId === userId)
      .map((entry) => entry.todo);
  }

  async findById(userId: string, id: number) {
    const entry = this.todos.get(id);
    return entry?.userId === userId ? entry.todo : undefined;
  }

  async create(userId: string, { title }: CreateTodo) {
    const now = new Date().toISOString();
    const todo: Todo = {
      id: this.nextId++,
      title,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    this.todos.set(todo.id, { userId, todo });
    return todo;
  }

  async update(userId: string, id: number, input: UpdateTodo) {
    const existing = await this.findById(userId, id);
    if (!existing) return undefined;
    const todo = { ...existing, ...input, updatedAt: new Date().toISOString() };
    this.todos.set(id, { userId, todo });
    return todo;
  }

  async remove(userId: string, id: number) {
    if (!(await this.findById(userId, id))) return false;
    return this.todos.delete(id);
  }
}
