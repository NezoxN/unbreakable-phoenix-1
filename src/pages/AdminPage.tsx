import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { LoginPanel } from '../components/LoginPanel';
import { Notice, Spinner, UnderlineTabs } from '../components/ui';
import { OverviewPanel, type AdminTab, type Overview } from './admin/OverviewPanel';
import { VerificationsPanel } from './admin/VerificationsPanel';
import { TeamsPanel } from './admin/TeamsPanel';
import { MatchesPanel } from './admin/MatchesPanel';
import { UsersPanel } from './admin/UsersPanel';
import { LogsPanel } from './admin/LogsPanel';

/** onBack лишається в пропсах для App; окремої кнопки «назад» на сторінці немає */
export const AdminPage: React.FC<{ onBack: () => void }> = () => {
  const { me, loading } = useAuth();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  const isAdmin = Boolean(me?.user.isAdmin);
  useEffect(() => {
    if (isAdmin) {
      api
        .get<Overview>('/admin/overview')
        .then(setOverview)
        .catch(() => undefined);
    }
  }, [isAdmin, version]);

  const tabs: { value: AdminTab; label: string; badge?: number }[] = [
    { value: 'overview', label: 'ОГЛЯД' },
    { value: 'verifications', label: 'ВЕРИФІКАЦІЯ', badge: overview?.pendingCards },
    { value: 'teams', label: 'КОМАНДИ', badge: overview?.teams.PENDING },
    { value: 'matches', label: 'МАТЧІ & РЕЗУЛЬТАТИ' },
    { value: 'users', label: 'ГРАВЦІ' },
    { value: 'logs', label: 'ЖУРНАЛ' },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-28 pb-32">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 text-left">
        <div className="pb-8 sm:pb-10 border-b border-neutral-900">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#FFD700] block mb-2">ОРГАНІЗАТОРАМ ЛІГИ</span>
          <h1 className="font-head text-4xl sm:text-6xl uppercase font-bold text-white tracking-tight leading-[0.92]">
            АДМІН-<span className="text-[#FFD700]">ПАНЕЛЬ</span>
          </h1>
          {me && (
            <p className="text-neutral-400 text-sm mt-3 font-mono">
              Ви увійшли як <span className="text-white">{me.user.nickname}</span>
            </p>
          )}
        </div>

        {loading ? (
          <Spinner />
        ) : !me ? (
          <div className="max-w-xl mx-auto mt-10 bg-[#090909] border border-neutral-850 p-8 sm:p-10">
            <LoginPanel title="ВХІД ДЛЯ ОРГАНІЗАТОРІВ" text="Увійдіть акаунтом з правами адміністратора ліги." />
          </div>
        ) : !isAdmin ? (
          <div className="mt-10">
            <Notice tone="error">Доступ лише для адміністраторів ліги.</Notice>
          </div>
        ) : (
          <>
            <div className="mt-8">
              <UnderlineTabs value={tab} options={tabs} onChange={setTab} />
            </div>
            <div className="mt-10">
              {tab === 'overview' && <OverviewPanel overview={overview} onOpen={setTab} onChange={bump} />}
              {tab === 'verifications' && <VerificationsPanel onChange={bump} />}
              {tab === 'teams' && <TeamsPanel onChange={bump} />}
              {tab === 'matches' && <MatchesPanel onChange={bump} />}
              {tab === 'users' && <UsersPanel onChange={bump} />}
              {tab === 'logs' && <LogsPanel />}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
