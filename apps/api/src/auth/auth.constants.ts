import type { CookieOptions } from 'express';

export const SESSION_COOKIE_NAME = 'feedbackhub_sid';

export const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
export const PASSWORD_RESET_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export const ARGON2_OPTIONS = {
  type: 2 as const, // argon2id
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
  raw: false as const,
};

export function getSessionCookieOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
    maxAge: SESSION_EXPIRY_MS,
  };
}

export function getClearCookieOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/',
    maxAge: 0,
  };
}
