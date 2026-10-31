import type { Team, TeamMember, University, User } from '@prisma/client';
import { ROLE_LABELS, type CS2Role } from './constants';

type UserWithUni = User & { university?: University | null };

export const isProfileComplete = (u: User) => Boolean(u.fullName && u.telegram && u.role && u.universityId);

export const publicUniversity = (u: University | null | undefined) =>
  u ? { id: u.id, name: u.name, city: u.city } : null;

/** Публічна картка гравця: без пошти й telegram */
export function publicPlayer(u: UserWithUni) {
  return {
    id: u.id,
    nickname: u.faceitNickname,
    avatar: u.avatar,
    fullName: u.fullName,
    university: publicUniversity(u.university),
    role: u.role as CS2Role | null,
    roleLabel: u.role ? ROLE_LABELS[u.role as CS2Role] : null,
    faceitLevel: u.faceitLevel,
    faceitElo: u.faceitElo,
    kd: u.faceitKd,
    winrate: u.faceitWinrate,
    hsPercent: u.faceitHsPercent,
    faceitMatches: u.faceitMatches,
    verified: u.verificationStatus === 'VERIFIED',
  };
}

export function selfUser(u: UserWithUni) {
  return {
    ...publicPlayer(u),
    faceitId: u.faceitId,
    telegram: u.telegram,
    universityId: u.universityId,
    verificationStatus: u.verificationStatus,
    studentEmail: u.studentEmail,
    discordUsername: u.discordUsername,
    discordLinked: Boolean(u.discordId),
    isAdmin: u.isAdmin,
    profileComplete: isProfileComplete(u),
    faceitSyncedAt: u.faceitSyncedAt,
  };
}

type TeamFull = Team & {
  university: University;
  members: (TeamMember & { user: UserWithUni })[];
};

/**
 * @param viewerId — учасники команди бачать telegram одне одного та інвайт-код
 */
export function serializeTeam(team: TeamFull, viewerId?: string) {
  const isMember = Boolean(viewerId && team.members.some((m) => m.userId === viewerId));
  return {
    id: team.id,
    name: team.name,
    tag: team.tag,
    status: team.status,
    group: team.group,
    university: publicUniversity(team.university),
    captainId: team.captainId,
    discordReady: Boolean(team.discordRoleId),
    createdAt: team.createdAt,
    inviteCode: isMember && viewerId === team.captainId ? team.inviteCode : undefined,
    members: team.members
      .slice()
      .sort((a, b) => (a.slot === b.slot ? +a.joinedAt - +b.joinedAt : a.slot === 'MAIN' ? -1 : 1))
      .map((m) => ({
        slot: m.slot,
        joinedAt: m.joinedAt,
        isCaptain: m.userId === team.captainId,
        player: publicPlayer(m.user),
        telegram: isMember ? m.user.telegram : undefined,
      })),
  };
}

export const teamInclude = {
  university: true,
  members: { include: { user: { include: { university: true } } } },
} as const;
