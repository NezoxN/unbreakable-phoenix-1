import React, { useCallback, useEffect, useState } from 'react';
import { Search, UserPlus, Users, EyeOff, ChevronDown } from 'lucide-react';
import { api, qs } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Badge,
  FormMessage,
  Notice,
  ROLE_OPTIONS,
  Segmented,
  Spinner,
  ghostButton,
  goldButton,
  inputClass,
  labelClass,
  outlineGoldSmall,
  cardClass,
  smallInputClass,
  useFormState,
} from '../../components/ui';
import type { CS2Role, LftPostItem, MarketPlayerItem, MarketTeamItem } from '../../types';

/** Власне оголошення: анкета вільного агента або пошук гравців командою. Згорнуте за замовчуванням. */
const PostEditor: React.FC<{ kind: 'player' | 'team'; post: LftPostItem | null; onChange: () => void }> = ({
  kind,
  post,
  onChange,
}) => {
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState<CS2Role[]>(post?.roles ?? []);
  const [description, setDescription] = useState(post?.description ?? '');
  const [minLevel, setMinLevel] = useState<number | ''>(post?.minLevel ?? '');
  const form = useFormState();

  useEffect(() => {
    setRoles(post?.roles ?? []);
    setDescription(post?.description ?? '');
    setMinLevel(post?.minLevel ?? '');
  }, [post]);

  const toggle = (r: CS2Role) => setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  const active = Boolean(post?.active);

  return (
    <div className={`bg-[#090909] border border-neutral-850 ${active ? '' : 'border-l-4 border-l-[#FFD700]'}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="hover-target w-full px-6 sm:px-8 py-5 flex items-center justify-between gap-4 text-left"
      >
        <div className="space-y-1">
          <span className="font-head text-lg sm:text-xl uppercase text-white tracking-wide">
            {kind === 'player' ? 'Моя анкета вільного агента' : 'Команда шукає гравців'}
          </span>
          <span className="block font-mono text-[11px] text-neutral-500">
            {active ? `Опубліковано · ${post!.roles.join(' / ')}` : 'Не опубліковано — тебе не видно на ринку'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={active ? 'green' : 'neutral'}>{active ? 'Активне' : 'Приховано'}</Badge>
          <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <form
          className="px-6 sm:px-8 pb-6 space-y-4 border-t border-neutral-900 pt-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const body = { roles, description, ...(kind === 'team' ? { minLevel: minLevel === '' ? null : minLevel } : {}) };
            const ok = await form.run(() => api.put(`/market/posts/${kind}`, body), 'Оголошення опубліковано на ринку.');
            if (ok) onChange();
          }}
        >
          <div>
            <span className={`${labelClass} block mb-2`}>{kind === 'player' ? 'Ролі, на яких граю *' : 'Потрібні ролі *'}</span>
            <div className="flex flex-wrap gap-px bg-[#050505] w-fit">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => toggle(r.value)}
                  className={`hover-target font-mono text-xs px-4 py-2 transition-colors ${
                    roles.includes(r.value) ? 'bg-[#FFD700] text-black font-bold' : 'bg-[#121212] text-neutral-400 hover:text-white'
                  }`}
                >
                  {r.value}
                </button>
              ))}
            </div>
            {form.errors.roles && <p className="text-red-400 text-xs font-mono mt-1">{form.errors.roles}</p>}
          </div>
          <textarea
            rows={3}
            maxLength={500}
            placeholder={kind === 'player' ? 'Досвід, улюблені карти, коли можу грати…' : 'Кого шукаємо, графік тренувань…'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
          {kind === 'team' && (
            <select value={minLevel} onChange={(e) => setMinLevel(e.target.value ? Number(e.target.value) : '')} className={inputClass}>
              <option value="">Мінімальний рівень FACEIT — будь-який</option>
              {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((l) => (
                <option key={l} value={l}>
                  Від Level {l}
                </option>
              ))}
            </select>
          )}
          <FormMessage message={form.message} />
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={form.busy} className={goldButton}>
              <UserPlus className="w-4 h-4" />
              <span>{active ? 'ОНОВИТИ' : 'ОПУБЛІКУВАТИ'}</span>
            </button>
            {active && (
              <button
                type="button"
                disabled={form.busy}
                onClick={async () => {
                  const ok = await form.run(() => api.del(`/market/posts/${kind}`), 'Оголошення приховано.');
                  if (ok) onChange();
                }}
                className={ghostButton}
              >
                <EyeOff className="w-4 h-4" />
                <span>ПРИХОВАТИ</span>
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
};

const Card: React.FC<{ top: React.ReactNode; children: React.ReactNode; action?: React.ReactNode }> = ({ top, children, action }) => (
  <div className={`${cardClass} p-5 text-left flex flex-col justify-between group`}>
    <div>
      <div className="flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-wider pb-3 mb-3 border-b border-neutral-900">
        {top}
      </div>
      {children}
    </div>
    {action && <div className="mt-5 pt-3 border-t border-neutral-900 flex justify-end">{action}</div>}
  </div>
);

export const MarketTab: React.FC = () => {
  const { me, universities } = useAuth();
  const [view, setView] = useState<'players' | 'teams'>('players');
  const [filters, setFilters] = useState({ q: '', role: 'ALL', university: 'ALL', minLevel: '' });
  const [players, setPlayers] = useState<MarketPlayerItem[] | null>(null);
  const [teams, setTeams] = useState<MarketTeamItem[] | null>(null);
  const [myPosts, setMyPosts] = useState<{ playerPost: LftPostItem | null; teamPost: LftPostItem | null }>({
    playerPost: null,
    teamPost: null,
  });
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const action = useFormState();

  const user = me?.user;
  const team = me?.team;
  const isCaptain = Boolean(team && user && team.captainId === user.id);
  const teamEditable = team && (team.status === 'DRAFT' || team.status === 'REJECTED');

  const load = useCallback(async () => {
    const query = qs({ q: filters.q, role: filters.role, university: filters.university, minLevel: filters.minLevel });
    if (view === 'players') {
      setPlayers(null);
      const d = await api.get<{ players: MarketPlayerItem[] }>(`/market/players${query}`).catch(() => ({ players: [] }));
      setPlayers(d.players);
    } else {
      setTeams(null);
      const d = await api.get<{ teams: MarketTeamItem[] }>(`/market/teams${query}`).catch(() => ({ teams: [] }));
      setTeams(d.teams);
    }
  }, [view, filters]);

  const loadMine = useCallback(async () => {
    if (!user) return;
    const d = await api.get<{ playerPost: LftPostItem | null; teamPost: LftPostItem | null }>('/market/my').catch(() => null);
    if (d) setMyPosts({ playerPost: d.playerPost, teamPost: d.teamPost });
  }, [user]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce пошуку
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  const refreshAll = () => {
    load();
    loadMine();
  };

  const invite = async (playerId: string) => {
    if (!team) return;
    const res = await action.run(() => api.post<{ message: string }>(`/teams/${team.id}/invites`, { userId: playerId }), (r) => r.message);
    if (res) setSent((s) => ({ ...s, [playerId]: true }));
  };

  const apply = async (teamId: string) => {
    const res = await action.run(() => api.post<{ message: string }>(`/teams/${teamId}/apply`, {}), (r) => r.message);
    if (res) setSent((s) => ({ ...s, [teamId]: true }));
  };

  const count = view === 'players' ? players?.length : teams?.length;

  return (
    <div className="mt-10 space-y-8 animate-in fade-in duration-200">
      {user?.verified && !team && <PostEditor kind="player" post={myPosts.playerPost} onChange={refreshAll} />}
      {isCaptain && teamEditable && <PostEditor kind="team" post={myPosts.teamPost} onChange={refreshAll} />}
      {user && !user.verified && (
        <Notice>Щоб публікувати анкету, запрошувати гравців або подавати заявки, підтвердьте статус студента у вкладці «Паспорт».</Notice>
      )}

      {/* View switch + filters */}
      <div className="bg-[#090909] border border-neutral-850 p-6 sm:p-8 space-y-6">
        <Segmented
          value={view}
          onChange={setView}
          options={[
            { value: 'players', label: <><UserPlus className="w-4 h-4" /> Вільні гравці</> },
            { value: 'teams', label: <><Users className="w-4 h-4" /> Команди шукають</> },
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder={view === 'players' ? 'Нікнейм чи ім’я…' : 'Назва команди…'}
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              className={`${smallInputClass} pl-10`}
            />
          </div>
          <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} className={smallInputClass}>
            <option value="ALL">Усі ролі</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <select
            value={filters.university}
            onChange={(e) => setFilters({ ...filters, university: e.target.value })}
            className={smallInputClass}
          >
            <option value="ALL">Усі ЗВО ({universities.length})</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <select
            value={filters.minLevel}
            onChange={(e) => setFilters({ ...filters, minLevel: e.target.value })}
            disabled={view !== 'players'}
            className={`${smallInputClass} disabled:opacity-40`}
          >
            <option value="">Будь-який LVL</option>
            {[10, 9, 8, 7, 6, 5].map((l) => (
              <option key={l} value={l}>
                LVL {l}+
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className={labelClass}>Знайдено: {count ?? '…'}</span>
      </div>
      <FormMessage message={action.message} />

      {view === 'players' ? (
        players === null ? (
          <Spinner />
        ) : players.length === 0 ? (
          <Notice>Поки що немає вільних агентів за цими фільтрами.</Notice>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {players.map(({ postId, roles, description, player }) => (
              <Card
                key={postId}
                top={
                  <>
                    <span className="text-[#FFD700] font-semibold">{roles.join(' / ')}</span>
                    <span className="text-neutral-500">
                      LVL <strong className="text-[#FFD700]">{player.faceitLevel}</strong> · {player.faceitElo}
                    </span>
                  </>
                }
                action={
                  isCaptain && teamEditable && player.id !== user?.id ? (
                    <button type="button" onClick={() => invite(player.id)} disabled={sent[player.id] || action.busy} className={outlineGoldSmall}>
                      {sent[player.id] ? '✓ Надіслано' : 'Запросити'}
                    </button>
                  ) : undefined
                }
              >
                <h4 className="font-head text-2xl uppercase text-white font-bold tracking-wide group-hover:text-[#FFD700] transition-colors">
                  {player.nickname}
                </h4>
                <p className="font-mono text-xs text-neutral-400 mt-0.5">{player.fullName}</p>
                <p className="font-mono text-[11px] text-neutral-600 mt-1">{player.university?.name}</p>
                {description && <p className="text-neutral-400 text-sm mt-3 leading-relaxed line-clamp-3">{description}</p>}
                <div className="flex gap-6 mt-4 font-mono text-xs">
                  <span className="text-neutral-500">
                    K/D <strong className="text-white">{player.kd || '—'}</strong>
                  </span>
                  <span className="text-neutral-500">
                    WIN <strong className="text-white">{player.winrate ? `${player.winrate}%` : '—'}</strong>
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )
      ) : teams === null ? (
        <Spinner />
      ) : teams.length === 0 ? (
        <Notice>Поки що жодна команда не шукає гравців за цими фільтрами.</Notice>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {teams.map(({ postId, roles, description, minLevel, team: t }) => (
            <Card
              key={postId}
              top={
                <>
                  <span className="text-[#FFD700] font-semibold">Шукає: {roles.join(' / ')}</span>
                  <span className="text-neutral-500">{minLevel ? `LVL ${minLevel}+` : 'Будь-який LVL'}</span>
                </>
              }
              action={
                user?.verified && !team ? (
                  <button type="button" onClick={() => apply(t.id)} disabled={sent[t.id] || action.busy} className={outlineGoldSmall}>
                    {sent[t.id] ? '✓ Заявку надіслано' : 'Подати заявку'}
                  </button>
                ) : undefined
              }
            >
              <h4 className="font-head text-2xl uppercase text-white font-bold tracking-wide group-hover:text-[#FFD700] transition-colors">
                <span className="text-[#FFD700]">[{t.tag}]</span> {t.name}
              </h4>
              <p className="font-mono text-[11px] text-neutral-600 mt-1">{t.university?.name}</p>
              {description && <p className="text-neutral-400 text-sm mt-3 leading-relaxed line-clamp-3">{description}</p>}
              <div className="flex gap-6 mt-4 font-mono text-xs">
                <span className="text-neutral-500">
                  Склад <strong className="text-white">{t.membersCount}/7</strong>
                </span>
                <span className="text-neutral-500">
                  Вільно <strong className="text-[#FFD700]">{t.freeSlots}</strong>
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
