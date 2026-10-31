export const CS2_ROLES = ['AWP', 'IGL', 'ENTRY', 'RIFLER', 'SUPPORT'] as const;
export type CS2Role = (typeof CS2_ROLES)[number];

export const ROLE_LABELS: Record<CS2Role, string> = {
  AWP: 'Снайпер (AWP)',
  IGL: 'Капітан (IGL)',
  ENTRY: 'Entry Fragger',
  RIFLER: 'Rifler',
  SUPPORT: 'Support',
};

export type VerificationStatus = 'NONE' | 'EMAIL_SENT' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
export type TeamStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type InviteDirection = 'TEAM_TO_PLAYER' | 'PLAYER_TO_TEAM';
export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED';

export const MAX_MAIN = 5;
export const MAX_SUBS = 2;
export const MIN_ROSTER_TO_SUBMIT = 5;

export const CS2_MAPS = ['de_mirage', 'de_inferno', 'de_nuke', 'de_ancient', 'de_anubis', 'de_dust2', 'de_train'];
