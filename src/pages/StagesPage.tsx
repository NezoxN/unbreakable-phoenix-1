import React from 'react';
import { Shuffle, Trophy } from 'lucide-react';
import { trackSubscribeClick } from '../lib/analytics';
import { getActiveCampaign } from '../data/campaigns';

interface StagesPageProps {
  onBack?: () => void;
  onOpenModal?: () => void;
}

const GROUPS = [
  { name: 'Група A', a: 'Університет A1', b: 'Університет B1', c: 'Університет C1' },
  { name: 'Група B', a: 'Університет A2', b: 'Університет B2', c: 'Університет C2' },
  { name: 'Група C', a: 'Університет A3', b: 'Університет B3', c: 'Університет C3' },
  { name: 'Група D', a: 'Університет A4', b: 'Університет B4', c: 'Університет C4' },
  { name: 'Група E', a: 'Університет A5', b: 'Університет B5', c: 'Університет C5' },
  { name: 'Група F', a: 'Університет A6', b: 'Університет B6', c: 'Університет C6' },
  { name: 'Група G', a: 'Університет A7', b: 'Університет B7', c: 'Університет C7' },
  { name: 'Група H', a: 'Університет A8', b: 'Університет B8', c: 'Університет C8' },
];

export const StagesPage: React.FC<StagesPageProps> = () => {
  const campaign = getActiveCampaign();
  return (
    <div className="min-h-screen bg-[#050505] text-white pt-28 pb-32">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 text-left">
        {/* Minimalist Page Header */}
        <div className="py-8 sm:py-10 border-b border-neutral-900">
          <h1 className="font-head text-3xl sm:text-5xl lg:text-6xl font-bold uppercase text-white tracking-tight leading-[0.95]">
            ТУРНІРНА СІТКА <span className="text-[#FFD700]">ТА ЕТАПИ</span>
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base max-w-2xl mt-2 leading-relaxed">
            Посів за 3 кошиками активності, онлайн-етап у 8 групах та сітка LAN-фіналу у Києві.
          </p>
        </div>

        {/* Content Flow */}
        <div className="mt-10 space-y-12">
          {/* 01: ВИЗНАЧЕННЯ КОШИКІВ */}
          <div className="space-y-6">
            <div className="flex items-baseline gap-3 pb-3 border-b border-neutral-900">
              <span className="font-mono text-sm text-[#FFD700] font-bold">01</span>
              <h2 className="font-head text-xl sm:text-2xl uppercase text-white tracking-wide">
                ВИЗНАЧЕННЯ КОШИКІВ ТА РАНДОМАЙЗЕР
              </h2>
              <span className="font-mono text-xs text-neutral-500 hidden sm:inline ml-auto">
                24 ЗВО сортуються за кількістю поданих команд
              </span>
            </div>

            {/* 3 Minimal Baskets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-[#090909] border border-neutral-850">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-head text-lg uppercase text-white font-bold">КОШИК A</span>
                  <span className="font-mono text-xs text-[#FFD700]">Місця 1–8</span>
                </div>
                <p className="font-sans text-xs text-neutral-400 leading-relaxed">
                  Університети з найбільшою кількістю зареєстрованих ростерів.
                </p>
              </div>

              <div className="p-5 bg-[#090909] border border-neutral-850">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-head text-lg uppercase text-white font-bold">КОШИК B</span>
                  <span className="font-mono text-xs text-[#C0C0C0]">Місця 9–16</span>
                </div>
                <p className="font-sans text-xs text-neutral-400 leading-relaxed">
                  Університети із середньою активністю студентських заявок.
                </p>
              </div>

              <div className="p-5 bg-[#090909] border border-neutral-850">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-head text-lg uppercase text-white font-bold">КОШИК C</span>
                  <span className="font-mono text-xs text-[#CD7F32]">Місця 17–24</span>
                </div>
                <p className="font-sans text-xs text-neutral-400 leading-relaxed">
                  Заклади освіти з 1–2 зареєстрованими командами.
                </p>
              </div>
            </div>

            {/* Minimal Randomizer Info Strip */}
            <div className="p-3 bg-[#0a0a0a] border border-neutral-850 text-neutral-400 font-mono text-xs flex items-center justify-center gap-2 text-center">
              <Shuffle className="w-4 h-4 text-[#FFD700] shrink-0" />
              <span>Рандомайзер жеребкування розподіляє по одному учаснику з кожного кошика в 8 груп</span>
            </div>
          </div>

          {/* 02: ФІНАЛЬНА СІТКА 8 ГРУП */}
          <div className="space-y-6">
            <div className="flex items-baseline gap-3 pb-3 border-b border-neutral-900">
              <span className="font-mono text-sm text-[#FFD700] font-bold">02</span>
              <h2 className="font-head text-xl sm:text-2xl uppercase text-white tracking-wide">
                ГРУПОВИЙ ЕТАП: 8 ГРУП
              </h2>
              <span className="font-mono text-xs text-neutral-500 hidden sm:inline ml-auto">
                Формат Round Robin · По 3 ЗВО у кожній групі
              </span>
            </div>

            {/* 8 Groups Clean Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {GROUPS.map((group) => (
                <div key={group.name} className="p-4 bg-[#090909] border border-neutral-850 space-y-2.5">
                  <div className="font-head text-sm uppercase text-white pb-1.5 border-b border-neutral-850 flex items-center justify-between">
                    <span>{group.name}</span>
                    <span className="font-mono text-[10px] text-neutral-500">3 ЗВО</span>
                  </div>

                  <div className="space-y-1 font-mono text-xs text-neutral-300">
                    <div className="flex items-center gap-2 py-1">
                      <span className="font-bold text-[#FFD700] w-3">A</span>
                      <span className="truncate">{group.a}</span>
                    </div>
                    <div className="flex items-center gap-2 py-1">
                      <span className="font-bold text-[#C0C0C0] w-3">B</span>
                      <span className="truncate">{group.b}</span>
                    </div>
                    <div className="flex items-center gap-2 py-1">
                      <span className="font-bold text-[#CD7F32] w-3">C</span>
                      <span className="truncate">{group.c}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 03: ОЧНИЙ LAN-ФІНАЛ У КИЄВІ */}
          <div className="space-y-6">
            <div className="flex items-baseline justify-between pb-3 border-b border-neutral-900">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-sm text-[#FFD700] font-bold">03</span>
                <h2 className="font-head text-xl sm:text-2xl uppercase text-white tracking-wide">
                  ОЧНИЙ LAN-ФІНАЛ У КИЄВІ
                </h2>
              </div>
              <span className="font-mono text-xs text-neutral-400 font-bold tracking-widest uppercase">
                СКОРО
              </span>
            </div>

            {/* Playoff Clean Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Semifinals */}
              <div className="space-y-3">
                <span className="font-mono text-xs uppercase tracking-wider text-neutral-500 block">
                  1/2 ФІНАЛУ (BO3)
                </span>

                <div className="p-4 bg-[#090909] border border-neutral-850 space-y-2">
                  <div className="flex items-center justify-between text-neutral-500 font-mono text-[11px]">
                    <span>ПІВФІНАЛ 01</span>
                    <span>Bo3</span>
                  </div>
                  <div className="font-sans text-xs text-neutral-300 space-y-1">
                    <div className="flex justify-between py-1 border-b border-neutral-850/60">
                      <span>1-й посів Швейцарки (3-0)</span>
                      <span className="font-mono text-neutral-500">—</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>4-й посів Швейцарки (3-2)</span>
                      <span className="font-mono text-neutral-500">—</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#090909] border border-neutral-850 space-y-2">
                  <div className="flex items-center justify-between text-neutral-500 font-mono text-[11px]">
                    <span>ПІВФІНАЛ 02</span>
                    <span>Bo3</span>
                  </div>
                  <div className="font-sans text-xs text-neutral-300 space-y-1">
                    <div className="flex justify-between py-1 border-b border-neutral-850/60">
                      <span>2-й посів Швейцарки (3-1)</span>
                      <span className="font-mono text-neutral-500">—</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>3-й посів Швейцарки (3-1)</span>
                      <span className="font-mono text-neutral-500">—</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medal Matches */}
              <div className="space-y-3">
                <span className="font-mono text-xs uppercase tracking-wider text-neutral-500 block">
                  ФІНАЛЬНИЙ ДЕНЬ
                </span>

                {/* 3rd place */}
                <div className="p-4 bg-[#090909] border border-neutral-850 space-y-2">
                  <div className="flex items-center justify-between text-neutral-500 font-mono text-[11px]">
                    <span className="text-[#CD7F32]">МАТЧ ЗА 3-ТЄ МІСЦЕ</span>
                    <span>Bo3</span>
                  </div>
                  <div className="font-sans text-xs text-neutral-300 space-y-1">
                    <div className="flex justify-between py-1 border-b border-neutral-850/60">
                      <span>Команда з 1/2 фіналу 1</span>
                      <span className="font-mono text-neutral-500">—</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Команда з 1/2 фіналу 2</span>
                      <span className="font-mono text-neutral-500">—</span>
                    </div>
                  </div>
                  <div className="pt-1 text-[11px] font-mono text-neutral-500">
                    Призові: 20 000 ₴ + девайси
                  </div>
                </div>

                {/* Grand Final */}
                <div className="p-4 bg-[#090909] border-t-2 border-t-[#FFD700] border-x border-b border-neutral-850 space-y-2">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-[#FFD700] font-bold flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>ГРАНД-ФІНАЛ ЧЕМПІОНАТУ</span>
                    </span>
                    <span className="text-[#FFD700]">Bo5</span>
                  </div>
                  <div className="font-sans text-xs text-white space-y-1">
                    <div className="flex justify-between py-1 border-b border-neutral-850/60">
                      <span>Переможець півфіналу 1</span>
                      <span className="font-mono text-[#FFD700]">—</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Переможець півфіналу 2</span>
                      <span className="font-mono text-[#FFD700]">—</span>
                    </div>
                  </div>
                  <div className="pt-1 text-[11px] font-mono text-[#FFD700]">
                    Чемпіон: 50 000 ₴ + Кубок Чемпіона
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Understated Bottom Signoff */}
          <div className="pt-8 border-t border-neutral-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs text-neutral-500">
            <span>Реєстрація команд відкриється незабаром</span>
            <a
              href={campaign.inviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackSubscribeClick(campaign.testKey, 'stages_page')}
              className="btn-gold hover-target text-xs tracking-[2px] px-6 py-2.5 self-start sm:self-auto font-head font-bold uppercase inline-flex items-center"
            >
              Підписатися на новини турніру
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
