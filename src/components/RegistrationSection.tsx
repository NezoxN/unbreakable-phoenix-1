import React from 'react';
import { ArrowRight, Users, UserCheck } from 'lucide-react';
import { trackCommunityClick } from '../lib/analytics';

export const RegistrationSection: React.FC = () => {
  return (
    <section
      id="registration"
      className="relative z-10 py-32 lg:py-44 bg-[#050505]"
      aria-labelledby="registration-heading"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 text-left">
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-14 items-end border-b border-neutral-900">
          <div className="lg:col-span-7">
            <h2
              id="registration-heading"
              className="font-head text-4xl sm:text-5xl lg:text-7xl font-bold uppercase text-white tracking-tight leading-[0.92]"
            >
              ОФІЦІЙНА РЕЄСТРАЦІЯ <br />
              <span className="text-[#FFD700]">У ЧЕМПІОНАТІ</span>
            </h2>
          </div>

          <div className="lg:col-span-5">
            <p className="text-neutral-400 text-base sm:text-lg leading-relaxed">
              Counter-Strike 2 Collegiate League. Обери свій шлях: участь разом зі сформованою університетською командою або соло як вільний агент. Приєднуйся до спільноти вже зараз!
            </p>
          </div>
        </div>

        {/* Clear Distinct Two-Path Separation Grid (Team vs Solo) */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* PATH 1: З КОМАНДОЮ */}
          <div className="bg-[#090909] border border-neutral-800 p-8 sm:p-12 flex flex-col justify-between relative group hover:border-[#FFD700]/60 transition-all">
            <span className="absolute top-0 left-0 right-0 h-1 bg-neutral-800 group-hover:bg-[#FFD700] transition-colors" />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-[#141414] border border-neutral-800 flex items-center justify-center text-[#FFD700]">
                  <Users className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                  ФОРМАТ 01 · СКЛАД ЗВО
                </span>
              </div>

              <div>
                <h3 className="font-head text-3xl sm:text-4xl uppercase text-white tracking-wide">
                  ЗІ СВОЄЮ КОМАНДОЮ
                </h3>
                <p className="text-neutral-400 text-base leading-relaxed mt-3">
                  Маєш готовий або формуєш студентський ростер свого університету? Збирай склад 5 основних гравців та 1–2 запасних, щоб першими подати заявку на відкритті реєстрації.
                </p>
              </div>

              <div className="space-y-3 pt-2 font-mono text-xs text-neutral-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] mt-1.5 shrink-0" />
                  <span>5 основних гравців + 1–2 запасних з одного ЗВО</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] mt-1.5 shrink-0" />
                  <span>Підтвердження студентського статусу</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] mt-1.5 shrink-0" />
                  <span>Офіційна ліцензія складу на онлайн-стадію</span>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-neutral-850">
              <a
                href="#community"
                onClick={() => trackCommunityClick('join_community', 'registration_team')}
                className="btn-gold hover-target w-full py-4 text-xs tracking-[2px] font-bold uppercase inline-flex items-center justify-center gap-2"
              >
                <span>ПРИЄДНАТИСЯ ДО СПІЛЬНОТИ</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* PATH 2: ОДИН (LFT) */}
          <div className="bg-[#090909] border border-neutral-800 p-8 sm:p-12 flex flex-col justify-between relative group hover:border-[#FFD700]/60 transition-all">
            <span className="absolute top-0 left-0 right-0 h-1 bg-neutral-800 group-hover:bg-[#FFD700] transition-colors" />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-[#141414] border border-neutral-800 flex items-center justify-center text-[#FFD700]">
                  <UserCheck className="w-6 h-6" />
                </div>
                <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
                  ФОРМАТ 02 · LFT БІРЖА
                </span>
              </div>

              <div>
                <h3 className="font-head text-3xl sm:text-4xl uppercase text-white tracking-wide">
                  ОДИН (ВІЛЬНИЙ АГЕНТ)
                </h3>
                <p className="text-neutral-400 text-base leading-relaxed mt-3">
                  Не маєш команди? Знаходь тімейтів та капітанів свого університету у нашому Discord та Telegram вже зараз, щоб сформувати сильний ростер до старту.
                </p>
              </div>

              <div className="space-y-3 pt-2 font-mono text-xs text-neutral-300">
                <div className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] mt-1.5 shrink-0" />
                  <span>Пошук команди та знайомство з гравцями ЗВО</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] mt-1.5 shrink-0" />
                  <span>Спільні тренування на FACEIT</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] mt-1.5 shrink-0" />
                  <span>Швидкий трансфер до складу при відкритті турніру</span>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-8 border-t border-neutral-850">
              <a
                href="#community"
                onClick={() => trackCommunityClick('join_community', 'registration_solo')}
                className="btn-gold hover-target w-full py-4 text-xs tracking-[2px] font-bold uppercase inline-flex items-center justify-center gap-2"
              >
                <span>ПРИЄДНАТИСЯ ДО СПІЛЬНОТИ</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RegistrationSection;

