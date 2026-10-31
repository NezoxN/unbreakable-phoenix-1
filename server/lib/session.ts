import crypto from 'node:crypto';
import type { Response } from 'express';
import { prisma } from '../db';
import { config } from '../config';

export const SESSION_COOKIE = 'sid';

export const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

export const cookieOptions = (maxAgeMs: number) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: config.isProd,
  path: '/',
  maxAge: maxAgeMs,
});

export async function createSession(res: Response, userId: string) {
  const token = crypto.randomBytes(32).toString('base64url');
  const ttl = config.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;
  await prisma.session.create({
    data: { id: sha256(token), userId, expiresAt: new Date(Date.now() + ttl) },
  });
  res.cookie(SESSION_COOKIE, token, cookieOptions(ttl));
}

export async function destroySession(res: Response, token: string | undefined) {
  if (token) {
    await prisma.session.deleteMany({ where: { id: sha256(token) } });
  }
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}
