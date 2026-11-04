import React from 'react';
import { prizeFund, prizePlaces } from '../data/siteConfig';

export const PrizesSection: React.FC = () => {
  return (
    <section
      id="prizes"
      className="relative z-10 py-32 lg:py-44 bg-[#050505]"
      aria-labelledby="prizes-heading"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 text-left">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-12">
          <div>
            <h2
              id="prizes-heading"
              className="font-head text-4xl sm:text-5xl lg:text-7xl font-bold uppercase text-white tracking-tight leading-[0.92]"
            >
              ГРАЄШ НЕ ЛИШЕ ЗА ЧЕСТЬ
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg mt-3 max-w-xl leading-relaxed">
              Девайси для кожного гравця топ-3 та грошовий призовий фонд 100 000 ₴.
            </p>
          </div>
        </div>

        {/* Top Fund + Survey Statistic (Spacious Open Layout) */}
        <div className="mt-8 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <span className="font-mono text-xs uppercase tracking-widest text-neutral-500 block mb-2">
              ЗАГАЛЬНИЙ ПРИЗОВИЙ ФОНД
            </span>
            <div className="font-head text-6xl sm:text-7xl lg:text-9xl font-bold text-[#FFD700] tracking-tight leading-none">
              {prizeFund.total}
            </div>
          </div>

          <div className="lg:col-span-7 flex items-center gap-8">
            <div className="font-head text-6xl sm:text-7xl lg:text-8xl font-bold text-white leading-none select-none shrink-0">
              {prizeFund.statValue}
            </div>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-md">
              {prizeFund.statText}
            </p>
          </div>
        </div>

        {/* 3 Podium Cards with 8px Solid Top Accent Bar (Gold, Silver, Bronze) & Monochrome Text */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {prizePlaces.map((item, idx) => {
            const isFirst = idx === 0;
            const isSecond = idx === 1;

            const topBarColor = isFirst
              ? 'bg-[#FFD700]'
              : isSecond
              ? 'bg-[#C0C0C0]'
              : 'bg-[#CD7F32]';

            return (
              <div
                key={item.place}
                className="overflow-hidden flex flex-col justify-between transition-colors bg-[#090909] hover:bg-[#0d0d0d] border border-neutral-850 relative"
              >
                {/* Thin 3px Elegant Metallic Line */}
                <div className={`w-full h-[3px] ${topBarColor} shrink-0`} />

                <div className="p-8 sm:p-10 flex flex-col justify-between flex-1">
                  <div>
                    <span className="font-head text-xl sm:text-2xl font-bold uppercase tracking-wider text-neutral-400 block leading-none">
                      {item.title}
                    </span>

                    <div className="font-head text-4xl sm:text-5xl lg:text-6xl font-bold text-white mt-3">
                      {item.amount}
                    </div>

                    {/* Devices list (Monochrome) */}
                    <div className="mt-8 space-y-2.5">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 block mb-2">
                        ПРИЗОВІ ДЕВАЙСИ:
                      </span>
                      {item.devices.map((device) => (
                        <div
                          key={device}
                          className="font-mono text-xs uppercase tracking-wide text-neutral-300 flex items-center gap-2"
                        >
                          <span className="text-neutral-500">•</span>
                          <span>{device}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-8 mt-8 font-mono text-[10px] uppercase tracking-wider text-neutral-500 border-t border-neutral-850/60">
                    {prizeFund.footnote}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
