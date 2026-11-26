import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, tokenStore, UNAUTHORIZED_EVENT } from '@/api/client';
import type { Admin } from '@/api/types';
import { useToast } from '@/components/ui/Toast';

interface AuthState {
  admin: Admin | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState<boolean>(!!tokenStore.get());
  const qc = useQueryClient();
  const toast = useToast();

  const logout = useCallback(() => {
    tokenStore.clear();
    setAdmin(null);
    qc.clear();
  }, [qc]);

  // Restore the session on page load
  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .get<Admin>('/admin/auth/me')
      .then(setAdmin)
      .catch(() => {
        /* 401 is handled by the event below; network errors leave us signed out */
        if (!tokenStore.get()) setAdmin(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Auto sign-out on 401
  useEffect(() => {
    const handler = () => {
      setAdmin(null);
      qc.clear();
      toast.info('Your session has ended. Please sign in again.');
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handler);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handler);
  }, [qc, toast]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ token: string; admin: Admin }>('/admin/auth/login', { email, password });
    tokenStore.set(res.token);
    setAdmin(res.admin);
  }, []);

  const value = useMemo(() => ({ admin, loading, login, logout }), [admin, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
