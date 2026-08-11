import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * The error codes the MSW mocks emit — the frontend's `parseErrorBody` reads
 * `{ code, message }`, so the real API must speak the exact same vocabulary.
 */
export type ErrorCode =
  | 'NOT_FOUND'
  | 'NO_TOKEN'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'ALREADY_RESERVED'
  | 'VALIDATION'
  | 'INTERNAL';

/** A thrown error that maps to a specific HTTP status and `{ code, message }` body. */
export class HttpError extends Error {
  readonly status: ContentfulStatusCode;
  readonly code: ErrorCode;

  constructor(status: ContentfulStatusCode, code: ErrorCode, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

export const errors = {
  notFound: (message = 'Not found') => new HttpError(404, 'NOT_FOUND', message),
  noToken: (message = 'Missing guest token') => new HttpError(400, 'NO_TOKEN', message),
  unauthorized: (message = 'Unauthorized') => new HttpError(401, 'UNAUTHORIZED', message),
  forbidden: (message = 'Forbidden') => new HttpError(403, 'FORBIDDEN', message),
  alreadyReserved: (message = 'Already reserved by someone else') =>
    new HttpError(409, 'ALREADY_RESERVED', message),
  validation: (message = 'Invalid request') => new HttpError(400, 'VALIDATION', message),
};

/** Hono `onError` handler: unify every failure into `{ code, message }` + status. */
export function onError(err: unknown, c: Context): Response {
  if (err instanceof HttpError) {
    return c.json({ code: err.code, message: err.message }, err.status);
  }
  // Anything unexpected is a 500 — never leak internals to the client.
  console.error('Unhandled server error:', err);
  return c.json({ code: 'INTERNAL', message: 'Server error' } as const, 500);
}

/** Hono `notFound` handler: unmatched routes speak the same error shape. */
export function notFound(c: Context): Response {
  return c.json({ code: 'NOT_FOUND', message: 'Not found' } as const, 404);
}
