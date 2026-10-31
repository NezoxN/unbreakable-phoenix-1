import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { handler, HttpError, parse } from '../lib/http';
import { cleanString, telegramSchema } from '../lib/sanitize';
import { userLimiter } from '../lib/rateLimit';
import { CS2_ROLES } from '../lib/constants';
import { selfUser, serializeTeam, teamInclude } from '../lib/serialize';
import { currentUser, requireAuth } from '../middleware/auth';
import { upsertFaceitUser } from './auth';
import { syncMember } from '../services/discord';

export const meRouter = Router();
meRouter.use(requireAuth);

export async function loadMe(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { university: true, membership: { include: { team: { include: teamInclude } } } },
  });
  const pendingCard = await prisma.studentCard.findFirst({
    where: { userId, status: { in: ['PENDING', 'REJECTED'] } },
    orderBy: { createdAt: 'desc' },
    select: { status: true, comment: true, createdAt: true },
  });
  return {
    user: selfUser(user),
    team: user.membership ? serializeTeam(user.membership.team, user.id) : null,
    studentCard: pendingCard,
  };
}

meRouter.get(
  '/',
  handler(async (req, res) => {
    res.json({ ok: true, ...(await loadMe(currentUser(req).id)) });
  })
);

const profileSchema = z.object({
  fullName: cleanString(2, 64, 'Вкажіть ім’я та прізвище (від 2 до 64 символів).').optional(),
  telegram: telegramSchema.optional(),
  role: z.enum(CS2_ROLES, { message: 'Оберіть ігрову роль.' }).optional(),
  universityId: z.string().max(16).optional(),
});

meRouter.patch(
  '/',
  handler(async (req, res) => {
    const user = currentUser(req);
    const data = parse(profileSchema, req.body);

    const extra: Record<string, unknown> = {};
    if (data.universityId && data.universityId !== user.universityId) {
      const uni = await prisma.university.findUnique({ where: { id: data.universityId } });
      if (!uni) throw new HttpError(400, 'Оберіть ЗВО зі списку.', { universityId: 'Оберіть ЗВО зі списку.' });
      const membership = await prisma.teamMember.findUnique({ where: { userId: user.id } });
      if (membership) {
        throw new HttpError(409, 'Не можна змінити ЗВО, поки ви у складі команди.');
      }
      // Статус студента прив'язаний до конкретного ЗВО — після зміни перевірка проходиться заново
      if (user.universityId) {
        Object.assign(extra, { verificationStatus: 'NONE', studentEmail: null, verifiedAt: null });
      }
    }

    await prisma.user.update({ where: { id: user.id }, data: { ...data, ...extra } });
    if ('verificationStatus' in extra) await syncMember(user.id);
    res.json({ ok: true, ...(await loadMe(user.id)) });
  })
);

meRouter.post(
  '/refresh-faceit',
  userLimiter(10 * 60 * 1000, 3, 'Оновлювати дані FACEIT можна не частіше 3 разів на 10 хвилин.'),
  handler(async (req, res) => {
    const user = currentUser(req);
    await upsertFaceitUser(user.faceitId, user.faceitNickname, user.avatar ?? undefined);
    res.json({ ok: true, ...(await loadMe(user.id)) });
  })
);
