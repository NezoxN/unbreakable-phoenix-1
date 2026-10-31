import React, { useEffect, useState } from 'react';
import { CheckCircle2, Send, ShieldCheck, Flame, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { LoginPanel } from '../components/LoginPanel';
import { StudentVerification } from '../components/StudentVerification';
import { Field, FormMessage, ROLE_OPTIONS, Spinner, goldButton, inputClass, useFormState } from '../components/ui';
import type { CS2Role, MeResponse } from '../types';

interface RegistrationPageProps {
  onBack?: () => void;
  onNavigateToCabinet?: () => void;
}

const STEPS = ['FACEIT', 'ПРОФІЛЬ', 'СТАТУС СТУДЕНТА'];

export const RegistrationPage: React.FC<RegistrationPageProps> = ({ onNavigateToCabinet }) => {
  const { me, loading, universities, setMe } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    universityId: '',
    role: 'RIFLER' as CS2Role,
    telegram: '',
    consent: false,
  });
  const [consentError, setConsentError] = useState('');
  const form = useFormState();

  // Підставляємо вже збережені дані профілю
  useEffect(() => {
    if (!me) return;
    setFormData((prev) => ({
      ...prev,
      fullName: me.user.fullName ?? prev.fullName,
      universityId: me.user.universityId ?? prev.universityId,
      role: me.user.role ?? prev.role,
      telegram: me.user.telegram ?? prev.telegram,
    }));
  }, [me]);

  const step = !me ? 0 : !me.user.profileComplete ? 1 : me.user.verificationStatus !== 'VERIFIED' ? 2 : 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consent) {
      setConsentError('Необхідна згода на участь у турнірі та обробку даних.');
      return;
    }
    setConsentError('');
    const { consent: _consent, ...profile } = formData;
    const res = await form.run(() => api.patch<MeResponse>('/me', profile));
    if (res) setMe(res);
  };

  const handleGoToCabinet = () => {
    if (onNavigateToCabinet) {
      onNavigateToCabinet();
    } else {
      window.location.hash = '/cabinet';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoHome = () => {
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white py-16 sm:py-24 px-4 sm:px-6 flex flex-col justify-center">
      <div className="w-full max-w-2xl mx-auto text-left">
        {/* Brand / League Header */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#141414] border border-neutral-800 text-[#FFD700] font-mono text-xs uppercase tracking-[0.2em]">
            <Flame className="w-3.5 h-3.5" />
            <span>UNBREAKABLE PHOENIX · CS2</span>
          </div>
          <h1 className="font-head text-3xl sm:text-5xl font-bold uppercase text-white tracking-wide">
            РЕЄСТРАЦІЯ УЧАСНИКА
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Кожен гравець реєструється самостійно. Після підтвердження статусу студента в Кабінеті ти зможеш створити команду свого ЗВО або приєднатися до іншої.
          </p>
        </div>

        {/* Step indicator */}
        <div className="grid grid-cols-3 gap-2 mb-6 font-mono text-[11px] uppercase tracking-wider">
          {STEPS.map((label, idx) => (
            <div
              key={label}
              className={`border-t-2 pt-2 ${
                idx < step ? 'border-emerald-500 text-emerald-400' : idx === step ? 'border-[#FFD700] text-[#FFD700]' : 'border-neutral-800 text-neutral-600'
              }`}
            >
              {idx + 1}. {label}
            </div>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-[#090909] border border-neutral-850 p-6 sm:p-10 shadow-2xl relative">
          {loading ? (
            <Spinner />
          ) : step === 0 ? (
            <LoginPanel />
          ) : step === 3 ? (
            /* Success State */
            <div className="text-center space-y-6 py-6 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-[#141414] border border-[#FFD700] text-[#FFD700] rounded-full mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="font-head text-2xl sm:text-3xl uppercase font-bold text-white tracking-wide">
                  РЕЄСТРАЦІЮ УСПІШНО ЗАВЕРШЕНО
                </h2>
                <p className="text-neutral-400 text-sm max-w-md mx-auto leading-relaxed">
                  Твій профіль підтверджено. Тепер у Кабінеті можна створити команду, прийняти запрошення або розмістити анкету на ринку гравців.
                </p>
              </div>

              <div className="p-4 bg-[#111] border border-neutral-800 inline-block font-mono text-xs">
                <span className="text-neutral-500 uppercase block mb-1">FACEIT:</span>
                <span className="text-[#FFD700] text-base font-bold tracking-wider">
                  {me!.user.nickname} · LVL {me!.user.faceitLevel}
                </span>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={handleGoToCabinet}
                  className="btn-gold hover-target w-full sm:w-auto px-8 py-3.5 text-xs font-bold uppercase tracking-[2px] inline-flex items-center justify-center gap-2"
                >
                  <span>ПЕРЕЙТИ В КАБІНЕТ</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleGoHome}
                  className="w-full sm:w-auto px-6 py-3.5 text-xs font-mono uppercase tracking-wider text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 transition-colors"
                >
                  На головну
                </button>
              </div>
            </div>
          ) : step === 2 ? (
            <div className="space-y-6">
              <div>
                <h2 className="font-head text-2xl uppercase font-bold text-white tracking-wide">ПІДТВЕРДЖЕННЯ СТАТУСУ СТУДЕНТА</h2>
                <p className="text-neutral-400 text-sm mt-1">
                  {me!.user.university?.name} · <span className="text-[#FFD700]">{me!.user.nickname}</span>
                </p>
              </div>
              <StudentVerification />
              <button
                type="button"
                onClick={handleGoToCabinet}
                className="font-mono text-xs uppercase tracking-wider text-neutral-500 hover:text-[#FFD700]"
              >
                Пройти пізніше → у кабінет
              </button>
            </div>
          ) : (
            /* Profile form */
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="flex items-center justify-between p-4 bg-[#111] border border-neutral-800 font-mono text-xs">
                <span className="text-neutral-500 uppercase">Акаунт FACEIT</span>
                <span className="text-white">
                  <strong className="text-[#FFD700]">{me!.user.nickname}</strong> · LVL {me!.user.faceitLevel} · {me!.user.faceitElo} ELO
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="fullName" label="Ім’я та прізвище *" error={form.errors.fullName}>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Олександр Ткачук"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={inputClass}
                  />
                </Field>

                <Field id="telegram" label="Telegram (@username) *" error={form.errors.telegram}>
                  <input
                    id="telegram"
                    type="text"
                    placeholder="@username"
                    value={formData.telegram}
                    onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="university" label="Заклад вищої освіти (ЗВО) *" error={form.errors.universityId}>
                  <select
                    id="university"
                    value={formData.universityId}
                    onChange={(e) => setFormData({ ...formData, universityId: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">Оберіть свій ЗВО</option>
                    {universities.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.city.charAt(0)}
                        {u.city.slice(1).toLowerCase()})
                      </option>
                    ))}
                  </select>
                </Field>

                <Field id="role" label="Основна ігрова роль *" error={form.errors.role}>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as CS2Role })}
                    className={inputClass}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Consent Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.consent}
                    onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                    className="mt-1 accent-[#FFD700] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-neutral-400 leading-relaxed">
                    Підтверджую, що я є дійсним студентом зазначеного ЗВО України та погоджуюсь із{' '}
                    <a href="#/rules" className="text-[#FFD700] underline hover:text-white">
                      регламентом чемпіонату
                    </a>.
                  </span>
                </label>
                {consentError && <p className="text-red-400 text-xs font-mono mt-1 pl-7">{consentError}</p>}
              </div>

              <FormMessage message={form.message} />

              {/* Submit CTA */}
              <div className="pt-4 border-t border-neutral-850">
                <button type="submit" disabled={form.busy} className={`${goldButton} w-full py-4 tracking-[2px]`}>
                  <Send className="w-4 h-4" />
                  <span>{form.busy ? 'ЗБЕРЕЖЕННЯ...' : 'ЗБЕРЕГТИ ТА ПРОДОВЖИТИ'}</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 font-mono text-[11px] text-neutral-500 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FFD700]" />
                <span>Участь повністю безкоштовна · Офіційна студентська ліга</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
