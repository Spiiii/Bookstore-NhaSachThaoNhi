import axios, { type AxiosInstance } from 'axios';

const DEFAULT_TIMEOUT_MS = 10_000;

export interface TransportOptions {
  baseURL: string;
  withCredentials?: boolean;
  timeoutMs?: number;
}

export function normalizeApiBaseUrl(value: string, variableName: string): string {
  const candidate = value.trim();
  if (!candidate) throw new Error(`${variableName} is required`);

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(`${variableName} must be an absolute HTTP(S) URL`);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`${variableName} must use HTTP or HTTPS`);
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error(`${variableName} must not contain credentials, query, or fragment`);
  }
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    throw new Error(`${variableName} must use HTTPS in production`);
  }

  return candidate.replace(/\/+$/, '');
}

export function createTransport({
  baseURL,
  withCredentials = false,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: TransportOptions): AxiosInstance {
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error('HTTP timeout must be a positive integer');
  }

  return axios.create({
    baseURL,
    timeout: timeoutMs,
    withCredentials,
    allowAbsoluteUrls: false,
    headers: { Accept: 'application/json' },
  });
}

export function getBrowserApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? '';
  if (/^\/(?!\/)[A-Za-z0-9/_-]*$/.test(raw)) return raw.replace(/\/+$/, '');
  return normalizeApiBaseUrl(raw, 'NEXT_PUBLIC_API_BASE_URL');
}

export function createBrowserTransport(baseURL = getBrowserApiBaseUrl()): AxiosInstance {
  return createTransport({ baseURL, withCredentials: true });
}
