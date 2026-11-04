import React, { useCallback, useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { api } from '../../lib/api';
import { FormMessage, Notice, Spinner, formatDate, ghostButton, goldButton, smallInputClass, useFormState } from '../../components/ui';
import type { PublicPlayer } from '../../types';

interface CardItem {
  id: string;
  status: string;
  comment: string | null;
  createdAt: string;
  hasFile: boolean;
  mimeType: string;
  player: PublicPlayer & { telegram: string | null };
}

export const VerificationsPanel: React.FC<{ onChange: () => void }> = ({ onChange }) => {
  const [status, setStatus] = useState('PENDING');
  const [cards, setCards] = useState<CardItem[] | null>(null);
  const [comments, setComments] = useState<Record<string, string>>({});
  const act = useFormState();

  const load = useCallback(() => {
    setCards(null);
    api
      .get<{ cards: CardItem[] }>(`/admin/verifications?status=${status}`)
      .then((d) => setCards(d.cards))
      .catch(() => setCards([]));
  }, [status]);

  useEffect(load, [load]);

  const decide = async (id: string, decision: 'APPROVE' | 'REJECT') => {
    const ok = await act.run(
      () => api.post(`/admin/verifications/${id}`, { decision, comment: comments[id] || undefined }),
      decision === 'APPROVE' ? 'Студента підтверджено.' : 'Заявку відхилено.'
    );
    if (ok) {
      load();
      onChange();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-neutral-400 text-sm">
          Фото студентських квитків від гравців без корпоративної пошти. Після рішення файл видаляється з сервера.
        </p>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${smallInputClass} w-auto`}>
          <option value="PENDING">Очікують</option>
          <option value="APPROVED">Схвалені</option>
          <option value="REJECTED">Відхилені</option>
        </select>
      </div>
      <FormMessage message={act.message} />
      {cards === null ? (
        <Spinner />
      ) : cards.length === 0 ? (
        <Notice>Немає заявок у цьому статусі.</Notice>
      ) : (
        cards.map((c) => {
          const fileUrl = `/api/admin/verifications/${c.id}/file`;
          return (
            <div key={c.id} className="bg-[#090909] border border-neutral-850 p-6 flex flex-col lg:flex-row gap-6">
              {c.hasFile && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Відкрити на весь екран"
                  className="block w-full lg:w-72 h-48 bg-[#121212] border border-neutral-800 hover:border-[#FFD700] overflow-hidden shrink-0"
                >
                  {c.mimeType === 'application/pdf' ? (
                    <iframe src={fileUrl} title="Студентський квиток" className="w-full h-full pointer-events-none" />
                  ) : (
                    <img src={fileUrl} alt="Студентський квиток" className="w-full h-full object-contain" />
                  )}
                </a>
              )}
              <div className="flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-1 font-mono text-xs">
                  <p className="font-head text-xl uppercase text-white">
                    {c.player.nickname} <span className="text-neutral-400 normal-case">· {c.player.fullName}</span>
                  </p>
                  <p className="text-neutral-400">
                    {c.player.university?.name} · {c.player.telegram} · подано {formatDate(c.createdAt)}
                  </p>
                  <p className="text-neutral-500">
                    Звір: ПІБ і назву ЗВО на квитку, термін дії, фото.
                  </p>
                  {c.comment && <p className="text-neutral-500">Коментар: {c.comment}</p>}
                </div>
                {c.status === 'PENDING' && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      placeholder="Коментар (для відмови)"
                      value={comments[c.id] ?? ''}
                      onChange={(e) => setComments({ ...comments, [c.id]: e.target.value })}
                      className={smallInputClass}
                    />
                    <button type="button" disabled={act.busy} onClick={() => decide(c.id, 'APPROVE')} className={goldButton}>
                      <Check className="w-4 h-4" />
                      <span>ПІДТВЕРДИТИ</span>
                    </button>
                    <button type="button" disabled={act.busy} onClick={() => decide(c.id, 'REJECT')} className={ghostButton}>
                      <X className="w-4 h-4" />
                      <span>ВІДХИЛИТИ</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
