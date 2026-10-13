import type { CreateTodo, Todo, UpdateTodo } from '@fullstack/schemas';
import { asc, eq } from 'drizzle-orm';
import type { Db } from './client';
import { todos, type TodoRow } from './schema';

export interface TodoRepository {
  list(): Promise<Todo[]>;
  findById(id: number): Promise<Todo | undefined>;
  create(input: CreateTodo): Promise<Todo>;
  update(id: number, input: UpdateTodo): Promise<Todo | undefined>;
  remove(id: number): Promise<boolean>;
}

export const toTodo = (row: TodoRow): Todo => ({
  id: row.id,
  title: row.title,
  completed: row.completed,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export class DrizzleTodoRepository implements TodoRepository {
  constructor(private readonly db: Db) {}

  async list() {
    const rows = await this.db.select().from(todos).orderBy(asc(todos.id));
    return rows.map(toTodo);
  }

  async findById(id: number) {
    const [row] = await this.db.select().from(todos).where(eq(todos.id, id));
    return row && toTodo(row);
  }

  async create(input: CreateTodo) {
    const [row] = await this.db.insert(todos).values(input).returning();
    return toTodo(row);
  }

  async update(id: number, input: UpdateTodo) {
    const [row] = await this.db
      .update(todos)
      .set(input)
      .where(eq(todos.id, id))
      .returning();
    return row && toTodo(row);
  }

  async remove(id: number) {
    const rows = await this.db
      .delete(todos)
      .where(eq(todos.id, id))
      .returning({ id: todos.id });
    return rows.length > 0;
  }
}
