import { timingSafeEqual } from 'node:crypto';
import type { Context, MiddlewareHandler } from 'hono';
import { deleteCookie, getSignedCookie, setSignedCookie } from 'hono/cookie';
import { errors } from '../middleware/error';

const COOKIE = 'owner';
/** 30 days — the owner stays signed in on their own device. */
const MAX_AGE = 60 * 60 * 24 * 30;

function requireEnv(name: 'OWNER_SECRET' | 'COOKIE_SECRET'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for owner authentication`);
  }
  return value;
}

/** Constant-time secret comparison so a wrong guess leaks no timing signal. */
export function verifyOwnerSecret(secret: string): boolean {
  const expected = Buffer.from(requireEnv('OWNER_SECRET'));
  const given = Buffer.from(secret);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Whether the request carries a valid signed owner cookie. */
export async function isOwner(c: Context): Promise<boolean> {
  const value = await getSignedCookie(c, requireEnv('COOKIE_SECRET'), COOKIE);
  return value === '1';
}

export async function grantOwner(c: Context): Promise<void> {
  await setSignedCookie(c, COOKIE, '1', requireEnv('COOKIE_SECRET'), {
    httpOnly: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: MAX_AGE,
    // localhost dev is http; only mark Secure in production (https).
    secure: process.env.NODE_ENV === 'production',
  });
}

export function revokeOwner(c: Context): void {
  deleteCookie(c, COOKIE, { path: '/' });
}

/** Guards the /admin routes — 401s anyone without the owner cookie. */
export const requireOwner: MiddlewareHandler = async (c, next) => {
  if (!(await isOwner(c))) {
    throw errors.unauthorized('Owner access required');
  }
  await next();
};
