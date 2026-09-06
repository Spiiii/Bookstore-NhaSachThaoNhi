import axios from 'axios';

export type ApiErrorCode =
  | 'REQUEST_CANCELLED'
  | 'NETWORK_ERROR'
  | 'REQUEST_TIMEOUT'
  | 'CLIENT_ERROR'
  | 'API_ERROR'
  | (string & {});

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly code: ApiErrorCode,
  ) {
    super(message);
    this.name = 'ApiClientError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

interface ErrorEnvelope {
  code?: unknown;
  message?: unknown;
}

function messageFrom(value: unknown, fallback: string): string {
  if (typeof value === 'string' && value.trim()) return value;
  if (Array.isArray(value)) {
    const messages = value.filter(
      (item): item is string => typeof item === 'string' && Boolean(item),
    );
    if (messages.length) return messages.join(', ');
  }
  return fallback;
}

export function normalizeApiError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error;
  if (!axios.isAxiosError(error)) {
    return new ApiClientError(
      error instanceof Error ? error.message : 'Unexpected client error',
      null,
      'CLIENT_ERROR',
    );
  }

  if (axios.isCancel(error)) {
    return new ApiClientError('Request was cancelled.', null, 'REQUEST_CANCELLED');
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiClientError('The API request timed out.', null, 'REQUEST_TIMEOUT');
  }
  if (!error.response) {
    return new ApiClientError('Unable to reach the API.', null, 'NETWORK_ERROR');
  }

  const data = error.response.data as ErrorEnvelope | undefined;
  return new ApiClientError(
    messageFrom(data?.message, 'API request failed.'),
    error.response.status,
    typeof data?.code === 'string' && data.code ? data.code : 'API_ERROR',
  );
}

export function isAuthenticationFailure(error: unknown): boolean {
  const normalized = normalizeApiError(error);
  return normalized.status === 401 || normalized.code === 'SESSION_REPLACED';
}

export function isAccessTokenExpired(error: unknown): boolean {
  return normalizeApiError(error).code === 'ACCESS_TOKEN_EXPIRED';
}

const SESSION_INVALIDATION_CODES = new Set([
  'SESSION_REPLACED',
  'SESSION_EXPIRED',
  'ACCESS_TOKEN_INVALID',
  'AUTH_REQUIRED',
  'REFRESH_TOKEN_INVALID',
  'REFRESH_REPLAYED',
]);

export function isSessionInvalidationError(error: unknown): boolean {
  return SESSION_INVALIDATION_CODES.has(normalizeApiError(error).code);
}
