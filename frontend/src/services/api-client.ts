// The only place that should call fetch() directly. Module services call these helpers instead
// of raw fetch, so auth headers / base URL / error handling stay in one place.
// TODO: add token refresh handling once authentication module issues refresh tokens.

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiError {
  success: false;
  error: { message: string; details?: unknown };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem('uts_token');

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const body = (await res.json()) as ApiSuccess<T> | ApiError;

  if (!body.success) {
    throw new Error(body.error.message);
  }

  return body.data;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
