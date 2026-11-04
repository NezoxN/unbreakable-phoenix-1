import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, ArrowRight, Loader2, User, Mail, GraduationCap, AtSign, Tag } from 'lucide-react';
import { getActiveCampaign } from '../data/campaigns';
import { submitApplication, generateApplicationId } from '../lib/applicationService';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSource?: string;
}

const COURSE_OPTIONS = [
  '1 курс',
  '2 курс',
  '3 курс',
  '4 курс',
  '5 курс (магістратура)',
  '6 курс (магістратура)',
];

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  initialSource = 'modal',
}) => {
  const campaign = getActiveCampaign();
  const modalRef = useRef<HTMLDivElement | null>(null);

  const [name, setName] = useState('');
  const [course, setCourse] = useState('');
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedId, setSubmittedId] = useState<string>('');

  // Закриття по Escape та блокування скролу
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  // Скидання форми при повторному відкритті
  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Будь ласка, вкажіть ваше ім'я або ПІБ";
    }

    if (!course) {
      newErrors.course = 'Будь ласка, оберіть ваш курс';
    }

    if (!email.trim()) {
      newErrors.email = 'Будь ласка, вкажіть електронну пошту';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Введіть коректну адресу пошти';
    }

    const cleanTg = telegram.trim().replace(/^@/, '');
    if (!cleanTg) {
      newErrors.telegram = 'Вкажіть ваш Telegram username';
    } else if (cleanTg.length < 3) {
      newErrors.telegram = 'Telegram username надто короткий';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const generatedId = generateApplicationId();
    const formattedTelegram = telegram.trim().startsWith('@')
      ? telegram.trim()
      : `@${telegram.trim()}`;

    const result = await submitApplication({
      id: generatedId,
      name: name.trim(),
      course,
      email: email.trim().toLowerCase(),
      telegram: formattedTelegram,
      campaignId: campaign.testKey || 'direct',
      sourceLocation: initialSource,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSubmittedId(result.id);
      setIsSuccess(true);
    } else {
      setSubmitError(result.error || 'Помилка збереження. Спробуйте ще раз.');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-modal-title"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-[#0A0A0A] border border-[#FFD700]/30 shadow-[0_0_50px_rgba(255,215,0,0.15)] relative overflow-hidden text-left"
      >
        {/* Top Accent Strip */}
        <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#FFD700] to-transparent" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрити модальне вікно"
          className="absolute top-4 right-4 text-neutral-400 hover:text-[#FFD700] p-1.5 border border-transparent hover:border-neutral-800 transition-colors hover-target"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          /* Success Screen */
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FFD700]/10 border border-[#FFD700]/40 flex items-center justify-center text-[#FFD700] shadow-[0_0_25px_rgba(255,215,0,0.2)]">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <div className="font-mono text-xs uppercase tracking-[0.25em] text-[#FFD700]">
                UNBREAKABLE PHOENIX
              </div>
              <h3
                id="apply-modal-title"
                className="font-head text-3xl sm:text-4xl uppercase font-bold text-white tracking-wide"
              >
                ЗАЯВКУ ПРИЙНЯТО!
              </h3>
              <p className="text-neutral-400 text-sm leading-relaxed max-w-md mx-auto pt-1">
                Дякуємо! Твої дані успішно зафіксовані в офіційному реєстрі ліги.
              </p>
            </div>

            {/* Application ID Card */}
            <div className="bg-[#121212] border border-neutral-800 p-4 space-y-1.5">
              <div className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">
                Номер заявки
              </div>
              <div className="font-mono text-xl sm:text-2xl font-bold text-[#FFD700] tracking-widest">
                {submittedId}
              </div>
              <div className="font-mono text-[10px] text-neutral-400 flex items-center justify-center gap-1.5 pt-1">
                <Tag className="w-3 h-3 text-[#FFD700]" />
                <span>Джерело: <span className="text-white uppercase font-bold">{campaign.testKey}</span></span>
              </div>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Обов'язково перейдіть у наш Telegram-канал, щоб не пропустити старт жеребкування, регламент та новини сезону:
            </p>

            <div className="space-y-3 pt-2">
              <a
                href={campaign.inviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="btn-gold hover-target w-full py-4 text-xs tracking-[2px] font-bold uppercase inline-flex items-center justify-center gap-2"
              >
                <span>Перейти в Telegram-канал</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 font-mono text-xs uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
              >
                Закрити вікно
              </button>
            </div>
          </div>
        ) : (
          /* Application Form Screen */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#FFD700] font-bold">
                  UNBREAKABLE PHOENIX 2026
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500 bg-neutral-900 border border-neutral-800 px-2 py-0.5">
                  ID: {campaign.testKey}
                </span>
              </div>
              <h3
                id="apply-modal-title"
                className="font-head text-2xl sm:text-3xl uppercase font-bold text-white tracking-wide"
              >
                ПОДАТИ ЗАЯВКУ
              </h3>
              <p className="text-neutral-400 text-xs sm:text-sm">
                Заповніть форму учасника ліги. Організатори зв'яжуться з вами перед стартом.
              </p>
            </div>

            {submitError && (
              <div className="p-3 bg-red-950/40 border border-red-500/50 text-red-300 text-xs font-mono">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field: Name */}
              <div>
                <label
                  htmlFor="apply-name"
                  className="block font-mono text-[11px] uppercase tracking-wider text-neutral-300 mb-1.5 flex items-center gap-1.5"
                >
                  <User className="w-3.5 h-3.5 text-[#FFD700]" />
                  <span>Ім'я та Прізвище <span className="text-[#FFD700]">*</span></span>
                </label>
                <input
                  id="apply-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Олександр Петренко"
                  className={`w-full bg-[#121212] border ${
                    errors.name ? 'border-red-500' : 'border-neutral-800 focus:border-[#FFD700]'
                  } text-white px-3.5 py-2.5 text-sm outline-none transition-colors font-sans`}
                />
                {errors.name && (
                  <p className="text-red-400 text-[11px] font-mono mt-1">{errors.name}</p>
                )}
              </div>

              {/* Field: Course */}
              <div>
                <label
                  htmlFor="apply-course"
                  className="block font-mono text-[11px] uppercase tracking-wider text-neutral-300 mb-1.5 flex items-center gap-1.5"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-[#FFD700]" />
                  <span>Курс навчання <span className="text-[#FFD700]">*</span></span>
                </label>
                <div className="relative">
                  <select
                    id="apply-course"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className={`w-full bg-[#121212] border ${
                      errors.course ? 'border-red-500' : 'border-neutral-800 focus:border-[#FFD700]'
                    } text-white px-3.5 py-2.5 text-sm outline-none transition-colors font-sans cursor-pointer appearance-none`}
                  >
                    <option value="" disabled className="bg-[#121212] text-neutral-500">
                      — Оберіть курс навчання —
                    </option>
                    {COURSE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#121212] text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-400">
                    <span className="text-xs">▼</span>
                  </div>
                </div>
                {errors.course && (
                  <p className="text-red-400 text-[11px] font-mono mt-1">{errors.course}</p>
                )}
              </div>

              {/* Field: Email */}
              <div>
                <label
                  htmlFor="apply-email"
                  className="block font-mono text-[11px] uppercase tracking-wider text-neutral-300 mb-1.5 flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-[#FFD700]" />
                  <span>Електронна пошта <span className="text-[#FFD700]">*</span></span>
                </label>
                <input
                  id="apply-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.ua"
                  className={`w-full bg-[#121212] border ${
                    errors.email ? 'border-red-500' : 'border-neutral-800 focus:border-[#FFD700]'
                  } text-white px-3.5 py-2.5 text-sm outline-none transition-colors font-sans`}
                />
                {errors.email && (
                  <p className="text-red-400 text-[11px] font-mono mt-1">{errors.email}</p>
                )}
              </div>

              {/* Field: Telegram */}
              <div>
                <label
                  htmlFor="apply-telegram"
                  className="block font-mono text-[11px] uppercase tracking-wider text-neutral-300 mb-1.5 flex items-center gap-1.5"
                >
                  <AtSign className="w-3.5 h-3.5 text-[#FFD700]" />
                  <span>Telegram юзернейм <span className="text-[#FFD700]">*</span></span>
                </label>
                <input
                  id="apply-telegram"
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@username"
                  className={`w-full bg-[#121212] border ${
                    errors.telegram ? 'border-red-500' : 'border-neutral-800 focus:border-[#FFD700]'
                  } text-white px-3.5 py-2.5 text-sm outline-none transition-colors font-sans`}
                />
                {errors.telegram && (
                  <p className="text-red-400 text-[11px] font-mono mt-1">{errors.telegram}</p>
                )}
              </div>

              {/* Unique Identifier Info Card */}
              <div className="bg-[#121212] border border-neutral-850 px-3.5 py-2.5 flex items-center justify-between text-xs">
                <span className="font-mono text-neutral-400 flex items-center gap-1.5 text-[11px]">
                  <Tag className="w-3 h-3 text-[#FFD700]" />
                  <span>Унікальний ідентифікатор:</span>
                </span>
                <span className="font-mono font-bold text-[#FFD700] uppercase text-[11px] bg-black/60 px-2 py-0.5 border border-[#FFD700]/30">
                  {campaign.testKey}
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gold hover-target w-full py-4 text-xs tracking-[2px] font-bold uppercase inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Відправлення...</span>
                    </>
                  ) : (
                    <>
                      <span>Відправити заявку</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] font-mono text-neutral-500 text-center pt-1">
                Натискаючи «Відправити заявку», ви погоджуєтесь із правилами турніру.
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
