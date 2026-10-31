import crypto from 'node:crypto';
import type { Prisma, Team, User } from '@prisma/client';
import { prisma } from '../db';
import { config } from '../config';
import { HttpError } from '../lib/http';
import { isProfileComplete } from '../lib/serialize';
import { MAX_MAIN, MAX_SUBS } from '../lib/constants';

type Tx = Prisma.TransactionClient;

export const newInviteCode = () => crypto.randomBytes(6).toString('base64url');

/** Склад зафіксовано після подачі заявки — далі зміни лише через адміністратора */
export function assertRosterEditable(team: Team) {
  if (team.status === 'PENDING' || team.status === 'APPROVED') {
    throw new HttpError(409, 'Склад зафіксовано після подачі заявки. Для змін зверніться до організаторів.');
  }
}

/** Гравець може вступити в команду: підтверджений, з повним профілем, без команди, з того ж ЗВО */
export async function assertEligible(tx: Tx, user: User, team: Team) {
  if (user.verificationStatus !== 'VERIFIED') {
    throw new HttpError(403, `${user.faceitNickname} ще не підтвердив статус студента.`);
  }
  if (!isProfileComplete(user)) {
    throw new HttpError(403, `${user.faceitNickname} не заповнив профіль гравця.`);
  }
  const existing = await tx.teamMember.findUnique({ where: { userId: user.id } });
  if (existing) {
    throw new HttpError(409, existing.teamId === team.id ? 'Гравець уже в цій команді.' : 'Гравець уже в іншій команді.');
  }
  if (config.TEAM_SAME_UNIVERSITY && user.universityId !== team.universityId) {
    throw new HttpError(403, 'Усі гравці команди мають навчатися в одному ЗВО.');
  }
}

export async function nextFreeSlot(tx: Tx, teamId: string): Promise<'MAIN' | 'SUB'> {
  const members = await tx.teamMember.findMany({ where: { teamId }, select: { slot: true } });
  const main = members.filter((m) => m.slot === 'MAIN').length;
  const subs = members.length - main;
  if (main < MAX_MAIN) return 'MAIN';
  if (subs < MAX_SUBS) return 'SUB';
  throw new HttpError(409, `Склад заповнено (${MAX_MAIN} основних + ${MAX_SUBS} запасних).`);
}

/** Додає гравця в команду й прибирає його «хвости»: інші запрошення та оголошення на ринку */
export async function addMember(tx: Tx, team: Team, user: User) {
  await assertEligible(tx, user, team);
  const slot = await nextFreeSlot(tx, team.id);
  await tx.teamMember.create({ data: { teamId: team.id, userId: user.id, slot } });
  await tx.teamInvite.updateMany({
    where: { userId: user.id, status: 'PENDING' },
    data: { status: 'CANCELLED' },
  });
  await tx.lftPost.updateMany({ where: { userId: user.id, authorType: 'PLAYER' }, data: { active: false } });

  const count = await tx.teamMember.count({ where: { teamId: team.id } });
  if (count >= MAX_MAIN + MAX_SUBS) {
    await tx.lftPost.updateMany({ where: { teamId: team.id }, data: { active: false } });
  }
  return slot;
}

/** Після видалення основного гравця запасний автоматично переходить в основу */
export async function promoteSubIfNeeded(tx: Tx, teamId: string) {
  const main = await tx.teamMember.count({ where: { teamId, slot: 'MAIN' } });
  if (main >= MAX_MAIN) return;
  const sub = await tx.teamMember.findFirst({ where: { teamId, slot: 'SUB' }, orderBy: { joinedAt: 'asc' } });
  if (sub) await tx.teamMember.update({ where: { id: sub.id }, data: { slot: 'MAIN' } });
}

export async function getTeamOr404(teamId: string) {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new HttpError(404, 'Команду не знайдено.');
  return team;
}

export function assertCaptain(team: Team, userId: string) {
  if (team.captainId !== userId) throw new HttpError(403, 'Дія доступна лише капітану команди.');
}
