import React, { useState } from 'react';
import { LogIn, Wrench } from 'lucide-react';
import { api, startFaceitLogin } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { FormMessage, Notice, goldButton, inputClass, useFormState } from './ui';

/** Вхід через FACEIT (+ dev-вхід, якщо сервер запущено з DEV_LOGIN=true) */
export const LoginPanel: React.FC<{ title?: string; text?: string }> = ({
  title = 'УВІЙДИ ЧЕРЕЗ FACEIT',
  text = 'Акаунт ліги прив’язується до твого FACEIT — рівень та ELO підтягнуться автоматично, а матчі ліги зараховуватимуться у твою статистику.',
}) => {
  const { providers, offline, refresh } = useAuth();
  const [nickname, setNickname] = useState('');
  const dev = useFormState();

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h2 className="font-head text-2xl sm:text-3xl uppercase font-bold text-white tracking-wide">{title}</h2>
        <p className="text-neutral-400 text-sm max-w-md mx-auto leading-relaxed">{text}</p>
      </div>

      {offline && <Notice tone="error">BACKEND OFFLINE: сервер ліги недоступний. Спробуйте пізніше.</Notice>}

      <button
        type="button"
        onClick={startFaceitLogin}
        disabled={!providers.faceit}
        className={`${goldButton} w-full sm:w-auto px-10 py-4`}
      >
        <LogIn className="w-4 h-4" />
        <span>УВІЙТИ ЧЕРЕЗ FACEIT</span>
      </button>
      {!providers.faceit && !offline && (
        <p className="font-mono text-[11px] text-neutral-500">Вхід через FACEIT ще не налаштовано організаторами.</p>
      )}

      {providers.devLogin && (
        <form
          className="border border-dashed border-neutral-800 p-4 text-left space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await dev.run(() => api.post('/auth/dev-login', { nickname }));
            if (ok) await refresh();
          }}
        >
          <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" /> DEV-вхід без FACEIT (тільки локальна розробка)
          </p>
          <div className="flex gap-3">
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="нікнейм"
              className={inputClass}
            />
            <button type="submit" disabled={dev.busy || nickname.length < 3} className={goldButton}>
              OK
            </button>
          </div>
          <FormMessage message={dev.message} />
        </form>
      )}
    </div>
  );
};
