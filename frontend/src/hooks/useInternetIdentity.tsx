/**
 * Local auth context (replaces ICP Internet Identity).
 * Stores role + teamName after login; restores from /api/me on load.
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../api/client';

type Identity = { role: 'admin' | 'screen' | 'team'; teamName?: string };

type AuthContextType = {
  identity: Identity | null;
  loginStatus: 'idle' | 'loading' | 'logging-in';
  login: (panelType: 'admin' | 'screen' | 'team', id: string, password: string, teamName?: string) => Promise<void>;
  clear: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function InternetIdentityProvider({ children }: { children: React.ReactNode }) {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loginStatus, setLoginStatus] = useState<'idle' | 'loading' | 'logging-in'>('loading');

  const loadMe = useCallback(async () => {
    try {
      const r = await api.getMe();
      if (r.user) {
        setIdentity({
          role: r.user.role as 'admin' | 'screen' | 'team',
          teamName: r.user.teamName,
        });
      } else {
        setIdentity(null);
      }
    } catch {
      setIdentity(null);
    } finally {
      setLoginStatus('idle');
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  const login = useCallback(
    async (panelType: 'admin' | 'screen' | 'team', id: string, password: string, teamName?: string) => {
      setLoginStatus('logging-in');
      try {
        const r = await api.login(panelType, id, password, teamName);
        setIdentity({
          role: r.role as 'admin' | 'screen' | 'team',
          teamName: r.teamName,
        });
      } finally {
        setLoginStatus('idle');
      }
    },
    []
  );

  const clear = useCallback(async () => {
    try {
      await api.logout();
    } catch {}
    setIdentity(null);
  }, []);

  return (
    <AuthContext.Provider value={{ identity, loginStatus, login, clear }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useInternetIdentity(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useInternetIdentity must be used within InternetIdentityProvider');
  return ctx;
}
