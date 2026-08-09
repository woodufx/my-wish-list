import type { z } from 'zod';
import { env } from '@/shared/config/env';
import { ApiError, NetworkError, ValidationError } from './errors';

/**
 * The http client lives in `shared` and therefore cannot import the guest entity.
 * The token is injected instead: the app layer wires this to the guest storage at
 * startup, so every request still carries `X-Guest-Token` automatically.
 */
let guestTokenProvider: () => string | null = () => null;

export function setGuestTokenProvider(provider: () => string | null): void {
  guestTokenProvider = provider;
}

interface RequestOptions<TSchema extends z.ZodType> {
  /** Schema the response is validated against at runtime. */
  schema: TSchema;
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

async function request<TSchema extends z.ZodType>(
  path: string,
  options: RequestOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  const token = guestTokenProvider();
  if (token) {
    headers['X-Guest-Token'] = token;
  }

  let response: Response;
  try {
    response = await fetch(`${env.VITE_API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (cause) {
    throw new NetworkError('Failed to reach the server', { cause });
  }

  if (!response.ok) {
    const errorBody = await readJson(response);
    const { code, message } = parseErrorBody(errorBody, response.status);
    throw new ApiError(response.status, code, message);
  }

  const payload = await readJson(response);
  const parsed = options.schema.safeParse(payload);
  if (!parsed.success) {
    throw new ValidationError(`Invalid response for ${path}`, parsed.error.issues);
  }
  return parsed.data;
}

function parseErrorBody(body: unknown, status: number): { code: string; message: string } {
  const fallback = { code: `HTTP_${status}`, message: `Request failed (${status})` };
  if (!body || typeof body !== 'object') {
    return fallback;
  }
  const code = 'code' in body && typeof body.code === 'string' ? body.code : fallback.code;
  const message =
    'message' in body && typeof body.message === 'string' ? body.message : fallback.message;
  return { code, message };
}

export const http = {
  get<TSchema extends z.ZodType>(path: string, schema: TSchema, signal?: AbortSignal) {
    return request(path, { schema, method: 'GET', signal });
  },
  post<TSchema extends z.ZodType>(
    path: string,
    body: unknown,
    schema: TSchema,
    signal?: AbortSignal,
  ) {
    return request(path, { schema, method: 'POST', body, signal });
  },
  patch<TSchema extends z.ZodType>(
    path: string,
    body: unknown,
    schema: TSchema,
    signal?: AbortSignal,
  ) {
    return request(path, { schema, method: 'PATCH', body, signal });
  },
  del<TSchema extends z.ZodType>(path: string, schema: TSchema, signal?: AbortSignal) {
    return request(path, { schema, method: 'DELETE', signal });
  },
};
