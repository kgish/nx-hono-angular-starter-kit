import type { TodoRepository } from '@fullstack/api/db';
import type { CreateTodo, Todo, UpdateTodo } from '@fullstack/schemas';

export class InMemoryTodoRepository implements TodoRepository {
  private readonly todos = new Map<number, Todo>();
  private nextId = 1;

  async list() {
    return [...this.todos.values()];
  }

  async findById(id: number) {
    return this.todos.get(id);
  }

  async create({ title }: CreateTodo) {
    const now = new Date().toISOString();
    const todo: Todo = {
      id: this.nextId++,
      title,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };
    this.todos.set(todo.id, todo);
    return todo;
  }

  async update(id: number, input: UpdateTodo) {
    const existing = this.todos.get(id);
    if (!existing) return undefined;
    const todo = { ...existing, ...input, updatedAt: new Date().toISOString() };
    this.todos.set(id, todo);
    return todo;
  }

  async remove(id: number) {
    return this.todos.delete(id);
  }
}
