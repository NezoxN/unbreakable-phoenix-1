import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, ArrowRight, Loader2, User, Mail, GraduationCap, AtSign } from 'lucide-react';
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

  // Закриття по Escape та блокування скролу фонової сторінки
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

  // Скидання форми при кожному новому відкритті
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg bg-[#0A0A0A] border border-neutral-800 text-left my-auto shadow-2xl transition-all"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрити модальне вікно"
          className="absolute top-5 right-5 text-neutral-400 hover:text-white p-1.5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          /* Success Screen */
          <div className="p-8 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#121212] border border-neutral-800 flex items-center justify-center text-[#FFD700]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
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
                className="w-full py-3 font-mono text-xs uppercase tracking-wider text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Закрити вікно
              </button>
            </div>
          </div>
        ) : (
          /* Application Form Screen */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="border-b border-neutral-850 pb-3">
              <h3
                id="apply-modal-title"
                className="font-head text-2xl sm:text-3xl uppercase font-bold text-white tracking-wide"
              >
                ПОДАТИ ЗАЯВКУ
              </h3>
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

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gold hover-target w-full py-4 text-xs tracking-[2px] font-bold uppercase inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
