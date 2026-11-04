import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { FormMessage, Notice, SectionTitle, Spinner, Stat, formatDate, goldButton, ghostButton, panelClass, useFormState } from '../../components/ui';
import type { MatchItem, TeamItem } from '../../types';
import { formatDetails, logLabel, type AdminLogItem } from './logLabels';

export type AdminTab = 'overview' | 'verifications' | 'teams' | 'matches' | 'users' | 'logs';

export interface Overview {
  users: number;
  verified: number;
  pendingCards: number;
  teams: Record<string, number>;
  matches: number;
}

interface Data {
  pendingTeams: TeamItem[];
  approvedTeams: TeamItem[];
  overdue: MatchItem[];
  logs: AdminLogItem[];
}

const AttentionRow: React.FC<{ count: number; label: string; onOpen: () => void }> = ({ count, label, onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    className="hover-target w-full flex items-center justify-between gap-4 py-3 border-b border-neutral-900 last:border-0 text-left group"
  >
    <span className="flex items-center gap-4">
      <span className={`font-head text-2xl font-bold w-10 ${count ? 'text-[#FFD700]' : 'text-neutral-600'}`}>{count}</span>
      <span className="font-mono text-xs uppercase tracking-wider text-neutral-300">{label}</span>
    </span>
    <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-[#FFD700]" />
  </button>
);

export const OverviewPanel: React.FC<{ overview: Overview | null; onOpen: (tab: AdminTab) => void; onChange: () => void }> = ({
  overview,
  onOpen,
  onChange,
}) => {
  const [data, setData] = useState<Data | null>(null);
  const act = useFormState();

  const load = useCallback(async () => {
    const [pending, approved, scheduled, logs] = await Promise.all([
      api.get<{ teams: TeamItem[] }>('/admin/teams?status=PENDING').catch(() => ({ teams: [] })),
      api.get<{ teams: TeamItem[] }>('/admin/teams?status=APPROVED').catch(() => ({ teams: [] })),
      api.get<{ matches: MatchItem[] }>('/matches?status=SCHEDULED&limit=200').catch(() => ({ matches: [] })),
      api.get<{ logs: AdminLogItem[] }>('/admin/logs').catch(() => ({ logs: [] })),
    ]);
    const now = Date.now();
    setData({
      pendingTeams: pending.teams,
      approvedTeams: approved.teams,
      overdue: scheduled.matches.filter((m) => m.scheduledAt && new Date(m.scheduledAt).getTime() < now),
      logs: logs.logs.slice(0, 10),
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (team: TeamItem, decision: 'APPROVE' | 'REJECT') => {
    const ok = await act.run(
      () => api.post(`/admin/teams/${team.id}/decision`, { decision }),
      decision === 'APPROVE' ? `«${team.name}» схвалено.` : `«${team.name}» відхилено.`
    );
    if (ok) {
      load();
      onChange();
    }
  };

  if (!overview || !data) return <Spinner />;
  const withoutGroup = data.approvedTeams.filter((t) => !t.group).length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Гравців" value={overview.users} hint={`Підтверджено: ${overview.verified}`} gold />
        <Stat label="Команд активно" value={overview.teams.APPROVED ?? 0} hint={`Чернеток: ${overview.teams.DRAFT ?? 0}`} />
        <Stat label="На перевірці" value={(overview.teams.PENDING ?? 0) + overview.pendingCards} hint="Команди + студентські" />
        <Stat label="Матчів" value={overview.matches} hint={`Прострочено: ${data.overdue.length}`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className={panelClass}>
          <SectionTitle>ПОТРЕБУЄ УВАГИ</SectionTitle>
          <AttentionRow count={overview.pendingCards} label="Студентських на перевірці" onOpen={() => onOpen('verifications')} />
          <AttentionRow count={data.pendingTeams.length} label="Команд чекають схвалення" onOpen={() => onOpen('teams')} />
          <AttentionRow count={withoutGroup} label="Схвалених команд без групи" onOpen={() => onOpen('teams')} />
          <AttentionRow count={data.overdue.length} label="Матчів без результату (дата минула)" onOpen={() => onOpen('matches')} />
        </div>

        <div className={panelClass}>
          <SectionTitle>
            <span className="flex items-center justify-between w-full gap-4">
              ОСТАННІ ДІЇ
              <button type="button" onClick={() => onOpen('logs')} className="font-mono text-[10px] tracking-[0.2em] text-[#FFD700] hover:underline">
                ЖУРНАЛ →
              </button>
            </span>
          </SectionTitle>
          {data.logs.length === 0 ? (
            <Notice>Дій ще не було.</Notice>
          ) : (
            <div className="divide-y divide-neutral-900">
              {data.logs.map((l) => (
                <div key={l.id} className="py-2.5 font-mono text-xs flex flex-wrap gap-x-3 gap-y-0.5">
                  <span className="text-neutral-600 w-32 shrink-0">{formatDate(l.createdAt)}</span>
                  <span className="text-[#FFD700]">{l.admin.faceitNickname}</span>
                  <span className="text-white">{logLabel(l.action)}</span>
                  <span className="text-neutral-500 truncate max-w-full">{formatDetails(l.details)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {data.pendingTeams.length > 0 && (
        <div className={panelClass}>
          <SectionTitle>КОМАНДИ НА СХВАЛЕННЯ</SectionTitle>
          <FormMessage message={act.message} />
          <div className="divide-y divide-neutral-900">
            {data.pendingTeams.map((t) => {
              const unverified = t.members.filter((m) => !m.player.verified).length;
              return (
                <div key={t.id} className="py-4 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <p className="font-head text-xl uppercase text-white">
                      <span className="text-[#FFD700]">[{t.tag}]</span> {t.name}
                    </p>
                    <p className="font-mono text-xs text-neutral-400">
                      {t.university?.name} · гравців: {t.members.length}
                      {unverified > 0 && <span className="text-red-400"> · непідтверджених: {unverified}</span>}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" disabled={act.busy} onClick={() => decide(t, 'APPROVE')} className={goldButton}>
                      СХВАЛИТИ
                    </button>
                    <button type="button" disabled={act.busy} onClick={() => decide(t, 'REJECT')} className={ghostButton}>
                      ВІДХИЛИТИ
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
