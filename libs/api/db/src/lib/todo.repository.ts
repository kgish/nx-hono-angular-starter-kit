import type { CreateTodo, Todo, UpdateTodo } from '@fullstack/schemas';
import { and, asc, eq } from 'drizzle-orm';
import type { Db } from './client';
import { todos, type TodoRow } from './schema';

/**
 * Todos of one user at a time: every method takes the owner's id, and a todo
 * of someone else is treated as not existing.
 */
export interface TodoRepository {
  list(userId: string): Promise<Todo[]>;
  findById(userId: string, id: number): Promise<Todo | undefined>;
  create(userId: string, input: CreateTodo): Promise<Todo>;
  update(
    userId: string,
    id: number,
    input: UpdateTodo,
  ): Promise<Todo | undefined>;
  remove(userId: string, id: number): Promise<boolean>;
}

export const toTodo = (row: TodoRow): Todo => ({
  id: row.id,
  title: row.title,
  completed: row.completed,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

const owned = (userId: string, id: number) =>
  and(eq(todos.id, id), eq(todos.userId, userId));

export class DrizzleTodoRepository implements TodoRepository {
  constructor(private readonly db: Db) {}

  async list(userId: string) {
    const rows = await this.db
      .select()
      .from(todos)
      .where(eq(todos.userId, userId))
      .orderBy(asc(todos.id));
    return rows.map(toTodo);
  }

  async findById(userId: string, id: number) {
    const [row] = await this.db.select().from(todos).where(owned(userId, id));
    return row && toTodo(row);
  }

  async create(userId: string, input: CreateTodo) {
    const [row] = await this.db
      .insert(todos)
      .values({ ...input, userId })
      .returning();
    return toTodo(row);
  }

  async update(userId: string, id: number, input: UpdateTodo) {
    const [row] = await this.db
      .update(todos)
      .set(input)
      .where(owned(userId, id))
      .returning();
    return row && toTodo(row);
  }

  async remove(userId: string, id: number) {
    const rows = await this.db
      .delete(todos)
      .where(owned(userId, id))
      .returning({ id: todos.id });
    return rows.length > 0;
  }
}
