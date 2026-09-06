import { type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { createHash, randomBytes } from 'node:crypto';
import { PasswordService } from '../../src/infrastructure/credentials/password.service';
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { SecurityTokenService } from '../../src/modules/security/services/security-token.service';
import { IdentityReaderService } from '../../src/modules/users/identity-reader.service';
import { UsersService } from '../../src/modules/users/users.service';
import type {
  PasswordReplacement,
  RefreshRotation,
  SessionExpectation,
  SessionReplacement,
} from '../../src/modules/users/types/admin-state.types';

describe('Auth HTTP orchestration', () => {
  const origin = 'https://bookstore.example.test';
  const email = 'admin@example.test';
  const password = 'correct horse battery staple';
  const settings = new ConfigService({
    JWT_ACCESS_SECRET: randomBytes(32).toString('base64'),
    JWT_REFRESH_SECRET: randomBytes(32).toString('base64'),
    JWT_ISSUER: 'auth-test',
    JWT_ACCESS_AUDIENCE: 'access',
    JWT_REFRESH_AUDIENCE: 'refresh',
    AUTH_ALLOWED_ORIGINS: origin,
    PASSWORD_ARGON2_MEMORY_COST: 19456,
    PASSWORD_ARGON2_TIME_COST: 2,
  });
  const passwords = new PasswordService(settings);
  const digest = (value: string) => createHash('sha256').update(value).digest('hex');
  let initialHash: string;
  let state: {
    id: string;
    email: string;
    displayName: string;
    role: 'ADMIN';
    passwordHash: string;
    authVersion: number;
    sessionId: string | null;
    sessionExpiresAt: Date | null;
    refreshGeneration: number;
    refreshTokenHash: string | null;
  };
  const users = {
    replaceSession: jest.fn(),
    rotateSession: jest.fn(),
    revokeSession: jest.fn(),
    replacePassword: jest.fn(),
  };
  const identities = { findLoginCredential: jest.fn(), readCurrentIdentity: jest.fn() };
  let app: INestApplication;
  let base: string;
  let tokens: SecurityTokenService;
  const matches = (expected: SessionExpectation) =>
    expected.adminId === state.id &&
    expected.sessionId === state.sessionId &&
    expected.authVersion === state.authVersion;
  const clear = () => {
    state.authVersion++;
    state.sessionId = null;
    state.sessionExpiresAt = null;
    state.refreshTokenHash = null;
    state.refreshGeneration = 0;
  };
  const updated = () => ({ status: 'updated', value: { ...state } });
  const cookie = (response: Response) => response.headers.get('set-cookie')!.split(';')[0]!;
  const request = (
    route: string,
    body?: unknown,
    cookieValue?: string,
    access?: string,
    source = origin,
  ) =>
    fetch(base + route, {
      method: route === '/me' ? 'GET' : 'POST',
      headers: {
        Origin: source,
        'Content-Type': 'application/json',
        ...(cookieValue ? { Cookie: cookieValue } : {}),
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const login = () => request('/login', { email, password });

  beforeAll(async () => {
    initialHash = await passwords.hash(password);
  });
  beforeEach(async () => {
    jest.resetAllMocks();
    state = {
      id: '11111111-1111-4111-8111-111111111111',
      email,
      displayName: 'Admin',
      role: 'ADMIN',
      passwordHash: initialHash,
      authVersion: 0,
      sessionId: null,
      sessionExpiresAt: null,
      refreshGeneration: 0,
      refreshTokenHash: null,
    };
    identities.findLoginCredential.mockImplementation(async (input: string) =>
      input.trim().toLowerCase() === email
        ? {
            id: state.id,
            role: state.role,
            authVersion: state.authVersion,
            passwordHash: state.passwordHash,
          }
        : null,
    );
    identities.readCurrentIdentity.mockImplementation(async () => ({ ...state }));
    users.replaceSession.mockImplementation(async (input: SessionReplacement) => {
      if (
        input.expected.authVersion !== state.authVersion ||
        input.expected.passwordHash !== state.passwordHash
      )
        return { status: 'stale' };
      state.authVersion++;
      state.sessionId = input.sessionId;
      state.sessionExpiresAt = input.sessionExpiresAt;
      state.refreshTokenHash = input.refreshTokenHash;
      state.refreshGeneration = 0;
      return updated();
    });
    users.rotateSession.mockImplementation(async (input: RefreshRotation) => {
      if (!matches(input.expected)) return { status: 'stale' };
      if (input.refreshGeneration < state.refreshGeneration) {
        clear();
        return { status: 'replayed' };
      }
      if (
        input.refreshTokenHash !== state.refreshTokenHash ||
        input.refreshGeneration !== state.refreshGeneration
      )
        return { status: 'stale' };
      state.refreshGeneration++;
      state.refreshTokenHash = input.nextRefreshTokenHash;
      return updated();
    });
    users.revokeSession.mockImplementation(async (expected: SessionExpectation) => {
      if (!matches(expected)) return { status: 'unchanged' };
      clear();
      return updated();
    });
    users.replacePassword.mockImplementation(async (input: PasswordReplacement) => {
      if (!matches(input.expected) || input.expectedPasswordHash !== state.passwordHash)
        return { status: 'stale' };
      state.passwordHash = input.newPasswordHash;
      clear();
      return updated();
    });
    const module = await Test.createTestingModule({ imports: [AuthModule] })
      .overrideProvider(ConfigService)
      .useValue(settings)
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(IdentityReaderService)
      .useValue(identities)
      .overrideProvider(UsersService)
      .useValue(users)
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    await app.listen(0, '127.0.0.1');
    base = `${await app.getUrl()}/auth`;
    tokens = app.get(SecurityTokenService);
  });
  afterEach(async () => {
    jest.restoreAllMocks();
    await app?.close();
  });

  it('login commits digest-only state, sets secure cookie, and me exposes only profile', async () => {
    const response = await login();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('set-cookie')).toEqual(
      expect.stringContaining('HttpOnly; Secure; SameSite=Strict'),
    );
    expect(response.headers.get('set-cookie')).toEqual(expect.stringContaining('Path=/auth'));
    const body = (await response.json()) as { accessToken: string; tokenType: string };
    expect(Object.keys(body).sort()).toEqual(['accessToken', 'tokenType']);
    expect(state.refreshTokenHash).toBe(digest(cookie(response).split('=')[1]!));
    const me = await request('/me', undefined, undefined, body.accessToken);
    expect(me.status).toBe(200);
    expect(await me.json()).toEqual({ id: state.id, email, displayName: 'Admin', role: 'ADMIN' });
  });

  it('new login immediately rejects the old access token', async () => {
    const first = (await (await login()).json()) as { accessToken: string };
    expect((await login()).status).toBe(200);
    expect((await request('/me', undefined, undefined, first.accessToken)).status).toBe(401);
  });

  it('rotates refresh once without extending expiry; replay commits revocation', async () => {
    const first = await login();
    const expiry = state.sessionExpiresAt!.getTime();
    const refreshed = await request('/refresh', undefined, cookie(first));
    expect(refreshed.status).toBe(200);
    expect(cookie(refreshed)).not.toBe(cookie(first));
    expect(state.refreshGeneration).toBe(1);
    expect(state.sessionExpiresAt!.getTime()).toBe(expiry);
    const claims = await tokens.verifyRefresh(cookie(refreshed).split('=')[1]!);
    expect(claims.exp * 1000).toBe(expiry);
    const replay = await request('/refresh', undefined, cookie(first));
    expect(replay.status).toBe(401);
    expect(((await replay.json()) as { code: string }).code).toBe('REFRESH_REPLAYED');
    expect(state.sessionId).toBeNull();
    expect(replay.headers.get('set-cookie')).toContain('Expires=Thu, 01 Jan 1970');
    const access = ((await refreshed.json()) as { accessToken: string }).accessToken;
    expect((await request('/me', undefined, undefined, access)).status).toBe(401);
  });

  it('logout is idempotent and an old session cannot revoke a new login', async () => {
    const old = await login();
    const current = await login();
    const sid = state.sessionId;
    expect((await request('/logout', undefined, cookie(old))).status).toBe(204);
    expect(state.sessionId).toBe(sid);
    expect((await request('/logout', undefined, cookie(current))).status).toBe(204);
    expect(state.sessionId).toBeNull();
    expect((await request('/logout', undefined, cookie(current))).status).toBe(204);
    expect((await request('/logout')).status).toBe(204);
  });

  it('supports access-token logout without a cookie', async () => {
    const { accessToken } = (await (await login()).json()) as { accessToken: string };
    expect((await request('/logout', undefined, undefined, accessToken)).status).toBe(204);
    expect(state.sessionId).toBeNull();
  });

  it('falls back to a valid access token when the refresh cookie has an invalid signature', async () => {
    const { accessToken } = (await (await login()).json()) as { accessToken: string };
    expect(
      (
        await request(
          '/logout',
          undefined,
          '__Secure-bookstore-refresh=invalid.jwt.token',
          accessToken,
        )
      ).status,
    ).toBe(204);
    expect(users.revokeSession).toHaveBeenCalledTimes(1);
    expect(state.sessionId).toBeNull();
    expect((await request('/me', undefined, undefined, accessToken)).status).toBe(401);
  });

  it('does not hide persistence failures behind logout fallback', async () => {
    const first = await login();
    const { accessToken } = (await first.json()) as { accessToken: string };
    users.revokeSession.mockRejectedValueOnce(new Error('database unavailable'));
    const response = await request('/logout', undefined, cookie(first), accessToken);
    expect(response.status).toBe(500);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(users.revokeSession).toHaveBeenCalledTimes(1);
  });

  it('changes password with re-verification and forces sign-in again', async () => {
    const first = await login();
    const { accessToken } = (await first.json()) as { accessToken: string };
    const newPassword = 'another long secret password';
    const changed = await request(
      '/change-password',
      { currentPassword: password, newPassword },
      cookie(first),
      accessToken,
    );
    expect(changed.status).toBe(204);
    expect(changed.headers.get('set-cookie')).toContain('Expires=Thu, 01 Jan 1970');
    expect(await passwords.verify(newPassword, state.passwordHash)).toBe(true);
    expect(state.sessionId).toBeNull();
    expect((await request('/me', undefined, undefined, accessToken)).status).toBe(401);
    expect((await login()).status).toBe(401);
    expect((await request('/login', { email, password: newPassword })).status).toBe(200);
  });

  it('rejects wrong current password without changing state', async () => {
    const { accessToken } = (await (await login()).json()) as { accessToken: string };
    const response = await request(
      '/change-password',
      { currentPassword: 'wrong', newPassword: 'another long secret password' },
      undefined,
      accessToken,
    );
    expect(response.status).toBe(401);
    expect(users.replacePassword).not.toHaveBeenCalled();
    expect(state.passwordHash).toBe(initialHash);
  });

  it('uses generic errors and real dummy verification for an unknown account', async () => {
    const verify = jest.spyOn(app.get(PasswordService), 'verify');
    const unknown = await request('/login', { email: 'unknown@example.test', password });
    const wrong = await request('/login', { email, password: 'wrong' });
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(await unknown.json()).toEqual(await wrong.json());
    expect(verify).toHaveBeenCalledTimes(2);
    expect(verify.mock.calls[0]![1]).toMatch(/^\$argon2id\$/);
    expect(users.replaceSession).not.toHaveBeenCalled();
  });

  it('rejects missing/untrusted Origin before any login work', async () => {
    expect(
      (await request('/login', { email, password }, undefined, undefined, 'https://evil.test'))
        .status,
    ).toBe(403);
    const missing = await fetch(base + '/login', { method: 'POST' });
    expect(missing.status).toBe(403);
    expect(identities.findLoginCredential).not.toHaveBeenCalled();
  });

  it('validates DTOs locally, rejecting extra fields and oversized UTF-8 passwords', async () => {
    expect((await request('/login', { email, password, role: 'ADMIN' })).status).toBe(400);
    expect((await request('/login', { email, password: '😀'.repeat(300) })).status).toBe(400);
    expect((await request('/login', { email: 'invalid', password })).status).toBe(400);
    expect(identities.findLoginCredential).not.toHaveBeenCalled();
  });

  it('rate-limits login before further password verification', async () => {
    for (let i = 0; i < 5; i++)
      expect((await request('/login', { email, password: 'wrong' })).status).toBe(401);
    const response = await login();
    expect(response.status).toBe(429);
    expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(identities.findLoginCredential).toHaveBeenCalledTimes(5);
  });

  it('does not issue tokens/cookies when a login commit fails or becomes stale', async () => {
    users.replaceSession.mockResolvedValueOnce({ status: 'stale' });
    const stale = await login();
    expect(stale.status).toBe(401);
    expect(stale.headers.get('set-cookie')).toBeNull();
    users.replaceSession.mockRejectedValueOnce(new Error('database unavailable'));
    const failed = await login();
    expect(failed.status).toBe(500);
    expect(failed.headers.get('set-cookie')).toBeNull();
    expect(JSON.stringify(await failed.json())).not.toContain('database unavailable');
  });

  it('does not write session state if signing fails', async () => {
    jest.spyOn(tokens, 'signRefresh').mockRejectedValueOnce(new Error('signing unavailable'));
    expect((await login()).status).toBe(500);
    expect(users.replaceSession).not.toHaveBeenCalled();
  });

  it('never rotates from a body token or an access token in the refresh cookie', async () => {
    const { accessToken } = (await (await login()).json()) as { accessToken: string };
    expect((await request('/refresh', { refreshToken: accessToken })).status).toBe(401);
    expect(
      (await request('/refresh', undefined, `__Secure-bookstore-refresh=${accessToken}`)).status,
    ).toBe(401);
    expect(users.rotateSession).not.toHaveBeenCalled();
  });

  it('fails closed on refresh persistence failure without clearing a potentially valid cookie', async () => {
    const first = await login();
    users.rotateSession.mockRejectedValueOnce(new Error('database unavailable'));
    const response = await request('/refresh', undefined, cookie(first));
    expect(response.status).toBe(500);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('has no register endpoint and protects me/change-password', async () => {
    expect((await request('/register', { email, password })).status).toBe(404);
    expect((await request('/me')).status).toBe(401);
    expect(
      (await request('/change-password', { currentPassword: password, newPassword: password }))
        .status,
    ).toBe(401);
  });
});
