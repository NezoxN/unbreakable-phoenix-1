import React, { useEffect, useState } from 'react';
import { Users, Copy, Send, Undo2, Trash2, Crown, UserMinus, RefreshCw, Plus } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Badge,
  Field,
  FormMessage,
  Notice,
  Panel,
  SectionTitle,
  ghostButton,
  goldButton,
  inputClass,
  labelClass,
  useFormState,
} from '../../components/ui';
import type { TeamItem, TeamStatus } from '../../types';
import { SentInvites } from './InviteNotices';

const STATUS: Record<TeamStatus, { label: string; tone: 'gold' | 'green' | 'red' | 'neutral'; hint: string }> = {
  DRAFT: { label: 'Набір складу', tone: 'neutral', hint: 'Зберіть щонайменше 5 гравців і подайте заявку.' },
  PENDING: { label: 'На перевірці', tone: 'gold', hint: 'Організатори перевіряють склад. Його зафіксовано.' },
  APPROVED: { label: 'Активна', tone: 'green', hint: 'Команда допущена до турніру.' },
  REJECTED: { label: 'Відхилено', tone: 'red', hint: 'Виправте склад і подайте заявку повторно.' },
};

const MAX_MAIN = 5;
const MAX_SUBS = 2;

/** Банер вступу за посиланням-запрошенням /#join/<code> */
const JoinByCode: React.FC<{ code: string; onDone: () => void }> = ({ code, onDone }) => {
  const { me, refresh } = useAuth();
  const [team, setTeam] = useState<TeamItem | null>(null);
  const join = useFormState();
  const { setMessage } = join;

  useEffect(() => {
    api
      .get<{ team: TeamItem }>(`/teams/join/${encodeURIComponent(code)}`)
      .then((d) => setTeam(d.team))
      .catch(() => setMessage({ tone: 'error', text: 'Посилання-запрошення недійсне або застаріло.' }));
  }, [code, setMessage]);

  return (
    <Panel accent>
      <span className={labelClass}>Запрошення в команду</span>
      {team && (
        <p className="font-head text-3xl uppercase text-white mt-2">
          [{team.tag}] {team.name}
          <span className="block font-mono text-xs normal-case text-neutral-400 mt-1">
            {team.university?.name} · гравців: {team.members.length}
          </span>
        </p>
      )}
      <div className="space-y-4 mt-4">
        {me && !me.user.verified && <Notice>Щоб приєднатися, спочатку підтвердьте статус студента у вкладці «Паспорт».</Notice>}
        <FormMessage message={join.message} />
        <div className="flex gap-3">
          {team && !me?.team && (
            <button
              type="button"
              disabled={join.busy || !me?.user.verified}
              onClick={async () => {
                const ok = await join.run(() => api.post(`/teams/join/${encodeURIComponent(code)}`));
                if (ok) {
                  await refresh();
                  onDone();
                }
              }}
              className={goldButton}
            >
              ПРИЄДНАТИСЯ
            </button>
          )}
          <button type="button" onClick={onDone} className={ghostButton}>
            ЗАКРИТИ
          </button>
        </div>
      </div>
    </Panel>
  );
};

const CreateTeam: React.FC = () => {
  const { me, setMe, refresh } = useAuth();
  const [data, setData] = useState({ name: '', tag: '' });
  const [code, setCode] = useState('');
  const form = useFormState();
  const join = useFormState();
  const verified = me?.user.verified;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Panel accent>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await form.run(() => api.post<{ team: TeamItem }>('/teams', data));
            if (res && me) setMe({ ...me, team: res.team });
          }}
        >
          <SectionTitle>СТВОРИТИ КОМАНДУ</SectionTitle>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Ти станеш капітаном. Запроси гравців посиланням або з ринку — кожен реєструється й підтверджує статус студента сам.
            {me?.user.university && (
              <>
                {' '}
                Усі гравці — з <span className="text-white">{me.user.university.name}</span>.
              </>
            )}
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Field id="teamName" label="Назва команди *" error={form.errors.name}>
                <input id="teamName" value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} className={inputClass} />
              </Field>
            </div>
            <Field id="teamTag" label="Тег *" error={form.errors.tag}>
              <input
                id="teamTag"
                maxLength={5}
                placeholder="KPI"
                value={data.tag}
                onChange={(e) => setData({ ...data, tag: e.target.value.toUpperCase() })}
                className={`${inputClass} uppercase`}
              />
            </Field>
          </div>
          <FormMessage message={form.message} />
          <button type="submit" disabled={form.busy || !verified} className={goldButton}>
            <Plus className="w-4 h-4" />
            <span>СТВОРИТИ СКЛАД</span>
          </button>
          {!verified && <p className="font-mono text-[11px] text-neutral-500">Доступно після підтвердження статусу студента.</p>}
        </form>
      </Panel>

      <Panel>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            // Приймаємо як код, так і повне посилання
            const clean = code.trim().split('/').pop() ?? '';
            const ok = await join.run(() => api.post(`/teams/join/${encodeURIComponent(clean)}`));
            if (ok) await refresh();
          }}
        >
          <SectionTitle>ПРИЄДНАТИСЯ ЗА КОДОМ</SectionTitle>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Капітан надіслав посилання або код? Встав його сюди. Або знайди команду на ринку й подай заявку.
          </p>
          <Field id="joinCode" label="Код або посилання">
            <input id="joinCode" value={code} onChange={(e) => setCode(e.target.value)} className={inputClass} />
          </Field>
          <FormMessage message={join.message} />
          <button type="submit" disabled={join.busy || !code || !verified} className={ghostButton}>
            ПРИЄДНАТИСЯ
          </button>
        </form>
      </Panel>
    </div>
  );
};

export const TeamTab: React.FC<{ joinCode: string | null; onJoinHandled: () => void; onGoToMarket: () => void }> = ({
  joinCode,
  onJoinHandled,
  onGoToMarket,
}) => {
  const { me, setMe, refresh } = useAuth();
  const act = useFormState();
  const [copied, setCopied] = useState(false);

  if (!me) return null;
  const { team, user } = me;
  const showJoin = joinCode && (!team || team.inviteCode !== joinCode);

  if (!team) {
    return (
      <div className="mt-10 space-y-8 animate-in fade-in duration-200 text-left">
        {showJoin && <JoinByCode code={joinCode} onDone={onJoinHandled} />}
        <CreateTeam />
        <SentInvites title="МОЇ ЗАЯВКИ В КОМАНДИ" />
      </div>
    );
  }

  const isCaptain = team.captainId === user.id;
  const editable = team.status === 'DRAFT' || team.status === 'REJECTED';
  const status = STATUS[team.status];
  const inviteLink = team.inviteCode ? `${window.location.origin}/#join/${team.inviteCode}` : null;
  const mainCount = team.members.filter((m) => m.slot === 'MAIN').length;
  const subCount = team.members.length - mainCount;
  const emptyMain = MAX_MAIN - mainCount;
  const emptySubs = MAX_SUBS - subCount;

  /** Дії над командою повертають оновлену команду або лише повідомлення */
  const teamAction = async (fn: () => Promise<{ team?: TeamItem; message?: string }>, success?: string, reload = false) => {
    const res = await act.run(fn, (r) => r.message ?? success ?? 'Готово.');
    if (!res) return;
    if (res.team && !reload) setMe({ ...me, team: res.team });
    else await refresh();
  };

  return (
    <div className="mt-10 space-y-8 animate-in fade-in duration-200 text-left">
      {showJoin && (
        <Notice>
          Ви вже у складі «{team.name}». Щоб прийняти інше запрошення, спочатку вийдіть з поточної команди.{' '}
          <button type="button" onClick={onJoinHandled} className="text-[#FFD700] underline">
            Закрити
          </button>
        </Notice>
      )}

      {/* Team banner */}
      <Panel accent className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={status.tone}>{status.label}</Badge>
            {team.group && <Badge>Група {team.group}</Badge>}
            {team.discordReady && <Badge>Discord-канал ✓</Badge>}
          </div>
          <h2 className="font-head text-4xl sm:text-6xl uppercase font-bold text-white tracking-tight leading-[0.92]">
            <span className="text-[#FFD700]">[{team.tag}]</span> {team.name}
          </h2>
          <p className="font-mono text-xs text-neutral-400">
            {team.university?.name} · {status.hint}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {isCaptain && editable && (
            <button
              type="button"
              disabled={act.busy}
              onClick={() => teamAction(() => api.post(`/teams/${team.id}/submit`))}
              className={mainCount >= MAX_MAIN ? goldButton : ghostButton}
            >
              <Send className="w-4 h-4" />
              <span>ПОДАТИ ЗАЯВКУ</span>
            </button>
          )}
          {isCaptain && team.status === 'PENDING' && (
            <button type="button" disabled={act.busy} onClick={() => teamAction(() => api.post(`/teams/${team.id}/withdraw`))} className={ghostButton}>
              <Undo2 className="w-4 h-4" />
              <span>ВІДКЛИКАТИ</span>
            </button>
          )}
          {isCaptain && editable && emptyMain + emptySubs > 0 && (
            <button type="button" onClick={onGoToMarket} className={ghostButton}>
              <Users className="w-4 h-4" />
              <span>РИНОК</span>
            </button>
          )}
        </div>
      </Panel>

      <FormMessage message={act.message} />

      {/* Invite link */}
      {isCaptain && editable && inviteLink && (
        <div className="bg-[#090909] border border-neutral-850 px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <span className={`${labelClass} shrink-0`}>Посилання-запрошення</span>
          <code className="flex-1 min-w-0 font-mono text-xs sm:text-sm text-[#FFD700] truncate">{inviteLink}</code>
          <div className="flex gap-4 shrink-0 font-mono text-[11px] uppercase tracking-wider">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(inviteLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-[#FFD700]"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Скопійовано' : 'Копіювати'}
            </button>
            <button
              type="button"
              title="Старе посилання перестане працювати"
              onClick={() => teamAction(() => api.post(`/teams/${team.id}/regenerate-code`), 'Нове посилання створено.')}
              className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-[#FFD700]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Нове
            </button>
          </div>
        </div>
      )}

      {/* Roster Slots Table */}
      <div className="bg-[#090909] border border-neutral-850 overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-neutral-850 bg-[#0e0e0e] text-neutral-500 uppercase tracking-widest text-[10px]">
              <th className="py-3.5 px-4">Слот</th>
              <th className="py-3.5 px-4">Нікнейм & Ім'я</th>
              <th className="py-3.5 px-4">Роль</th>
              <th className="py-3.5 px-4">FACEIT</th>
              <th className="py-3.5 px-4">Telegram</th>
              <th className="py-3.5 px-4">Верифікація</th>
              <th className="py-3.5 px-4 text-right">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-850">
            {team.members.map((m, idx) => (
              <tr key={m.player.id} className={`hover:bg-[#111] transition-colors ${m.slot === 'SUB' ? 'bg-[#080808]' : ''}`}>
                <td className={`py-3.5 px-4 ${m.isCaptain ? 'text-[#FFD700] font-bold' : 'text-neutral-400'}`}>
                  #{idx + 1} [{m.isCaptain ? 'CAPTAIN' : m.slot === 'SUB' ? 'ЗАПАС' : m.player.role ?? '—'}]
                </td>
                <td className="py-3.5 px-4 text-white font-bold">
                  {m.player.nickname} <span className="text-neutral-400 font-normal">({m.player.fullName})</span>
                </td>
                <td className="py-3.5 px-4 text-[#FFD700]">{m.player.roleLabel ?? '—'}</td>
                <td className="py-3.5 px-4">
                  Level {m.player.faceitLevel} · {m.player.faceitElo}
                </td>
                <td className="py-3.5 px-4">
                  {m.telegram ? (
                    <a href={`https://t.me/${m.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:text-[#FFD700]">
                      {m.telegram}
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td className={`py-3.5 px-4 ${m.player.verified ? 'text-emerald-400' : 'text-red-400'}`}>
                  {m.player.verified ? '✓ Підтверджено' : '✕ Не підтверджено'}
                </td>
                <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-3">
                  {isCaptain && editable && !m.isCaptain && (
                    <>
                      <button
                        type="button"
                        title="Передати капітанство"
                        onClick={() => teamAction(() => api.post(`/teams/${team.id}/captain`, { userId: m.player.id }), 'Капітанство передано.')}
                        className="text-neutral-400 hover:text-[#FFD700]"
                      >
                        <Crown className="w-4 h-4 inline" />
                      </button>
                      <button
                        type="button"
                        title="Видалити зі складу"
                        onClick={() => teamAction(() => api.del(`/teams/${team.id}/members/${m.player.id}`))}
                        className="text-neutral-400 hover:text-red-400"
                      >
                        <UserMinus className="w-4 h-4 inline" />
                      </button>
                    </>
                  )}
                  {!isCaptain && m.player.id === user.id && editable && (
                    <button
                      type="button"
                      onClick={() => teamAction(() => api.del(`/teams/${team.id}/members/${user.id}`), 'Ви вийшли з команди.', true)}
                      className="text-xs uppercase tracking-wider text-red-400 hover:underline"
                    >
                      Вийти
                    </button>
                  )}
                </td>
              </tr>
            ))}

            {Array.from({ length: Math.max(0, emptyMain + emptySubs) }).map((_, i) => (
              <tr key={`empty-${i}`} className="bg-[#0b0b0b]">
                <td className="py-3.5 px-4 text-neutral-600">
                  #{team.members.length + i + 1} [{i < emptyMain ? 'ВІЛЬНИЙ СЛОТ' : 'ЗАПАС'}]
                </td>
                <td className="py-3.5 px-4 text-neutral-500 italic" colSpan={5}>
                  Слот вільний{team.university ? ` · обов'язково ${team.university.name}` : ''}
                </td>
                <td className="py-3.5 px-4 text-right">
                  {isCaptain && editable && (
                    <button type="button" onClick={onGoToMarket} className="font-mono text-xs uppercase tracking-wider text-[#FFD700] hover:underline">
                      + ДОБРАТИ З РИНКУ
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isCaptain && <SentInvites title="НАДІСЛАНІ ЗАПРОШЕННЯ" />}

      {isCaptain && editable ? (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={act.busy}
            onClick={() => {
              if (!window.confirm(`Розформувати команду «${team.name}»? Цю дію не можна скасувати.`)) return;
              teamAction(() => api.del(`/teams/${team.id}`), undefined, true);
            }}
            className="font-mono text-[11px] uppercase tracking-wider text-neutral-600 hover:text-red-400 inline-flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Розформувати команду
          </button>
        </div>
      ) : (
        !editable && <Notice>Склад зафіксовано після подачі заявки. Для змін зверніться до організаторів ліги.</Notice>
      )}
    </div>
  );
};
