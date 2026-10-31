import { prisma } from '../db';
import { HttpError } from '../lib/http';
import { fetchMatch, type FaceitMatchDetails, type FaceitMatchStats } from './faceit';

export interface RegisteredPlayer {
  userId: string;
  teamId: string | null;
}

export interface MappedPlayerStat {
  faceitId: string;
  nickname: string;
  userId: string | null;
  teamId: string | null;
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  hsPercent: number;
  mvps: number;
  won: boolean;
}

export interface MappedMatch {
  faceitMatchId: string;
  bestOf: number;
  startedAt: Date | null;
  sides: { A: MappedSide; B: MappedSide };
  scoreA: number;
  scoreB: number;
  maps: { order: number; mapName: string; scoreA: number; scoreB: number; players: (MappedPlayerStat & { side: 'A' | 'B' })[] }[];
  unmatched: string[];
}

interface MappedSide {
  factionId: string;
  name: string;
  /** Команда ліги, до якої належить більшість гравців цієї сторони */
  teamId: string | null;
}

const num = (v: string | undefined) => Number(v ?? 0) || 0;

function majorityTeam(ids: (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const id of ids) if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
  let best: string | null = null;
  let bestCount = 0;
  for (const [id, c] of counts) {
    if (c > bestCount) {
      best = id;
      bestCount = c;
    }
  }
  return best;
}

/** Перетворює відповідь FACEIT Data API на наші сутності. faction1 → команда A, faction2 → команда B. */
export function mapFaceitMatch(
  details: FaceitMatchDetails,
  stats: FaceitMatchStats,
  registered: Map<string, RegisteredPlayer>
): MappedMatch {
  const f1 = details.teams.faction1;
  const f2 = details.teams.faction2;
  const sideOf = (factionId: string): 'A' | 'B' => (factionId === f1.faction_id ? 'A' : 'B');

  const teamFor = (roster: { player_id: string }[]) =>
    majorityTeam(roster.map((p) => registered.get(p.player_id)?.teamId ?? null));

  const sides = {
    A: { factionId: f1.faction_id, name: f1.name, teamId: teamFor(f1.roster) },
    B: { factionId: f2.faction_id, name: f2.name, teamId: teamFor(f2.roster) },
  };

  const unmatched = new Set<string>();
  const maps = stats.rounds.map((round, idx) => {
    const finalScore = (side: 'A' | 'B') =>
      num(round.teams.find((t) => sideOf(t.team_id) === side)?.team_stats['Final Score']);
    const players = round.teams.flatMap((t) =>
      t.players.map((p) => {
        const reg = registered.get(p.player_id);
        if (!reg) unmatched.add(p.nickname);
        const side = sideOf(t.team_id);
        return {
          side,
          faceitId: p.player_id,
          nickname: p.nickname,
          userId: reg?.userId ?? null,
          teamId: sides[side].teamId,
          kills: num(p.player_stats.Kills),
          deaths: num(p.player_stats.Deaths),
          assists: num(p.player_stats.Assists),
          adr: num(p.player_stats.ADR),
          hsPercent: num(p.player_stats['Headshots %']),
          mvps: num(p.player_stats.MVPs),
          won: p.player_stats.Result === '1',
        };
      })
    );
    return {
      order: Number(round.match_round) || idx + 1,
      mapName: round.round_stats.Map,
      scoreA: finalScore('A'),
      scoreB: finalScore('B'),
      players,
    };
  });

  return {
    faceitMatchId: details.match_id,
    bestOf: details.best_of ?? maps.length,
    startedAt: details.started_at ? new Date(details.started_at * 1000) : null,
    sides,
    scoreA: maps.filter((m) => m.scoreA > m.scoreB).length,
    scoreB: maps.filter((m) => m.scoreB > m.scoreA).length,
    maps,
    unmatched: [...unmatched],
  };
}

async function registeredLookup(faceitIds: string[]) {
  const users = await prisma.user.findMany({
    where: { faceitId: { in: faceitIds } },
    select: { id: true, faceitId: true, membership: { select: { teamId: true } } },
  });
  return new Map(users.map((u) => [u.faceitId, { userId: u.id, teamId: u.membership?.teamId ?? null }]));
}

export async function previewFaceitImport(matchId: string) {
  const { details, stats } = await fetchMatch(matchId);
  const ids = [...details.teams.faction1.roster, ...details.teams.faction2.roster].map((p) => p.player_id);
  const mapped = mapFaceitMatch(details, stats, await registeredLookup(ids));
  const existing = await prisma.match.findUnique({ where: { faceitMatchId: mapped.faceitMatchId }, select: { id: true } });
  return { mapped, existingMatchId: existing?.id ?? null, faceitStatus: details.status };
}

/**
 * Записує матч. Повторний імпорт того самого FACEIT ID перезаписує карти й статистику.
 * teamAId/teamBId — ручне зіставлення, якщо автоматичне не спрацювало.
 */
export async function confirmFaceitImport(
  matchId: string,
  opts: { stage: string; group?: string | null; teamAId?: string; teamBId?: string }
) {
  const { mapped } = await previewFaceitImport(matchId);
  const teamAId = opts.teamAId ?? mapped.sides.A.teamId;
  const teamBId = opts.teamBId ?? mapped.sides.B.teamId;
  if (!teamAId || !teamBId || teamAId === teamBId) {
    throw new HttpError(400, 'Не вдалося визначити обидві команди. Оберіть їх вручну.');
  }

  const data = {
    stage: opts.stage,
    group: opts.group ?? null,
    teamAId,
    teamBId,
    scoreA: mapped.scoreA,
    scoreB: mapped.scoreB,
    bestOf: mapped.bestOf,
    status: 'FINISHED',
    scheduledAt: mapped.startedAt,
    source: 'FACEIT',
  };

  return prisma.$transaction(async (tx) => {
    const match = await tx.match.upsert({
      where: { faceitMatchId: mapped.faceitMatchId },
      create: { ...data, faceitMatchId: mapped.faceitMatchId },
      update: data,
    });
    await tx.matchMap.deleteMany({ where: { matchId: match.id } });
    for (const m of mapped.maps) {
      const map = await tx.matchMap.create({
        data: { matchId: match.id, order: m.order, mapName: m.mapName, scoreA: m.scoreA, scoreB: m.scoreB },
      });
      // Гравці, яких немає на сайті, у статистику ліги не потрапляють
      const rows = m.players.filter((p) => p.userId);
      for (const p of rows) {
        await tx.playerMatchStat.create({
          data: {
            matchId: match.id,
            mapId: map.id,
            userId: p.userId!,
            teamId: p.side === 'A' ? teamAId : teamBId,
            kills: p.kills,
            deaths: p.deaths,
            assists: p.assists,
            adr: p.adr,
            hsPercent: p.hsPercent,
            mvps: p.mvps,
            won: p.won,
          },
        });
      }
    }
    return { match, unmatched: mapped.unmatched };
  });
}
