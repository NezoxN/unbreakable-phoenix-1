import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api, qs } from '../../lib/api';
import { FormMessage, Spinner, VERIFICATION_LABELS, smallInputClass, useFormState } from '../../components/ui';
import type { PublicPlayer, VerificationStatus } from '../../types';

interface AdminUser extends PublicPlayer {
  faceitId: string;
  telegram: string | null;
  studentEmail: string | null;
  verificationStatus: VerificationStatus;
  discordUsername: string | null;
  isAdmin: boolean;
  team: { id: string; name: string } | null;
}

export const UsersPanel: React.FC<{ onChange: () => void }> = ({ onChange }) => {
  const [q, setQ] = useState('');
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [version, setVersion] = useState(0);
  const act = useFormState();

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get<{ users: AdminUser[] }>(`/admin/users${qs({ q })}`)
        .then((d) => setUsers(d.users))
        .catch(() => setUsers([]));
    }, 250);
    return () => clearTimeout(t);
  }, [q, version]);

  const update = async (id: string, body: Record<string, unknown>) => {
    const ok = await act.run(() => api.patch(`/admin/users/${id}`, body), 'Збережено.');
    if (ok) {
      setVersion((v) => v + 1);
      onChange();
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
        <input
          placeholder="Нікнейм, ім’я або пошта..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={`${smallInputClass} pl-10`}
        />
      </div>
      <FormMessage message={act.message} />
      {users === null ? (
        <Spinner />
      ) : (
        <div className="bg-[#090909] border border-neutral-850 overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-neutral-850 bg-[#0e0e0e] text-neutral-500 uppercase tracking-widest text-[10px]">
                <th className="py-3 px-4">Гравець</th>
                <th className="py-3 px-4">ЗВО</th>
                <th className="py-3 px-4">Контакти</th>
                <th className="py-3 px-4">Команда</th>
                <th className="py-3 px-4">Статус</th>
                <th className="py-3 px-4 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-850">
              {users.map((u) => {
                const v = VERIFICATION_LABELS[u.verificationStatus];
                return (
                  <tr key={u.id} className="hover:bg-[#111]">
                    <td className="py-3 px-4 text-white">
                      <strong>{u.nickname}</strong> {u.isAdmin && <span className="text-[#FFD700]">[ADMIN]</span>}
                      <div className="text-neutral-500">{u.fullName}</div>
                    </td>
                    <td className="py-3 px-4 text-neutral-300">{u.university?.name ?? '—'}</td>
                    <td className="py-3 px-4 text-neutral-400">
                      {u.studentEmail ?? '—'}
                      <div>
                        {u.telegram ?? ''} {u.discordUsername ? `· @${u.discordUsername}` : ''}
                      </div>
                    </td>
                    <td className="py-3 px-4">{u.team?.name ?? '—'}</td>
                    <td className={`py-3 px-4 ${v.tone}`}>{v.label}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-3 uppercase">
                      {u.verificationStatus !== 'VERIFIED' ? (
                        <button type="button" onClick={() => update(u.id, { verificationStatus: 'VERIFIED' })} className="text-emerald-400 hover:underline">
                          Підтвердити
                        </button>
                      ) : (
                        <button type="button" onClick={() => update(u.id, { verificationStatus: 'NONE' })} className="text-red-400 hover:underline">
                          Зняти статус
                        </button>
                      )}
                      <button type="button" onClick={() => update(u.id, { isAdmin: !u.isAdmin })} className="text-neutral-400 hover:text-[#FFD700]">
                        {u.isAdmin ? 'Зняти адміна' : 'Зробити адміном'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
