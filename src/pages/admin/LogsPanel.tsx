import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { Notice, Spinner, formatDate, smallInputClass } from '../../components/ui';
import { formatDetails, logLabel, type AdminLogItem } from './logLabels';

export const LogsPanel: React.FC = () => {
  const [logs, setLogs] = useState<AdminLogItem[] | null>(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    api
      .get<{ logs: AdminLogItem[] }>('/admin/logs')
      .then((d) => setLogs(d.logs))
      .catch(() => setLogs([]));
  }, []);

  // Групи дій за префіксом: verification, team, match, user
  const shown = useMemo(
    () => (filter === 'ALL' ? logs : logs?.filter((l) => l.action.startsWith(filter))),
    [logs, filter]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-neutral-400 text-sm">Останні 200 дій адміністраторів ліги.</p>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`${smallInputClass} w-auto`}>
          <option value="ALL">Усі дії</option>
          <option value="verification">Верифікація</option>
          <option value="team">Команди</option>
          <option value="match">Матчі</option>
          <option value="user">Гравці</option>
        </select>
      </div>
      {!shown ? (
        <Spinner />
      ) : shown.length === 0 ? (
        <Notice>Журнал порожній.</Notice>
      ) : (
        <div className="bg-[#090909] border border-neutral-850 overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-neutral-850 bg-[#0e0e0e] text-neutral-500 uppercase tracking-widest text-[10px]">
                <th className="py-3.5 px-4">Час</th>
                <th className="py-3.5 px-4">Адмін</th>
                <th className="py-3.5 px-4">Дія</th>
                <th className="py-3.5 px-4">Деталі</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-850">
              {shown.map((l) => (
                <tr key={l.id} className="hover:bg-[#111]">
                  <td className="py-3 px-4 text-neutral-500 whitespace-nowrap">{formatDate(l.createdAt)}</td>
                  <td className="py-3 px-4 text-[#FFD700]">{l.admin.faceitNickname}</td>
                  <td className="py-3 px-4 text-white">{logLabel(l.action)}</td>
                  <td className="py-3 px-4 text-neutral-400 break-all">{formatDetails(l.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
