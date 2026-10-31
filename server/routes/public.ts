import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { handler, HttpError, parse } from '../lib/http';
import { publicPlayer } from '../lib/serialize';
import { parseDomains } from '../lib/emailDomain';
import { aggregate, computeStandings, mapPool, sortLeaderboard, type StatRow } from '../services/stats';

/** Публічні дані: ЗВО, матчі, топ гравців, профілі, турнірна таблиця */
export const publicRouter = Router();

const teamBrief = { select: { id: true, name: true, tag: true, universityId: true } } as const;

publicRouter.get(
  '/universities',
  handler(async (_req, res) => {
    const list = await prisma.university.findMany({ orderBy: { id: 'asc' } });
    res.json({
      ok: true,
      universities: list.map((u) => ({ id: u.id, name: u.name, city: u.city, emailDomains: parseDomains(u.emailDomains) })),
    });
  })
);

publicRouter.get(
  '/matches',
  handler(async (req, res) => {
    const f = parse(
      z.object({
        status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED']).optional(),
        stage: z.string().max(32).optional(),
        team: z.string().max(40).optional(),
        limit: z.coerce.number().int().min(1).max(200).default(50),
      }),
      req.query
    );
    const matches = await prisma.match.findMany({
      where: {
        ...(f.status ? { status: f.status } : {}),
        ...(f.stage ? { stage: f.stage } : {}),
        ...(f.team ? { OR: [{ teamAId: f.team }, { teamBId: f.team }] } : {}),
      },
      include: { teamA: teamBrief, teamB: teamBrief, maps: { orderBy: { order: 'asc' } } },
      orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
      take: f.limit,
    });
    res.json({ ok: true, matches });
  })
);

publicRouter.get(
  '/matches/:id',
  handler(async (req, res) => {
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
      include: {
        teamA: teamBrief,
        teamB: teamBrief,
        maps: {
          orderBy: { order: 'asc' },
          include: { stats: { include: { user: { select: { id: true, faceitNickname: true, avatar: true } } } } },
        },
      },
    });
    if (!match) throw new HttpError(404, 'Матч не знайдено.');
    res.json({ ok: true, match });
  })
);

publicRouter.get(
  '/stats/leaderboard',
  handler(async (req, res) => {
    const f = parse(
      z.object({
        sort: z.enum(['rating', 'kd', 'adr', 'hs', 'kills']).default('rating'),
        minMaps: z.coerce.number().int().min(0).max(50).default(1),
        limit: z.coerce.number().int().min(1).max(200).default(50),
      }),
      req.query
    );
    const rows = await prisma.playerMatchStat.findMany();
    const byUser = new Map<string, StatRow[]>();
    for (const r of rows) {
      const list = byUser.get(r.userId) ?? [];
      list.push(r);
      byUser.set(r.userId, list);
    }
    const users = await prisma.user.findMany({
      where: { id: { in: [...byUser.keys()] } },
      include: { university: true, membership: { include: { team: { select: { id: true, name: true, tag: true } } } } },
    });
    const entries = users
      .map((u) => ({ player: publicPlayer(u), team: u.membership?.team ?? null, stats: aggregate(byUser.get(u.id)!) }))
      .filter((e) => e.stats.maps >= f.minMaps);
    res.json({ ok: true, leaderboard: sortLeaderboard(entries, f.sort).slice(0, f.limit) });
  })
);

publicRouter.get(
  '/players/:id',
  handler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { university: true, membership: { include: { team: { select: { id: true, name: true, tag: true, status: true } } } } },
    });
    if (!user) throw new HttpError(404, 'Гравця не знайдено.');
    const rows = await prisma.playerMatchStat.findMany({
      where: { userId: user.id },
      include: { map: true, match: { include: { teamA: teamBrief, teamB: teamBrief } } },
      orderBy: { match: { scheduledAt: 'desc' } },
    });

    // Останні матчі: статистика гравця, згрупована по матчу
    const byMatch = new Map<string, typeof rows>();
    for (const r of rows) byMatch.set(r.matchId, [...(byMatch.get(r.matchId) ?? []), r]);
    const recentMatches = [...byMatch.values()].slice(0, 20).map((list) => {
      const m = list[0].match;
      return {
        id: m.id,
        stage: m.stage,
        scheduledAt: m.scheduledAt,
        teamA: m.teamA,
        teamB: m.teamB,
        scoreA: m.scoreA,
        scoreB: m.scoreB,
        maps: list.map((r) => r.map.mapName),
        stats: aggregate(list),
      };
    });

    res.json({
      ok: true,
      player: publicPlayer(user),
      team: user.membership?.team ?? null,
      stats: aggregate(rows),
      recentMatches,
      mapPool: mapPool(rows.map((r) => ({ ...r, mapName: r.map.mapName }))),
    });
  })
);

publicRouter.get(
  '/standings',
  handler(async (_req, res) => {
    const teams = await prisma.team.findMany({
      where: { status: 'APPROVED', group: { not: null } },
      select: { id: true, name: true, tag: true, group: true, universityId: true },
    });
    const matches = await prisma.match.findMany({
      where: { status: 'FINISHED', group: { not: null } },
      select: { teamAId: true, teamBId: true, scoreA: true, scoreB: true, group: true },
    });
    const groups = [...new Set(teams.map((t) => t.group!))].sort();
    res.json({
      ok: true,
      groups: groups.map((g) => {
        const groupTeams = teams.filter((t) => t.group === g);
        const rows = computeStandings(
          groupTeams.map((t) => t.id),
          matches.filter((m) => m.group === g)
        );
        return { group: g, rows: rows.map((r) => ({ ...r, team: groupTeams.find((t) => t.id === r.teamId)! })) };
      }),
    });
  })
);
