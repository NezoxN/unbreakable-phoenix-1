/** Помилка API у форматі сервера: `{ ok: false, message, errors }` */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors: Record<string, string> = {}
  ) {
    super(message);
  }
}

type Body = Record<string, unknown> | unknown[] | FormData | undefined;

async function request<T>(method: string, path: string, body?: Body): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      headers: body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : undefined,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Чесна обробка відключеного бекенду — без імітації успіху
    throw new ApiError('BACKEND OFFLINE: сервер ліги недоступний. Спробуйте пізніше.', 0);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new ApiError(data.message || `Помилка сервера (${res.status}).`, res.status, data.errors);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: Body) => request<T>('POST', path, body ?? {}),
  put: <T>(path: string, body?: Body) => request<T>('PUT', path, body ?? {}),
  patch: <T>(path: string, body?: Body) => request<T>('PATCH', path, body ?? {}),
  del: <T>(path: string) => request<T>('DELETE', path),
};

/** Повний перехід на OAuth-ендпоінт (редірект на FACEIT/Discord) */
export const startFaceitLogin = () => {
  window.location.href = '/api/auth/faceit/login';
};
export const startDiscordLink = () => {
  window.location.href = '/api/discord/link';
};

export const qs = (params: Record<string, string | number | undefined | null>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '' && v !== 'ALL') s.set(k, String(v));
  }
  const str = s.toString();
  return str ? `?${str}` : '';
};
