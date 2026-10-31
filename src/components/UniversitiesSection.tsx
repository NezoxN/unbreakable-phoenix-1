import React, { useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { universities } from '../data/siteConfig';

export const UniversitiesSection: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const distance = 360;
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  };

  return (
    <section
      id="universities"
      className="relative z-10 py-32 lg:py-44 bg-[#050505]"
      aria-labelledby="unis-heading"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-12 text-left">
          <div>
            <h2
              id="unis-heading"
              className="font-head text-4xl sm:text-5xl lg:text-7xl font-bold uppercase text-white tracking-tight leading-[0.92]"
            >
              ГРАЙ ЗА СВІЙ ЗВО
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg mt-3">
              16 провідних університетів України у боротьбі за кубок UNBREAKABLE PHOENIX.
            </p>
          </div>

          {/* Controls & Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="hover-target p-3 text-neutral-400 hover:text-white transition-colors bg-[#0a0a0a]"
                aria-label="Прокрутити вліво"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="hover-target p-3 text-neutral-400 hover:text-white transition-colors bg-[#0a0a0a]"
                aria-label="Прокрутити вправо"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <a
              href="#registration"
              className="btn-gold hover-target text-xs tracking-[2px] px-7 py-3.5 inline-flex items-center gap-2"
            >
              <span>ЗАРЕЄСТРУВАТИ ЗВО</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Minimalist Universities Track: ONLY LOGO & NAME */}
        <div
          ref={scrollRef}
          className="mt-8 flex gap-6 overflow-x-auto pb-6 select-none scroll-smooth scrollbar-none"
        >
          {universities.map((uni) => (
            <article
              key={uni.number}
              className="relative min-w-[260px] sm:min-w-[300px] max-w-[300px] bg-[#090909] hover:bg-[#0f0f0f] p-8 flex flex-col justify-between transition-colors group shrink-0 text-left"
            >
              <div>
                {/* Logo / Monogram */}
                <div className="w-16 h-16 bg-[#141414] group-hover:bg-[#FFD700] flex items-center justify-center transition-colors">
                  <span className="font-head text-2xl font-bold text-[#FFD700] group-hover:text-black tracking-wider transition-colors">
                    {uni.short}
                  </span>
                </div>

                {/* University Name */}
                <h3 className="font-head text-xl uppercase text-white tracking-wide mt-6 line-clamp-2 min-h-[56px] group-hover:text-[#FFD700] transition-colors leading-snug">
                  {uni.name}
                </h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
