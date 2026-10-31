import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db';
import { handler, HttpError, parse } from '../lib/http';
import { cleanString, sanitizeInput } from '../lib/sanitize';
import { MIN_ROSTER_TO_SUBMIT } from '../lib/constants';
import { isProfileComplete, publicPlayer, serializeTeam, teamInclude } from '../lib/serialize';
import { currentUser, requireAuth, requireVerified } from '../middleware/auth';
import {
  addMember,
  assertCaptain,
  assertEligible,
  assertRosterEditable,
  getTeamOr404,
  newInviteCode,
  promoteSubIfNeeded,
} from '../services/teams';
import { syncMember } from '../services/discord';

export const teamsRouter = Router();
export const invitesRouter = Router();

const loadTeam = (id: string) => prisma.team.findUniqueOrThrow({ where: { id }, include: teamInclude });

const teamSchema = z.object({
  name: cleanString(2, 48, 'Назва команди має містити від 2 до 48 символів.'),
  tag: z
    .string()
    .transform(sanitizeInput)
    .refine((v) => /^[A-Za-z0-9]{2,5}$/.test(v), { message: 'Тег — від 2 до 5 латинських літер або цифр.' })
    .transform((v) => v.toUpperCase()),
});

/* ------------------------------ Публічне ------------------------------ */

teamsRouter.get(
  '/',
  handler(async (req, res) => {
    const university = typeof req.query.university === 'string' ? req.query.university : undefined;
    const teams = await prisma.team.findMany({
      where: { status: 'APPROVED', ...(university ? { universityId: university } : {}) },
      include: teamInclude,
      orderBy: { name: 'asc' },
    });
    res.json({ ok: true, teams: teams.map((t) => serializeTeam(t)) });
  })
);

teamsRouter.get(
  '/:id',
  handler(async (req, res) => {
    const team = await prisma.team.findUnique({ where: { id: req.params.id }, include: teamInclude });
    if (!team) throw new HttpError(404, 'Команду не знайдено.');
    const matches = await prisma.match.findMany({
      where: { OR: [{ teamAId: team.id }, { teamBId: team.id }] },
      include: { teamA: { select: { id: true, name: true, tag: true } }, teamB: { select: { id: true, name: true, tag: true } } },
      orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
    });
    const finished = matches.filter((m) => m.status === 'FINISHED');
    const wins = finished.filter((m) => (m.teamAId === team.id ? m.scoreA > m.scoreB : m.scoreB > m.scoreA)).length;
    res.json({
      ok: true,
      team: serializeTeam(team, req.user?.id),
      record: { wins, losses: finished.length - wins },
      matches,
    });
  })
);

/* --------------------------- Керування командою --------------------------- */

teamsRouter.post(
  '/',
  requireVerified,
  handler(async (req, res) => {
    const user = currentUser(req);
    if (!isProfileComplete(user)) throw new HttpError(400, 'Спочатку заповніть профіль гравця.');
    const data = parse(teamSchema, req.body);

    const duplicate = await prisma.team.findFirst({ where: { name: data.name } });
    if (duplicate) {
      throw new HttpError(409, `Команда «${data.name}» вже існує.`, { name: 'Ця назва команди вже зайнята у поточному сезоні.' });
    }

    const team = await prisma.$transaction(async (tx) => {
      const created = await tx.team.create({
        data: { ...data, universityId: user.universityId!, captainId: user.id, inviteCode: newInviteCode() },
      });
      await addMember(tx, created, user);
      return created;
    });
    await syncMember(user.id);
    res.status(201).json({ ok: true, team: serializeTeam(await loadTeam(team.id), user.id) });
  })
);

teamsRouter.patch(
  '/:id',
  requireAuth,
  handler(async (req, res) => {
    const user = currentUser(req);
    const team = await getTeamOr404(req.params.id);
    assertCaptain(team, user.id);
    assertRosterEditable(team);
    const data = parse(teamSchema.partial(), req.body);
    if (data.name && data.name !== team.name) {
      const duplicate = await prisma.team.findFirst({ where: { name: data.name } });
      if (duplicate) throw new HttpError(409, 'Ця назва вже зайнята.', { name: 'Ця назва вже зайнята.' });
    }
    await prisma.team.update({ where: { id: team.id }, data });
    res.json({ ok: true, team: serializeTeam(await loadTeam(team.id), user.id) });
  })
);

teamsRouter.delete(
  '/:id',
  requireAuth,
  handler(async (req, res) => {
    const user = currentUser(req);
    const team = await getTeamOr404(req.params.id);
    assertCaptain(team, user.id);
    assertRosterEditable(team);
    const memberIds = (await prisma.teamMember.findMany({ where: { teamId: team.id } })).map((m) => m.userId);
    await prisma.team.delete({ where: { id: team.id } });
    for (const id of memberIds) await syncMember(id);
    res.json({ ok: true, message: 'Команду розформовано.' });
  })
);

teamsRouter.post(
  '/:id/regenerate-code',
  requireAuth,
  handler(async (req, res) => {
    const user = currentUser(req);
    const team = await getTeamOr404(req.params.id);
    assertCaptain(team, user.id);
    await prisma.team.update({ where: { id: team.id }, data: { inviteCode: newInviteCode() } });
    res.json({ ok: true, team: serializeTeam(await loadTeam(team.id), user.id) });
  })
);

teamsRouter.post(
  '/:id/captain',
  requireAuth,
  handler(async (req, res) => {
    const user = currentUser(req);
    const team = await getTeamOr404(req.params.id);
    assertCaptain(team, user.id);
    const { userId } = parse(z.object({ userId: z.string() }), req.body);
    const member = await prisma.teamMember.findUnique({ where: { userId } });
    if (!member || member.teamId !== team.id) throw new HttpError(404, 'Гравець не в цій команді.');
    await prisma.team.update({ where: { id: team.id }, data: { captainId: userId } });
    await syncMember(user.id);
    await syncMember(userId);
    res.json({ ok: true, team: serializeTeam(await loadTeam(team.id), user.id) });
  })
);

/** Капітан видаляє гравця, або гравець сам виходить */
teamsRouter.delete(
  '/:id/members/:userId',
  requireAuth,
  handler(async (req, res) => {
    const user = currentUser(req);
    const team = await getTeamOr404(req.params.id);
    const targetId = req.params.userId;
    if (targetId !== user.id) assertCaptain(team, user.id);
    if (targetId === team.captainId) {
      throw new HttpError(409, 'Капітан не може вийти. Передайте капітанство або розформуйте команду.');
    }
    assertRosterEditable(team);
    await prisma.$transaction(async (tx) => {
      const { count } = await tx.teamMember.deleteMany({ where: { teamId: team.id, userId: targetId } });
      if (!count) throw new HttpError(404, 'Гравець не в цій команді.');
      await promoteSubIfNeeded(tx, team.id);
    });
    await syncMember(targetId);
    res.json({ ok: true, team: serializeTeam(await loadTeam(team.id), user.id) });
  })
);

teamsRouter.post(
  '/:id/submit',
  requireAuth,
  handler(async (req, res) => {
    const user = currentUser(req);
    const team = await getTeamOr404(req.params.id);
    assertCaptain(team, user.id);
    if (team.status !== 'DRAFT' && team.status !== 'REJECTED') {
      throw new HttpError(409, 'Заявку вже подано.');
    }
    const count = await prisma.teamMember.count({ where: { teamId: team.id } });
    if (count < MIN_ROSTER_TO_SUBMIT) {
      throw new HttpError(400, `Для подачі заявки потрібно щонайменше ${MIN_ROSTER_TO_SUBMIT} гравців (зараз ${count}).`);
    }
    await prisma.team.update({ where: { id: team.id }, data: { status: 'PENDING' } });
    res.json({ ok: true, message: 'Заявку подано на перевірку організаторам.', team: serializeTeam(await loadTeam(team.id), user.id) });
  })
);

teamsRouter.post(
  '/:id/withdraw',
  requireAuth,
  handler(async (req, res) => {
    const user = currentUser(req);
    const team = await getTeamOr404(req.params.id);
    assertCaptain(team, user.id);
    if (team.status !== 'PENDING') throw new HttpError(409, 'Заявка не на розгляді.');
    await prisma.team.update({ where: { id: team.id }, data: { status: 'DRAFT' } });
    res.json({ ok: true, team: serializeTeam(await loadTeam(team.id), user.id) });
  })
);

/* ------------------------------ Вступ у команду ------------------------------ */

teamsRouter.get(
  '/join/:code',
  handler(async (req, res) => {
    const team = await prisma.team.findUnique({ where: { inviteCode: req.params.code }, include: teamInclude });
    if (!team) throw new HttpError(404, 'Посилання-запрошення недійсне.');
    res.json({ ok: true, team: serializeTeam(team) });
  })
);

teamsRouter.post(
  '/join/:code',
  requireVerified,
  handler(async (req, res) => {
    const user = currentUser(req);
    const team = await prisma.team.findUnique({ where: { inviteCode: req.params.code } });
    if (!team) throw new HttpError(404, 'Посилання-запрошення недійсне.');
    assertRosterEditable(team);
    await prisma.$transaction((tx) => addMember(tx, team, user));
    await syncMember(user.id);
    res.json({ ok: true, message: `Ви приєдналися до команди «${team.name}».`, team: serializeTeam(await loadTeam(team.id), user.id) });
  })
);

const messageSchema = z.object({ message: z.string().transform(sanitizeInput).pipe(z.string().max(300)).optional() });

/** Капітан запрошує гравця (наприклад, з ринку) */
teamsRouter.post(
  '/:id/invites',
  requireVerified,
  handler(async (req, res) => {
    const user = currentUser(req);
    const team = await getTeamOr404(req.params.id);
    assertCaptain(team, user.id);
    assertRosterEditable(team);
    const { userId, message } = parse(messageSchema.extend({ userId: z.string() }), req.body);
    const target = await prisma.user.findUnique({ where: { id: userId } });
    if (!target) throw new HttpError(404, 'Гравця не знайдено.');
    await assertEligible(prisma, target, team);

    const existing = await prisma.teamInvite.findFirst({ where: { teamId: team.id, userId, status: 'PENDING' } });
    if (existing) throw new HttpError(409, 'Запрошення цьому гравцю вже надіслано.');
    const invite = await prisma.teamInvite.create({
      data: { teamId: team.id, userId, direction: 'TEAM_TO_PLAYER', message },
    });
    res.status(201).json({ ok: true, inviteId: invite.id, message: `Запрошення надіслано гравцю ${target.faceitNickname}.` });
  })
);

/** Гравець подає заявку в команду */
teamsRouter.post(
  '/:id/apply',
  requireVerified,
  handler(async (req, res) => {
    const user = currentUser(req);
    const team = await getTeamOr404(req.params.id);
    assertRosterEditable(team);
    const { message } = parse(messageSchema, req.body);
    await assertEligible(prisma, user, team);
    const existing = await prisma.teamInvite.findFirst({ where: { teamId: team.id, userId: user.id, status: 'PENDING' } });
    if (existing) throw new HttpError(409, 'Ви вже подали заявку в цю команду.');
    const invite = await prisma.teamInvite.create({
      data: { teamId: team.id, userId: user.id, direction: 'PLAYER_TO_TEAM', message },
    });
    res.status(201).json({ ok: true, inviteId: invite.id, message: `Заявку надіслано капітану «${team.name}».` });
  })
);

/* ------------------------------ Запрошення ------------------------------ */

invitesRouter.use(requireAuth);

/** Усі актуальні запрошення: мої особисті + вхідні/вихідні моєї команди, якщо я капітан */
invitesRouter.get(
  '/',
  handler(async (req, res) => {
    const user = currentUser(req);
    const captainOf = await prisma.team.findFirst({ where: { captainId: user.id }, select: { id: true } });
    const invites = await prisma.teamInvite.findMany({
      where: {
        status: 'PENDING',
        OR: [{ userId: user.id }, ...(captainOf ? [{ teamId: captainOf.id }] : [])],
      },
      include: {
        team: { select: { id: true, name: true, tag: true, universityId: true } },
        user: { include: { university: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      ok: true,
      invites: invites.map((i) => ({
        id: i.id,
        direction: i.direction,
        message: i.message,
        createdAt: i.createdAt,
        team: i.team,
        player: publicPlayer(i.user),
        /** Хто має відповісти: гравець (TEAM_TO_PLAYER) або капітан (PLAYER_TO_TEAM) */
        canRespond: i.direction === 'TEAM_TO_PLAYER' ? i.userId === user.id : captainOf?.id === i.teamId,
        canCancel: i.direction === 'TEAM_TO_PLAYER' ? captainOf?.id === i.teamId : i.userId === user.id,
      })),
    });
  })
);

async function loadInviteForAction(inviteId: string) {
  const invite = await prisma.teamInvite.findUnique({ where: { id: inviteId }, include: { team: true, user: true } });
  if (!invite || invite.status !== 'PENDING') throw new HttpError(404, 'Запрошення не знайдено або вже неактуальне.');
  return invite;
}

const canRespond = (invite: Awaited<ReturnType<typeof loadInviteForAction>>, userId: string) =>
  invite.direction === 'TEAM_TO_PLAYER' ? invite.userId === userId : invite.team.captainId === userId;

invitesRouter.post(
  '/:id/accept',
  handler(async (req, res) => {
    const user = currentUser(req);
    const invite = await loadInviteForAction(req.params.id);
    if (!canRespond(invite, user.id)) throw new HttpError(403, 'Ви не можете прийняти це запрошення.');
    assertRosterEditable(invite.team);
    await prisma.$transaction(async (tx) => {
      await addMember(tx, invite.team, invite.user);
      await tx.teamInvite.update({ where: { id: invite.id }, data: { status: 'ACCEPTED' } });
    });
    await syncMember(invite.userId);
    res.json({ ok: true, message: `${invite.user.faceitNickname} тепер у складі «${invite.team.name}».` });
  })
);

invitesRouter.post(
  '/:id/decline',
  handler(async (req, res) => {
    const user = currentUser(req);
    const invite = await loadInviteForAction(req.params.id);
    if (!canRespond(invite, user.id)) throw new HttpError(403, 'Ви не можете відхилити це запрошення.');
    await prisma.teamInvite.update({ where: { id: invite.id }, data: { status: 'DECLINED' } });
    res.json({ ok: true });
  })
);

invitesRouter.post(
  '/:id/cancel',
  handler(async (req, res) => {
    const user = currentUser(req);
    const invite = await loadInviteForAction(req.params.id);
    const isAuthor = invite.direction === 'TEAM_TO_PLAYER' ? invite.team.captainId === user.id : invite.userId === user.id;
    if (!isAuthor) throw new HttpError(403, 'Ви не можете скасувати це запрошення.');
    await prisma.teamInvite.update({ where: { id: invite.id }, data: { status: 'CANCELLED' } });
    res.json({ ok: true });
  })
);

