import React, { useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { FormMessage, formatDate, ghostButton, goldButton, useFormState } from '../../components/ui';
import type { InviteItem } from '../../types';

const VISIBLE = 3;

/** Повідомлення про запрошення/заявки, на які треба відповісти, — над вкладками кабінету */
export const InviteNotices: React.FC = () => {
  const { invites, refreshInvites, refresh } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const act = useFormState();

  const incoming = invites?.filter((i) => i.canRespond) ?? [];
  if (!incoming.length && !act.message) return null;

  const respond = async (invite: InviteItem, action: 'accept' | 'decline') => {
    const ok = await act.run(
      () => api.post<{ message?: string }>(`/invites/${invite.id}/${action}`),
      (r) => r.message ?? 'Запрошення відхилено.'
    );
    if (!ok) return;
    if (action === 'accept') await refresh();
    await refreshInvites();
  };

  const shown = expanded ? incoming : incoming.slice(0, VISIBLE);

  return (
    <div className="mt-6 space-y-3">
      <FormMessage message={act.message} />
      {shown.map((inv) => {
        const fromTeam = inv.direction === 'TEAM_TO_PLAYER';
        return (
          <div
            key={inv.id}
            className="bg-[#090909] border border-neutral-850 border-l-4 border-l-[#FFD700] p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4"
          >
            <div className="w-10 h-10 bg-[#141414] border border-neutral-800 flex items-center justify-center text-[#FFD700] shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm sm:text-base">
                {fromTeam ? (
                  <>
                    Команда <strong className="text-[#FFD700]">[{inv.team.tag}] {inv.team.name}</strong> запрошує тебе до складу
                  </>
                ) : (
                  <>
                    Гравець <strong className="text-[#FFD700]">{inv.player.nickname}</strong> ({inv.player.roleLabel}, LVL{' '}
                    {inv.player.faceitLevel}) подав заявку в <strong className="text-white">[{inv.team.tag}]</strong>
                  </>
                )}
              </p>
              <p className="font-mono text-[11px] text-neutral-500 mt-1">
                {formatDate(inv.createdAt)}
                {inv.message && <span className="text-neutral-300"> · «{inv.message}»</span>}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button type="button" disabled={act.busy} onClick={() => respond(inv, 'accept')} className={`${goldButton} py-2.5`}>
                <Check className="w-4 h-4" />
                <span>ПРИЙНЯТИ</span>
              </button>
              <button
                type="button"
                disabled={act.busy}
                onClick={() => respond(inv, 'decline')}
                className={`${ghostButton} py-2.5`}
                aria-label="Відхилити"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
      {incoming.length > VISIBLE && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="font-mono text-xs uppercase tracking-wider text-[#FFD700] hover:underline"
        >
          {expanded ? 'Згорнути' : `Ще ${incoming.length - VISIBLE}`}
        </button>
      )}
    </div>
  );
};

/** Надіслані запрошення (капітан) або власні заявки (гравець) — у вкладці «Команда» */
export const SentInvites: React.FC<{ title: string }> = ({ title }) => {
  const { invites, refreshInvites } = useAuth();
  const act = useFormState();
  const sent = invites?.filter((i) => i.canCancel) ?? [];
  if (!sent.length) return null;

  return (
    <div className="bg-[#090909] border border-neutral-850 p-6 sm:p-8 space-y-4">
      <h3 className="font-head text-xl uppercase text-white tracking-wide">
        {title} <span className="font-mono text-xs text-neutral-500">· {sent.length}</span>
      </h3>
      <FormMessage message={act.message} />
      <div className="divide-y divide-neutral-900">
        {sent.map((inv) => (
          <div key={inv.id} className="py-3 flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
            <span className="text-white">
              {inv.direction === 'TEAM_TO_PLAYER' ? (
                <>
                  {inv.player.nickname} <span className="text-neutral-500">· {inv.player.roleLabel} · LVL {inv.player.faceitLevel}</span>
                </>
              ) : (
                <>
                  [{inv.team.tag}] {inv.team.name}
                </>
              )}
            </span>
            <span className="flex items-center gap-4">
              <span className="text-neutral-500">{formatDate(inv.createdAt)}</span>
              <button
                type="button"
                disabled={act.busy}
                onClick={async () => {
                  const ok = await act.run(() => api.post(`/invites/${inv.id}/cancel`));
                  if (ok) await refreshInvites();
                }}
                className="uppercase tracking-wider text-neutral-400 hover:text-red-400"
              >
                Скасувати
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
