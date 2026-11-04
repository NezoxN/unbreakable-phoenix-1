import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { seasonStages } from '../data/siteConfig';

export const ScheduleSection: React.FC = () => {
  const [selectedStageId, setSelectedStageId] = useState<string>(seasonStages[0]?.id || 'stage-01');

  const selectedStage =
    seasonStages.find((s) => s.id === selectedStageId) || seasonStages[0];

  const getStatusBadge = (status: 'ACTIVE' | 'SOON' | 'PLANNED', label: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 bg-red-600/90 text-white font-bold">
            {label}
          </span>
        );
      case 'SOON':
        return (
          <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 bg-[#B8860B]/30 text-[#FFD700] font-semibold">
            {label}
          </span>
        );
      default:
        return (
          <span className="font-mono text-[10px] uppercase tracking-widest px-3 py-1 bg-neutral-900 text-neutral-400">
            {label}
          </span>
        );
    }
  };

  return (
    <section
      id="schedule"
      className="relative z-10 py-32 lg:py-44 bg-[#050505]"
      aria-labelledby="schedule-heading"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 text-left">
        {/* Section Header */}
        <div className="pb-12">
          <div className="max-w-2xl space-y-4">
            <h2
              id="schedule-heading"
              className="font-head text-4xl sm:text-5xl lg:text-7xl font-bold uppercase text-white tracking-tight leading-[0.92]"
            >
              РОЗКЛАД ТУРНІРУ
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg leading-relaxed pt-2">
              Чотири ключові етапи студентського чемпіонату: від кваліфікацій та жеребкування до очного LAN-фіналу.
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-10">
          {/* Horizontal Stage Progression Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {seasonStages.map((stage) => {
              const isSelected = stage?.id === selectedStage?.id;
              const hasStageLink = stage.number === '03' || stage.number === '04';

              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setSelectedStageId(stage.id)}
                  className={`hover-target p-6 sm:p-8 text-left transition-all group relative flex flex-col justify-between min-h-[185px] sm:min-h-[210px] h-full ${
                    isSelected
                      ? 'bg-[#141414]'
                      : 'bg-[#090909] hover:bg-[#0f0f0f]'
                  }`}
                >
                  <div>
                    {/* Active Top Gold Highlight */}
                    {isSelected && (
                      <span className="absolute top-0 left-0 right-0 h-1 bg-[#FFD700]" />
                    )}

                    <div className="mb-3">
                      {getStatusBadge(stage.status, stage.statusLabel)}
                    </div>

                    <div className="font-head text-base sm:text-lg uppercase text-white tracking-wide">
                      {stage.title}
                    </div>
                  </div>

                  {/* Stage Grid Action on 3rd & 4th tabs */}
                  {hasStageLink && (
                    <div className="mt-4 pt-3 border-t border-neutral-800">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.hash = '/stages';
                        }}
                        className="font-mono text-xs uppercase tracking-wider text-[#FFD700] hover:text-white inline-flex items-center gap-1 font-bold"
                      >
                        <span>СІТКА {stage.number === '03' ? 'ГРУП' : 'LAN-ФІНАЛУ'} →</span>
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Stage Detail: Split Layout (Specs Left + Full-bleed Photo Right) */}
          <div className="bg-[#090909] grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* Left Column: Details & Technical Specifications */}
            <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-between space-y-8">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  {getStatusBadge(selectedStage.status, selectedStage.statusLabel)}
                </div>

                <h3 className="font-head text-3xl sm:text-4xl lg:text-5xl uppercase text-white tracking-tight">
                  {selectedStage.title}
                </h3>

                <p className="text-neutral-300 text-base sm:text-lg leading-relaxed pt-2">
                  {selectedStage.description}
                </p>
              </div>

              {/* Technical Specifications */}
              <div className="pt-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {selectedStage.specs.map((spec) => (
                    <div key={spec.label} className="py-1">
                      <span className="text-neutral-500 uppercase block font-mono text-[11px] tracking-wider">
                        {spec.label}
                      </span>
                      <span className="text-white font-head uppercase text-lg sm:text-xl mt-1 block tracking-wide">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </div>

                {(selectedStage.number === '03' || selectedStage.number === '04') && (
                  <div className="mt-8 pt-6 border-t border-neutral-850">
                    <a
                      href="#/stages"
                      className="btn-gold hover-target text-xs tracking-[2px] px-6 py-3 inline-flex items-center gap-2"
                    >
                      <span>ПЕРЕГЛЯНУТИ СІТКУ {selectedStage.number === '03' ? 'КОШИКІВ ТА ГРУП' : 'LAN-ФІНАЛУ'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Grayscale Tournament Photo */}
            <div className="lg:col-span-5 relative min-h-[360px] lg:min-h-full overflow-hidden bg-[#050505]">
              <img
                src={selectedStage.image}
                alt={selectedStage.imageAlt}
                loading="lazy"
                className="w-full h-full object-cover grayscale contrast-125 brightness-75 hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-transparent to-transparent opacity-80" />

              {/* Bottom Photo Metadata */}
              <div className="absolute bottom-4 right-4 flex items-center pointer-events-none">
                <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 bg-black/85 px-2.5 py-1.5">
                  CS2 TOURNAMENT
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
