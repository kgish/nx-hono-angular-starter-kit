/** Single source of truth for HTTP paths shared by the API and the web client. */
export const API_PREFIX = '/api';

export const ApiPaths = {
  health: `${API_PREFIX}/health`,
  todos: `${API_PREFIX}/todos`,
  todo: (id: number | string) => `${API_PREFIX}/todos/${id}`,
} as const;
