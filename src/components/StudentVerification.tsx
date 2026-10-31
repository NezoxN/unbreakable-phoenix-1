import React, { useRef, useState } from 'react';
import { Mail, Upload, ShieldCheck, Clock } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { MeResponse } from '../types';
import { Field, FormMessage, Notice, ghostButton, goldButton, inputClass, useFormState } from './ui';

/** Підтвердження статусу студента: код на пошту ЗВО або фото студентського для ручної перевірки */
export const StudentVerification: React.FC = () => {
  const { me, setMe, universities } = useAuth();
  const [mode, setMode] = useState<'email' | 'card'>('email');
  const [email, setEmail] = useState(me?.user.studentEmail ?? '');
  const [code, setCode] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const send = useFormState();
  const confirm = useFormState();
  const upload = useFormState();

  if (!me) return null;
  const { user, studentCard } = me;
  const uni = universities.find((u) => u.id === user.universityId);
  const domains = uni?.emailDomains?.map((d) => '@' + d).join(', ');

  if (user.verificationStatus === 'VERIFIED') {
    return (
      <Notice tone="success">
        <ShieldCheck className="w-4 h-4 inline mr-1.5 -mt-0.5" />
        Статус студента підтверджено{user.studentEmail ? ` (${user.studentEmail})` : ' організаторами'}.
      </Notice>
    );
  }

  const codeSent = user.verificationStatus === 'EMAIL_SENT';

  return (
    <div className="space-y-5">
      {user.verificationStatus === 'PENDING_REVIEW' && (
        <Notice>
          <Clock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          Фото студентського на перевірці в організаторів. Ви отримаєте доступ до команд одразу після схвалення.
        </Notice>
      )}
      {user.verificationStatus === 'REJECTED' && (
        <Notice tone="error">
          Попередню заявку відхилено{studentCard?.comment ? `: ${studentCard.comment}` : '.'} Спробуйте ще раз.
        </Notice>
      )}

      <div className="flex border-b border-neutral-900">
        {(['email', 'card'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`hover-target pb-3 px-4 font-head text-sm uppercase tracking-wider border-b-2 transition-all ${
              mode === m ? 'border-[#FFD700] text-[#FFD700] font-bold' : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            {m === 'email' ? 'Пошта ЗВО' : 'Фото студентського'}
          </button>
        ))}
      </div>

      {mode === 'email' ? (
        <div className="space-y-4">
          <p className="text-neutral-400 text-sm leading-relaxed">
            Вкажіть корпоративну пошту свого ЗВО{domains ? ` (${domains})` : ''} — ми надішлемо 6-значний код.
          </p>
          <form
            className="flex flex-col sm:flex-row gap-3 sm:items-end"
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await send.run(
                () => api.post<{ message: string }>('/verification/email', { email }),
                (r) => r.message
              );
              if (res) setMe({ ...me, user: { ...user, verificationStatus: 'EMAIL_SENT', studentEmail: email } });
            }}
          >
            <div className="flex-1">
              <Field id="studentEmail" label="Студентська пошта *" error={send.errors.email}>
                <input
                  id="studentEmail"
                  type="email"
                  placeholder={uni?.emailDomains?.[0] ? `student@${uni.emailDomains[0]}` : 'student@university.edu.ua'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
            <button type="submit" disabled={send.busy || !email} className={codeSent ? ghostButton : goldButton}>
              <Mail className="w-4 h-4" />
              <span>{codeSent ? 'НАДІСЛАТИ ЩЕ РАЗ' : 'НАДІСЛАТИ КОД'}</span>
            </button>
          </form>
          <FormMessage message={send.message} />

          {codeSent && (
            <form
              className="flex flex-col sm:flex-row gap-3 sm:items-end pt-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const res = await confirm.run(() => api.post<MeResponse>('/verification/email/confirm', { code }));
                if (res) setMe(res);
              }}
            >
              <div className="flex-1">
                <Field id="emailCode" label="Код з листа *" error={confirm.errors.code}>
                  <input
                    id="emailCode"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    className={`${inputClass} font-mono tracking-[0.4em] text-lg`}
                  />
                </Field>
              </div>
              <button type="submit" disabled={confirm.busy || code.length !== 6} className={goldButton}>
                <ShieldCheck className="w-4 h-4" />
                <span>ПІДТВЕРДИТИ</span>
              </button>
            </form>
          )}
          <FormMessage message={confirm.message} />
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!file) return;
            const form = new FormData();
            form.append('card', file);
            const res = await upload.run(() => api.post<MeResponse & { message: string }>('/verification/card', form), (r) => r.message);
            if (res) {
              setMe(res);
              setFile(null);
              if (fileRef.current) fileRef.current.value = '';
            }
          }}
        >
          <p className="text-neutral-400 text-sm leading-relaxed">
            Немає корпоративної пошти? Завантажте фото дійсного студентського квитка (JPG, PNG, WEBP або PDF до 5 МБ).
            Файл бачать лише організатори, і він видаляється одразу після перевірки.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full font-mono text-xs text-neutral-400 file:mr-4 file:py-2.5 file:px-4 file:border file:border-neutral-800 file:bg-[#121212] file:text-[#FFD700] file:font-mono file:uppercase file:text-xs hover:file:border-[#FFD700]"
          />
          <button type="submit" disabled={upload.busy || !file} className={goldButton}>
            <Upload className="w-4 h-4" />
            <span>НАДІСЛАТИ НА ПЕРЕВІРКУ</span>
          </button>
          <FormMessage message={upload.message} />
        </form>
      )}
    </div>
  );
};
