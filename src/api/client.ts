const baseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

let accessToken: string | null = null;
let generation = 0;
let refreshPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();
export function clearSession() {
  generation += 1;
  accessToken = null;
  listeners.forEach(listener => listener());
}
export function onSessionExpired(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
export function setAccessToken(token: string) {
  generation += 1;
  accessToken = token;
}
async function send<T>(path: string, options: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { ...options, credentials: 'include' });
  } catch {
    throw new ApiError(0, 'Не удалось подключиться к серверу. Проверьте соединение и адрес API.');
  }
  const text = await response.text();
  let data: unknown;
  try { data = text ? JSON.parse(text) : undefined; }
  catch { throw new ApiError(response.status, 'Сервер вернул некорректный ответ. Проверьте адрес API.'); }
  if (!response.ok) {
    const error = data as { error?: string; details?: unknown } | undefined;
    throw new ApiError(response.status, error?.error || `Ошибка сервера (${response.status})`, error?.details);
  }
  return data as T;
}
export async function refreshSession(): Promise<void> {
  if (!refreshPromise) {
    const startedAt = generation;
    refreshPromise = send<{ accessToken: string }>('/auth/refresh', { method: 'POST' })
      .then(result => {
        if (startedAt !== generation) throw new ApiError(401, 'Сессия завершена');
        accessToken = result.accessToken;
      })
      .catch(error => {
        if (startedAt === generation && error instanceof ApiError && error.status === 401) clearSession();
        throw error;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}
export async function waitForRefresh() {
  if (refreshPromise) await refreshPromise.catch(() => {});
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown; authenticated?: boolean };
export async function request<T>(path: string, { body, authenticated = true, ...options }: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  const token = accessToken;
  const startedAt = generation;
  if (authenticated && token) headers.set('Authorization', `Bearer ${token}`);
  const init = { ...options, headers, body: body === undefined ? undefined : JSON.stringify(body) };
  try {
    const result = await send<T>(path, init);
    if (authenticated && startedAt !== generation) throw new ApiError(401, 'Сессия завершена');
    return result;
  }
  catch (error) {
    if (!authenticated || !(error instanceof ApiError) || error.status !== 401) throw error;
    if (startedAt !== generation) throw error;
    if (accessToken === token) await refreshSession();
    headers.set('Authorization', `Bearer ${accessToken}`);
    try {
      const result = await send<T>(path, init);
      if (startedAt !== generation) throw new ApiError(401, 'Сессия завершена');
      return result;
    }
    catch (retryError) {
      if (retryError instanceof ApiError && retryError.status === 401 && startedAt === generation) clearSession();
      throw retryError;
    }
  }
}
