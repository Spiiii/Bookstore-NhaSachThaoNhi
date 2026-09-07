import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { ApiClientError, isSessionInvalidationError, normalizeApiError } from './normalize-error';
import { createTransport, getBrowserApiBaseUrl, normalizeApiBaseUrl } from './transport';

describe('HTTP transport', () => {
  it('rejects unsafe base URLs', () => {
    expect(() => normalizeApiBaseUrl('https://user:secret@example.com/api', 'API_URL')).toThrow();
    expect(() => normalizeApiBaseUrl('file:///tmp/api', 'API_URL')).toThrow();
  });

  it('prevents absolute request URLs from replacing the configured API origin', async () => {
    const adapter = vi.fn().mockResolvedValue({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    });
    const client = createTransport({ baseURL: 'https://api.example.com', timeoutMs: 1_000 });
    client.defaults.adapter = adapter;
    await client.get('https://untrusted.example/path');
    expect(client.defaults.allowAbsoluteUrls).toBe(false);
  });

  it('accepts a same-origin browser API path', () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', '/api');
    expect(getBrowserApiBaseUrl()).toBe('/api');
    vi.unstubAllEnvs();
  });
});

describe('normalizeApiError', () => {
  it('keeps the API status, code, and validation messages', () => {
    const source = new axios.AxiosError('failed', 'ERR_BAD_REQUEST', undefined, undefined, {
      data: { code: 'VALIDATION_FAILED', message: ['email is invalid', 'password is required'] },
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: { headers: new axios.AxiosHeaders() },
    });
    expect(normalizeApiError(source)).toEqual(
      new ApiClientError('email is invalid, password is required', 400, 'VALIDATION_FAILED'),
    );
  });

  it('uses a stable code for network errors without exposing request details', () => {
    const source = new axios.AxiosError('getaddrinfo ENOTFOUND secret-host');
    expect(normalizeApiError(source)).toMatchObject({
      message: 'Unable to reach the API.',
      status: null,
      code: 'NETWORK_ERROR',
    });
  });

  it.each(['SESSION_REPLACED', 'SESSION_EXPIRED', 'ACCESS_TOKEN_INVALID', 'AUTH_REQUIRED'])(
    'recognizes %s as session invalidation',
    (code) => expect(isSessionInvalidationError(new ApiClientError('ended', 401, code))).toBe(true),
  );

  it('does not invalidate a session for an expired access token', () => {
    expect(
      isSessionInvalidationError(new ApiClientError('expired', 401, 'ACCESS_TOKEN_EXPIRED')),
    ).toBe(false);
  });
});
