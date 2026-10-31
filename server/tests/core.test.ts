import { describe, expect, it } from 'vitest';
import { emailMatchesDomains, parseDomains } from '../lib/emailDomain';
import { aggregate, computeStandings, mapPool, rating, sortLeaderboard } from '../services/stats';
import { mapFaceitMatch } from '../services/matchImport';
import { extractMatchId } from '../services/faceit';
import { faceitDetails, faceitStats } from './fixtures/faceitMatch';

describe('email domains', () => {
  const domains = parseDomains('@kpi.ua, lll.kpi.ua');

  it('нормалізує список доменів', () => {
    expect(domains).toEqual(['kpi.ua', 'lll.kpi.ua']);
  });

  it('приймає домен і піддомени ЗВО', () => {
    expect(emailMatchesDomains('student@kpi.ua', domains)).toBe(true);
    expect(emailMatchesDomains('Student@LLL.KPI.UA', domains)).toBe(true);
    expect(emailMatchesDomains('x@fiot.kpi.ua', domains)).toBe(true);
  });

  it('відхиляє схожі, але чужі домени', () => {
    expect(emailMatchesDomains('x@notkpi.ua', domains)).toBe(false);
    expect(emailMatchesDomains('x@kpi.ua.evil.com', domains)).toBe(false);
    expect(emailMatchesDomains('kpi.ua', domains)).toBe(false);
  });
});

describe('stats', () => {
  const row = (kills: number, deaths: number, adr: number, won: boolean) => ({
    kills,
    deaths,
    assists: 2,
    adr,
    hsPercent: 50,
    mvps: 1,
    won,
  });

  it('середній гравець має рейтинг ≈ 1.00', () => {
    expect(rating(1, 75)).toBe(1);
  });

  it('агрегує карти', () => {
    const s = aggregate([row(20, 10, 100, true), row(10, 20, 60, false)]);
    expect(s).toMatchObject({ maps: 2, wins: 1, kills: 30, deaths: 30, kd: 1, adr: 80, winrate: 50 });
  });

  it('порожня статистика не ділить на нуль', () => {
    expect(aggregate([])).toMatchObject({ maps: 0, kd: 0, adr: 0, rating: 0 });
  });

  it('сортує топ за обраною метрикою', () => {
    const a = { id: 'a', stats: aggregate([row(30, 10, 70, true)]) };
    const b = { id: 'b', stats: aggregate([row(15, 10, 120, true)]) };
    expect(sortLeaderboard([b, a], 'kd').map((e) => e.id)).toEqual(['a', 'b']);
    expect(sortLeaderboard([a, b], 'adr').map((e) => e.id)).toEqual(['b', 'a']);
  });

  it('групує маппул за картами', () => {
    const pool = mapPool([
      { ...row(20, 10, 90, true), mapName: 'de_nuke' },
      { ...row(10, 10, 75, false), mapName: 'de_mirage' },
      { ...row(15, 15, 75, true), mapName: 'de_mirage' },
    ]);
    expect(pool.map((p) => p.mapName)).toEqual(['de_mirage', 'de_nuke']);
    expect(pool[0]).toMatchObject({ maps: 2, winrate: 50, rating: 1 });
  });

  it('рахує турнірну таблицю', () => {
    const rows = computeStandings(
      ['x', 'y', 'z'],
      [
        { teamAId: 'x', teamBId: 'y', scoreA: 1, scoreB: 0 },
        { teamAId: 'z', teamBId: 'x', scoreA: 2, scoreB: 1 },
        { teamAId: 'y', teamBId: 'z', scoreA: 0, scoreB: 1 },
      ]
    );
    expect(rows.map((r) => [r.teamId, r.points])).toEqual([
      ['z', 6],
      ['x', 3],
      ['y', 0],
    ]);
  });
});

describe('FACEIT import', () => {
  it('витягує ID з посилання на кімнату', () => {
    expect(extractMatchId('https://www.faceit.com/en/cs2/room/1-abcdef12-3456-7890-abcd-ef1234567890/scoreboard')).toBe(
      '1-abcdef12-3456-7890-abcd-ef1234567890'
    );
    expect(() => extractMatchId('../../etc/passwd')).toThrow();
  });

  it('зіставляє гравців і команди', () => {
    const registered = new Map([
      ['p1', { userId: 'u1', teamId: 'teamX' }],
      ['p2', { userId: 'u2', teamId: 'teamX' }],
      ['p6', { userId: 'u6', teamId: 'teamY' }],
    ]);
    const m = mapFaceitMatch(faceitDetails, faceitStats, registered);
    expect(m.sides.A.teamId).toBe('teamX');
    expect(m.sides.B.teamId).toBe('teamY');
    expect(m.maps).toHaveLength(1);
    expect(m.maps[0]).toMatchObject({ mapName: 'de_mirage', scoreA: 13, scoreB: 9 });
    expect([m.scoreA, m.scoreB]).toEqual([1, 0]);
    expect([...m.unmatched].sort()).toEqual(['nick3', 'nick7']);

    const p1 = m.maps[0].players.find((p) => p.faceitId === 'p1')!;
    expect(p1).toMatchObject({ userId: 'u1', side: 'A', kills: 25, deaths: 14, adr: 101.3, hsPercent: 48, won: true });
    const p6 = m.maps[0].players.find((p) => p.faceitId === 'p6')!;
    expect(p6).toMatchObject({ side: 'B', won: false });
  });
});
