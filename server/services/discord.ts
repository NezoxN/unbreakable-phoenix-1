import { config } from '../config';
import { prisma } from '../db';
import { HttpError } from '../lib/http';

const API = 'https://discord.com/api/v10';

// Бітові прапорці прав Discord
const VIEW_CHANNEL = 1n << 10n;
const SEND_MESSAGES = 1n << 11n;
const CONNECT = 1n << 20n;
const SPEAK = 1n << 21n;

export const discordRedirectUri = () => `${config.APP_URL}/api/discord/callback`;

export function buildDiscordAuthorizeUrl(state: string) {
  const url = new URL('https://discord.com/oauth2/authorize');
  url.searchParams.set('client_id', config.DISCORD_CLIENT_ID!);
  url.searchParams.set('redirect_uri', discordRedirectUri());
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'identify guilds.join');
  url.searchParams.set('state', state);
  url.searchParams.set('prompt', 'none');
  return url.toString();
}

export async function exchangeDiscordCode(code: string) {
  const tokenRes = await fetch(`${API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.DISCORD_CLIENT_ID!,
      client_secret: config.DISCORD_CLIENT_SECRET!,
      grant_type: 'authorization_code',
      code,
      redirect_uri: discordRedirectUri(),
    }),
  });
  if (!tokenRes.ok) {
    console.error('[Discord] token exchange failed', tokenRes.status, await tokenRes.text());
    throw new HttpError(502, 'Discord відхилив авторизацію.');
  }
  const { access_token } = (await tokenRes.json()) as { access_token: string };
  const meRes = await fetch(`${API}/users/@me`, { headers: { Authorization: `Bearer ${access_token}` } });
  if (!meRes.ok) throw new HttpError(502, 'Не вдалося отримати профіль Discord.');
  const me = (await meRes.json()) as { id: string; username: string; global_name?: string };
  return { accessToken: access_token, id: me.id, username: me.username };
}

async function bot(method: string, path: string, body?: unknown) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${config.DISCORD_BOT_TOKEN}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`[Discord] ${method} ${path} → ${res.status} ${await res.text()}`);
  }
  if (res.status === 204 || res.status === 404) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

/** Discord-помилки не мають ламати основну дію (верифікацію, склад) — тільки лог */
function safe<T extends unknown[]>(fn: (...args: T) => Promise<void>) {
  return async (...args: T) => {
    if (!config.discordBotEnabled) return;
    try {
      await fn(...args);
    } catch (err) {
      console.error(err);
    }
  };
}

/** Додає користувача на сервер ліги (через OAuth-токен) */
export async function addToGuild(discordUserId: string, accessToken: string) {
  if (!config.discordBotEnabled) return;
  await bot('PUT', `/guilds/${config.DISCORD_GUILD_ID}/members/${discordUserId}`, {
    access_token: accessToken,
  });
}

/** Ролі, які сайт видає/знімає. Інші ролі учасника не чіпаємо. */
async function managedRoleIds() {
  const teams = await prisma.team.findMany({
    where: { discordRoleId: { not: null } },
    select: { discordRoleId: true },
  });
  return new Set(
    [config.DISCORD_PLAYER_ROLE_ID, config.DISCORD_CAPTAIN_ROLE_ID, ...teams.map((t) => t.discordRoleId)].filter(
      (id): id is string => Boolean(id)
    )
  );
}

async function desiredRoleIds(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { membership: { include: { team: true } } },
  });
  const roles = new Set<string>();
  if (!user) return roles;
  if (user.verificationStatus === 'VERIFIED' && config.DISCORD_PLAYER_ROLE_ID) roles.add(config.DISCORD_PLAYER_ROLE_ID);
  const team = user.membership?.team;
  if (team) {
    if (team.captainId === user.id && config.DISCORD_CAPTAIN_ROLE_ID) roles.add(config.DISCORD_CAPTAIN_ROLE_ID);
    if (team.discordRoleId) roles.add(team.discordRoleId);
  }
  return roles;
}

async function applyRoles(discordUserId: string, desired: Set<string>) {
  const guild = config.DISCORD_GUILD_ID;
  const member = (await bot('GET', `/guilds/${guild}/members/${discordUserId}`)) as { roles: string[] } | null;
  if (!member) return; // користувач вийшов із сервера
  const managed = await managedRoleIds();
  const current = new Set(member.roles);
  for (const role of desired) {
    if (!current.has(role)) await bot('PUT', `/guilds/${guild}/members/${discordUserId}/roles/${role}`);
  }
  for (const role of current) {
    if (managed.has(role) && !desired.has(role)) {
      await bot('DELETE', `/guilds/${guild}/members/${discordUserId}/roles/${role}`);
    }
  }
}

/** Приводить ролі учасника на сервері у відповідність до його стану на сайті */
export const syncMember = safe(async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { discordId: true } });
  if (!user?.discordId) return;
  await applyRoles(user.discordId, await desiredRoleIds(userId));
});

export const syncTeamMembers = safe(async (teamId: string) => {
  const members = await prisma.teamMember.findMany({ where: { teamId }, select: { userId: true } });
  for (const m of members) await syncMember(m.userId);
});

/** Знімає всі ролі ліги перед відв'язкою акаунта */
export const removeAllRoles = safe(async (discordUserId: string) => {
  await applyRoles(discordUserId, new Set());
});

/** Після схвалення команди: роль команди + приватні текстовий і голосовий канали */
export const ensureTeamSpace = safe(async (teamId: string) => {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return;
  const guild = config.DISCORD_GUILD_ID!;
  let roleId = team.discordRoleId;
  if (!roleId) {
    const role = (await bot('POST', `/guilds/${guild}/roles`, { name: `${team.tag} · ${team.name}`, mentionable: true })) as {
      id: string;
    };
    roleId = role.id;
  }
  let channelId = team.discordChannelId;
  if (!channelId) {
    const overwrites = [
      { id: guild, type: 0, deny: VIEW_CHANNEL.toString() }, // @everyone
      { id: roleId, type: 0, allow: (VIEW_CHANNEL | SEND_MESSAGES | CONNECT | SPEAK).toString() },
    ];
    const slug = team.name.toLowerCase().replace(/[^a-z0-9а-яіїєґ]+/gi, '-').slice(0, 80);
    const text = (await bot('POST', `/guilds/${guild}/channels`, {
      name: slug,
      type: 0,
      parent_id: config.DISCORD_TEAMS_CATEGORY_ID,
      permission_overwrites: overwrites,
    })) as { id: string };
    await bot('POST', `/guilds/${guild}/channels`, {
      name: `🔊 ${team.name}`,
      type: 2,
      parent_id: config.DISCORD_TEAMS_CATEGORY_ID,
      permission_overwrites: overwrites,
    });
    channelId = text.id;
  }
  await prisma.team.update({ where: { id: teamId }, data: { discordRoleId: roleId, discordChannelId: channelId } });
  await syncTeamMembers(teamId);
});
