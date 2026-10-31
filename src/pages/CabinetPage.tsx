import React, { useState } from 'react';
import { Shield, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LoginPanel } from '../components/LoginPanel';
import { Badge, Notice, Spinner, UnderlineTabs, VERIFICATION_BADGE, VERIFICATION_LABELS, ghostButton } from '../components/ui';
import { ProfileTab } from './cabinet/ProfileTab';
import { MarketTab } from './cabinet/MarketTab';
import { TeamTab } from './cabinet/TeamTab';
import { StatsTab } from './cabinet/StatsTab';
import { InviteNotices } from './cabinet/InviteNotices';

interface CabinetPageProps {
  onBack: () => void;
  onNavigateToRegister: () => void;
  onNavigateToAdmin: () => void;
  joinCode: string | null;
}

type Tab = 'profile' | 'team' | 'market' | 'stats';
const TABS: { value: Tab; label: string }[] = [
  { value: 'profile', label: 'CS2 ПАСПОРТ & ПРОФІЛЬ' },
  { value: 'team', label: 'МОЯ КОМАНДА' },
  { value: 'market', label: 'РИНОК УЧАСНИКІВ' },
  { value: 'stats', label: 'МАТЧІ & ТОП ГРАВЦІВ' },
];

const JOIN_STORAGE_KEY = 'phx_join_code';

/** Параметри в hash: #/cabinet?tab=stats, #cabinet?discord=linked */
const hashParam = (name: string) => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get(name);

export const CabinetPage: React.FC<CabinetPageProps> = ({ onBack, onNavigateToRegister, onNavigateToAdmin, joinCode }) => {
  const { me, loading, logout } = useAuth();
  const [discordStatus] = useState(() => hashParam('discord'));
  const [pendingJoin, setPendingJoin] = useState<string | null>(() => {
    // Код запрошення переживає редірект на FACEIT
    if (joinCode) {
      sessionStorage.setItem(JOIN_STORAGE_KEY, joinCode);
      return joinCode;
    }
    return sessionStorage.getItem(JOIN_STORAGE_KEY);
  });
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const fromHash = hashParam('tab');
    const known = TABS.find((t) => t.value === fromHash);
    if (known) return known.value;
    return pendingJoin ? 'team' : 'profile';
  });

  const selectTab = (tab: Tab) => {
    setActiveTab(tab);
    // Вкладка в адресі: перезавантаження та посилання відкривають її ж (без події hashchange)
    window.history.replaceState(null, '', `#/cabinet?tab=${tab}`);
  };

  const clearJoin = () => {
    sessionStorage.removeItem(JOIN_STORAGE_KEY);
    setPendingJoin(null);
  };

  const handleLogout = async () => {
    await logout();
    onBack();
  };

  const user = me?.user;
  const team = me?.team;

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-28 pb-32">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 text-left">
        {loading ? (
          <Spinner />
        ) : !me || !user ? (
          <div className="max-w-xl mx-auto mt-8 bg-[#090909] border border-neutral-850 p-8 sm:p-10">
            <LoginPanel
              title="ВХІД У КАБІНЕТ"
              text={
                pendingJoin
                  ? 'Тебе запросили в команду. Увійди через FACEIT, щоб прийняти запрошення.'
                  : 'Увійди через FACEIT, щоб керувати командою, шукати тіммейтів і бачити свою статистику.'
              }
            />
            <p className="mt-6 pt-6 border-t border-neutral-900 text-center font-mono text-xs text-neutral-500">
              Ще не в лізі?{' '}
              <button type="button" onClick={onNavigateToRegister} className="text-[#FFD700] hover:underline uppercase">
                Реєстрація →
              </button>
            </p>
          </div>
        ) : (
          <>
            {/* Player identity block */}
            <div className="bg-[#090909] border border-neutral-850 border-l-4 border-l-[#FFD700] p-6 sm:p-10 flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-24 h-24 bg-[#141414] border border-neutral-800 flex flex-col items-center justify-center shrink-0 text-center relative overflow-hidden">
                {user.avatar && <img src={user.avatar} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />}
                <span className="relative font-head text-4xl font-bold text-[#FFD700] leading-none">{user.faceitLevel || '—'}</span>
                <span className="relative font-mono text-[9px] uppercase tracking-wider text-neutral-400 mt-1">FACEIT</span>
                {user.verified && <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-black" />}
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#FFD700] block">СТУДЕНТСЬКИЙ ОСОБИСТИЙ КАБІНЕТ</span>
                <h1 className="font-head text-3xl sm:text-5xl uppercase text-white font-bold tracking-wide truncate">{user.nickname}</h1>
                <p className="font-mono text-sm text-neutral-400 truncate">
                  {[user.fullName, user.university?.name, user.roleLabel].filter(Boolean).join(' · ') || 'Профіль не заповнено'}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge tone={VERIFICATION_BADGE[user.verificationStatus]}>{VERIFICATION_LABELS[user.verificationStatus].label}</Badge>
                  {team ? (
                    <Badge tone="gold">
                      [{team.tag}] {team.name}
                      {team.captainId === user.id ? ' · капітан' : ''}
                    </Badge>
                  ) : (
                    <Badge>Без команди</Badge>
                  )}
                  {user.discordLinked && <Badge>Discord @{user.discordUsername}</Badge>}
                </div>
              </div>

              <div className="flex flex-row md:flex-col gap-2 shrink-0">
                {user.isAdmin && (
                  <button type="button" onClick={onNavigateToAdmin} className={ghostButton}>
                    <Shield className="w-4 h-4" />
                    <span>АДМІН-ПАНЕЛЬ</span>
                  </button>
                )}
                <button type="button" onClick={handleLogout} className={ghostButton}>
                  <LogOut className="w-4 h-4" />
                  <span>ВИЙТИ</span>
                </button>
              </div>
            </div>

            {!user.profileComplete && (
              <div className="mt-6">
                <Notice>
                  Профіль гравця не заповнено.{' '}
                  <button type="button" onClick={() => selectTab('profile')} className="text-[#FFD700] underline">
                    Заповнити у вкладці профілю →
                  </button>
                </Notice>
              </div>
            )}

            {/* Запрошення в команду / заявки гравців — повідомленнями */}
            <InviteNotices />

            <div className="mt-8">
              <UnderlineTabs value={activeTab} options={TABS} onChange={selectTab} />
            </div>

            {activeTab === 'profile' && <ProfileTab discordStatus={discordStatus} />}
            {activeTab === 'team' && (
              <TeamTab joinCode={pendingJoin} onJoinHandled={clearJoin} onGoToMarket={() => selectTab('market')} />
            )}
            {activeTab === 'market' && <MarketTab />}
            {activeTab === 'stats' && <StatsTab />}
          </>
        )}
      </div>
    </div>
  );
};
