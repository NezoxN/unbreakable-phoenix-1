import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { handler, HttpError, parse } from '../lib/http';
import { sanitizeInput } from '../lib/sanitize';
import { CS2_ROLES, MAX_MAIN, MAX_SUBS } from '../lib/constants';
import { isProfileComplete, publicPlayer, publicUniversity } from '../lib/serialize';
import { currentUser, requireAuth, requireVerified } from '../middleware/auth';

export const marketRouter = Router();

const filterSchema = z.object({
  role: z.enum(CS2_ROLES).optional(),
  university: z.string().max(16).optional(),
  minLevel: z.coerce.number().int().min(1).max(10).optional(),
  q: z.string().max(64).optional(),
});

const splitRoles = (roles: string) => roles.split(',').filter(Boolean);

marketRouter.get(
  '/players',
  handler(async (req, res) => {
    const f = parse(filterSchema, req.query);
    const q = f.q ? sanitizeInput(f.q) : '';
    const where: Prisma.LftPostWhereInput = {
      authorType: 'PLAYER',
      active: true,
      ...(f.role ? { roles: { contains: f.role } } : {}),
      user: {
        verificationStatus: 'VERIFIED',
        membership: null,
        ...(f.university ? { universityId: f.university } : {}),
        ...(f.minLevel ? { faceitLevel: { gte: f.minLevel } } : {}),
        ...(q ? { OR: [{ faceitNickname: { contains: q } }, { fullName: { contains: q } }] } : {}),
      },
    };
    const posts = await prisma.lftPost.findMany({
      where,
      include: { user: { include: { university: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    res.json({
      ok: true,
      players: posts.map((p) => ({
        postId: p.id,
        roles: splitRoles(p.roles),
        description: p.description,
        updatedAt: p.updatedAt,
        player: publicPlayer(p.user!),
      })),
    });
  })
);

marketRouter.get(
  '/teams',
  handler(async (req, res) => {
    const f = parse(filterSchema, req.query);
    const posts = await prisma.lftPost.findMany({
      where: {
        authorType: 'TEAM',
        active: true,
        ...(f.role ? { roles: { contains: f.role } } : {}),
        team: {
          status: { in: ['DRAFT', 'REJECTED'] }, // поданий/схвалений склад зафіксовано
          ...(f.university ? { universityId: f.university } : {}),
          ...(f.q ? { name: { contains: sanitizeInput(f.q) } } : {}),
        },
      },
      include: { team: { include: { university: true, _count: { select: { members: true } } } } },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    res.json({
      ok: true,
      teams: posts.map((p) => ({
        postId: p.id,
        roles: splitRoles(p.roles),
        description: p.description,
        minLevel: p.minLevel,
        updatedAt: p.updatedAt,
        team: {
          id: p.team!.id,
          name: p.team!.name,
          tag: p.team!.tag,
          university: publicUniversity(p.team!.university),
          membersCount: p.team!._count.members,
          freeSlots: MAX_MAIN + MAX_SUBS - p.team!._count.members,
        },
      })),
    });
  })
);

/* ------------------------- Власні оголошення ------------------------- */

const postSchema = z.object({
  roles: z.array(z.enum(CS2_ROLES)).min(1, 'Оберіть хоча б одну роль.').max(5),
  description: z
    .string()
    .transform(sanitizeInput)
    .pipe(z.string().max(500, 'Опис — до 500 символів.'))
    .default(''),
  minLevel: z.number().int().min(1).max(10).nullable().optional(),
});

marketRouter.get(
  '/my',
  requireAuth,
  handler(async (req, res) => {
    const user = currentUser(req);
    const team = await prisma.team.findFirst({ where: { captainId: user.id } });
    const [playerPost, teamPost] = await Promise.all([
      prisma.lftPost.findUnique({ where: { authorType_userId: { authorType: 'PLAYER', userId: user.id } } }),
      team ? prisma.lftPost.findUnique({ where: { authorType_teamId: { authorType: 'TEAM', teamId: team.id } } }) : null,
    ]);
    const format = (p: typeof playerPost) => (p ? { ...p, roles: splitRoles(p.roles) } : null);
    res.json({ ok: true, playerPost: format(playerPost), teamPost: format(teamPost) });
  })
);

marketRouter.put(
  '/posts/player',
  requireVerified,
  handler(async (req, res) => {
    const user = currentUser(req);
    if (!isProfileComplete(user)) throw new HttpError(400, 'Спочатку заповніть профіль гравця.');
    if (await prisma.teamMember.findUnique({ where: { userId: user.id } })) {
      throw new HttpError(409, 'Ви вже у складі команди — анкета вільного агента недоступна.');
    }
    const data = parse(postSchema, req.body);
    const post = await prisma.lftPost.upsert({
      where: { authorType_userId: { authorType: 'PLAYER', userId: user.id } },
      create: { authorType: 'PLAYER', userId: user.id, roles: data.roles.join(','), description: data.description },
      update: { roles: data.roles.join(','), description: data.description, active: true },
    });
    res.json({ ok: true, post: { ...post, roles: data.roles } });
  })
);

marketRouter.put(
  '/posts/team',
  requireVerified,
  handler(async (req, res) => {
    const user = currentUser(req);
    const team = await prisma.team.findFirst({ where: { captainId: user.id } });
    if (!team) throw new HttpError(403, 'Оголошення команди може створити лише капітан.');
    if (team.status === 'PENDING' || team.status === 'APPROVED') {
      throw new HttpError(409, 'Склад зафіксовано після подачі заявки.');
    }
    const data = parse(postSchema, req.body);
    const fields = { roles: data.roles.join(','), description: data.description, minLevel: data.minLevel ?? null };
    const post = await prisma.lftPost.upsert({
      where: { authorType_teamId: { authorType: 'TEAM', teamId: team.id } },
      create: { authorType: 'TEAM', teamId: team.id, ...fields },
      update: { ...fields, active: true },
    });
    res.json({ ok: true, post: { ...post, roles: data.roles } });
  })
);

marketRouter.delete(
  '/posts/:type',
  requireAuth,
  handler(async (req, res) => {
    const user = currentUser(req);
    if (req.params.type === 'player') {
      await prisma.lftPost.updateMany({ where: { authorType: 'PLAYER', userId: user.id }, data: { active: false } });
    } else if (req.params.type === 'team') {
      const team = await prisma.team.findFirst({ where: { captainId: user.id } });
      if (team) await prisma.lftPost.updateMany({ where: { authorType: 'TEAM', teamId: team.id }, data: { active: false } });
    } else {
      throw new HttpError(404, 'Not found');
    }
    res.json({ ok: true });
  })
);
