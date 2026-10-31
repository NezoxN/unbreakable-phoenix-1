import type { NextFunction, Request, Response } from 'express';
import type { User } from '@prisma/client';
import { prisma } from '../db';
import { config } from '../config';
import { SESSION_COOKIE, sha256 } from '../lib/session';
import { HttpError } from '../lib/http';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

/** Підставляє req.user, якщо cookie сесії валідна. Нічого не блокує. */
export async function loadUser(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    if (typeof token === 'string' && token) {
      const session = await prisma.session.findUnique({
        where: { id: sha256(token) },
        include: { user: true },
      });
      if (session && session.expiresAt > new Date()) {
        req.user = session.user;
      }
    }
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    next(new HttpError(401, 'Потрібно увійти через FACEIT.'));
    return;
  }
  next();
}

export function requireVerified(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    next(new HttpError(401, 'Потрібно увійти через FACEIT.'));
    return;
  }
  if (req.user.verificationStatus !== 'VERIFIED') {
    next(new HttpError(403, 'Спочатку підтвердіть статус студента.'));
    return;
  }
  next();
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) {
    next(new HttpError(403, 'Доступ лише для адміністраторів ліги.'));
    return;
  }
  next();
}

/** Простий захист від CSRF: змінюючі запити приймаються тільки з нашого origin */
export function checkOrigin(req: Request, _res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }
  const origin = req.get('origin');
  const allowed = new URL(config.APP_URL).origin;
  const self = `${req.protocol}://${req.get('host')}`;
  if (origin && origin !== allowed && origin !== self) {
    next(new HttpError(403, 'Запит з недозволеного джерела.'));
    return;
  }
  next();
}

/** Користувач, гарантований після requireAuth */
export const currentUser = (req: Request): User => {
  if (!req.user) throw new HttpError(401, 'Потрібно увійти через FACEIT.');
  return req.user;
};
