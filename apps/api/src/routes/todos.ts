import type { TodoRepository } from '@fullstack/api/db';
import {
  CreateTodoSchema,
  TodoIdSchema,
  UpdateTodoSchema,
} from '@fullstack/schemas';
import { Hono } from 'hono';
import { z } from 'zod';
import { validate } from '../validator';

const IdParam = z.object({ id: TodoIdSchema });
const notFound = { error: 'Todo not found' };

export const todoRoutes = (todos: TodoRepository) =>
  new Hono()
    .get('/', async (c) => c.json(await todos.list()))
    .get('/:id', validate('param', IdParam), async (c) => {
      const todo = await todos.findById(c.req.valid('param').id);
      return todo ? c.json(todo) : c.json(notFound, 404);
    })
    .post('/', validate('json', CreateTodoSchema), async (c) => {
      const todo = await todos.create(c.req.valid('json'));
      return c.json(todo, 201);
    })
    .patch(
      '/:id',
      validate('param', IdParam),
      validate('json', UpdateTodoSchema),
      async (c) => {
        const todo = await todos.update(
          c.req.valid('param').id,
          c.req.valid('json'),
        );
        return todo ? c.json(todo) : c.json(notFound, 404);
      },
    )
    .delete('/:id', validate('param', IdParam), async (c) => {
      const removed = await todos.remove(c.req.valid('param').id);
      return removed ? c.body(null, 204) : c.json(notFound, 404);
    });
