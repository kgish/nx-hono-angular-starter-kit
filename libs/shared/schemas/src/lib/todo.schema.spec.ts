import {
  CreateTodoSchema,
  TodoIdSchema,
  UpdateTodoSchema,
} from './todo.schema';

describe('todo schemas', () => {
  it('trims and accepts a valid title', () => {
    expect(CreateTodoSchema.parse({ title: '  Buy milk  ' })).toEqual({
      title: 'Buy milk',
    });
  });

  it('rejects an empty title', () => {
    expect(CreateTodoSchema.safeParse({ title: '   ' }).success).toBe(false);
  });

  it('requires at least one field on update', () => {
    expect(UpdateTodoSchema.safeParse({}).success).toBe(false);
    expect(UpdateTodoSchema.safeParse({ completed: true }).success).toBe(true);
  });

  it('coerces route ids', () => {
    expect(TodoIdSchema.parse('42')).toBe(42);
    expect(TodoIdSchema.safeParse('abc').success).toBe(false);
  });
});
