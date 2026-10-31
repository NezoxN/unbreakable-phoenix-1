import React from 'react';
import { steps, drawStats } from '../data/siteConfig';

export const StepsSection: React.FC = () => {
  return (
    <section
      id="format"
      className="relative z-10 py-32 lg:py-44 bg-[#050505]"
      aria-labelledby="steps-heading"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 text-left">
        {/* Section Header with Subtle Bottom Line */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12 items-end border-b border-neutral-800/60">
          <div className="lg:col-span-5">
            <h2
              id="steps-heading"
              className="font-head text-4xl sm:text-5xl lg:text-7xl font-bold uppercase text-white tracking-tight leading-[0.92]"
            >
              ТРИ КРОКИ ДО СЦЕНИ
            </h2>
          </div>
          <div className="lg:col-span-7">
            <p className="text-neutral-400 text-base sm:text-lg leading-relaxed max-w-2xl">
              Збери команду з однокурсників → потрап у групу через жеребкування за кошиками →
              зіграй LAN-фінал у Києві.
            </p>
          </div>
        </div>

        {/* Horizontal Progression with Minimalist Vertical Column Dividers */}
        <div className="mt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-800/80">
            {steps.map((step, idx) => (
              <div
                key={step.number}
                className={`space-y-4 py-8 md:py-0 ${idx === 0
                    ? 'md:pr-10 lg:pr-14'
                    : idx === 1
                      ? 'md:px-10 lg:px-14'
                      : 'md:pl-10 lg:pl-14'
                  }`}
              >
                <div>
                  <span className="w-16 h-16 bg-[#111] text-[#FFD700] font-head text-3xl font-bold flex items-center justify-center border border-neutral-800">
                    {step.number}
                  </span>
                </div>

                <h3 className="font-head text-2xl sm:text-3xl uppercase text-white tracking-wide">
                  {step.title}
                </h3>

                <p className="text-neutral-400 text-base leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Clean Horizontal Separator */}
        <div className="mt-24 pt-16 border-t border-neutral-800/80">
          {/* Fair Seeding Architectural Block */}
          <div className="bg-[#090909] border border-neutral-800/80 border-l-4 border-l-[#FFD700] p-8 sm:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Narrative */}
              <div className="lg:col-span-8 flex items-start gap-6 sm:gap-8">
                <span className="font-head text-7xl sm:text-8xl font-bold text-[#FFD700] leading-none select-none shrink-0">
                  3
                </span>
                <div>
                  <div className="font-mono text-xs uppercase tracking-widest text-[#FFD700] mb-1">
                    ПРИНЦИП ЗБАЛАНСОВАНОСТІ
                  </div>
                  <h3 className="font-head text-2xl sm:text-3xl uppercase text-white tracking-wide">
                    ЧЕСНЕ ЖЕРЕБКУВАННЯ ЗА КОШИКАМИ
                  </h3>
                  <p className="text-neutral-400 text-base leading-relaxed mt-2 max-w-2xl">
                    ЗВО ранжуються за кількістю зареєстрованих команд і діляться на три кошики.
                    Рандомайзер ставить по одному університету з кожного кошика в кожну групу, тому
                    групи збалансовані за активністю.
                  </p>
                </div>
              </div>

              {/* Right Quantitative Stats */}
              <div className="lg:col-span-4 grid grid-cols-3 gap-6 text-center divide-x divide-neutral-800/80">
                {drawStats.map((stat, sIdx) => (
                  <div key={stat.label} className={sIdx > 0 ? 'pl-4' : ''}>
                    <div className="font-head text-5xl sm:text-6xl font-bold text-[#FFD700] leading-none">
                      {stat.value}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 mt-2">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
