import React, { useState } from 'react';
import { Mail, Send, MessageSquare } from 'lucide-react';
import { siteConfig } from '../data/siteConfig';
import { trackCommunityClick } from '../lib/analytics';

export const CommunitySection: React.FC = () => {
  const [socialNotice, setSocialNotice] = useState<string | null>(null);

  const handleSocialClick = (platform: 'discord' | 'telegram', label: string) => {
    trackCommunityClick(platform, 'community_section');
    setSocialNotice(`Офіційний ${label} буде відкрито незабаром перед стартом реєстрації`);
    window.setTimeout(() => setSocialNotice(null), 3500);
  };

  return (
    <section
      id="community"
      className="relative z-10 py-32 lg:py-44 bg-[#050505]"
      aria-labelledby="community-heading"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="bg-[#090909] p-8 sm:p-12 lg:p-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center text-left">
            {/* Left Narrative */}
            <div className="lg:col-span-7 space-y-4">
              <h2
                id="community-heading"
                className="font-head text-3xl sm:text-4xl lg:text-5xl font-bold uppercase text-white tracking-tight leading-tight"
              >
                ПРИЄДНУЙСЯ ДО СПІЛЬНОТИ <br />
                <span className="text-[#FFD700]">ТА СТАВ ПИТАННЯ НАЖИВО</span>
              </h2>
              <p className="text-neutral-400 text-base sm:text-lg max-w-xl leading-relaxed">
                Шукаєш команду, маєш запитання до суддів або хочеш запропонувати співпрацю? Наша
                команда та модератори щодня на зв'язку у Discord та Telegram.
              </p>
            </div>

            {/* Right Action buttons */}
            <div className="lg:col-span-5 space-y-3 relative">
              <button
                type="button"
                onClick={() => handleSocialClick('discord', 'Discord сервер')}
                className="hover-target w-full bg-[#121212] hover:bg-[#181818] text-neutral-300 hover:text-white font-head text-xs uppercase tracking-[2px] py-4 px-6 flex items-center justify-center gap-3 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-neutral-400" />
                <span>СЕРВЕР DISCORD</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialClick('telegram', 'Telegram канал')}
                className="hover-target w-full bg-[#121212] hover:bg-[#181818] text-neutral-300 hover:text-white font-head text-xs uppercase tracking-[2px] py-4 px-6 flex items-center justify-center gap-3 transition-colors"
              >
                <Send className="w-4 h-4 text-neutral-400" />
                <span>КАНАЛ TELEGRAM</span>
              </button>

              <a
                href={`mailto:${siteConfig.contacts.email}`}
                onClick={() => trackCommunityClick('email', 'community_section')}
                className="hover-target w-full bg-[#121212] hover:bg-[#FFD700]/15 text-[#FFD700] font-mono text-xs uppercase tracking-wider py-4 px-6 flex items-center justify-center gap-2.5 transition-colors"
              >
                <Mail className="w-4 h-4 text-[#FFD700]" />
                <span className="truncate">{siteConfig.contacts.email}</span>
              </a>

              {socialNotice && (
                <div className="absolute -bottom-8 left-0 right-0 text-center text-xs font-mono text-[#FFD700] bg-[#111] py-1">
                  {socialNotice}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
