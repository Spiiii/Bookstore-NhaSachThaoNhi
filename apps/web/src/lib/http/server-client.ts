import 'server-only';

import type { AxiosInstance } from 'axios';
import { normalizeApiError } from './normalize-error';
import { createTransport, normalizeApiBaseUrl } from './transport';

export function getServerApiBaseUrl(): string {
  return normalizeApiBaseUrl(process.env.API_BASE_URL ?? '', 'API_BASE_URL');
}

export function createServerClient(baseURL = getServerApiBaseUrl()): AxiosInstance {
  const client = createTransport({ baseURL });
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

