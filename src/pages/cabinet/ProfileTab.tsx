import React, { useEffect, useState } from 'react';
import { Pencil, RefreshCw, Save, ShieldCheck, Trophy } from 'lucide-react';
import { api, startDiscordLink } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { StudentVerification } from '../../components/StudentVerification';
import {
  Badge,
  Field,
  FormMessage,
  Notice,
  Panel,
  ROLE_OPTIONS,
  SectionTitle,
  Stat,
  ghostButton,
  goldButton,
  inputClass,
  mapLabel,
  formatDate,
  VERIFICATION_BADGE,
  VERIFICATION_LABELS,
  labelClass,
  useFormState,
} from '../../components/ui';
import type { CS2Role, MeResponse, PlayerProfileResponse } from '../../types';

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-3 border-b border-neutral-900 last:border-0">
    <span className={labelClass}>{label}</span>
    <span className="font-mono text-xs text-white text-right">{children}</span>
  </div>
);

const DISCORD_NOTICE: Record<string, { tone: 'success' | 'error'; text: string }> = {
  linked: { tone: 'success', text: 'Discord прив’язано. Ролі на сервері ліги оновлено.' },
  taken: { tone: 'error', text: 'Цей Discord-акаунт уже прив’язано до іншого гравця.' },
  error: { tone: 'error', text: 'Не вдалося прив’язати Discord. Спробуйте ще раз.' },
};

export const ProfileTab: React.FC<{ discordStatus: string | null }> = ({ discordStatus }) => {
  const { me, setMe, providers, universities } = useAuth();
  const [league, setLeague] = useState<PlayerProfileResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [universityId, setUniversityId] = useState('');
  const [profile, setProfile] = useState({ fullName: '', telegram: '', role: 'RIFLER' as CS2Role });
  const save = useFormState();
  const faceit = useFormState();
  const discord = useFormState();

  const userId = me?.user.id;
  useEffect(() => {
    if (!me) return;
    setProfile({ fullName: me.user.fullName ?? '', telegram: me.user.telegram ?? '', role: me.user.role ?? 'RIFLER' });
    setUniversityId(me.user.universityId ?? '');
    api
      .get<PlayerProfileResponse>(`/players/${me.user.id}`)
      .then(setLeague)
      .catch(() => undefined);
  }, [userId]); // me змінюється після кожної мутації — профіль перечитуємо лише при зміні користувача

  if (!me) return null;
  const { user, team } = me;
  const s = league?.stats;
  const complete = user.profileComplete;
  const formOpen = !complete || editing;

  return (
    <div className="mt-10 space-y-8 animate-in fade-in duration-200">
      {/* FACEIT */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="FACEIT ELO" value={user.faceitElo || '—'} hint={`Рівень ${user.faceitLevel || '—'}`} gold />
        <Stat label="K/D RATIO" value={user.kd ? user.kd.toFixed(2) : '—'} hint="FACEIT CS2 · за весь час" />
        <Stat
          label="WINRATE"
          value={user.winrate ? `${user.winrate}%` : '—'}
          hint={user.faceitMatches ? `${user.faceitMatches} матчів на FACEIT` : 'FACEIT CS2 · за весь час'}
        />
        <Stat label="HEADSHOT %" value={user.hsPercent ? `${user.hsPercent}%` : '—'} hint="FACEIT CS2 · за весь час" />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={faceit.busy}
          onClick={async () => {
            const res = await faceit.run(() => api.post<MeResponse>('/me/refresh-faceit'), 'Дані FACEIT оновлено.');
            if (res) setMe(res);
          }}
          className="hover-target inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-neutral-500 hover:text-[#FFD700] disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${faceit.busy ? 'animate-spin' : ''}`} />
          Оновити дані FACEIT
        </button>
        <div className="flex-1">
          <FormMessage message={faceit.message} />
        </div>
      </div>

      {/* Статистика в лізі */}
      <section>
        <SectionTitle>СТАТИСТИКА В ЛІЗІ PHX</SectionTitle>
        {!s?.maps ? (
          <Notice>Ще немає зіграних матчів ліги. Статистика з’явиться після першого матчу.</Notice>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Stat label="PHX Rating" value={s.rating.toFixed(2)} gold />
            <Stat label="K/D" value={s.kd.toFixed(2)} hint={`${s.kills} / ${s.deaths}`} />
            <Stat label="ADR" value={s.adr.toFixed(1)} />
            <Stat label="HS %" value={`${s.hsPercent}%`} />
            <Stat label="Карти" value={`${s.wins}–${s.maps - s.wins}`} hint={`Winrate ${s.winrate}%`} />
            <Stat label="Асисти" value={s.assists} hint={`MVP ${s.mvps}`} />
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Student verification */}
        <Panel accent={!user.verified}>
          <SectionTitle icon={<ShieldCheck className={`w-5 h-5 ${user.verified ? 'text-emerald-400' : 'text-neutral-600'}`} />}>
            СТУДЕНТСЬКА ВЕРИФІКАЦІЯ
          </SectionTitle>
          <div className="mb-6">
            <Row label="Університет">{user.university?.name ?? '—'}</Row>
            <Row label="Пошта ЗВО">{user.studentEmail ?? '—'}</Row>
            <Row label="Статус">
              <Badge tone={VERIFICATION_BADGE[user.verificationStatus]}>{VERIFICATION_LABELS[user.verificationStatus].label}</Badge>
            </Row>
            <Row label="Команда у лізі">
              {team ? (
                <span className="text-[#FFD700]">
                  [{team.tag}] {team.name}
                  {team.captainId === user.id ? ' (капітан)' : ''}
                </span>
              ) : (
                '—'
              )}
            </Row>
          </div>
          <StudentVerification />
        </Panel>

        <div className="space-y-8">
          {/* Map pool */}
          <Panel>
            <SectionTitle icon={<Trophy className="w-5 h-5 text-[#FFD700]" />}>СИГНАТУРНИЙ МАППУЛ</SectionTitle>
            {!league?.mapPool?.length ? (
              <p className="text-neutral-500 text-sm">З’явиться після перших матчів ліги.</p>
            ) : (
              <div className="space-y-4">
                {league.mapPool.map((m) => (
                  <div key={m.mapName} className="space-y-1">
                    <div className="flex justify-between font-mono text-xs">
                      <span className="text-white">
                        {mapLabel(m.mapName)} <span className="text-neutral-500">· {m.maps} карт</span>
                      </span>
                      <span className="text-[#FFD700]">
                        Rating {m.rating.toFixed(2)} · {m.winrate}% Win
                      </span>
                    </div>
                    <div className="w-full bg-neutral-900 h-1.5">
                      <div className="bg-[#FFD700] h-1.5" style={{ width: `${Math.max(m.winrate, 4)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Recent matches */}
          <Panel>
            <SectionTitle>ОСТАННІ МАТЧІ</SectionTitle>
            {!league?.recentMatches.length ? (
              <p className="text-neutral-500 text-sm">Матчів ліги ще немає.</p>
            ) : (
              <div className="divide-y divide-neutral-900">
                {league.recentMatches.slice(0, 5).map((m) => (
                  <div key={m.id} className="py-3 flex items-center justify-between gap-3 font-mono text-xs">
                    <span className="min-w-0">
                      <span className="text-white block truncate">
                        {m.teamA.name} <span className="text-[#FFD700]">{m.scoreA}:{m.scoreB}</span> {m.teamB.name}
                      </span>
                      <span className="text-neutral-500">
                        {m.scheduledAt ? formatDate(m.scheduledAt) : m.stage} · {m.maps.map(mapLabel).join(', ')}
                      </span>
                    </span>
                    <span className="text-right shrink-0">
                      <span className="text-white block">
                        {m.stats.kills}-{m.stats.deaths}
                      </span>
                      <span className="text-neutral-500">R {m.stats.rating.toFixed(2)}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* Discord */}
          <Panel>
            <SectionTitle>
              DISCORD <span className="text-[#5865F2]">ЛІГИ</span>
            </SectionTitle>
            <div className="space-y-4">
              {discordStatus && DISCORD_NOTICE[discordStatus] && <FormMessage message={DISCORD_NOTICE[discordStatus]} />}
              {user.discordLinked ? (
                <>
                  <Row label="Акаунт">
                    <span className="text-[#FFD700]">@{user.discordUsername}</span>
                  </Row>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    Ролі «Гравець», «Капітан» і роль команди видаються автоматично. Після схвалення команди з’явиться приватний канал складу.
                  </p>
                  <button
                    type="button"
                    disabled={discord.busy}
                    onClick={async () => {
                      const res = await discord.run(() => api.del<MeResponse>('/discord/link'));
                      if (res) setMe(res);
                    }}
                    className={ghostButton}
                  >
                    ВІДВ’ЯЗАТИ
                  </button>
                </>
              ) : (
                <>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    Прив’яжи Discord — тебе додадуть на сервер ліги з потрібними ролями та доступом до каналу команди.
                  </p>
                  <button type="button" onClick={startDiscordLink} disabled={!providers.discord} className={goldButton}>
                    ПРИВ’ЯЗАТИ DISCORD
                  </button>
                  {!providers.discord && <p className="font-mono text-[11px] text-neutral-500">Інтеграцію з Discord ще не налаштовано.</p>}
                </>
              )}
              <FormMessage message={discord.message} />
            </div>
          </Panel>

          {/* Edit profile */}
        </div>

        <Panel accent={!complete}>
          <SectionTitle
            icon={
              complete && !editing ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="hover-target inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-neutral-400 hover:text-[#FFD700]"
                >
                  <Pencil className="w-3.5 h-3.5" /> Редагувати
                </button>
              ) : undefined
            }
          >
            ДАНІ ГРАВЦЯ
          </SectionTitle>

          {!formOpen ? (
            <div>
              <Row label="Ім’я">{user.fullName}</Row>
              <Row label="Telegram">{user.telegram}</Row>
              <Row label="Роль">{user.roleLabel}</Row>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                const body = complete ? profile : { ...profile, universityId };
                const res = await save.run(() => api.patch<MeResponse>('/me', body), 'Профіль збережено.');
                if (res) {
                  setMe(res);
                  setEditing(false);
                }
              }}
            >
              {!complete && (
                <p className="text-neutral-300 text-sm leading-relaxed">
                  Заповни профіль — без нього не можна створити команду, подати анкету на ринок чи пройти перевірку студента.
                </p>
              )}
              <Field id="pFullName" label="Ім’я та прізвище" error={save.errors.fullName}>
                <input
                  id="pFullName"
                  required
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="pTelegram" label="Telegram" error={save.errors.telegram}>
                  <input
                    id="pTelegram"
                    required
                    placeholder="@nickname"
                    value={profile.telegram}
                    onChange={(e) => setProfile({ ...profile, telegram: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field id="pRole" label="Роль" error={save.errors.role}>
                  <select
                    id="pRole"
                    value={profile.role}
                    onChange={(e) => setProfile({ ...profile, role: e.target.value as CS2Role })}
                    className={inputClass}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              {!complete && (
                <Field id="pUni" label="Університет" error={save.errors.universityId}>
                  <select id="pUni" required value={universityId} onChange={(e) => setUniversityId(e.target.value)} className={inputClass}>
                    <option value="">Оберіть ЗВО…</option>
                    {universities.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
              <FormMessage message={save.message} />
              <div className="flex flex-wrap gap-3">
                <button type="submit" disabled={save.busy} className={goldButton}>
                  <Save className="w-4 h-4" />
                  <span>ЗБЕРЕГТИ</span>
                </button>
                {complete && (
                  <button type="button" onClick={() => setEditing(false)} className={ghostButton}>
                    СКАСУВАТИ
                  </button>
                )}
              </div>
            </form>
          )}
        </Panel>
      </div>
    </div>
  );
};
