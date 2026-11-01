import React from 'react';
import { Mail } from 'lucide-react';
import { siteConfig } from '../data/siteConfig';
import { trackSubscribeClick } from '../lib/analytics';
import { getActiveCampaign } from '../data/campaigns';

interface FooterProps {
  onOpenModal?: () => void;
}

export const Footer: React.FC<FooterProps> = () => {
  const campaign = getActiveCampaign();
  return (
    <footer className="relative z-10 bg-[#030303] border-t border-neutral-900 pt-16 pb-12 text-left">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-neutral-900">
          {/* Brand Column */}
          <div className="lg:col-span-5 space-y-4">
            <div className="font-head text-2xl sm:text-3xl tracking-[2px] font-bold uppercase text-[#FFD700]">
              <span className="text-white">UNBREAKABLE</span> PHOENIX
            </div>
            <div className="font-mono text-xs uppercase tracking-[0.3em] text-[#B8860B]">
              {siteConfig.brand.slogan}
            </div>
            <p className="text-neutral-400 text-sm sm:text-base max-w-md leading-relaxed pt-1">
              {siteConfig.brand.league}
            </p>
            <div className="pt-2">
              <a
                href={campaign.inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackSubscribeClick(campaign.testKey, 'footer')}
                className="btn-gold hover-target text-xs tracking-[2px] px-6 py-2.5 inline-flex items-center uppercase font-head font-bold"
              >
                Підписатися на новини турніру
              </a>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="lg:col-span-3 space-y-3">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4">
              НАВІГАЦІЯ
            </div>
            <ul className="space-y-2.5 font-head text-sm sm:text-base uppercase tracking-wider">
              <li>
                <a
                  href="#format"
                  className="hover-target text-neutral-400 hover:text-[#FFD700] transition-colors"
                >
                  Формат змагань
                </a>
              </li>
              <li>
                <a
                  href="#map"
                  className="hover-target text-neutral-400 hover:text-[#FFD700] transition-colors"
                >
                  Карта учасників
                </a>
              </li>
              <li>
                <a
                  href="#prizes"
                  className="hover-target text-neutral-400 hover:text-[#FFD700] transition-colors"
                >
                  Призовий фонд
                </a>
              </li>
              <li>
                <a
                  href="#schedule"
                  className="hover-target text-neutral-400 hover:text-[#FFD700] transition-colors"
                >
                  Розклад сезону
                </a>
              </li>
              <li>
                <a
                  href="#/stages"
                  className="hover-target text-neutral-400 hover:text-[#FFD700] transition-colors"
                >
                  Сітка етапів та LAN
                </a>
              </li>
              <li>
                <a
                  href="#results"
                  className="hover-target text-neutral-400 hover:text-[#FFD700] transition-colors"
                >
                  Результати турніру
                </a>
              </li>
            </ul>
          </div>

          {/* Documents & Community Column */}
          <div className="lg:col-span-4 space-y-3">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-neutral-500 mb-4">
              ДОКУМЕНТИ & СПІЛЬНОТА
            </div>
            <ul className="space-y-2.5 font-head text-sm sm:text-base uppercase tracking-wider">
              <li>
                <a
                  href="#faq"
                  className="hover-target text-neutral-400 hover:text-[#FFD700] transition-colors"
                >
                  Часті запитання (FAQ)
                </a>
              </li>
              <li>
                <a
                  href={campaign.inviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackSubscribeClick(campaign.testKey, 'footer_telegram')}
                  className="hover-target text-neutral-400 hover:text-[#FFD700] transition-colors"
                >
                  Telegram канал
                </a>
              </li>
              <li className="pt-2">
                <a
                  href={`mailto:${siteConfig.contacts.email}`}
                  className="hover-target font-mono text-xs text-[#FFD700] hover:underline inline-flex items-center gap-1.5 lowercase"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{siteConfig.contacts.email}</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-500">
          <div>© 2026/27 UNBREAKABLE PHOENIX · СЕЗОН 01</div>
          <div className="uppercase">СТУДЕНТСЬКА КІБЕРСПОРТИВНА ЛІГА · УКРАЇНА</div>
        </div>
      </div>
    </footer>
  );
};
