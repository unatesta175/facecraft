import { env } from '../config/env';

export function getAuthCookieOptions() {
  const secure =
    process.env.COOKIE_SECURE === 'true' ||
    (process.env.COOKIE_SECURE !== 'false' && env.APP_URL.startsWith('https://'));

  return {
    httpOnly: true,
    secure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax' as const,
  };
}
