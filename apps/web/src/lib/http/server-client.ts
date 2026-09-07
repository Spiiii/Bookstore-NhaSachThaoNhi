import 'server-only';

import type { AxiosInstance } from 'axios';
import { normalizeApiError } from './normalize-error';
import { createTransport, normalizeApiBaseUrl } from './transport';

const DEFAULT_SERVER_TIMEOUT_MS = 75_000;

export function getServerApiBaseUrl(): string {
  return normalizeApiBaseUrl(process.env.API_BASE_URL ?? '', 'API_BASE_URL');
}

export function getServerApiTimeoutMs(): number {
  const raw = process.env.API_SERVER_TIMEOUT_MS?.trim();
  if (!raw) return DEFAULT_SERVER_TIMEOUT_MS;
  const timeout = Number(raw);
  if (!Number.isSafeInteger(timeout) || timeout < 1_000 || timeout > 120_000) {
    throw new Error('API_SERVER_TIMEOUT_MS must be an integer between 1000 and 120000.');
  }
  return timeout;
}

export function createServerClient(
  baseURL = getServerApiBaseUrl(),
  timeoutMs = getServerApiTimeoutMs(),
): AxiosInstance {
  const client = createTransport({ baseURL, timeoutMs });
  client.interceptors.response.use(
    (response) => response,
    (error: unknown) => Promise.reject(normalizeApiError(error)),
  );
  return client;
}

let singleton: AxiosInstance | undefined;

export function getServerClient(): AxiosInstance {
  return (singleton ??= createServerClient());
}
