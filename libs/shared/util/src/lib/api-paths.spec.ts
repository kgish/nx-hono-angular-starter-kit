import { ApiPaths } from './api-paths';

describe('ApiPaths', () => {
  it('builds todo paths', () => {
    expect(ApiPaths.todos).toBe('/api/todos');
    expect(ApiPaths.todo(7)).toBe('/api/todos/7');
  });

  it('puts the auth endpoints under /api/auth', () => {
    expect(ApiPaths.signIn).toBe('/api/auth/sign-in/email');
    expect(ApiPaths.session).toBe('/api/auth/get-session');
  });
});
