'use client';

import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import { getAuthTransport, type ChangePasswordInput, type LoginInput } from '@/lib/auth/auth-transport.client';
import { AuthCoordinationUnavailableError, crossTabAuth } from '@/lib/auth/cross-tab.client';
import { refreshCoordinator } from '@/lib/auth/refresh-coordinator.client';
import { sessionStore, type SessionSnapshot } from '@/lib/auth/session-store.client';
import { isAuthenticationFailure, normalizeApiError } from '@/lib/http/normalize-error';
import { clearPrivateQueryState } from '@/lib/query/query-client';

interface AuthContextValue extends SessionSnapshot {
  login(input: LoginInput): Promise<void>;
  logout(): Promise<void>;
  refresh(): Promise<void>;
  changePassword(input: ChangePasswordInput): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(sessionStore.subscribe, sessionStore.getSnapshot, sessionStore.getServerSnapshot);
  const queryClient = useQueryClient();

  const loadProfile = useCallback(async (token: string) => {
    sessionStore.authenticate(await getAuthTransport().me(token));
  }, []);

  const refresh = useCallback(async () => {
    const token = await refreshCoordinator.refresh();
    await loadProfile(token);
  }, [loadProfile]);

  useEffect(() => {
    void refresh().catch((error: unknown) => {
      if (error instanceof AuthCoordinationUnavailableError) {
        sessionStore.clear('coordination-unavailable');
      } else if (error instanceof Error && error.message.includes('NEXT_PUBLIC_API_BASE_URL')) {
        sessionStore.fail('configuration');
      } else {
        sessionStore.clear('session-ended');
      }
    });
  }, [refresh]);

  useEffect(() => crossTabAuth.subscribe((event) => {
    if (event.type === 'session-refreshed') {
      sessionStore.installAccessToken(event.accessToken);
      void loadProfile(event.accessToken).catch(() => sessionStore.clear('session-ended'));
      return;
    }
    sessionStore.clear(event.type === 'session-cleared' ? 'signed-out' : 'session-ended');
    void clearPrivateQueryState(queryClient);
  }), [loadProfile, queryClient]);

  useEffect(
    () => sessionStore.onInvalidated(() => { void clearPrivateQueryState(queryClient); }),
    [queryClient],
  );

  const login = useCallback(async (input: LoginInput) => {
    await crossTabAuth.withSessionLock(async () => {
      const result = await getAuthTransport().login(input);
      sessionStore.installAccessToken(result.accessToken);
      await loadProfile(result.accessToken);
      await clearPrivateQueryState(queryClient);
      crossTabAuth.broadcast('session-replaced');
    }, false);
  }, [loadProfile, queryClient]);

  const logout = useCallback(async () => {
    const token = sessionStore.getAccessToken();
    try {
      await crossTabAuth.withSessionLock(() => getAuthTransport().logout(token), false);
      sessionStore.clear('signed-out');
      await clearPrivateQueryState(queryClient);
      crossTabAuth.broadcast('session-cleared');
    } catch (error) {
      const normalized = normalizeApiError(error);
      if (isAuthenticationFailure(normalized)) {
        sessionStore.clear('signed-out');
        await clearPrivateQueryState(queryClient);
        crossTabAuth.broadcast('session-cleared');
        return;
      }

      sessionStore.clear('logout-unconfirmed');
      await clearPrivateQueryState(queryClient);
      throw normalized;
    }
  }, [queryClient]);

  const changePassword = useCallback(async (input: ChangePasswordInput) => {
    const token = sessionStore.getAccessToken();
    if (!token) throw new Error('Authentication is required');
    await getAuthTransport().changePassword(token, input);
    sessionStore.clear('password-changed');
    await clearPrivateQueryState(queryClient);
    crossTabAuth.broadcast('session-cleared');
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => ({
    ...snapshot, login, logout, refresh, changePassword,
  }), [snapshot, login, logout, refresh, changePassword]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
