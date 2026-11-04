import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api';
import type { ApiUniversity, InviteItem, MeResponse } from '../types';

interface Providers {
  faceit: boolean;
  devLogin: boolean;
  discord: boolean;
}

interface AuthState {
  me: MeResponse | null;
  loading: boolean;
  offline: boolean;
  providers: Providers;
  universities: ApiUniversity[];
  /** Активні запрошення/заявки (null — ще не завантажено) */
  invites: InviteItem[] | null;
  refreshInvites: () => Promise<void>;
  refresh: () => Promise<void>;
  /** Більшість мутацій повертає свіжий стан /me — оновлюємо без зайвого запиту */
  setMe: (me: MeResponse) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [me, setMeState] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [providers, setProviders] = useState<Providers>({ faceit: false, devLogin: false, discord: false });
  const [universities, setUniversities] = useState<ApiUniversity[]>([]);
  const [invites, setInvites] = useState<InviteItem[] | null>(null);

  const refreshInvites = useCallback(async () => {
    const data = await api.get<{ invites: InviteItem[] }>('/invites').catch(() => null);
    setInvites(data ? data.invites : []);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<MeResponse & { ok: true }>('/me');
      if (data && data.user) {
        setMeState({ user: data.user, team: data.team, studentCard: data.studentCard });
      } else {
        setMeState(null);
      }
      setOffline(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 0) setOffline(true);
      setMeState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    api
      .get<Providers & { ok: true }>('/auth/providers')
      .then(({ faceit, devLogin, discord }) => setProviders({ faceit, devLogin, discord }))
      .catch(() => undefined);
    api
      .get<{ universities: ApiUniversity[] }>('/universities')
      .then((d) => setUniversities(d.universities))
      .catch(() => undefined);
  }, [refresh]);

  const setMe = useCallback((data: MeResponse) => {
    if (data && data.user) {
      setMeState({ user: data.user, team: data.team, studentCard: data.studentCard });
    } else {
      setMeState(null);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => undefined);
    setMeState(null);
    setInvites(null);
  }, []);

  // Запрошення залежать від користувача і його команди
  const userId = me?.user?.id;
  const teamId = me?.team?.id;
  useEffect(() => {
    if (userId) refreshInvites();
  }, [userId, teamId, refreshInvites]);

  return (
    <AuthContext.Provider value={{ me, loading, offline, providers, universities, invites, refreshInvites, refresh, setMe, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
