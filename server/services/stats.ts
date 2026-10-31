/** Чисті функції агрегування — без БД, щоб їх легко тестувати */

export interface StatRow {
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  hsPercent: number;
  mvps: number;
  won: boolean;
}

export interface AggregatedStats {
  maps: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  adr: number;
  hsPercent: number;
  mvps: number;
  winrate: number;
  rating: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * PHX Rating — спрощений аналог HLTV 1.0: внесок K/D та ADR відносно «середнього» гравця
 * (K/D = 1.0, ADR = 75). Середній гравець ≈ 1.00.
 */
export function rating(kd: number, adr: number) {
  return round2(0.5 * kd + 0.5 * (adr / 75));
}

export function aggregate(rows: StatRow[]): AggregatedStats {
  const maps = rows.length;
  const sum = rows.reduce(
    (acc, r) => ({
      kills: acc.kills + r.kills,
      deaths: acc.deaths + r.deaths,
      assists: acc.assists + r.assists,
      adr: acc.adr + r.adr,
      hs: acc.hs + r.hsPercent,
      mvps: acc.mvps + r.mvps,
      wins: acc.wins + (r.won ? 1 : 0),
    }),
    { kills: 0, deaths: 0, assists: 0, adr: 0, hs: 0, mvps: 0, wins: 0 }
  );
  const kd = sum.deaths === 0 ? sum.kills : sum.kills / sum.deaths;
  const adr = maps ? sum.adr / maps : 0;
  return {
    maps,
    wins: sum.wins,
    kills: sum.kills,
    deaths: sum.deaths,
    assists: sum.assists,
    kd: round2(kd),
    adr: round2(adr),
    hsPercent: maps ? Math.round(sum.hs / maps) : 0,
    mvps: sum.mvps,
    winrate: maps ? Math.round((sum.wins / maps) * 100) : 0,
    rating: maps ? rating(kd, adr) : 0,
  };
}

export interface MapPoolEntry {
  mapName: string;
  maps: number;
  winrate: number;
  rating: number;
}

/** Найчастіші карти гравця з винрейтом і рейтингом на кожній */
export function mapPool(rows: (StatRow & { mapName: string })[], limit = 5): MapPoolEntry[] {
  const byMap = new Map<string, StatRow[]>();
  for (const r of rows) byMap.set(r.mapName, [...(byMap.get(r.mapName) ?? []), r]);
  return [...byMap.entries()]
    .map(([mapName, list]) => {
      const s = aggregate(list);
      return { mapName, maps: s.maps, winrate: s.winrate, rating: s.rating };
    })
    .sort((a, b) => b.maps - a.maps || b.rating - a.rating)
    .slice(0, limit);
}

export type LeaderboardSort = 'rating' | 'kd' | 'adr' | 'hs' | 'kills';

export function sortLeaderboard<T extends { stats: AggregatedStats }>(list: T[], sort: LeaderboardSort): T[] {
  const key: Record<LeaderboardSort, (s: AggregatedStats) => number> = {
    rating: (s) => s.rating,
    kd: (s) => s.kd,
    adr: (s) => s.adr,
    hs: (s) => s.hsPercent,
    kills: (s) => s.kills,
  };
  return [...list].sort((a, b) => key[sort](b.stats) - key[sort](a.stats));
}

export interface StandingMatch {
  teamAId: string;
  teamBId: string;
  scoreA: number;
  scoreB: number;
}

export interface StandingRow {
  teamId: string;
  played: number;
  wins: number;
  losses: number;
  mapDiff: number;
  points: number;
}

/** Таблиця групи: 3 очки за перемогу, далі різниця карт */
export function computeStandings(teamIds: string[], matches: StandingMatch[]): StandingRow[] {
  const rows = new Map<string, StandingRow>(
    teamIds.map((id) => [id, { teamId: id, played: 0, wins: 0, losses: 0, mapDiff: 0, points: 0 }])
  );
  for (const m of matches) {
    const a = rows.get(m.teamAId);
    const b = rows.get(m.teamBId);
    if (!a || !b || m.scoreA === m.scoreB) continue;
    a.played++;
    b.played++;
    a.mapDiff += m.scoreA - m.scoreB;
    b.mapDiff += m.scoreB - m.scoreA;
    const [winner, loser] = m.scoreA > m.scoreB ? [a, b] : [b, a];
    winner.wins++;
    winner.points += 3;
    loser.losses++;
  }
  return [...rows.values()].sort((x, y) => y.points - x.points || y.mapDiff - x.mapDiff);
}
