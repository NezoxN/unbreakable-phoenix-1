import { Router } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../db';
import { config } from '../config';
import { handler, HttpError } from '../lib/http';
import { cookieOptions } from '../lib/session';
import { currentUser, requireAuth } from '../middleware/auth';
import { addToGuild, buildDiscordAuthorizeUrl, exchangeDiscordCode, removeAllRoles, syncMember } from '../services/discord';
import { loadMe } from './me';

export const discordRouter = Router();
discordRouter.use(requireAuth);

const STATE_COOKIE = 'discord_oauth';
const back = (status: string) => `${config.APP_URL}/#cabinet?discord=${status}`;

discordRouter.get('/link', (_req, res) => {
  if (!config.discordOAuthEnabled) throw new HttpError(503, 'Інтеграцію з Discord ще не налаштовано.');
  const state = crypto.randomBytes(16).toString('base64url');
  res.cookie(STATE_COOKIE, state, cookieOptions(10 * 60 * 1000));
  res.redirect(buildDiscordAuthorizeUrl(state));
});

discordRouter.get(
  '/callback',
  handler(async (req, res) => {
    const user = currentUser(req);
    const saved = req.cookies?.[STATE_COOKIE];
    res.clearCookie(STATE_COOKIE, { path: '/' });
    const { code, state } = req.query;
    if (typeof code !== 'string' || !saved || state !== saved) {
      res.redirect(back('error'));
      return;
    }

    const discord = await exchangeDiscordCode(code);
    const owner = await prisma.user.findUnique({ where: { discordId: discord.id } });
    if (owner && owner.id !== user.id) {
      res.redirect(back('taken'));
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { discordId: discord.id, discordUsername: discord.username },
    });
    try {
      await addToGuild(discord.id, discord.accessToken);
    } catch (err) {
      console.error('[Discord] add to guild failed', err);
    }
    await syncMember(user.id);
    res.redirect(back('linked'));
  })
);

discordRouter.delete(
  '/link',
  handler(async (req, res) => {
    const user = currentUser(req);
    if (user.discordId) await removeAllRoles(user.discordId);
    await prisma.user.update({ where: { id: user.id }, data: { discordId: null, discordUsername: null } });
    res.json({ ok: true, message: 'Discord відв’язано.', ...(await loadMe(user.id)) });
  })
);
