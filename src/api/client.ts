export const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');
export const API_BASE = `${API_ORIGIN}/api/v1`;

const TOKEN_KEY = 'hearcare_admin_token';
export const UNAUTHORIZED_EVENT = 'hearcare:unauthorized';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  code: string;
  details: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface ListMeta {
  page: number;
  limit: number;
  total: number;
}
export interface ListResult<T> {
  data: T[];
  meta: ListMeta;
}

type Query = Record<string, string | number | boolean | null | undefined>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  form?: FormData;
}

function buildUrl(path: string, query?: Query) {
  const url = new URL(API_BASE + path);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

async function request(method: string, path: string, opts: RequestOptions = {}): Promise<any> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form; // browser sets the multipart boundary
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), { method, headers, body });
  } catch {
    throw new ApiError(
      0,
      'NETWORK',
      'We could not reach the server. Please check your internet connection and try again.',
    );
  }

  let json: any = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    const err = json?.error;
    if (res.status === 401 && token && !path.startsWith('/admin/auth/login')) {
      tokenStore.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(
      res.status,
      err?.code || 'ERROR',
      err?.message || friendlyStatus(res.status),
      err?.details,
    );
  }
  return json;
}

function friendlyStatus(status: number) {
  if (status === 401) return 'Your session has ended. Please sign in again.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'We could not find that. It may have been deleted.';
  if (status === 413) return 'That file is too big. Please choose a smaller one.';
  if (status >= 500) return 'Something went wrong on our side. Please try again in a moment.';
  return 'Something went wrong. Please check what you entered and try again.';
}

function unwrap<T>(body: any): T {
  if (body && typeof body === 'object' && !Array.isArray(body) && 'data' in body) return body.data as T;
  return body as T;
}

export const api = {
  /** Single item or plain object. Unwraps `{ data }` when present. */
  get: async <T>(path: string, query?: Query) => unwrap<T>(await request('GET', path, { query })),
  post: async <T>(path: string, body?: unknown) => unwrap<T>(await request('POST', path, { body: body ?? {} })),
  put: async <T>(path: string, body?: unknown) => unwrap<T>(await request('PUT', path, { body })),
  del: async <T = unknown>(path: string) => unwrap<T>(await request('DELETE', path)),
  upload: async <T>(path: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return unwrap<T>(await request('POST', path, { form }));
  },
  /** Lists: `{ data: [], meta }`. */
  list: async <T>(path: string, query?: Query): Promise<ListResult<T>> => {
    const body = await request('GET', path, { query });
    if (Array.isArray(body)) {
      return { data: body, meta: { page: 1, limit: body.length, total: body.length } };
    }
    const data: T[] = Array.isArray(body?.data) ? body.data : [];
    const meta: ListMeta = {
      page: body?.meta?.page ?? 1,
      limit: body?.meta?.limit ?? (data.length || 1),
      total: body?.meta?.total ?? data.length,
    };
    return { data, meta };
  },
};

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Something went wrong. Please try again.';
}
