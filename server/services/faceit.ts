import crypto from 'node:crypto';
import { config } from '../config';
import { HttpError } from '../lib/http';

// Ендпоінти FACEIT Connect (OAuth2/OIDC): https://api.faceit.com/auth/v1/openid_configuration
const AUTHORIZE_URL = 'https://accounts.faceit.com/accounts?redirect_popup=true';
const TOKEN_URL = 'https://api.faceit.com/auth/v1/oauth/token';
const USERINFO_URL = 'https://api.faceit.com/auth/v1/resources/userinfo';
const DATA_API = 'https://open.faceit.com/data/v4';

export const faceitRedirectUri = () => `${config.APP_URL}/api/auth/faceit/callback`;

export function createPkce() {
  const verifier = crypto.randomBytes(32).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

export function buildAuthorizeUrl(state: string, codeChallenge: string) {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', config.FACEIT_CLIENT_ID!);
  url.searchParams.set('redirect_uri', faceitRedirectUri());
  url.searchParams.set('scope', 'openid profile');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  return url.toString();
}

export interface FaceitIdentity {
  guid: string;
  nickname: string;
  picture?: string;
}

export async function exchangeCode(code: string, codeVerifier: string): Promise<FaceitIdentity> {
  const basic = Buffer.from(`${config.FACEIT_CLIENT_ID}:${config.FACEIT_CLIENT_SECRET}`).toString('base64');
  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
      redirect_uri: faceitRedirectUri(),
    }),
  });
  if (!tokenRes.ok) {
    console.error('[FACEIT] token exchange failed', tokenRes.status, await tokenRes.text());
    throw new HttpError(502, 'FACEIT відхилив авторизацію. Спробуйте ще раз.');
  }
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const infoRes = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${access_token}` } });
  if (!infoRes.ok) {
    throw new HttpError(502, 'Не вдалося отримати профіль FACEIT.');
  }
  const info = (await infoRes.json()) as { guid: string; nickname: string; picture?: string };
  return { guid: info.guid, nickname: info.nickname, picture: info.picture };
}

async function dataApi<T>(path: string): Promise<T | null> {
  if (!config.faceitDataEnabled) return null;
  const res = await fetch(`${DATA_API}${path}`, {
    headers: { Authorization: `Bearer ${config.FACEIT_API_KEY}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    console.error('[FACEIT Data API]', path, res.status);
    throw new HttpError(502, 'FACEIT Data API тимчасово недоступний.');
  }
  return (await res.json()) as T;
}

export interface FaceitPlayerSnapshot {
  nickname: string;
  avatar?: string;
  level: number;
  elo: number;
  kd: number;
  winrate: number;
  hsPercent: number;
  matches: number;
}

/** Рівень/ELO та лайфтайм-статистика CS2. null — якщо Data API не налаштований. */
export async function fetchPlayerSnapshot(playerId: string): Promise<FaceitPlayerSnapshot | null> {
  const player = await dataApi<{
    nickname: string;
    avatar?: string;
    games?: { cs2?: { skill_level: number; faceit_elo: number } };
  }>(`/players/${encodeURIComponent(playerId)}`);
  if (!player) return null;

  const stats = await dataApi<{ lifetime?: Record<string, string> }>(
    `/players/${encodeURIComponent(playerId)}/stats/cs2`
  ).catch(() => null);

  return {
    nickname: player.nickname,
    avatar: player.avatar || undefined,
    level: player.games?.cs2?.skill_level ?? 0,
    elo: player.games?.cs2?.faceit_elo ?? 0,
    kd: Number(stats?.lifetime?.['Average K/D Ratio'] ?? 0) || 0,
    winrate: Number(stats?.lifetime?.['Win Rate %'] ?? 0) || 0,
    hsPercent: Math.round(Number(stats?.lifetime?.['Average Headshots %'] ?? 0) || 0),
    matches: Number(stats?.lifetime?.['Matches'] ?? 0) || 0,
  };
}

/* ------------------------------------------------------------------ */
/* Матчі                                                              */
/* ------------------------------------------------------------------ */

export interface FaceitMatchDetails {
  match_id: string;
  status: string;
  started_at?: number;
  best_of?: number;
  teams: Record<'faction1' | 'faction2', { faction_id: string; name: string; roster: { player_id: string; nickname: string }[] }>;
  results?: { winner: string; score: Record<string, number> };
}

export interface FaceitMatchStats {
  rounds: {
    match_round: string;
    round_stats: { Map: string; Score: string; Winner: string };
    teams: {
      team_id: string;
      team_stats: Record<string, string>;
      players: { player_id: string; nickname: string; player_stats: Record<string, string> }[];
    }[];
  }[];
}

/** Приймає ID матчу або посилання на кімнату FACEIT */
export function extractMatchId(input: string): string {
  const trimmed = input.trim();
  const fromUrl = trimmed.match(/room\/([0-9a-z-]+)/i);
  const id = fromUrl ? fromUrl[1] : trimmed;
  if (!/^[0-9a-z-]{8,64}$/i.test(id)) {
    throw new HttpError(400, 'Некоректний ID або посилання на матч FACEIT.');
  }
  return id;
}

export async function fetchMatch(matchId: string) {
  if (!config.faceitDataEnabled) {
    throw new HttpError(503, 'FACEIT_API_KEY не налаштовано — імпорт недоступний.');
  }
  const details = await dataApi<FaceitMatchDetails>(`/matches/${matchId}`);
  if (!details) throw new HttpError(404, 'Матч не знайдено на FACEIT.');
  const stats = await dataApi<FaceitMatchStats>(`/matches/${matchId}/stats`);
  if (!stats) throw new HttpError(409, 'Статистика матчу ще недоступна (матч не завершено?).');
  return { details, stats };
}
