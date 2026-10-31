import type { FaceitMatchDetails, FaceitMatchStats } from '../../services/faceit';

/** Скорочена відповідь FACEIT Data API (/matches/{id} та /matches/{id}/stats) */
export const faceitDetails: FaceitMatchDetails = {
  match_id: '1-abcdef12-3456-7890-abcd-ef1234567890',
  status: 'FINISHED',
  started_at: 1796659200,
  best_of: 1,
  teams: {
    faction1: {
      faction_id: 'f1-id',
      name: 'team_nick1',
      roster: [
        { player_id: 'p1', nickname: 'nick1' },
        { player_id: 'p2', nickname: 'nick2' },
        { player_id: 'p3', nickname: 'nick3' },
      ],
    },
    faction2: {
      faction_id: 'f2-id',
      name: 'team_nick6',
      roster: [
        { player_id: 'p6', nickname: 'nick6' },
        { player_id: 'p7', nickname: 'nick7' },
      ],
    },
  },
  results: { winner: 'faction1', score: { faction1: 1, faction2: 0 } },
};

const player = (id: string, nick: string, k: number, d: number, adr: number, hs: number, result: string) => ({
  player_id: id,
  nickname: nick,
  player_stats: {
    Kills: String(k),
    Deaths: String(d),
    Assists: '4',
    ADR: String(adr),
    'Headshots %': String(hs),
    MVPs: '3',
    Result: result,
  },
});

export const faceitStats: FaceitMatchStats = {
  rounds: [
    {
      match_round: '1',
      round_stats: { Map: 'de_mirage', Score: '13 / 9', Winner: 'f1-id' },
      teams: [
        {
          team_id: 'f2-id',
          team_stats: { Team: 'team_nick6', 'Final Score': '9' },
          players: [player('p6', 'nick6', 17, 20, 80.1, 41, '0'), player('p7', 'nick7', 12, 19, 65, 30, '0')],
        },
        {
          team_id: 'f1-id',
          team_stats: { Team: 'team_nick1', 'Final Score': '13' },
          players: [
            player('p1', 'nick1', 25, 14, 101.3, 48, '1'),
            player('p2', 'nick2', 18, 15, 85, 55, '1'),
            player('p3', 'nick3', 10, 16, 60, 35, '1'),
          ],
        },
      ],
    },
  ],
};
