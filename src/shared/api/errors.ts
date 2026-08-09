import type { z } from 'zod';

/** The request never reached the server (offline, DNS, timeout, CORS). */
export class NetworkError extends Error {
  constructor(message = 'Network request failed', options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'NetworkError';
  }
}

/** The server responded but the payload did not match its schema. */
export class ValidationError extends Error {
  readonly issues: z.core.$ZodIssue[];

  constructor(message: string, issues: z.core.$ZodIssue[]) {
    super(message);
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

/** The server responded with a non-2xx status. Carries the status and a code. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/** Whether an error is the expected "reserved by someone else" race (HTTP 409). */
export function isReservationConflict(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 409;
}
