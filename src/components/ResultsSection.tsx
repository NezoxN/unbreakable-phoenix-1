import React from 'react';
import { ArrowRight } from 'lucide-react';
import { trackCommunityClick } from '../lib/analytics';

export const ResultsSection: React.FC = () => {
  return (
    <section
      id="results"
      className="relative z-10 py-32 lg:py-44 bg-[#050505] border-t border-neutral-850"
      aria-labelledby="results-heading"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 text-left">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-neutral-900">
          <div>
            <h2
              id="results-heading"
              className="font-head text-4xl sm:text-5xl lg:text-7xl font-bold uppercase text-white tracking-tight leading-[0.92]"
            >
              РЕЗУЛЬТАТИ <br />
              <span className="text-[#FFD700]">ТУРНІРУ</span>
            </h2>
          </div>

          <div className="max-w-xl">
            <p className="text-neutral-400 text-base sm:text-lg leading-relaxed">
              Сітка турніру, розклад матчів та результати серій оновлюватимуться в режимі реального часу після відкриття реєстрації та старту онлайн-стадії.
            </p>
          </div>
        </div>

        {/* Pure Minimalist Typography (No background block, no extra labels) */}
        <div className="pt-14 lg:pt-20 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
          <div className="space-y-4 max-w-2xl">
            <div className="font-head text-7xl sm:text-8xl lg:text-9xl font-bold text-[#FFD700] leading-none tracking-tight">
              СКОРО
            </div>
            <p className="font-sans text-base sm:text-lg text-neutral-400 leading-relaxed">
              Жеребкування та розклад перших матчів будуть опубліковані після завершення реєстрації. Усі рахунки серій та статистика транслюватимуться тут наживо на платформі FACEIT.
            </p>
          </div>

          <div className="shrink-0 self-start lg:self-center">
            <a
              href="#community"
              onClick={() => trackCommunityClick('join_community', 'results_section')}
              className="btn-gold hover-target inline-flex items-center gap-2.5 text-xs tracking-[2px] px-8 py-4"
            >
              <span>ПРИЄДНАТИСЯ ДО СПІЛЬНОТИ</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResultsSection;
