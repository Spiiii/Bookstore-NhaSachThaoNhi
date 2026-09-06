'use client';

import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { crossTabAuth } from '@/lib/auth/cross-tab.client';
import { refreshCoordinator } from '@/lib/auth/refresh-coordinator.client';
import { sessionStore } from '@/lib/auth/session-store.client';
import { isSessionInvalidationError, normalizeApiError } from './normalize-error';
import { createBrowserTransport } from './transport';

type RetryConfig = InternalAxiosRequestConfig & { _bookstoreAuthRetry?: boolean };
const SAFE_METHODS = new Set(['get', 'head', 'options']);
const configuredClients = new WeakSet<AxiosInstance>();

export function attachAuthentication(http: AxiosInstance): AxiosInstance {
  if (configuredClients.has(http)) return http;
  configuredClients.add(http);

  http.interceptors.request.use((config) => {
    const token = sessionStore.getAccessToken();
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
    else config.headers.delete('Authorization');
    return config;
  });

  http.interceptors.response.use(undefined, async (error: AxiosError) => {
    const normalized = normalizeApiError(error);
    const config = error.config as RetryConfig | undefined;
    const method = config?.method?.toLowerCase() ?? '';

    if (isSessionInvalidationError(normalized)) {
      sessionStore.clear('session-ended');
      crossTabAuth.broadcast('session-cleared');
    }

    if (
      normalized.code !== 'ACCESS_TOKEN_EXPIRED' ||
      !config ||
      config._bookstoreAuthRetry ||
      !SAFE_METHODS.has(method)
    ) {
      throw normalized;
    }

    config._bookstoreAuthRetry = true;
    const token = await refreshCoordinator.refresh();
    config.headers.set('Authorization', `Bearer ${token}`);
    return http.request(config);
  });

  return http;
}

let singleton: AxiosInstance | undefined;

export function getBrowserClient(): AxiosInstance {
  return (singleton ??= attachAuthentication(createBrowserTransport()));
}
