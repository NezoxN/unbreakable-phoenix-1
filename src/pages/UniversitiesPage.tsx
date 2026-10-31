import React, { useState, useMemo } from 'react';
import { Search, School, UserPlus, MapPin, ExternalLink } from 'lucide-react';
import { universities } from '../data/siteConfig';

interface UniversitiesPageProps {
  onBack: () => void;
  onOpenModal: () => void;
}

const CITIES = [
  'Всі міста',
  'Київ',
  'Харків',
  'Львів',
  'Одеса',
  'Дніпро',
  'Вінниця',
  'Чернівці',
  'Запоріжжя',
  'Полтава',
  'Суми',
  'Ужгород',
];

export const UniversitiesPage: React.FC<UniversitiesPageProps> = ({ onOpenModal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('Всі міста');

  const filteredUnis = useMemo(() => {
    return universities.filter((uni) => {
      const matchesCity =
        selectedCity === 'Всі міста' || uni.city.toLowerCase() === selectedCity.toLowerCase();
      const matchesQuery =
        searchTerm.trim() === '' ||
        uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        uni.short.toLowerCase().includes(searchTerm.toLowerCase()) ||
        uni.team.toLowerCase().includes(searchTerm.toLowerCase()) ||
        uni.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
        uni.city.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCity && matchesQuery;
    });
  }, [selectedCity, searchTerm]);

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-32">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        {/* Compact Minimal Header */}
        <div className="py-8 sm:py-10 text-left">
          <h1 className="font-head text-3xl sm:text-5xl lg:text-6xl font-bold uppercase text-white tracking-tight leading-[0.95]">
            УНІВЕРСИТЕТИ <span className="text-[#FFD700]">ЛІГИ</span>
          </h1>

          <p className="text-neutral-400 text-sm sm:text-base max-w-2xl mt-2 leading-relaxed">
            24 акредитовані заклади вищої освіти України у боротьбі за кубок UNBREAKABLE PHOENIX 2026/27.
          </p>
        </div>

        {/* Search & City Filter Bar */}
        <div className="space-y-6 pb-10 text-left">
          {/* Search Input */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Пошук за назвою ЗВО, містом, абревіатурою (напр. КПІ, ХНУРЕ, Львів)..."
              className="w-full bg-[#090909] border border-neutral-800 focus:border-[#FFD700] text-white pl-12 pr-4 py-3.5 text-sm font-sans placeholder-neutral-500 outline-none transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-neutral-500 hover:text-white"
              >
                ОЧИСТИТИ
              </button>
            )}
          </div>

          {/* City Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {CITIES.map((city) => {
              const active = selectedCity === city;
              return (
                <button
                  key={city}
                  type="button"
                  onClick={() => setSelectedCity(city)}
                  className={`hover-target font-mono text-xs uppercase px-4 py-2 border transition-all ${
                    active
                      ? 'bg-[#FFD700] text-black font-bold border-[#FFD700]'
                      : 'bg-[#090909] text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-white'
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between pb-6 text-left border-b border-neutral-850">
          <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            ЗНАЙДЕНО: <strong className="text-[#FFD700]">{filteredUnis.length}</strong> ЗВО
          </span>
          <button
            type="button"
            onClick={onOpenModal}
            className="btn-gold hover-target text-xs tracking-[1.5px] px-5 py-2.5 inline-flex items-center gap-2"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>ЗАРЕЄСТРУВАТИ КОМАНДУ</span>
          </button>
        </div>

        {/* Universities Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {filteredUnis.map((uni) => (
            <article
              key={uni.number}
              className="bg-[#090909] hover:bg-[#0e0e0e] border border-neutral-850 hover:border-[#FFD700]/60 p-8 flex flex-col justify-between transition-all group relative"
            >
              <div>
                {/* Header: City Tag + Number */}
                <div className="flex items-center justify-between pb-4">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-[#FFD700]">
                    <MapPin className="w-3 h-3 text-[#FFD700]" />
                    {uni.city}
                  </span>
                  <span className="font-mono text-[11px] text-neutral-600 font-bold">
                    #{uni.number}
                  </span>
                </div>

                {/* Monogram Badge */}
                <div className="w-16 h-16 bg-[#121212] group-hover:bg-[#FFD700] flex items-center justify-center transition-colors my-2">
                  <span className="font-head text-2xl font-bold text-[#FFD700] group-hover:text-black tracking-wider transition-colors">
                    {uni.short}
                  </span>
                </div>

                {/* Full University Name */}
                <h3 className="font-head text-xl uppercase text-white tracking-wide mt-4 min-h-[56px] line-clamp-2 group-hover:text-[#FFD700] transition-colors leading-snug">
                  {uni.name}
                </h3>

                {/* Team Details */}
                <div className="mt-6 pt-4 border-t border-neutral-850 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-500 uppercase">Офіційний ростер:</span>
                    <span className="text-white font-bold tracking-wide">{uni.team}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-500 uppercase">Студентський домен:</span>
                    <span className="text-neutral-300">{uni.domain}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-6 border-t border-neutral-850">
                <button
                  type="button"
                  onClick={onOpenModal}
                  className="w-full py-2.5 px-4 bg-[#141414] hover:bg-[#FFD700] text-neutral-300 hover:text-black font-head font-bold text-xs uppercase tracking-[1.5px] transition-colors inline-flex items-center justify-center gap-2 group-hover:border group-hover:border-[#FFD700]/30"
                >
                  <span>ПОДАТИ ЗАЯВКУ ВІД ЗВО</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Empty Search State */}
        {filteredUnis.length === 0 && (
          <div className="py-20 text-center bg-[#080808] border border-neutral-850 mt-8">
            <School className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <h3 className="font-head text-2xl uppercase text-white">ЗВО НЕ ЗНАЙДЕНО</h3>
            <p className="text-neutral-400 text-sm mt-2 max-w-md mx-auto">
              За вашим запитом не знайдено акредитованого ЗВО. Ви можете зареєструвати склад під
              опцією «Інший ЗВО України».
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCity('Всі міста');
              }}
              className="mt-6 btn-gold text-xs tracking-[1.5px] px-6 py-3"
            >
              Скинути фільтри
            </button>
          </div>
        )}

        {/* Custom University Callout Banner */}
        <div className="mt-16 bg-[#0a0a0a] border border-neutral-850 p-8 sm:p-12 text-left relative overflow-hidden">
          <div className="max-w-2xl space-y-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[#FFD700]">
              НЕ ЗНАЙШОВ СВІЙ УНІВЕРСИТЕТ?
            </span>
            <h3 className="font-head text-2xl sm:text-3xl uppercase text-white">
              ВІДКРИТО ДЛЯ ВСІХ ЗАКЛАДІВ ВИЩОЇ ОСВІТИ УКРАЇНИ
            </h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Якщо твого університету немає у переліку топ-24, просто обери пункт{' '}
              <strong className="text-white">«Інший ЗВО України»</strong> під час заповнення анкети.
              При наявності повного студентського складу організатори додадуть твій ЗВО до
              офіційного жеребкування ліги.
            </p>
          </div>
          <div className="mt-6">
            <button
              type="button"
              onClick={onOpenModal}
              className="btn-gold hover-target text-xs tracking-[2px] px-8 py-4 inline-flex items-center gap-2"
            >
              <span>ЗАРЕЄСТРУВАТИ СВІЙ ЗВО</span>
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
