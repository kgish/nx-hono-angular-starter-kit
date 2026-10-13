import { z } from 'zod';

export const TodoIdSchema = z.coerce.number().int().positive();

export const TodoSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().trim().min(1, 'Title is required').max(200),
  completed: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const CreateTodoSchema = TodoSchema.pick({ title: true });

export const UpdateTodoSchema = TodoSchema.pick({
  title: true,
  completed: true,
})
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided',
  });

export const TodoListSchema = z.array(TodoSchema);

export type TodoId = z.infer<typeof TodoIdSchema>;
export type Todo = z.infer<typeof TodoSchema>;
export type CreateTodo = z.infer<typeof CreateTodoSchema>;
export type UpdateTodo = z.infer<typeof UpdateTodoSchema>;
