import React from 'react';
import { ArrowRight, Handshake } from 'lucide-react';
import { partnerSlots, mailto } from '../data/siteConfig';

export const PartnersSection: React.FC = () => {
  return (
    <section
      id="partners"
      className="relative z-10 py-32 lg:py-44 bg-[#050505]"
      aria-labelledby="partners-heading"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 text-left">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-12">
          <div>
            <h2
              id="partners-heading"
              className="font-head text-4xl sm:text-5xl lg:text-6xl font-bold uppercase text-white tracking-tight"
            >
              ПАРТНЕРИ ТА СПОНСОРИ
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg mt-3 max-w-2xl leading-relaxed">
              Компанії та бренди, які інвестують у розвиток молоді, девайси для чемпіонів та
              організацію якісного LAN-фіналу.
            </p>
          </div>

          <a
            href={mailto('Пропозиція партнерства / спонсорства UNBREAKABLE PHOENIX')}
            className="btn-gold hover-target text-xs tracking-[2px] px-8 py-4 inline-flex items-center gap-2.5 shrink-0 self-start sm:self-auto"
          >
            <span>СТАТИ ПАРТНЕРОМ ЛІГИ</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* 6 Partner Slots Grid */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {partnerSlots.map((slot, idx) => {
            const isNegotiating = slot.status === 'NEGOTIATION';
            return (
              <article
                key={slot.id}
                className="relative bg-[#090909] hover:bg-[#0e0e0e] p-8 flex flex-col justify-between min-h-[200px] transition-colors group text-left"
              >
                <div>
                  {/* Top: Slot index + Category */}
                  <div className="flex items-center justify-between pb-3">
                    <span className="font-mono text-xs text-neutral-500">0{idx + 1}</span>
                    <Handshake className="w-4 h-4 text-neutral-600 group-hover:text-[#FFD700] transition-colors" />
                  </div>

                  <h3 className="font-head text-lg uppercase text-white tracking-wide mt-2">
                    {slot.title}
                  </h3>
                </div>

                {/* Footer status */}
                <div className="pt-4 mt-6 flex items-center justify-between">
                  <span
                    className={`font-mono text-[11px] uppercase tracking-widest font-semibold ${
                      isNegotiating ? 'text-[#FFD700]' : 'text-neutral-500'
                    }`}
                  >
                    {isNegotiating ? 'ПЕРЕМОВИНИ' : 'СЛОТ ВІДКРИТО'}
                  </span>
                  <span className="font-mono text-[10px] text-neutral-600">СЕЗОН 2026/27</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
