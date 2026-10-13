import { TodoListSchema, TodoSchema, type ApiError } from '@fullstack/schemas';
import { ApiPaths } from '@fullstack/util';
import { beforeEach, describe, expect, it } from 'bun:test';
import { createApp } from './app';
import { InMemoryTodoRepository } from './testing/in-memory-todo.repository';

const json = (body: unknown, method = 'POST'): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

describe('API', () => {
  let app: ReturnType<typeof createApp>;
  let dbUp: boolean;

  beforeEach(() => {
    dbUp = true;
    app = createApp({
      todos: new InMemoryTodoRepository(),
      pingDatabase: async () => dbUp,
      log: false,
    });
  });

  it('reports health', async () => {
    expect((await app.request(ApiPaths.health)).status).toBe(200);
    dbUp = false;
    const res = await app.request(ApiPaths.health);
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({
      status: 'degraded',
      database: 'down',
    });
  });

  it('creates, lists, updates and deletes todos', async () => {
    const created = await app.request(
      ApiPaths.todos,
      json({ title: ' Write tests ' }),
    );
    expect(created.status).toBe(201);
    const todo = TodoSchema.parse(await created.json());
    expect(todo.title).toBe('Write tests');

    const list = TodoListSchema.parse(
      await (await app.request(ApiPaths.todos)).json(),
    );
    expect(list).toHaveLength(1);

    const updated = await app.request(
      ApiPaths.todo(todo.id),
      json({ completed: true }, 'PATCH'),
    );
    expect(TodoSchema.parse(await updated.json()).completed).toBe(true);

    expect(
      (await app.request(ApiPaths.todo(todo.id), { method: 'DELETE' })).status,
    ).toBe(204);
    expect((await app.request(ApiPaths.todo(todo.id))).status).toBe(404);
  });

  it('rejects invalid input with the shared error shape', async () => {
    const res = await app.request(ApiPaths.todos, json({ title: '' }));
    expect(res.status).toBe(400);
    const body = (await res.json()) as ApiError;
    expect(body.error).toBe('Validation failed');
    expect(body.issues?.[0]?.path).toEqual(['title']);
  });

  it('rejects non-numeric ids', async () => {
    expect((await app.request(ApiPaths.todo('abc'))).status).toBe(400);
  });

  it('returns JSON 404 for unknown routes', async () => {
    const res = await app.request('/api/nope');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Not found' });
  });
});
