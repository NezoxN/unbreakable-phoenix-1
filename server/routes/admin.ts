import { Router } from 'express';
import path from 'node:path';
import { z } from 'zod';
import { prisma } from '../db';
import { config } from '../config';
import { handler, HttpError, parse } from '../lib/http';
import { sanitizeInput } from '../lib/sanitize';
import { MAX_MAIN, MAX_SUBS } from '../lib/constants';
import { publicPlayer, serializeTeam, teamInclude } from '../lib/serialize';
import { currentUser, requireAdmin } from '../middleware/auth';
import { ensureTeamSpace, syncMember, syncTeamMembers } from '../services/discord';
import { addMember, promoteSubIfNeeded } from '../services/teams';
import { confirmFaceitImport, previewFaceitImport } from '../services/matchImport';
import { extractMatchId } from '../services/faceit';
import { removeUpload } from './verification';

export const adminRouter = Router();
adminRouter.use(requireAdmin);

async function log(adminId: string, action: string, target?: string, details?: unknown) {
  await prisma.adminLog.create({
    data: { adminId, action, target, details: details === undefined ? undefined : JSON.stringify(details) },
  });
}

const decisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().transform(sanitizeInput).pipe(z.string().max(500)).optional(),
});

/* ------------------------------ Огляд ------------------------------ */

adminRouter.get(
  '/overview',
  handler(async (_req, res) => {
    const [users, verified, pendingCards, teamsByStatus, matches] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { verificationStatus: 'VERIFIED' } }),
      prisma.studentCard.count({ where: { status: 'PENDING' } }),
      prisma.team.groupBy({ by: ['status'], _count: true }),
      prisma.match.count(),
    ]);
    res.json({
      ok: true,
      users,
      verified,
      pendingCards,
      teams: Object.fromEntries(teamsByStatus.map((t) => [t.status, t._count])),
      matches,
    });
  })
);

/* ------------------------- Перевірка студентів ------------------------- */

adminRouter.get(
  '/verifications',
  handler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : 'PENDING';
    const cards = await prisma.studentCard.findMany({
      where: { status },
      include: { user: { include: { university: true } } },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });
    res.json({
      ok: true,
      cards: cards.map((c) => ({
        id: c.id,
        status: c.status,
        comment: c.comment,
        createdAt: c.createdAt,
        reviewedAt: c.reviewedAt,
        hasFile: Boolean(c.filePath),
        mimeType: c.mimeType,
        player: { ...publicPlayer(c.user), telegram: c.user.telegram },
      })),
    });
  })
);

adminRouter.get(
  '/verifications/:id/file',
  handler(async (req, res) => {
    const card = await prisma.studentCard.findUnique({ where: { id: req.params.id } });
    if (!card?.filePath) throw new HttpError(404, 'Файл не знайдено.');
    res.setHeader('Cache-Control', 'no-store');
    res.type(card.mimeType);
    res.sendFile(path.join(config.uploadsDir, path.basename(card.filePath)));
  })
);

adminRouter.post(
  '/verifications/:id',
  handler(async (req, res) => {
    const admin = currentUser(req);
    const { decision, comment } = parse(decisionSchema, req.body);
    const card = await prisma.studentCard.findUnique({ where: { id: req.params.id } });
    if (!card || card.status !== 'PENDING') throw new HttpError(404, 'Заявку не знайдено або вже розглянуто.');

    await prisma.$transaction([
      prisma.studentCard.update({
        where: { id: card.id },
        data: {
          status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          comment,
          reviewedBy: admin.id,
          reviewedAt: new Date(),
          filePath: null,
        },
      }),
      prisma.user.update({
        where: { id: card.userId },
        data:
          decision === 'APPROVE'
            ? { verificationStatus: 'VERIFIED', verifiedAt: new Date() }
            : { verificationStatus: 'REJECTED' },
      }),
    ]);
    // Персональні дані не зберігаємо довше, ніж потрібно для рішення
    removeUpload(card.filePath);
    await syncMember(card.userId);
    await log(admin.id, `verification.${decision.toLowerCase()}`, card.userId, { comment });
    res.json({ ok: true });
  })
);

/* ------------------------------ Користувачі ------------------------------ */

adminRouter.get(
  '/users',
  handler(async (req, res) => {
    const q = typeof req.query.q === 'string' ? sanitizeInput(req.query.q) : '';
    const users = await prisma.user.findMany({
      where: q
        ? { OR: [{ faceitNickname: { contains: q } }, { fullName: { contains: q } }, { studentEmail: { contains: q } }] }
        : {},
      include: { university: true, membership: { include: { team: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({
      ok: true,
      users: users.map((u) => ({
        ...publicPlayer(u),
        faceitId: u.faceitId,
        telegram: u.telegram,
        studentEmail: u.studentEmail,
        verificationStatus: u.verificationStatus,
        discordUsername: u.discordUsername,
        isAdmin: u.isAdmin,
        team: u.membership?.team ?? null,
        createdAt: u.createdAt,
      })),
    });
  })
);

adminRouter.patch(
  '/users/:id',
  handler(async (req, res) => {
    const admin = currentUser(req);
    const data = parse(
      z.object({
        isAdmin: z.boolean().optional(),
        verificationStatus: z.enum(['NONE', 'VERIFIED', 'REJECTED']).optional(),
      }),
      req.body
    );
    if (data.isAdmin === false && req.params.id === admin.id) {
      throw new HttpError(400, 'Не можна зняти права адміністратора з себе.');
    }
    await prisma.user.update({
      where: { id: req.params.id },
      data: { ...data, ...(data.verificationStatus === 'VERIFIED' ? { verifiedAt: new Date() } : {}) },
    });
    await syncMember(req.params.id);
    await log(admin.id, 'user.update', req.params.id, data);
    res.json({ ok: true });
  })
);

/* ------------------------------ Команди ------------------------------ */

adminRouter.get(
  '/teams',
  handler(async (req, res) => {
    const status = typeof req.query.status === 'string' && req.query.status !== 'ALL' ? req.query.status : undefined;
    const teams = await prisma.team.findMany({
      where: status ? { status } : {},
      include: teamInclude,
      orderBy: { updatedAt: 'desc' },
    });
    // Адмін бачить telegram усіх гравців — передаємо id капітана як «глядача»
    res.json({ ok: true, teams: teams.map((t) => serializeTeam(t, t.captainId)) });
  })
);

adminRouter.post(
  '/teams/:id/decision',
  handler(async (req, res) => {
    const admin = currentUser(req);
    const { decision, comment } = parse(decisionSchema, req.body);
    const team = await prisma.team.update({
      where: { id: req.params.id },
      data: { status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED' },
    });
    if (decision === 'APPROVE') await ensureTeamSpace(team.id);
    await syncTeamMembers(team.id);
    await log(admin.id, `team.${decision.toLowerCase()}`, team.id, { comment });
    res.json({ ok: true });
  })
);

adminRouter.patch(
  '/teams/:id',
  handler(async (req, res) => {
    const admin = currentUser(req);
    const data = parse(
      z.object({
        group: z.string().regex(/^[A-Z]$/).nullable().optional(),
        status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
      }),
      req.body
    );
    await prisma.team.update({ where: { id: req.params.id }, data });
    if (data.status === 'APPROVED') await ensureTeamSpace(req.params.id);
    await log(admin.id, 'team.update', req.params.id, data);
    res.json({ ok: true });
  })
);

/** Адмін може змінювати склад навіть після фіксації */
adminRouter.post(
  '/teams/:id/members',
  handler(async (req, res) => {
    const admin = currentUser(req);
    const { userId } = parse(z.object({ userId: z.string() }), req.body);
    const team = await prisma.team.findUniqueOrThrow({ where: { id: req.params.id } });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    await prisma.$transaction((tx) => addMember(tx, team, user));
    await syncMember(userId);
    await log(admin.id, 'team.member.add', team.id, { userId });
    res.json({ ok: true });
  })
);

adminRouter.delete(
  '/teams/:id/members/:userId',
  handler(async (req, res) => {
    const admin = currentUser(req);
    const team = await prisma.team.findUniqueOrThrow({ where: { id: req.params.id } });
    if (team.captainId === req.params.userId) {
      throw new HttpError(409, 'Спочатку призначте іншого капітана.');
    }
    await prisma.$transaction(async (tx) => {
      await tx.teamMember.deleteMany({ where: { teamId: team.id, userId: req.params.userId } });
      await promoteSubIfNeeded(tx, team.id);
    });
    await syncMember(req.params.userId);
    await log(admin.id, 'team.member.remove', team.id, { userId: req.params.userId });
    res.json({ ok: true });
  })
);

adminRouter.post(
  '/teams/:id/captain',
  handler(async (req, res) => {
    const admin = currentUser(req);
    const { userId } = parse(z.object({ userId: z.string() }), req.body);
    const team = await prisma.team.findUniqueOrThrow({ where: { id: req.params.id } });
    const member = await prisma.teamMember.findUnique({ where: { userId } });
    if (!member || member.teamId !== team.id) throw new HttpError(404, 'Гравець не в цій команді.');
    await prisma.team.update({ where: { id: team.id }, data: { captainId: userId } });
    await syncMember(team.captainId);
    await syncMember(userId);
    await log(admin.id, 'team.captain', team.id, { from: team.captainId, to: userId });
    res.json({ ok: true });
  })
);

/** Переміщення між основою та запасом з урахуванням лімітів складу */
adminRouter.patch(
  '/teams/:id/members/:userId',
  handler(async (req, res) => {
    const admin = currentUser(req);
    const { slot } = parse(z.object({ slot: z.enum(['MAIN', 'SUB']) }), req.body);
    const member = await prisma.teamMember.findUnique({ where: { userId: req.params.userId } });
    if (!member || member.teamId !== req.params.id) throw new HttpError(404, 'Гравець не в цій команді.');
    if (member.slot !== slot) {
      const taken = await prisma.teamMember.count({ where: { teamId: member.teamId, slot } });
      const limit = slot === 'MAIN' ? MAX_MAIN : MAX_SUBS;
      if (taken >= limit) {
        throw new HttpError(409, slot === 'MAIN' ? `В основі вже ${MAX_MAIN} гравців.` : `Запасних уже ${MAX_SUBS}.`);
      }
      await prisma.teamMember.update({ where: { id: member.id }, data: { slot } });
    }
    await log(admin.id, 'team.member.slot', member.teamId, { userId: member.userId, slot });
    res.json({ ok: true });
  })
);

/* ------------------------------ Матчі ------------------------------ */

const matchSchema = z.object({
  stage: z.string().transform(sanitizeInput).pipe(z.string().min(1).max(32)),
  group: z.string().regex(/^[A-Z]$/).nullable().optional(),
  teamAId: z.string(),
  teamBId: z.string(),
  bestOf: z.union([z.literal(1), z.literal(3), z.literal(5)]).default(1),
  scheduledAt: z.coerce.date().nullable().optional(),
  status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED']).default('SCHEDULED'),
});

adminRouter.post(
  '/matches',
  handler(async (req, res) => {
    const admin = currentUser(req);
    const data = parse(matchSchema, req.body);
    if (data.teamAId === data.teamBId) throw new HttpError(400, 'Команда не може грати сама з собою.');
    const match = await prisma.match.create({ data });
    await log(admin.id, 'match.create', match.id);
    res.status(201).json({ ok: true, match });
  })
);

adminRouter.patch(
  '/matches/:id',
  handler(async (req, res) => {
    const admin = currentUser(req);
    const data = parse(matchSchema.partial(), req.body);
    const match = await prisma.match.update({ where: { id: req.params.id }, data });
    await log(admin.id, 'match.update', match.id, data);
    res.json({ ok: true, match });
  })
);

adminRouter.delete(
  '/matches/:id',
  handler(async (req, res) => {
    const admin = currentUser(req);
    await prisma.match.delete({ where: { id: req.params.id } });
    await log(admin.id, 'match.delete', req.params.id);
    res.json({ ok: true });
  })
);

const playerStatSchema = z.object({
  userId: z.string(),
  kills: z.number().int().min(0).max(200),
  deaths: z.number().int().min(0).max(200),
  assists: z.number().int().min(0).max(200),
  adr: z.number().min(0).max(500),
  hsPercent: z.number().min(0).max(100),
  mvps: z.number().int().min(0).max(60).default(0),
});

const resultSchema = z.object({
  maps: z
    .array(
      z.object({
        mapName: z.string().regex(/^[a-z0-9_]{2,32}$/),
        scoreA: z.number().int().min(0).max(99),
        scoreB: z.number().int().min(0).max(99),
        players: z.array(playerStatSchema).max(14).default([]),
      })
    )
    .min(1)
    .max(5),
});

/** Ручне введення результату: рахунок по картах + статистика гравців */
adminRouter.put(
  '/matches/:id/result',
  handler(async (req, res) => {
    const admin = currentUser(req);
    const { maps } = parse(resultSchema, req.body);
    const match = await prisma.match.findUnique({ where: { id: req.params.id } });
    if (!match) throw new HttpError(404, 'Матч не знайдено.');

    const members = await prisma.teamMember.findMany({
      where: { teamId: { in: [match.teamAId, match.teamBId] } },
      select: { userId: true, teamId: true },
    });
    const teamOf = new Map(members.map((m) => [m.userId, m.teamId]));

    await prisma.$transaction(async (tx) => {
      await tx.matchMap.deleteMany({ where: { matchId: match.id } });
      for (const [idx, m] of maps.entries()) {
        const map = await tx.matchMap.create({
          data: { matchId: match.id, order: idx + 1, mapName: m.mapName, scoreA: m.scoreA, scoreB: m.scoreB },
        });
        for (const p of m.players) {
          const teamId = teamOf.get(p.userId);
          if (!teamId) throw new HttpError(400, 'Гравець зі статистики не належить жодній з команд матчу.');
          const won = teamId === match.teamAId ? m.scoreA > m.scoreB : m.scoreB > m.scoreA;
          await tx.playerMatchStat.create({ data: { ...p, matchId: match.id, mapId: map.id, teamId, won } });
        }
      }
      await tx.match.update({
        where: { id: match.id },
        data: {
          status: 'FINISHED',
          scoreA: maps.filter((m) => m.scoreA > m.scoreB).length,
          scoreB: maps.filter((m) => m.scoreB > m.scoreA).length,
        },
      });
    });
    await log(admin.id, 'match.result', match.id);
    res.json({ ok: true });
  })
);

const importSchema = z.object({ faceitMatch: z.string().min(8).max(200) });

adminRouter.post(
  '/matches/import/preview',
  handler(async (req, res) => {
    const { faceitMatch } = parse(importSchema, req.body);
    res.json({ ok: true, ...(await previewFaceitImport(extractMatchId(faceitMatch))) });
  })
);

adminRouter.post(
  '/matches/import/confirm',
  handler(async (req, res) => {
    const admin = currentUser(req);
    const body = parse(
      importSchema.extend({
        stage: z.string().transform(sanitizeInput).pipe(z.string().min(1).max(32)),
        group: z.string().regex(/^[A-Z]$/).nullable().optional(),
        teamAId: z.string().optional(),
        teamBId: z.string().optional(),
      }),
      req.body
    );
    const { faceitMatch, ...opts } = body;
    const result = await confirmFaceitImport(extractMatchId(faceitMatch), opts);
    await log(admin.id, 'match.import', result.match.id, { faceitMatchId: result.match.faceitMatchId });
    res.json({ ok: true, matchId: result.match.id, unmatched: result.unmatched });
  })
);

adminRouter.get(
  '/logs',
  handler(async (_req, res) => {
    const logs = await prisma.adminLog.findMany({
      include: { admin: { select: { faceitNickname: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json({ ok: true, logs });
  })
);
