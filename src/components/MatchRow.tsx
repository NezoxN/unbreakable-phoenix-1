import React from 'react';
import { formatDate, mapLabel } from './ui';
import type { MatchItem } from '../types';

const STAGE_LABELS: Record<string, string> = { GROUPS: 'ГРУПИ', PLAYOFF: 'ПЛЕЙ-ОФ', FINAL: 'ФІНАЛ' };

/**
 * Рядок матчу в стилі сайту: стадія · команда A · рахунок · команда B · карти.
 * highlightTeamId — підсвічує рядки матчів «моєї» команди.
 */
export const MatchRow: React.FC<{
  match: MatchItem;
  highlightTeamId?: string;
  actions?: React.ReactNode;
  /** Рамка в стилі кабінету (на головній — без неї) */
  bordered?: boolean;
}> = ({ match: m, highlightTeamId, actions, bordered }) => {
  const finished = m.status === 'FINISHED';
  const aWon = finished && m.scoreA > m.scoreB;
  const bWon = finished && m.scoreB > m.scoreA;
  const mine = highlightTeamId && (m.teamAId === highlightTeamId || m.teamBId === highlightTeamId);

  const teamClass = (won: boolean) =>
    `font-head text-lg sm:text-2xl uppercase tracking-wide truncate ${!finished || won ? 'text-white' : 'text-neutral-500'}`;

  return (
    <div
      className={`relative bg-[#090909] hover:bg-[#0f0f0f] transition-colors ${bordered ? 'border border-neutral-850' : ''} px-4 sm:px-6 py-4 grid grid-cols-[1fr_auto_1fr] lg:grid-cols-[150px_1fr_auto_1fr_220px] items-center gap-x-4 sm:gap-x-6 gap-y-2`}
    >
      {mine && <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#FFD700]" />}

      <div className="col-span-3 lg:col-span-1 font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 leading-relaxed">
        <span className="text-[#FFD700]">
          {STAGE_LABELS[m.stage] ?? m.stage}
          {m.group ? ` · ${m.group}` : ''}
        </span>
        <span className="lg:block"> {m.scheduledAt ? formatDate(m.scheduledAt) : ''}</span>
      </div>

      <span className={`${teamClass(aWon)} text-right`}>{m.teamA.name}</span>

      <div className="bg-[#141414] min-w-[88px] sm:min-w-[104px] px-3 py-2 text-center font-head text-2xl sm:text-3xl font-bold leading-none">
        {finished ? (
          <>
            <span className={aWon ? 'text-[#FFD700]' : 'text-neutral-400'}>{m.scoreA}</span>
            <span className="text-neutral-600 mx-1.5">:</span>
            <span className={bWon ? 'text-[#FFD700]' : 'text-neutral-400'}>{m.scoreB}</span>
          </>
        ) : m.status === 'LIVE' ? (
          <span className="text-red-500 text-base tracking-[2px]">● LIVE</span>
        ) : (
          <span className="text-neutral-500 text-base tracking-[2px]">VS</span>
        )}
      </div>

      <span className={teamClass(bWon)}>{m.teamB.name}</span>

      <div className="col-span-3 lg:col-span-1 flex items-center justify-center lg:justify-end gap-3 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-neutral-500">
        <span>
          {m.maps.length ? m.maps.map((map) => `${mapLabel(map.mapName)} ${map.scoreA}–${map.scoreB}`).join(' · ') : `BO${m.bestOf}`}
        </span>
        {actions}
      </div>
    </div>
  );
};
