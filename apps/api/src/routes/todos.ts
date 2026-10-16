import type { TodoRepository } from '@fullstack/api/db';
import {
  CreateTodoSchema,
  TodoIdSchema,
  UpdateTodoSchema,
} from '@fullstack/schemas';
import { Hono } from 'hono';
import { z } from 'zod';
import type { Auth } from '../auth';
import { requireSession, type SessionEnv } from '../require-session';
import { validate } from '../validator';

const IdParam = z.object({ id: TodoIdSchema });
const notFound = { error: 'Todo not found' };

/** The signed-in user's todos; other users' todos answer 404. */
export const todoRoutes = (todos: TodoRepository, auth: Auth) =>
  new Hono<SessionEnv>()
    .use(requireSession(auth))
    .get('/', async (c) => c.json(await todos.list(c.var.user.id)))
    .get('/:id', validate('param', IdParam), async (c) => {
      const todo = await todos.findById(c.var.user.id, c.req.valid('param').id);
      return todo ? c.json(todo) : c.json(notFound, 404);
    })
    .post('/', validate('json', CreateTodoSchema), async (c) => {
      const todo = await todos.create(c.var.user.id, c.req.valid('json'));
      return c.json(todo, 201);
    })
    .patch(
      '/:id',
      validate('param', IdParam),
      validate('json', UpdateTodoSchema),
      async (c) => {
        const todo = await todos.update(
          c.var.user.id,
          c.req.valid('param').id,
          c.req.valid('json'),
        );
        return todo ? c.json(todo) : c.json(notFound, 404);
      },
    )
    .delete('/:id', validate('param', IdParam), async (c) => {
      const removed = await todos.remove(
        c.var.user.id,
        c.req.valid('param').id,
      );
      return removed ? c.body(null, 204) : c.json(notFound, 404);
    });
