import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Leaderboard } from '../../components/Leaderboard';
import { MatchRow } from '../../components/MatchRow';
import { Notice, SectionTitle, Spinner, labelClass } from '../../components/ui';
import type { MatchItem } from '../../types';

export const StatsTab: React.FC = () => {
  const { me } = useAuth();
  const [matches, setMatches] = useState<MatchItem[] | null>(null);
  const [scope, setScope] = useState<'all' | 'mine'>('all');

  useEffect(() => {
    api
      .get<{ matches: MatchItem[] }>('/matches?limit=50')
      .then((d) => setMatches(d.matches))
      .catch(() => setMatches([]));
  }, []);

  const teamId = me?.team?.id;
  const shown = scope === 'mine' && teamId ? matches?.filter((m) => m.teamAId === teamId || m.teamBId === teamId) : matches;

  return (
    <div className="mt-10 space-y-12 animate-in fade-in duration-200 text-left">
      {/* Matches */}
      <section>
        <SectionTitle>
          <span className="flex items-center gap-4">
            РЕЗУЛЬТАТИ МАТЧІВ
            {teamId && (
              <span className="flex gap-3 font-mono text-[10px] tracking-[0.2em]">
                {(['all', 'mine'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setScope(v)}
                    className={scope === v ? 'text-[#FFD700]' : 'text-neutral-500 hover:text-white'}
                  >
                    {v === 'all' ? 'УСІ' : 'МОЯ КОМАНДА'}
                  </button>
                ))}
              </span>
            )}
          </span>
        </SectionTitle>
        {shown === null || shown === undefined ? (
          <Spinner />
        ) : shown.length === 0 ? (
          <Notice>Матчів ще немає. Розклад з’явиться після жеребкування.</Notice>
        ) : (
          <div className="space-y-2">
            {shown.map((m) => (
              <MatchRow key={m.id} match={m} highlightTeamId={teamId} bordered />
            ))}
          </div>
        )}
      </section>

      {/* Leaderboard */}
      <section>
        <SectionTitle>ТОП ГРАВЦІВ ЛІГИ</SectionTitle>
        <p className={`${labelClass} -mt-3 mb-4`}>PHX Rating = 0.5 · K/D + 0.5 · ADR / 75 (середній гравець ≈ 1.00)</p>
        <Leaderboard highlightId={me?.user.id} />
      </section>
    </div>
  );
};
