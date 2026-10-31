import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '../db';
import { config } from '../config';
import { newInviteCode } from '../services/teams';

/**
 * Тестові дані для ручної перевірки сайту: npm run db:demo
 * Входи через DEV-вхід (DEV_LOGIN=true): test_captain, test_player, test_free, test_newbie, test_pending.
 * Скрипт можна запускати повторно — він спершу видаляє власні демо-дані. Адмінів не чіпає.
 */

const TEAM_NAMES = ['Phoenix KPI', 'Mohyla Owls Demo', 'NURE Hackers', 'KNU Lions Demo', 'NAU Wings'];

// Детермінований генератор, щоб кожен запуск давав однакові цифри
function prng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = prng(2026);
const between = (a: number, b: number) => a + rnd() * (b - a);

// 1×1 PNG-заглушка для «студентського квитка»
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

type Role = 'AWP' | 'IGL' | 'ENTRY' | 'RIFLER' | 'SUPPORT';
interface Seed {
  nick: string;
  name: string;
  uni: string;
  role: Role;
  level: number;
  status?: string; // VERIFICATION; за замовчуванням VERIFIED
  profile?: boolean; // false → профіль не заповнено
}

const P = (nick: string, name: string, uni: string, role: Role, level: number, extra: Partial<Seed> = {}): Seed => ({
  nick,
  name,
  uni,
  role,
  level,
  ...extra,
});

const PHX = [
  P('test_captain', 'Тестовий Капітан', 'KPI', 'IGL', 9),
  P('test_player', 'Тестовий Гравець', 'KPI', 'AWP', 8),
  P('demo_kpi3', 'Андрій Мельник', 'KPI', 'ENTRY', 7),
  P('demo_kpi4', 'Ігор Бондар', 'KPI', 'RIFLER', 7),
  P('demo_kpi5', 'Олег Ткачук', 'KPI', 'SUPPORT', 6),
  P('demo_kpi6', 'Денис Шевчук', 'KPI', 'RIFLER', 5),
];
const OWLS = [
  P('demo_owl1', 'Марія Коваль', 'UKMA', 'IGL', 8),
  P('demo_owl2', 'Тарас Кравець', 'UKMA', 'AWP', 9),
  P('demo_owl3', 'Юрій Лисенко', 'UKMA', 'ENTRY', 6),
  P('demo_owl4', 'Софія Гнатюк', 'UKMA', 'RIFLER', 7),
  P('demo_owl5', 'Віктор Руденко', 'UKMA', 'SUPPORT', 6),
];
const NURE = [
  P('demo_nure1', 'Богдан Савчук', 'NURE', 'IGL', 7),
  P('demo_nure2', 'Катерина Попенко', 'NURE', 'AWP', 8),
  P('demo_nure3', 'Роман Пономаренко', 'NURE', 'ENTRY', 5),
  P('demo_nure4', 'Назар Кучер', 'NURE', 'RIFLER', 6),
  P('demo_nure5', 'Артем Мороз', 'NURE', 'SUPPORT', 5),
];
const LIONS = [
  P('demo_lion1', 'Дмитро Власенко', 'KNU', 'IGL', 8),
  P('demo_lion2', 'Олена Іваненко', 'KNU', 'AWP', 7),
  P('demo_lion3', 'Павло Захарченко', 'KNU', 'ENTRY', 6),
  P('demo_lion4', 'Ілля Романюк', 'KNU', 'RIFLER', 6),
  P('demo_lion5', 'Максим Давиденко', 'KNU', 'SUPPORT', 4, { status: 'NONE' }), // непідтверджений
];
const WINGS = [P('demo_wing1', 'Станіслав Пилипенко', 'NAU', 'IGL', 6), P('demo_wing2', 'Анна Гончар', 'NAU', 'RIFLER', 5)];
const SINGLES = [
  P('test_free', 'Тестовий Вільний Агент', 'KPI', 'ENTRY', 8),
  P('demo_free2', 'Леся Мартинюк', 'KNEU', 'AWP', 9),
  P('demo_free3', 'Євген Бойко', 'NAU', 'SUPPORT', 6),
  P('test_pending', 'Тестовий Очікуючий', 'KNU', 'RIFLER', 5, { status: 'PENDING_REVIEW' }),
  P('test_newbie', '', 'KPI', 'RIFLER', 3, { status: 'NONE', profile: false }),
];

const ALL = [...PHX, ...OWLS, ...NURE, ...LIONS, ...WINGS, ...SINGLES];

async function cleanup() {
  const teams = await prisma.team.findMany({ where: { name: { in: TEAM_NAMES } }, select: { id: true } });
  const ids = teams.map((t) => t.id);
  await prisma.match.deleteMany({ where: { OR: [{ teamAId: { in: ids } }, { teamBId: { in: ids } }] } });
  await prisma.team.deleteMany({ where: { id: { in: ids } } });
  const users = await prisma.user.findMany({
    where: { faceitId: { in: ALL.map((p) => `dev-${p.nick}`) } },
    include: { studentCards: true },
  });
  for (const u of users) {
    for (const c of u.studentCards) if (c.filePath) fs.promises.unlink(path.join(config.uploadsDir, c.filePath)).catch(() => undefined);
  }
  await prisma.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
}

async function createUsers() {
  const map = new Map<string, string>();
  for (const p of ALL) {
    const full = p.profile !== false;
    const verified = (p.status ?? 'VERIFIED') === 'VERIFIED';
    const user = await prisma.user.create({
      data: {
        faceitId: `dev-${p.nick}`,
        faceitNickname: p.nick,
        faceitLevel: p.level,
        faceitElo: 700 + p.level * 190 + Math.round(between(0, 90)),
        faceitKd: Math.round(between(0.85, 1.4) * 100) / 100,
        faceitWinrate: Math.round(between(44, 68)),
        faceitHsPercent: Math.round(between(35, 58)),
        faceitMatches: Math.round(between(120, 1400)),
        faceitSyncedAt: new Date(),
        fullName: full ? p.name : null,
        telegram: full ? `@${p.nick}` : null,
        role: full ? p.role : null,
        universityId: full ? p.uni : null,
        verificationStatus: full ? (p.status ?? 'VERIFIED') : 'NONE',
        studentEmail: full && verified ? `${p.nick}@${p.uni.toLowerCase()}.ua` : null,
        verifiedAt: full && verified ? new Date() : null,
      },
    });
    map.set(p.nick, user.id);
  }
  return map;
}

async function main() {
  const unis = await prisma.university.count();
  if (!unis) throw new Error('Довідник ЗВО порожній — спершу виконайте npm run db:seed.');

  await cleanup();
  const uid = await createUsers();
  const id = (nick: string) => uid.get(nick)!;

  // Квиток на перевірці для test_pending
  fs.mkdirSync(config.uploadsDir, { recursive: true });
  const cardFile = `demo-card-${Date.now()}.png`;
  fs.writeFileSync(path.join(config.uploadsDir, cardFile), PNG_1PX);
  await prisma.studentCard.create({ data: { userId: id('test_pending'), filePath: cardFile, mimeType: 'image/png' } });

  const mkTeam = async (name: string, tag: string, uni: string, roster: Seed[], status: string, group: string | null, mainCount = 5) => {
    const team = await prisma.team.create({
      data: { name, tag, universityId: uni, captainId: id(roster[0].nick), status, group, inviteCode: newInviteCode() },
    });
    await prisma.teamMember.createMany({
      data: roster.map((p, i) => ({ teamId: team.id, userId: id(p.nick), slot: i < mainCount ? 'MAIN' : 'SUB' })),
    });
    return team;
  };

  const phx = await mkTeam('Phoenix KPI', 'PHX', 'KPI', PHX, 'APPROVED', 'A');
  const owls = await mkTeam('Mohyla Owls Demo', 'OWL', 'UKMA', OWLS, 'APPROVED', 'A');
  const nure = await mkTeam('NURE Hackers', 'HCK', 'NURE', NURE, 'APPROVED', 'A');
  await mkTeam('KNU Lions Demo', 'LNS', 'KNU', LIONS, 'PENDING', null);
  const wings = await mkTeam('NAU Wings', 'WNG', 'NAU', WINGS, 'DRAFT', null);

  const rosters: Record<string, { team: { id: string }; players: Seed[] }> = {
    PHX: { team: phx, players: PHX.slice(0, 5) },
    OWL: { team: owls, players: OWLS },
    HCK: { team: nure, players: NURE },
  };

  // Завершені матчі зі статистикою по картах
  const finished: { a: string; b: string; stage: string; days: number; maps: [string, number, number][] }[] = [
    { a: 'PHX', b: 'OWL', stage: 'GROUP_A', days: 6, maps: [['de_mirage', 13, 9], ['de_inferno', 8, 13], ['de_nuke', 13, 11]] },
    { a: 'PHX', b: 'HCK', stage: 'GROUP_A', days: 4, maps: [['de_ancient', 13, 7], ['de_mirage', 13, 10]] },
    { a: 'OWL', b: 'HCK', stage: 'GROUP_A', days: 2, maps: [['de_inferno', 13, 6], ['de_nuke', 9, 13], ['de_anubis', 13, 8]] },
  ];
  for (const m of finished) {
    const A = rosters[m.a];
    const B = rosters[m.b];
    const winsA = m.maps.filter(([, a, b]) => a > b).length;
    const match = await prisma.match.create({
      data: {
        stage: m.stage,
        group: 'A',
        teamAId: A.team.id,
        teamBId: B.team.id,
        scoreA: winsA,
        scoreB: m.maps.length - winsA,
        bestOf: m.maps.length === 2 ? 2 : 3,
        status: 'FINISHED',
        scheduledAt: new Date(Date.now() - m.days * 86400000),
      },
    });
    for (const [i, [mapName, sa, sb]] of m.maps.entries()) {
      const map = await prisma.matchMap.create({ data: { matchId: match.id, order: i + 1, mapName, scoreA: sa, scoreB: sb } });
      const rows = [
        ...A.players.map((p) => ({ p, teamId: A.team.id, won: sa > sb })),
        ...B.players.map((p) => ({ p, teamId: B.team.id, won: sb > sa })),
      ];
      await prisma.playerMatchStat.createMany({
        data: rows.map(({ p, teamId, won }) => {
          const skill = p.level / 10;
          const rounds = sa + sb;
          const kills = Math.round(rounds * between(0.55, 0.8) * (0.8 + skill * 0.5) + (won ? 2 : 0));
          const deaths = Math.round(rounds * between(0.6, 0.85) - (won ? 1 : 0));
          return {
            matchId: match.id,
            mapId: map.id,
            userId: id(p.nick),
            teamId,
            kills,
            deaths: Math.max(deaths, 5),
            assists: Math.round(between(2, 8)),
            adr: Math.round(between(55, 95) * (0.85 + skill * 0.3) * 10) / 10,
            hsPercent: Math.round(between(30, 62)),
            mvps: Math.round(between(1, 5)),
            won,
          };
        }),
      });
    }
  }

  // Матч без результату (дата минула — потрапляє в «Потребує уваги») і майбутній
  await prisma.match.create({
    data: { stage: 'GROUP_A', group: 'A', teamAId: nure.id, teamBId: phx.id, bestOf: 3, scheduledAt: new Date(Date.now() - 86400000) },
  });
  await prisma.match.create({
    data: { stage: 'GROUP_A', group: 'A', teamAId: owls.id, teamBId: phx.id, bestOf: 3, scheduledAt: new Date(Date.now() + 3 * 86400000) },
  });

  // Ринок: анкети гравців і команди
  const lft = (nick: string, roles: string, description: string) =>
    prisma.lftPost.create({ data: { authorType: 'PLAYER', userId: id(nick), roles, description } });
  await lft('test_free', 'ENTRY,RIFLER', 'Шукаю команду на сезон, граю ентрі, 3 роки досвіду, вечори вільні.');
  await lft('demo_free2', 'AWP', 'AWP-ер, LVL 9. Готова до тренувань 4 рази на тиждень.');
  await lft('demo_free3', 'SUPPORT', 'Опорник, граю на утиліті, вмію говорити по ходу раунду.');
  await prisma.lftPost.create({
    data: { authorType: 'TEAM', teamId: phx.id, roles: 'SUPPORT', description: 'Phoenix KPI шукає запасного гравця, від LVL 5.', minLevel: 5 },
  });

  // Запрошення: test_free ← NAU Wings (в банері), Phoenix ← demo_free2 (в банері test_captain)
  await prisma.teamInvite.create({
    data: { teamId: wings.id, userId: id('test_free'), direction: 'TEAM_TO_PLAYER', message: 'Приєднуйся до нас, ми шукаємо ентрі.' },
  });
  await prisma.teamInvite.create({
    data: { teamId: phx.id, userId: id('demo_free2'), direction: 'PLAYER_TO_TEAM', message: 'Можу закрити AWP, хочу в Phoenix.' },
  });

  console.log(`[demo] Готово: ${ALL.length} гравців, 5 команд, 3 завершені матчі + 2 заплановані.`);
  console.log('[demo] Вхід через DEV-вхід: test_captain, test_player, test_free, test_newbie, test_pending, phx_admin');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
