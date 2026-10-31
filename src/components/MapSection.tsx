import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { UKRAINE_VIEWBOX, UKRAINE_PATH, HUB_COORDS } from '../data/ukraineMap';
import { trackCommunityClick } from '../lib/analytics';

interface MapSectionProps {
  onNavigateToUniversities?: () => void;
}

const CITY_NODES = [
  { key: 'kyiv', city: 'КИЇВ', coords: HUB_COORDS.kyiv, isHost: true },
  { key: 'kharkiv', city: 'ХАРКІВ', coords: HUB_COORDS.kharkiv },
  { key: 'lviv', city: 'ЛЬВІВ', coords: HUB_COORDS.lviv },
  { key: 'odesa', city: 'ОДЕСА', coords: HUB_COORDS.odesa },
  { key: 'dnipro', city: 'ДНІПРО', coords: HUB_COORDS.dnipro },
  { key: 'vinnytsia', city: 'ВІННИЦЯ', coords: HUB_COORDS.vinnytsia },
  { key: 'chernivtsi', city: 'ЧЕРНІВЦІ', coords: HUB_COORDS.chernivtsi },
  { key: 'zaporizhzhia', city: 'ЗАПОРІЖЖЯ', coords: HUB_COORDS.zaporizhzhia },
];

export const MapSection: React.FC<MapSectionProps> = () => {
  const [selectedCityKey, setSelectedCityKey] = useState<string | null>(null);

  const activeNode = CITY_NODES.find((n) => n.key === selectedCityKey);

  const kyiv = HUB_COORDS.kyiv;
  const lviv = HUB_COORDS.lviv;
  const kharkiv = HUB_COORDS.kharkiv;
  const odesa = HUB_COORDS.odesa;
  const dnipro = HUB_COORDS.dnipro;
  const vinnytsia = HUB_COORDS.vinnytsia;
  const chernivtsi = HUB_COORDS.chernivtsi;
  const zaporizhzhia = HUB_COORDS.zaporizhzhia;

  return (
    <section
      id="map"
      className="relative z-10 py-32 lg:py-44 bg-[#050505]"
      aria-labelledby="map-heading"
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12 text-left">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-neutral-800/60">
          <div>
            <h2
              id="map-heading"
              className="font-head text-4xl sm:text-5xl lg:text-7xl font-bold uppercase text-white tracking-tight leading-[0.92]"
            >
              ОДНА ЛІГА — <br />
              <span className="text-[#FFD700]">ВСЯ УКРАЇНА</span>
            </h2>
          </div>

          <div className="max-w-md">
            <p className="text-neutral-400 text-base sm:text-lg leading-relaxed">
              Провідні університети України змагатимуться в єдиній сітці за вихід на головну столичну LAN-сцену. Офіційний список учасників формується.
            </p>
          </div>
        </div>

        {/* Map Layout: Left Column = Universities Minimal Panel, Right Column = Transparent Vector Map */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Minimalist Universities Panel */}
          <div className="lg:col-span-5">
            {!selectedCityKey ? (
              /* State 1: No City Selected */
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="font-head text-6xl sm:text-7xl lg:text-8xl font-bold text-[#FFD700] tracking-tight leading-none">
                    СКОРО
                  </div>
                  <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
                    Список акредитованих закладів вищої освіти та підтверджених студентських ростерів буде опубліковано незабаром.
                  </p>
                </div>

                {/* Hint: Click city on map */}
                <div className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-wider text-neutral-400 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700]" />
                  <span>Клікніть на місто на карті</span>
                </div>

                {/* Button to community */}
                <div>
                  <a
                    href="#community"
                    onClick={() => trackCommunityClick('join_community', 'map_section')}
                    className="btn-gold hover-target text-xs tracking-[2px] px-6 py-4 inline-flex items-center justify-between w-full sm:w-auto gap-4"
                  >
                    <span>ПРИЄДНАТИСЯ ДО СПІЛЬНОТИ</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ) : (
              /* State 2: City Selected - Status Notice */
              <div className="space-y-4">
                {/* Header with City Name & Top Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-850">
                  <span className="font-head text-2xl uppercase font-bold text-white tracking-wide">
                    {activeNode?.city}
                  </span>

                  <button
                    type="button"
                    onClick={() => setSelectedCityKey(null)}
                    className="font-mono text-xs uppercase tracking-wider text-neutral-400 hover:text-[#FFD700] transition-colors shrink-0"
                  >
                    ← Всі міста
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="font-head text-5xl sm:text-6xl font-bold text-[#FFD700] tracking-tight leading-none">
                    СКОРО
                  </div>
                  <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
                    Студентські команди та заклади вищої освіти хабу {activeNode?.city} проходять попереднє формування. Повний перелік буде оприлюднено на старті реєстрації.
                  </p>
                </div>

                <div className="pt-2">
                  <a
                    href="#community"
                    onClick={() => trackCommunityClick('join_community', `map_city_${activeNode?.key || 'unknown'}`)}
                    className="btn-gold hover-target text-xs tracking-[2px] px-6 py-4 inline-flex items-center justify-between w-full sm:w-auto gap-4"
                  >
                    <span>ПРИЄДНАТИСЯ ДО СПІЛЬНОТИ</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Clean Transparent Vector Map */}
          <div className="lg:col-span-7 relative">
            <div className="relative w-full aspect-[1000/672] p-1 sm:p-2">
              <svg
                viewBox={UKRAINE_VIEWBOX}
                className="w-full h-full filter drop-shadow-[0_0_25px_rgba(255,215,0,0.08)] select-none"
                role="img"
                aria-label="Карта України з університетами"
              >
                {/* Transparent Ukraine Map Outline */}
                <path
                  d={UKRAINE_PATH}
                  fill="#080808"
                  fillOpacity="0.45"
                  stroke="#FFD700"
                  strokeWidth="1.6"
                  strokeOpacity="0.85"
                  strokeLinejoin="round"
                />

                {/* Connecting Lines to Kyiv LAN Arena */}
                <g stroke="#FFD700" strokeWidth="1.2" strokeDasharray="4 6" strokeOpacity="0.35">
                  <line x1={lviv.x} y1={lviv.y} x2={kyiv.x} y2={kyiv.y} />
                  <line x1={kharkiv.x} y1={kharkiv.y} x2={kyiv.x} y2={kyiv.y} />
                  <line x1={odesa.x} y1={odesa.y} x2={kyiv.x} y2={kyiv.y} />
                  <line x1={dnipro.x} y1={dnipro.y} x2={kyiv.x} y2={kyiv.y} />
                  <line x1={vinnytsia.x} y1={vinnytsia.y} x2={kyiv.x} y2={kyiv.y} />
                  <line x1={chernivtsi.x} y1={chernivtsi.y} x2={kyiv.x} y2={kyiv.y} />
                  <line x1={zaporizhzhia.x} y1={zaporizhzhia.y} x2={kyiv.x} y2={kyiv.y} />
                </g>

                {/* Regional City Nodes (Large Interactive Badges with Radar Animation) */}
                {CITY_NODES.map((node, idx) => {
                  const isSelected = selectedCityKey === node.key;
                  const isHost = node.isHost;

                  return (
                    <g
                      key={node.key}
                      className="cursor-pointer group"
                      onClick={() => setSelectedCityKey(isSelected ? null : node.key)}
                    >
                      {/* Native SVG Radar Pulsing Waves */}
                      <circle
                        cx={node.coords.x}
                        cy={node.coords.y}
                        r="14"
                        fill="none"
                        stroke="#FFD700"
                        strokeWidth={isSelected ? '2' : '1.2'}
                        opacity="0"
                      >
                        <animate
                          attributeName="r"
                          values="14;34"
                          dur={isSelected ? '1.5s' : '2.8s'}
                          repeatCount="indefinite"
                          begin={`${idx * 0.25}s`}
                        />
                        <animate
                          attributeName="opacity"
                          values={isSelected ? '0.9;0' : '0.6;0'}
                          dur={isSelected ? '1.5s' : '2.8s'}
                          repeatCount="indefinite"
                          begin={`${idx * 0.25}s`}
                        />
                      </circle>

                      {/* Second Wave for Active/Selected City */}
                      {isSelected && (
                        <circle
                          cx={node.coords.x}
                          cy={node.coords.y}
                          r="14"
                          fill="none"
                          stroke="#FFD700"
                          strokeWidth="1.5"
                          opacity="0"
                        >
                          <animate
                            attributeName="r"
                            values="14;44"
                            dur="1.5s"
                            repeatCount="indefinite"
                            begin="0.75s"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.7;0"
                            dur="1.5s"
                            repeatCount="indefinite"
                            begin="0.75s"
                          />
                        </circle>
                      )}

                      {/* Badge Outer Halo / Hover Glow */}
                      <circle
                        cx={node.coords.x}
                        cy={node.coords.y}
                        r={isSelected ? 15 : 12}
                        fill={isSelected ? '#1a1a1a' : '#0c0c0c'}
                        stroke={isSelected ? '#FFD700' : '#B8860B'}
                        strokeWidth={isSelected ? 2.5 : 1.8}
                        className="transition-all duration-300 group-hover:stroke-[#FFD700] group-hover:fill-[#1e1e1e]"
                      />

                      {/* Hub Center Dot instead of count */}
                      <circle
                        cx={node.coords.x}
                        cy={node.coords.y}
                        r={isSelected ? 4 : 3}
                        fill={isSelected ? '#FFD700' : '#FFFFFF'}
                        className="pointer-events-none"
                      />

                      {/* City Name Label Below Badge */}
                      <text
                        x={node.coords.x}
                        y={node.coords.y + 27}
                        textAnchor="middle"
                        fill={isSelected ? '#FFD700' : '#E5E5E5'}
                        fontSize={isHost ? 12 : 11}
                        fontFamily="Oswald, sans-serif"
                        fontWeight="700"
                        letterSpacing="1"
                        className="transition-colors group-hover:fill-[#FFD700] select-none"
                      >
                        {node.city}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
