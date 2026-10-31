import { Router } from 'express';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../db';
import { config } from '../config';
import { handler, HttpError, parse } from '../lib/http';
import { createSession, destroySession, SESSION_COOKIE, cookieOptions } from '../lib/session';
import { isProfileComplete } from '../lib/serialize';
import { buildAuthorizeUrl, createPkce, exchangeCode, fetchPlayerSnapshot } from '../services/faceit';

export const authRouter = Router();

const OAUTH_COOKIE = 'faceit_oauth';

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

authRouter.get('/providers', (_req, res) => {
  res.json({
    ok: true,
    faceit: config.faceitEnabled,
    devLogin: config.devLogin,
    discord: config.discordOAuthEnabled,
  });
});

authRouter.get('/faceit/login', authLimiter, (_req, res) => {
  if (!config.faceitEnabled) {
    throw new HttpError(503, 'Вхід через FACEIT ще не налаштовано організаторами.');
  }
  const state = crypto.randomBytes(16).toString('base64url');
  const { verifier, challenge } = createPkce();
  res.cookie(OAUTH_COOKIE, `${state}.${verifier}`, cookieOptions(10 * 60 * 1000));
  res.redirect(buildAuthorizeUrl(state, challenge));
});

/** Створює або оновлює користувача за FACEIT ID і підтягує рівень/ELO */
async function upsertFaceitUser(faceitId: string, nickname: string, avatar?: string) {
  const snapshot = await fetchPlayerSnapshot(faceitId).catch((err) => {
    console.error('[FACEIT] snapshot failed', err);
    return null;
  });
  const faceitData = snapshot
    ? {
        faceitNickname: snapshot.nickname,
        avatar: snapshot.avatar ?? avatar,
        faceitLevel: snapshot.level,
        faceitElo: snapshot.elo,
        faceitKd: snapshot.kd,
        faceitWinrate: snapshot.winrate,
        faceitHsPercent: snapshot.hsPercent,
        faceitMatches: snapshot.matches,
        faceitSyncedAt: new Date(),
      }
    : { faceitNickname: nickname, avatar };
  const makeAdmin = config.ADMIN_FACEIT_IDS.includes(faceitId) || config.ADMIN_FACEIT_IDS.includes(nickname);

  return prisma.user.upsert({
    where: { faceitId },
    create: { faceitId, ...faceitData, isAdmin: makeAdmin },
    update: { ...faceitData, ...(makeAdmin ? { isAdmin: true } : {}) },
  });
}

authRouter.get(
  '/faceit/callback',
  authLimiter,
  handler(async (req, res) => {
    const { code, state } = req.query;
    const [savedState, verifier] = String(req.cookies?.[OAUTH_COOKIE] ?? '').split('.');
    res.clearCookie(OAUTH_COOKIE, { path: '/' });

    if (typeof code !== 'string' || !savedState || state !== savedState || !verifier) {
      res.redirect(`${config.APP_URL}/#register?error=oauth`);
      return;
    }

    const identity = await exchangeCode(code, verifier);
    const user = await upsertFaceitUser(identity.guid, identity.nickname, identity.picture);
    await createSession(res, user.id);
    res.redirect(`${config.APP_URL}/${isProfileComplete(user) ? '#cabinet' : '#register'}`);
  })
);

/** Тільки для локальної розробки (DEV_LOGIN=true, не production) */
authRouter.post(
  '/dev-login',
  handler(async (req, res) => {
    if (!config.devLogin) throw new HttpError(404, 'Not found');
    const body = parse(
      z.object({ nickname: z.string().regex(/^[a-zA-Z0-9_-]{3,24}$/), admin: z.boolean().optional() }),
      req.body
    );
    const user = await prisma.user.upsert({
      where: { faceitId: `dev-${body.nickname}` },
      create: {
        faceitId: `dev-${body.nickname}`,
        faceitNickname: body.nickname,
        faceitLevel: 1 + Math.floor(Math.random() * 10),
        faceitElo: 800 + Math.floor(Math.random() * 1800),
        isAdmin: Boolean(body.admin),
      },
      update: body.admin ? { isAdmin: true } : {},
    });
    await createSession(res, user.id);
    res.json({ ok: true, profileComplete: isProfileComplete(user) });
  })
);

authRouter.post(
  '/logout',
  handler(async (req, res) => {
    await destroySession(res, req.cookies?.[SESSION_COOKIE]);
    res.json({ ok: true });
  })
);

export { upsertFaceitUser };
