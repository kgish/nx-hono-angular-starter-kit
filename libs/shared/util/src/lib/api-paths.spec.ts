import { ApiPaths } from './api-paths';

describe('ApiPaths', () => {
  it('builds todo paths', () => {
    expect(ApiPaths.todos).toBe('/api/todos');
    expect(ApiPaths.todo(7)).toBe('/api/todos/7');
  });
});
