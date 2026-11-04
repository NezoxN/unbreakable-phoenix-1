import React from 'react';
import { Loader2 } from 'lucide-react';
import { ApiError } from '../lib/api';
import type { CS2Role, VerificationStatus } from '../types';

/** Спільні елементи форм кабінету — ті самі класи, що й у попередніх формах сайту */

export const inputClass =
  'w-full bg-[#121212] border border-neutral-800 focus:border-[#FFD700] text-white px-4 py-3 text-sm outline-none transition-colors';
export const smallInputClass =
  'w-full bg-[#111] border border-neutral-800 focus:border-[#FFD700] text-white px-3 py-2.5 text-xs outline-none transition-colors';
export const panelClass = 'bg-[#090909] border border-neutral-850 p-6 sm:p-8 text-left';
/** Стара картка кабінету (ринок, списки) */
export const cardClass = 'bg-[#080808] border border-neutral-850 hover:border-neutral-700 transition-colors';
/** Мітка в стилі сайту: дрібний моноширинний капс */
export const labelClass = 'font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500';
export const goldButton =
  'btn-gold hover-target text-xs tracking-[1.5px] px-5 py-3 font-head font-bold uppercase inline-flex items-center justify-center gap-2 disabled:opacity-50';
export const ghostButton =
  'hover-target text-xs tracking-[1.5px] px-5 py-3 font-head uppercase border border-neutral-800 hover:border-[#FFD700] text-neutral-300 hover:text-[#FFD700] transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50';
export const outlineGoldSmall =
  'hover-target font-head text-xs uppercase tracking-[1.5px] px-3.5 py-1.5 font-bold transition-all duration-200 border border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black disabled:opacity-50';

export const ROLE_OPTIONS: { value: CS2Role; label: string }[] = [
  { value: 'RIFLER', label: 'Rifler (Штурмовик / Керрі)' },
  { value: 'AWP', label: 'Снайпер (AWP)' },
  { value: 'IGL', label: 'Капітан / Координатор (IGL)' },
  { value: 'ENTRY', label: 'Entry Fragger (Перший контакт)' },
  { value: 'SUPPORT', label: 'Support / Anchor (Опорник)' },
];

export const VERIFICATION_LABELS: Record<VerificationStatus, { label: string; tone: string }> = {
  NONE: { label: 'Не підтверджено', tone: 'text-neutral-400' },
  EMAIL_SENT: { label: 'Очікує код з пошти', tone: 'text-[#FFD700]' },
  PENDING_REVIEW: { label: 'Квиток на перевірці', tone: 'text-[#FFD700]' },
  VERIFIED: { label: '✓ Підтверджено', tone: 'text-emerald-400' },
  REJECTED: { label: 'Відхилено', tone: 'text-red-400' },
};

export const Field: React.FC<{ id: string; label: string; error?: string; children: React.ReactNode }> = ({
  id,
  label,
  error,
  children,
}) => (
  <div>
    <label htmlFor={id} className="block font-mono text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
      {label}
    </label>
    {children}
    {error && <p className="text-red-400 text-xs font-mono mt-1">{error}</p>}
  </div>
);

export const Notice: React.FC<{ tone?: 'error' | 'success' | 'info'; children: React.ReactNode }> = ({
  tone = 'info',
  children,
}) => {
  const tones = {
    error: 'border-red-500/40 text-red-300 bg-red-500/5',
    success: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/5',
    info: 'border-neutral-850 text-neutral-300 bg-[#090909]',
  };
  return <div className={`border px-4 py-3 font-mono text-xs leading-relaxed ${tones[tone]}`}>{children}</div>;
};

/** Блок кабінету; accent — золота смуга зліва, як у CS2-паспорта */
export const Panel: React.FC<{ accent?: boolean; className?: string; children: React.ReactNode }> = ({
  accent,
  className = '',
  children,
}) => (
  <div className={`${panelClass} ${accent ? 'border-l-4 border-l-[#FFD700]' : ''} ${className}`}>{children}</div>
);

export const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: string; gold?: boolean }> = ({
  label,
  value,
  hint,
  gold,
}) => (
  <div className="bg-[#090909] border border-neutral-850 p-6 text-left">
    <span className="font-mono text-xs uppercase tracking-wider text-neutral-500">{label}</span>
    <div className={`font-head text-4xl sm:text-5xl font-bold mt-2 ${gold ? 'text-[#FFD700]' : 'text-white'}`}>{value}</div>
    {hint && <span className="font-mono text-[11px] text-neutral-400 mt-1 block">{hint}</span>}
  </div>
);

/** Статус-бейдж, як у розкладі турніру */
export const Badge: React.FC<{ tone?: 'gold' | 'green' | 'red' | 'neutral'; children: React.ReactNode }> = ({
  tone = 'neutral',
  children,
}) => {
  const tones = {
    gold: 'bg-[#B8860B]/30 text-[#FFD700] font-semibold',
    green: 'bg-emerald-500/15 text-emerald-400 font-semibold',
    red: 'bg-red-600/90 text-white font-bold',
    neutral: 'bg-neutral-900 text-neutral-400',
  };
  return (
    <span className={`inline-block font-mono text-[10px] uppercase tracking-widest px-3 py-1 whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  );
};

export const VERIFICATION_BADGE: Record<VerificationStatus, 'gold' | 'green' | 'red' | 'neutral'> = {
  NONE: 'neutral',
  EMAIL_SENT: 'gold',
  PENDING_REVIEW: 'gold',
  VERIFIED: 'green',
  REJECTED: 'red',
};

/** Вкладки кабінету: підкреслення золотою лінією */
export function UnderlineTabs<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: React.ReactNode; badge?: number }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex border-b border-neutral-900 overflow-x-auto">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`hover-target pb-4 px-6 font-head text-base sm:text-lg uppercase tracking-wider transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
            o.value === value ? 'border-[#FFD700] text-[#FFD700] font-bold' : 'border-transparent text-neutral-400 hover:text-white'
          }`}
        >
          <span>{o.label}</span>
          {Boolean(o.badge) && (
            <span className="font-mono text-[10px] bg-[#FFD700] text-black px-1.5 py-0.5 font-bold">
              {o.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Перемикач-сегменти в стилі кабінету: рамка, активний — золотий фон */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: React.ReactNode; badge?: number }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex max-w-full overflow-x-auto border border-neutral-800">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`hover-target px-4 py-2.5 font-head text-xs uppercase tracking-[1.5px] whitespace-nowrap inline-flex items-center gap-1.5 transition-colors ${
              active ? 'bg-[#FFD700] text-black font-bold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {o.label}
            {Boolean(o.badge) && <span className="font-mono text-[10px] px-1.5 font-bold">{o.badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

export const Spinner: React.FC<{ label?: string }> = ({ label = 'ЗАВАНТАЖЕННЯ...' }) => (
  <div className="flex items-center gap-2 font-mono text-xs text-neutral-500 uppercase tracking-wider py-10 justify-center">
    <Loader2 className="w-4 h-4 animate-spin text-[#FFD700]" />
    <span>{label}</span>
  </div>
);

export const SectionTitle: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
  <div className="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-neutral-900">
    <h3 className="font-head text-xl sm:text-2xl uppercase text-white tracking-wide">{children}</h3>
    {icon}
  </div>
);

/** Стан форми: повідомлення сервера та помилки полів */
export function useFormState() {
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const run = async <T,>(fn: () => Promise<T>, successText?: string | ((r: T) => string)) => {
    setBusy(true);
    setMessage(null);
    setErrors({});
    try {
      const result = await fn();
      if (successText) {
        setMessage({ tone: 'success', text: typeof successText === 'function' ? successText(result) : successText });
      }
      return result;
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.errors);
        setMessage({ tone: 'error', text: err.message });
      } else {
        setMessage({ tone: 'error', text: 'Невідома помилка.' });
      }
      return undefined;
    } finally {
      setBusy(false);
    }
  };

  return { busy, message, errors, run, setMessage };
}

export const FormMessage: React.FC<{ message: { tone: 'error' | 'success'; text: string } | null }> = ({ message }) =>
  message ? <Notice tone={message.tone}>{message.text}</Notice> : null;

export const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const mapLabel = (name: string) => {
  const n = name.replace(/^de_/, '');
  return n === 'dust2' ? 'Dust II' : n.charAt(0).toUpperCase() + n.slice(1);
};
