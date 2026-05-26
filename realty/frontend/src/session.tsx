import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setToken, getToken, setReauth } from './api';
import { getInitData, tg } from './tg';
import type { Session } from './types';

type Ctx = {
  session: Session | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const SessionCtx = createContext<Ctx>({
  session: null,
  loading: true,
  error: null,
  refresh: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const initData = getInitData();
      if (!initData) {
        // Local dev: no Telegram context. Allow anonymous browsing.
        if (getToken()) {
          // Try existing token via /me
          try {
            const me = await api.me();
            const fakeSession: Session = {
              token: getToken()!,
              user: {
                role: me.role,
                tgId: '0',
                agentId: me.role === 'realtor' ? me.profile.id : undefined,
                clientId: me.role === 'client' ? me.profile.id : undefined,
              },
            };
            setSession(fakeSession);
          } catch {
            setSession(null);
          }
        } else {
          setSession(null);
        }
        return;
      }
      const s = await api.login(initData);
      setToken(s.token);
      setSession(s);
    } catch (e: any) {
      setError(e.message ?? 'login_failed');
      setSession(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // Silent re-login hook for the API client — if a request returns 401, the
    // client calls this to mint a fresh JWT from Telegram initData and retries.
    setReauth(async () => {
      const initData = getInitData();
      if (!initData) return null;
      try {
        const s = await api.login(initData);
        setToken(s.token);
        setSession(s);
        return s.token;
      } catch {
        return null;
      }
    });
    return () => setReauth(null);
  }, []);

  return (
    <SessionCtx.Provider value={{ session, loading, error, refresh }}>
      {children}
    </SessionCtx.Provider>
  );
}

export function useSession() {
  return useContext(SessionCtx);
}

export function applyTelegramTheme() {
  // Design is always light cream — ignore Telegram's color scheme.
  document.body.classList.remove('tg-dark');
}
