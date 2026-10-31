import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { faqItems } from '../data/siteConfig';

export const FaqSection: React.FC = () => {
  const [openIndices, setOpenIndices] = useState<number[]>([0]);

  const toggle = (index: number) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <section
      id="faq"
      className="relative z-10 py-32 lg:py-44 bg-[#050505]"
      aria-labelledby="faq-heading"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 text-left">
        {/* Section Header */}
        <div className="max-w-3xl space-y-3 pb-12">
          <h2
            id="faq-heading"
            className="font-head text-4xl sm:text-5xl lg:text-6xl font-bold uppercase text-white tracking-tight"
          >
            ВІДПОВІДІ НА ТИПОВІ ПИТАННЯ
          </h2>
          <p className="text-neutral-400 text-base sm:text-lg leading-relaxed">
            Все, що потрібно знати про правила участі, перевірку студентства, заміну гравців та
            організацію турніру.
          </p>
        </div>

        {/* Minimalist Borderless Accordion */}
        <div className="mt-8 space-y-3">
          {faqItems.map((item, idx) => {
            const isOpen = openIndices.includes(idx);
            return (
              <div
                key={item.question}
                className={`transition-colors duration-200 ${
                  isOpen ? 'bg-[#0c0c0c]' : 'bg-[#090909] hover:bg-[#0e0e0e]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-expanded={isOpen}
                  className="hover-target w-full py-6 sm:py-7 px-6 sm:px-8 flex items-center justify-between gap-4 text-left group"
                >
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6 flex-1">
                    <span className="font-head text-xl sm:text-2xl font-bold text-[#FFD700] shrink-0 select-none">
                      0{idx + 1}
                    </span>
                    <h3 className="font-head text-lg sm:text-xl uppercase text-white tracking-wide group-hover:text-[#FFD700] transition-colors">
                      {item.question}
                    </h3>
                  </div>

                  <div className="w-8 h-8 bg-[#141414] group-hover:bg-[#1a1a1a] flex items-center justify-center shrink-0 transition-colors ml-4">
                    {isOpen ? (
                      <Minus className="w-4 h-4 text-[#FFD700]" />
                    ) : (
                      <Plus className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 sm:px-8 pb-7 pt-1">
                    <div className="pl-6 sm:pl-8 border-l-2 border-[#FFD700]/50">
                      <p className="text-neutral-300 text-sm sm:text-base leading-relaxed pl-2">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
