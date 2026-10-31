import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Crown, UserMinus, UserPlus, ArrowDownUp, Search } from 'lucide-react';
import { api, qs } from '../../lib/api';
import { Badge, FormMessage, Notice, Spinner, ghostButton, goldButton, smallInputClass, useFormState } from '../../components/ui';
import type { PublicPlayer, TeamItem, TeamStatus } from '../../types';

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const STATUS_TONE: Record<TeamStatus, 'gold' | 'green' | 'red' | 'neutral'> = {
  DRAFT: 'neutral',
  PENDING: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
};

interface UserHit extends PublicPlayer {
  team: { id: string; name: string } | null;
}

/** Пошук гравця й додавання в склад (адмін може змінювати склад навіть після фіксації) */
const AddMember: React.FC<{ team: TeamItem; onDone: (text: string) => void }> = ({ team, onDone }) => {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<UserHit[]>([]);
  const add = useFormState();

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(() => {
      api
        .get<{ users: UserHit[] }>(`/admin/users${qs({ q })}`)
        .then((d) => setHits(d.users.slice(0, 8)))
        .catch(() => setHits([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="space-y-3">
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
        <input placeholder="Додати гравця: нікнейм або ім’я…" value={q} onChange={(e) => setQ(e.target.value)} className={`${smallInputClass} pl-10`} />
      </div>
      <FormMessage message={add.message} />
      {hits.length > 0 && (
        <div className="border border-neutral-850 divide-y divide-neutral-900 max-w-2xl">
          {hits.map((u) => (
            <div key={u.id} className="px-4 py-2.5 flex items-center justify-between gap-4 font-mono text-xs">
              <span className="text-white">
                {u.nickname} <span className="text-neutral-500">· {u.university?.name ?? 'без ЗВО'} · LVL {u.faceitLevel}</span>
                {!u.verified && <span className="text-red-400"> · не підтверджено</span>}
              </span>
              {u.team ? (
                <span className="text-neutral-600">у «{u.team.name}»</span>
              ) : (
                <button
                  type="button"
                  disabled={add.busy}
                  onClick={async () => {
                    const ok = await add.run(() => api.post(`/admin/teams/${team.id}/members`, { userId: u.id }));
                    if (ok) {
                      setQ('');
                      onDone(`${u.nickname} доданий до «${team.name}».`);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 uppercase tracking-wider text-[#FFD700] hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Додати
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const TeamsPanel: React.FC<{ onChange: () => void }> = ({ onChange }) => {
  const [status, setStatus] = useState('PENDING');
  const [teams, setTeams] = useState<TeamItem[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const act = useFormState();

  const load = useCallback(() => {
    api
      .get<{ teams: TeamItem[] }>(`/admin/teams?status=${status}`)
      .then((d) => setTeams(d.teams))
      .catch(() => setTeams([]));
  }, [status]);

  useEffect(() => {
    setTeams(null);
    load();
  }, [load]);

  const run = async (fn: () => Promise<unknown>, text: string) => {
    const ok = await act.run(fn, text);
    if (ok) {
      load();
      onChange();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-neutral-400 text-sm">Схвалення заявок, групи та ручне керування складами.</p>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${smallInputClass} w-auto`}>
          <option value="PENDING">На перевірці</option>
          <option value="APPROVED">Активні</option>
          <option value="DRAFT">Чернетки</option>
          <option value="REJECTED">Відхилені</option>
          <option value="ALL">Усі</option>
        </select>
      </div>
      <FormMessage message={act.message} />
      {teams === null ? (
        <Spinner />
      ) : teams.length === 0 ? (
        <Notice>Немає команд у цьому статусі.</Notice>
      ) : (
        teams.map((t) => {
          const isOpen = open === t.id;
          const mainCount = t.members.filter((m) => m.slot === 'MAIN').length;
          return (
            <div key={t.id} className={`bg-[#090909] border ${isOpen ? 'border-neutral-700' : 'border-neutral-850'}`}>
              <div className="p-6 flex flex-col lg:flex-row lg:items-center gap-4">
                <button type="button" onClick={() => setOpen(isOpen ? null : t.id)} className="flex-1 text-left flex items-center gap-4">
                  <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                  <span>
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-head text-xl uppercase text-white">
                        <span className="text-[#FFD700]">[{t.tag}]</span> {t.name}
                      </span>
                      <Badge tone={STATUS_TONE[t.status]}>{t.status}</Badge>
                      {t.discordReady && <Badge>Discord ✓</Badge>}
                    </span>
                    <span className="block font-mono text-xs text-neutral-400 mt-1">
                      {t.university?.name} · основа {mainCount}/5 · запас {t.members.length - mainCount}/2 · непідтверджених:{' '}
                      {t.members.filter((m) => !m.player.verified).length}
                    </span>
                  </span>
                </button>
                <select
                  value={t.group ?? ''}
                  onChange={(e) => run(() => api.patch(`/admin/teams/${t.id}`, { group: e.target.value || null }), `Групу для «${t.name}» збережено.`)}
                  className={`${smallInputClass} w-auto`}
                >
                  <option value="">Без групи</option>
                  {GROUPS.map((g) => (
                    <option key={g} value={g}>
                      Група {g}
                    </option>
                  ))}
                </select>
                {t.status !== 'APPROVED' && (
                  <button
                    type="button"
                    disabled={act.busy}
                    onClick={() => run(() => api.post(`/admin/teams/${t.id}/decision`, { decision: 'APPROVE' }), `«${t.name}» схвалено.`)}
                    className={goldButton}
                  >
                    СХВАЛИТИ
                  </button>
                )}
                {t.status !== 'REJECTED' && (
                  <button
                    type="button"
                    disabled={act.busy}
                    onClick={() => run(() => api.post(`/admin/teams/${t.id}/decision`, { decision: 'REJECT' }), `«${t.name}» відхилено.`)}
                    className={ghostButton}
                  >
                    ВІДХИЛИТИ
                  </button>
                )}
              </div>

              {isOpen && (
                <div className="border-t border-neutral-850">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="bg-[#0e0e0e] text-neutral-500 uppercase tracking-widest text-[10px]">
                        <th className="py-3 px-6">Слот</th>
                        <th className="py-3 px-4">Гравець</th>
                        <th className="py-3 px-4">FACEIT</th>
                        <th className="py-3 px-4">Telegram</th>
                        <th className="py-3 px-4">Статус</th>
                        <th className="py-3 px-6 text-right">Дії</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900">
                      {t.members.map((m) => (
                        <tr key={m.player.id} className="hover:bg-[#111]">
                          <td className={`py-3 px-6 ${m.isCaptain ? 'text-[#FFD700] font-bold' : 'text-neutral-400'}`}>
                            {m.isCaptain ? 'CAPTAIN' : m.slot === 'SUB' ? 'ЗАПАС' : 'ОСНОВА'}
                          </td>
                          <td className="py-3 px-4 text-white">
                            {m.player.nickname} <span className="text-neutral-500">({m.player.fullName})</span>
                          </td>
                          <td className="py-3 px-4">
                            LVL {m.player.faceitLevel} · {m.player.faceitElo}
                          </td>
                          <td className="py-3 px-4 text-neutral-400">{m.telegram ?? '—'}</td>
                          <td className={`py-3 px-4 ${m.player.verified ? 'text-emerald-400' : 'text-red-400'}`}>
                            {m.player.verified ? '✓ Підтверджено' : '✕ Не підтверджено'}
                          </td>
                          <td className="py-3 px-6 text-right whitespace-nowrap space-x-4">
                            {!m.isCaptain && (
                              <>
                                <button
                                  type="button"
                                  title={m.slot === 'MAIN' ? 'Перемістити в запас' : 'Перемістити в основу'}
                                  onClick={() =>
                                    run(
                                      () => api.patch(`/admin/teams/${t.id}/members/${m.player.id}`, { slot: m.slot === 'MAIN' ? 'SUB' : 'MAIN' }),
                                      `${m.player.nickname}: ${m.slot === 'MAIN' ? 'у запасі' : 'в основі'}.`
                                    )
                                  }
                                  className="text-neutral-400 hover:text-[#FFD700]"
                                >
                                  <ArrowDownUp className="w-4 h-4 inline" />
                                </button>
                                <button
                                  type="button"
                                  title="Зробити капітаном"
                                  onClick={() =>
                                    run(() => api.post(`/admin/teams/${t.id}/captain`, { userId: m.player.id }), `${m.player.nickname} — новий капітан.`)
                                  }
                                  className="text-neutral-400 hover:text-[#FFD700]"
                                >
                                  <Crown className="w-4 h-4 inline" />
                                </button>
                                <button
                                  type="button"
                                  title="Видалити зі складу"
                                  onClick={() => {
                                    if (!window.confirm(`Видалити ${m.player.nickname} зі складу «${t.name}»?`)) return;
                                    run(() => api.del(`/admin/teams/${t.id}/members/${m.player.id}`), `${m.player.nickname} видалено зі складу.`);
                                  }}
                                  className="text-neutral-400 hover:text-red-400"
                                >
                                  <UserMinus className="w-4 h-4 inline" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {t.members.length < 7 && (
                    <div className="p-6 border-t border-neutral-900">
                      <AddMember
                        team={t}
                        onDone={(text) => {
                          act.setMessage({ tone: 'success', text });
                          load();
                          onChange();
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
