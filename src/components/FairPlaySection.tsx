import React, { useEffect, useRef } from 'react';
import { ShieldCheck, Clock, HeartHandshake } from 'lucide-react';
import { fairPlayRules } from '../data/siteConfig';
import { trackRulesReached } from '../lib/analytics';

export const FairPlaySection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            trackRulesReached();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.25 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getRuleIcon = (idx: number) => {
    switch (idx) {
      case 0:
        return <ShieldCheck className="w-5 h-5 text-[#FFD700]" />;
      case 1:
        return <Clock className="w-5 h-5 text-[#FFD700]" />;
      case 2:
        return <HeartHandshake className="w-5 h-5 text-[#FFD700]" />;
      default:
        return null;
    }
  };

  return (
    <section
      ref={sectionRef}
      id="rules"
      className="relative z-10 py-32 lg:py-44 bg-[#050505]"
      aria-labelledby="rules-heading"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Manifesto & Action */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <h2
              id="rules-heading"
              className="font-head text-4xl sm:text-5xl lg:text-7xl font-bold uppercase text-white tracking-tight leading-[0.92]"
            >
              ЧЕСНИЙ ТУРНІР — <br />
              <span className="text-[#FFD700]">СПРАВЖНІЙ ЧЕМПІОН</span>
            </h2>

            <p className="text-neutral-400 text-base sm:text-lg leading-relaxed pt-2">
              Правила гри, перевірка студентського статусу в ЄДЕБО, технічні таймінги та регламент
              поведінки зафіксовані в офіційному збірнику правил ліги.
            </p>


          </div>

          {/* Right Column: Sleek Directives List with Side Frame Accents */}
          <div className="lg:col-span-7 space-y-4">
            {fairPlayRules.map((rule, idx) => (
              <article
                key={rule.id}
                className="p-8 sm:p-10 flex items-start gap-6 bg-[#090909] hover:bg-[#0f0f0f] transition-colors border border-neutral-800/80 border-l-4 border-l-[#FFD700] group text-left relative"
              >
                {/* Index & Icon */}
                <div className="w-12 h-12 bg-[#141414] flex items-center justify-center shrink-0">
                  {getRuleIcon(idx)}
                </div>

                {/* Content */}
                <div className="space-y-2 flex-1">

                  <h3 className="font-head text-2xl uppercase text-white tracking-wide group-hover:text-[#FFD700] transition-colors">
                    {rule.title}
                  </h3>

                  <p className="text-neutral-400 text-base leading-relaxed pt-1">
                    {rule.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
