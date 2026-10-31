/** Етап календаря сезону (розклад). Зберігає фото з попереднього дизайну. */
export interface SeasonStage {
  id: string;
  number: string;
  dates: string;
  title: string;
  status: 'ACTIVE' | 'SOON' | 'PLANNED';
  statusLabel: string;
  description: string;
  specs: { label: string; value: string }[];
  image: string;
  imageAlt: string;
}

export interface StepItem {
  number: string;
  title: string;
  description: string;
}

export interface LeagueHub {
  id: 'kyiv' | 'kharkiv' | 'lviv' | 'odesa';
  city: string;
  role: string;
}

export interface PrizePlace {
  place: string;
  title: string;
  amount: string;
  devices: string[];
  tone: 'gold' | 'silver' | 'bronze';
}

export interface UniversityItem {
  number: string;
  short: string;
  name: string;
  city: string;
  team: string;
  domain: string;
}

export interface FairPlayRule {
  id: string;
  title: string;
  description: string;
}

export interface PartnerSlot {
  id: string;
  title: string;
  status: 'OPEN' | 'NEGOTIATION';
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SiteConfig {
  brand: {
    name: string;
    slogan: string;
    league: string;
    season: string;
    discipline: string;
  };
  countdown: {
    /** ISO-дата закриття реєстрації. Порожнє значення → стан «Дату буде оголошено». */
    registrationCloseISO: string | null;
  };
  keyDates: { label: string; value: string }[];
  contacts: {
    email: string;
    /** null → кнопка неактивна з позначкою «скоро» */
    discord: string | null;
    telegram: string | null;
  };
}

export type CS2Role = 'AWP' | 'IGL' | 'ENTRY' | 'RIFLER' | 'SUPPORT';

/* ------------------------------------------------------------------ */
/* API                                                                */
/* ------------------------------------------------------------------ */

export type VerificationStatus = 'NONE' | 'EMAIL_SENT' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
export type TeamStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED';

export interface ApiUniversity {
  id: string;
  name: string;
  city: string;
  emailDomains?: string[];
}

export interface PublicPlayer {
  id: string;
  nickname: string;
  avatar: string | null;
  fullName: string | null;
  university: ApiUniversity | null;
  role: CS2Role | null;
  roleLabel: string | null;
  faceitLevel: number;
  faceitElo: number;
  kd: number;
  winrate: number;
  hsPercent: number;
  faceitMatches: number;
  verified: boolean;
}

export interface SelfUser extends PublicPlayer {
  faceitId: string;
  telegram: string | null;
  universityId: string | null;
  verificationStatus: VerificationStatus;
  studentEmail: string | null;
  discordUsername: string | null;
  discordLinked: boolean;
  isAdmin: boolean;
  profileComplete: boolean;
  faceitSyncedAt: string | null;
}

export interface TeamMemberItem {
  slot: 'MAIN' | 'SUB';
  joinedAt: string;
  isCaptain: boolean;
  player: PublicPlayer;
  telegram?: string | null;
}

export interface TeamItem {
  id: string;
  name: string;
  tag: string;
  status: TeamStatus;
  group: string | null;
  university: ApiUniversity | null;
  captainId: string;
  discordReady: boolean;
  createdAt: string;
  inviteCode?: string;
  members: TeamMemberItem[];
}

export interface MeResponse {
  user: SelfUser;
  team: TeamItem | null;
  studentCard: { status: string; comment: string | null; createdAt: string } | null;
}

export interface InviteItem {
  id: string;
  direction: 'TEAM_TO_PLAYER' | 'PLAYER_TO_TEAM';
  message: string | null;
  createdAt: string;
  team: { id: string; name: string; tag: string };
  player: PublicPlayer;
  canRespond: boolean;
  canCancel: boolean;
}

export interface MarketPlayerItem {
  postId: string;
  roles: CS2Role[];
  description: string;
  updatedAt: string;
  player: PublicPlayer;
}

export interface MarketTeamItem {
  postId: string;
  roles: CS2Role[];
  description: string;
  minLevel: number | null;
  updatedAt: string;
  team: { id: string; name: string; tag: string; university: ApiUniversity | null; membersCount: number; freeSlots: number };
}

export interface LftPostItem {
  id: string;
  roles: CS2Role[];
  description: string;
  minLevel: number | null;
  active: boolean;
}

export interface TeamBrief {
  id: string;
  name: string;
  tag: string;
}

export interface MatchMapItem {
  id: string;
  order: number;
  mapName: string;
  scoreA: number;
  scoreB: number;
}

export interface MatchItem {
  id: string;
  stage: string;
  group: string | null;
  teamA: TeamBrief;
  teamB: TeamBrief;
  teamAId: string;
  teamBId: string;
  scoreA: number;
  scoreB: number;
  bestOf: number;
  status: MatchStatus;
  scheduledAt: string | null;
  faceitMatchId: string | null;
  source: 'MANUAL' | 'FACEIT';
  maps: MatchMapItem[];
}

export interface AggregatedStats {
  maps: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  kd: number;
  adr: number;
  hsPercent: number;
  mvps: number;
  winrate: number;
  rating: number;
}

export interface LeaderboardEntry {
  player: PublicPlayer;
  team: TeamBrief | null;
  stats: AggregatedStats;
}

export interface PlayerProfileResponse {
  player: PublicPlayer;
  team: (TeamBrief & { status: TeamStatus }) | null;
  stats: AggregatedStats;
  recentMatches: {
    id: string;
    stage: string;
    scheduledAt: string | null;
    teamA: TeamBrief;
    teamB: TeamBrief;
    scoreA: number;
    scoreB: number;
    maps: string[];
    stats: AggregatedStats;
  }[];
  mapPool: MapPoolEntry[];
}

export interface MapPoolEntry {
  mapName: string;
  maps: number;
  winrate: number;
  rating: number;
}
