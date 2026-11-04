import React, { useEffect, useState } from 'react';
import { api, qs } from '../lib/api';
import { Notice, Spinner, smallInputClass } from './ui';
import type { LeaderboardEntry } from '../types';

const SORTS = [
  { value: 'rating', label: 'PHX Rating' },
  { value: 'kd', label: 'K/D' },
  { value: 'adr', label: 'ADR' },
  { value: 'hs', label: 'HS %' },
  { value: 'kills', label: 'Вбивства' },
];

/** Топ гравців ліги за статистикою зіграних матчів */
export const Leaderboard: React.FC<{ limit?: number; highlightId?: string }> = ({ limit = 20, highlightId }) => {
  const [sort, setSort] = useState('rating');
  const [rows, setRows] = useState<LeaderboardEntry[] | null>(null);

  useEffect(() => {
    setRows(null);
    api
      .get<{ leaderboard: LeaderboardEntry[] }>(`/stats/leaderboard${qs({ sort, limit })}`)
      .then((d) => setRows(d.leaderboard))
      .catch(() => setRows([]));
  }, [sort, limit]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <select value={sort} onChange={(e) => setSort(e.target.value)} className={`${smallInputClass} w-auto`}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              Сортувати: {s.label}
            </option>
          ))}
        </select>
      </div>
      {rows === null ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Notice>Статистика з’явиться після перших зіграних матчів ліги.</Notice>
      ) : (
        <div className="bg-[#090909] border border-neutral-850 overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-neutral-850 bg-[#0e0e0e] text-neutral-500 uppercase tracking-widest text-[10px]">
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">Гравець</th>
                <th className="py-3.5 px-4">Команда</th>
                <th className="py-3.5 px-4 text-right">Карти</th>
                <th className="py-3.5 px-4 text-right">Вб / См</th>
                <th className="py-3.5 px-4 text-right">K/D</th>
                <th className="py-3.5 px-4 text-right">ADR</th>
                <th className="py-3.5 px-4 text-right">HS%</th>
                <th className="py-3.5 px-4 text-right text-[#FFD700]">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-850">
              {rows.map((r, idx) => (
                <tr key={r.player.id} className={`hover:bg-[#111] ${r.player.id === highlightId ? 'bg-[#141414]' : ''}`}>
                  <td className={`py-3 px-4 font-bold ${idx < 3 ? 'text-[#FFD700]' : 'text-neutral-500'}`}>{idx + 1}</td>
                  <td className="py-3 px-4 text-white font-bold">
                    {r.player.nickname}
                    <span className="text-neutral-500 font-normal"> · {r.player.university?.name}</span>
                  </td>
                  <td className="py-3 px-4 text-neutral-300">{r.team ? `[${r.team.tag}] ${r.team.name}` : '—'}</td>
                  <td className="py-3 px-4 text-right">{r.stats.maps}</td>
                  <td className="py-3 px-4 text-right text-neutral-400">
                    {r.stats.kills} / {r.stats.deaths}
                  </td>
                  <td className="py-3 px-4 text-right">{r.stats.kd.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right">{r.stats.adr.toFixed(1)}</td>
                  <td className="py-3 px-4 text-right">{r.stats.hsPercent}%</td>
                  <td className="py-3 px-4 text-right text-[#FFD700] font-bold">{r.stats.rating.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
