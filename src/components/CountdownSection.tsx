import React from 'react';
import { ArrowRight } from 'lucide-react';
import { trackSubscribeClick } from '../lib/analytics';
import { getActiveCampaign } from '../data/campaigns';

interface CountdownSectionProps {
  onOpenModal?: () => void;
  onOpenApply?: (source?: string) => void;
}

const LEAGUE_SLOGANS = [
  'UNBREAKABLE PHOENIX',
  'UNIVERSITY ESPORTS',
  'COUNTER-STRIKE 2',
  'СЕЗОН 01',
  'СКОРО',
  'FROM ASHES TO GLORY',
];

export const CountdownSection: React.FC<CountdownSectionProps> = ({ onOpenApply }) => {
  const campaign = getActiveCampaign();

  return (
    <section
      id="countdown-section"
      className="relative z-10 pt-24 lg:pt-36 pb-0 bg-[#050505]"
      aria-labelledby="overview-heading"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 text-left">
        {/* Top Editorial Row */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-10">
          <div className="max-w-3xl space-y-4">
            <h2
              id="overview-heading"
              className="font-head text-4xl sm:text-5xl lg:text-7xl font-bold uppercase text-white tracking-tight leading-[0.92]"
            >
              НАВІТЬ ЗА 1000 КМ <br />
              <span className="text-[#FFD700]">ТВІЙ УНІВЕРСИТЕТ ПОРУЧ</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4 relative">
            <button
              id="subscribe"
              type="button"
              onClick={() => {
                trackSubscribeClick(campaign.testKey, 'countdown_banner');
                onOpenApply?.('countdown_banner');
              }}
              className="btn-gold hover-target inline-flex items-center gap-2.5 text-xs tracking-[2px] px-8 py-4 uppercase font-bold cursor-pointer"
            >
              <span>Подати заявку</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Massive Minimalist Announcement (No box lines, matching original design) */}
        <div className="py-12 lg:py-16">
          <div id="countdown" className="space-y-4">
            <div className="font-head text-7xl sm:text-8xl lg:text-9xl font-bold text-[#FFD700] leading-none tracking-tight">
              СКОРО
            </div>
            <p className="text-neutral-400 text-base sm:text-lg max-w-xl leading-relaxed">
              Офіційний старт прийому заявок від команд та вільних агентів буде оголошено найближчим часом.
            </p>
          </div>
        </div>
      </div>

      {/* Expanded Wide Golden Running Marquee Strip with League Slogans */}
      <div className="mt-14 bg-[#FFD700] text-[#050505] py-6 sm:py-7 overflow-hidden select-none border-y border-black/20 shadow-[0_0_30px_rgba(255,215,0,0.2)]">
        <div className="flex items-center gap-12 whitespace-nowrap animate-marquee font-head text-base sm:text-lg font-bold tracking-[3px] uppercase">
          {[...Array(6)].map((_, groupIdx) => (
            <React.Fragment key={groupIdx}>
              {LEAGUE_SLOGANS.map((slogan, i) => (
                <span key={`${groupIdx}-${i}`} className="inline-flex items-center gap-12">
                  <span className="text-black font-extrabold tracking-wider">{slogan}</span>
                  <span className="text-[#050505]/40 text-sm">◆</span>
                </span>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

